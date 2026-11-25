"use client";

import Link from "next/link";
import ImagePreview from "@/components/ui/image-preview/ImagePreview";
import { useEffect, useMemo, useState, type FocusEvent } from "react";
import { ArrowLeft, ArrowRight, Search, Tag } from "lucide-react";
import type { PublicBusiness, PublicOffer } from "@/modules/website/services/public-website.service";

const OFFERS_PER_SLIDE = 3;

export default function OfferExplorer({ offers, businesses, featuredOnly = false }: { offers: PublicOffer[]; businesses: PublicBusiness[]; featuredOnly?: boolean }) {
  const [query, setQuery] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const businessById = useMemo(() => new Map(businesses.map((business) => [business.id, business])), [businesses]);
  const filtered = offers.filter((offer) => `${offer.title} ${offer.description ?? ""} ${businessById.get(offer.business_id)?.name ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const visible = featuredOnly ? filtered.slice(0, 9) : filtered;
  const slides = Array.from({ length: Math.ceil(visible.length / OFFERS_PER_SLIDE) }, (_, index) => visible.slice(index * OFFERS_PER_SLIDE, (index + 1) * OFFERS_PER_SLIDE));

  const slideCount = slides.length;
  const currentSlide = Math.min(activeSlide, Math.max(0, slideCount - 1));
  useEffect(() => {
    if (paused || slideCount < 2 || typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slideCount), 6000);
    return () => window.clearInterval(timer);
  }, [paused, slideCount]);

  const goTo = (index: number) => setActiveSlide((index + slideCount) % slideCount);
  const pauseIfFocused = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
  };

  return <section
    className="w-full border-y border-slate-200 bg-white px-5 py-14 text-[#0B132B] sm:px-8 lg:py-16"
    aria-label="Current promotions"
    onMouseEnter={() => setPaused(true)}
    onMouseLeave={() => setPaused(false)}
    onFocusCapture={() => setPaused(true)}
    onBlurCapture={pauseIfFocused}
  >
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9A7412]">Offers and announcements</p><h2 className="mt-2 text-3xl font-black tracking-tight text-[#0B132B] sm:text-4xl">Current offers</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Promotions and featured services published by businesses through AEOS.</p></div>
      {!featuredOnly && <label className="relative block w-full sm:max-w-sm"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search offers" className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-[#0B132B] placeholder:text-slate-500 outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10" /></label>}
    </div>

    {slides.length > 0 && <div className="mt-7" aria-roledescription="carousel" aria-label="Promotional offers">
      <div key={activeSlide} className="offer-slide-group grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-live="polite">
        {slides[currentSlide]?.map((offer) => {
          const business = businessById.get(offer.business_id);
          return <article key={offer.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {offer.image_url ? <div className="relative aspect-[16/9] bg-slate-100"><ImagePreview src={offer.image_url} alt={offer.title} fill imageClassName="object-cover" /></div> : <div className="relative flex aspect-[16/9] items-center justify-center bg-slate-100"><span aria-hidden="true" className="absolute -right-4 -top-10 font-serif text-[12rem] font-black leading-none text-slate-200">%</span><span className="relative grid size-14 place-items-center rounded-2xl border border-slate-200 bg-white text-[#9A7412]"><Tag className="size-6" /></span></div>}
            <div className="p-5"><div className="flex flex-wrap gap-1.5"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-[#80600B]">{offer.discount_text || "Featured"}</span>{offer.is_demo && <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[9px] font-bold uppercase text-amber-900">Sample offer</span>}</div><h3 className="mt-3 text-lg font-black text-[#0B132B]">{offer.title}</h3><p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-600">{offer.description}</p><div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-600">{business?.name || "Alessandro Enterprises"}</span><Link href="/customer/businesses" className="offer-card-action text-xs font-bold text-[#80600B] hover:text-[#0B132B]">View in portal</Link></div></div>
          </article>;
        })}
      </div>
      {slides.length > 1 && <div className="mt-5 flex flex-wrap items-center justify-between gap-3" aria-label="Offer slide controls">
        <div className="flex items-center gap-2"><button type="button" onClick={() => goTo(currentSlide - 1)} className="grid size-10 place-items-center rounded-full border border-slate-300 text-[#0B132B] transition hover:border-[#D4AF37] hover:bg-amber-50" aria-label="Previous offers"><ArrowLeft className="size-4" /></button><button type="button" onClick={() => goTo(currentSlide + 1)} className="grid size-10 place-items-center rounded-full border border-slate-300 text-[#0B132B] transition hover:border-[#D4AF37] hover:bg-amber-50" aria-label="Next offers"><ArrowRight className="size-4" /></button><span className="ml-2 text-xs font-semibold text-slate-600">{currentSlide + 1} / {slideCount}</span></div>
        <div className="flex items-center gap-2" role="tablist" aria-label="Choose offer slide">{slides.map((_, index) => <button key={index} type="button" role="tab" aria-selected={index === currentSlide} aria-label={`Show offer slide ${index + 1}`} onClick={() => goTo(index)} className={`h-2.5 rounded-full transition-all ${index === currentSlide ? "w-8 bg-[#9A7412]" : "w-2.5 bg-slate-300 hover:bg-slate-400"}`} />)}</div>
      </div>}
    </div>}
    {visible.length === 0 && <p className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-600">No offers match that search.</p>}
    {featuredOnly && filtered.length > visible.length && <div className="mt-7 text-center"><Link href="/offers" className="offer-browse-action inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-[#0B132B] transition hover:border-[#D4AF37]">View all offers<ArrowRight className="size-4 text-[#80600B]" /></Link></div>}
    <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-[#0B132B]">Want to claim an offer?</p><p className="mt-1 text-sm text-slate-600">Offers and requests are completed through the AEOS customer portal.</p></div><Link href="/customer/businesses" className="offer-request-action inline-flex w-fit items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-[#03162F]">Explore in customer portal<ArrowRight className="size-4" /></Link></div>
  </section>;
}
