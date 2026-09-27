import crypto from "crypto";

export function effectivePrice(price: number, discount = 0) {
  if (!discount) return price;
  return Math.round(price * (1 - discount / 100) * 100) / 100;
}

export function formatCurrency(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function generateTrackingNumber(): string {
  const year = new Date().getFullYear();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += alphabet[crypto.randomInt(0, alphabet.length)];
  return `ORD-${year}-${code}`;
}

export function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const STATUS_FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;