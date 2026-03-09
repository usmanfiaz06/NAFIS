import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateNafisRef(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `NAFIS-${year}-${random}`;
}

export function formatQuantity(quantity: number, unit: string): string {
  return `${quantity.toLocaleString()} ${unit}`;
}

export function formatCurrency(amount: number, currency: string = "SAR"): string {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In Transit",
  ARRIVED: "Arrived",
  CLEARED: "Cleared",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  DRAFT: "#8d8d8d",
  SUBMITTED: "#0f62fe",
  APPROVED: "#198038",
  SHIPPED: "#8a3ffc",
  IN_TRANSIT: "#005d5d",
  ARRIVED: "#0e6027",
  CLEARED: "#393939",
};
