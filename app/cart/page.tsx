"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/utils";
import { QuantitySelector } from "@/components/products/QuantitySelector";

export default function CartPage() {
  const { items, hydrated, subtotal, setQuantity, remove, clear } = useCart();
  const { customer, loading } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !customer) {
      router.replace("/login?next=/cart&reason=cart");
    }
  }, [customer, loading, router]);

  // While checking auth, show nothing (avoids flicker)
  if (loading || !customer) {
    return (
      <div className="container-x py-20 text-center text-ink-muted">
        Loading…
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="container-x py-20 text-center text-ink-muted">Loading cart…</div>
    );
  }

  if (!items.length) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-3xl">Your cart is empty</h1>
        <p className="mt-3 text-ink-muted">Looks like you haven’t added anything yet.</p>
        <Link href="/products" className="btn btn-primary btn-lg mt-8">
          Continue shopping
        </Link>
      </div>
    );
  }

  const shipping = subtotal >= 150 ? 0 : 12;
  const total = Math.round((subtotal + shipping) * 100) / 100;

  return (
    <div className="container-x py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl">Your cart</h1>
        <button onClick={clear} className="text-sm text-ink-muted hover:text-danger">
          Clear cart
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-line rounded border border-line bg-surface">
          {items.map((item) => (
            <div key={item.productId} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
              <Link
                href={`/products/${item.productId}`}
                className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-sm bg-surface-alt"
              >
                {item.image && (
                  <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.productId}`}
                  className="font-medium hover:text-accent"
                >
                  {item.name}
                </Link>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {formatCurrency(item.price)} each
                </p>
              </div>
              <QuantitySelector
                value={item.quantity}
                onChange={(v) => setQuantity(item.productId, v)}
                max={item.stock}
              />
              <div className="w-24 text-right font-semibold">
                {formatCurrency(item.price * item.quantity)}
              </div>
              <button
                onClick={() => remove(item.productId)}
                aria-label="Remove"
                className="text-ink-faint hover:text-danger"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded border border-line bg-surface p-6">
          <h2 className="text-lg">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Shipping</dt>
              <dd>{shipping === 0 ? "Free" : formatCurrency(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatCurrency(total)}</dd>
            </div>
          </dl>
          <Link href="/checkout" className="btn btn-primary btn-lg btn-block mt-5">
            Checkout
          </Link>
          <Link
            href="/products"
            className="mt-3 block text-center text-sm text-ink-muted hover:text-ink"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}