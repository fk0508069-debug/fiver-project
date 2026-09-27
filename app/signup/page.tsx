"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/Input";

function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCustomer } = useAuth();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fullName, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      setCustomer(data.customer);
      const next = searchParams.get("next") || "/account";
      window.location.href = next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-line bg-surface p-8 shadow">
      <h1 className="font-display text-2xl">Create your account</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Save addresses, track orders, check out faster.
      </p>

      <div className="mt-6 space-y-4">
        <Input
          label="Full name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Input
          label="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
        <Input
          label="Password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
      </div>

      {error && <p className="mt-4 rounded-sm bg-danger/10 p-3 text-sm text-danger">{error}</p>}

      <button disabled={loading} className="btn btn-primary btn-block mt-6">
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent-dark hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-ink-muted">Loading…</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}