"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { effectivePrice, formatCurrency } from "@/lib/utils";
import { QuantitySelector } from "./QuantitySelector";

type Product = {
  _id: string;
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  price: number;
  discount?: number;
  category: string;
  subcategory?: string;
  images: string[];
  stock: number;
  sku: string;
  specifications?: Record<string, string>;
  rating?: number;
  reviewCount?: number;
};

export function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const { requireAuth } = useAuth();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);

  const unit = useMemo(() => effectivePrice(product.price, product.discount ?? 0), [product]);
  const total = useMemo(() => Math.round(unit * qty * 100) / 100, [unit, qty]);
  const outOfStock = product.stock <= 0;
  const here = `/products/${product._id}`;

  function buildItem() {
    return {
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images[0] ?? "",
      price: unit,
      quantity: qty,
      stock: product.stock,
    };
  }

  function handleAdd() {
    if (outOfStock) return;
    if (!requireAuth(here)) return;
    add(buildItem());
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    if (outOfStock) return;
    // Send to login with a next that lands them on /checkout after auth
    if (!requireAuth("/checkout")) return;
    add(buildItem());
    router.push("/checkout");
  }

  const specs = product.specifications && Object.entries(product.specifications);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* Gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-surface-alt">
          {product.images[activeImg] && (
            <Image
              src={product.images[activeImg]}
              alt={product.name}
              fill
              priority
              sizes="(max-width:1024px) 100vw, 50vw"
              className="object-cover"
            />
          )}
          {product.discount ? (
            <span className="absolute left-4 top-4 rounded-full bg-danger px-3 py-1 text-xs font-bold text-white">
              −{product.discount}% off
            </span>
          ) : null}
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2.5">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`relative h-16 w-16 overflow-hidden rounded-sm border ${
                  i === activeImg ? "border-accent" : "border-line"
                }`}
              >
                <Image src={img} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <nav className="mb-3 flex items-center gap-2 text-xs text-ink-faint">
          <Link href="/products" className="hover:text-ink">
            Shop
          </Link>
          <span>/</span>
          <Link
            href={`/products?category=${encodeURIComponent(product.category)}`}
            className="hover:text-ink"
          >
            {product.category}
          </Link>
          {product.subcategory && (
            <>
              <span>/</span>
              <span>{product.subcategory}</span>
            </>
          )}
        </nav>

        <h1 className="text-3xl">{product.name}</h1>
        {product.shortDescription && (
          <p className="mt-3 text-ink-muted">{product.shortDescription}</p>
        )}

        <div className="mt-5 flex items-baseline gap-3">
          <span className="font-display text-3xl text-ink">{formatCurrency(unit)}</span>
          {product.discount ? (
            <>
              <span className="text-base text-ink-faint line-through">
                {formatCurrency(product.price)}
              </span>
              <span className="text-xs font-semibold text-danger">
                Save {product.discount}%
              </span>
            </>
          ) : null}
        </div>

        <p
          className={`mt-3 text-sm font-medium ${
            outOfStock ? "text-danger" : product.stock < 10 ? "text-gold" : "text-accent"
          }`}
        >
          {outOfStock
            ? "Out of stock"
            : product.stock < 10
            ? `Only ${product.stock} left`
            : "In stock"}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <QuantitySelector value={qty} onChange={setQty} max={Math.max(1, product.stock)} />
          <span className="text-sm text-ink-muted">
            Total: <strong className="text-ink">{formatCurrency(total)}</strong>
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="btn btn-ghost btn-lg disabled:opacity-50"
          >
            {added ? "Added ✓" : "Add to cart"}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={outOfStock}
            className="btn btn-primary btn-lg disabled:opacity-50"
          >
            Buy now
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-muted">
          <span>SKU: {product.sku}</span>
          <span>Free shipping over $150</span>
          <span>30-day returns</span>
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <h2 className="text-lg">Description</h2>
          <p className="mt-3 whitespace-pre-line text-sm text-ink-muted">
            {product.description}
          </p>
        </div>

        {specs && specs.length > 0 && (
          <div className="mt-6 border-t border-line pt-6">
            <h2 className="text-lg">Specifications</h2>
            <dl className="mt-3 divide-y divide-line text-sm">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between py-2">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="font-medium text-ink">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}