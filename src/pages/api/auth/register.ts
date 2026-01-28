import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email i hasło są wymagane" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/login`,
      },
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            message: error.message,
            code: error.code,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Sign out the user immediately after registration to prevent auto-login
    await supabase.auth.signOut();

    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas rejestracji" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
