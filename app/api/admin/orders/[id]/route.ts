import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { orderStatusSchema } from "@/lib/validations";
import { updateOrderStatus } from "@/services/orderService";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { res } = await requireAdmin();
  if (res) return res;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = orderStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const order = await updateOrderStatus(id, parsed.data.status, parsed.data.paymentStatus);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}