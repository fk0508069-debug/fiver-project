import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import Chatbot from "@/components/chatbot";
import { listProducts } from "@/services/productService";
import { ProductGrid } from "@/components/products/ProductGrid";
import type { ProductLite } from "@/components/products/ProductCard";

export const revalidate = 120;

async function isLoggedIn(): Promise<boolean> {
  const store = await cookies();
  return Boolean(store.get("customer_session")?.value);
}

export default async function HomePage() {
  const [featured, newArrivals, bestSellers, loggedIn] = await Promise.all([
    listProducts({ featured: true, limit: 4, activeOnly: true, inStockOnly: false }),
    listProducts({ limit: 4, sort: "newest", activeOnly: true }),
    listProducts({ limit: 4, sort: "popular", activeOnly: true }),
    isLoggedIn(),
  ]);

  return (
    <>
      {loggedIn && <Chatbot />}

      {/* HERO — theme preserved, e-commerce messaging */}
      <section className="overflow-hidden pb-16 pt-14">
        <div className="container-x grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> New autumn collection
            </span>
            <h1 className="mt-5 max-w-[16ch] text-[clamp(2.1rem,1.6rem+2.4vw,3.4rem)]">
              Work better with objects built to last
            </h1>
            <p className="mt-5 max-w-[46ch] text-[1.08rem] text-ink-muted">
              Desks, lighting, seating and accessories — designed for calm, focused work. Free shipping over $150.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn btn-primary btn-lg">Shop the collection</Link>
              <Link href="/products?featured=1" className="btn btn-ghost btn-lg">Browse featured</Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-ink-muted">
              <span className="tracking-wider text-gold">★★★★★</span>
              <span>4.8/5 from 1,200+ happy customers</span>
            </p>
          </div>

          <div className="animate-rise-scale">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
              {featured.items[0]?.images?.[0] && (
                <Image
                  src={featured.items[0].images[0]}
                  alt={featured.items[0].name}
                  fill priority sizes="(max-width:1024px) 100vw, 50vw"
                  className="object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-y border-line py-14">
        <div className="container-x text-center">
          <p className="mx-auto max-w-[46ch] text-ink-muted">Loved by teams at</p>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-10 gap-y-6 font-display text-lg text-ink-faint">
            <li>Northwind</li><li>Ridgeline</li><li>Verve Health</li>
            <li>Anchorpoint</li><li>Solace Co.</li><li>Marlow Group</li>
          </ul>
        </div>
      </section>

      {/* FEATURED */}
      <section className="py-16">
        <div className="container-x">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl">Featured</h2>
              <p className="mt-2 text-ink-muted">Handpicked pieces we think you'll love.</p>
            </div>
            <Link href="/products?featured=1" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          <ProductGrid products={featured.items as unknown as ProductLite[]} />
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="bg-surface-alt py-16">
        <div className="container-x">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl">New arrivals</h2>
              <p className="mt-2 text-ink-muted">Just landed in the shop.</p>
            </div>
            <Link href="/products?sort=newest" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          <ProductGrid products={newArrivals.items as unknown as ProductLite[]} />
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="py-16">
        <div className="container-x">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl">Best sellers</h2>
              <p className="mt-2 text-ink-muted">What everyone else already owns.</p>
            </div>
            <Link href="/products?sort=popular" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          <ProductGrid products={bestSellers.items as unknown as ProductLite[]} />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-accent-dark py-20 text-white">
        <div className="container-x mx-auto max-w-[560px] text-center">
          <h2 className="text-3xl text-white">Free shipping on orders over $150</h2>
          <p className="mt-3 text-white/80">Plus 30-day returns on everything, always.</p>
          <Link href="/products" className="btn btn-lg mt-8 bg-white text-accent-dark hover:bg-accent-soft">
            Shop now
          </Link>
        </div>
      </section>
    </>
  );
}