import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomerAccountCompletionForm from "@/components/customer/CustomerAccountCompletionForm";

export const dynamic = "force-dynamic";

export default async function CompleteCustomerAccountPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const query = await searchParams;
  const next = query.next?.startsWith("/") && !query.next.startsWith("//") ? query.next : "/customer";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/customer/login?next=${encodeURIComponent(`/customer/complete-account?next=${next}`)}`);

  const { data: customer } = await supabase.from("customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  if (customer) redirect(next);

  const name = String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim().split(/\s+/);
  const firstName = String(user.user_metadata?.first_name || name[0] || "");
  const lastName = String(user.user_metadata?.last_name || name.slice(1).join(" ") || "");
  const phone = String(user.user_metadata?.phone || "");

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12"><CustomerAccountCompletionForm firstName={firstName} lastName={lastName} email={user.email ?? ""} phone={phone} next={next} /></main>;
}
