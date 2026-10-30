// src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Changed to named import { prisma }
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Adjust to match your NextAuth config path

export async function POST(req: Request) {
  try {
    // 1. Resolve Active User & Manufacturer Identity
    const session = await getServerSession(authOptions);
    let manufacturerId: string | null = null;

    if (session?.user?.id) {
      // Look up manufacturer linked to active logged-in user
      const member = await prisma.manufacturerMember.findFirst({
        where: { userId: session.user.id },
        select: { manufacturerId: true },
      });
      manufacturerId = member?.manufacturerId || null;
    }

    // Fallback for local development if auth session isn't active yet
    if (!manufacturerId) {
      const fallbackManufacturer = await prisma.manufacturer.findFirst({
        select: { id: true },
      });

      if (!fallbackManufacturer) {
        return NextResponse.json(
          { error: "No manufacturer account found in database." },
          { status: 403 }
        );
      }
      manufacturerId = fallbackManufacturer.id;
    }

    const body = await req.json();

    // 2. Server-Side Validation
    if (!body.name || !body.categoryId || body.minPrice === undefined || body.maxPrice === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (Number(body.maxPrice) < Number(body.minPrice)) {
      return NextResponse.json({ error: "Maximum price cannot be less than minimum price" }, { status: 400 });
    }

    // 3. Validate Category Existence
    const categoryExists = await prisma.category.findUnique({
      where: { id: body.categoryId },
    });

    if (!categoryExists) {
      return NextResponse.json({ error: "Selected category does not exist." }, { status: 400 });
    }

    // 4. Generate Safe Unique Slug
    const baseSlug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const uniqueSlug = `${baseSlug}-${Date.now()}`;

    // 5. Create the Product Record
    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: uniqueSlug,
        description: body.description || null,
        minPrice: Number(body.minPrice),
        maxPrice: Number(body.maxPrice),
        moq: Number(body.moq) || 1,
        unit: body.unit || "Piece",
        hsCode: body.hsCode || null,
        leadTimeDays: Number(body.leadTimeDays) || 7,
        inStock: body.inStock ?? true,
        categoryId: body.categoryId,
        manufacturerId: manufacturerId, // Securely attached
        isPublished: body.isPublished === true,

        // JSON & Arrays mapping
        images: body.images || [],
        priceTiers: body.priceTiers || [],
        specifications: body.specifications || [],
        customization_options: body.customization_options || [],
        service_guarantees: body.service_guarantees || [],
        shippingPorts: body.shippingPorts || [],

        // Optional Logistical / Service Fields
        sample_price: body.is_sample_available ? Number(body.sample_price) : null,
        is_sample_available: Boolean(body.is_sample_available),
        videoUrl: body.videoUrl || null,
        shippingOrigin: body.shippingOrigin || null,
        protectionEligible: body.protectionEligible ?? true,
      },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });

  } catch (error: any) {
    console.error("[PRODUCT_POST_ERROR]", error);

    if (error?.code === 'P2002') {
      return NextResponse.json({ error: "A product with this slug already exists." }, { status: 409 });
    }

    return NextResponse.json(
      { error: error?.message || "Failed to create product due to an internal server error." },
      { status: 500 }
    );
  }
}

// Add this below your POST export in src/app/api/products/route.ts
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    // 1. Extract active user's session and resolve manufacturer identity
    const session = await getServerSession(authOptions);
    let manufacturerId: string | null = null;

    if (session?.user?.id) {
      const member = await prisma.manufacturerMember.findFirst({
        where: { userId: session.user.id },
        select: { manufacturerId: true },
      });
      manufacturerId = member?.manufacturerId || null;
    }

    // Fallback for local development if auth session isn't active
    if (!manufacturerId) {
      const fallbackManufacturer = await prisma.manufacturer.findFirst({
        select: { id: true },
      });
      manufacturerId = fallbackManufacturer?.id || null;
    }

    // If no manufacturer is found, return an empty list safely
    if (!manufacturerId) {
      return NextResponse.json({
        success: true,
        count: 0,
        products: [],
        data: [],
      });
    }

    // 2. Fetch products filtered strictly by manufacturerId
    const products = await prisma.product.findMany({
      where: {
        manufacturerId: manufacturerId, // Scope query to active manufacturer
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { hsCode: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      products: products,
      data: products,
    });
  } catch (error: any) {
    console.error("[PRODUCTS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}