import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Public routes that don't require authentication
const publicRoutes = ["/login", "/auth/callback", "/privacy-policy", "/terms-of-service"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;
  const pathname = url.pathname;

  // Extract Authorization header
  const authHeader = context.request.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");

  // Create a new Supabase client for each request with the user's token
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
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
