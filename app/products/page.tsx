import type { Metadata } from "next";
import Link from "next/link";
import { listProducts, getCategories } from "@/services/productService";
import { ProductGrid } from "@/components/products/ProductGrid";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Browse the full Flowline collection of workspace essentials.",
};

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const get = (k: string) =>
    Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined);

  const page = Math.max(1, Number(get("page") ?? 1));
  const category = get("category");
  const sort = (get("sort") as "newest" | "price-asc" | "price-desc" | "popular") ?? "newest";
  const featured = get("featured") === "1";

  const [data, categories] = await Promise.all([
    listProducts({ page, limit: 12, category, sort, featured }),
    getCategories(),
  ]);

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { category, sort, ...(featured && { featured: "1" }), ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "newest" || k === "sort" && v === "newest") {
        if (v) params.set(k, v);
      }
    });
    return `/products?${params.toString()}`;
  };

  return (
    <div className="container-x py-12">
      <header className="mb-8">
        <h1 className="text-3xl">{category || "All products"}</h1>
        <p className="mt-2 text-ink-muted">
          {data.total} product{data.total === 1 ? "" : "s"}
        </p>
      </header>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Link
          href="/products"
          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
            !category
              ? "border-accent bg-accent-soft text-accent-dark"
              : "border-line text-ink-muted hover:border-line-strong"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c._id}
            href={`/products?category=${encodeURIComponent(c._id)}`}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
              category === c._id
                ? "border-accent bg-accent-soft text-accent-dark"
                : "border-line text-ink-muted hover:border-line-strong"
            }`}
          >
            {c._id} <span className="text-ink-faint">({c.count})</span>
          </Link>
        ))}

        <div className="ml-auto flex gap-2">
          {[
            { k: "newest", l: "Newest" },
            { k: "popular", l: "Popular" },
            { k: "price-asc", l: "Price ↑" },
            { k: "price-desc", l: "Price ↓" },
          ].map((s) => (
            <Link
              key={s.k}
              href={buildHref({ sort: s.k })}
              className={`rounded-sm border px-3 py-1.5 text-xs ${
                sort === s.k ? "border-ink text-ink" : "border-line text-ink-muted"
              }`}
            >
              {s.l}
            </Link>
          ))}
        </div>
      </div>

      <ProductGrid products={data.items} />

      {data.totalPages > 1 && (
        <nav className="mt-12 flex justify-center gap-2">
          {Array.from({ length: data.totalPages }).map((_, i) => {
            const n = i + 1;
            const params = new URLSearchParams({ page: String(n) });
            if (category) params.set("category", category);
            if (sort) params.set("sort", sort);
            if (featured) params.set("featured", "1");
            return (
              <Link
                key={n}
                href={`/products?${params.toString()}`}
                className={`flex h-9 w-9 items-center justify-center rounded-sm border text-sm ${
                  n === page
                    ? "border-accent bg-accent text-white"
                    : "border-line text-ink-muted hover:border-line-strong"
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