"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Image as ImageIcon, Megaphone, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export interface ContentBusiness { id: string; name: string; slug: string; }
type ContentRow = { id: string; business_id: string; title?: string | null; description?: string | null; content?: string | null; caption?: string | null; image_url?: string | null; discount_text?: string | null; price?: number | null; start_date?: string | null; end_date?: string | null; published_at?: string | null; created_at?: string | null; };
type Kind = "promotions" | "gallery" | "posts";
const tableFor: Record<Kind, string> = { promotions: "business_promotions", gallery: "business_gallery", posts: "business_posts" };

export default function BusinessContentFeed({ businesses, kind, businessId, compact = false }: { businesses: ContentBusiness[]; kind: Kind; businessId?: string; compact?: boolean }) {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
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

  const businessById = useMemo(() => new Map(businesses.map((business) => [business.id, business])), [businesses]);
  const Icon = kind === "promotions" ? Megaphone : kind === "gallery" ? ImageIcon : Sparkles;
  if (loading) return <div className={compact ? "grid grid-cols-2 gap-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>{[1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-slate-100" />)}</div>;
  if (!rows.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">No {kind === "posts" ? "updates" : kind} available right now.</div>;
  return <div className={compact ? "grid grid-cols-2 gap-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>{rows.slice(0, compact ? 6 : 24).map((row) => {
    const business = businessById.get(row.business_id);
    const title = row.title || (kind === "gallery" ? "Business gallery" : kind === "posts" ? "Business update" : "Special offer");
    const body = row.description || row.content || row.caption || "";
    return <article key={row.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {row.image_url ? <div className="relative aspect-[4/3] bg-slate-100"><Image src={row.image_url} alt={title} fill unoptimized className="object-cover" /></div> : <div className="flex h-24 items-center justify-center bg-gradient-to-br from-[#03162F] to-[#174D8C] text-[#D4AF37]"><Icon className="h-8 w-8" /></div>}
      <div className="p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#9A7910]">{business?.name ?? "Alessandro Enterprises"}{row.discount_text ? ` · ${row.discount_text}` : ""}</p><h3 className="mt-1 font-black text-[#03162F]">{title}</h3>{body && <p className="mt-1 line-clamp-3 text-sm leading-5 text-slate-600">{body}</p>}{row.price != null && <p className="mt-2 text-sm font-bold text-[#03162F]">ZMW {Number(row.price).toLocaleString("en-ZM", { minimumFractionDigits: 2 })}</p>}{row.start_date && <p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />From {new Date(row.start_date).toLocaleDateString()}</p>}{business && !businessId && <Link className="mt-3 inline-block text-xs font-bold text-[#8A6D13]" href={`/customer/businesses/${business.slug}/${kind === "promotions" ? "promotions" : "updates"}`}>View {business.name}</Link>}</div>
    </article>;
  })}</div>;
}
