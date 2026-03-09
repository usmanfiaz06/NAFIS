import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const isImporter = user.role === "IMPORTER";

  const whereClause = isImporter ? { importerId: user.id } : {};

  // Pipeline by status
  const statusCounts = await prisma.importOrder.groupBy({
    by: ["status"],
    where: whereClause,
    _count: { id: true },
    _sum: { quantity: true },
  });

  // Origin concentration
  const originCounts = await prisma.importOrder.groupBy({
    by: ["originCountry"],
    where: { ...whereClause, status: { notIn: ["DRAFT", "CLEARED"] } },
    _count: { id: true },
    _sum: { quantity: true },
  });

  // Commodity breakdown
  const commodityCounts = await prisma.importOrder.groupBy({
    by: ["commodityName"],
    where: { ...whereClause, status: { notIn: ["DRAFT", "CLEARED"] } },
    _count: { id: true },
    _sum: { quantity: true },
  });

  // Arrival forecast (next 90 days)
  const now = new Date();
  const next90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const upcomingArrivals = await prisma.importOrder.findMany({
    where: {
      ...whereClause,
      estimatedArrivalDate: { gte: now, lte: next90 },
      status: { in: ["SHIPPED", "IN_TRANSIT", "APPROVED"] },
    },
    select: {
      id: true,
      commodityName: true,
      quantity: true,
      unit: true,
      originCountry: true,
      estimatedArrivalDate: true,
      status: true,
    },
    orderBy: { estimatedArrivalDate: "asc" },
  });

  // Active shipments count
  const activeShipments = await prisma.shipment.count({
    where: { status: { in: ["DEPARTED", "IN_TRANSIT", "APPROACHING"] } },
  });

  // Total value
  const totalValue = await prisma.importOrder.aggregate({
    where: { ...whereClause, status: { notIn: ["DRAFT", "CLEARED"] } },
    _sum: { totalValue: true, quantity: true },
    _count: { id: true },
  });

  // Recent alerts
  const alerts = await prisma.alert.findMany({
    where: { isRead: false },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    pipeline: statusCounts.map((s) => ({
      status: s.status,
      count: s._count.id,
      totalQuantity: s._sum.quantity || 0,
    })),
    origins: originCounts.map((o) => ({
      country: o.originCountry,
      count: o._count.id,
      totalQuantity: o._sum.quantity || 0,
    })),
    commodities: commodityCounts.map((c) => ({
      name: c.commodityName,
      count: c._count.id,
      totalQuantity: c._sum.quantity || 0,
    })),
    arrivals: upcomingArrivals,
    activeShipments,
    summary: {
      totalOrders: totalValue._count.id,
      totalQuantityMT: totalValue._sum.quantity || 0,
      totalValueSAR: totalValue._sum.totalValue || 0,
    },
    alerts,
  });
}
