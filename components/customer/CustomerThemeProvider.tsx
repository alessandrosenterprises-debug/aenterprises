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

    applyTheme(appearance);

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

  return <>{children}</>;
}