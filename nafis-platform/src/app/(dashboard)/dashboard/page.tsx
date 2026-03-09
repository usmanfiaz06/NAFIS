"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ShoppingCart,
  Delivery,
  WarningAlt,
  ArrowUp,
  Shuttle,
} from "@carbon/icons-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";

interface DashboardData {
  pipeline: { status: string; count: number; totalQuantity: number }[];
  origins: { country: string; count: number; totalQuantity: number }[];
  commodities: { name: string; count: number; totalQuantity: number }[];
  arrivals: any[];
  activeShipments: number;
  summary: {
    totalOrders: number;
    totalQuantityMT: number;
    totalValueSAR: number;
  };
  alerts: any[];
}

const PIE_COLORS = ["#0f62fe", "#198038", "#8a3ffc", "#005d5d", "#ee5396", "#fa4d56", "#f1c21b"];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const user = session?.user as any;
  const isRegulator = user?.role === "REGULATOR" || user?.role === "ADMIN";

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-[#e0e0e0] rounded w-48" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#e0e0e0] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const inTransitCount =
    data.pipeline.find((p) => p.status === "IN_TRANSIT")?.count || 0;
  const pendingApproval =
    data.pipeline.find((p) => p.status === "SUBMITTED")?.count || 0;
  const unreadAlerts = data.alerts.length;

  // Arrival forecast by week
  const arrivalByWeek: Record<string, number> = {};
  data.arrivals.forEach((a) => {
    const date = new Date(a.estimatedArrivalDate);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    arrivalByWeek[key] = (arrivalByWeek[key] || 0) + a.quantity;
  });
  const arrivalChartData = Object.entries(arrivalByWeek).map(([week, qty]) => ({
    week,
    quantity: Math.round(qty),
  }));

  return (
    <div>
      {/* Page header */}
      <div className="nafis-page-header">
        <h1 className="nafis-page-title">
          {isRegulator ? "Control Tower" : "Overview"}
        </h1>
        <p className="nafis-page-subtitle">
          {isRegulator
            ? "National food import pipeline intelligence"
            : "Your import orders at a glance"}
        </p>
      </div>

      {/* Summary cards - Zentra style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="nafis-card">
          <div className="nafis-card-header">
            <span className="nafis-card-title">Active Orders</span>
            <ShoppingCart size={20} className="text-[#8d8d8d]" />
          </div>
          <div className="nafis-big-number">{data.summary.totalOrders}</div>
          <div className="mt-3 flex items-center gap-1 text-xs text-[#198038]">
            <ArrowUp size={12} />
            <span>12% vs last period</span>
          </div>
        </div>

        <div className="nafis-card">
          <div className="nafis-card-header">
            <span className="nafis-card-title">In Transit</span>
            <Shuttle size={20} className="text-[#8d8d8d]" />
          </div>
          <div className="nafis-big-number">{inTransitCount}</div>
          <div className="mt-3 text-xs text-[#525252]">
            {data.activeShipments} vessels tracked
          </div>
        </div>

        <div className="nafis-card">
          <div className="nafis-card-header">
            <span className="nafis-card-title">Total Volume</span>
            <Delivery size={20} className="text-[#8d8d8d]" />
          </div>
          <div className="nafis-big-number">
            {Math.round(data.summary.totalQuantityMT).toLocaleString()}
          </div>
          <div className="mt-3 text-xs text-[#525252]">Metric Tons</div>
        </div>

        <div className="nafis-card">
          <div className="nafis-card-header">
            <span className="nafis-card-title">Alerts</span>
            <WarningAlt
              size={20}
              className={unreadAlerts > 0 ? "text-[#da1e28]" : "text-[#8d8d8d]"}
            />
          </div>
          <div className="nafis-big-number">{unreadAlerts}</div>
          <div className="mt-3 text-xs text-[#525252]">
            {pendingApproval} pending approval
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pipeline status */}
        <div className="nafis-card lg:col-span-2">
          <div className="nafis-card-header">
            <span className="nafis-card-title">Pipeline by Status</span>
          </div>
          <div className="flex gap-6 mb-6 flex-wrap">
            {data.pipeline.map((p) => (
              <div key={p.status} className="text-center">
                <div className="text-xs text-[#8d8d8d] mb-1">
                  {ORDER_STATUS_LABELS[p.status] || p.status}
                </div>
                <div className="text-lg font-semibold">{p.count}</div>
              </div>
            ))}
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pipeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => ORDER_STATUS_LABELS[v] || v}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(v) => ORDER_STATUS_LABELS[v] || v}
                  formatter={(value: any) => [`${value}`, "Orders"]}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  fill="#0f62fe"
                >
                  {data.pipeline.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={ORDER_STATUS_COLORS[entry.status] || "#0f62fe"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Origin concentration */}
        <div className="nafis-card">
          <div className="nafis-card-header">
            <span className="nafis-card-title">Origin Concentration</span>
          </div>
          <div className="h-48 flex items-center justify-center">
            {data.origins.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.origins}
                    dataKey="totalQuantity"
                    nameKey="country"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                    paddingAngle={2}
                  >
                    {data.origins.map((_, index) => (
                      <Cell
                        key={index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [
                      `${value.toLocaleString()} MT`,
                      "Volume",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#8d8d8d]">No data yet</p>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {data.origins.slice(0, 5).map((o, i) => (
              <div key={o.country} className="nafis-stat-row">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                  />
                  <span className="text-sm">{o.country}</span>
                </div>
                <span className="text-sm font-medium">
                  {Math.round(o.totalQuantity).toLocaleString()} MT
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arrival forecast */}
        <div className="nafis-card">
          <div className="nafis-card-header">
            <span className="nafis-card-title">Arrival Forecast (MT)</span>
          </div>
          {arrivalChartData.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={arrivalChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) => [
                      `${value.toLocaleString()} MT`,
                      "Volume",
                    ]}
                  />
                  <Bar dataKey="quantity" fill="#198038" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center">
              <p className="text-sm text-[#8d8d8d]">No upcoming arrivals</p>
            </div>
          )}
        </div>

        {/* Top commodities */}
        <div className="nafis-card">
          <div className="nafis-card-header">
            <span className="nafis-card-title">Top Commodities</span>
          </div>
          <div className="space-y-0">
            {data.commodities
              .sort((a, b) => b.totalQuantity - a.totalQuantity)
              .slice(0, 8)
              .map((c) => (
                <div key={c.name} className="nafis-stat-row">
                  <div>
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-xs text-[#8d8d8d] ml-2">
                      {c.count} orders
                    </span>
                  </div>
                  <span className="text-sm font-semibold">
                    {Math.round(c.totalQuantity).toLocaleString()} MT
                  </span>
                </div>
              ))}
            {data.commodities.length === 0 && (
              <div className="py-8 text-center text-sm text-[#8d8d8d]">
                No commodity data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts section */}
      {data.alerts.length > 0 && (
        <div className="mt-8">
          <div className="nafis-card" style={{ background: "linear-gradient(135deg, #fff7f7, #fff1f1)" }}>
            <div className="nafis-card-header">
              <span className="nafis-card-title">Recent Alerts</span>
              <span className="nafis-badge nafis-badge-danger">
                {data.alerts.length} unread
              </span>
            </div>
            <div className="space-y-3">
              {data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[#e0e0e0]"
                >
                  <WarningAlt
                    size={16}
                    className={
                      alert.severity === "CRITICAL" || alert.severity === "HIGH"
                        ? "text-[#da1e28] mt-0.5"
                        : "text-[#f1c21b] mt-0.5"
                    }
                  />
                  <div>
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-[#525252] mt-1">
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
