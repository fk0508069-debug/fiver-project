import { NextResponse } from "next/server";
import { customerLoginSchema } from "@/lib/validations";
import {
  verifyCustomerCredentials,
  signCustomerToken,
  setCustomerCookie,
} from "@/lib/customerAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = customerLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const customer = await verifyCustomerCredentials(parsed.data.email, parsed.data.password);
  if (!customer) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await signCustomerToken(customer);
  await setCustomerCookie(token);
  return NextResponse.json({ ok: true, customer });
}