import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customerAuth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCustomerSession();
  return NextResponse.json({ customer: session });
}