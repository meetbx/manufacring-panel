// manufacturer-panel/src/app/api/onboarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedManufacturer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const onboardingSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters long"),
  description: z.string().optional().nullable().transform(val => val?.trim() ? val : undefined),
  phone: z.string().min(10, "Please enter a valid 10-digit phone number"),
  gstNumber: z.string().optional().nullable().transform(val => val?.trim() ? val : undefined),
  
  // Custom user-friendly error messages for inputs
  addressLine: z.string().min(5, "Address line is too short (minimum 5 characters required)"),
  city: z.string().min(2, "City name is too short or required"),
  pincode: z.string().min(6, "Invalid pincode (must be at least 6 digits)"),
  locationId: z.string().min(1, "Please select a valid state location"),
  
  // Handle optional numbers & empty form inputs cleanly
  yearEstablished: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().min(1800, "Invalid establishment year").max(new Date().getFullYear(), "Year cannot be in the future").optional()
  ),
  factoryAreaSqFt: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().positive("Factory area must be a positive number").optional()
  ),

  annualTurnover: z.string().optional().nullable().transform(val => val?.trim() ? val : undefined),
  
  // Handle optional URLs safely
  logo: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().url("Please provide a valid URL for the company logo").optional()
  ),
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
      console.error("=== ZOD VALIDATION FAILED ===");
      console.error(JSON.stringify(error.errors, null, 2));

      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("[ONBOARDING_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to initialize company profile" }, { status: 500 });
  }
}