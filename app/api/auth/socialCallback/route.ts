import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabaseClient";
import axios from "axios";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // Exchange the auth code for a session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // Get authenticated user
  const user = data.session?.user;

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // ✅ Send user data to your backend API
  try {
    await axios.post("/api/auth/user", {
      id: user.id,
      email: user.email,
      name: user.user_metadata.full_name,
      avatar: user.user_metadata.avatar_url,
      provider: user.app_metadata.provider,
    });
  } catch (backendError) {
    console.error("Backend API Error:", backendError);
  }

  // Redirect user after authentication
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`);
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  } else {
    return NextResponse.redirect(`${origin}${next}`);
  }
}
