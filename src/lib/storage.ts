// manufacturer-panel/src/lib/storage.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_ENDPOINT = process.env.STORAGE_ENDPOINT; // e.g., https://<account_id>.r2.cloudflarestorage.com
const S3_REGION = process.env.STORAGE_REGION || "auto";
const S3_ACCESS_KEY_ID = process.env.STORAGE_ACCESS_KEY_ID || "";
const S3_SECRET_ACCESS_KEY = process.env.STORAGE_SECRET_ACCESS_KEY || "";
const S3_BUCKET_NAME = process.env.STORAGE_BUCKET_NAME || "";
const S3_PUBLIC_DOMAIN = process.env.STORAGE_PUBLIC_DOMAIN || ""; // e.g., https://pub-cdn.bharattrade.com

export const isStorageConfigured = (): boolean => {
  return Boolean(S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY && S3_BUCKET_NAME);
};

const s3Client = isStorageConfigured()
  ? new S3Client({
      region: S3_REGION,
      endpoint: S3_ENDPOINT,
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
      },
    })
  : null;

export async function generatePresignedUploadUrl(
  filename: string,
  contentType: string,
  folder: "products" | "companies" | "certificates"
) {
  if (!s3Client || !isStorageConfigured()) {
    throw new Error("STORAGE_NOT_CONFIGURED: Object storage keys are missing in env");
  }

  const extension = filename.split(".").pop() || "bin";
  const uniqueKey = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: uniqueKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 mins
  const publicUrl = S3_PUBLIC_DOMAIN
    ? `${S3_PUBLIC_DOMAIN.replace(/\/$/, "")}/${uniqueKey}`
    : `${S3_ENDPOINT}/${S3_BUCKET_NAME}/${uniqueKey}`;

  return { uploadUrl, publicUrl, objectKey: uniqueKey };
}