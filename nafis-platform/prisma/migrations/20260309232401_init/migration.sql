-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('IMPORTER', 'REGULATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('IMPORTER', 'SUPPLIER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'CLEARED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('LOADING', 'DEPARTED', 'IN_TRANSIT', 'APPROACHING', 'ARRIVED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PROFORMA_INVOICE', 'IMPORT_LICENSE', 'CERT_OF_ORIGIN', 'BILL_OF_LADING', 'PHYTO_CERT', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('SHORTAGE_RISK', 'CONCENTRATION_RISK', 'ARRIVAL_IMMINENT', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "companies" (
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

-- CreateTable
CREATE TABLE "users" (
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

-- CreateTable
CREATE TABLE "import_orders" (
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

-- CreateTable
CREATE TABLE "documents" (
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

-- CreateTable
CREATE TABLE "shipments" (
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

-- CreateTable
CREATE TABLE "order_status_logs" (
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

-- CreateTable
CREATE TABLE "alerts" (
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "import_orders_nafis_ref_key" ON "import_orders"("nafis_ref");

-- CreateIndex
CREATE INDEX "import_orders_status_idx" ON "import_orders"("status");

-- CreateIndex
CREATE INDEX "import_orders_commodity_hs_code_idx" ON "import_orders"("commodity_hs_code");

-- CreateIndex
CREATE INDEX "import_orders_origin_country_idx" ON "import_orders"("origin_country");

-- CreateIndex
CREATE INDEX "import_orders_destination_port_idx" ON "import_orders"("destination_port");

-- CreateIndex
CREATE INDEX "import_orders_estimated_arrival_date_idx" ON "import_orders"("estimated_arrival_date");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_order_id_key" ON "shipments"("order_id");

-- CreateIndex
CREATE INDEX "shipments_vessel_mmsi_idx" ON "shipments"("vessel_mmsi");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "alerts"("type");

-- CreateIndex
CREATE INDEX "alerts_is_read_idx" ON "alerts"("is_read");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_orders" ADD CONSTRAINT "import_orders_importer_id_fkey" FOREIGN KEY ("importer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_orders" ADD CONSTRAINT "import_orders_supplier_company_id_fkey" FOREIGN KEY ("supplier_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "import_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "import_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "import_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_related_order_id_fkey" FOREIGN KEY ("related_order_id") REFERENCES "import_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
