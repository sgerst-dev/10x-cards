import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

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
const PROTECTED_PATHS = ["/", "/flashcards", "/study"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create server-side Supabase instance with user session
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Set supabase instance in locals (with user session)
  locals.supabase = supabase;

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

  // Redirect authenticated users away from auth pages
  if (user && url.pathname.startsWith("/auth/")) {
    return redirect("/");
  }

  // Skip further auth checks for public paths (API endpoints)
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // Protect authenticated routes
  if (!user && PROTECTED_PATHS.some((path) => url.pathname.startsWith(path))) {
    return redirect(`/auth/login?redirect=${encodeURIComponent(url.pathname)}`);
  }

  return next();
});
