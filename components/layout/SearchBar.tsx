"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, effectivePrice } from "@/lib/utils";

type Result = {
  _id: string; name: string; price: number; discount?: number; images: string[];
};

export function SearchBar({ onNavigate }: { onNavigate?: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounce search — avoids hammering the API on every keystroke
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); setOpen(false); return; }
    const controller = new AbortController();
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(data.items ?? []);
        setOpen(true);
      } catch { /* aborted */ }
      finally { setLoading(false); }
    }, 300);
    return () => { clearTimeout(id); controller.abort(); };
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/products?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={submit} className="relative">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products, categories…"
          className="input pl-9"
          aria-label="Search products"
        />
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded border border-line bg-surface shadow-lg animate-fade-in">
          {loading && <p className="p-4 text-sm text-ink-muted">Searching…</p>}
          {!loading && results.length === 0 && (
            <p className="p-4 text-sm text-ink-muted">No products found for “{q}”.</p>
          )}
          {!loading && results.map((r) => {
            const unit = effectivePrice(r.price, r.discount ?? 0);
            return (
              <Link
                key={r._id}
                href={`/products/${r._id}`}
                onClick={() => { setOpen(false); onNavigate?.(); }}
                className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0 hover:bg-surface-alt"
              >
                <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-sm bg-surface-alt">
                  {r.images?.[0] && <Image src={r.images[0]} alt="" fill sizes="44px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-ink-muted">{formatCurrency(unit)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}