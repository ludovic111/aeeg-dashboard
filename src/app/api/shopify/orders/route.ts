import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchShopifyOrders,
  isShopifyConfigured,
} from "@/lib/shopify/client";

export async function GET(request: Request) {
  const supabase = await createClient();

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Check Shopify config
  if (!(await isShopifyConfigured())) {
    return NextResponse.json(
      { error: "Shopify non configuré", configured: false },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date") || undefined;
    const endDate = searchParams.get("end_date") || undefined;

    const orders = await fetchShopifyOrders(startDate, endDate);

    // Sync orders to sales_entries
    let syncedCount = 0;
    for (const order of orders) {
      for (const item of order.line_items) {
        const { error } = await supabase.from("sales_entries").upsert(
          {
            product_name: item.title,
            quantity: item.quantity,
            revenue: parseFloat(item.price) * item.quantity,
            date: order.created_at,
            source: "shopify",
            shopify_order_id: `${order.id}-${item.id}`,
            created_by: user.id,
          },
          { onConflict: "shopify_order_id" }
        );
        if (!error) syncedCount++;
      }
    }

    return NextResponse.json({
      synced: syncedCount,
      total_orders: orders.length,
    });
  } catch (error) {
    console.error("Shopify sync error:", error);
    return NextResponse.json(
      { error: "Erreur de synchronisation Shopify" },
      { status: 500 }
    );
  }
}
