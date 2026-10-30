import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedManufacturer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const companyUpdateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  gstNumber: z.string().optional(),
  addressLine: z.string().min(5),
  city: z.string().min(2),
  pincode: z.string().min(6),
  yearEstablished: z.number().optional(),
  factoryAreaSqFt: z.number().optional(),
  annualTurnover: z.string().optional(),
  logo: z.string().url().optional(),
  bannerImage: z.string().url().optional(),
});

export async function GET() {
  const auth = await getAuthenticatedManufacturer();
  if (auth.error || !auth.manufacturerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const company = await prisma.manufacturer.findUnique({
    where: { id: auth.manufacturerId },
    include: { location: true },
  });

  return NextResponse.json({ success: true, data: company });
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthenticatedManufacturer();
  if (auth.error || !auth.manufacturerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = companyUpdateSchema.parse(body);

    const updated = await prisma.manufacturer.update({
      where: { id: auth.manufacturerId },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 400 });
  }
}