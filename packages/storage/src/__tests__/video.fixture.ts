import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { CreateBucketCommand, DeleteBucketCommand, PutBucketPolicyCommand, S3Client } from "@aws-sdk/client-s3";
import { createS3Driver } from "../index.ts";

/** S3-compatible public policy fixture shared with the worker's video pipeline test. */
export async function videoS3Fixture() {
  const endpoint = process.env.STORAGE_S3_TEST_ENDPOINT!;
  const bucket = `solar-video-${randomUUID()}`;
  const client = new S3Client({ endpoint, region: "us-east-1", forcePathStyle: true,
    credentials: { accessKeyId: process.env.STORAGE_S3_TEST_ACCESS_KEY_ID ?? "minioadmin", secretAccessKey: process.env.STORAGE_S3_TEST_SECRET_ACCESS_KEY ?? "minioadmin" } });
  const storage = createS3Driver({ bucket, client, region: "us-east-1", publicBase: `${endpoint}/${bucket}` });
  const cleanup = async () => {
    try {
      for await (const key of storage.list("")) await storage.delete(key);
      await client.send(new DeleteBucketCommand({ Bucket: bucket }));
    } finally { client.destroy(); }
  };
  try {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    const policy = (await readFile(new URL("../../public-read-policy.json", import.meta.url), "utf8")).replaceAll("BUCKET", bucket);
    await client.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: policy }));
    return { storage, cleanup };
  } catch (error) { await cleanup(); throw error; }
}
