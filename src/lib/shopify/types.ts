export interface ShopifyOrder {
  id: number;
  name: string;
  created_at: string;
  total_price: string;
  line_items: ShopifyLineItem[];
}

export interface ShopifyLineItem {
  id: number;
  title: string;
  quantity: number;
  price: string;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  status: string;
  variants: ShopifyVariant[];
  image?: { src: string };
}

export interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  inventory_quantity: number;
}
