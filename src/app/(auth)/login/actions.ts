"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Use the DB helper function to get department for the now-authenticated user
  const { data: department } = await supabase.rpc("get_current_staff_department");

  if (!department) {
    await supabase.auth.signOut();
    return { error: "No active staff record found for this account." };
  }

  const redirectTo = department === "FSE" ? "/my-calls" : "/dashboard";
  redirect(redirectTo);
}

export async function loginWithOtp(phone: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({ phone });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function verifyOtp(phone: string, token: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error) {
    return { error: error.message };
  }

  // Use the DB helper function to get department for the now-authenticated user
  const { data: department } = await supabase.rpc("get_current_staff_department");

  if (!department) {
    await supabase.auth.signOut();
    return { error: "No active staff record found for this account." };
  }

  const redirectTo = department === "FSE" ? "/my-calls" : "/dashboard";
  redirect(redirectTo);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
