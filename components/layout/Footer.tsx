import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-ink text-white/70">
      <div className="container-x grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2 text-white">
            <svg viewBox="0 0 28 28" width="24" height="24" fill="none" className="text-accent">
              <path d="M4 14c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
              <path d="M9 14a5 5 0 0 1 5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
            </svg>
            <span className="font-display text-lg font-semibold">Flowline</span>
          </Link>
          <p className="mt-3 text-sm">Curated workspaces essentials, built to last.</p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-white">Shop</h4>
          <div className="flex flex-col gap-2.5 text-sm">
            <Link href="/products" className="hover:text-white">All products</Link>
            <Link href="/products?featured=1" className="hover:text-white">Featured</Link>
            <Link href="/products?sort=popular" className="hover:text-white">Best sellers</Link>
            <Link href="/track-order" className="hover:text-white">Track order</Link>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-white">Support</h4>
          <div className="flex flex-col gap-2.5 text-sm">
            <a href="mailto:hello@flowline.example" className="hover:text-white">hello@flowline.example</a>
            <a href="tel:+18005551234" className="hover:text-white">+1 (800) 555-1234</a>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-white">Company</h4>
          <div className="flex flex-col gap-2.5 text-sm">
            <Link href="/" className="hover:text-white">About</Link>
            <Link href="/" className="hover:text-white">Privacy</Link>
            <Link href="/" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </div>
      <div className="container-x flex flex-wrap justify-between gap-3 border-t border-white/10 py-6 text-xs">
        <p>© {new Date().getFullYear()} Flowline, Inc. All rights reserved.</p>
        <p>148 Harbor Street, Suite 400 · Seattle, WA</p>
      </div>
    </footer>
  );
}