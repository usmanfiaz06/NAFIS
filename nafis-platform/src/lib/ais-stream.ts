import WebSocket from "ws";

export interface VesselPosition {
  mmsi: string;
  lat: number;
  lng: number;
  speed: number;
  course: number;
  heading: number;
  timestamp: string;
  vesselName?: string;
}

type PositionCallback = (position: VesselPosition) => void;

export class AISStreamClient {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private mmsiList: string[];
  private onPosition: PositionCallback;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(apiKey: string, mmsiList: string[], onPosition: PositionCallback) {
    this.apiKey = apiKey;
    this.mmsiList = mmsiList;
    this.onPosition = onPosition;
  }

  connect() {
    if (!this.apiKey || this.apiKey === "your_aisstream_api_key_here") {
      console.log("[AIS] No API key configured, skipping AIS connection");
      return;
    }

    this.ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

    this.ws.on("open", () => {
      console.log("[AIS] Connected to AISStream.io");
      const subscribeMsg = {
        APIKey: this.apiKey,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FilterMessageTypes: ["PositionReport"],
        FiltersShipMMSI: this.mmsiList,
      };
      this.ws?.send(JSON.stringify(subscribeMsg));
    });

    this.ws.on("message", (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.MessageType === "PositionReport") {
          const report = msg.Message?.PositionReport;
          const meta = msg.MetaData;
          if (report && meta) {
            this.onPosition({
              mmsi: String(meta.MMSI),
              lat: report.Latitude,
              lng: report.Longitude,
              speed: report.Sog ?? 0,
              course: report.Cog ?? 0,
              heading: report.TrueHeading ?? 0,
              timestamp: meta.time_utc ?? new Date().toISOString(),
              vesselName: meta.ShipName?.trim() || undefined,
            });
          }
        }
      } catch (err) {
        console.error("[AIS] Parse error:", err);
      }
    });

    this.ws.on("close", () => {
      console.log("[AIS] Disconnected, reconnecting in 5s...");
      this.reconnectTimeout = setTimeout(() => this.connect(), 5000);
    });

    this.ws.on("error", (err) => {
      console.error("[AIS] WebSocket error:", err.message);
    });
  }

  updateMMSIList(mmsiList: string[]) {
    this.mmsiList = mmsiList;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.disconnect();
      this.connect();
    }
  }

  disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.ws?.close();
    this.ws = null;
  }
}

export function calculateETA(
  vesselLat: number,
  vesselLng: number,
  portLat: number,
  portLng: number,
  speedKnots: number
): Date | null {
  if (speedKnots <= 0) return null;

  const R = 3440.065; // Earth radius in nautical miles
  const dLat = ((portLat - vesselLat) * Math.PI) / 180;
  const dLng = ((portLng - vesselLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((vesselLat * Math.PI) / 180) *
      Math.cos((portLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceNm = R * c;

  const hoursToArrival = distanceNm / speedKnots;
  const eta = new Date();
  eta.setHours(eta.getHours() + hoursToArrival);
  return eta;
}
