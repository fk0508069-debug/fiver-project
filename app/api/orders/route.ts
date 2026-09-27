import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validations";
import { createOrder, OrderError } from "@/services/orderService";
import { getCustomerSession } from "@/lib/customerAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // 1. Auth check — must be logged in
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json(
      { error: "You must be signed in to place an order", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  // 2. Validate input
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // 3. Create the order — always link to the session's customer
  try {
    const order = await createOrder(parsed.data, session.id);
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}