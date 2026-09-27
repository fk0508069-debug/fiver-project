"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { SearchBar } from "./SearchBar";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { customer, setCustomer, loading: authLoading } = useAuth();
  const { count } = useCart();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setCustomer(null);
    window.location.href = "/";
  }

  const links = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop" },
    { href: "/products?featured=1", label: "Featured" },
    { href: "/track-order", label: "Track order" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-cream/85 backdrop-blur transition-colors ${
        scrolled ? "border-line" : "border-transparent"
      }`}
    >
      <div className="container-x flex h-[72px] items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <svg viewBox="0 0 28 28" width="26" height="26" fill="none" className="text-accent">
            <path
              d="M4 14c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M9 14a5 5 0 0 1 5-5"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-xl font-semibold tracking-tight">Flowline</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-7 text-sm font-medium lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-ink-muted transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden md:block md:w-64 lg:w-80">
          <SearchBar onNavigate={() => setSearchOpen(false)} />
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <button
            className="md:hidden rounded-sm border border-line-strong p-2 text-ink-muted"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {/* Auth area */}
          {authLoading ? (
            <div className="hidden h-8 w-20 animate-pulse rounded-sm bg-surface-alt sm:block" />
          ) : customer ? (
            <div className="hidden items-center gap-1 sm:flex">
              <Link
                href="/account"
                className="rounded-sm border border-line-strong px-3 py-2 text-xs font-medium text-ink hover:border-ink"
              >
                {customer.fullName.split(" ")[0]}
              </Link>
              <button
                onClick={logout}
                className="rounded-sm border border-line-strong px-3 py-2 text-xs font-medium text-ink-muted hover:text-danger"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-1 sm:flex">
              <Link
                href="/login"
                className="rounded-sm border border-line-strong px-3 py-2 text-xs font-medium text-ink hover:border-ink"
              >
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </div>
          )}

          {/* Cart — visible only when logged in */}
          {customer && (
            <Link
              href="/cart"
              className="relative rounded-sm border border-line-strong p-2 text-ink"
              aria-label="Cart"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path
                  d="M3 5h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="20.5" r="1.4" fill="currentColor" />
                <circle cx="18" cy="20.5" r="1.4" fill="currentColor" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          )}

          <button
            className="lg:hidden rounded-sm border border-line-strong p-2"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-line bg-cream px-4 py-3 md:hidden">
          <SearchBar
            onNavigate={() => {
              setSearchOpen(false);
              router.push("/products");
            }}
          />
        </div>
      )}

      {mobileOpen && (
        <nav className="border-t border-line bg-cream lg:hidden">
          <div className="container-x flex flex-col py-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="border-b border-line py-3 text-[.95rem] font-medium text-ink-muted last:border-0 hover:text-ink"
              >
                {l.label}
              </Link>
            ))}

            <div className="mt-2 flex gap-2 border-t border-line pt-3">
              {customer ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="btn btn-ghost btn-sm flex-1"
                  >
                    My account
                  </Link>
                  <button onClick={logout} className="btn btn-ghost btn-sm flex-1">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn btn-ghost btn-sm flex-1"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}