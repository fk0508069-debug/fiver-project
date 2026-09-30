import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { productUpsertSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { res } = await requireAdmin();
  if (res) return res;
  await connectDB ();

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.min(50, Number(url.searchParams.get("limit") ?? 12));
  const q = url.searchParams.get("q")?.trim();

  const filter: Record<string, unknown> = {};
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { sku: new RegExp(q, "i") }];

  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: Request) {
  const { res } = await requireAdmin();
  if (res) return res;
  await connectDB ();

  const body = await req.json().catch(() => null);
  const parsed = productUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const slug = data.slug || slugify(data.name);
  const exists = await Product.findOne({ $or: [{ slug }, { sku: data.sku }] });
  if (exists) {
    return NextResponse.json({ error: "SKU or slug already exists" }, { status: 409 });
  }

  const product = await Product.create({ ...data, slug });
  return NextResponse.json({ product }, { status: 201 });
}