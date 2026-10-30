// manufacturer-panel/src/app/api/products/[id]/publish/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedManufacturer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedManufacturer();
    if (auth.error || !auth.manufacturerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productId = params.id;

    // Verify ownership
    const existing = await prisma.product.findFirst({
      where: { id: productId, manufacturerId: auth.manufacturerId },
      select: { id: true, isPublished: true, name: true, minPrice: true, images: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found or access denied" }, { status: 404 });
    }

    const body = await req.json();
    const targetState = typeof body.isPublished === "boolean" ? body.isPublished : !existing.isPublished;

    // Validation before publishing
    if (targetState === true) {
      if (!existing.name || existing.minPrice <= 0 || existing.images.length === 0) {
        return NextResponse.json(
          { error: "Cannot publish incomplete product. Name, minimum price, and at least 1 image are required." },
          { status: 422 }
        );
      }
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isPublished: targetState },
    });

    return NextResponse.json({
      success: true,
      data: { id: updated.id, isPublished: updated.isPublished },
    });
  } catch (error) {
    console.error("[PRODUCT_PUBLISH_TOGGLE]", error);
    return NextResponse.json({ error: "Failed to update publication status" }, { status: 500 });
  }
}