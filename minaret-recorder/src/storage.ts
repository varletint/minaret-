import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import { config } from "./config.js";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

export async function uploadToStorage(
  localPath: string,
  storagePath: string,
  contentType: string
): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.r2.bucketName,
      Key: storagePath,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000",
    })
  );

  // Build public url
  const publicUrl = `${config.r2.publicUrl}/${storagePath}`;
  return publicUrl;
}
