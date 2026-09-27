import { NextResponse } from "next/server";
import { listProducts } from "@/services/productService";

export const revalidate = 60;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const data = await listProducts({
      page: Number(url.searchParams.get("page") ?? 1),
      limit: Number(url.searchParams.get("limit") ?? 12),
      category: url.searchParams.get("category") ?? undefined,
      subcategory: url.searchParams.get("subcategory") ?? undefined,
      minPrice: url.searchParams.get("minPrice") ? Number(url.searchParams.get("minPrice")) : undefined,
      maxPrice: url.searchParams.get("maxPrice") ? Number(url.searchParams.get("maxPrice")) : undefined,
      sort: (url.searchParams.get("sort") as never) ?? "newest",
      featured: url.searchParams.get("featured") === "1",
      inStockOnly: url.searchParams.get("inStock") === "1",
    });
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}