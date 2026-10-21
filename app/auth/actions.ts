/**
 * Auth Server Actions — login, signup, logout.
 *
 * Server Actions are functions that run on the server when a form is submitted.
 * They can read/write cookies and redirect the user.
 *
 * We use "use server" so Next.js knows these are server-side only.
 * Each action returns an error object (or null) so the client form can display it.
 */
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Shape of the error returned to the form */
export type AuthResult = {
  error: string;
} | null;

/**
 * Log in with email and password.
 * Called by the login form via useActionState.
 */
export async function loginAction(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Basic server-side validation
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Success → go to home page
  redirect("/");
}

/**
 * Sign up with email and password.
 * Called by the signup form via useActionState.
 */
export async function signupAction(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Basic server-side validation
  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Success → go to home page
  // (Supabase may require email confirmation depending on your settings)
  redirect("/");
}

/**
 * Log out and redirect to /login.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
