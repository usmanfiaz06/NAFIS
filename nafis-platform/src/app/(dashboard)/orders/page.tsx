"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Add, Search } from "@carbon/icons-react";
import { ORDER_STATUS_LABELS } from "@/lib/utils";

interface Order {
  id: string;
  nafisRef: string;
  status: string;
  commodityName: string;
  commodityHsCode: string;
  quantity: number;
  unit: string;
  originCountry: string;
  destinationPort: string;
  estimatedArrivalDate: string | null;
  totalValue: number | null;
  createdAt: string;
  importer: { name: string; email: string };
  shipment: { vesselName: string; status: string; eta: string } | null;
  _count: { documents: number };
}

const statusBadgeClass: Record<string, string> = {
  DRAFT: "nafis-badge nafis-badge-neutral",
  SUBMITTED: "nafis-badge nafis-badge-info",
  APPROVED: "nafis-badge nafis-badge-success",
  SHIPPED: "nafis-badge bg-[#f6f2ff] text-[#6929c4]",
  IN_TRANSIT: "nafis-badge bg-[#d9fbfb] text-[#005d5d]",
  ARRIVED: "nafis-badge nafis-badge-success",
  CLEARED: "nafis-badge nafis-badge-neutral",
};

export default function OrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const user = session?.user as any;
  const isImporter = user?.role === "IMPORTER";

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = orders.filter(
    (o) =>
      o.nafisRef.toLowerCase().includes(search.toLowerCase()) ||
      o.commodityName.toLowerCase().includes(search.toLowerCase()) ||
      o.originCountry.toLowerCase().includes(search.toLowerCase()) ||
      o.importer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="nafis-page-header mb-0">
          <h1 className="nafis-page-title">Import Orders</h1>
          <p className="nafis-page-subtitle">
            {isImporter
              ? "Manage your food import orders"
              : "View all national food import orders"}
          </p>
        </div>
        {isImporter && (
          <Link
            href="/orders/new"
            className="flex items-center gap-2 h-10 px-5 bg-[#0f62fe] text-white text-sm font-medium rounded hover:bg-[#0353e9] transition-colors"
          >
            <Add size={16} />
            New Order
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d8d8d]"
          />
          <input
            type="text"
            placeholder="Search by NAFIS ref, commodity, origin, or importer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
        >
          <option value="">All Statuses</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Orders table */}
      <div className="nafis-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#8d8d8d]">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[#8d8d8d] text-sm">
              {orders.length === 0
                ? "No orders yet. Create your first import order."
                : "No orders match your search."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#f4f4f4]">
                <th className="text-left text-xs font-medium text-[#525252] px-6 py-3">
                  NAFIS Ref
                </th>
                <th className="text-left text-xs font-medium text-[#525252] px-6 py-3">
                  Commodity
                </th>
                <th className="text-left text-xs font-medium text-[#525252] px-6 py-3">
                  Quantity
                </th>
                <th className="text-left text-xs font-medium text-[#525252] px-6 py-3">
                  Origin
                </th>
                <th className="text-left text-xs font-medium text-[#525252] px-6 py-3">
                  Destination
                </th>
                <th className="text-left text-xs font-medium text-[#525252] px-6 py-3">
                  ETA
                </th>
                <th className="text-left text-xs font-medium text-[#525252] px-6 py-3">
                  Status
                </th>
                {!isImporter && (
                  <th className="text-left text-xs font-medium text-[#525252] px-6 py-3">
                    Importer
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[#f4f4f4] hover:bg-[#f9f9f9] cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-sm font-medium text-[#0f62fe] hover:underline"
                    >
                      {order.nafisRef}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{order.commodityName}</div>
                    <div className="text-xs text-[#8d8d8d]">
                      HS {order.commodityHsCode}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {order.quantity.toLocaleString()} {order.unit}
                  </td>
                  <td className="px-6 py-4 text-sm">{order.originCountry}</td>
                  <td className="px-6 py-4 text-sm">{order.destinationPort}</td>
                  <td className="px-6 py-4 text-sm">
                    {order.shipment?.eta
                      ? new Date(order.shipment.eta).toLocaleDateString()
                      : order.estimatedArrivalDate
                      ? new Date(order.estimatedArrivalDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={statusBadgeClass[order.status] || "nafis-badge nafis-badge-neutral"}>
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  {!isImporter && (
                    <td className="px-6 py-4 text-sm text-[#525252]">
                      {order.importer.name}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
