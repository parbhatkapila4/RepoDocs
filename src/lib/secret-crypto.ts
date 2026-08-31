import crypto from "crypto";

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

let warnedMissingKey = false;

function getKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.warn(
        "[secret-crypto] ENCRYPTION_KEY is not set - secrets are stored in plaintext. Set a 32-byte key (hex/base64) to enable encryption at rest.",
      );
    }
    return null;
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  try {
    const b64 = Buffer.from(raw, "base64");
    if (b64.length === 32) return b64;
  } catch {}
  return crypto.createHash("sha256").update(raw).digest();
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export function encryptSecret(
  plaintext: string | null | undefined,
): string | null {
  if (plaintext == null || plaintext === "") return null;
  if (plaintext.startsWith(PREFIX)) return plaintext;
  const key = getKey();
  if (!key) return plaintext;

  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptSecret(
  stored: string | null | undefined,
): string | null {
  if (stored == null || stored === "") return null;
  if (!stored.startsWith(PREFIX)) return stored;

  const key = getKey();
  if (!key) {
    console.error(
      "[secret-crypto] ENCRYPTION_KEY missing - cannot decrypt a stored secret.",
    );
    return null;
  }

  try {
    const raw = Buffer.from(stored.slice(PREFIX.length), "base64");
    const iv = raw.subarray(0, IV_LEN);
    const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const ciphertext = raw.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  } catch (error) {
    console.error("[secret-crypto] Failed to decrypt stored secret:", error);
    return null;
  }
}
