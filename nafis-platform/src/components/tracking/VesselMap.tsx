"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Vessel icon
const vesselIcon = new L.DivIcon({
  className: "vessel-marker",
  html: `<div style="width:28px;height:28px;background:#0f62fe;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
    <svg width="14" height="14" viewBox="0 0 32 32" fill="white"><path d="M26,20H22V14a2,2,0,0,0-2-2H12a2,2,0,0,0-2,2v6H6a1,1,0,0,0-.98,1.2l1.52,7.58A2,2,0,0,0,8.5,30h15a2,2,0,0,0,1.96-1.22L26.98,21.2A1,1,0,0,0,26,20Z"/></svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Saudi port locations
const SAUDI_PORTS: Record<string, [number, number]> = {
  "SAJED - Jeddah Islamic Port": [21.4858, 39.1925],
  "SADMM - King Abdulaziz Port (Dammam)": [26.4473, 50.1025],
  "SAJUB - Jubail Commercial Port": [27.0046, 49.6601],
  "SAYNB - Yanbu Commercial Port": [24.0895, 38.0618],
};

const portIcon = new L.DivIcon({
  className: "port-marker",
  html: `<div style="width:12px;height:12px;background:#da1e28;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

interface Shipment {
  id: string;
  vesselName: string | null;
  vesselMmsi: string | null;
  lastKnownLat: number | null;
  lastKnownLng: number | null;
  status: string;
  eta: string | null;
  order: {
    nafisRef: string;
    commodityName: string;
    quantity: number;
    unit: string;
    originCountry: string;
    destinationPort: string;
    importer: { name: string };
  };
}

interface VesselMapProps {
  shipments?: Shipment[];
  height?: string;
  showPorts?: boolean;
}

function FitBounds({ shipments }: { shipments: Shipment[] }) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = shipments
      .filter((s) => s.lastKnownLat && s.lastKnownLng)
      .map((s) => [s.lastKnownLat!, s.lastKnownLng!]);

    // Add Saudi ports
    Object.values(SAUDI_PORTS).forEach((p) => points.push(p));

    if (points.length > 0) {
      map.fitBounds(points, { padding: [50, 50] });
    }
  }, [shipments, map]);
  return null;
}

export default function VesselMap({
  shipments = [],
  height = "500px",
  showPorts = true,
}: VesselMapProps) {
  return (
    <MapContainer
      center={[25, 45]}
      zoom={4}
      style={{ height, width: "100%", borderRadius: "12px" }}
      scrollWheelZoom={true}
    >
      {/* OpenSeaMap nautical layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <TileLayer
        attribution='&copy; <a href="http://www.openseamap.org">OpenSeaMap</a>'
        url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
        opacity={0.6}
      />

      {/* Saudi ports */}
      {showPorts &&
        Object.entries(SAUDI_PORTS).map(([name, pos]) => (
          <Marker key={name} position={pos} icon={portIcon}>
            <Popup>
              <div className="text-xs">
                <strong>{name}</strong>
                <br />
                Saudi Arabia
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Vessel markers */}
      {shipments
        .filter((s) => s.lastKnownLat && s.lastKnownLng)
        .map((s) => (
          <Marker
            key={s.id}
            position={[s.lastKnownLat!, s.lastKnownLng!]}
            icon={vesselIcon}
          >
            <Popup>
              <div className="text-xs space-y-1 min-w-[200px]">
                <div className="font-semibold text-sm">
                  {s.vesselName || "Unknown Vessel"}
                </div>
                <div className="text-[#8d8d8d]">
                  MMSI: {s.vesselMmsi || "—"}
                </div>
                <hr className="my-1" />
                <div>
                  <strong>{s.order.nafisRef}</strong>
                </div>
                <div>
                  {s.order.commodityName} · {s.order.quantity.toLocaleString()}{" "}
                  {s.order.unit}
                </div>
                <div>From: {s.order.originCountry}</div>
                <div>To: {s.order.destinationPort}</div>
                <div>Importer: {s.order.importer.name}</div>
                {s.eta && (
                  <div className="font-medium text-[#0f62fe]">
                    ETA: {new Date(s.eta).toLocaleDateString()}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

      <FitBounds shipments={shipments} />
    </MapContainer>
  );
}
