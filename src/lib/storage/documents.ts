/**
 * 서류 업로드 스토리지 추상화.
 * - DOCUMENT_STORAGE=local → public/uploads/documents (기본)
 * - DOCUMENT_STORAGE=s3 + AWS_S3_BUCKET 등 설정 시 → S3 업로드, 공개 URL 반환
 */

import path from "path";
import { mkdir, writeFile } from "fs/promises";

const UPLOAD_DIR = "documents";

export type UploadResult = { url: string };

async function uploadLocal(buffer: Buffer, filename: string): Promise<UploadResult> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", UPLOAD_DIR);
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);
  return { url: `/uploads/${UPLOAD_DIR}/${filename}` };
}

async function uploadS3(buffer: Buffer, filename: string, contentType: string): Promise<UploadResult> {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION ?? "ap-northeast-2";
  const baseUrl = process.env.DOCUMENT_STORAGE_PUBLIC_BASE_URL?.replace(/\/$/, "");

  if (!bucket) throw new Error("AWS_S3_BUCKET is required when DOCUMENT_STORAGE=s3");

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const key = `${UPLOAD_DIR}/${filename}`;
  const client = new S3Client({
    region,
    ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        }
      : {}),
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const url = baseUrl
    ? `${baseUrl}/${key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  return { url };
}

/**
 * 서류 파일 업로드. env에 따라 local 또는 S3에 저장 후 접근 URL 반환.
 */
export async function uploadDocument(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  const storage = process.env.DOCUMENT_STORAGE ?? "local";
  if (storage === "s3") return uploadS3(buffer, filename, contentType);
  return uploadLocal(buffer, filename);
}
