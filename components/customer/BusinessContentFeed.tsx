"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Image as ImageIcon, Megaphone, Sparkles, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export interface ContentBusiness { id: string; name: string; slug: string; }
type ContentRow = { id: string; business_id: string; title?: string | null; description?: string | null; content?: string | null; caption?: string | null; image_url?: string | null; discount_text?: string | null; price?: number | null; start_date?: string | null; end_date?: string | null; published_at?: string | null; created_at?: string | null; };
type Kind = "promotions" | "gallery" | "posts";
const tableFor: Record<Kind, string> = { promotions: "business_promotions", gallery: "business_gallery", posts: "business_posts" };
type GalleryPreview = { url: string; title: string; caption: string; businessName: string; businessSlug: string; category: string; actionLabel: string; actionHref: string };

export default function BusinessContentFeed({ businesses, kind, businessId, compact = false }: { businesses: ContentBusiness[]; kind: Kind; businessId?: string; compact?: boolean }) {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [promotionTargets, setPromotionTargets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<GalleryPreview | null>(null);
  const [galleryLimit, setGalleryLimit] = useState(18);
  const businessIds = useMemo(() => businesses.map((business) => business.id), [businesses]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!businessIds.length) { setRows([]); setLoading(false); return; }
      let query = supabase.from(tableFor[kind]).select("*").in("business_id", businessId ? [businessId] : businessIds);
      if (kind === "promotions") query = query.eq("active", true).eq("published", true);
      if (kind === "gallery") query = query.eq("active", true);
      if (kind === "posts") query = query.eq("published", true);
      const { data, error } = await query.order(kind === "gallery" ? "display_order" : kind === "posts" ? "published_at" : "created_at", { ascending: kind === "gallery" });
      if (!alive) return;
      if (error) { console.error(`Unable to load customer ${kind}:`, error); setRows([]); }
      else {
        const now = Date.now();
        const visible = ((data ?? []) as ContentRow[]).filter((row) => {
          if (kind === "promotions") return (!row.start_date || new Date(row.start_date).getTime() <= now) && (!row.end_date || new Date(row.end_date).getTime() >= now);
          if (kind === "posts" && row.published_at) return new Date(row.published_at).getTime() <= now;
          return true;
        });
        setRows(visible);
        if (kind === "promotions") {
          const { data: catalog } = await supabase
            .from("enterprise_catalog")
            .select("id, business_id, name, item_type")
            .in("business_id", businessId ? [businessId] : businessIds);
          if (!alive) return;
          const targets: Record<string, string> = {};
          for (const offer of visible) {
            const title = (offer.title ?? "Special offer").trim();
            const tag = offer.discount_text || "Special offer";
            const queryString = `promotion=${encodeURIComponent(title)}&tag=${encodeURIComponent(tag)}`;
            const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
            const offerName = normalize(title);
            const matchedItem = (catalog ?? []).find((item) => {
              if (item.business_id !== offer.business_id) return false;
              const itemName = normalize(item.name);
              return itemName === offerName || itemName.includes(offerName) || offerName.includes(itemName);
            });
            const itemQuery = matchedItem ? `itemId=${encodeURIComponent(matchedItem.id)}&` : `search=${encodeURIComponent(title)}&`;
            targets[offer.id] = `/customer/orders/new?${itemQuery}${queryString}`;
          }
          setPromotionTargets(targets);
        }
      }
      setLoading(false);
    };
    setLoading(true);
    void load();
    const channel = supabase.channel(`customer-${kind}-${businessId ?? "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: tableFor[kind] }, (event) => {
        const changed = (event.new ?? event.old) as { business_id?: string } | undefined;
        if (!changed?.business_id || !businessId || changed.business_id === businessId) void load();
        else if (businessIds.includes(changed.business_id)) void load();
      }).subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [kind, businessId, businessIds]);

  useEffect(() => {
    if (!preview) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [preview]);

  const businessById = useMemo(() => new Map(businesses.map((business) => [business.id, business])), [businesses]);
  const Icon = kind === "promotions" ? Megaphone : kind === "gallery" ? ImageIcon : Sparkles;
  if (loading) return <div className={kind === "gallery" ? `grid ${compact ? "grid-cols-4 gap-1.5" : "grid-cols-3 gap-2"} sm:grid-cols-4 sm:gap-3 lg:grid-cols-6` : compact ? "grid grid-cols-2 gap-2.5 sm:gap-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>{Array.from({ length: kind === "gallery" ? 18 : 3 }, (_, index) => <div key={index} className="aspect-square animate-pulse rounded-xl bg-slate-100" />)}</div>;
  if (!rows.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">No {kind === "posts" ? "updates" : kind} available right now.</div>;
  const galleryRows = kind === "gallery" ? rows.slice(0, compact ? 6 : galleryLimit) : rows;
  const cards = galleryRows.map((row) => {
    const business = businessById.get(row.business_id);
    const title = row.title || (kind === "gallery" ? "Business gallery" : kind === "posts" ? "Business update" : "Special offer");
    const body = row.description || row.content || row.caption || "";
    const businessSlug = business?.slug ?? "";
    const businessName = business?.name ?? "Alessandro Enterprises";
    const category = businessSlug.includes("loan") ? "Loans" : businessSlug.includes("barber") ? "Barbering" : businessSlug.includes("fashion") ? "Fashion" : businessSlug.includes("mobile") ? "Mobile Money" : businessSlug.includes("tech") ? "Technology" : "Business";
    const actionLabel = businessSlug.includes("loan") ? "Apply" : businessSlug.includes("barber") ? "Book a service" : businessSlug.includes("mobile") ? "Explore services" : businessSlug.includes("fashion") || businessSlug.includes("tech") ? "Order" : "View business";
    const actionHref = businessSlug.includes("loan") ? `/customer/businesses/${businessSlug}/apply` : businessSlug.includes("barber") || businessSlug.includes("mobile") ? `/customer/businesses/${businessSlug}/services` : businessSlug.includes("fashion") ? `/customer/businesses/${businessSlug}/products` : businessSlug.includes("tech") ? "/customer/orders/new" : `/customer/businesses/${businessSlug}`;
    const offerHref = kind === "promotions" ? promotionTargets[row.id] : null;
    const card = (
      <>
        {row.image_url && kind === "gallery" ? (
          <button
            type="button"
            onClick={() => setPreview({ url: row.image_url!, title, caption: body, businessName, businessSlug, category, actionLabel, actionHref })}
            aria-label={`Preview ${title}`}
            className="group relative block aspect-square w-full overflow-hidden bg-slate-100 text-left"
          >
            <Image src={row.image_url} alt={title} fill unoptimized className="object-cover transition duration-300 group-hover:scale-[1.03]" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-7 text-[10px] font-bold text-white">{row.title || category} · Preview</span>
          </button>
        ) : row.image_url ? (
          <div className={`relative bg-slate-100 ${compact ? "aspect-[5/4]" : "aspect-[4/3]"}`}>
            <Image src={row.image_url} alt={title} fill unoptimized className="object-cover" />
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center bg-gradient-to-br from-[#03162F] to-[#174D8C] text-[#D4AF37]">
            <Icon className="h-8 w-8" />
          </div>
        )}
        {kind === "gallery" ? (
        <div className="p-2">
          <span className="inline-flex max-w-full truncate rounded-full bg-[#03162F]/5 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[#8A6D13]">{category}</span>
          <p className="mt-1 line-clamp-1 text-[11px] font-bold text-[#03162F]">{title}</p>
          <p className="mt-0.5 line-clamp-1 text-[9px] text-slate-500">{businessName}</p>
        </div>
        ) : <div className={compact ? "p-3 sm:p-4" : "p-4"}>
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#9A7910] sm:text-[10px]">
            {business?.name ?? "Alessandro Enterprises"}{row.discount_text ? ` · ${row.discount_text}` : ""}
          </p>
          <h3 className="mt-1 text-sm font-black text-[#03162F] sm:text-base">{title}</h3>
          {body && <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-600 sm:line-clamp-3 sm:text-sm sm:leading-5">{body}</p>}
          {row.price != null && <p className="mt-1.5 text-xs font-bold text-[#03162F] sm:mt-2 sm:text-sm">ZMW {Number(row.price).toLocaleString("en-ZM", { minimumFractionDigits: 2 })}</p>}
          {row.start_date && <p className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500 sm:mt-2 sm:text-xs"><CalendarDays className="h-3.5 w-3.5" />From {new Date(row.start_date).toLocaleDateString()}</p>}
          {offerHref ? (
            <p className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-xl bg-[#03162F] px-3 py-2 text-xs font-bold text-white transition group-hover:bg-[#0A2852] sm:mt-4 sm:min-h-10 sm:px-4 sm:py-2.5 sm:text-sm">
              Order with this offer <span aria-hidden="true" className="ml-2">→</span>
            </p>
          ) : business && !businessId ? (
            <Link className="mt-3 inline-block text-xs font-bold text-[#8A6D13]" href={`/customer/businesses/${business.slug}/${kind === "promotions" ? "promotions" : "updates"}`}>View {business.name}</Link>
          ) : null}
        </div>}
      </>
    );
    if (kind === "gallery") return <article key={row.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{card}</article>;
    return offerHref ? (
      <Link key={row.id} href={offerHref} className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">{card}</Link>
    ) : (
      <article key={row.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {card}
      </article>
    );
  });
  // The home page uses compact cards too; keep every promotions list in the
  // same horizontal carousel once there are enough offers to scroll.
  const promotionCarousel = kind === "promotions" && cards.length > 2;
  return <>
    {promotionCarousel ? (
      <PromotionsCarousel cards={cards} />
    ) : (
      <div className={kind === "gallery" ? `grid ${compact ? "grid-cols-4 gap-1.5" : "grid-cols-3 gap-2"} sm:grid-cols-4 sm:gap-3 lg:grid-cols-6` : compact ? "grid grid-cols-2 gap-2.5 sm:gap-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>{cards}</div>
    )}
    {preview && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Image preview: ${preview.title}`}
        onClick={() => setPreview(null)}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      >
        <button type="button" onClick={() => setPreview(null)} aria-label="Close image preview" className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25">
          <X className="h-5 w-5" />
        </button>
        <div className="flex max-h-full w-full max-w-5xl flex-col items-center" onClick={(event) => event.stopPropagation()}>
          <div className="relative h-[min(72vh,760px)] w-full">
            <Image src={preview.url} alt={preview.title} fill unoptimized sizes="100vw" className="object-contain" />
          </div>
          <div className="mt-3 max-w-3xl text-center text-white">
            <h2 className="text-base font-bold">{preview.title}</h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">{preview.category} · {preview.businessName}</p>
            {preview.caption && <p className="mt-1 text-sm text-white/75">{preview.caption}</p>}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href={`/customer/businesses/${preview.businessSlug}`} onClick={() => setPreview(null)} className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white">Business home</Link>
              <Link href={preview.actionHref} onClick={() => setPreview(null)} className="rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-black text-[#03162F]">{preview.actionLabel}</Link>
            </div>
          </div>
        </div>
      </div>
    )}
    {kind === "gallery" && !compact && rows.length > galleryLimit && <div className="mt-5 text-center"><button type="button" onClick={() => setGalleryLimit((count) => count + 18)} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-[#03162F] shadow-sm transition hover:border-[#D4AF37]">Load more photos</button></div>}
  </>;
}

function PromotionsCarousel({ cards }: { cards: ReactNode[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const getStep = () => {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstCard) return 0;
    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
    return firstCard.offsetWidth + gap;
  };

  const move = (direction: number) => {
    const track = trackRef.current;
    const step = getStep();
    if (!track || !step) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    const atEnd = track.scrollLeft >= maxScroll - 2;
    const atStart = track.scrollLeft <= 2;
    const target = direction > 0
      ? atEnd ? 0 : Math.min(track.scrollLeft + step, maxScroll)
      : atStart ? maxScroll : Math.max(track.scrollLeft - step, 0);
    track.scrollTo({ left: target, behavior: "smooth" });
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      const track = trackRef.current;
      const firstCard = track?.firstElementChild as HTMLElement | null;
      if (!track || !firstCard) return;
      const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
      const step = firstCard.offsetWidth + gap;
      const maxScroll = track.scrollWidth - track.clientWidth;
      const target = track.scrollLeft >= maxScroll - 2
        ? 0
        : Math.min(track.scrollLeft + step, maxScroll);
      track.scrollTo({ left: target, behavior: "smooth" });
    }, 10_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={() => {
          const step = getStep();
          if (step) setActiveIndex(Math.round((trackRef.current?.scrollLeft ?? 0) / step));
        }}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 sm:pb-2"
        aria-label="Promotions carousel"
      >
        {cards.map((card, index) => (
          <div key={index} className="w-[72%] max-w-[280px] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] sm:max-w-none">
            {card}
          </div>
        ))}
      </div>
      <button type="button" onClick={() => move(-1)} aria-label="Previous promotion" className="absolute left-2 top-[42%] flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-[#03162F] shadow-md transition hover:bg-white"><ChevronLeft className="h-5 w-5" /></button>
      <button type="button" onClick={() => move(1)} aria-label="Next promotion" className="absolute right-2 top-[42%] flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-[#03162F] shadow-md transition hover:bg-white"><ChevronRight className="h-5 w-5" /></button>
      <p className="mt-1.5 text-center text-[10px] font-semibold text-slate-500 sm:mt-2 sm:text-[11px]">Promotion {Math.min(activeIndex + 1, cards.length)} of {cards.length}</p>
    </div>
  );
}
