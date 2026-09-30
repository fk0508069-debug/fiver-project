import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) notFound();

  await connectDB ();
  const p = await Product.findById(id).lean();
  if (!p) notFound();

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl">Edit product</h1>
      <p className="mt-1 text-ink-muted">{p.name}</p>
      <div className="mt-6 max-w-3xl">
        <ProductForm
          initial={{
            _id: String(p._id),
            name: p.name,
            description: p.description,
            shortDescription: p.shortDescription ?? "",
            price: p.price,
            discount: p.discount ?? 0,
            category: p.category,
            subcategory: p.subcategory ?? "",
            images: p.images ?? [],
            stock: p.stock,
            sku: p.sku,
            specifications: (p.specifications as unknown as Record<string, string>) ?? {},
            keywords: p.keywords ?? [],
            featured: !!p.featured,
            active: p.active !== false,
          }}
        />
      </div>
    </div>
  );
}