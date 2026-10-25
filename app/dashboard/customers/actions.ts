"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createCustomer } from "@/modules/customers/services/customer.service";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createCustomerAction(data: {
  business_id: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  gender?: string;
  date_of_birth?: string;
  notes?: string;
  is_active?: boolean;
}) {
  await createCustomer(data);

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");
}

export async function sendCustomerPasswordReset(customerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in with an authorized staff account to reset a customer password.");
  const { data: allowed, error: permissionError } = await supabase.rpc("has_permission", { required_permission: "customers.manage" });
  if (permissionError || allowed !== true) throw new Error("You do not have permission to manage customer accounts.");

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id,auth_user_id,email,is_active,status")
    .eq("id", customerId)
    .maybeSingle();
  if (customerError || !customer) throw new Error("Customer account could not be found.");
  if (!customer.auth_user_id || !customer.email) throw new Error("This customer does not have a linked Customer App login.");
  if (customer.is_active !== true || String(customer.status).toLowerCase() !== "active") throw new Error("Reactivate this customer account before sending a password reset link.");

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://alessandroenterprises.com";
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(customer.email, {
    redirectTo: new URL("/customer/reset-password", origin).toString(),
  });
  if (resetError) throw new Error("The password reset email could not be sent. Check email delivery settings and try again.");

  const admin = createAdminClient();
  const { data: actor } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle();
  await admin.from("activity_logs").insert({
    actor_profile_id: actor?.id ?? null,
    actor_auth_user_id: user.id,
    action: "password_reset_requested",
    resource: "customer_account",
    resource_id: customer.id,
    summary: `Sent a customer password reset link to ${customer.email}`,
    metadata: { target_auth_user_id: customer.auth_user_id },
  });
  revalidatePath("/dashboard/customers");
  return { email: customer.email };
}
