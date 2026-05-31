import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing Cloudflare R2 credentials.");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export function getR2ConfigStatus() {
  const missing = [];

  if (!process.env.R2_ACCOUNT_ID) missing.push("R2_ACCOUNT_ID");
  if (!process.env.R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
  if (!process.env.R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
  if (!process.env.R2_PUBLIC_BASE_URL) missing.push("R2_PUBLIC_BASE_URL");

  return {
    isConfigured: missing.length === 0,
    missing,
  };
}

function safeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function publicUrlForKey(objectKey) {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (!baseUrl) {
    return "";
  }

  return `${baseUrl.replace(/\/$/, "")}/${objectKey}`;
}

export async function uploadPropertyImage({ propertyId, file }) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!file.type?.startsWith("image/")) {
    throw new Error("Only image uploads are allowed.");
  }

  const bucket = process.env.R2_BUCKET_NAME || "realestate";
  const bytes = await file.arrayBuffer();
  const objectKey = `properties/${propertyId}/${Date.now()}-${safeFileName(file.name)}`;

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: Buffer.from(bytes),
      ContentType: file.type || "application/octet-stream",
    }),
  );

  return {
    object_key: objectKey,
    public_url: publicUrlForKey(objectKey),
  };
}

export async function deletePropertyImage(objectKey) {
  const bucket = process.env.R2_BUCKET_NAME || "realestate";

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
  );
}
