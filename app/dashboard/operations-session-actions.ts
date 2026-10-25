"use server";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const COOKIE = "aeos_ops_token";
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: 12 * 60 * 60 };
function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }

export async function openOperationsSession(pin: string) {
  if (!/^\d{4}$/.test(pin)) throw new Error("Enter your four-digit manager PIN to open operations.");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in as a manager to open operations.");
  const token = randomBytes(32).toString("hex");
  const { data, error } = await supabase.rpc("start_operations_session_with_pin", { p_token_hash: hashToken(token), p_pin: pin });
  if (error || data !== true) throw new Error(error?.message || "The manager PIN is incorrect or your account is not authorized to open operations.");
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, cookieOptions);
  revalidatePath("/dashboard");
  return { token };
}

export async function getOperationsSessionContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_operations_context", { p_token_hash: hashToken(token) });
  if (error || !data?.length) return null;
  return { ...data[0], token };
}

export async function signInOperatorWithPin(input: { email: string; pin: string }) {
  const email = input.email.trim().toLowerCase();
  if (!email || !/^\d{4}$/.test(input.pin)) throw new Error("Enter your work email and four-digit PIN.");
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) throw new Error("The manager must open an operations session first.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_staff_operator_pin", { p_email: email, p_pin: input.pin, p_token_hash: hashToken(token) });
  if (error || !data?.length) throw new Error(error?.message || "Your sign-in could not be verified.");
  revalidatePath("/dashboard");
  return { token, profile: data[0] };
}

export async function signOutOperator() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return { success: true };
  const supabase = await createClient();
  const { error } = await supabase.rpc("end_staff_operator_session", { p_token_hash: hashToken(token) });
  if (error) throw new Error(error.message || "The staff session could not be closed.");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function closeOperationsSession(pin: string) {
  if (!/^\d{4}$/.test(pin)) throw new Error("Enter your four-digit manager PIN to lock operations.");
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return { success: true };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("close_operations_session_with_pin", { p_token_hash: hashToken(token), p_pin: pin });
  if (error || data !== true) throw new Error(error?.message || "The manager PIN is incorrect or your account is not authorized to lock operations.");
  cookieStore.set(COOKIE, "", { ...cookieOptions, maxAge: 0 });
  revalidatePath("/dashboard");
  return { success: true };
}

