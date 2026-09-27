import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getDashboardStats } from "@/services/orderService";
import { KpiCard } from "@/components/admin/KpiCard";
import { DashboardCharts } from "@/components/admin/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const stats = await getDashboardStats();

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl">Analytics</h1>
      <p className="mt-1 text-sm text-ink-muted">Store performance at a glance.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Revenue (30d)" value={`$${stats.revenue.toLocaleString()}`} accent />
        <KpiCard label="Orders (30d)" value={stats.orders} />
        <KpiCard label="Avg. order" value={`$${stats.avgOrder.toLocaleString()}`} />
        <KpiCard label="Active products" value={stats.products} />
      </div>

      <DashboardCharts stats={stats} />
    </div>
  );
}