// src/app/api/categories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const includeAncestors = searchParams.get("includeAncestors") === "true";
    const categoryId = searchParams.get("categoryId");

    if (includeAncestors && categoryId) {
      const path: any[] = [];
      let currentId: string | null = categoryId;

      while (currentId) {
        const cat = await prisma.category.findUnique({
          where: { id: currentId },
          select: { id: true, name: true, parentId: true },
        });
        if (!cat) break;
        path.unshift(cat);
        currentId = cat.parentId;
      }

      return NextResponse.json({ path });
    }

    // Determine where clause for fetching categories
    let whereClause: any = {};
    if (parentId && parentId !== "null" && parentId !== "undefined") {
      whereClause = { parentId };
    } else {
      whereClause = {
        OR: [
          { parentId: null },
          { parentId: "" },
        ],
      };
    }

    let categories = await prisma.category.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        _count: { select: { children: true } },
      },
      orderBy: { name: "asc" },
    });

    // Fallback: If no categories match root condition, return all categories so dropdown isn't empty
    if ((!parentId || parentId === "null") && categories.length === 0) {
      categories = await prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          _count: { select: { children: true } },
        },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch categories" }, { status: 500 });
  }
}