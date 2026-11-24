import crypto from "crypto";

/**
 * Authentification espace administrateur — session par cookie
 * HttpOnly signé (HMAC-SHA256). Non accessible publiquement.
 *
 * Variables d'environnement serveur :
 *   ADMIN_PASSWORD         — mot de passe d'accès
 *   ADMIN_SESSION_SECRET   — secret de signature des sessions
 *
 * FAIL-CLOSED (audit du 19/11 — sixième volet) : ce dépôt est PUBLIC.
 * Les valeurs de repli historiques (« stevens-admin-2026 » et
 * « stevens-admin-session-secret-change-me »), lisibles par quiconque
 * sur GitHub, rendaient l'admin accessible par défaut dès qu'une
 * variable manquait — VÉRIFIÉ EN PRODUCTION le 19/11 : un jeton de
 * session forgé avec le secret public du dépôt passait
 * verifySessionToken() (la requête atteignait la base, réponse 503 au
 * lieu du 401 attendu ; ADMIN_SESSION_SECRET n'était pas défini sur
 * Vercel, seule l'absence de base connectée limitait l'impact).
 * Depuis ce correctif, chaque primitive REFUSE quand sa variable
 * est absente ou trop courte :
 *   - verifyPassword()    → false sans ADMIN_PASSWORD : personne ne
 *     peut ouvrir de session, quel que soit le mot de passe soumis ;
 *   - verifySessionToken() → false sans ADMIN_SESSION_SECRET : aucun
 *     jeton existant ne peut être validé, forgé ou non ;
 *   - createSessionToken() → lève une erreur explicite (la route
 *     login répond 503 avec un message actionnable, voir
 *     src/app/api/admin/login/route.ts).
 * La route login refuse en amont toute configuration incomplète
 * (message générique, sans préciser QUELLE variable manque — cette
 * information n'appartient qu'au propriétaire via DEPLOIEMENT.md).
 *
 * VOLET 14 (24/11/2026) — ADMIN_SESSION_SECRET DEVIENT OPTIONNEL.
 * Incident de l'éditeur : « ça me met un panneau rouge “espace
 * administrateur non configuré sur cet environnement” alors que
 * j'ai exactement le mot de passe des variables Vercel ». Cause :
 * le fail-closed ci-dessus exigeait DEUX variables ; seul
 * ADMIN_PASSWORD était défini. Désormais, quand ADMIN_SESSION_SECRET
 * est absent (ou trop court), le secret de signature est DÉRIVÉ du
 * mot de passe lui-même (HMAC-SHA256 avec sel interne) : la
 * connexion fonctionne avec le seul mot de passe défini, aucune
 * valeur publique n'est introduite (le dépôt reste impossible à
 * forger), et changer le mot de passe invalide toutes les sessions
 * existantes. Un ADMIN_SESSION_SECRET explicite (≥ 16 caractères)
 * reste prioritaire et annule la dérivation.
 */

const COOKIE_NAME = "stevens_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 heures

/** Longueur minimale acceptée pour le secret de signature. */
const MIN_SECRET_LENGTH = 16;

/** Sel de dérivation — propre à ce déploiement : le condensat du
 *  mot de passe ne peut pas être réutilisé tel quel ailleurs. */
const SEL_DERIVATION = "stevens-admin-session::v1";

function getSessionSecret(): string | null {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit && explicit.length >= MIN_SECRET_LENGTH) return explicit;
  // VOLET 14 : secret dérivé du mot de passe — jamais public (ni le
  // mot de passe ni le sel ne figurent dans le dépôt), et il change
  // automatiquement quand l'éditeur change son mot de passe.
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return crypto.createHmac("sha256", SEL_DERIVATION).update(password).digest("hex");
}

/** Configuration admin complète ? (utilisée par la route login pour
 *  refuser proprement une configuration incomplète, sans oracle.)
 *  VOLET 14 : le MOT DE PASSE seul suffit — le secret de session se
 *  dérive du mot de passe si ADMIN_SESSION_SECRET n'est pas défini. */
export function isAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD) && getSessionSecret() !== null;
}

export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  // Fail-closed : sans mot de passe configuré, AUCUNE soumission
  // n'est acceptée (le dépôt public ne peut plus servir de mot de passe).
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Crée un jeton de session signé avec expiration.
 *  Lève une erreur si le secret de signature n'est pas configuré —
 *  appelée uniquement après un mot de passe vérifié, cette erreur
 *  signale une configuration incomplète au lieu de signer avec un
 *  secret public. */
export function createSessionToken(): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET absent ou trop court (< 16 caractères) — voir DEPLOIEMENT.md.",
    );
  }
  const payload = `admin.${Date.now() + SESSION_TTL_MS}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/** Vérifie un jeton de session (signature + expiration).
 *  Fail-closed : sans secret configuré, AUCUN jeton n'est valide —
 *  un jeton forgé avec l'ancien secret public du dépôt est refusé. */
export function verifySessionToken(token: string | undefined | null): boolean {
  const secret = getSessionSecret();
  if (!secret) return false;
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [prefix, expiry, sig] = parts;
  if (prefix !== "admin") return false;
  const payload = `${prefix}.${expiry}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const exp = Number(expiry);
  return Number.isFinite(exp) && exp > Date.now();
}

export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_MAX_AGE = SESSION_TTL_MS / 1000;
