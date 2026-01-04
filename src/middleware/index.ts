import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Public routes that don't require authentication
const publicRoutes = ["/login", "/auth/callback", "/privacy-policy", "/terms-of-service"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect, cookies, request } = context;
  const pathname = url.pathname;

  // Create a Supabase client with cookie-based session storage
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Parse cookies from request headers since Astro doesn't have getAll()
        const cookieHeader = request.headers.get("Cookie") || "";
        if (!cookieHeader) return [];

        return cookieHeader.split(";").map((cookie) => {
          const [name, ...valueParts] = cookie.trim().split("=");
          return {
            name: name.trim(),
            value: valueParts.join("=").trim(),
          };
        });
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options);
        });
      },
    },
  });

  context.locals.supabase = supabase;

  // Check session for authenticated routes
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect unauthenticated users to login page
  if (!session && !publicRoutes.includes(pathname)) {
    return redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  // Redirect authenticated users away from login page
  if (session && pathname === "/login") {
    const redirectParam = url.searchParams.get("redirect");
    let safeRedirect = "/dashboard";

    if (redirectParam) {
      try {
        const redirectURL = new URL(redirectParam, url.origin);
        // Check if the redirect URL is from the same origin (security)
        if (redirectURL.origin === url.origin) {
          safeRedirect = redirectURL.pathname;
        }
      } catch {
        console.warn("Invalid redirect URL:", redirectParam);
      }
    }

    return redirect(safeRedirect);
  }

  return next();
});
