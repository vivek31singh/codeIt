import { NextResponse } from "next/server";
import { supabase } from "../supabaseClient";

export const GoogleAuth = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: 'http://127.0.0.1:3000/api/auth/socialCallback',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
        },
      })
      
      if (data.url && !error) {
        NextResponse.redirect(data.url)
      }
      
};

export const GithubAuth = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: 'http://127.0.0.1:3000/api/auth/socialCallback',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
        },
      })
      
      if (data.url && !error) {
        NextResponse.redirect(data.url)
      }
      
};