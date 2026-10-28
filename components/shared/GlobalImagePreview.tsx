"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Expand, X } from "lucide-react";

/** Delegated image preview for content images throughout the public site, customer portal and AEOS. */
export default function GlobalImagePreview() {
  const [active, setActive] = useState<{ src: string; alt: string } | null>(null);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  useEffect(() => {
    const onImageClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement) || target.closest("[data-image-preview-trigger], [data-global-image-preview-modal]")) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setActive({ src: target.currentSrc || target.src, alt: target.alt || "Image preview" });
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setActive(null); };
    document.addEventListener("click", onImageClick, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onImageClick, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);
  useEffect(() => {
    if (!active) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = originalOverflow; };
  }, [active]);

  if (!mounted || !active) return null;
  return createPortal(
    <div data-global-image-preview-modal role="presentation" className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm sm:p-8" onClick={() => setActive(null)}>
      <button type="button" autoFocus aria-label="Close image preview" onClick={() => setActive(null)} className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-white/20 bg-[#03162F] text-white shadow-lg hover:bg-slate-800"><X className="size-5" /></button>
      <figure className="flex max-h-full max-w-full flex-col items-center gap-3" onClick={(event) => event.stopPropagation()}>
        <img src={active.src} alt={active.alt} className="max-h-[calc(100dvh-7rem)] max-w-full rounded-xl object-contain shadow-2xl" />
        {active.alt && active.alt !== "Image preview" && <figcaption className="max-w-[90vw] text-center text-sm font-medium text-white">{active.alt}</figcaption>}
      </figure>
      <span className="sr-only"><Expand /></span>
    </div>,
    document.body,
  );
}
