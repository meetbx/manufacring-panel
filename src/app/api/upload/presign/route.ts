// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedManufacturer } from "@/lib/auth";
import cloudinary, { isCloudinaryConfigured } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify user authentication
    const auth = await getAuthenticatedManufacturer();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // 2. Check if Cloudinary environment variables exist
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error: "STORAGE_NOT_CONFIGURED",
          message: "Cloudinary credentials missing in .env.local",
        },
        { status: 503 }
      );
    }

    // 3. Extract uploaded file and target folder from FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "companies";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 4. Convert file blob to Buffer for Cloudinary stream upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Upload to Cloudinary under folder (e.g. bharattrade/companies or bharattrade/products)
    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: `bharattrade/${folder}` },
          (error, result) => {
            if (error || !result) reject(error || new Error("Cloudinary upload failed"));
            else resolve(result);
          }
        )
        .end(buffer);
    });

    // 6. Return public HTTPS URL
    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
    });
  } catch (error: any) {
    console.error("[API_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to upload file", details: error.message },
      { status: 500 }
    );
  }
}