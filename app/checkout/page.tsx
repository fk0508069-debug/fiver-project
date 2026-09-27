"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/Input";

type Form = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
};

const EMPTY: Form = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  notes: "",
};

export default function CheckoutPage() {
  const { items, hydrated, subtotal, clear } = useCart();
  const { customer, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !customer) {
      router.replace("/login?next=/checkout&reason=checkout");
    }
  }, [customer, loading, router]);

  // Pre-fill from session
  useEffect(() => {
    if (customer) {
      setForm((f) => ({
        ...f,
        fullName: f.fullName || customer.fullName,
        email: f.email || customer.email,
      }));
    }
  }, [customer]);

  if (loading || !customer) {
    return (
      <div className="container-x py-20 text-center text-ink-muted">Loading…</div>
    );
  }

  if (hydrated && !items.length) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-3xl">Your cart is empty</h1>
        <Link href="/products" className="btn btn-primary btn-lg mt-8">
          Shop products
        </Link>
      </div>
    );
  }

  const shipping = subtotal >= 150 ? 0 : 12;
  const total = Math.round((subtotal + shipping) * 100) / 100;

  function validate(): boolean {
    const e: Partial<Record<keyof Form, string>> = {};
    if (form.fullName.trim().length < 2) e.fullName = "Please enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.phone.replace(/\D/g, "").length < 6) e.phone = "Enter a valid phone number";
    if (form.address.trim().length < 4) e.address = "Enter your street address";
    if (form.city.trim().length < 2) e.city = "Required";
    if (form.state.trim().length < 2) e.state = "Required";
    if (form.postalCode.trim().length < 3) e.postalCode = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customer: form,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");
      clear();
      router.push(`/order/${data.order.trackingNumber}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const field = (k: keyof Form) => ({
    name: k,
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
    error: errors[k],
  });

  return (
    <div className="container-x py-12">
      <h1 className="text-3xl">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <section className="rounded border border-line bg-surface p-6">
            <h2 className="text-lg">Contact</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Full name" required {...field("fullName")} />
              <Input label="Email" type="email" required {...field("email")} />
              <Input label="Phone" required {...field("phone")} />
            </div>
          </section>

          <section className="rounded border border-line bg-surface p-6">
            <h2 className="text-lg">Shipping address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label="Street address" required {...field("address")} />
              </div>
              <Input label="City" required {...field("city")} />
              <Input label="State / Province" required {...field("state")} />
              <Input label="Postal code" required {...field("postalCode")} />
            </div>
            <div className="mt-4">
              <label className="label">Additional notes (optional)</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="input resize-none"
              />
            </div>
          </section>
        </div>

        <aside className="h-fit rounded border border-line bg-surface p-6">
          <h2 className="text-lg">Order summary</h2>
          <div className="mt-4 space-y-3">
            {items.map((i) => (
              <div key={i.productId} className="flex items-center gap-3 text-sm">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-sm bg-surface-alt">
                  {i.image && (
                    <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.name}</p>
                  <p className="text-xs text-ink-muted">
                    Qty {i.quantity} × {formatCurrency(i.price)}
                  </p>
                </div>
                <span className="font-medium">{formatCurrency(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
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
          {serverError && (
            <p className="mt-4 rounded-sm bg-danger/10 p-3 text-sm text-danger">
              {serverError}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-lg btn-block mt-5 disabled:opacity-60"
          >
            {submitting ? "Placing order…" : "Place order"}
          </button>
        </aside>
      </form>
    </div>
  );
}