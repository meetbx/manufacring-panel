import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, phone } = parsed.data;
    const lowerEmail = email.toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: lowerEmail }, ...(phone ? [{ phone }] : [])] },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email or phone already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email: lowerEmail,
        phone,
        passwordHash,
        role: "MANUFACTURER",
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json({ error: "Failed to create manufacturer account" }, { status: 500 });
  }
}