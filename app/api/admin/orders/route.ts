import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { listOrders } from "@/services/orderService";

export async function GET(req: Request) {
  const { res } = await requireAdmin();
  if (res) return res;
  const u = new URL(req.url);
  const data = await listOrders({
    page: Number(u.searchParams.get("page") ?? 1),
    limit: Number(u.searchParams.get("limit") ?? 20),
    status: u.searchParams.get("status") ?? undefined,
    q: u.searchParams.get("q") ?? undefined,
    from: u.searchParams.get("from") ?? undefined,
    to: u.searchParams.get("to") ?? undefined,
  });
  return NextResponse.json(data);
}