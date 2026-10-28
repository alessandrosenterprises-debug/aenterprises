"use client";

import { useEffect, useState, useSyncExternalStore, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Expand, X } from "lucide-react";

type ImagePreviewProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
};

/** An accessible, full-size image preview that works with external AEOS image URLs. */
export default function ImagePreview({ src, alt, className = "", imageClassName = "", fill = false, width, height, sizes, priority }: ImagePreviewProps) {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  function preview(event: MouseEvent | KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  }

  const triggerClass = `group/image-preview ${fill ? "absolute inset-0" : "relative inline-flex"} cursor-zoom-in overflow-hidden ${className}`;

  return <>
    <span data-image-preview-trigger role="button" tabIndex={0} aria-label={`Preview image: ${alt || "image"}`} onClick={preview} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") preview(event); }} className={triggerClass}>
      <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" width={fill ? undefined : width} height={fill ? undefined : height} sizes={sizes} className={`${fill ? "absolute inset-0 h-full w-full" : "h-full w-full"} ${imageClassName}`} />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-2 right-2 grid size-8 translate-y-1 place-items-center rounded-full bg-[#03162F]/85 text-white opacity-0 shadow transition group-hover/image-preview:translate-y-0 group-hover/image-preview:opacity-100 group-focus-visible/image-preview:translate-y-0 group-focus-visible/image-preview:opacity-100"><Expand className="size-4" /></span>
    </span>
    {mounted && open && createPortal(
      <div data-global-image-preview-modal role="presentation" className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm sm:p-8" onClick={() => setOpen(false)}>
        <button type="button" aria-label="Close image preview" autoFocus onClick={() => setOpen(false)} className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full border border-white/20 bg-[#03162F] text-white shadow-lg transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"><X className="size-5" /></button>
        <figure className="flex max-h-full max-w-full flex-col items-center gap-3" onClick={(event) => event.stopPropagation()}>
          <img src={src} alt={alt} className="max-h-[calc(100dvh-7rem)] max-w-full rounded-xl object-contain shadow-2xl" />
          {alt && <figcaption className="max-w-[90vw] text-center text-sm font-medium text-white">{alt}</figcaption>}
        </figure>
      </div>,
      document.body,
    )}
  </>;
}
