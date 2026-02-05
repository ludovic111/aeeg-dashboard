"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CustomerOrder } from "@/types";
import {
  formatOrderItems,
  parseLegacyOrderDetails,
} from "@/lib/orders";

export function useOrders() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      setLoading(true);
      const { data } = await supabase
        .from("customer_orders")
        .select("*")
        .order("imported_at", { ascending: false })
        .order("order_number", { ascending: false });

      if (!mounted) return;
      const normalized = ((data as CustomerOrder[]) || []).map((order) => ({
        ...order,
        order_items:
          Array.isArray(order.order_items) && order.order_items.length > 0
            ? order.order_items
            : parseLegacyOrderDetails(order.order_details),
      }));
      setOrders(normalized);
      setLoading(false);
    }

    loadOrders();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const saveOrder = async (data: {
    id?: string;
    order_number: string;
    full_name: string;
    order_items: CustomerOrder["order_items"];
    email?: string;
  }) => {
    const { id, ...orderData } = data;
    const payload = {
      ...orderData,
      email: orderData.email || null,
      order_details: formatOrderItems(orderData.order_items),
      imported_at: new Date().toISOString(),
    };

    const query = id
      ? supabase
          .from("customer_orders")
          .update(payload)
          .eq("id", id)
          .select("*")
          .single()
      : supabase
          .from("customer_orders")
          .upsert(payload, { onConflict: "order_number" })
          .select("*")
          .single();

    const { data: savedOrder, error } = await query;

    if (!error && savedOrder) {
      setOrders((prev) => [
        savedOrder as CustomerOrder,
        ...prev.filter((order) => order.id !== savedOrder.id),
      ]);
    }

    return { error };
  };

  return { orders, loading, saveOrder };
}
