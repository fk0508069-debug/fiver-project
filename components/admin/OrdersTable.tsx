"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useState } from "react";
import { formatCurrency, statusLabel } from "@/lib/utils";

type Order = {
  _id: string;
  trackingNumber: string;
  customer: { fullName: string; email: string; phone: string };
  items: { name: string; quantity: number }[];
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

export function OrdersTable({
  data,
  filters,
}: {
  data: { items: Order[]; total: number; page: number; totalPages: number };
  filters: Record<string, string>;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [expanded, setExpanded] = useState<string | null>(null);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`/admin/orders?${params.toString()}`);
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  const statuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <input
          defaultValue={filters.q ?? ""}
          onBlur={(e) => updateParam("q", e.target.value)}
          placeholder="Search tracking / name / email…"
          className="input"
        />
        <select
          defaultValue={filters.status ?? ""}
          onChange={(e) => updateParam("status", e.target.value)}
          className="input"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        <input
          type="date"
          defaultValue={filters.from ?? ""}
          onChange={(e) => updateParam("from", e.target.value)}
          className="input"
        />
        <input
          type="date"
          defaultValue={filters.to ?? ""}
          onChange={(e) => updateParam("to", e.target.value)}
          className="input"
        />
      </div>

      <div className="overflow-x-auto rounded border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-alt text-left text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="p-3">Tracking</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.items.map((o) => (
              <Fragment key={o._id}>
                <tr
                  className="cursor-pointer hover:bg-surface-alt"
                  onClick={() => setExpanded(expanded === o._id ? null : o._id)}
                >
                  <td className="p-3 font-mono text-xs">{o.trackingNumber}</td>
                  <td className="p-3">
                    <p className="font-medium">{o.customer.fullName}</p>
                    <p className="text-xs text-ink-muted">{o.customer.email}</p>
                  </td>
                  <td className="p-3 text-ink-muted">
                    {o.items.reduce((n, i) => n + i.quantity, 0)}
                  </td>
                  <td className="p-3 font-medium">{formatCurrency(o.total)}</td>
                  <td className="p-3">
                    <select
                      value={o.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setStatus(o._id, e.target.value)}
                      className="rounded-sm border border-line bg-surface px-2 py-1 text-xs"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-ink-muted">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>

                {expanded === o._id && (
                  <tr className="bg-surface-alt">
                    <td colSpan={6} className="p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                            Contact
                          </h4>
                          <p className="mt-1 text-sm">{o.customer.phone}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                            Items
                          </h4>
                          <ul className="mt-1 text-sm">
                            {o.items.map((it, i) => (
                              <li key={i}>
                                {it.name} × {it.quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <Link
                        href={`/order/${o.trackingNumber}`}
                        className="mt-3 inline-block text-xs font-medium text-accent-dark hover:underline"
                      >
                        View customer order page →
                      </Link>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!data.items.length && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink-muted">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.totalPages > 1 && (
        <nav className="mt-6 flex gap-2">
          {Array.from({ length: data.totalPages }).map((_, i) => {
            const n = i + 1;
            const params = new URLSearchParams(sp.toString());
            params.set("page", String(n));
            return (
              <Link
                key={n}
                href={`/admin/orders?${params}`}
                className={`rounded-sm border px-3 py-1.5 text-sm ${
                  n === data.page ? "border-accent bg-accent text-white" : "border-line"
                }`}
              >
                {n}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}