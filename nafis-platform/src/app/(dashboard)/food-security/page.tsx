"use client";

import { useEffect, useState } from "react";
import {
  WarningAlt,
  Checkmark,
  ArrowDown,
  ArrowUp,
  ShoppingCart,
  Earth,
  Delivery,
  ChartBubble,
} from "@carbon/icons-react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface CommodityScore {
  commodity: string;
  overallScore: number;
  supplyScore: number;
  originDiversityScore: number;
  supplierDiversityScore: number;
  pipelineHealthScore: number;
  riskLevel: string;
  daysOfSupply: number;
  targetDays: number;
  criticalDays: number;
  warningDays: number;
  inPipelineMT: number;
  inTransitMT: number;
  dailyConsumptionMT: number;
  origins: { country: string; qty: number; pct: number }[];
  suppliers: { supplier: string; qty: number; pct: number }[];
  concentrationWarnings: { country: string; percentage: number; recommendation: string }[];
  nearestArrivalDays: number | null;
  orderCount: number;
}

interface FoodSecurityData {
  nationalScore: number;
  nationalRiskLevel: string;
  summary: {
    totalCommoditiesTracked: number;
    critical: number;
    warning: number;
    healthy: number;
    totalPipelineMT: number;
    totalOrders: number;
    activeAlerts: number;
  };
  commodityScores: CommodityScore[];
  topRisks: { commodity: string; riskLevel: string; score: number; reason: string }[];
  concentrationWarnings: { commodity: string; country: string; percentage: number; recommendation: string; score: number }[];
  alerts: any[];
}

function ScoreGauge({ score, size = 160, label }: { score: number; size?: number; label?: string }) {
  const color = score >= 70 ? "#198038" : score >= 45 ? "#f1c21b" : "#da1e28";
  const data = [{ value: score, fill: color }];

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size / 2 + 20, position: "relative" }}>
        <ResponsiveContainer width="100%" height={size}>
          <RadialBarChart
            cx="50%"
            cy="100%"
            innerRadius="60%"
            outerRadius="90%"
            startAngle={180}
            endAngle={0}
            data={data}
            barSize={12}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background={{ fill: "#e0e0e0" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div
          className="absolute inset-0 flex flex-col items-center justify-end pb-1"
          style={{ color }}
        >
          <span className="text-3xl font-bold">{score}</span>
          <span className="text-xs text-[#525252]">/100</span>
        </div>
      </div>
      {label && <span className="text-xs text-[#525252] mt-1">{label}</span>}
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    CRITICAL: "nafis-badge nafis-badge-danger",
    WARNING: "nafis-badge nafis-badge-warning",
    HEALTHY: "nafis-badge nafis-badge-success",
    STABLE: "nafis-badge nafis-badge-success",
  };
  return <span className={styles[level] || "nafis-badge nafis-badge-neutral"}>{level}</span>;
}

function SupplyBar({ days, target, critical, warning }: { days: number; target: number; critical: number; warning: number }) {
  const pct = Math.min(100, (days / target) * 100);
  const color = days <= critical ? "#da1e28" : days <= warning ? "#f1c21b" : "#198038";

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-[#525252] mb-1">
        <span>{days} days</span>
        <span className="text-[#8d8d8d]">Target: {target}d</span>
      </div>
      <div className="w-full h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[#8d8d8d] mt-0.5">
        <span>Critical: {critical}d</span>
        <span>Warning: {warning}d</span>
      </div>
    </div>
  );
}

export default function FoodSecurityPage() {
  const [data, setData] = useState<FoodSecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityScore | null>(null);

  useEffect(() => {
    fetch("/api/food-security")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.commodityScores?.length > 0) setSelectedCommodity(d.commodityScores[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-[#e0e0e0] rounded w-64" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#e0e0e0] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const scoreColor = data.nationalScore >= 70 ? "#198038" : data.nationalScore >= 45 ? "#f1c21b" : "#da1e28";

  return (
    <div>
      {/* Page header */}
      <div className="nafis-page-header">
        <h1 className="nafis-page-title">Food Security Intelligence</h1>
        <p className="nafis-page-subtitle">
          National food import security scoring, risk analysis & predictive alerts
        </p>
      </div>

      {/* National Score Hero */}
      <div
        className="nafis-card mb-8"
        style={{
          background: `linear-gradient(135deg, ${
            data.nationalRiskLevel === "CRITICAL"
              ? "#fff1f1, #fff7f7"
              : data.nationalRiskLevel === "WARNING"
              ? "#fcf4d6, #fffdf5"
              : "#defbe6, #f0fff4"
          })`,
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-8">
            <ScoreGauge score={data.nationalScore} size={180} />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold">National Food Security Index</h2>
                <RiskBadge level={data.nationalRiskLevel} />
              </div>
              <p className="text-sm text-[#525252] max-w-md">
                Composite score based on supply adequacy, origin diversification,
                supplier resilience, and pipeline health across {data.summary.totalCommoditiesTracked} tracked commodities.
              </p>
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-[#da1e28]">{data.summary.critical}</div>
                  <div className="text-xs text-[#525252]">Critical</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#8e6a00]">{data.summary.warning}</div>
                  <div className="text-xs text-[#525252]">Warning</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#198038]">{data.summary.healthy}</div>
                  <div className="text-xs text-[#525252]">Healthy</div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white/60 rounded-lg">
              <ShoppingCart size={20} className="mx-auto mb-1 text-[#525252]" />
              <div className="text-lg font-bold">{data.summary.totalOrders}</div>
              <div className="text-xs text-[#525252]">Active Orders</div>
            </div>
            <div className="text-center p-4 bg-white/60 rounded-lg">
              <Delivery size={20} className="mx-auto mb-1 text-[#525252]" />
              <div className="text-lg font-bold">{data.summary.totalPipelineMT.toLocaleString()}</div>
              <div className="text-xs text-[#525252]">Pipeline (MT)</div>
            </div>
            <div className="text-center p-4 bg-white/60 rounded-lg">
              <Earth size={20} className="mx-auto mb-1 text-[#525252]" />
              <div className="text-lg font-bold">{data.commodityScores.length}</div>
              <div className="text-xs text-[#525252]">Commodities</div>
            </div>
            <div className="text-center p-4 bg-white/60 rounded-lg">
              <WarningAlt size={20} className="mx-auto mb-1 text-[#525252]" />
              <div className="text-lg font-bold">{data.summary.activeAlerts}</div>
              <div className="text-xs text-[#525252]">Active Alerts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Risks */}
      {data.topRisks.length > 0 && (
        <div className="nafis-card mb-8" style={{ background: "linear-gradient(135deg, #fff7f7, #ffffff)" }}>
          <div className="nafis-card-header">
            <span className="nafis-card-title flex items-center gap-2">
              <WarningAlt size={16} className="text-[#da1e28]" />
              Priority Risks
            </span>
            <span className="nafis-badge nafis-badge-danger">{data.topRisks.length} items</span>
          </div>
          <div className="space-y-3">
            {data.topRisks.map((risk, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 bg-white rounded-lg border border-[#e0e0e0]"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: risk.riskLevel === "CRITICAL" ? "#fff1f1" : "#fcf4d6",
                    color: risk.riskLevel === "CRITICAL" ? "#da1e28" : "#8e6a00",
                  }}
                >
                  {risk.riskLevel === "CRITICAL" ? <ArrowDown size={16} /> : <WarningAlt size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{risk.commodity}</span>
                    <RiskBadge level={risk.riskLevel} />
                    <span className="text-xs text-[#8d8d8d]">Score: {risk.score}/100</span>
                  </div>
                  <p className="text-xs text-[#525252] mt-0.5">{risk.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commodity Scores Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Commodity list */}
        <div className="nafis-card lg:col-span-1">
          <div className="nafis-card-header">
            <span className="nafis-card-title">Commodity Scores</span>
          </div>
          <div className="space-y-1 max-h-[480px] overflow-y-auto">
            {data.commodityScores.map((c) => (
              <button
                key={c.commodity}
                onClick={() => setSelectedCommodity(c)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center justify-between ${
                  selectedCommodity?.commodity === c.commodity
                    ? "bg-[#edf5ff] border border-[#0f62fe]"
                    : "hover:bg-[#f4f4f4] border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{
                      backgroundColor:
                        c.overallScore >= 70 ? "#198038" : c.overallScore >= 45 ? "#f1c21b" : "#da1e28",
                    }}
                  >
                    {c.overallScore}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.commodity}</div>
                    <div className="text-xs text-[#8d8d8d]">{c.daysOfSupply}d supply</div>
                  </div>
                </div>
                <RiskBadge level={c.riskLevel} />
              </button>
            ))}
          </div>
        </div>

        {/* Selected commodity detail */}
        <div className="nafis-card lg:col-span-2">
          {selectedCommodity ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">{selectedCommodity.commodity}</h3>
                  <p className="text-xs text-[#525252]">
                    {selectedCommodity.orderCount} active orders &middot; {selectedCommodity.inPipelineMT.toLocaleString()} MT in pipeline
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="text-3xl font-bold"
                    style={{
                      color:
                        selectedCommodity.overallScore >= 70 ? "#198038"
                        : selectedCommodity.overallScore >= 45 ? "#f1c21b"
                        : "#da1e28",
                    }}
                  >
                    {selectedCommodity.overallScore}
                  </div>
                  <RiskBadge level={selectedCommodity.riskLevel} />
                </div>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-[#f4f4f4] rounded-lg">
                  <div className="text-xs text-[#525252] mb-1">Supply Adequacy</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{selectedCommodity.supplyScore}</span>
                    <span className="text-xs text-[#8d8d8d]">weight: 40%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#e0e0e0] rounded-full mt-2">
                    <div className="h-full rounded-full" style={{
                      width: `${selectedCommodity.supplyScore}%`,
                      backgroundColor: selectedCommodity.supplyScore >= 70 ? "#198038" : selectedCommodity.supplyScore >= 45 ? "#f1c21b" : "#da1e28"
                    }} />
                  </div>
                </div>
                <div className="p-3 bg-[#f4f4f4] rounded-lg">
                  <div className="text-xs text-[#525252] mb-1">Origin Diversity</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{selectedCommodity.originDiversityScore}</span>
                    <span className="text-xs text-[#8d8d8d]">weight: 25%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#e0e0e0] rounded-full mt-2">
                    <div className="h-full rounded-full" style={{
                      width: `${selectedCommodity.originDiversityScore}%`,
                      backgroundColor: selectedCommodity.originDiversityScore >= 70 ? "#198038" : selectedCommodity.originDiversityScore >= 45 ? "#f1c21b" : "#da1e28"
                    }} />
                  </div>
                </div>
                <div className="p-3 bg-[#f4f4f4] rounded-lg">
                  <div className="text-xs text-[#525252] mb-1">Supplier Resilience</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{selectedCommodity.supplierDiversityScore}</span>
                    <span className="text-xs text-[#8d8d8d]">weight: 15%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#e0e0e0] rounded-full mt-2">
                    <div className="h-full rounded-full" style={{
                      width: `${selectedCommodity.supplierDiversityScore}%`,
                      backgroundColor: selectedCommodity.supplierDiversityScore >= 70 ? "#198038" : selectedCommodity.supplierDiversityScore >= 45 ? "#f1c21b" : "#da1e28"
                    }} />
                  </div>
                </div>
                <div className="p-3 bg-[#f4f4f4] rounded-lg">
                  <div className="text-xs text-[#525252] mb-1">Pipeline Health</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{selectedCommodity.pipelineHealthScore}</span>
                    <span className="text-xs text-[#8d8d8d]">weight: 20%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#e0e0e0] rounded-full mt-2">
                    <div className="h-full rounded-full" style={{
                      width: `${selectedCommodity.pipelineHealthScore}%`,
                      backgroundColor: selectedCommodity.pipelineHealthScore >= 70 ? "#198038" : selectedCommodity.pipelineHealthScore >= 45 ? "#f1c21b" : "#da1e28"
                    }} />
                  </div>
                </div>
              </div>

              {/* Days of supply */}
              <div className="mb-6">
                <div className="text-sm font-medium mb-2">Days of Supply</div>
                <SupplyBar
                  days={selectedCommodity.daysOfSupply}
                  target={selectedCommodity.targetDays}
                  critical={selectedCommodity.criticalDays}
                  warning={selectedCommodity.warningDays}
                />
                <div className="text-xs text-[#8d8d8d] mt-1">
                  Daily consumption: {selectedCommodity.dailyConsumptionMT.toLocaleString()} MT/day
                  {selectedCommodity.nearestArrivalDays !== null && (
                    <> &middot; Next arrival in {selectedCommodity.nearestArrivalDays} days</>
                  )}
                </div>
              </div>

              {/* Origin breakdown */}
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">Origin Breakdown</div>
                <div className="space-y-2">
                  {selectedCommodity.origins.map((o) => (
                    <div key={o.country} className="flex items-center gap-3">
                      <span className="text-xs w-24 truncate">{o.country}</span>
                      <div className="flex-1 h-3 bg-[#e0e0e0] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${o.pct}%`,
                            backgroundColor: o.pct > 60 ? "#da1e28" : o.pct > 40 ? "#f1c21b" : "#0f62fe",
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium w-12 text-right">{o.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Concentration warnings */}
              {selectedCommodity.concentrationWarnings.length > 0 && (
                <div className="mt-4 p-3 bg-[#fff1f1] rounded-lg border border-[#ffcdd2]">
                  <div className="flex items-center gap-2 mb-1">
                    <WarningAlt size={14} className="text-[#da1e28]" />
                    <span className="text-xs font-semibold text-[#da1e28]">Concentration Risk</span>
                  </div>
                  {selectedCommodity.concentrationWarnings.map((w, i) => (
                    <p key={i} className="text-xs text-[#525252]">{w.recommendation}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-sm text-[#8d8d8d]">
              Select a commodity to view details
            </div>
          )}
        </div>
      </div>

      {/* Concentration Warnings */}
      {data.concentrationWarnings.length > 0 && (
        <div className="nafis-card mb-8">
          <div className="nafis-card-header">
            <span className="nafis-card-title flex items-center gap-2">
              <ChartBubble size={16} className="text-[#8a3ffc]" />
              Origin Concentration Analysis
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0]">
                  <th className="text-left py-3 px-2 text-xs font-medium text-[#525252]">Commodity</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-[#525252]">Dominant Origin</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-[#525252]">Share</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-[#525252]">Risk</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-[#525252]">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {data.concentrationWarnings.map((w, i) => (
                  <tr key={i} className="border-b border-[#f4f4f4]">
                    <td className="py-3 px-2 font-medium">{w.commodity}</td>
                    <td className="py-3 px-2">{w.country}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#da1e28]"
                            style={{ width: `${w.percentage}%` }}
                          />
                        </div>
                        <span className="font-medium">{w.percentage}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="nafis-badge nafis-badge-danger">High</span>
                    </td>
                    <td className="py-3 px-2 text-xs text-[#525252] max-w-xs">{w.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      {data.alerts.length > 0 && (
        <div className="nafis-card">
          <div className="nafis-card-header">
            <span className="nafis-card-title">Intelligence Alerts</span>
            <span className="nafis-badge nafis-badge-info">{data.alerts.length} alerts</span>
          </div>
          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 bg-[#f4f4f4] rounded-lg"
              >
                <WarningAlt
                  size={16}
                  className={
                    alert.severity === "CRITICAL" || alert.severity === "HIGH"
                      ? "text-[#da1e28] mt-0.5"
                      : alert.severity === "MEDIUM"
                      ? "text-[#8e6a00] mt-0.5"
                      : "text-[#525252] mt-0.5"
                  }
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{alert.title}</span>
                    <RiskBadge level={alert.severity} />
                    {alert.commodity && (
                      <span className="nafis-badge nafis-badge-neutral">{alert.commodity}</span>
                    )}
                  </div>
                  <p className="text-xs text-[#525252] mt-1">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
