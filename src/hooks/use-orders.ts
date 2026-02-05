"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CustomerOrder } from "@/types";

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
      setOrders((data as CustomerOrder[]) || []);
      setLoading(false);
    }

    loadOrders();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const upsertOrder = async (data: {
    order_number: string;
    full_name: string;
    order_details: string;
    email?: string;
  }) => {
    const payload = {
      ...data,
      email: data.email || null,
      imported_at: new Date().toISOString(),
    };

    const { data: savedOrder, error } = await supabase
      .from("customer_orders")
      .upsert(payload, { onConflict: "order_number" })
      .select("*")
      .single();

    if (!error && savedOrder) {
      setOrders((prev) => [
        savedOrder as CustomerOrder,
        ...prev.filter((order) => order.order_number !== savedOrder.order_number),
      ]);
    }

    return { error };
  };

  return { orders, loading, upsertOrder };
}
