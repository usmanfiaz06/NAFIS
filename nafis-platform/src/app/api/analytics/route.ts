import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allOrders = await prisma.importOrder.findMany({
      include: { shipment: true, importer: { include: { company: true } } },
      orderBy: { createdAt: "asc" },
    });

    // --- 1. Import volume by commodity category ---
    const categoryVolume: Record<string, { total: number; orders: number; value: number }> = {};
    for (const o of allOrders) {
      const cat = o.commodityCategory || "Other";
      if (!categoryVolume[cat]) categoryVolume[cat] = { total: 0, orders: 0, value: 0 };
      categoryVolume[cat].total += o.quantity;
      categoryVolume[cat].orders += 1;
      categoryVolume[cat].value += o.totalValue || 0;
    }
    const volumeByCategory = Object.entries(categoryVolume)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total);

    // --- 2. Origin diversification analysis ---
    const originData: Record<string, { volume: number; orders: number; value: number; commodities: Set<string> }> = {};
    for (const o of allOrders) {
      if (!originData[o.originCountry]) {
        originData[o.originCountry] = { volume: 0, orders: 0, value: 0, commodities: new Set() };
      }
      originData[o.originCountry].volume += o.quantity;
      originData[o.originCountry].orders += 1;
      originData[o.originCountry].value += o.totalValue || 0;
      originData[o.originCountry].commodities.add(o.commodityName);
    }
    const totalVolume = allOrders.reduce((s, o) => s + o.quantity, 0);
    const originDiversification = Object.entries(originData)
      .map(([country, data]) => ({
        country,
        volume: Math.round(data.volume),
        orders: data.orders,
        value: data.value,
        share: Math.round((data.volume / totalVolume) * 100),
        commodityCount: data.commodities.size,
        commodities: Array.from(data.commodities),
      }))
      .sort((a, b) => b.volume - a.volume);

    // Herfindahl-Hirschman Index for concentration
    const hhi = originDiversification.reduce((sum, o) => sum + Math.pow(o.share / 100, 2), 0);
    const diversificationRating = hhi < 0.15 ? "Well Diversified" : hhi < 0.25 ? "Moderate" : "Highly Concentrated";

    // --- 3. Port utilization ---
    const portData: Record<string, { volume: number; orders: number; arrivals: number }> = {};
    for (const o of allOrders) {
      const port = o.destinationPort;
      if (!portData[port]) portData[port] = { volume: 0, orders: 0, arrivals: 0 };
      portData[port].volume += o.quantity;
      portData[port].orders += 1;
      if (o.status === "ARRIVED" || o.status === "CLEARED") portData[port].arrivals += 1;
    }
    const portUtilization = Object.entries(portData)
      .map(([port, data]) => ({
        port: port.split(" - ")[1] || port,
        portCode: port.split(" - ")[0] || port,
        ...data,
        volume: Math.round(data.volume),
      }))
      .sort((a, b) => b.volume - a.volume);

    // --- 4. Supplier performance ---
    const supplierData: Record<string, {
      orders: number; volume: number; value: number;
      commodities: Set<string>; origins: Set<string>;
      onTimeCount: number; totalWithEta: number;
    }> = {};
    for (const o of allOrders) {
      const supplier = o.supplierName || "Unknown";
      if (!supplierData[supplier]) {
        supplierData[supplier] = {
          orders: 0, volume: 0, value: 0,
          commodities: new Set(), origins: new Set(),
          onTimeCount: 0, totalWithEta: 0,
        };
      }
      const s = supplierData[supplier];
      s.orders += 1;
      s.volume += o.quantity;
      s.value += o.totalValue || 0;
      s.commodities.add(o.commodityName);
      s.origins.add(o.originCountry);
      if (o.estimatedArrivalDate && (o.status === "ARRIVED" || o.status === "CLEARED")) {
        s.totalWithEta += 1;
        // Simulate on-time based on status (in real system would compare actual vs estimated)
        s.onTimeCount += 1;
      }
    }
    const supplierPerformance = Object.entries(supplierData)
      .map(([name, data]) => ({
        name,
        orders: data.orders,
        volume: Math.round(data.volume),
        value: data.value,
        commodities: Array.from(data.commodities),
        origins: Array.from(data.origins),
        reliabilityScore: data.totalWithEta > 0
          ? Math.round((data.onTimeCount / data.totalWithEta) * 100)
          : null,
      }))
      .sort((a, b) => b.volume - a.volume);

    // --- 5. Monthly import trends (simulated with creation dates) ---
    const monthlyTrends: Record<string, { volume: number; value: number; orders: number }> = {};
    for (const o of allOrders) {
      const month = new Date(o.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short" });
      if (!monthlyTrends[month]) monthlyTrends[month] = { volume: 0, value: 0, orders: 0 };
      monthlyTrends[month].volume += o.quantity;
      monthlyTrends[month].value += o.totalValue || 0;
      monthlyTrends[month].orders += 1;
    }
    const trends = Object.entries(monthlyTrends).map(([month, data]) => ({
      month,
      volume: Math.round(data.volume),
      value: data.value,
      orders: data.orders,
    }));

    // --- 6. Arrival timeline (next 90 days) ---
    const now = new Date();
    const next90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const upcomingArrivals = allOrders
      .filter(o => o.estimatedArrivalDate && new Date(o.estimatedArrivalDate) >= now && new Date(o.estimatedArrivalDate) <= next90)
      .map(o => ({
        commodity: o.commodityName,
        quantity: o.quantity,
        origin: o.originCountry,
        port: (o.destinationPort.split(" - ")[1] || o.destinationPort),
        eta: o.estimatedArrivalDate,
        daysUntil: Math.ceil((new Date(o.estimatedArrivalDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        vessel: o.shipment?.vesselName || null,
        status: o.status,
        supplier: o.supplierName,
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil);

    // --- 7. Value analysis ---
    const totalValue = allOrders.reduce((s, o) => s + (o.totalValue || 0), 0);
    const avgOrderValue = allOrders.length > 0 ? Math.round(totalValue / allOrders.length) : 0;
    const commodityValue: Record<string, number> = {};
    for (const o of allOrders) {
      commodityValue[o.commodityName] = (commodityValue[o.commodityName] || 0) + (o.totalValue || 0);
    }
    const valueByCommod = Object.entries(commodityValue)
      .map(([commodity, value]) => ({ commodity, value, share: Math.round((value / totalValue) * 100) }))
      .sort((a, b) => b.value - a.value);

    return NextResponse.json({
      overview: {
        totalOrders: allOrders.length,
        totalVolumeMT: Math.round(totalVolume),
        totalValueSAR: totalValue,
        avgOrderValueSAR: avgOrderValue,
        uniqueOrigins: Object.keys(originData).length,
        uniqueSuppliers: Object.keys(supplierData).length,
        uniqueCommodities: new Set(allOrders.map(o => o.commodityName)).size,
      },
      volumeByCategory,
      originDiversification,
      diversificationIndex: { hhi: Math.round(hhi * 1000) / 1000, rating: diversificationRating },
      portUtilization,
      supplierPerformance,
      trends,
      upcomingArrivals,
      valueAnalysis: {
        totalValueSAR: totalValue,
        avgOrderValueSAR: avgOrderValue,
        byCommod: valueByCommod,
      },
    });
  } catch (error: any) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to compute analytics", details: error.message },
      { status: 500 }
    );
  }
}
