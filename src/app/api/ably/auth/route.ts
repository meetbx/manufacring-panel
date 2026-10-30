import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import * as Ably from "ably";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let clientId = session.user.email;

    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) {
        clientId = user.id;
      }
    } catch (dbErr) {
      console.warn("Neon DB lookup warning during Ably auth, falling back to email:", dbErr);
    }

    const ablyKey = process.env.ABLY_API_KEY;
    if (!ablyKey) {
      return NextResponse.json({ error: "Missing Ably API Key" }, { status: 500 });
    }

    const rest = new Ably.Rest(ablyKey);

    const tokenRequest = await new Promise((resolve, reject) => {
      rest.auth.createTokenRequest({ clientId }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });

    return NextResponse.json(tokenRequest);
  } catch (err: any) {
    console.error("Ably auth error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}