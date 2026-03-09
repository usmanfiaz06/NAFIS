"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Checkmark,
  Shuttle,
  Document as DocIcon,
  Time,
} from "@carbon/icons-react";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";

const STATUS_ORDER = ["DRAFT", "SUBMITTED", "APPROVED", "SHIPPED", "IN_TRANSIT", "ARRIVED", "CLEARED"];

export default function OrderDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [shipmentForm, setShipmentForm] = useState({
    vesselName: "",
    vesselMmsi: "",
    vesselImo: "",
    shippingLine: "",
    billOfLadingNumber: "",
  });

  const user = session?.user as any;

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  const changeStatus = async (newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${params.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder({ ...order, status: updated.status });
      }
    } catch (err) {
      console.error(err);
    }
    setActionLoading(false);
  };

  const linkShipment = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${params.id}/shipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shipmentForm),
      });
      if (res.ok) {
        const shipment = await res.json();
        setOrder({ ...order, shipment });
        setShowShipmentForm(false);
      }
    } catch (err) {
      console.error(err);
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-[#e0e0e0] rounded w-48" />
        <div className="h-48 bg-[#e0e0e0] rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-[#8d8d8d]">Order not found</p>
      </div>
    );
  }

  const currentStatusIndex = STATUS_ORDER.indexOf(order.status);

  // Determine available actions
  const actions: { label: string; status: string; color: string }[] = [];
  if (order.status === "DRAFT" && user?.role === "IMPORTER") {
    actions.push({ label: "Submit for Approval", status: "SUBMITTED", color: "bg-[#0f62fe]" });
  }
  if (order.status === "SUBMITTED" && (user?.role === "REGULATOR" || user?.role === "ADMIN")) {
    actions.push({ label: "Approve Order", status: "APPROVED", color: "bg-[#198038]" });
  }
  if (order.status === "APPROVED" && user?.role === "IMPORTER") {
    actions.push({ label: "Mark as Shipped", status: "SHIPPED", color: "bg-[#8a3ffc]" });
  }
  if (order.status === "SHIPPED") {
    actions.push({ label: "Mark In Transit", status: "IN_TRANSIT", color: "bg-[#005d5d]" });
  }
  if (order.status === "IN_TRANSIT") {
    actions.push({ label: "Mark Arrived", status: "ARRIVED", color: "bg-[#198038]" });
  }
  if (order.status === "ARRIVED" && (user?.role === "REGULATOR" || user?.role === "ADMIN")) {
    actions.push({ label: "Mark Cleared", status: "CLEARED", color: "bg-[#393939]" });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/orders" className="p-2 hover:bg-[#e0e0e0] rounded transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="nafis-page-title">{order.nafisRef}</h1>
              <span
                className="nafis-badge"
                style={{
                  backgroundColor: `${ORDER_STATUS_COLORS[order.status]}15`,
                  color: ORDER_STATUS_COLORS[order.status],
                }}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
            <p className="nafis-page-subtitle">
              {order.commodityName} · {order.quantity.toLocaleString()} {order.unit} from {order.originCountry}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {actions.map((action) => (
            <button
              key={action.status}
              onClick={() => changeStatus(action.status)}
              disabled={actionLoading}
              className={`h-10 px-5 text-white text-sm font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50 ${action.color}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status timeline */}
      <div className="nafis-card mb-6">
        <div className="nafis-card-title mb-4">Order Timeline</div>
        <div className="flex items-center justify-between">
          {STATUS_ORDER.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    i < currentStatusIndex
                      ? "bg-[#198038] text-white"
                      : i === currentStatusIndex
                      ? "bg-[#0f62fe] text-white ring-4 ring-[#0f62fe]/20"
                      : "bg-[#e0e0e0] text-[#8d8d8d]"
                  }`}
                >
                  {i < currentStatusIndex ? <Checkmark size={14} /> : i + 1}
                </div>
                <span className="text-[10px] text-[#525252] mt-2 text-center whitespace-nowrap">
                  {ORDER_STATUS_LABELS[s]}
                </span>
              </div>
              {i < STATUS_ORDER.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    i < currentStatusIndex ? "bg-[#198038]" : "bg-[#e0e0e0]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="nafis-card">
            <div className="nafis-card-title mb-4">Order Details</div>
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <div className="text-xs text-[#8d8d8d]">Commodity</div>
                <div className="text-sm font-medium mt-0.5">{order.commodityName}</div>
                <div className="text-xs text-[#8d8d8d]">HS {order.commodityHsCode}</div>
              </div>
              <div>
                <div className="text-xs text-[#8d8d8d]">Quantity</div>
                <div className="text-sm font-medium mt-0.5">
                  {order.quantity.toLocaleString()} {order.unit}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#8d8d8d]">Origin</div>
                <div className="text-sm font-medium mt-0.5">{order.originCountry}</div>
                {order.originPort && (
                  <div className="text-xs text-[#8d8d8d]">{order.originPort}</div>
                )}
              </div>
              <div>
                <div className="text-xs text-[#8d8d8d]">Destination</div>
                <div className="text-sm font-medium mt-0.5">{order.destinationPort}</div>
              </div>
              <div>
                <div className="text-xs text-[#8d8d8d]">Supplier</div>
                <div className="text-sm font-medium mt-0.5">{order.supplierName || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-[#8d8d8d]">Value</div>
                <div className="text-sm font-medium mt-0.5">
                  {order.totalValue
                    ? `${order.totalValue.toLocaleString()} ${order.currency}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#8d8d8d]">Est. Ship Date</div>
                <div className="text-sm font-medium mt-0.5">
                  {order.estimatedShipDate
                    ? new Date(order.estimatedShipDate).toLocaleDateString()
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#8d8d8d]">Est. Arrival</div>
                <div className="text-sm font-medium mt-0.5">
                  {order.estimatedArrivalDate
                    ? new Date(order.estimatedArrivalDate).toLocaleDateString()
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Shipment info */}
          <div className="nafis-card">
            <div className="nafis-card-header">
              <span className="nafis-card-title">Shipment</span>
              {!order.shipment && order.status !== "DRAFT" && (
                <button
                  onClick={() => setShowShipmentForm(true)}
                  className="text-xs text-[#0f62fe] hover:underline"
                >
                  + Link Vessel
                </button>
              )}
            </div>
            {order.shipment ? (
              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <div className="text-xs text-[#8d8d8d]">Vessel</div>
                  <div className="text-sm font-medium mt-0.5 flex items-center gap-1.5">
                    <Shuttle size={14} />
                    {order.shipment.vesselName || "Unknown"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8d8d8d]">MMSI</div>
                  <div className="text-sm font-mono mt-0.5">
                    {order.shipment.vesselMmsi || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8d8d8d]">Shipping Line</div>
                  <div className="text-sm font-medium mt-0.5">
                    {order.shipment.shippingLine || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8d8d8d]">ETA</div>
                  <div className="text-sm font-medium mt-0.5">
                    {order.shipment.eta
                      ? new Date(order.shipment.eta).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
                {order.shipment.lastKnownLat && (
                  <div className="col-span-2">
                    <div className="text-xs text-[#8d8d8d]">Last Position</div>
                    <div className="text-sm font-mono mt-0.5">
                      {order.shipment.lastKnownLat.toFixed(4)},{" "}
                      {order.shipment.lastKnownLng.toFixed(4)}
                    </div>
                  </div>
                )}
              </div>
            ) : showShipmentForm ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Vessel Name"
                    value={shipmentForm.vesselName}
                    onChange={(e) =>
                      setShipmentForm({ ...shipmentForm, vesselName: e.target.value })
                    }
                    className="h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
                  />
                  <input
                    type="text"
                    placeholder="MMSI Number"
                    value={shipmentForm.vesselMmsi}
                    onChange={(e) =>
                      setShipmentForm({ ...shipmentForm, vesselMmsi: e.target.value })
                    }
                    className="h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
                  />
                  <input
                    type="text"
                    placeholder="IMO Number"
                    value={shipmentForm.vesselImo}
                    onChange={(e) =>
                      setShipmentForm({ ...shipmentForm, vesselImo: e.target.value })
                    }
                    className="h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
                  />
                  <input
                    type="text"
                    placeholder="Shipping Line"
                    value={shipmentForm.shippingLine}
                    onChange={(e) =>
                      setShipmentForm({ ...shipmentForm, shippingLine: e.target.value })
                    }
                    className="h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={linkShipment}
                    disabled={actionLoading}
                    className="h-9 px-4 bg-[#0f62fe] text-white text-xs font-medium rounded hover:bg-[#0353e9] disabled:opacity-50"
                  >
                    Link Vessel
                  </button>
                  <button
                    onClick={() => setShowShipmentForm(false)}
                    className="h-9 px-4 text-xs text-[#525252] hover:bg-[#f4f4f4] rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#8d8d8d]">No vessel linked yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Importer info */}
          <div className="nafis-card">
            <div className="nafis-card-title mb-4">Importer</div>
            <div className="text-sm font-medium">{order.importer.name}</div>
            <div className="text-xs text-[#8d8d8d]">{order.importer.email}</div>
            {order.importer.company && (
              <div className="text-xs text-[#8d8d8d] mt-1">
                {order.importer.company.name}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="nafis-card">
            <div className="nafis-card-title mb-4">
              Documents ({order.documents.length})
            </div>
            {order.documents.length > 0 ? (
              <div className="space-y-2">
                {order.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-[#f4f4f4]"
                  >
                    <DocIcon size={16} className="text-[#8d8d8d]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {doc.fileName}
                      </div>
                      <div className="text-[10px] text-[#8d8d8d]">
                        {doc.type.replace(/_/g, " ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8d8d8d]">No documents uploaded</p>
            )}
          </div>

          {/* Activity log */}
          <div className="nafis-card">
            <div className="nafis-card-title mb-4">Activity</div>
            <div className="space-y-3">
              {order.statusLogs.map((log: any) => (
                <div key={log.id} className="flex gap-2">
                  <Time size={14} className="text-[#8d8d8d] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs">
                      <span className="font-medium">{log.user.name}</span>{" "}
                      changed status to{" "}
                      <span className="font-medium">
                        {ORDER_STATUS_LABELS[log.toStatus] || log.toStatus}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#8d8d8d]">
                      {new Date(log.changedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
