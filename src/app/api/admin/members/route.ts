import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Admin client with service role key (can delete auth users)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");

  if (!userId) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  // Verify the caller is a superadmin
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "superadmin") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  // Prevent superadmin from deleting themselves
  if (userId === user.id) {
    return NextResponse.json(
      { error: "Impossible de supprimer votre propre compte" },
      { status: 400 }
    );
  }

  // Delete the auth user (cascades to delete profile)
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    return NextResponse.json(
      { error: error.message || "Erreur lors de la suppression" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
