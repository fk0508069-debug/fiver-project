"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { effectivePrice, formatCurrency } from "@/lib/utils";

export type ProductLite = {
  _id: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  price: number;
  discount?: number;
  images: string[];
  stock: number;
  category?: string;
};

export function ProductCard({ product }: { product: ProductLite }) {
  const { add } = useCart();
  const { requireAuth } = useAuth();
  const [adding, setAdding] = useState(false);

  const unit = effectivePrice(product.price, product.discount ?? 0);
  const outOfStock = product.stock <= 0;
  const href = `/products/${product._id}`;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (outOfStock) return;

    // Require login before adding to cart
    if (!requireAuth(href)) return;

    setAdding(true);
    add({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] ?? "",
      price: unit,
      quantity: 1,
      stock: product.stock,
    });
    setTimeout(() => setAdding(false), 700);
  }

  return (
    <article className="card group overflow-hidden hover:-translate-y-0.5 hover:shadow">
      <Link href={href} className="block">
        <div className="relative aspect-square overflow-hidden bg-surface-alt">
          {product.images?.[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          {product.discount ? (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-danger px-2.5 py-1 text-[11px] font-bold text-white">
              −{product.discount}%
            </span>
          ) : null}
          {outOfStock && (
            <span className="absolute right-2.5 top-2.5 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-white">
              Out of stock
            </span>
          )}
        </div>
        <div className="p-3 sm:p-4">
          {product.category && (
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
              {product.category}
            </p>
          )}
          <h3 className="mt-1 line-clamp-2 text-[.95rem] font-medium leading-snug">
            {product.name}
          </h3>
          {product.shortDescription && (
            <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
              {product.shortDescription}
            </p>
          )}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-lg text-ink">{formatCurrency(unit)}</span>
            {product.discount ? (
              <span className="text-xs text-ink-faint line-through">
                {formatCurrency(product.price)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
     
    </article>
  );
}