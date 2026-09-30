import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { productUpsertSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireAdmin();
  if (res) return res;
  await connectDB ();

  const { id } = await params;
  const product = await Product.findById(id).lean();
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireAdmin();
  if (res) return res;
  await connectDB ();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = productUpsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const product = await Product.findByIdAndUpdate(id, parsed.data, { new: true }).lean();
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { res } = await requireAdmin();
  if (res) return res;
  await connectDB ();

  const { id } = await params;
  const product = await Product.findByIdAndUpdate(id, { active: false }, { new: true }).lean();
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}