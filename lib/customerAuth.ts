import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";

const SECRET = new TextEncoder().encode(
  process.env.CUSTOMER_JWT_SECRET || process.env.ADMIN_JWT_SECRET || "dev-only-secret-change-me"
);
const COOKIE = "customer_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type CustomerSession = { id: string; email: string; fullName: string };

/* ---------- JWT ---------- */
export async function signCustomerToken(payload: CustomerSession) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifyCustomerToken(token: string): Promise<CustomerSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.fullName !== "string"
    ) {
      return null;
    }
    return { id: payload.id, email: payload.email, fullName: payload.fullName };
  } catch {
    return null;
  }
}

/* ---------- Cookie helpers ---------- */
export async function getCustomerSession(): Promise<CustomerSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

export async function setCustomerCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearCustomerCookie() {
  const store = await cookies();
  store.set(COOKIE, "", { path: "/", maxAge: 0 });
}

/* ---------- Credential helpers ---------- */
export async function createCustomer(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}) {
  await connectDB ();
  const email = input.email.trim().toLowerCase();

  const existing = await Customer.findOne({ email });
  if (existing) throw new Error("An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const customer = await Customer.create({
    email,
    passwordHash,
    fullName: input.fullName.trim(),
    phone: input.phone?.trim() ?? "",
  });

  return {
    id: String(customer._id),
    email: customer.email,
    fullName: customer.fullName,
  };
}

export async function verifyCustomerCredentials(email: string, password: string) {
  await connectDB ();
  const normalized = email.trim().toLowerCase();

  const customer = await Customer.findOne({ email: normalized });
  if (!customer) return null;

  const ok = await bcrypt.compare(password, customer.passwordHash);
  if (!ok) return null;

  await Customer.updateOne({ _id: customer._id }, { lastLoginAt: new Date() });

  return {
    id: String(customer._id),
    email: customer.email,
    fullName: customer.fullName,
  };
}