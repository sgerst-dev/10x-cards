import { defineMiddleware } from "astro:middleware";
import { supabaseClient, createSupabaseServerInstance } from "../db/supabase.client";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
];

// Protected paths that require authentication
const PROTECTED_PATHS = ["/generate", "/flashcards", "/study"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Set supabase client for backward compatibility
  locals.supabase = supabaseClient;

  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // Create server-side Supabase instance
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Set user in locals if authenticated
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email ?? null,
    };
  }

  // Handle root path redirect
  if (url.pathname === "/") {
    if (user) {
      return redirect("/generate");
    } else {
      return redirect("/auth/login");
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && url.pathname.startsWith("/auth/")) {
    return redirect("/generate");
  }

  // Protect authenticated routes
  if (!user && PROTECTED_PATHS.some((path) => url.pathname.startsWith(path))) {
    return redirect(`/auth/login?redirect=${encodeURIComponent(url.pathname)}`);
  }

  return next();
});
