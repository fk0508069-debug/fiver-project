import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { getDashboardStats } from "@/services/orderService";

export const runtime = "nodejs";

export async function GET() {
  const { res } = await requireAdmin();
  if (res) return res;
  const stats = await getDashboardStats();
  return NextResponse.json(stats);
}