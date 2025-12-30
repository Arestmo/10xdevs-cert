import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const onRequest = defineMiddleware((context, next) => {
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
  return next();
});
