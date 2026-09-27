import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { listOrders } from "@/services/orderService";
import { OrdersTable } from "@/components/admin/OrdersTable";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const sp = await searchParams;
  const data = await listOrders({
    page: Number(sp.page ?? 1),
    limit: 20,
    status: sp.status,
    q: sp.q,
    from: sp.from,
    to: sp.to,
  });

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl">Orders</h1>
      <p className="mt-1 text-sm text-ink-muted">{data.total} orders</p>
      <OrdersTable data={JSON.parse(JSON.stringify(data))} filters={sp} />
    </div>
  );
}