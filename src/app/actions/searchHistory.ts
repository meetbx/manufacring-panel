"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth"; // Adapt if using a custom auth setup
import { revalidatePath } from "next/cache";

export async function saveSearchQuery(query: string) {
  if (!query || query.trim().length === 0) return;
  
  const session = await getServerSession();
  if (!session?.user?.email) return;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) return;

  // Prevent duplicate consecutive entries
  await prisma.searchHistory.deleteMany({
    where: {
      userId: user.id,
      query: query.trim(),
    },
  });

  await prisma.searchHistory.create({
    data: {
      userId: user.id,
      query: query.trim(),
    },
  });

  revalidatePath("/search");
}

export async function deleteSearchQuery(id: string) {
  const session = await getServerSession();
  if (!session?.user?.email) return;

  await prisma.searchHistory.delete({
    where: { id },
  });

  revalidatePath("/search");
}

export async function clearAllSearchHistory() {
  const session = await getServerSession();
  if (!session?.user?.email) return;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) return;

  await prisma.searchHistory.deleteMany({
    where: { userId: user.id },
  });

  revalidatePath("/search");
}