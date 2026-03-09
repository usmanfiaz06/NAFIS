import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateNafisRef } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const commodity = searchParams.get("commodity");
  const origin = searchParams.get("origin");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};

  // Importers only see their own orders
  if (user.role === "IMPORTER") {
    where.importerId = user.id;
  }

  if (status) where.status = status;
  if (commodity) where.commodityName = { contains: commodity, mode: "insensitive" };
  if (origin) where.originCountry = origin;

  const [orders, total] = await Promise.all([
    prisma.importOrder.findMany({
      where,
      include: {
        importer: { select: { name: true, email: true } },
        shipment: {
          select: {
            vesselName: true,
            status: true,
            eta: true,
            lastKnownLat: true,
            lastKnownLng: true,
          },
        },
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.importOrder.count({ where }),
  ]);

  return NextResponse.json({
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  if (user.role !== "IMPORTER" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only importers can create orders" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      commodityHsCode,
      commodityName,
      commodityCategory,
      quantity,
      unit,
      originCountry,
      originPort,
      destinationPort,
      estimatedShipDate,
      estimatedArrivalDate,
      totalValue,
      currency,
      supplierName,
      notes,
    } = body;

    if (!commodityHsCode || !commodityName || !quantity || !originCountry || !destinationPort) {
      return NextResponse.json(
        { error: "Missing required fields: commodityHsCode, commodityName, quantity, originCountry, destinationPort" },
        { status: 400 }
      );
    }

    const order = await prisma.importOrder.create({
      data: {
        nafisRef: generateNafisRef(),
        importerId: user.id,
        commodityHsCode,
        commodityName,
        commodityCategory,
        quantity: parseFloat(quantity),
        unit: unit || "MT",
        originCountry,
        originPort,
        destinationPort,
        estimatedShipDate: estimatedShipDate ? new Date(estimatedShipDate) : null,
        estimatedArrivalDate: estimatedArrivalDate ? new Date(estimatedArrivalDate) : null,
        totalValue: totalValue ? parseFloat(totalValue) : null,
        currency: currency || "SAR",
        supplierName,
        notes,
        status: "DRAFT",
      },
    });

    // Log status
    await prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        toStatus: "DRAFT",
        changedBy: user.id,
        reason: "Order created",
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
