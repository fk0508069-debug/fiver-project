"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/Input";

const REASON_MESSAGES: Record<string, string> = {
  auth: "Please sign in to add items to your cart.",
  cart: "Please sign in to view your cart.",
  checkout: "Please sign in to continue to checkout.",
};

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCustomer } = useAuth();

  const reason = searchParams.get("reason");
  const reasonMsg = reason ? REASON_MESSAGES[reason] : null;
  const next = searchParams.get("next") || "/";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      setCustomer(data.customer);
      window.location.href = next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-line bg-surface p-8 shadow">
      <h1 className="font-display text-2xl">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-muted">Sign in to your Flowline account.</p>

      {reasonMsg && (
        <p className="mt-4 rounded-sm bg-accent-soft p-3 text-sm text-accent-dark">
          {reasonMsg}
        </p>
      )}

      <div className="mt-6 space-y-4">
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>

      {error && <p className="mt-4 rounded-sm bg-danger/10 p-3 text-sm text-danger">{error}</p>}

      <button disabled={loading} className="btn btn-primary btn-block mt-6">
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <p className="mt-6 text-center text-sm text-ink-muted">
        New to Flowline?{" "}
        <Link
          href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-accent-dark hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-ink-muted">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}