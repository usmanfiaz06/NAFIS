import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "DRAFT"],
  APPROVED: ["SHIPPED"],
  SHIPPED: ["IN_TRANSIT"],
  IN_TRANSIT: ["ARRIVED"],
  ARRIVED: ["CLEARED"],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status: newStatus, reason } = await req.json();
  const user = session.user as any;

  const order = await prisma.importOrder.findUnique({
    where: { id: params.id },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Check permission
  if (user.role === "IMPORTER") {
    if (order.importerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Importers can only submit drafts or update shipping status
    if (!["SUBMITTED", "SHIPPED", "IN_TRANSIT", "ARRIVED"].includes(newStatus)) {
      return NextResponse.json({ error: "Importers cannot set this status" }, { status: 403 });
    }
  }

  // Regulators can approve
  if (newStatus === "APPROVED" && user.role === "IMPORTER") {
    return NextResponse.json({ error: "Only regulators can approve orders" }, { status: 403 });
  }

  // Validate transition
  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${order.status} to ${newStatus}` },
      { status: 400 }
    );
  }

  const [updated] = await Promise.all([
    prisma.importOrder.update({
      where: { id: params.id },
      data: { status: newStatus as any },
    }),
    prisma.orderStatusLog.create({
      data: {
        orderId: params.id,
        fromStatus: order.status,
        toStatus: newStatus,
        changedBy: user.id,
        reason,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
