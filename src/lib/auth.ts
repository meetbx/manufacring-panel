// manufacturer-panel/src/lib/auth.ts
import { getServerSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { comparePasswords } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  cookies: {
    sessionToken: {
      name: `next-auth.manufacturer-session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("=== DEBUG LOGIN ===");
        console.log("Input Email:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("Error: Missing email or password");
          throw new Error("Missing email or password");
        }

        const email = credentials.email.toLowerCase().trim();

        // 1. Fetch user from database
        const user = await prisma.user.findUnique({
          where: { email },
        });

        console.log("User found in DB:", user ? "YES" : "NO");
        if (user) {
          console.log("User Role in DB:", user.role);
          console.log("Has passwordHash:", !!user.passwordHash);
        }

        if (!user || !user.passwordHash) {
          console.log("Error: User not found or passwordHash missing");
          throw new Error("Invalid credentials");
        }

        // 2. Verify hashed password
        const isValid = await comparePasswords(credentials.password, user.passwordHash);
        console.log("Password match:", isValid ? "YES" : "NO");

        if (!isValid) {
          console.log("Error: Password comparison failed");
          throw new Error("Invalid credentials");
        }

        // 3. Verify user role
        if (user.role !== "MANUFACTURER" && user.role !== "ADMIN") {
          console.log("Error: Restricted role ->", user.role);
          throw new Error("Access restricted to registered manufacturer accounts");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Refresh manufacturer context on token update
      if (token.id) {
        const membership = await prisma.manufacturerMember.findFirst({
          where: { userId: token.id as string },
          select: { manufacturerId: true, role: true },
        });
        token.manufacturerId = membership?.manufacturerId || null;
        token.memberRole = membership?.role || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.manufacturerId = token.manufacturerId as string | null;
        session.user.memberRole = token.memberRole as string | null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getAuthenticatedManufacturer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "UNAUTHORIZED", status: 401, session: null };
  }

  if (session.user.role !== "MANUFACTURER" && session.user.role !== "ADMIN") {
    return { error: "FORBIDDEN", status: 403, session: null };
  }

  return {
    error: null,
    status: 200,
    session,
    userId: session.user.id,
    manufacturerId: session.user.manufacturerId,
  };
}