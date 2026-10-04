"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// ============================================================
// CONFIG
// ============================================================
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_FASTAPI_URL ??
  "https://ailanggraph-fiver-demo.vercel.app";

/** FastAPI route that returns ONE product. */
const PRODUCT_PATH = (id: string) => `/products/${encodeURIComponent(id)}`;

/** Param names we accept on the URL (?id=…, ?productId=…, ?pid=…) */
const ID_KEYS = ["id", "productId", "product_id", "pid", "sku"] as const;

// ============================================================
// TYPES
// ============================================================
interface ProductImage {
  url: string;
  alt?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  images: ProductImage[];
  category?: string;
  brand?: string;
  stock?: number;
  rating?: number;
  reviewsCount?: number;
  attributes?: Record<string, string | number | boolean>;
}

// ============================================================
// NORMALIZER — FastAPI field names vary; normalize once.
// ============================================================
function normalizeProduct(raw: any): Product {
  if (!raw || typeof raw !== "object") throw new Error("Malformed product payload");

  const id = String(raw.id ?? raw._id ?? raw.product_id ?? raw.sku ?? "");
  if (!id) throw new Error("Product payload has no id");

  const rawImages =
    raw.images ?? raw.image_urls ?? raw.pictures ?? (raw.image ? [raw.image] : []);

  const images: ProductImage[] = (Array.isArray(rawImages) ? rawImages : [])
    .map((img: any) => {
      if (typeof img === "string") return { url: img };
      if (img && typeof img === "object" && img.url)
        return { url: img.url, alt: img.alt };
      return null;
    })
    .filter(Boolean) as ProductImage[];

  return {
    id,
    name: String(raw.name ?? raw.title ?? raw.product_name ?? "Untitled product"),
    description: raw.description ?? raw.details ?? raw.long_description ?? "",
    price: Number(raw.price ?? raw.unit_price ?? 0),
    compareAtPrice:
      raw.compare_at_price != null
        ? Number(raw.compare_at_price)
        : raw.old_price != null
          ? Number(raw.old_price)
          : null,
    currency: raw.currency ?? "USD",
    images,
    category: raw.category ?? raw.category_name,
    brand: raw.brand ?? raw.brand_name,
    stock: raw.stock != null ? Number(raw.stock) : undefined,
    rating: raw.rating != null ? Number(raw.rating) : undefined,
    reviewsCount:
      raw.reviews_count != null
        ? Number(raw.reviews_count)
        : raw.review_count != null
          ? Number(raw.review_count)
          : undefined,
    attributes:
      raw.attributes && typeof raw.attributes === "object"
        ? raw.attributes
        : undefined,
  };
}

// ============================================================
// FETCH
// ============================================================
type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "notfound" }
  | { status: "ok"; product: Product };

async function fetchProduct(id: string, signal?: AbortSignal): Promise<FetchState> {
  const url = `${API_BASE}${PRODUCT_PATH(id)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    console.error(`[ai-asked-page] network error → ${url}`, err);
    return { status: "error", message: "Couldn't reach the product service." };
  }

  if (res.status === 404) return { status: "notfound" };

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[ai-asked-page] ${res.status} → ${url}: ${body.slice(0, 300)}`);
    return {
      status: "error",
      message: `Product service returned ${res.status}.`,
    };
  }

  const json = await res.json().catch(() => null);
  const payload = json?.data ?? json?.product ?? json;

  try {
    return { status: "ok", product: normalizeProduct(payload) };
  } catch (err: any) {
    console.error("[ai-asked-page] bad payload", payload);
    return { status: "error", message: "Product data was malformed." };
  }
}

// ============================================================
// HELPERS
// ============================================================
function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

/** Reads an id from ?id / ?productId / … or from a full URL the bot pasted. */
function useResolvedProductId(): string | null {
  const searchParams = useSearchParams();

  return useMemo(() => {
    // 1) direct query params
    for (const key of ID_KEYS) {
      const v = searchParams.get(key);
      if (v && v.trim()) return v.trim();
    }

    // 2) ?url=<full product link the AI sent>
    const rawUrl = searchParams.get("url");
    if (rawUrl) {
      try {
        const parsed = new URL(rawUrl, window.location.origin);
        for (const key of ID_KEYS) {
          const v = parsed.searchParams.get(key);
          if (v && v.trim()) return v.trim();
        }
        // fall back to last path segment: /products/abc-123
        const seg = parsed.pathname.split("/").filter(Boolean).pop();
        if (seg) return decodeURIComponent(seg);
      } catch {
        /* ignore */
      }
    }

    // 3) ?q=/products/abc-123
    const q = searchParams.get("q");
    if (q) {
      const seg = q.split("?")[0].split("/").filter(Boolean).pop();
      if (seg) return decodeURIComponent(seg);
    }

    return null;
  }, [searchParams]);
}

// ============================================================
// ICONS
// ============================================================
const ArrowLeftIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
  </svg>
);

const StarIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
  </svg>
);

// ============================================================
// SUB-VIEWS
// ============================================================
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}

function BackBar({ label = "Back" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
    >
      <ArrowLeftIcon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function Skeleton() {
  return (
    <PageShell>
      <div className="animate-pulse">
        <div className="mb-5 h-9 w-24 rounded-full bg-slate-200" />
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square rounded-2xl bg-slate-200" />
          <div className="space-y-4">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-8 w-3/4 rounded bg-slate-200" />
            <div className="h-6 w-32 rounded bg-slate-200" />
            <div className="h-24 w-full rounded bg-slate-200" />
            <div className="h-12 w-40 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function MessageState({
  emoji,
  title,
  body,
  action,
}: {
  emoji: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <PageShell>
      <BackBar />
      <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
          {emoji}
        </div>
        <h1 className="mt-4 text-lg font-semibold text-slate-800">{title}</h1>
        <p className="mt-1.5 text-sm text-slate-500">{body}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </PageShell>
  );
}

function ImageGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-slate-200 bg-white text-5xl text-slate-300">
        🖼️
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setZoom(true)}
          className="group relative block aspect-square w-full overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            unoptimized
            className="object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
          />
        </button>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={`${img.url}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-white transition ${
                  i === active
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `${name} ${i + 1}`}
                  fill
                  sizes="64px"
                  unoptimized
                  className="object-contain p-1"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {zoom && (
        <div
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <div className="relative h-[85vh] w-[90vw]">
            <Image
              src={current.url}
              alt={current.alt || name}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom(false);
            }}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

function ProductView({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const inStock = product.stock == null || product.stock > 0;
  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;
  const discount = onSale
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100
      )
    : 0;

  const handleAdd = useCallback(() => {
    // 🔌 Wire this to your cart store / API.
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }, []);

  return (
    <PageShell>
      <BackBar label="Back to chat" />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* ---------- LEFT: images ---------- */}
        <ImageGallery images={product.images} name={product.name} />

        {/* ---------- RIGHT: info ---------- */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
            {product.brand && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                {product.brand}
              </span>
            )}
            {product.category && (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-600">
                {product.category}
              </span>
            )}
            {inStock ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-600">
                In stock
                {product.stock != null && product.stock <= 5
                  ? ` · only ${product.stock} left`
                  : ""}
              </span>
            ) : (
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-600">
                Out of stock
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-semibold leading-snug text-slate-900 sm:text-3xl">
            {product.name}
          </h1>

          {product.rating != null && (
            <div className="mt-2 flex items-center gap-1.5 text-sm">
              <div className="flex text-amber-400">
                {[0, 1, 2, 3, 4].map((i) => (
                  <StarIcon
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(product.rating!)
                        ? "opacity-100"
                        : "opacity-25"
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium text-slate-700">
                {product.rating.toFixed(1)}
              </span>
              {product.reviewsCount != null && (
                <span className="text-slate-400">
                  ({product.reviewsCount} reviews)
                </span>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {formatMoney(product.price, product.currency)}
            </span>
            {onSale && (
              <>
                <span className="text-base text-slate-400 line-through">
                  {formatMoney(product.compareAtPrice!, product.currency)}
                </span>
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                  −{discount}%
                </span>
              </>
            )}
          </div>

          {product.description && (
            <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {product.description}
            </p>
          )}

          {/* ---------- quantity + CTA ---------- */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={!inStock || qty <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-l-full text-lg text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center text-sm font-semibold text-slate-800">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                disabled={!inStock}
                className="flex h-10 w-10 items-center justify-center rounded-r-full text-lg text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!inStock}
              className={`h-11 flex-1 min-w-[180px] rounded-full text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] ${
                !inStock
                  ? "cursor-not-allowed bg-slate-300"
                  : added
                    ? "bg-emerald-600"
                    : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {!inStock ? "Out of stock" : added ? "✓ Added to cart" : "Add to cart"}
            </button>
          </div>

          {/* ---------- attributes ---------- */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Specifications
              </div>
              <dl className="divide-y divide-slate-100">
                {Object.entries(product.attributes).map(([k, v]) => (
                  <div key={k} className="flex gap-4 px-4 py-2.5 text-sm">
                    <dt className="w-1/3 shrink-0 text-slate-500">{k}</dt>
                    <dd className="flex-1 font-medium text-slate-800">
                      {String(v)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

// ============================================================
// INNER — reads the query, fetches, renders
// ============================================================
function AiAskedPageInner() {
  const productId = useResolvedProductId();
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    if (!productId) return;

    const ctrl = new AbortController();
    setState({ status: "loading" });

    fetchProduct(productId, ctrl.signal)
      .then((next) => setState(next))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setState({ status: "error", message: "Something went wrong." });
      });

    return () => ctrl.abort();
  }, [productId]);

  if (!productId) {
    return (
      <MessageState
        emoji="🔍"
        title="No product specified"
        body="This page needs a product ID. Open it from the assistant's link, or add ?id=YOUR_PRODUCT_ID to the URL."
        action={
          <Link
            href="/"
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Go home
          </Link>
        }
      />
    );
  }

  if (state.status === "loading") return <Skeleton />;

  if (state.status === "notfound") {
    return (
      <MessageState
        emoji="📦"
        title="Product not found"
        body={`We couldn't find a product with the ID "${productId}".`}
        action={
          <Link
            href="/"
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Browse products
          </Link>
        }
      />
    );
  }

  if (state.status === "error") {
    return (
      <MessageState
        emoji="⚠️"
        title="Couldn't load this product"
        body={state.message}
        action={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            Try again
          </button>
        }
      />
    );
  }

  return <ProductView product={state.product} />;
}

// ============================================================
// DEFAULT EXPORT — Suspense is required because useSearchParams()
// bails out of static rendering in the App Router.
// ============================================================
export default function AiAskedPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <AiAskedPageInner />
    </Suspense>
  );
}