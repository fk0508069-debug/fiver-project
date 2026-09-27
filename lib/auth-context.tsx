"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

export type Customer = { id: string; email: string; fullName: string };

type AuthCtx = {
  customer: Customer | null;
  loading: boolean;
  setCustomer: (c: Customer | null) => void;
  requireAuth: (redirectTo?: string) => boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setCustomer(d.customer ?? null);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Returns true if logged in. If not, redirects to /login and returns false.
   * Call this at the top of any protected action (add to cart, checkout, etc.)
   */
  function requireAuth(redirectTo?: string): boolean {
    if (customer) return true;
    const next = redirectTo ?? pathname ?? "/";
    router.push(`/login?next=${encodeURIComponent(next)}&reason=auth`);
    return false;
  }

  return (
    <Ctx.Provider value={{ customer, loading, setCustomer, requireAuth }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}