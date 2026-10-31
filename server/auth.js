/**
 * Cortex Hub - Authentication & Authorization (SRS v3.0 AUTH-01..05, G1)
 * Cookie sessions backed by the Session table, scrypt password hashing,
 * platform-role and workspace-membership guards.
 */

import { randomBytes, scrypt, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export const SESSION_COOKIE = "ch_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

// Platform roles (User.globalRole) allowed into staff-only areas
export const PLATFORM_ADMIN_ROLES = ["ADMIN", "SUPERADMIN"];
export const PLATFORM_STAFF_ROLES = ["MODERATOR", "SUPPORT", "FINANCE", "ADMIN", "SUPERADMIN"];

// --------------------------------------------------------------------------
// Hashing helpers
// --------------------------------------------------------------------------
export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith("scrypt$")) return false;
  const [, n, r, p, saltB64, hashB64] = stored.split("$");
  const expected = Buffer.from(hashB64, "base64");
  const derived = await scryptAsync(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p)
  });
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

// Used when the email is unknown so login timing does not reveal which accounts exist
const DUMMY_HASH_PROMISE = hashPassword(randomBytes(16).toString("hex"));
export async function burnPasswordCheck(password) {
  await verifyPassword(password, await DUMMY_HASH_PROMISE);
  return false;
}

// --------------------------------------------------------------------------
// Login throttling (in-memory; move to Redis when running more than one instance)
// --------------------------------------------------------------------------
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;
const loginFailures = new Map();

export function isLoginThrottled(key) {
  const entry = loginFailures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > LOGIN_WINDOW_MS) {
    loginFailures.delete(key);
    return false;
  }
  return entry.count >= LOGIN_MAX_FAILURES;
}

export function recordLoginFailure(key) {
  const entry = loginFailures.get(key);
  if (!entry || Date.now() - entry.first > LOGIN_WINDOW_MS) {
    loginFailures.set(key, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
}

export function clearLoginFailures(key) {
  loginFailures.delete(key);
}

// --------------------------------------------------------------------------
// Sessions
// --------------------------------------------------------------------------
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function sessionCookie(value, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export async function createSession(prisma, res, user, req) {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      deviceInfo: (req.get("user-agent") || "").slice(0, 200),
      ipAddress: req.ip
    }
  });
  res.setHeader("Set-Cookie", sessionCookie(token, SESSION_TTL_MS / 1000));
}

export async function destroySession(prisma, req, res) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: sha256(token), revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
  res.setHeader("Set-Cookie", sessionCookie("", 0));
}

/**
 * Attaches req.user (with memberships + workspaces) when a valid session cookie is present.
 * Never rejects; use requireAuth / requirePlatformRole / requireWorkspace to enforce.
 */
export function loadSession(prisma) {
  return async (req, res, next) => {
    req.user = null;
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (!token) return next();
    try {
      const session = await prisma.session.findUnique({
        where: { tokenHash: sha256(token) },
        include: { user: { include: { memberships: { include: { workspace: true } } } } }
      });
      if (session && !session.revokedAt && session.expiresAt > new Date() && session.user.status === "ACTIVE") {
        req.user = session.user;
        req.sessionId = session.id;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

// --------------------------------------------------------------------------
// Guards
// --------------------------------------------------------------------------
export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Authentication required", requestId: req.requestId });
  next();
}

export function isPlatformRole(user, roles) {
  return Boolean(user && roles.includes(user.globalRole));
}

export function requirePlatformRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required", requestId: req.requestId });
    if (!isPlatformRole(req.user, roles)) {
      return res.status(403).json({ error: "Insufficient permissions", requestId: req.requestId });
    }
    next();
  };
}

/**
 * Requires membership in a workspace of the given type (BUYER | SELLER).
 * An optional X-Workspace-Id header selects among several; it must belong to the user.
 * Sets req.workspace and req.membership.
 */
export function findMembership(req, type) {
  if (!req.user) return null;
  const wanted = req.get("x-workspace-id");
  return (
    req.user.memberships.find((m) => m.workspace.type === type && (!wanted || m.workspaceId === wanted)) || null
  );
}

export function requireWorkspace(type) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required", requestId: req.requestId });
    const membership = findMembership(req, type);
    if (!membership) {
      return res.status(403).json({ error: `A ${type.toLowerCase()} workspace is required`, requestId: req.requestId });
    }
    req.membership = membership;
    req.workspace = membership.workspace;
    next();
  };
}

/** Public shape of the signed-in user (never includes passwordHash). */
export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    globalRole: user.globalRole,
    workspaces: (user.memberships || []).map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      type: m.workspace.type,
      role: m.role
    }))
  };
}
