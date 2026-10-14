import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import BusinessContentFeed from "@/components/customer/BusinessContentFeed";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BusinessUpdatesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: business } = await supabase.from("businesses").select("id,name,slug,active").eq("slug", slug).eq("active", true).maybeSingle();
  if (!business) redirect("/customer/businesses");
  return <main className="min-h-screen bg-slate-50 pb-24 text-[#03162F]"><div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
    <Link href={`/customer/businesses/${slug}`} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="h-4 w-4" />Back to {business.name}</Link>
    <header className="mb-6 rounded-3xl bg-gradient-to-br from-[#03162F] to-[#174D8C] p-6 text-white"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37]"><Sparkles className="h-4 w-4" />{business.name}</p><h1 className="mt-2 text-3xl font-black">Updates</h1><p className="mt-2 text-sm text-blue-100">News and announcements published by this business.</p></header>
    <BusinessContentFeed businesses={[business]} businessId={business.id} kind="posts" />
  </div></main>;
}
