"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Checkmark } from "@carbon/icons-react";
import Link from "next/link";

const FOOD_HS_CODES = [
  { code: "1001", name: "Wheat", category: "Cereals" },
  { code: "1006", name: "Rice", category: "Cereals" },
  { code: "1005", name: "Corn/Maize", category: "Cereals" },
  { code: "1003", name: "Barley", category: "Cereals" },
  { code: "0207", name: "Poultry Meat", category: "Meat" },
  { code: "0201", name: "Bovine Meat (Fresh)", category: "Meat" },
  { code: "0202", name: "Bovine Meat (Frozen)", category: "Meat" },
  { code: "0203", name: "Pork Meat", category: "Meat" },
  { code: "0402", name: "Milk & Cream", category: "Dairy" },
  { code: "0405", name: "Butter", category: "Dairy" },
  { code: "0406", name: "Cheese", category: "Dairy" },
  { code: "1701", name: "Sugar (Cane/Beet)", category: "Sugar" },
  { code: "1507", name: "Soybean Oil", category: "Edible Oils" },
  { code: "1511", name: "Palm Oil", category: "Edible Oils" },
  { code: "1512", name: "Sunflower Oil", category: "Edible Oils" },
  { code: "0805", name: "Citrus Fruits", category: "Fruits" },
  { code: "0803", name: "Bananas", category: "Fruits" },
  { code: "0702", name: "Tomatoes", category: "Vegetables" },
  { code: "0701", name: "Potatoes", category: "Vegetables" },
  { code: "0713", name: "Dried Legumes/Lentils", category: "Pulses" },
  { code: "1901", name: "Infant Food Preparations", category: "Prepared Foods" },
  { code: "2106", name: "Food Preparations", category: "Prepared Foods" },
];

const SAUDI_PORTS = [
  "SAJED - Jeddah Islamic Port",
  "SADMM - King Abdulaziz Port (Dammam)",
  "SAJUB - Jubail Commercial Port",
  "SAYNB - Yanbu Commercial Port",
  "SAJIЗ - Jizan Port",
];

const ORIGIN_COUNTRIES = [
  "Brazil", "India", "Australia", "Argentina", "United States",
  "Canada", "Ukraine", "Russia", "Thailand", "Indonesia",
  "Malaysia", "New Zealand", "Ireland", "Netherlands", "France",
  "Germany", "Turkey", "Egypt", "South Africa", "China",
];

export default function NewOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    commodityHsCode: "",
    commodityName: "",
    commodityCategory: "",
    quantity: "",
    unit: "MT",
    originCountry: "",
    originPort: "",
    destinationPort: "",
    estimatedShipDate: "",
    estimatedArrivalDate: "",
    totalValue: "",
    currency: "SAR",
    supplierName: "",
    notes: "",
  });

  const handleCommoditySelect = (item: typeof FOOD_HS_CODES[0]) => {
    setForm({
      ...form,
      commodityHsCode: item.code,
      commodityName: item.name,
      commodityCategory: item.category,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create order");
        return;
      }
      const order = await res.json();
      router.push(`/orders/${order.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Commodity", "Supplier & Origin", "Logistics", "Review"];

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/orders"
          className="p-2 hover:bg-[#e0e0e0] rounded transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="nafis-page-title">New Import Order</h1>
          <p className="nafis-page-subtitle">
            Register a new food import order for tracking
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                i === step
                  ? "bg-[#0f62fe] text-white"
                  : i < step
                  ? "bg-[#defbe6] text-[#198038]"
                  : "bg-[#f4f4f4] text-[#8d8d8d]"
              }`}
            >
              {i < step ? <Checkmark size={14} /> : <span>{i + 1}</span>}
              {s}
            </button>
            {i < steps.length - 1 && (
              <div className="w-8 h-px bg-[#e0e0e0]" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-3 bg-[#fff1f1] border-l-4 border-[#da1e28] text-sm text-[#da1e28]">
          {error}
        </div>
      )}

      <div className="nafis-card max-w-3xl">
        {/* Step 0: Commodity */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Select Commodity</h2>
            <p className="text-sm text-[#525252] mb-6">
              Choose the food commodity for this import order
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {FOOD_HS_CODES.map((item) => (
                <button
                  key={item.code}
                  onClick={() => handleCommoditySelect(item)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    form.commodityHsCode === item.code
                      ? "border-[#0f62fe] bg-[#edf5ff] ring-1 ring-[#0f62fe]"
                      : "border-[#e0e0e0] hover:border-[#8d8d8d]"
                  }`}
                >
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-[#8d8d8d] mt-0.5">
                    HS {item.code} · {item.category}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1.5">
                  Quantity
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="e.g. 25000"
                  className="w-full h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1.5">
                  Unit
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
                >
                  <option value="MT">Metric Tons (MT)</option>
                  <option value="KG">Kilograms (KG)</option>
                  <option value="Units">Units</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Supplier & Origin */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Supplier & Origin</h2>
            <p className="text-sm text-[#525252] mb-6">
              Provide supplier and origin details
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1.5">
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={form.supplierName}
                  onChange={(e) =>
                    setForm({ ...form, supplierName: e.target.value })
                  }
                  placeholder="e.g. Global Grain Trading Co."
                  className="w-full h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1.5">
                  Origin Country
                </label>
                <select
                  value={form.originCountry}
                  onChange={(e) =>
                    setForm({ ...form, originCountry: e.target.value })
                  }
                  className="w-full h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
                >
                  <option value="">Select country</option>
                  {ORIGIN_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1.5">
                  Origin Port (optional)
                </label>
                <input
                  type="text"
                  value={form.originPort}
                  onChange={(e) =>
                    setForm({ ...form, originPort: e.target.value })
                  }
                  placeholder="e.g. BRSSZ - Santos"
                  className="w-full h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#525252] mb-1.5">
                    Total Value
                  </label>
                  <input
                    type="number"
                    value={form.totalValue}
                    onChange={(e) =>
                      setForm({ ...form, totalValue: e.target.value })
                    }
                    placeholder="e.g. 5000000"
                    className="w-full h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#525252] mb-1.5">
                    Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) =>
                      setForm({ ...form, currency: e.target.value })
                    }
                    className="w-full h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
                  >
                    <option value="SAR">SAR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Logistics */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Logistics</h2>
            <p className="text-sm text-[#525252] mb-6">
              Shipping details and timeline
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1.5">
                  Destination Port
                </label>
                <select
                  value={form.destinationPort}
                  onChange={(e) =>
                    setForm({ ...form, destinationPort: e.target.value })
                  }
                  className="w-full h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
                >
                  <option value="">Select port</option>
                  {SAUDI_PORTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#525252] mb-1.5">
                    Estimated Ship Date
                  </label>
                  <input
                    type="date"
                    value={form.estimatedShipDate}
                    onChange={(e) =>
                      setForm({ ...form, estimatedShipDate: e.target.value })
                    }
                    className="w-full h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#525252] mb-1.5">
                    Estimated Arrival Date
                  </label>
                  <input
                    type="date"
                    value={form.estimatedArrivalDate}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        estimatedArrivalDate: e.target.value,
                      })
                    }
                    className="w-full h-10 px-4 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Any additional information..."
                  className="w-full px-4 py-3 bg-white border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#0f62fe] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Review Order</h2>
            <p className="text-sm text-[#525252] mb-6">
              Confirm the details before submitting
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#f4f4f4] rounded-lg">
                  <div className="text-xs text-[#8d8d8d] mb-1">Commodity</div>
                  <div className="text-sm font-medium">{form.commodityName}</div>
                  <div className="text-xs text-[#8d8d8d]">
                    HS {form.commodityHsCode} · {form.commodityCategory}
                  </div>
                </div>
                <div className="p-4 bg-[#f4f4f4] rounded-lg">
                  <div className="text-xs text-[#8d8d8d] mb-1">Quantity</div>
                  <div className="text-sm font-medium">
                    {parseFloat(form.quantity || "0").toLocaleString()} {form.unit}
                  </div>
                </div>
                <div className="p-4 bg-[#f4f4f4] rounded-lg">
                  <div className="text-xs text-[#8d8d8d] mb-1">Origin</div>
                  <div className="text-sm font-medium">{form.originCountry}</div>
                  {form.originPort && (
                    <div className="text-xs text-[#8d8d8d]">{form.originPort}</div>
                  )}
                </div>
                <div className="p-4 bg-[#f4f4f4] rounded-lg">
                  <div className="text-xs text-[#8d8d8d] mb-1">Destination</div>
                  <div className="text-sm font-medium">{form.destinationPort}</div>
                </div>
                <div className="p-4 bg-[#f4f4f4] rounded-lg">
                  <div className="text-xs text-[#8d8d8d] mb-1">Supplier</div>
                  <div className="text-sm font-medium">
                    {form.supplierName || "—"}
                  </div>
                </div>
                <div className="p-4 bg-[#f4f4f4] rounded-lg">
                  <div className="text-xs text-[#8d8d8d] mb-1">Value</div>
                  <div className="text-sm font-medium">
                    {form.totalValue
                      ? `${parseFloat(form.totalValue).toLocaleString()} ${form.currency}`
                      : "—"}
                  </div>
                </div>
              </div>
              {form.notes && (
                <div className="p-4 bg-[#f4f4f4] rounded-lg">
                  <div className="text-xs text-[#8d8d8d] mb-1">Notes</div>
                  <div className="text-sm">{form.notes}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#e0e0e0]">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 h-10 px-5 text-sm font-medium text-[#525252] hover:bg-[#f4f4f4] rounded transition-colors disabled:opacity-30"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 0 && (!form.commodityHsCode || !form.quantity)) ||
                (step === 1 && !form.originCountry) ||
                (step === 2 && !form.destinationPort)
              }
              className="flex items-center gap-2 h-10 px-5 bg-[#0f62fe] text-white text-sm font-medium rounded hover:bg-[#0353e9] transition-colors disabled:opacity-50"
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 h-10 px-6 bg-[#198038] text-white text-sm font-medium rounded hover:bg-[#0e6027] transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Order"}
              <Checkmark size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
