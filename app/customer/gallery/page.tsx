import Link from "next/link";
import { ArrowLeft, Images } from "lucide-react";
import BusinessContentFeed, { type ContentBusiness } from "@/components/customer/BusinessContentFeed";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CustomerGalleryPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("businesses").select("id,name,slug").eq("active", true).order("name");
  const businesses = (data ?? []) as ContentBusiness[];

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-[#03162F]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Link href="/customer/businesses" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="h-4 w-4" />All businesses</Link>
        <header className="mb-6 rounded-3xl bg-gradient-to-br from-[#03162F] to-[#174D8C] p-6 text-white sm:p-8">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37]"><Images className="h-4 w-4" />Alessandro Enterprises</p>
          <h1 className="mt-2 text-3xl font-black">Business Gallery</h1>
          <p className="mt-2 text-sm text-blue-100">Explore photos from every business. Tap any image to preview it and find the right next step.</p>
        </header>
        <BusinessContentFeed businesses={businesses} kind="gallery" />
      </div>
    </main>
  );
}
