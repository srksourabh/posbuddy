import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that only Back Office / Management / Stock users should access
const BACKOFFICE_ROUTES = [
  "/dashboard",
  "/calls",
  "/import",
  "/reports",
  "/master",
  "/settings",
  "/admin",
];

// Routes that only FSE users should access
const FSE_ROUTES = ["/my-calls", "/active-visit", "/history", "/profile"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
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

  const pathname = request.nextUrl.pathname;

  // Allow public routes (login, auth callback, SSO)
  if (pathname.startsWith("/login") || pathname.startsWith("/auth")) {
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Department-based route protection
  const isBackOfficeRoute = BACKOFFICE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isFseRoute = FSE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isBackOfficeRoute || isFseRoute) {
    // Check cached department cookie first to avoid DB query on every request
    let department = request.cookies.get("x-staff-department")?.value;

    if (!department) {
      const { data: staff } = await supabase
        .from("pos_staff")
        .select("department")
        .eq("auth_user_id", user.id)
        .eq("is_active", true)
        .single();

      department = staff?.department ?? undefined;

      // Cache department in a cookie for subsequent requests
      if (department) {
        supabaseResponse.cookies.set("x-staff-department", department, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60, // 1 hour
        });
      }
    }

    if (department) {
      const isFse = department === "FSE";

      // FSE trying to access Back Office routes → redirect to /my-calls
      if (isFse && isBackOfficeRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/my-calls";
        return NextResponse.redirect(url);
      }

      // Non-FSE trying to access FSE routes → redirect to /dashboard
      if (!isFse && isFseRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
