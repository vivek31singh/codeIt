import { NextRequest, NextResponse } from "next/server";
import { supabase } from "./lib/supabase/supabaseClient";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Extract tokens from URL hash (only happens after login/signup redirect)
  if (req.nextUrl.hash.includes("access_token")) {
    const params = new URLSearchParams(req.nextUrl.hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      // Store tokens in Supabase session
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });



      // Remove tokens from URL for security
      const url = new URL(req.nextUrl);
      url.hash = "";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/"], // Run middleware only on the home page
};

