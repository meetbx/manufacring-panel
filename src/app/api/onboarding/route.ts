// manufacturer-panel/src/app/api/onboarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedManufacturer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const onboardingSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  description: z.string().min(20, "Please provide a description of at least 20 characters").optional(),
  phone: z.string().min(10, "Valid phone number is required"), // <-- Added phone validation
  gstNumber: z.string().optional(),
  addressLine: z.string().min(5, "Address line is required"),
  city: z.string().min(2, "City is required"),
  pincode: z.string().min(6, "Valid Pincode is required"),
  locationId: z.string().min(1, "State location selection is required"),
  yearEstablished: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  factoryAreaSqFt: z.number().int().positive().optional(),
  annualTurnover: z.string().optional(),
  logo: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedManufacturer();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (auth.manufacturerId) {
      return NextResponse.json({ error: "Company profile already initialized" }, { status: 400 });
    }

    const body = await req.json();
    const data = onboardingSchema.parse(body);

    const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    const result = await prisma.$transaction(async (tx) => {
      const manufacturer = await tx.manufacturer.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          phone: data.phone,
          gstNumber: data.gstNumber,
          addressLine: data.addressLine,
          city: data.city,
          pincode: data.pincode,
          locationId: data.locationId,
          yearEstablished: data.yearEstablished,
          factoryAreaSqFt: data.factoryAreaSqFt,
          annualTurnover: data.annualTurnover,
          logo: data.logo,
          
        },
      });

      await tx.manufacturerMember.create({
        data: {
          userId: auth.userId!,
          manufacturerId: manufacturer.id,
          role: "OWNER",
          
        },
      });

      return manufacturer;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("[ONBOARDING_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to initialize company profile" }, { status: 500 });
  }
}