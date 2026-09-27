"use client";

import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  pending: "#D89B3C",
  confirmed: "#5B6660",
  processing: "#146B5F",
  shipped: "#3E8F82",
  delivered: "#0E4F46",
  cancelled: "#B3492F",
};

type Stats = {
  byDay: { _id: string; revenue: number; orders: number }[];
  byStatus: Record<string, number>;
  topProducts: { _id: string; qty: number; revenue: number }[];
};

export function DashboardCharts({ stats }: { stats: Stats }) {
  const statusData = Object.entries(stats.byStatus).map(([name, value]) => ({ name, value }));

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold">Sales — last 30 days</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.byDay}>
              <CartesianGrid stroke="#EEF1EB" vertical={false} />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: "#8A938D" }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: "#8A938D" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #DEE3DC", fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#146B5F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold">Orders by status</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#C7CFC5"} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #DEE3DC", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded border border-line bg-surface p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold">Top selling products</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.topProducts} layout="vertical">
              <CartesianGrid stroke="#EEF1EB" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#8A938D" }} />
              <YAxis dataKey="_id" type="category" tick={{ fontSize: 11, fill: "#5B6660" }} width={140} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #DEE3DC", fontSize: 12 }} />
              <Bar dataKey="qty" fill="#D89B3C" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}