import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - redirect to login if not authenticated
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/register") &&
    !request.nextUrl.pathname.startsWith("/api/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    // Fetch user role to handle pending users
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role;

    // Block pending users from dashboard — redirect to /pending
    if (
      userRole === "pending" &&
      !request.nextUrl.pathname.startsWith("/pending") &&
      !request.nextUrl.pathname.startsWith("/api/auth")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/pending";
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages
    if (
      request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/register")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = userRole === "pending" ? "/pending" : "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
