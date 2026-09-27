import { ProductCard, type ProductLite } from "./ProductCard";

export function ProductGrid({ products }: { products: ProductLite[] }) {
  if (!products.length) {
    return <p className="py-10 text-center text-ink-muted">No products available.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => <ProductCard key={p._id} product={p} />)}
    </div>
  );
}