import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.importOrder.findUnique({
    where: { id: params.id },
    include: { shipment: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.shipment) {
    return NextResponse.json({ error: "Shipment already linked" }, { status: 409 });
  }

  const body = await req.json();
  const {
    vesselName,
    vesselImo,
    vesselMmsi,
    shippingLine,
    billOfLadingNumber,
    containerNumbers,
    departurePort,
    arrivalPort,
  } = body;

  const shipment = await prisma.shipment.create({
    data: {
      orderId: params.id,
      vesselName,
      vesselImo,
      vesselMmsi,
      shippingLine,
      billOfLadingNumber,
      containerNumbers: containerNumbers || [],
      departurePort: departurePort || order.originPort,
      arrivalPort: arrivalPort || order.destinationPort,
      status: "LOADING",
    },
  });

  return NextResponse.json(shipment, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.importOrder.findUnique({
    where: { id: params.id },
    include: { shipment: true },
  });

  if (!order?.shipment) {
    return NextResponse.json({ error: "No shipment found" }, { status: 404 });
  }

  const body = await req.json();
  const shipment = await prisma.shipment.update({
    where: { id: order.shipment.id },
    data: body,
  });

  return NextResponse.json(shipment);
}
