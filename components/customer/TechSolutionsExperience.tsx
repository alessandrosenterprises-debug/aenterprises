"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Code2,
  Headphones, Laptop, Monitor, Network, Package, Printer, Search, Server,
  ShieldCheck, Smartphone, Sparkles, Wrench,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { matchesTechnologyCategory, technologyCategoryCapabilities } from "@/modules/catalog/utils/technology-category";

type Business = { id: string; name: string; slug: string; description?: string | null; logo_url?: string | null };
type CatalogItem = { id: string; name: string; description: string | null; item_type: string | null; category: string | null; base_price: number | null; quantity: number | null; image_url: string | null; business_id: string };
const categories = [
  { id: "computers-laptops", title: "Computers & Laptops", detail: "Laptops, desktops and upgrades", icon: Laptop, color: "blue" },
  { id: "phones-tablets", title: "Phones & Tablets", detail: "Smartphones, tablets and setup", icon: Smartphone, color: "violet" },
  { id: "accessories", title: "Accessories", detail: "Chargers, cables and essentials", icon: Package, color: "amber" },
  { id: "networking", title: "Networking", detail: "Wi-Fi, routers and installation", icon: Network, color: "cyan" },
  { id: "software-applications", title: "Software", detail: "Licensing, setup and support", icon: Monitor, color: "emerald" },
  { id: "repairs-maintenance", title: "Repairs & Maintenance", detail: "Diagnostics and device repairs", icon: Wrench, color: "orange" },
  { id: "printers-printing", title: "Printers & Printing", detail: "Printers, scanners and supplies", icon: Printer, color: "slate" },
  { id: "cctv-security", title: "CCTV & Security", detail: "Cameras and security systems", icon: ShieldCheck, color: "rose" },
  { id: "data-storage", title: "Data & Storage", detail: "Backups, storage and recovery", icon: Server, color: "indigo" },
  { id: "it-support", title: "IT Support", detail: "Help for people and businesses", icon: Headphones, color: "sky" },
  { id: "web-digital-solutions", title: "Web & Digital", detail: "Websites and digital systems", icon: Code2, color: "fuchsia" },
  { id: "technology-consultation", title: "Consultation", detail: "Get expert technology guidance", icon: Sparkles, color: "gold" },
] as const;
const toneClasses: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100", violet: "bg-violet-50 text-violet-700 ring-violet-100", amber: "bg-amber-50 text-amber-700 ring-amber-100", cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100", emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100", orange: "bg-orange-50 text-orange-700 ring-orange-100", slate: "bg-slate-100 text-slate-700 ring-slate-200", rose: "bg-rose-50 text-rose-700 ring-rose-100", indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100", sky: "bg-sky-50 text-sky-700 ring-sky-100", fuchsia: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100", gold: "bg-[#D4AF37]/15 text-[#8a6d13] ring-[#D4AF37]/20",
};
function price(value: number | null) { return value == null ? "Ask for price" : `ZMW ${Number(value).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function itemHref(item: CatalogItem, slug: string) {
  const type = item.item_type?.toLowerCase().includes("service") ? "services" : "products";
  const category = categories.find((entry) => matchesTechnologyCategory(item, entry.id));
  return category ? `/customer/businesses/${slug}/technology/${category.id}/${type}` : `/customer/businesses/${slug}/${type}`;
}

export default function TechSolutionsExperience({ business }: { business: Business }) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data, error } = await supabase.from("enterprise_catalog")
        .select("id,name,description,item_type,category,base_price,quantity,image_url,business_id")
        .eq("business_id", business.id).ilike("status", "active").order("created_at", { ascending: false });
      if (!alive) return;
      if (error) { console.error("Unable to load Tech Solutions catalogue:", error); setItems([]); }
      else setItems((data ?? []) as CatalogItem[]);
      setLoading(false);
    };
    void load();
    const channel = supabase.channel(`tech-solutions-catalog-${business.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "enterprise_catalog", filter: `business_id=eq.${business.id}` }, () => { void load(); })
      .subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [business.id]);

  const products = useMemo(() => items.filter((item) => item.item_type?.toLowerCase().includes("product")), [items]);
  const services = useMemo(() => items.filter((item) => item.item_type?.toLowerCase().includes("service")), [items]);
  const slides = useMemo(() => [...products, ...services].filter((item) => item.image_url).slice(0, 6), [products, services]);
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const query = search.trim().toLowerCase();
  const matches = useMemo(() => query ? items.filter((item) => [item.name, item.description, item.category, item.item_type].filter(Boolean).join(" ").toLowerCase().includes(query)) : [], [items, query]);
  const featuredProducts = products.slice(0, 4);
  const featuredServices = services.slice(0, 4);
  const currentSlide = slides[slide];

  return <main className="min-h-screen bg-[#f3f6fb] pb-28 text-[#03162F]">
    <div className="mx-auto max-w-7xl space-y-9 px-4 py-5 sm:px-6 lg:px-8">
      <section className="relative isolate overflow-hidden rounded-[30px] bg-[#03162F] shadow-xl">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-[#D4AF37]/15 blur-3xl" />
        <div className="relative grid min-h-[400px] gap-8 p-6 sm:p-9 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:p-12">
          <div className="animate-[tech-rise_.55s_ease-out_both]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-white/[0.07] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-[#E8CA62]">
              {business.logo_url ? <img src={business.logo_url} alt="" className="h-6 w-6 rounded-full bg-white object-contain p-0.5" /> : <BadgeCheck className="h-4 w-4" />}{business.name}<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Available
            </div>
            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-5xl">Technology, support and solutions that <span className="text-[#D4AF37]">move you forward.</span></h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Shop trusted technology, book a skilled technician or get expert guidance—all in one connected place.</p>
            <div className="mt-6 flex flex-wrap gap-3"><Link href={`/customer/businesses/${business.slug}/products`} className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-black text-[#03162F] transition hover:-translate-y-0.5 hover:bg-[#e6c65f]">Browse technology <ArrowRight className="h-4 w-4" /></Link><Link href={`/customer/businesses/${business.slug}/services`} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"><Wrench className="h-4 w-4" />Book a service</Link></div>
          </div>

          <div className="relative min-h-[250px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-3 shadow-2xl backdrop-blur-sm sm:min-h-[300px]">
            {currentSlide ? <Link key={currentSlide.id} href={itemHref(currentSlide, business.slug)} className="group relative block h-full min-h-[224px] overflow-hidden rounded-2xl sm:min-h-[274px]">
              <img src={currentSlide.image_url!} alt={currentSlide.name} className="absolute inset-0 h-full w-full animate-[tech-slide_.45s_ease-out_both] object-cover transition duration-700 group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#03162F] via-[#03162F]/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6"><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#E8CA62]">{currentSlide.item_type?.toLowerCase().includes("service") ? "Featured service" : "In the technology shop"}</p><h2 className="mt-1 text-2xl font-black text-white">{currentSlide.name}</h2><p className="mt-1 text-sm font-semibold text-white/80">{price(currentSlide.base_price)}</p></div>
              <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black text-[#03162F]">Explore</span>
            </Link> : <div className="flex h-full min-h-[224px] flex-col justify-between rounded-2xl bg-gradient-to-br from-[#0c315c] to-[#07172e] p-6 sm:min-h-[274px]"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#03162F]"><Laptop className="h-7 w-7" /></div><div><p className="text-xs font-bold uppercase tracking-widest text-[#E8CA62]">Your technology hub</p><p className="mt-2 text-2xl font-black text-white">Find the right solution.</p><p className="mt-1 text-sm text-blue-100/70">Browse products and services managed by Tech Solutions.</p></div></div>}
            {slides.length > 1 && <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2"><button type="button" onClick={() => setSlide((slide - 1 + slides.length) % slides.length)} aria-label="Previous featured item" className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"><ChevronLeft className="h-5 w-5" /></button><div className="flex items-center gap-1.5">{slides.map((item, index) => <button key={item.id} aria-label={`Show ${item.name}`} onClick={() => setSlide(index)} className={`h-1.5 rounded-full transition-all ${index === slide ? "w-5 bg-[#D4AF37]" : "w-1.5 bg-white/60"}`} />)}</div><button type="button" onClick={() => setSlide((slide + 1) % slides.length)} aria-label="Next featured item" className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"><ChevronRight className="h-5 w-5" /></button></div>}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3"><Metric label="Products" value={products.length} loading={loading} icon={Package} color="blue" /><Metric label="Services" value={services.length} loading={loading} icon={Wrench} color="violet" /><Metric label="Categories" value={categories.length} loading={false} icon={Network} color="gold" /></section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#9A7910]">Find it faster</p><h2 className="mt-1 text-xl font-black">Search the Tech Solutions catalogue</h2></div><span className="text-xs text-slate-500">Products and services in one search</span></div>
        <label className="relative block"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try laptop repair, router, printer…" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-[#D4AF37]/10" /></label>
        {query && <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{matches.map((item) => <Link key={item.id} href={itemHref(item, business.slug)} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#D4AF37]/50 hover:bg-amber-50/40"><span className="min-w-0"><span className="block truncate text-sm font-bold">{item.name}</span><span className="block text-xs text-slate-500">{item.category || item.item_type}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-[#9A7910]" /></Link>)}{!loading && !matches.length && <p className="py-4 text-sm text-slate-500">No matches found. Try another search or browse a category below.</p>}</div>}
      </section>

      <section>
        <SectionHeading eyebrow="Browse by need" title="Explore categories" description="Each category only shows the items and actions that belong there." />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{categories.map((category, index) => {
          const Icon = category.icon;
          const capabilities = technologyCategoryCapabilities[category.id];
          const categoryItems = items.filter((item) => matchesTechnologyCategory(item, category.id));
          const count = categoryItems.filter((item) => capabilities.products && item.item_type?.toLowerCase().includes("product") || capabilities.services && item.item_type?.toLowerCase().includes("service")).length;
          return <Link key={category.id} href={`/customer/businesses/${business.slug}/technology/${category.id}`} style={{ animationDelay: `${Math.min(index * 35, 350)}ms` }} className="tech-card group relative min-h-[165px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-lg sm:p-5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${toneClasses[category.color]} transition duration-300 group-hover:scale-110`}><Icon className="h-5 w-5" /></div><ChevronRight className="absolute right-4 top-4 h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#9A7910]" />
            <h3 className="mt-4 text-sm font-black leading-5">{category.title}</h3><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{category.detail}</p><div className="mt-3 flex items-center justify-between"><span className="text-[10px] font-bold text-slate-400">{loading ? "Loading…" : `${count} ${count === 1 ? "item" : "items"}`}</span><span className="text-[10px] font-black text-[#9A7910]">Explore</span></div>
          </Link>;
        })}</div>
      </section>

      <CatalogSection title="Popular services" eyebrow="Book with our team" icon={Wrench} items={featuredServices} slug={business.slug} type="service" loading={loading} />
      <CatalogSection title="Technology shop" eyebrow="Products ready to explore" icon={Package} items={featuredProducts} slug={business.slug} type="product" loading={loading} />
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#03162F] via-[#0b2b50] to-[#123c64] p-6 text-white shadow-lg sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#E8CA62]">Need a recommendation?</p><h2 className="mt-2 text-2xl font-black">Tell us what you’re trying to solve.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/75">Our team can help you choose a product, plan a repair or find the right service.</p></div><Link href="/customer/technology-consultation" className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-black text-[#03162F] transition hover:-translate-y-0.5 sm:mt-0">Talk to a specialist <ArrowRight className="h-4 w-4" /></Link></section>
    </div>
    <style jsx global>{`@keyframes tech-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes tech-slide{from{opacity:.45;transform:scale(1.025)}to{opacity:1;transform:scale(1)}}.tech-card{animation:tech-rise .42s ease-out both}@media(prefers-reduced-motion:reduce){.tech-card{animation:none!important;transition:none!important}}`}</style>
  </main>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#9A7910]">{eyebrow}</p><h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>; }
function Metric({ label, value, loading, icon: Icon, color }: { label: string; value: number; loading: boolean; icon: typeof Package; color: string }) { const classes = color === "blue" ? "border-blue-100 bg-blue-50 text-blue-800" : color === "violet" ? "border-violet-100 bg-violet-50 text-violet-800" : "border-amber-100 bg-amber-50 text-amber-800"; return <div className={`rounded-2xl border p-3 shadow-sm sm:flex sm:items-center sm:gap-4 sm:p-4 ${classes}`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80"><Icon className="h-4 w-4" /></span><div className="mt-2 sm:mt-0"><p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p><p className="mt-0.5 text-xl font-black">{loading ? "…" : value}</p></div></div>; }
function CatalogSection({ title, eyebrow, icon: Icon, items, slug, type, loading }: { title: string; eyebrow: string; icon: typeof Package; items: CatalogItem[]; slug: string; type: "product" | "service"; loading: boolean }) { const href = `/customer/businesses/${slug}/${type === "product" ? "products" : "services"}`; return <section><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#9A7910]">{eyebrow}</p><h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{title}</h2></div><Link href={href} className="inline-flex items-center gap-1 text-xs font-black text-[#03162F]">View all <ArrowRight className="h-4 w-4" /></Link></div>{items.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map((item) => <Link key={item.id} href={itemHref(item, slug)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"><div className="relative aspect-[4/3] overflow-hidden bg-slate-100">{item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 text-[#9A7910]"><Icon className="h-10 w-10" /></div>}<span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase text-[#03162F] shadow-sm">{type}</span></div><div className="p-4"><h3 className="line-clamp-1 text-sm font-black">{item.name}</h3><p className="mt-1 line-clamp-2 min-h-9 text-xs leading-5 text-slate-500">{item.description || item.category || "Available from Tech Solutions"}</p><div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-sm font-black">{price(item.base_price)}</span>{type === "product" && item.quantity != null && <span className="text-[10px] text-slate-500">{item.quantity} in stock</span>}<ArrowRight className="h-4 w-4 text-[#9A7910] transition group-hover:translate-x-1" /></div></div></Link>)}</div> : <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><Icon className="h-8 w-8 text-slate-300" /><p className="mt-2 text-sm font-bold text-slate-600">{loading ? "Loading catalogue…" : `No ${type === "product" ? "products" : "services"} available yet`}</p><p className="mt-1 text-xs text-slate-500">{type === "product" ? "Browse categories to see what’s in stock." : "Choose a category to find the right service."}</p></div>}</section>; }
