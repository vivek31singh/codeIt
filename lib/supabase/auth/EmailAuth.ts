"use server"
import { supabase } from "../supabaseClient";

type EmailAuthParams = {
  email: string;
  password: string;
  redirectTo: string;
};

export async function signUpNewUser({
  email,
  password,
  redirectTo,
}: EmailAuthParams) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    return { data: data, error };
  } catch (error) {
    console.log(error);
    return { data: null, error: error };
  }
}

export async function signInWithEmail({ email, password }: EmailAuthParams) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    return { data: data, error };
  } catch (error) {
    console.log(error);
    return { data: null, error: error };
  }
}

export async function resetPassword({ email, redirectTo }: EmailAuthParams) {
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo,
  });
}

export async function updatePassword(new_password: string) {
  await supabase.auth.updateUser({ password: new_password });
}
