import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customerAuth";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { formatCurrency, statusLabel } from "@/lib/utils";
import { SignOutButton } from "@/components/account/SignOutButton";
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/login?next=/account");

  await connectDB();
  const ordersRaw = await Order.find({
    $or: [{ customerId: session.id }, { "customer.email": session.email }],
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const orders = JSON.parse(JSON.stringify(ordersRaw));

  return (
    <div className="container-x max-w-3xl py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Hi, {session.fullName.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-ink-muted">{session.email}</p>
        </div>
        <form action="/api/auth/logout" method="POST">
        <SignOutButton />
        </form>
      </header>

      <section>
        <h2 className="text-xl">Your orders</h2>
        {orders.length === 0 ? (
          <div className="mt-4 rounded border border-line bg-surface p-8 text-center">
            <p className="text-ink-muted">You haven’t placed any orders yet.</p>
            <Link href="/products" className="btn btn-primary btn-sm mt-4">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded border border-line bg-surface">
            {orders.map((o: any) => (
              <li key={String(o._id)} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/order/${o.trackingNumber}`}
                    className="font-mono text-sm font-medium hover:text-accent"
                  >
                    {o.trackingNumber}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {new Date(o.createdAt).toLocaleDateString()} · {o.items.length} item
                    {o.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    o.status === "cancelled"
                      ? "bg-danger/10 text-danger"
                      : "bg-accent-soft text-accent-dark"
                  }`}
                >
                  {statusLabel(o.status)}
                </span>
                <span className="w-24 text-right font-semibold">
                  {formatCurrency(o.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}