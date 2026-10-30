"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary (Make sure env variables are set in your .env)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to reliably fetch user regardless of login method (ID, Email, or Phone)
async function getResolvedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const sessionUser = session.user as { id?: string; email?: string; phone?: string };

  if (sessionUser.id) {
    const user = await prisma.user.findUnique({ where: { id: sessionUser.id }, include: { manufacturerMemberships: true } });
    if (user) return user;
  }

  if (sessionUser.email) {
    const user = await prisma.user.findUnique({ where: { email: sessionUser.email }, include: { manufacturerMemberships: true } });
    if (user) return user;
  }

  if (sessionUser.phone) {
    const user = await prisma.user.findUnique({ where: { phone: sessionUser.phone }, include: { manufacturerMemberships: true } });
    if (user) return user;
  }

  return null;
}

export async function getBuyerConversations() {
  const user = await getResolvedUser();
  if (!user) return [];

  return await prisma.conversation.findMany({
    where: { buyerId: user.id },
    include: {
      manufacturer: true,
      messages: { 
        orderBy: { createdAt: "desc" }, 
        take: 1,
        include: { attachments: true } // <-- Added to show attachment previews in sidebar
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });
}

export async function getManufacturerConversations() {
  const user = await getResolvedUser();
  console.log("👤 [Server Action] Resolved User:", user?.id);

  if (!user) {
    console.error("❌ [Server Action] No valid user found!");
    return [];
  }

  const memberships = await prisma.manufacturerMember.findMany({
    where: { userId: user.id },
    select: { manufacturerId: true, role: true },
  });

  console.log("🏢 [Server Action] Found memberships:", memberships);
  const manufacturerIds = memberships.map((m) => m.manufacturerId);

  if (manufacturerIds.length === 0) {
    console.warn("⚠️ [Server Action] User is NOT linked to any Manufacturer in ManufacturerMember table!");
    return [];
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      manufacturerId: { in: manufacturerIds },
    },
    include: {
      buyer: {
        select: { id: true, name: true, image: true, phone: true, email: true },
      },
      product: {
        select: { id: true, name: true, images: true, minPrice: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { attachments: true }, // <-- Added to show attachment previews in manufacturer sidebar
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  console.log(`✅ [Server Action] Found ${conversations.length} conversation(s).`);
  return conversations;
}

export async function getConversationMessages(conversationId: string) {
  const user = await getResolvedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { attachments: true }, // <-- Crucial: loads images and PDFs in the chat window
      },
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return {
    messages: conversation.messages,
    currentUserId: user.id,
  };
}

export async function saveServerMessage(conversationId: string, content: string) {
  const user = await getResolvedUser();
  if (!user) throw new Error("Unauthorized");

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) throw new Error("Conversation not found");

  const isBuyer = conversation.buyerId === user.id;
  const isManufacturerMember = user.manufacturerMemberships.some(
    (m) => m.manufacturerId === conversation.manufacturerId
  );

  if (!isBuyer && !isManufacturerMember) throw new Error("Forbidden");
  if (!content || content.trim().length === 0) throw new Error("Empty message");

  const savedMessage = await prisma.message.create({
    data: {
      conversation: { connect: { id: conversationId } },
      sender: { connect: { id: user.id } },
      content: content.trim(),
    },
    include: { attachments: true },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  revalidatePath(`/messages`);
  revalidatePath(`/manufacturer/messages`);
  return savedMessage;
}

// NEW: Server action to handle file uploads (images & PDFs) via Cloudinary
export async function sendMediaMessage(conversationId: string, formData: FormData) {
  const user = await getResolvedUser();
  if (!user) throw new Error("Unauthorized");

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) throw new Error("Conversation not found");

  const isBuyer = conversation.buyerId === user.id;
  const isManufacturerMember = user.manufacturerMemberships.some(
    (m) => m.manufacturerId === conversation.manufacturerId
  );

  if (!isBuyer && !isManufacturerMember) throw new Error("Forbidden");

  const content = (formData.get("content") as string) || "";
  const files = formData.getAll("files") as File[];

  if (!content.trim() && files.length === 0) {
    throw new Error("Message cannot be empty");
  }

  const attachmentData: any[] = [];

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const resourceType = isPdf ? "raw" : "image";

    // Upload to Cloudinary stream/buffer helper
    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "indiaorigin_chat_attachments",
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    attachmentData.push({
      fileUrl: uploadResult.secure_url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
      type: isPdf ? "PDF" : "IMAGE",
    });
  }

  const savedMessage = await prisma.message.create({
    data: {
      conversation: { connect: { id: conversationId } },
      sender: { connect: { id: user.id } },
      content: content.trim(), // Safe empty string or text payload
      attachments: {
        create: attachmentData,
      },
    },
    include: {
      attachments: true,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  revalidatePath(`/messages`);
  revalidatePath(`/manufacturer/messages`);
  return savedMessage;
}