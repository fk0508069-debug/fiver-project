import { NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validations";
import {
  verifyAdminCredentials,
  signAdminToken,
  setAdminCookie,
  clearAdminCookie,
  getAdminSession,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials format" }, { status: 400 });
  }

  const session = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
  if (!session) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await signAdminToken(session);
  await setAdminCookie(token);
  return NextResponse.json({ ok: true, admin: { email: session.email, role: session.role } });
}

export async function GET() {
  const session = await getAdminSession();
  return NextResponse.json({ admin: session });
}

export async function DELETE() {
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}