import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  // Simple secret check to prevent abuse
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  try {
    console.log("Seeding NAFIS database via API...");

    // Clean existing data
    await prisma.alert.deleteMany();
    await prisma.orderStatusLog.deleteMany();
    await prisma.document.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.importOrder.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    const passwordHash = await bcrypt.hash("demo123", 12);

    // Create companies
    const importerCompanies = await Promise.all([
      prisma.company.create({
        data: { name: "Al-Rajhi Foods", type: "IMPORTER", country: "SA", city: "Riyadh" },
      }),
      prisma.company.create({
        data: { name: "Saudi Food Corp", type: "IMPORTER", country: "SA", city: "Jeddah" },
      }),
      prisma.company.create({
        data: { name: "Gulf Provisions", type: "IMPORTER", country: "SA", city: "Dammam" },
      }),
    ]);

    // Create users
    const importer = await prisma.user.create({
      data: {
        email: "importer@nafis.sa",
        passwordHash,
        name: "Ahmed Al-Rashid",
        role: "IMPORTER",
        companyId: importerCompanies[0].id,
      },
    });

    const importer2 = await prisma.user.create({
      data: {
        email: "importer2@nafis.sa",
        passwordHash,
        name: "Fatima Al-Harbi",
        role: "IMPORTER",
        companyId: importerCompanies[1].id,
      },
    });

    const importer3 = await prisma.user.create({
      data: {
        email: "importer3@nafis.sa",
        passwordHash,
        name: "Khalid Al-Dosari",
        role: "IMPORTER",
        companyId: importerCompanies[2].id,
      },
    });

    await prisma.user.create({
      data: {
        email: "regulator@nafis.sa",
        passwordHash,
        name: "Dr. Nora Al-Faisal",
        role: "REGULATOR",
      },
    });

    await prisma.user.create({
      data: {
        email: "admin@nafis.sa",
        passwordHash,
        name: "System Admin",
        role: "ADMIN",
      },
    });

    // Realistic import orders
    const orders = [
      { commodity: "Wheat", hs: "1001", cat: "Cereals", qty: 45000, origin: "Australia", port: "SAJED - Jeddah Islamic Port", supplier: "GrainCorp Ltd", value: 18000000, status: "IN_TRANSIT", ship: "MV Pacific Grain", mmsi: "538006735", lat: 12.5, lng: 55.3, shipStatus: "IN_TRANSIT", eta: 14 },
      { commodity: "Wheat", hs: "1001", cat: "Cereals", qty: 30000, origin: "Canada", port: "SADMM - King Abdulaziz Port (Dammam)", supplier: "Richardson International", value: 12500000, status: "APPROVED", ship: null, mmsi: null, lat: null, lng: null, shipStatus: null, eta: 35 },
      { commodity: "Wheat", hs: "1001", cat: "Cereals", qty: 55000, origin: "Russia", port: "SAJED - Jeddah Islamic Port", supplier: "Aston Agro-Industrial", value: 19000000, status: "SHIPPED", ship: "MV Black Sea Trader", mmsi: "273418960", lat: 28.2, lng: 35.1, shipStatus: "IN_TRANSIT", eta: 7 },
      { commodity: "Rice", hs: "1006", cat: "Cereals", qty: 20000, origin: "India", port: "SADMM - King Abdulaziz Port (Dammam)", supplier: "KRBL Limited", value: 14000000, status: "IN_TRANSIT", ship: "MV Basmati Express", mmsi: "419001234", lat: 17.8, lng: 60.2, shipStatus: "IN_TRANSIT", eta: 12 },
      { commodity: "Rice", hs: "1006", cat: "Cereals", qty: 15000, origin: "India", port: "SAJED - Jeddah Islamic Port", supplier: "LT Foods Ltd", value: 10500000, status: "IN_TRANSIT", ship: "MV Mumbai Star", mmsi: "419005678", lat: 14.2, lng: 50.8, shipStatus: "IN_TRANSIT", eta: 18 },
      { commodity: "Rice", hs: "1006", cat: "Cereals", qty: 10000, origin: "Thailand", port: "SADMM - King Abdulaziz Port (Dammam)", supplier: "CP Group", value: 8000000, status: "SUBMITTED", ship: null, mmsi: null, lat: null, lng: null, shipStatus: null, eta: 50 },
      { commodity: "Barley", hs: "1003", cat: "Cereals", qty: 60000, origin: "Australia", port: "SAJUB - Jubail Commercial Port", supplier: "CBH Group", value: 16000000, status: "IN_TRANSIT", ship: "MV Southern Harvest", mmsi: "503000100", lat: 5.8, lng: 65.4, shipStatus: "IN_TRANSIT", eta: 21 },
      { commodity: "Barley", hs: "1003", cat: "Cereals", qty: 40000, origin: "Argentina", port: "SAYNB - Yanbu Commercial Port", supplier: "Cargill Argentina", value: 11000000, status: "SHIPPED", ship: "MV Rio Plate", mmsi: "701001234", lat: -15.2, lng: -25.3, shipStatus: "DEPARTED", eta: 42 },
      { commodity: "Poultry Meat", hs: "0207", cat: "Meat", qty: 8000, origin: "Brazil", port: "SAJED - Jeddah Islamic Port", supplier: "BRF S.A.", value: 22000000, status: "IN_TRANSIT", ship: "MV Santos Reefer", mmsi: "710001234", lat: -5.3, lng: -15.2, shipStatus: "IN_TRANSIT", eta: 28 },
      { commodity: "Poultry Meat", hs: "0207", cat: "Meat", qty: 5000, origin: "Brazil", port: "SADMM - King Abdulaziz Port (Dammam)", supplier: "JBS S.A.", value: 14500000, status: "APPROVED", ship: null, mmsi: null, lat: null, lng: null, shipStatus: null, eta: 40 },
      { commodity: "Sugar (Cane/Beet)", hs: "1701", cat: "Sugar", qty: 35000, origin: "Brazil", port: "SAJED - Jeddah Islamic Port", supplier: "Raizen S.A.", value: 9500000, status: "IN_TRANSIT", ship: "MV Sugar Carrier", mmsi: "710005678", lat: 0.5, lng: -20.1, shipStatus: "IN_TRANSIT", eta: 32 },
      { commodity: "Sugar (Cane/Beet)", hs: "1701", cat: "Sugar", qty: 25000, origin: "India", port: "SADMM - King Abdulaziz Port (Dammam)", supplier: "Bajaj Hindusthan", value: 7000000, status: "ARRIVED", ship: "MV Gujarat Star", mmsi: "419009876", lat: 26.4, lng: 50.1, shipStatus: "ARRIVED", eta: 0 },
      { commodity: "Palm Oil", hs: "1511", cat: "Edible Oils", qty: 12000, origin: "Indonesia", port: "SAJED - Jeddah Islamic Port", supplier: "Wilmar International", value: 11000000, status: "SHIPPED", ship: "MV Palm Venture", mmsi: "525001234", lat: -2.1, lng: 75.4, shipStatus: "IN_TRANSIT", eta: 25 },
      { commodity: "Sunflower Oil", hs: "1512", cat: "Edible Oils", qty: 8000, origin: "Ukraine", port: "SADMM - King Abdulaziz Port (Dammam)", supplier: "Kernel Group", value: 9500000, status: "SUBMITTED", ship: null, mmsi: null, lat: null, lng: null, shipStatus: null, eta: 55 },
      { commodity: "Milk & Cream", hs: "0402", cat: "Dairy", qty: 5000, origin: "New Zealand", port: "SAJED - Jeddah Islamic Port", supplier: "Fonterra", value: 12000000, status: "IN_TRANSIT", ship: "MV Kiwi Dairy", mmsi: "512001234", lat: -12.3, lng: 62.5, shipStatus: "IN_TRANSIT", eta: 20 },
      { commodity: "Cheese", hs: "0406", cat: "Dairy", qty: 3000, origin: "Netherlands", port: "SAJED - Jeddah Islamic Port", supplier: "FrieslandCampina", value: 8500000, status: "APPROVED", ship: null, mmsi: null, lat: null, lng: null, shipStatus: null, eta: 30 },
      { commodity: "Corn/Maize", hs: "1005", cat: "Cereals", qty: 50000, origin: "Argentina", port: "SAJUB - Jubail Commercial Port", supplier: "Bunge Argentina", value: 14000000, status: "SHIPPED", ship: "MV Pampa Grain", mmsi: "701009876", lat: -20.5, lng: -10.8, shipStatus: "DEPARTED", eta: 45 },
      { commodity: "Corn/Maize", hs: "1005", cat: "Cereals", qty: 35000, origin: "United States", port: "SADMM - King Abdulaziz Port (Dammam)", supplier: "ADM", value: 11500000, status: "DRAFT", ship: null, mmsi: null, lat: null, lng: null, shipStatus: null, eta: 60 },
      { commodity: "Bananas", hs: "0803", cat: "Fruits", qty: 4000, origin: "India", port: "SAJED - Jeddah Islamic Port", supplier: "INI Farms", value: 3500000, status: "ARRIVED", ship: "MV Tropical Fresh", mmsi: "419003456", lat: 21.5, lng: 39.2, shipStatus: "ARRIVED", eta: 0 },
      { commodity: "Potatoes", hs: "0701", cat: "Vegetables", qty: 6000, origin: "Netherlands", port: "SADMM - King Abdulaziz Port (Dammam)", supplier: "Agrico", value: 2800000, status: "CLEARED", ship: null, mmsi: null, lat: null, lng: null, shipStatus: null, eta: 0 },
      { commodity: "Bovine Meat (Frozen)", hs: "0202", cat: "Meat", qty: 4000, origin: "Brazil", port: "SAJED - Jeddah Islamic Port", supplier: "Minerva Foods", value: 18000000, status: "SUBMITTED", ship: null, mmsi: null, lat: null, lng: null, shipStatus: null, eta: 45 },
      { commodity: "Soybean Oil", hs: "1507", cat: "Edible Oils", qty: 10000, origin: "Argentina", port: "SAYNB - Yanbu Commercial Port", supplier: "Molinos Agro", value: 8500000, status: "APPROVED", ship: null, mmsi: null, lat: null, lng: null, shipStatus: null, eta: 38 },
      { commodity: "Dried Legumes/Lentils", hs: "0713", cat: "Pulses", qty: 7000, origin: "Canada", port: "SADMM - King Abdulaziz Port (Dammam)", supplier: "AGT Food", value: 5500000, status: "SHIPPED", ship: "MV Prairie Export", mmsi: "316001234", lat: 35.5, lng: -10.2, shipStatus: "IN_TRANSIT", eta: 22 },
      { commodity: "Butter", hs: "0405", cat: "Dairy", qty: 2000, origin: "New Zealand", port: "SAJED - Jeddah Islamic Port", supplier: "Fonterra", value: 7000000, status: "IN_TRANSIT", ship: "MV Pacific Reefer", mmsi: "512005678", lat: -8.5, lng: 58.3, shipStatus: "IN_TRANSIT", eta: 24 },
      { commodity: "Citrus Fruits", hs: "0805", cat: "Fruits", qty: 3000, origin: "South Africa", port: "SAJED - Jeddah Islamic Port", supplier: "Capespan", value: 2200000, status: "APPROVED", ship: null, mmsi: null, lat: null, lng: null, shipStatus: null, eta: 25 },
    ];

    const importers = [importer, importer2, importer3];
    let refCounter = 10001;

    for (const o of orders) {
      const assignedImporter = importers[refCounter % 3];
      const now = new Date();
      const etaDate = o.eta > 0 ? new Date(now.getTime() + o.eta * 24 * 60 * 60 * 1000) : null;
      const shipDate = etaDate ? new Date(etaDate.getTime() - 30 * 24 * 60 * 60 * 1000) : null;

      const order = await prisma.importOrder.create({
        data: {
          nafisRef: `NAFIS-2026-${refCounter}`,
          importerId: assignedImporter.id,
          status: o.status as any,
          commodityHsCode: o.hs,
          commodityName: o.commodity,
          commodityCategory: o.cat,
          quantity: o.qty,
          unit: "MT",
          originCountry: o.origin,
          destinationPort: o.port,
          estimatedShipDate: shipDate,
          estimatedArrivalDate: etaDate,
          totalValue: o.value,
          currency: "SAR",
          supplierName: o.supplier,
        },
      });

      if (o.ship && o.mmsi) {
        await prisma.shipment.create({
          data: {
            orderId: order.id,
            vesselName: o.ship,
            vesselMmsi: o.mmsi,
            departurePort: o.port,
            arrivalPort: o.port,
            status: (o.shipStatus as any) || "IN_TRANSIT",
            lastKnownLat: o.lat,
            lastKnownLng: o.lng,
            lastPositionUpdate: new Date(),
            eta: etaDate,
          },
        });
      }

      await prisma.orderStatusLog.create({
        data: {
          orderId: order.id,
          toStatus: o.status,
          changedBy: assignedImporter.id,
          reason: "Seeded demo data",
        },
      });

      refCounter++;
    }

    // Create alerts
    await prisma.alert.createMany({
      data: [
        {
          type: "SHORTAGE_RISK",
          severity: "HIGH",
          title: "Wheat Pipeline Below Threshold",
          message: "Wheat import pipeline is 35% below the 90-day rolling average. Only 130,000 MT in pipeline vs 200,000 MT average.",
          relatedCommodity: "Wheat",
        },
        {
          type: "CONCENTRATION_RISK",
          severity: "CRITICAL",
          title: "Rice Origin Concentration Warning",
          message: "78% of rice imports originate from India. Recommended max is 60%. Diversify to Thailand, Vietnam, or Pakistan.",
          relatedCommodity: "Rice",
        },
        {
          type: "ARRIVAL_IMMINENT",
          severity: "MEDIUM",
          title: "Bulk Wheat Arrival — Jeddah Port",
          message: "MV Black Sea Trader carrying 55,000 MT of Russian wheat arriving at Jeddah within 7 days.",
          relatedCommodity: "Wheat",
        },
        {
          type: "CONCENTRATION_RISK",
          severity: "HIGH",
          title: "Brazil Poultry Dependency",
          message: "100% of poultry meat imports sourced from Brazil. Recommend qualifying Turkey or Thailand suppliers.",
          relatedCommodity: "Poultry Meat",
        },
        {
          type: "SHORTAGE_RISK",
          severity: "MEDIUM",
          title: "Edible Oil Supply Gap",
          message: "Palm and sunflower oil pipeline covers only 45 days of consumption. Minimum buffer is 60 days.",
          relatedCommodity: "Palm Oil",
        },
        {
          type: "STATUS_CHANGE",
          severity: "LOW",
          title: "Sugar Shipment Arrived",
          message: "MV Gujarat Star arrived at King Abdulaziz Port with 25,000 MT of sugar from India.",
          relatedCommodity: "Sugar (Cane/Beet)",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      data: {
        users: 5,
        companies: 3,
        orders: orders.length,
        alerts: 6,
      },
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Seed failed", details: error.message },
      { status: 500 }
    );
  }
}
