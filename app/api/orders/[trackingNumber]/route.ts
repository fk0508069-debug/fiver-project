import { NextResponse } from "next/server";
import { getOrderByTracking } from "@/services/orderService";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  const { trackingNumber } = await params;
  const order = await getOrderByTracking(trackingNumber);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}