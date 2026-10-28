"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

export default function DashboardScrollReset() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const pageScroller = document.querySelector<HTMLElement>("[data-dashboard-scroll-container]");
    if (!pageScroller) return;
    pageScroller.scrollTop = 0;
    pageScroller.scrollLeft = 0;
  }, [pathname]);

  return null;
}
