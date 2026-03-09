import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.importOrder.findUnique({
    where: { id: params.id },
    include: {
      importer: { select: { name: true, email: true, company: { select: { name: true } } } },
      shipment: true,
      documents: {
        include: { uploader: { select: { name: true } } },
        orderBy: { uploadedAt: "desc" },
      },
      statusLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { changedAt: "desc" },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const user = session.user as any;
  if (user.role === "IMPORTER" && order.importerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const user = session.user as any;

  const order = await prisma.importOrder.findUnique({
    where: { id: params.id },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (user.role === "IMPORTER" && order.importerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.importOrder.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(updated);
}
