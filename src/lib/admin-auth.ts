import crypto from "crypto";

/**
 * Authentification espace administrateur — session par cookie
 * HttpOnly signé (HMAC-SHA256). Non accessible publiquement.
 *
 * Variables d'environnement serveur :
 *   ADMIN_PASSWORD         — mot de passe d'accès
 *   ADMIN_SESSION_SECRET   — secret de signature des sessions
 */

const COOKIE_NAME = "stevens_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 heures

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "stevens-admin-session-secret-change-me";
}

export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "stevens-admin-2026";
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Crée un jeton de session signé avec expiration. */
export function createSessionToken(): string {
  const payload = `admin.${Date.now() + SESSION_TTL_MS}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/** Vérifie un jeton de session (signature + expiration). */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [prefix, expiry, sig] = parts;
  if (prefix !== "admin") return false;
  const payload = `${prefix}.${expiry}`;
  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const exp = Number(expiry);
  return Number.isFinite(exp) && exp > Date.now();
}

export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_MAX_AGE = SESSION_TTL_MS / 1000;
