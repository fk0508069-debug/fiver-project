import { NextResponse } from "next/server";
import { clearCustomerCookie } from "@/lib/customerAuth";

export const runtime = "nodejs";

export async function POST() {
  await clearCustomerCookie();
  return NextResponse.json({ ok: true });
}