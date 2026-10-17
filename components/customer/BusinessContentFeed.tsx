"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Image as ImageIcon, Megaphone, Sparkles, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export interface ContentBusiness { id: string; name: string; slug: string; }
type ContentRow = { id: string; business_id: string; title?: string | null; description?: string | null; content?: string | null; caption?: string | null; image_url?: string | null; discount_text?: string | null; price?: number | null; start_date?: string | null; end_date?: string | null; published_at?: string | null; created_at?: string | null; asset_type?: string | null; catalog_item_id?: string | null; };
type Kind = "promotions" | "gallery" | "posts";
const tableFor: Record<Kind, string> = { promotions: "business_promotions", gallery: "business_gallery", posts: "business_posts" };
type GalleryPreview = { url: string; title: string; caption: string; businessName: string; businessSlug: string; category: string; actionLabel: string; actionHref: string };

export default function BusinessContentFeed({ businesses, kind, businessId, compact = false }: { businesses: ContentBusiness[]; kind: Kind; businessId?: string; compact?: boolean }) {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [promotionTargets, setPromotionTargets] = useState<Record<string, { href: string; label: string }>>({});
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<GalleryPreview | null>(null);
  const [galleryLimit, setGalleryLimit] = useState(18);
  const businessIds = useMemo(() => businesses.map((business) => business.id), [businesses]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!businessIds.length) { setRows([]); setLoading(false); return; }
      const scopedBusinessIds = businessId ? [businessId] : businessIds;
      if (kind === "gallery" && !businessId) {
        const nowIso = new Date().toISOString();
        const [galleryResult, promotionResult, postResult, catalogResult] = await Promise.all([
          supabase.from("business_gallery").select("id,business_id,title,caption,image_url,created_at,display_order").in("business_id", scopedBusinessIds).eq("active", true).order("display_order", { ascending: true }),
          supabase.from("business_promotions").select("id,business_id,title,description,image_url,discount_text,price,start_date,end_date,created_at").in("business_id", scopedBusinessIds).eq("active", true).eq("published", true).or(`start_date.is.null,start_date.lte.${nowIso}`).or(`end_date.is.null,end_date.gte.${nowIso}`).order("created_at", { ascending: false }),
          supabase.from("business_posts").select("id,business_id,title,content,image_url,published_at,created_at").in("business_id", scopedBusinessIds).eq("published", true).or(`published_at.is.null,published_at.lte.${nowIso}`).order("published_at", { ascending: false }),
          supabase.from("enterprise_catalog").select("id,business_id,name,description,image_url,item_type,category,base_price,created_at").in("business_id", scopedBusinessIds).ilike("status", "active").not("image_url", "is", null).order("created_at", { ascending: false }),
        ]);
        if (!alive) return;
        const catalogItems = catalogResult.data ?? [];
        const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        const rows: ContentRow[] = [
          ...((galleryResult.data ?? []) as ContentRow[]).filter((row) => row.image_url),
          ...((promotionResult.data ?? []) as ContentRow[]).filter((row) => row.image_url).map((row) => {
            const offerName = normalize(row.title ?? "");
            const matchedItem = catalogItems.find((item) => {
              const itemName = normalize(item.name);
              return item.business_id === row.business_id && itemName.length > 0 && offerName.length > 0 && (itemName === offerName || itemName.includes(offerName) || offerName.includes(itemName));
            });
            return { ...row, id: `promotion:${row.id}`, asset_type: matchedItem?.item_type ?? "promotion", catalog_item_id: matchedItem?.id, caption: matchedItem?.category ?? row.discount_text };
          }),
          ...((postResult.data ?? []) as ContentRow[]).filter((row) => row.image_url).map((row) => ({ ...row, id: `post:${row.id}`, asset_type: "update" })),
          ...((catalogResult.data ?? []).filter((row) => row.image_url).map((row) => ({
            id: `catalog:${row.id}`,
            business_id: row.business_id,
            title: row.name,
            description: row.description,
            image_url: row.image_url,
            price: row.base_price,
            created_at: row.created_at,
            asset_type: row.item_type,
            catalog_item_id: row.id,
            caption: row.category,
          })) as ContentRow[]),
        ].sort((a, b) => new Date(b.created_at ?? b.published_at ?? 0).getTime() - new Date(a.created_at ?? a.published_at ?? 0).getTime());
        setRows(rows);
        setLoading(false);
        return;
      }
      let query = supabase.from(tableFor[kind]).select("*").in("business_id", scopedBusinessIds);
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
            .select("id, business_id, name, item_type, category")
            .in("business_id", businessId ? [businessId] : businessIds);
          if (!alive) return;
          const targets: Record<string, { href: string; label: string }> = {};
          for (const offer of visible) {
            const title = (offer.title ?? "Special offer").trim();
            const tag = offer.discount_text || "Special offer";
            const queryString = `promotion=${encodeURIComponent(title)}&tag=${encodeURIComponent(tag)}`;
            const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
            const offerName = normalize(title);
            const matchedItem = (catalog ?? []).find((item) => {
              if (item.business_id !== offer.business_id) return false;
              const itemName = normalize(item.name);
              return itemName.length > 0 && (itemName === offerName || itemName.includes(offerName) || offerName.includes(itemName));
            });
            const business = businesses.find((entry) => entry.id === offer.business_id);
            const itemType = (matchedItem?.item_type ?? "").trim().toLowerCase();
            const isLoan = itemType.includes("loan") || business?.slug.toLowerCase().includes("loan") === true || business?.name.toLowerCase().includes("loan") === true;
            const businessTypes = (catalog ?? [])
              .filter((item) => item.business_id === offer.business_id)
              .map((item) => (item.item_type ?? "").trim().toLowerCase())
              .filter(Boolean);
            const serviceOnlyBusiness = businessTypes.length > 0 && businessTypes.every((type) => type === "service");
            const isService = itemType === "service" || business?.slug.toLowerCase().includes("barber") === true || (!matchedItem && serviceOnlyBusiness);
            const itemQuery = matchedItem ? `itemId=${encodeURIComponent(matchedItem.id)}&` : `search=${encodeURIComponent(title)}&`;
            if (isLoan) {
              targets[offer.id] = { href: `/customer/businesses/${business?.slug ?? "soft-loans"}/apply?${queryString}`, label: "Apply" };
            } else if (isService) {
              const bookingPath = matchedItem ? `/customer/bookings/new/${encodeURIComponent(matchedItem.id)}` : "/customer/bookings/new";
              targets[offer.id] = { href: `${bookingPath}?${queryString}`, label: "Book" };
            } else {
              targets[offer.id] = { href: `/customer/orders/new?${itemQuery}${queryString}`, label: "Order" };
            }
          }
          setPromotionTargets(targets);
        }
      }
      setLoading(false);
    };
    void load();
    const subscribedTables = kind === "gallery" && !businessId
      ? ["business_gallery", "business_promotions", "business_posts", "enterprise_catalog"]
      : [tableFor[kind]];
    const channels = subscribedTables.map((table) => supabase.channel(`customer-${kind}-${businessId ?? "all"}-${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, (event) => {
        const changed = (event.new ?? event.old) as { business_id?: string } | undefined;
        if (!changed?.business_id || !businessId || changed.business_id === businessId) void load();
        else if (businessIds.includes(changed.business_id)) void load();
      }).subscribe());
    return () => { alive = false; for (const channel of channels) void supabase.removeChannel(channel); };
  }, [kind, businessId, businessIds, businesses]);

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
    const assetType = (row.asset_type ?? "").toLowerCase();
    const isLoan = assetType.includes("loan") || businessSlug.includes("loan");
    const isService = assetType === "service" || businessSlug.includes("barber") || businessSlug.includes("mobile");
    const isOrderable = assetType === "product" || assetType === "item" || assetType === "stock" || (assetType === "promotion" && (businessSlug.includes("fashion") || businessSlug.includes("tech")));
    const category = row.caption || (isLoan ? "Loans" : isService ? "Services" : businessSlug.includes("fashion") ? "Fashion" : businessSlug.includes("tech") ? "Technology" : businessSlug.includes("delivery") ? "Delivery" : "Business");
    const actionLabel = isLoan ? "Apply" : isService ? "Book a service" : isOrderable ? "Order" : "Explore business";
    const actionHref = isLoan ? `/customer/businesses/${businessSlug}/apply` : isService ? row.catalog_item_id ? `/customer/bookings/new/${encodeURIComponent(row.catalog_item_id)}` : `/customer/businesses/${businessSlug}/services` : isOrderable ? row.catalog_item_id ? `/customer/orders/new?itemId=${encodeURIComponent(row.catalog_item_id)}` : "/customer/orders/new" : `/customer/businesses/${businessSlug}`;
    const imageTitle = row.asset_type === "promotion" ? `${title} · Promotion` : row.asset_type === "update" ? `${title} · Update` : title;
    const offerTarget = kind === "promotions" ? promotionTargets[row.id] : null;
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
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-7 text-[10px] font-bold text-white">{imageTitle} · Preview</span>
          </button>
        ) : row.image_url ? (
          <div className={`relative bg-slate-100 ${compact ? "aspect-[3/2] sm:aspect-[4/3]" : "aspect-[4/3]"}`}>
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
        ) : <div className={compact ? "p-2.5 sm:p-4" : "p-4"}>
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#9A7910] sm:text-[10px]">
            {business?.name ?? "Alessandro Enterprises"}{row.discount_text ? ` · ${row.discount_text}` : ""}
          </p>
          <h3 className="mt-0.5 text-xs font-black text-[#03162F] sm:mt-1 sm:text-base">{title}</h3>
          {body && <p className="mt-0.5 line-clamp-2 text-[10px] leading-3.5 text-slate-600 sm:mt-1 sm:line-clamp-3 sm:text-sm sm:leading-5">{body}</p>}
          {row.price != null && <p className="mt-1 text-xs font-bold text-[#03162F] sm:mt-2 sm:text-sm">ZMW {Number(row.price).toLocaleString("en-ZM", { minimumFractionDigits: 2 })}</p>}
          {row.start_date && <p className="mt-1 flex items-center gap-1 text-[9px] text-slate-500 sm:mt-2 sm:text-xs"><CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5" />From {new Date(row.start_date).toLocaleDateString()}</p>}
          {offerTarget ? (
            <p className="mt-2 inline-flex min-h-8 w-full items-center justify-center rounded-lg bg-[#03162F] px-2.5 py-1.5 text-[10px] font-bold text-white transition group-hover:bg-[#0A2852] sm:mt-4 sm:min-h-10 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm">
              {offerTarget.label} with this offer <span aria-hidden="true" className="ml-2">→</span>
            </p>
          ) : business && !businessId ? (
            <Link className="mt-3 inline-block text-xs font-bold text-[#8A6D13]" href={`/customer/businesses/${business.slug}/${kind === "promotions" ? "promotions" : "updates"}`}>View {business.name}</Link>
          ) : null}
        </div>}
      </>
    );
    if (kind === "gallery") return <article key={row.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{card}</article>;
    return offerTarget ? (
      <Link key={row.id} href={offerTarget.href} className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">{card}</Link>
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
          <div key={index} className="w-[64%] max-w-[240px] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] sm:max-w-none">
            {card}
          </div>
        ))}
      </div>
      <button type="button" onClick={() => move(-1)} aria-label="Previous promotion" className="absolute left-1 top-[38%] flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-[#03162F] shadow-sm transition hover:bg-white sm:left-2 sm:top-[42%] sm:h-9 sm:w-9 sm:shadow-md"><ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" /></button>
      <button type="button" onClick={() => move(1)} aria-label="Next promotion" className="absolute right-1 top-[38%] flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-[#03162F] shadow-sm transition hover:bg-white sm:right-2 sm:top-[42%] sm:h-9 sm:w-9 sm:shadow-md"><ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" /></button>
      <p className="mt-1.5 text-center text-[10px] font-semibold text-slate-500 sm:mt-2 sm:text-[11px]">Promotion {Math.min(activeIndex + 1, cards.length)} of {cards.length}</p>
    </div>
  );
}
