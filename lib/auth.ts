import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { Admin } from "@/models/Admin";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "dev-only-secret-change-me"
);
const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type AdminSession = { email: string; role: string };

/* ---------- JWT ---------- */
export async function signAdminToken(payload: AdminSession) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (typeof payload.email !== "string" || typeof payload.role !== "string") return null;
    return { email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

/* ---------- Cookie helpers (Next.js 15+ async) ---------- */
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function setAdminCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.set(COOKIE, "", { path: "/", maxAge: 0 });
}

/* ---------- Credential verification ---------- */
export async function verifyAdminCredentials(email: string, password: string) {
  const normalized = email.trim().toLowerCase();

  // 1. Try database first
  await connectDB();
  const admin = await Admin.findOne({ email: normalized });
  if (admin) {
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return null;
    await Admin.updateOne({ _id: admin._id }, { lastLoginAt: new Date() });
    return { email: admin.email, role: admin.role as string };
  }

  // 2. Fallback: env-var single admin
  const envEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const envHash = process.env.ADMIN_PASSWORD_HASH;
  if (!envEmail || !envHash) return null;
  if (normalized !== envEmail) return null;
  const ok = await bcrypt.compare(password, envHash);
  if (!ok) return null;
  return { email: envEmail, role: "superadmin" };
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}