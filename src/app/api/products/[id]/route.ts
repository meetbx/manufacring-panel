import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();

    // Comprehensive update handling every field from the Edit Product form
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        categoryId: body.categoryId,
        hsCode: body.hsCode || null,
        
        // Single base price synchronization (maps to both fields cleanly)
        minPrice: Number(body.minPrice),
        maxPrice: Number(body.minPrice),
        
        moq: Number(body.moq) || 1,
        unit: body.unit || "Piece",
        leadTimeDays: Number(body.leadTimeDays) || 7,
        inStock: body.inStock ?? true,
        videoUrl: body.videoUrl || null,
        isPublished: body.isPublished ?? true,

        // Crucial: Explicitly update arrays and JSON structures so edits, tier adjustments, and deletions persist
        images: body.images || [],
        priceTiers: body.priceTiers || [], // Fixes pricing tier persistence bug
        specifications: body.specifications || {},
        customization_options: body.customization_options || [],
        service_guarantees: body.service_guarantees || [],
        shippingPorts: body.shippingPorts || [],

        sample_price: body.is_sample_available ? Number(body.sample_price) : null,
        is_sample_available: Boolean(body.is_sample_available),
        shippingOrigin: body.shippingOrigin || null,
        protectionEligible: body.protectionEligible ?? true,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("[PRODUCT_PUT_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}