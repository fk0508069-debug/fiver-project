import { NextResponse } from "next/server";
import { customerSignupSchema } from "@/lib/validations";
import {
  createCustomer,
  signCustomerToken,
  setCustomerCookie,
} from "@/lib/customerAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = customerSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const customer = await createCustomer(parsed.data);
    const token = await signCustomerToken(customer);
    await setCustomerCookie(token);
    return NextResponse.json({ ok: true, customer }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("already exists")) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Could not create account" }, { status: 500 });
  }
}