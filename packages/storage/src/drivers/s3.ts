import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { assertKey, assertPublicKey } from "../key.ts";
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
  // Presigning has no Body: automatic CRC32 would bind the checksum of an empty upload.
  const signingClient = new S3Client({ ...config, region: s3.config.region, credentials: s3.config.credentials,
    endpoint: s3.config.endpoint, forcePathStyle: s3.config.forcePathStyle, requestChecksumCalculation: "WHEN_REQUIRED" });
  const base = publicBase.replace(/\/+$/, "");
  return {
    async signedUploadUrl(key, { contentType, contentLength, expiresIn = 900 }) {
      assertKey(key);
      if (!Number.isSafeInteger(contentLength) || contentLength <= 0 || expiresIn < 1 || expiresIn > 900) throw new Error("Invalid upload constraints");
      const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, ContentLength: contentLength });
      // https://github.com/aws/aws-sdk-js-v3/tree/main/packages/s3-request-presigner
      const url = await getSignedUrl(signingClient, command, { expiresIn, signableHeaders: new Set(["content-type", "content-length"]) });
      return { url, headers: { "Content-Type": contentType } };
    },
    async get(key) {
      assertKey(key);
      try {
        const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        if (!object.Body) throw new Error("Storage returned no object body");
        return await object.Body.transformToByteArray();
      } catch (error) {
        const failure = error as { name?: string; $metadata?: { httpStatusCode?: number } } | null;
        if (failure?.name === "NoSuchKey" || failure?.name === "NotFound" || failure?.$metadata?.httpStatusCode === 404) return null;
        throw error;
      }
    },
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
      assertPublicKey(key);
      return `${base}/${key}`;
    },
  };
}
