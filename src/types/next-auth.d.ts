
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      manufacturerId: string | null;
      memberRole: string | null;
    } & NonNullable<DefaultSession["user"]>;
  }

  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    manufacturerId?: string | null;
    memberRole?: string | null;
  }
}

export {};
