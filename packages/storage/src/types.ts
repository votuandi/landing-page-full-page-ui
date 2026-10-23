export interface PutOptions {
  contentType: string;
  cacheControl?: string;
}

export interface Meta {
  size: number;
  contentType?: string;
}

export interface StorageDriver {
  put(key: string, body: Uint8Array, options: PutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix: string): AsyncIterable<string>;
  head(key: string): Promise<Meta | null>;
  publicUrl(key: string): string;
  signedUploadUrl?(key: string, options: PutOptions): Promise<{ url: string; fields?: Record<string, string> }>;
}
