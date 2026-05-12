// Edge-compatible auth helpers (uses Web Crypto, works in middleware + node).

const COOKIE_NAME = "mydoctor-auth";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const DIARY_COOKIE_NAME = "mydoctor-diary";
// Shorter lifetime for the sensitive diary scope — re-prompt weekly.
const DIARY_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET must be set (at least 16 chars)");
  }
  return s;
}

// `scope` is part of the signed payload, so an auth token can never be
// silently reused as a diary token (or vice versa) — different signatures.
async function hmac(payload: string): Promise<string> {
  const secret = getSecret();
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return toHex(new Uint8Array(sig));
}

export async function makeSessionToken(): Promise<string> {
  const issuedAt = Date.now();
  const payload = String(issuedAt);
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const issuedAt = Number(payload);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > MAX_AGE_SECONDS * 1000) return false;
  let expected: string;
  try {
    expected = await hmac(payload);
  } catch {
    return false;
  }
  return constantTimeEqual(sig, expected);
}

export async function makeDiaryToken(): Promise<string> {
  const issuedAt = Date.now();
  const payload = `diary:${issuedAt}`;
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

export async function verifyDiaryToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  if (!payload.startsWith("diary:")) return false;
  const issuedAt = Number(payload.slice("diary:".length));
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > DIARY_MAX_AGE_SECONDS * 1000) return false;
  let expected: string;
  try {
    expected = await hmac(payload);
  } catch {
    return false;
  }
  return constantTimeEqual(sig, expected);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  return constantTimeEqual(input, expected);
}

export function checkDiaryPassword(input: string): boolean {
  const expected = process.env.DIARY_PASSWORD;
  if (!expected) return false;
  return constantTimeEqual(input, expected);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

export const AUTH_COOKIE = COOKIE_NAME;
export const AUTH_MAX_AGE = MAX_AGE_SECONDS;
export const DIARY_COOKIE = DIARY_COOKIE_NAME;
export const DIARY_MAX_AGE = DIARY_MAX_AGE_SECONDS;
