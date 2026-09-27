import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderByTracking } from "@/services/orderService";
import { formatCurrency, STATUS_FLOW, statusLabel } from "@/lib/utils";

type Props = { params: Promise<{ trackingNumber: string }> };   // ← Promise

export default async function OrderPage({ params }: Props) {
  const { trackingNumber } = await params;                        // ← await + destructure
  const order = await getOrderByTracking(trackingNumber);         // ← use the local var
  if (!order) notFound();

  const isCancelled = order.status === "cancelled";
  const currentIdx = isCancelled ? -1 : STATUS_FLOW.indexOf(order.status as never);

  return (
    <div className="container-x max-w-narrow py-12">
      <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-faint">Order confirmed</p>
            <h1 className="mt-1 font-display text-2xl">{order.trackingNumber}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Placed {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isCancelled ? "bg-danger/10 text-danger" : "bg-accent-soft text-accent-dark"
            }`}
          >
            {statusLabel(order.status)}
          </span>
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <ol className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {STATUS_FLOW.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                    i <= currentIdx
                      ? "bg-accent text-white"
                      : "border border-line-strong text-ink-faint"
                  }`}
                >
                  {i <= currentIdx ? "✓" : i + 1}
                </span>
                <span
                  className={`text-sm ${
                    i <= currentIdx ? "text-ink font-medium" : "text-ink-faint"
                  }`}
                >
                  {statusLabel(s)}
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="text-sm font-semibold">Customer</h2>
            <address className="mt-2 text-sm not-italic text-ink-muted">
              {order.customer.fullName}
              <br />
              {order.customer.email}
              <br />
              {order.customer.phone}
            </address>
          </section>
          <section>
            <h2 className="text-sm font-semibold">Shipping to</h2>
            <address className="mt-2 text-sm not-italic text-ink-muted">
              {order.customer.address}
              <br />
              {order.customer.city}, {order.customer.state} {order.customer.postalCode}
            </address>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold">Items</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {order.items.map(
              (item: {
                sku: string;
                name: string;
                quantity: number;
                unitPrice: number;
                lineTotal: number;
              }) => (
                <li key={item.sku} className="flex items-center justify-between py-2.5">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium">{formatCurrency(item.lineTotal)}</span>
                </li>
              )
            )}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd>{formatCurrency(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Shipping</dt>
              <dd>{order.shipping === 0 ? "Free" : formatCurrency(order.shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatCurrency(order.total)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="mt-6 text-center">
        <Link href="/products" className="btn btn-ghost">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}