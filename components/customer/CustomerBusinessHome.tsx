"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, Image as ImageIcon, Megaphone, Package, Search, Sparkles, Wrench } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Business { id: string; name: string; slug: string; description: string | null; logo_url: string | null; }
interface Item { id: string; name: string; description: string | null; item_type: string | null; category: string | null; base_price: number | null; quantity: number | null; image_url: string | null; }

export default function CustomerBusinessHome({ business }: { business: Business }) {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category") ?? "";
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const search = categoryFilter || searchInput;

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.from("enterprise_catalog")
        .select("id, name, description, item_type, category, base_price, quantity, image_url")
        .eq("business_id", business.id).ilike("status", "active").order("created_at", { ascending: false });
      if (!active) return;
      if (error) { console.error(`Unable to load ${business.name} catalog:`, error); setItems([]); }
      else setItems((data ?? []) as Item[]);
      setLoading(false);
    };
    void load();
    const channel = supabase.channel(`customer-business-${business.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "enterprise_catalog", filter: `business_id=eq.${business.id}` }, () => { void load(); })
      .subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, [business.id, business.name]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? items.filter((item) => [item.name, item.description, item.category, item.item_type].filter(Boolean).join(" ").toLowerCase().includes(term)) : items;
  }, [items, search]);
  const products = filtered.filter((item) => (item.item_type ?? "").toLowerCase().includes("product") || (business.slug === "elite-fashion" && !item.item_type?.trim()));
  const services = filtered.filter((item) => (item.item_type ?? "").toLowerCase().includes("service"));
  const categories = useMemo(() => {
    const grouped = new Map<string, Item[]>();
    for (const item of items) {
      const name = item.category?.trim() || (item.item_type?.toLowerCase().includes("service") ? "Services" : "Products");
      grouped.set(name, [...(grouped.get(name) ?? []), item]);
    }
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const currency = (value: number | null) => value == null ? "Contact us" : `ZMW ${Number(value).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return <main className="min-h-screen bg-[#f5f7fb] pb-24 text-[#03162F]"><div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#03162F] via-[#0A2852] to-[#174D8C] p-6 text-white shadow-xl sm:p-9"><div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#D4AF37]/15 blur-3xl"/><div className="relative flex flex-col gap-6 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-4">{business.logo_url ? <img src={business.logo_url} alt={`${business.name} logo`} className="h-16 w-16 shrink-0 rounded-2xl bg-white p-2 object-contain"/> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37]"><BriefcaseBusiness className="h-7 w-7"/></span>}<div className="min-w-0"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]"><Sparkles className="h-4 w-4"/>Alessandro Enterprises</p><h1 className="mt-1 text-2xl font-black sm:text-4xl">{business.name}</h1></div></div><p className="max-w-xl text-sm leading-6 text-blue-100">{business.description || `Explore products and services offered by ${business.name}.`}</p></div></section>

    <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"><Stat title="Products" value={loading ? "…" : products.length} icon={Package}/><Stat title="Services" value={loading ? "…" : services.length} icon={Wrench}/><Stat title="Categories" value={loading ? "…" : categories.length} icon={BriefcaseBusiness}/></section>

    <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#B08D1E]">Browse this business</p><h2 className="mt-1 text-2xl font-black">Products & Services</h2></div><label className="relative block w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search products and services" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"/></label></section>

    {loading ? <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0,1,2,3].map((n) => <div key={n} className="h-64 animate-pulse rounded-2xl bg-white"/>)}</section> : filtered.length ? <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{filtered.slice(0, 12).map((item) => { const isService = item.item_type?.toLowerCase().includes("service"); return <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="aspect-[4/3] bg-slate-100">{item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-slate-300">{isService ? <Wrench className="h-12 w-12"/> : <Package className="h-12 w-12"/>}</div>}</div><div className="p-4"><p className="text-[10px] font-black uppercase tracking-wider text-[#B08D1E]">{item.category || (isService ? "Service" : "Product")}</p><h3 className="mt-1 line-clamp-2 font-black">{item.name}</h3>{item.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p>}<div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3"><span className="text-sm font-black">{currency(item.base_price)}</span>{!isService && item.quantity !== null && <span className="text-[10px] font-semibold text-slate-500">{item.quantity} in stock</span>}</div></div></article>; })}</section> : <section className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Package className="mx-auto h-9 w-9 text-slate-300"/><p className="mt-3 font-bold">{search ? "No matching items" : "No active items yet"}</p><p className="mt-1 text-sm text-slate-500">Active products and services from this business will appear here.</p></section>}

    <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><CustomerLink href={`/customer/businesses/${business.slug}/products`} title="View all products" description="See available items, prices and stock." icon={Package}/><CustomerLink href={`/customer/businesses/${business.slug}/services`} title="View all services" description="Explore services offered by this business." icon={Wrench}/><CustomerLink href={`/customer/businesses/${business.slug}/promotions`} title="Promotions" description="See current offers and specials." icon={Megaphone}/><CustomerLink href={`/customer/businesses/${business.slug}/gallery`} title="Gallery & updates" description="Browse business photos and latest posts." icon={ImageIcon}/></section>

    {categories.length > 0 && <section className="mt-9"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#B08D1E]">Explore</p><h2 className="mt-1 text-2xl font-black">Browse by category</h2></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{categories.map(([name, group]) => <Link key={name} href={`/customer/businesses/${business.slug}?category=${encodeURIComponent(name)}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]"><BriefcaseBusiness className="h-5 w-5"/></span><h3 className="mt-3 font-black">{name}</h3><p className="mt-1 text-xs text-slate-500">{group.length} item{group.length === 1 ? "" : "s"}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-bold">Explore <ArrowRight className="h-3 w-3"/></span></Link>)}</div></section>}
  </div></main>;
}

function Stat({ title, value, icon: Icon }: { title: string; value: string | number; icon: typeof Package }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{title}</p><Icon className="h-4 w-4 text-[#B08D1E]"/></div><p className="mt-2 text-2xl font-black">{value}</p></div>; }
function CustomerLink({ href, title, description, icon: Icon }: { href: string; title: string; description: string; icon: typeof Package }) { return <Link href={href} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#D4AF37] hover:shadow-md"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]"><Icon className="h-5 w-5"/></span><span className="min-w-0 flex-1"><span className="block font-black">{title}</span><span className="mt-1 block text-xs text-slate-500">{description}</span></span><ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1"/></Link>; }

