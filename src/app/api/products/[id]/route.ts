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

    // Safely resolve params (supports both Next.js 14 and Next.js 15)
    const resolvedParams = await params;
    const { id } = resolvedParams;

    console.log(`[API GET /api/products/${id}] Querying database...`);

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      console.log(`[API GET /api/products/${id}] Product NOT FOUND in DB`);
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

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        minPrice: body.minPrice,
        maxPrice: body.maxPrice,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("[PRODUCT_PUT_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}