// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

declare global {
  // Prevent multiple instances of Prisma Client in development
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// 1. Instantiates or reuses the global instance
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

// 2. Default export ensures compatibility with 'import prisma from "@/lib/prisma"'
export default prisma;