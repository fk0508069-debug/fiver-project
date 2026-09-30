import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { formatCurrency, effectivePrice } from "@/lib/utils";
import { ProductRowActions } from "@/components/admin/ProductRowActions";

export const dynamic = "force-dynamic";

type ProductItem = {
  _id: string;
  name: string;
  sku?: string;
  price: number;
  discount?: number;
  stock: number;
  category?: string;
  images?: string[];
  active: boolean;
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  await connectDB ();

  const sp = await searchParams;

  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 15;
  const q = sp.q?.trim();

  const filter = q
    ? {
        $or: [
          {
            name: new RegExp(q, "i"),
          },
          {
            sku: new RegExp(q, "i"),
          },
        ],
      }
    : {};

  const [itemsRaw, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Product.countDocuments(filter),
  ]);

  /*
   * Convert MongoDB documents into plain JSON data
   * and explicitly tell TypeScript what the array contains.
   */
  const items: ProductItem[] = JSON.parse(
    JSON.stringify(itemsRaw)
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">Products</h1>

          <p className="mt-1 text-sm text-ink-muted">
            {total} products
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="btn btn-primary btn-sm"
        >
          Add product
        </Link>
      </div>

      {/* Search */}
      <form className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or SKU…"
          className="input max-w-sm"
        />
      </form>

      {/* Products Table */}
      <div className="overflow-x-auto rounded border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-alt text-left text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="p-3">
                Product
              </th>

              <th className="p-3">
                SKU
              </th>

              <th className="p-3">
                Price
              </th>

              <th className="p-3">
                Stock
              </th>

              <th className="p-3">
                Category
              </th>

              <th className="p-3">
                Status
              </th>

              <th className="p-3"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {items.map((p: ProductItem) => (
              <tr key={String(p._id)}>
                {/* Product */}
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-sm bg-surface-alt">
                      {p.images?.[0] && (
                        <Image
                          src={p.images[0]}
                          alt={p.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <span className="font-medium">
                      {p.name}
                    </span>
                  </div>
                </td>

                {/* SKU */}
                <td className="p-3 text-ink-muted">
                  {p.sku ?? "—"}
                </td>

                {/* Price */}
                <td className="p-3">
                  {p.discount ? (
                    <>
                      <span className="font-medium">
                        {formatCurrency(
                          effectivePrice(
                            p.price,
                            p.discount
                          )
                        )}
                      </span>

                      <span className="ml-2 text-xs text-ink-faint line-through">
                        {formatCurrency(p.price)}
                      </span>
                    </>
                  ) : (
                    formatCurrency(p.price)
                  )}
                </td>

                {/* Stock */}
                <td className="p-3">
                  {p.stock}
                </td>

                {/* Category */}
                <td className="p-3 text-ink-muted">
                  {p.category ?? "—"}
                </td>

                {/* Status */}
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      p.active
                        ? "bg-accent-soft text-accent-dark"
                        : "bg-danger/10 text-danger"
                    }`}
                  >
                    {p.active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </td>

                {/* Actions */}
                <td className="p-3 text-right">
                  <ProductRowActions
                    id={String(p._id)}
                    active={p.active}
                  />
                </td>
              </tr>
            ))}

            {/* Empty State */}
            {!items.length && (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-ink-muted"
                >
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-6 flex gap-2">
          {Array.from({
            length: totalPages,
          }).map((_, i) => {
            const n = i + 1;

            const params = new URLSearchParams({
              page: String(n),

              ...(q && {
                q,
              }),
            });

            return (
              <Link
                key={n}
                href={`/admin/products?${params.toString()}`}
                className={`rounded-sm border px-3 py-1.5 text-sm ${
                  n === page
                    ? "border-accent bg-accent text-white"
                    : "border-line"
                }`}
              >
                {n}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
