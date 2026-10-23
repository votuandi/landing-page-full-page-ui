import { DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { assertKey } from "../key.ts";
import type { StorageDriver } from "../types.ts";

export interface S3DriverOptions {
  bucket: string;
  region: string;
  publicBase: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  credentials?: S3ClientConfig["credentials"];
  client?: S3Client;
  maxKeys?: number;
}

export function createS3Driver({ bucket, publicBase, client, maxKeys, ...config }: S3DriverOptions): StorageDriver {
  const s3 = client ?? new S3Client(config);
  const base = publicBase.replace(/\/+$/, "");
  return {
    async put(key, body, { contentType, cacheControl }) {
      assertKey(key);
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, CacheControl: cacheControl }));
    },
    async delete(key) {
      assertKey(key);
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
    async *list(prefix) {
      assertKey(prefix, { prefix: true });
      let token: string | undefined;
      do {
        const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token, MaxKeys: maxKeys }));
        for (const object of page.Contents ?? []) if (object.Key !== undefined) yield object.Key;
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
      } while (token);
    },
    async head(key) {
      assertKey(key);
      try {
        const meta = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return { size: meta.ContentLength ?? 0, contentType: meta.ContentType };
      } catch (error) {
        // HeadObject uses generic HTTP errors; a 403 must remain an authorization error.
        const failure = error as { name?: string; $metadata?: { httpStatusCode?: number } } | null;
        if (failure?.name === "NotFound" || failure?.$metadata?.httpStatusCode === 404) return null;
        throw error;
      }
    },
    publicUrl(key) {
      assertKey(key);
      return `${base}/${key}`;
    },
  };
}
