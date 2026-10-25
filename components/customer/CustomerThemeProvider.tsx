"use client";

import { useEffect, useState } from "react";

type Appearance = "system" | "light" | "dark";

type CustomerThemeProviderProps = {
  appearance: Appearance;
  children: React.ReactNode;
};

export default function CustomerThemeProvider({
  appearance: initialAppearance,
  children,
}: CustomerThemeProviderProps) {
  const [appearance, setAppearance] =
    useState<Appearance>(initialAppearance);

  useEffect(() => {
    const root = document.documentElement;

    const getSystemAppearance = (): "light" | "dark" => {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    };

    const applyTheme = (value: Appearance) => {
      const resolvedAppearance =
        value === "system"
          ? getSystemAppearance()
          : value;

      root.classList.remove("dark", "light");

      root.classList.add(resolvedAppearance);

      root.dataset.theme = resolvedAppearance;

      root.style.colorScheme = resolvedAppearance;
    };

    let preferredAppearance = appearance;
    try {
      const storedAppearance = window.localStorage.getItem("customer-appearance");
      if (
        storedAppearance === "system" ||
        storedAppearance === "light" ||
        storedAppearance === "dark"
      ) {
        preferredAppearance = storedAppearance;
      }
    } catch {
      // Keep the system appearance when browser storage is unavailable.
    }

    applyTheme(preferredAppearance);
    root.dataset.customerApp = "true";

    const handlePreferenceChange = (event: Event) => {
      const customEvent =
        event as CustomEvent<{
          appearance?: Appearance;
        }>;

      const nextAppearance =
        customEvent.detail?.appearance;

      if (
        nextAppearance !== "system" &&
        nextAppearance !== "light" &&
        nextAppearance !== "dark"
      ) {
        return;
      }

      try {
        window.localStorage.setItem("customer-appearance", nextAppearance);
      } catch {
        // The setting still applies for the current session without storage.
      }
      setAppearance(nextAppearance);
    };

    window.addEventListener(
      "customer-appearance-change",
      handlePreferenceChange
    );

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleSystemChange = () => {
      if (appearance === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener(
      "change",
      handleSystemChange
    );

    return () => {
      delete root.dataset.customerApp;
      window.removeEventListener(
        "customer-appearance-change",
        handlePreferenceChange
      );

      mediaQuery.removeEventListener(
        "change",
        handleSystemChange
      );
    };
  }, [appearance]);

  useEffect(() => {
    const indicator = document.createElement("div");
    indicator.className = "customer-pull-refresh";
    indicator.setAttribute("role", "status");
    indicator.setAttribute("aria-live", "polite");
    const spinner = document.createElement("span");
    spinner.className = "customer-pull-refresh__spinner";
    spinner.setAttribute("aria-hidden", "true");
    const indicatorLabel = document.createElement("span");
    indicatorLabel.className = "customer-pull-refresh__label";
    indicatorLabel.textContent = "Pull to refresh";
    indicator.append(spinner, indicatorLabel);
    document.body.appendChild(indicator);

    const label = indicator.querySelector<HTMLElement>(
      ".customer-pull-refresh__label"
    );
    let startX = 0;
    let startY = 0;
    let activeScroller: HTMLElement | null = null;
    let armed = false;
    let pulling = false;
    let refreshing = false;

    const hideIndicator = () => {
      indicator.dataset.visible = "false";
      indicator.style.removeProperty("--pull-distance");
    };

    const findScroller = (target: EventTarget | null) => {
      let element = target instanceof HTMLElement ? target : null;
      while (element && element !== document.body) {
        const overflowY = window.getComputedStyle(element).overflowY;
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          element.scrollHeight > element.clientHeight + 1
        ) {
          return element;
        }
        element = element.parentElement;
      }
      return null;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (refreshing || event.touches.length !== 1) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          ".customer-mobile-header, .customer-mobile-bottom-nav, input, textarea, select, [contenteditable='true']"
        )
      ) {
        return;
      }

      const scroller = findScroller(target);
      if (scroller ? scroller.scrollTop > 1 : window.scrollY > 1) return;

      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      activeScroller = scroller;
      armed = true;
      pulling = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!armed || refreshing || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const deltaY = touch.clientY - startY;
      const deltaX = Math.abs(touch.clientX - startX);
      if (deltaY <= 0 || deltaX > 42) {
        if (!pulling) armed = false;
        return;
      }

      const stillAtTop = activeScroller
        ? activeScroller.scrollTop <= 1
        : window.scrollY <= 1;
      if (!stillAtTop) {
        armed = false;
        return;
      }

      if (deltaY > 8) {
        pulling = true;
        indicator.dataset.visible = "true";
        const distance = Math.min(deltaY * 0.7, 82);
        indicator.style.setProperty("--pull-distance", `${distance}px`);
        if (label) {
          label.textContent = distance >= 68 ? "Release to refresh" : "Pull to refresh";
        }
        if (event.cancelable) event.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (pulling && !refreshing) {
        const distance = Number.parseFloat(
          indicator.style.getPropertyValue("--pull-distance")
        );
        if (distance >= 68) {
          refreshing = true;
          indicator.dataset.refreshing = "true";
          if (label) label.textContent = "Refreshing…";
          indicator.style.setProperty("--pull-distance", "68px");
          window.location.reload();
        } else {
          hideIndicator();
        }
      }
      armed = false;
      pulling = false;
      activeScroller = null;
    };

    const onTouchCancel = () => {
      armed = false;
      pulling = false;
      activeScroller = null;
      if (!refreshing) hideIndicator();
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
      indicator.remove();
    };
  }, []);

  return (
    <div className="customer-app-shell">
      {children}
    </div>
  );
}
