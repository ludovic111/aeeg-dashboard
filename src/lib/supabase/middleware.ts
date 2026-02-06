import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });
  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isTutorialGatePage =
    pathname.startsWith("/welcome") || pathname.startsWith("/watch-tutorial");
  const isAuthApiRoute = pathname.startsWith("/api/auth");
  const hasTutorialGate =
    request.cookies.get("tutorial_gate")?.value === "done";

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

  // Unauthenticated users must pass the tutorial gate before auth pages.
  if (!user && !isTutorialGatePage && !isAuthApiRoute) {
    if (isAuthPage && hasTutorialGate) {
      return supabaseResponse;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/welcome";
    return NextResponse.redirect(url);
  }

  if (user) {
    // Fetch user role to handle pending users
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role as string | undefined;

    // Block pending users from dashboard — redirect to /pending
    if (
      (userRole === "pending" || userRole === "regular_member") &&
      !pathname.startsWith("/pending") &&
      !isAuthApiRoute
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/pending";
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from tutorial/auth pages
    if (isAuthPage || isTutorialGatePage) {
      const url = request.nextUrl.clone();
      url.pathname =
        userRole === "pending" || userRole === "regular_member"
          ? "/pending"
          : "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
