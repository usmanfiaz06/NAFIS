"use client";

import { useEffect, useState } from "react";
import {
  Analytics,
  Earth,
  Delivery,
  Money,
  ShoppingCart,
  UserMultiple,
  ChartBubble,
  Calendar,
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
  AreaChart,
  Area,
  Treemap,
} from "recharts";

interface AnalyticsData {
  overview: {
    totalOrders: number;
    totalVolumeMT: number;
    totalValueSAR: number;
    avgOrderValueSAR: number;
    uniqueOrigins: number;
    uniqueSuppliers: number;
    uniqueCommodities: number;
  };
  volumeByCategory: { category: string; total: number; orders: number; value: number }[];
  originDiversification: {
    country: string;
    volume: number;
    orders: number;
    value: number;
    share: number;
    commodityCount: number;
    commodities: string[];
  }[];
  diversificationIndex: { hhi: number; rating: string };
  portUtilization: { port: string; portCode: string; volume: number; orders: number; arrivals: number }[];
  supplierPerformance: {
    name: string;
    orders: number;
    volume: number;
    value: number;
    commodities: string[];
    origins: string[];
    reliabilityScore: number | null;
  }[];
  trends: { month: string; volume: number; value: number; orders: number }[];
  upcomingArrivals: {
    commodity: string;
    quantity: number;
    origin: string;
    port: string;
    eta: string;
    daysUntil: number;
    vessel: string | null;
    status: string;
    supplier: string;
  }[];
  valueAnalysis: {
    totalValueSAR: number;
    avgOrderValueSAR: number;
    byCommod: { commodity: string; value: number; share: number }[];
  };
}

const PIE_COLORS = ["#0f62fe", "#198038", "#8a3ffc", "#005d5d", "#ee5396", "#fa4d56", "#f1c21b", "#002d9c", "#009d9a", "#a56eff"];

function formatSAR(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M SAR`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K SAR`;
  return `${amount} SAR`;
}

function DiversificationBadge({ rating }: { rating: string }) {
  const styles: Record<string, string> = {
    "Well Diversified": "nafis-badge nafis-badge-success",
    "Moderate": "nafis-badge nafis-badge-warning",
    "Highly Concentrated": "nafis-badge nafis-badge-danger",
  };
  return <span className={styles[rating] || "nafis-badge nafis-badge-neutral"}>{rating}</span>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  const treemapData = data.volumeByCategory.map((c, i) => ({
    name: c.category,
    size: c.total,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div>
      {/* Page header */}
      <div className="nafis-page-header">
        <h1 className="nafis-page-title">Import Analytics</h1>
        <p className="nafis-page-subtitle">
          Comprehensive analysis of Saudi Arabia&apos;s food import pipeline
        </p>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {[
          { label: "Total Orders", value: data.overview.totalOrders, icon: ShoppingCart },
          { label: "Volume (MT)", value: data.overview.totalVolumeMT.toLocaleString(), icon: Delivery },
          { label: "Total Value", value: formatSAR(data.overview.totalValueSAR), icon: Money },
          { label: "Avg Order", value: formatSAR(data.overview.avgOrderValueSAR), icon: Analytics },
          { label: "Origins", value: data.overview.uniqueOrigins, icon: Earth },
          { label: "Suppliers", value: data.overview.uniqueSuppliers, icon: UserMultiple },
          { label: "Commodities", value: data.overview.uniqueCommodities, icon: ChartBubble },
        ].map((kpi) => (
          <div key={kpi.label} className="nafis-card text-center">
            <kpi.icon size={18} className="mx-auto mb-2 text-[#8d8d8d]" />
            <div className="text-lg font-bold">{kpi.value}</div>
            <div className="text-[10px] text-[#525252]">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Category Volume + Origin Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Volume by Category */}
        <div className="nafis-card">
          <div className="nafis-card-header">
            <span className="nafis-card-title">Volume by Category</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.volumeByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(value: any) => [`${value.toLocaleString()} MT`, "Volume"]} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {data.volumeByCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Origin Diversification */}
        <div className="nafis-card">
          <div className="nafis-card-header">
            <span className="nafis-card-title">Origin Diversification</span>
            <DiversificationBadge rating={data.diversificationIndex.rating} />
          </div>
          <div className="flex gap-4">
            <div className="h-52 w-52 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.originDiversification.slice(0, 8)}
                    dataKey="volume"
                    nameKey="country"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={2}
                  >
                    {data.originDiversification.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value.toLocaleString()} MT`, "Volume"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 overflow-y-auto max-h-52">
              {data.originDiversification.map((o, i) => (
                <div key={o.country} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="flex-1 truncate">{o.country}</span>
                  <span className="font-medium">{o.share}%</span>
                  <span className="text-[#8d8d8d]">{o.commodityCount} items</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#e0e0e0] text-xs text-[#525252]">
                HHI: {data.diversificationIndex.hhi} — {data.diversificationIndex.rating}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Port Utilization + Value Treemap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Port Utilization */}
        <div className="nafis-card">
          <div className="nafis-card-header">
            <span className="nafis-card-title">Port Utilization</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.portUtilization}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="port" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value: any) => [`${value.toLocaleString()} MT`, "Volume"]} />
                <Bar dataKey="volume" fill="#0f62fe" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {data.portUtilization.map((p) => (
              <div key={p.portCode} className="text-xs text-center p-2 bg-[#f4f4f4] rounded-lg">
                <div className="font-medium">{p.port}</div>
                <div className="text-[#8d8d8d]">{p.orders} orders &middot; {p.arrivals} arrived</div>
              </div>
            ))}
          </div>
        </div>

        {/* Value by Commodity */}
        <div className="nafis-card">
          <div className="nafis-card-header">
            <span className="nafis-card-title">Import Value Distribution</span>
            <span className="text-xs text-[#8d8d8d]">Total: {formatSAR(data.valueAnalysis.totalValueSAR)}</span>
          </div>
          <div className="space-y-2">
            {data.valueAnalysis.byCommod.slice(0, 10).map((c, i) => (
              <div key={c.commodity} className="flex items-center gap-3">
                <span className="text-xs w-32 truncate">{c.commodity}</span>
                <div className="flex-1 h-5 bg-[#e0e0e0] rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max(8, c.share)}%`,
                      backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                  >
                    {c.share > 12 && (
                      <span className="text-[10px] text-white font-medium">{formatSAR(c.value)}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-medium w-10 text-right">{c.share}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Supplier Performance */}
      <div className="nafis-card mb-8">
        <div className="nafis-card-header">
          <span className="nafis-card-title">Supplier Performance</span>
          <span className="text-xs text-[#8d8d8d]">{data.supplierPerformance.length} suppliers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0]">
                <th className="text-left py-3 px-2 text-xs font-medium text-[#525252]">Supplier</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-[#525252]">Orders</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-[#525252]">Volume (MT)</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-[#525252]">Value (SAR)</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-[#525252]">Commodities</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-[#525252]">Origins</th>
                <th className="text-center py-3 px-2 text-xs font-medium text-[#525252]">Reliability</th>
              </tr>
            </thead>
            <tbody>
              {data.supplierPerformance.map((s) => (
                <tr key={s.name} className="border-b border-[#f4f4f4] hover:bg-[#f4f4f4]">
                  <td className="py-3 px-2 font-medium">{s.name}</td>
                  <td className="py-3 px-2 text-right">{s.orders}</td>
                  <td className="py-3 px-2 text-right">{s.volume.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right">{formatSAR(s.value)}</td>
                  <td className="py-3 px-2">
                    <div className="flex flex-wrap gap-1">
                      {s.commodities.slice(0, 2).map((c) => (
                        <span key={c} className="nafis-badge nafis-badge-neutral text-[10px]">{c}</span>
                      ))}
                      {s.commodities.length > 2 && (
                        <span className="text-[10px] text-[#8d8d8d]">+{s.commodities.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex flex-wrap gap-1">
                      {s.origins.map((o) => (
                        <span key={o} className="text-xs text-[#525252]">{o}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {s.reliabilityScore !== null ? (
                      <span className={`nafis-badge ${s.reliabilityScore >= 80 ? "nafis-badge-success" : s.reliabilityScore >= 60 ? "nafis-badge-warning" : "nafis-badge-danger"}`}>
                        {s.reliabilityScore}%
                      </span>
                    ) : (
                      <span className="text-xs text-[#8d8d8d]">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Upcoming Arrivals Timeline */}
      <div className="nafis-card">
        <div className="nafis-card-header">
          <span className="nafis-card-title flex items-center gap-2">
            <Calendar size={16} className="text-[#0f62fe]" />
            Arrival Timeline (Next 90 Days)
          </span>
          <span className="text-xs text-[#8d8d8d]">{data.upcomingArrivals.length} shipments</span>
        </div>
        <div className="space-y-2">
          {data.upcomingArrivals.slice(0, 12).map((a, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-[#f4f4f4] rounded-lg">
              <div className="flex-shrink-0 text-center w-14">
                <div className="text-lg font-bold text-[#0f62fe]">{a.daysUntil}</div>
                <div className="text-[10px] text-[#8d8d8d]">days</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{a.commodity}</span>
                  <span className="nafis-badge nafis-badge-neutral">{a.quantity.toLocaleString()} MT</span>
                </div>
                <div className="text-xs text-[#525252] mt-0.5">
                  {a.supplier} &middot; {a.origin} &rarr; {a.port}
                  {a.vessel && <> &middot; {a.vessel}</>}
                </div>
              </div>
              <div className="text-xs text-[#8d8d8d]">
                {new Date(a.eta).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
          ))}
          {data.upcomingArrivals.length === 0 && (
            <div className="py-8 text-center text-sm text-[#8d8d8d]">
              No upcoming arrivals in the next 90 days
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
