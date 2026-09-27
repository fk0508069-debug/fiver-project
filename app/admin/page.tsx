import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getDashboardStats } from "@/services/orderService";
import { KpiCard } from "@/components/admin/KpiCard";
import { DashboardCharts } from "@/components/admin/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const stats = await getDashboardStats();

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8">
        <h1 className="text-3xl">Dashboard</h1>
        <p className="mt-2 text-ink-muted">A live snapshot of your store.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total revenue" value={`$${stats.revenue.toLocaleString()}`} accent />
        <KpiCard label="Total orders" value={stats.orders} />
        <KpiCard label="Products" value={stats.products} />
        <KpiCard label="Customers" value={stats.customers} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Pending" value={stats.byStatus.pending ?? 0} />
        <KpiCard label="Delivered" value={stats.byStatus.delivered ?? 0} />
        <KpiCard label="Avg. order value" value={`$${stats.avgOrder.toLocaleString()}`} />
      </div>

      <DashboardCharts stats={stats} />
    </div>
  );
}