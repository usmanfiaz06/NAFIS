"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Shuttle, Location, Renew } from "@carbon/icons-react";

const VesselMap = dynamic(() => import("@/components/tracking/VesselMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-[#e0e0e0] rounded-xl animate-pulse flex items-center justify-center">
      <span className="text-[#8d8d8d]">Loading map...</span>
    </div>
  ),
});

export default function TrackingPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);

  const fetchShipments = () => {
    setLoading(true);
    fetch("/api/shipments/active")
      .then((r) => r.json())
      .then(setShipments)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchShipments();
    const interval = setInterval(fetchShipments, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="nafis-page-header mb-0">
          <h1 className="nafis-page-title">Vessel Tracking</h1>
          <p className="nafis-page-subtitle">
            Real-time tracking of food import shipments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#8d8d8d]">
            {shipments.length} active vessels
          </span>
          <button
            onClick={fetchShipments}
            className="flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-[#525252] bg-white border border-[#e0e0e0] rounded hover:bg-[#f4f4f4] transition-colors"
          >
            <Renew size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3">
          <VesselMap shipments={shipments} height="600px" />
        </div>

        {/* Vessel list */}
        <div className="nafis-card p-0 max-h-[600px] overflow-y-auto">
          <div className="sticky top-0 bg-white px-4 py-3 border-b border-[#e0e0e0]">
            <span className="text-xs font-medium text-[#525252]">
              Tracked Vessels
            </span>
          </div>
          {shipments.length === 0 ? (
            <div className="p-6 text-center">
              <Shuttle size={32} className="text-[#e0e0e0] mx-auto mb-2" />
              <p className="text-xs text-[#8d8d8d]">
                No active vessels being tracked
              </p>
              <p className="text-[10px] text-[#c6c6c6] mt-1">
                Link vessels to orders to start tracking
              </p>
            </div>
          ) : (
            <div>
              {shipments.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedVessel(s.id)}
                  className={`w-full text-left p-4 border-b border-[#f4f4f4] hover:bg-[#f9f9f9] transition-colors ${
                    selectedVessel === s.id ? "bg-[#edf5ff]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Shuttle size={14} className="text-[#0f62fe]" />
                    <span className="text-sm font-medium">
                      {s.vesselName || "Unknown"}
                    </span>
                  </div>
                  <div className="text-xs text-[#8d8d8d] ml-5">
                    {s.order.nafisRef}
                  </div>
                  <div className="text-xs text-[#525252] ml-5 mt-1">
                    {s.order.commodityName} ·{" "}
                    {s.order.quantity.toLocaleString()} {s.order.unit}
                  </div>
                  <div className="text-xs text-[#8d8d8d] ml-5 mt-1">
                    {s.order.originCountry} → {s.order.destinationPort}
                  </div>
                  {s.lastKnownLat && (
                    <div className="flex items-center gap-1 text-[10px] text-[#8d8d8d] ml-5 mt-1">
                      <Location size={10} />
                      {s.lastKnownLat.toFixed(2)}, {s.lastKnownLng.toFixed(2)}
                    </div>
                  )}
                  {s.eta && (
                    <div className="text-xs text-[#0f62fe] font-medium ml-5 mt-1">
                      ETA: {new Date(s.eta).toLocaleDateString()}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
