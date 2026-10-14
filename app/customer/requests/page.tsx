import Link from "next/link";
import { ArrowRight, CalendarDays, FileText, Mail, MessageCircle, ShoppingBag } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RequestItem = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  business?: string | null;
  detail?: string | null;
  href: string;
};

function RequestCard({ item }: { item: RequestItem }) {
  return (
    <Link href={item.href} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D4AF37]/60 hover:shadow-md">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#03162F]">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-[#03162F]">{item.title}</p>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold capitalize text-amber-700">{item.status || "Pending"}</span>
        </div>
        <p className="mt-1 truncate text-xs text-slate-500">{item.business || "Alessandro Enterprises"}{item.detail ? ` · ${item.detail}` : ""}</p>
        <p className="mt-1 text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" })}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#9A7910]" />
    </Link>
  );
}

export default async function CustomerRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let requests: RequestItem[] = [];

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("email,phone").eq("auth_user_id", user.id).maybeSingle();
    let customer: { id: string } | null = null;
    const customerEmail = profile?.email || user.email;
    if (customerEmail) {
      const result = await supabase.from("customers").select("id").eq("email", customerEmail).maybeSingle();
      customer = result.data;
    }
    if (!customer && profile?.phone) {
      const result = await supabase.from("customers").select("id").eq("phone", profile.phone).maybeSingle();
      customer = result.data;
    }

    if (customer) {
      const [bookings, orders, messages] = await Promise.all([
        supabase.from("bookings").select("id,status,created_at,booking_date,booking_time,businesses(name)").eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("orders").select("id,status,created_at,businesses(name)").eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("messages").select("id,subject,status,created_at,businesses(name)").eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(10),
      ]);
      requests = [
        ...((bookings.data ?? []) as any[]).map((item) => ({ id: item.id, title: item.businesses?.name ? `${item.businesses.name} booking` : "Service booking", status: item.status, created_at: item.created_at, business: item.businesses?.name, detail: [item.booking_date, item.booking_time].filter(Boolean).join(" · "), href: "/customer/bookings" })),
        ...((orders.data ?? []) as any[]).map((item) => ({ id: item.id, title: item.businesses?.name ? `${item.businesses.name} order` : "Product order", status: item.status, created_at: item.created_at, business: item.businesses?.name, href: "/customer/orders" })),
        ...((messages.data ?? []) as any[]).map((item) => ({ id: item.id, title: item.subject || "Message to a business", status: item.status, created_at: item.created_at, business: item.businesses?.name, href: "/customer/messages" })),
      ].sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
  }

  const shortcuts = [
    { title: "Bookings", description: "Appointments and service requests", href: "/customer/bookings", icon: CalendarDays },
    { title: "Orders", description: "Products, delivery and order status", href: "/customer/orders", icon: ShoppingBag },
    { title: "Messages", description: "Requests and conversations with the team", href: "/customer/messages", icon: MessageCircle },
    { title: "Emails", description: "Customer email correspondence", href: "/customer/emails", icon: Mail },
  ];

  return (
    <main className="min-h-screen bg-slate-50 pb-24">

      <section className="bg-[#03162F] px-4 pb-8 pt-7 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Customer account</p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">Requests</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Review the bookings, orders and messages you have sent to Alessandro businesses.</p>
        </div>
      </section>
      <div className="mx-auto grid w-full max-w-5xl gap-7 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.8fr)]">
        <section className="space-y-3">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div><h2 className="text-lg font-black text-[#03162F]">Recent activity</h2><p className="mt-1 text-xs text-slate-500">Your latest customer requests, newest first.</p></div>
            <Link href="/customer/activity" className="shrink-0 text-xs font-bold text-[#9A7910]">Activity history</Link>
          </div>
          {requests.map((item) => <RequestCard key={`${item.href}-${item.id}`} item={item} />)}
          {!user ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"><p className="font-bold text-[#03162F]">Sign in to view your requests</p><p className="mt-2 text-sm text-slate-500">Your customer activity appears here after you sign in.</p><Link href="/customer/login" className="mt-4 inline-flex rounded-xl bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white">Sign in</Link></div> : requests.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"><p className="font-bold text-[#03162F]">No requests yet</p><p className="mt-2 text-sm text-slate-500">Bookings, orders and messages you send will appear here.</p></div> : null}
        </section>
        <aside className="space-y-3">
          <h2 className="mb-4 text-lg font-black text-[#03162F]">Manage requests</h2>
          {shortcuts.map(({ title, description, href, icon: Icon }) => <Link key={title} href={href} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#D4AF37]/60 hover:shadow-md"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-white"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#03162F]">{title}</span><span className="mt-1 block text-xs text-slate-500">{description}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#9A7910]" /></Link>)}
          <Link href="/customer/businesses/soft-loans/history" className="block rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-[#03162F]">Loan applications</p><p className="mt-1 text-xs leading-5 text-slate-600">Review your Alessandro Soft Loans application status and history.</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#8A6D13]">View loan history <ArrowRight className="h-3.5 w-3.5" /></span></Link>
        </aside>
      </div>
    </main>
  );
}
