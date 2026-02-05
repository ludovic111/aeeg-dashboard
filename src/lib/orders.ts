import type {
  CustomerOrder,
  CustomerOrderItem,
  OrderProduct,
  SweatColor,
  SweatSize,
} from "@/types";

export const ORDER_PRODUCTS = ["emilie_gourde", "sweat_emilie_gourd"] as const;
export const SWEAT_COLORS = [
  "gris",
  "bleu_marine",
  "vert",
  "noir",
  "rose",
] as const;
export const SWEAT_SIZES = ["s", "m", "l", "xl"] as const;

export const ORDER_PRODUCT_LABELS: Record<OrderProduct, string> = {
  emilie_gourde: "Émilie-Gourde",
  sweat_emilie_gourd: "Sweat Emilie Gourd",
};

export const SWEAT_COLOR_LABELS: Record<SweatColor, string> = {
  gris: "Gris",
  bleu_marine: "Bleu Marine",
  vert: "Vert",
  noir: "Noir",
  rose: "Rose",
};

export const SWEAT_SIZE_LABELS: Record<SweatSize, string> = {
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
};

export const ORDER_PRICES_CHF: Record<OrderProduct, number> = {
  emilie_gourde: 15,
  sweat_emilie_gourd: 35,
};

export interface OrderSalesSummary {
  sweatCount: number;
  gourdeCount: number;
  totalRevenueChf: number;
}

const COLOR_ALIASES: Record<string, SweatColor> = {
  gris: "gris",
  "bleu marine": "bleu_marine",
  bleu_marine: "bleu_marine",
  vert: "vert",
  noir: "noir",
  rose: "rose",
};

const SIZE_ALIASES: Record<string, SweatSize> = {
  s: "s",
  m: "m",
  l: "l",
  xl: "xl",
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeColor(value: string): SweatColor | undefined {
  return COLOR_ALIASES[normalizeText(value)];
}

function normalizeSize(value: string): SweatSize | undefined {
  return SIZE_ALIASES[normalizeText(value)];
}

function parseLegacyLine(line: string): CustomerOrderItem | null {
  const qtyMatch = line.match(/^\s*(\d+)\s*x\s*(.+)$/i);
  const quantity = qtyMatch ? Number.parseInt(qtyMatch[1], 10) : 1;
  const rawDescription = qtyMatch ? qtyMatch[2] : line;

  if (!Number.isInteger(quantity) || quantity < 1) {
    return null;
  }

  const description = rawDescription.trim();
  const normalized = normalizeText(description);

  if (normalized.startsWith("sweat emilie gourd")) {
    const segments = description
      .split("-")
      .map((segment) => segment.trim())
      .filter(Boolean);

    const color = segments[1] ? normalizeColor(segments[1]) : undefined;
    const size = segments[2] ? normalizeSize(segments[2]) : undefined;

    return {
      product: "sweat_emilie_gourd",
      quantity,
      ...(color ? { color } : {}),
      ...(size ? { size } : {}),
    };
  }

  if (normalized.includes("gourde")) {
    return {
      product: "emilie_gourde",
      quantity,
    };
  }

  return null;
}

export function parseLegacyOrderDetails(orderDetails: string): CustomerOrderItem[] {
  return orderDetails
    .split(/\s*\+\s*/)
    .map((line) => parseLegacyLine(line.trim()))
    .filter((item): item is CustomerOrderItem => Boolean(item));
}

export function formatOrderItem(item: CustomerOrderItem): string {
  const base = `${item.quantity}x ${ORDER_PRODUCT_LABELS[item.product]}`;

  if (item.product !== "sweat_emilie_gourd") {
    return base;
  }

  const colorLabel = item.color ? SWEAT_COLOR_LABELS[item.color] : "-";
  const sizeLabel = item.size ? SWEAT_SIZE_LABELS[item.size] : "-";

  return `${base} - ${colorLabel} - ${sizeLabel}`;
}

export function formatOrderItems(items: CustomerOrderItem[]): string {
  return items.map((item) => formatOrderItem(item)).join(" + ");
}

function summarizeItems(items: CustomerOrderItem[]): OrderSalesSummary {
  return items.reduce<OrderSalesSummary>(
    (acc, item) => {
      const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
      if (item.product === "sweat_emilie_gourd") {
        acc.sweatCount += quantity;
      }
      if (item.product === "emilie_gourde") {
        acc.gourdeCount += quantity;
      }
      acc.totalRevenueChf += ORDER_PRICES_CHF[item.product] * quantity;
      return acc;
    },
    { sweatCount: 0, gourdeCount: 0, totalRevenueChf: 0 }
  );
}

function getOrderItems(
  order: Pick<CustomerOrder, "order_items" | "order_details">
): CustomerOrderItem[] {
  if (Array.isArray(order.order_items) && order.order_items.length > 0) {
    return order.order_items;
  }
  return parseLegacyOrderDetails(order.order_details || "");
}

export function summarizeOrderSales(
  order: Pick<CustomerOrder, "order_items" | "order_details">
): OrderSalesSummary {
  return summarizeItems(getOrderItems(order));
}

export function summarizeOrdersSales(
  orders: Array<Pick<CustomerOrder, "order_items" | "order_details">>
): OrderSalesSummary {
  return orders.reduce<OrderSalesSummary>(
    (acc, order) => {
      const summary = summarizeOrderSales(order);
      acc.sweatCount += summary.sweatCount;
      acc.gourdeCount += summary.gourdeCount;
      acc.totalRevenueChf += summary.totalRevenueChf;
      return acc;
    },
    { sweatCount: 0, gourdeCount: 0, totalRevenueChf: 0 }
  );
}
