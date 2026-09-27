import { NextResponse } from "next/server";
import { searchProducts } from "@/services/productService";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ items: [] });
  if (q.length > 80) return NextResponse.json({ error: "Query too long" }, { status: 400 });
  const items = await searchProducts(q, 12);
  return NextResponse.json({ items });
}