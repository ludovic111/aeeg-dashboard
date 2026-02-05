import type { ShopifyOrder, ShopifyProduct } from "./types";

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

function getShopifyUrl(path: string) {
  return `https://${SHOPIFY_STORE_URL}/admin/api/2024-01/${path}`;
}

function getHeaders() {
  return {
    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN!,
    "Content-Type": "application/json",
  };
}

export async function isShopifyConfigured(): Promise<boolean> {
  return !!(SHOPIFY_STORE_URL && SHOPIFY_ACCESS_TOKEN);
}

export async function fetchShopifyOrders(
  startDate?: string,
  endDate?: string
): Promise<ShopifyOrder[]> {
  if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error("Shopify credentials not configured");
  }

  const params = new URLSearchParams({ status: "any", limit: "250" });
  if (startDate) params.set("created_at_min", startDate);
  if (endDate) params.set("created_at_max", endDate);

  const res = await fetch(
    getShopifyUrl(`orders.json?${params.toString()}`),
    { headers: getHeaders() }
  );

  if (!res.ok) {
    throw new Error(`Shopify API error: ${res.status}`);
  }

  const data = await res.json();
  return data.orders || [];
}

export async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error("Shopify credentials not configured");
  }

  const res = await fetch(getShopifyUrl("products.json?limit=250"), {
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Shopify API error: ${res.status}`);
  }

  const data = await res.json();
  return data.products || [];
}
