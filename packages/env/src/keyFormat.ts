// Canonical base64 for exactly 32 bytes; browser/edge safe (no Buffer or crypto).
export function validKeyRing(value: string): boolean {
  const keys = value.split(",").map(key => key.trim());
  return keys.length > 0 && new Set(keys).size === keys.length
    && keys.every(key => /^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/.test(key));
}
