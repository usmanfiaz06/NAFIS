"use client";

import { useEffect, useState } from "react";
import {
  WarningAlt,
  WarningAltFilled,
  Information,
  Checkmark,
} from "@carbon/icons-react";

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  relatedCommodity: string | null;
  isRead: boolean;
  createdAt: string;
}

const severityConfig: Record<string, { icon: any; color: string; bg: string }> = {
  CRITICAL: { icon: WarningAltFilled, color: "text-[#da1e28]", bg: "bg-[#fff1f1]" },
  HIGH: { icon: WarningAlt, color: "text-[#da1e28]", bg: "bg-[#fff1f1]" },
  MEDIUM: { icon: WarningAlt, color: "text-[#f1c21b]", bg: "bg-[#fcf4d6]" },
  LOW: { icon: Information, color: "text-[#0f62fe]", bg: "bg-[#edf5ff]" },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => setAlerts(data.alerts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const markAsRead = async (alertId: string) => {
    setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)));
  };

  return (
    <div>
      <div className="nafis-page-header">
        <h1 className="nafis-page-title">Alerts</h1>
        <p className="nafis-page-subtitle">
          Risk alerts and notifications for the food import pipeline
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[#e0e0e0] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="nafis-card text-center py-12">
          <Checkmark size={32} className="text-[#198038] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#161616]">All clear</p>
          <p className="text-xs text-[#8d8d8d] mt-1">
            No active alerts at this time
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity] || severityConfig.LOW;
            const Icon = config.icon;
            return (
              <div
                key={alert.id}
                className={`nafis-card flex items-start gap-4 ${
                  alert.isRead ? "opacity-60" : ""
                }`}
              >
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <Icon size={20} className={config.color} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{alert.title}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f4f4f4] text-[#525252]">
                      {alert.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-[#525252]">{alert.message}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] text-[#8d8d8d]">
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                    {alert.relatedCommodity && (
                      <span className="text-[10px] text-[#8d8d8d]">
                        Commodity: {alert.relatedCommodity}
                      </span>
                    )}
                    {!alert.isRead && (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="text-[10px] text-[#0f62fe] hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
