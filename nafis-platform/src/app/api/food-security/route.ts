import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// National food security thresholds (days of supply)
const SAFETY_THRESHOLDS: Record<string, { critical: number; warning: number; target: number; dailyConsumptionMT: number }> = {
  Wheat: { critical: 30, warning: 60, target: 90, dailyConsumptionMT: 4500 },
  Rice: { critical: 25, warning: 50, target: 75, dailyConsumptionMT: 2000 },
  Barley: { critical: 20, warning: 45, target: 60, dailyConsumptionMT: 3500 },
  "Poultry Meat": { critical: 15, warning: 30, target: 45, dailyConsumptionMT: 800 },
  "Bovine Meat (Frozen)": { critical: 15, warning: 30, target: 45, dailyConsumptionMT: 400 },
  "Sugar (Cane/Beet)": { critical: 20, warning: 40, target: 60, dailyConsumptionMT: 1500 },
  "Palm Oil": { critical: 20, warning: 40, target: 60, dailyConsumptionMT: 600 },
  "Sunflower Oil": { critical: 20, warning: 40, target: 60, dailyConsumptionMT: 400 },
  "Soybean Oil": { critical: 20, warning: 40, target: 60, dailyConsumptionMT: 350 },
  "Milk & Cream": { critical: 10, warning: 25, target: 40, dailyConsumptionMT: 500 },
  Cheese: { critical: 15, warning: 30, target: 45, dailyConsumptionMT: 250 },
  Butter: { critical: 15, warning: 30, target: 45, dailyConsumptionMT: 150 },
  "Corn/Maize": { critical: 20, warning: 45, target: 60, dailyConsumptionMT: 3000 },
  "Dried Legumes/Lentils": { critical: 20, warning: 40, target: 60, dailyConsumptionMT: 300 },
  Bananas: { critical: 7, warning: 14, target: 21, dailyConsumptionMT: 400 },
  Potatoes: { critical: 10, warning: 20, target: 30, dailyConsumptionMT: 500 },
  "Citrus Fruits": { critical: 7, warning: 14, target: 21, dailyConsumptionMT: 300 },
};

const MAX_ORIGIN_CONCENTRATION = 0.6; // 60% max from single origin

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all non-cleared, non-draft orders (active pipeline)
    const orders = await prisma.importOrder.findMany({
      where: {
        status: { notIn: ["DRAFT", "CLEARED"] },
      },
      include: { shipment: true },
    });

    // Get recent cleared orders for historical context
    const clearedOrders = await prisma.importOrder.findMany({
      where: { status: "CLEARED" },
    });

    // Get alerts
    const alerts = await prisma.alert.findMany({
      orderBy: { createdAt: "desc" },
    });

    // --- Compute per-commodity food security scores ---
    const commodityMap: Record<string, {
      inPipelineMT: number;
      inTransitMT: number;
      arrivedMT: number;
      origins: Record<string, number>;
      suppliers: Record<string, number>;
      orders: typeof orders;
      nearestArrivalDays: number | null;
    }> = {};

    for (const order of orders) {
      const name = order.commodityName;
      if (!commodityMap[name]) {
        commodityMap[name] = {
          inPipelineMT: 0,
          inTransitMT: 0,
          arrivedMT: 0,
          origins: {},
          suppliers: {},
          orders: [],
          nearestArrivalDays: null,
        };
      }
      const c = commodityMap[name];
      c.inPipelineMT += order.quantity;
      c.orders.push(order);

      if (order.status === "IN_TRANSIT" || order.status === "SHIPPED") {
        c.inTransitMT += order.quantity;
      }
      if (order.status === "ARRIVED") {
        c.arrivedMT += order.quantity;
      }

      // Origin tracking
      c.origins[order.originCountry] = (c.origins[order.originCountry] || 0) + order.quantity;

      // Supplier tracking
      if (order.supplierName) {
        c.suppliers[order.supplierName] = (c.suppliers[order.supplierName] || 0) + order.quantity;
      }

      // Nearest arrival
      if (order.estimatedArrivalDate) {
        const daysToArrival = Math.max(0, Math.ceil(
          (new Date(order.estimatedArrivalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ));
        if (c.nearestArrivalDays === null || daysToArrival < c.nearestArrivalDays) {
          c.nearestArrivalDays = daysToArrival;
        }
      }
    }

    const commodityScores = Object.entries(commodityMap).map(([name, data]) => {
      const threshold = SAFETY_THRESHOLDS[name] || { critical: 20, warning: 40, target: 60, dailyConsumptionMT: 500 };

      // Days of supply = pipeline volume / daily consumption
      const daysOfSupply = Math.round(data.inPipelineMT / threshold.dailyConsumptionMT);

      // Supply score (0-100): based on days of supply vs target
      const supplyScore = Math.min(100, Math.round((daysOfSupply / threshold.target) * 100));

      // Origin concentration risk
      const totalQty = data.inPipelineMT;
      const originEntries = Object.entries(data.origins)
        .map(([country, qty]) => ({ country, qty, pct: qty / totalQty }))
        .sort((a, b) => b.qty - a.qty);

      const maxConcentration = originEntries.length > 0 ? originEntries[0].pct : 0;
      const originDiversityScore = originEntries.length <= 1
        ? 20
        : Math.min(100, Math.round((1 - maxConcentration) * 100 + originEntries.length * 10));

      // Supplier diversity
      const supplierEntries = Object.entries(data.suppliers)
        .map(([supplier, qty]) => ({ supplier, qty, pct: qty / totalQty }))
        .sort((a, b) => b.qty - a.qty);

      const supplierDiversityScore = supplierEntries.length <= 1
        ? 25
        : Math.min(100, Math.round((1 - supplierEntries[0].pct) * 100 + supplierEntries.length * 8));

      // Pipeline health (are orders moving through?)
      const hasInTransit = data.inTransitMT > 0;
      const hasArrived = data.arrivedMT > 0;
      const pipelineHealthScore = hasInTransit && hasArrived ? 100 : hasInTransit ? 75 : hasArrived ? 60 : 30;

      // Overall commodity score (weighted)
      const overallScore = Math.round(
        supplyScore * 0.40 +
        originDiversityScore * 0.25 +
        supplierDiversityScore * 0.15 +
        pipelineHealthScore * 0.20
      );

      // Risk level
      const riskLevel = daysOfSupply <= threshold.critical ? "CRITICAL"
        : daysOfSupply <= threshold.warning ? "WARNING"
        : "HEALTHY";

      // Concentration warnings
      const concentrationWarnings = originEntries
        .filter(o => o.pct > MAX_ORIGIN_CONCENTRATION)
        .map(o => ({
          country: o.country,
          percentage: Math.round(o.pct * 100),
          recommendation: `Diversify ${name} imports — ${o.country} supplies ${Math.round(o.pct * 100)}% (max recommended: 60%)`,
        }));

      return {
        commodity: name,
        overallScore,
        supplyScore,
        originDiversityScore,
        supplierDiversityScore,
        pipelineHealthScore,
        riskLevel,
        daysOfSupply,
        targetDays: threshold.target,
        criticalDays: threshold.critical,
        warningDays: threshold.warning,
        inPipelineMT: Math.round(data.inPipelineMT),
        inTransitMT: Math.round(data.inTransitMT),
        dailyConsumptionMT: threshold.dailyConsumptionMT,
        origins: originEntries.map(o => ({ ...o, pct: Math.round(o.pct * 100) })),
        suppliers: supplierEntries.map(s => ({ ...s, pct: Math.round(s.pct * 100) })),
        concentrationWarnings,
        nearestArrivalDays: data.nearestArrivalDays,
        orderCount: data.orders.length,
      };
    }).sort((a, b) => a.overallScore - b.overallScore); // worst first

    // --- National food security index ---
    const nationalScore = commodityScores.length > 0
      ? Math.round(commodityScores.reduce((sum, c) => sum + c.overallScore, 0) / commodityScores.length)
      : 0;

    const criticalCount = commodityScores.filter(c => c.riskLevel === "CRITICAL").length;
    const warningCount = commodityScores.filter(c => c.riskLevel === "WARNING").length;
    const healthyCount = commodityScores.filter(c => c.riskLevel === "HEALTHY").length;

    // Top risks
    const topRisks = commodityScores
      .filter(c => c.riskLevel !== "HEALTHY")
      .slice(0, 5)
      .map(c => ({
        commodity: c.commodity,
        riskLevel: c.riskLevel,
        score: c.overallScore,
        reason: c.daysOfSupply <= c.criticalDays
          ? `Only ${c.daysOfSupply} days of supply (critical: ${c.criticalDays} days)`
          : c.concentrationWarnings.length > 0
          ? c.concentrationWarnings[0].recommendation
          : `Below target supply level (${c.daysOfSupply}/${c.targetDays} days)`,
      }));

    // All concentration warnings
    const allConcentrationWarnings = commodityScores
      .flatMap(c => c.concentrationWarnings.map(w => ({
        ...w,
        commodity: c.commodity,
        score: c.originDiversityScore,
      })))
      .sort((a, b) => b.percentage - a.percentage);

    return NextResponse.json({
      nationalScore,
      nationalRiskLevel: criticalCount > 0 ? "CRITICAL" : warningCount > 2 ? "WARNING" : "STABLE",
      summary: {
        totalCommoditiesTracked: commodityScores.length,
        critical: criticalCount,
        warning: warningCount,
        healthy: healthyCount,
        totalPipelineMT: Math.round(orders.reduce((s, o) => s + o.quantity, 0)),
        totalOrders: orders.length,
        activeAlerts: alerts.filter(a => !a.isRead).length,
      },
      commodityScores,
      topRisks,
      concentrationWarnings: allConcentrationWarnings,
      alerts: alerts.slice(0, 10).map(a => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        title: a.title,
        message: a.message,
        commodity: a.relatedCommodity,
        createdAt: a.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Food security API error:", error);
    return NextResponse.json(
      { error: "Failed to compute food security data", details: error.message },
      { status: 500 }
    );
  }
}
