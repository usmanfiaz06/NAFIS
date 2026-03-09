import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const MIGRATION_SQL = `
-- CreateEnum (skip if exists)
DO $$ BEGIN CREATE TYPE "UserRole" AS ENUM ('IMPORTER', 'REGULATOR', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "CompanyType" AS ENUM ('IMPORTER', 'SUPPLIER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'CLEARED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ShipmentStatus" AS ENUM ('LOADING', 'DEPARTED', 'IN_TRANSIT', 'APPROACHING', 'ARRIVED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "DocumentType" AS ENUM ('PROFORMA_INVOICE', 'IMPORT_LICENSE', 'CERT_OF_ORIGIN', 'BILL_OF_LADING', 'PHYTO_CERT', 'OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "AlertType" AS ENUM ('SHORTAGE_RISK', 'CONCENTRATION_RISK', 'ARRIVAL_IMMINENT', 'STATUS_CHANGE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registration_number" TEXT,
    "type" "CompanyType" NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'IMPORTER',
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "import_orders" (
    "id" TEXT NOT NULL,
    "nafis_ref" TEXT NOT NULL,
    "importer_id" TEXT NOT NULL,
    "supplier_company_id" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "commodity_hs_code" TEXT NOT NULL,
    "commodity_name" TEXT NOT NULL,
    "commodity_category" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'MT',
    "origin_country" TEXT NOT NULL,
    "origin_port" TEXT,
    "destination_port" TEXT NOT NULL,
    "estimated_ship_date" TIMESTAMP(3),
    "estimated_arrival_date" TIMESTAMP(3),
    "actual_ship_date" TIMESTAMP(3),
    "actual_arrival_date" TIMESTAMP(3),
    "total_value" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "supplier_name" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "import_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "documents" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "shipments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "vessel_name" TEXT,
    "vessel_imo" TEXT,
    "vessel_mmsi" TEXT,
    "shipping_line" TEXT,
    "bill_of_lading_number" TEXT,
    "container_numbers" JSONB,
    "departure_port" TEXT,
    "arrival_port" TEXT,
    "departed_at" TIMESTAMP(3),
    "eta" TIMESTAMP(3),
    "arrived_at" TIMESTAMP(3),
    "last_known_lat" DOUBLE PRECISION,
    "last_known_lng" DOUBLE PRECISION,
    "last_position_update" TIMESTAMP(3),
    "status" "ShipmentStatus" NOT NULL DEFAULT 'LOADING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "order_status_logs" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_status_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "alerts" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "related_order_id" TEXT,
    "related_commodity" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "import_orders_nafis_ref_key" ON "import_orders"("nafis_ref");
CREATE INDEX IF NOT EXISTS "import_orders_status_idx" ON "import_orders"("status");
CREATE INDEX IF NOT EXISTS "import_orders_commodity_hs_code_idx" ON "import_orders"("commodity_hs_code");
CREATE INDEX IF NOT EXISTS "import_orders_origin_country_idx" ON "import_orders"("origin_country");
CREATE INDEX IF NOT EXISTS "import_orders_destination_port_idx" ON "import_orders"("destination_port");
CREATE INDEX IF NOT EXISTS "import_orders_estimated_arrival_date_idx" ON "import_orders"("estimated_arrival_date");
CREATE UNIQUE INDEX IF NOT EXISTS "shipments_order_id_key" ON "shipments"("order_id");
CREATE INDEX IF NOT EXISTS "shipments_vessel_mmsi_idx" ON "shipments"("vessel_mmsi");
CREATE INDEX IF NOT EXISTS "shipments_status_idx" ON "shipments"("status");
CREATE INDEX IF NOT EXISTS "alerts_type_idx" ON "alerts"("type");
CREATE INDEX IF NOT EXISTS "alerts_is_read_idx" ON "alerts"("is_read");

-- Foreign Keys (use DO block to skip if exists)
DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "import_orders" ADD CONSTRAINT "import_orders_importer_id_fkey" FOREIGN KEY ("importer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "import_orders" ADD CONSTRAINT "import_orders_supplier_company_id_fkey" FOREIGN KEY ("supplier_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "documents" ADD CONSTRAINT "documents_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "import_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "import_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "import_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "alerts" ADD CONSTRAINT "alerts_related_order_id_fkey" FOREIGN KEY ("related_order_id") REFERENCES "import_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
`;

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query(MIGRATION_SQL);
    await pool.end();

    return NextResponse.json({
      success: true,
      message: "Database tables created successfully. Now call /api/seed to populate data.",
    });
  } catch (error: any) {
    await pool.end();
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Setup failed", details: error.message },
      { status: 500 }
    );
  }
}
