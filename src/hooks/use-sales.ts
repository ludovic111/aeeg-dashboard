"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SalesEntry, SalesStats } from "@/types";

export function useSales(startDate?: string, endDate?: string) {
  const [entries, setEntries] = useState<SalesEntry[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    totalRevenue: 0,
    orderCount: 0,
    averageOrder: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSales = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("sales_entries")
      .select("*")
      .order("date", { ascending: false });

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);

    const { data } = await query;
    const salesData = (data as SalesEntry[]) || [];
    setEntries(salesData);

    const totalRevenue = salesData.reduce(
      (sum, e) => sum + Number(e.revenue),
      0
    );
    const orderCount = salesData.length;
    const averageOrder = orderCount > 0 ? totalRevenue / orderCount : 0;

    setStats({ totalRevenue, orderCount, averageOrder });
    setLoading(false);
  }, [supabase, startDate, endDate]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return { entries, stats, loading, refetch: fetchSales };
}

export function useSalesMutations() {
  const supabase = createClient();

  const createSale = async (data: {
    product_name: string;
    quantity: number;
    revenue: number;
    date: string;
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("sales_entries").insert({
      ...data,
      source: "manual",
      created_by: user?.id,
    });
    return { error };
  };

  const deleteSale = async (id: string) => {
    const { error } = await supabase
      .from("sales_entries")
      .delete()
      .eq("id", id);
    return { error };
  };

  const syncShopify = async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);

    const res = await fetch(`/api/shopify/orders?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erreur de synchronisation");
    }

    return data;
  };

  return { createSale, deleteSale, syncShopify };
}
