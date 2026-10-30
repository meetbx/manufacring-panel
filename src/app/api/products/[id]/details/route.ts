import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch rich product details (A+ blocks)
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        productDetails: true, // JSON field storing array of blocks
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: product.productDetails || [],
    });
  } catch (error) {
    console.error("[PRODUCT_DETAILS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch product details" },
      { status: 500 }
    );
  }
}

// PUT: Save / update rich product details (A+ blocks)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // Expecting body to contain { blocks: [...] } or direct array of blocks
    const blocks = Array.isArray(body) ? body : body.blocks || [];

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        productDetails: blocks,
      },
      select: {
        id: true,
        productDetails: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProduct.productDetails,
    });
  } catch (error) {
    console.error("[PRODUCT_DETAILS_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update product details" },
      { status: 500 }
    );
  }
}