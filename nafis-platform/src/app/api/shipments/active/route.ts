import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shipments = await prisma.shipment.findMany({
    where: {
      status: { in: ["DEPARTED", "IN_TRANSIT", "APPROACHING"] },
    },
    include: {
      order: {
        select: {
          nafisRef: true,
          commodityName: true,
          quantity: true,
          unit: true,
          originCountry: true,
          destinationPort: true,
          status: true,
          importer: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(shipments);
}
