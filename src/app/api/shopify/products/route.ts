import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchShopifyProducts,
  isShopifyConfigured,
} from "@/lib/shopify/client";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!(await isShopifyConfigured())) {
    return NextResponse.json(
      { error: "Shopify non configuré", configured: false },
      { status: 503 }
    );
  }

  try {
    const products = await fetchShopifyProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Shopify products error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des produits" },
      { status: 500 }
    );
  }
}
