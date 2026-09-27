import { ProductGrid } from "./ProductGrid";
import type { ProductLite } from "./ProductCard";

export function ProductRecommendations({
  products, title = "You may also like", subtitle,
}: { products: ProductLite[]; title?: string; subtitle?: string }) {
  if (!products?.length) return null;
  return (
    <section className="mt-16">
      <div className="mb-6">
        <h2 className="text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      <ProductGrid products={products} />
    </section>
  );
}