
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Clock3,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  Mail,
  MessageCircle,
  Settings,
  ShoppingCart,
  Store,
  UserCircle,
  Wrench,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

interface Company {
  company_name: string | null;
  logo_url: string | null;
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

const navigationItems = [
  {
    label: "Home",
    href: "/customer",
    icon: Home,
  },
  {
    label: "Businesses",
    href: "/customer/businesses",
    icon: Store,
  },
  {
    label: "Services",
    href: "/customer/services",
    icon: Wrench,
  },
  {
    label: "Bookings",
    href: "/customer/bookings",
    icon: CalendarDays,
  },
  {
    label: "Orders",
    href: "/customer/orders",
    icon: ShoppingCart,
  },
];

export default function CustomerNavigationClient() {
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const [companyName, setCompanyName] = useState(
    "Alessandro Enterprises"
  );

  const [logoUrl, setLogoUrl] = useState("");

  const [customerFirstName, setCustomerFirstName] =
    useState("");

  const [customerAvatarUrl, setCustomerAvatarUrl] =
    useState("");

  useEffect(() => {
    let mounted = true;
    let profileId: string | null = null;
    let countInterval: number | undefined;

    async function refreshUnreadCount() {
      if (!profileId) return;
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profileId)
        .eq("unread", true);

      if (mounted && !error) {
        setUnreadNotificationCount(count ?? 0);
      }
    }

    async function loadNavigationData() {
      try {
        const [companyResult, userResult] =
          await Promise.all([
            supabase
              .from("company_settings")
              .select("company_name, logo_url")
              .eq("active", true)
              .maybeSingle(),

            supabase.auth.getUser(),
          ]);

        if (!mounted) return;

        if (companyResult.data) {
          const company =
            companyResult.data as Company;

          setCompanyName(
            company.company_name?.trim() ||
              "Alessandro Enterprises"
          );

          setLogoUrl(
            company.logo_url?.trim() || ""
          );
        }

        const user = userResult.data.user;

        if (!user) {
          setUnreadNotificationCount(0);
          return;
        }

        const { data: profileData } =
          await supabase
            .from("profiles")
            .select(
              `
                id,
                first_name,
                last_name,
                display_name,
                email,
                phone,
                avatar_url
              `
            )
            .eq("auth_user_id", user.id)
            .maybeSingle();

        if (!mounted) return;

        if (profileData) {
          const profile =
            profileData as Profile;
          profileId = profile.id;

          const firstName =
            profile.first_name?.trim() ||
            profile.display_name
              ?.trim()
              ?.split(/\s+/)[0] ||
            "";

          setCustomerFirstName(firstName);

          setCustomerAvatarUrl(
            profile.avatar_url?.trim() || ""
          );

          await refreshUnreadCount();
          countInterval = window.setInterval(
            () => void refreshUnreadCount(),
            30_000
          );
        } else {
          setUnreadNotificationCount(0);
        }
      } catch (error) {
        console.error(
          "Customer navigation loading error:",
          error
        );
      }
    }

    void loadNavigationData();
    const handleWindowFocus = () => void refreshUnreadCount();
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      mounted = false;
      window.removeEventListener("focus", handleWindowFocus);
      if (countInterval !== undefined) {
        window.clearInterval(countInterval);
      }
    };
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/customer") {
      return pathname === "/customer";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  const profileActive =
    pathname.startsWith("/customer/profile");

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const response = await fetch(
        "/api/auth/signout",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Sign out failed");
      }

      router.push("/customer/login");
      router.refresh();
    } catch (error) {
      console.error(
        "Customer sign out error:",
        error
      );

      setSigningOut(false);
    }
  };

  const initials =
    customerFirstName
      .trim()
      .charAt(0)
      .toUpperCase() || "C";

  const companyParts =
    companyName.trim().split(/\s+/);

  const companyPrimary =
    companyParts.length > 1
      ? companyParts.slice(0, -1).join(" ")
      : companyName;

  const companySecondary =
    companyParts.length > 1
      ? companyParts[companyParts.length - 1]
      : "";

  return (
    <>
      {/* =========================================================
          TOP NAVIGATION
      ========================================================= */}

      <header className="customer-mobile-header sticky top-0 z-[100] border-b border-white/10 bg-[#03162F] text-white shadow-[0_4px_20px_rgba(3,22,47,0.2)]">
        <div className="mx-auto flex h-16 w-full max-w-[760px] items-center justify-between gap-1 px-2 min-[390px]:h-[72px] min-[390px]:px-3 sm:h-[78px] sm:gap-2 sm:px-5">

          {/* BRAND */}

          <Link
            href="/customer"
            onClick={closeMenu}
            className="group flex min-w-0 items-center gap-2.5"
            aria-label={`${companyName} Home`}
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D4AF37]/60 bg-white sm:h-12 sm:w-12 lg:h-14 lg:w-14">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${companyName} logo`}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <span className="text-lg font-black text-[#03162F]">
                  A
                </span>
              )}

              <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/60" />
            </div>

            <div className="min-w-0 leading-none">
              <p className="max-w-[105px] truncate text-[9px] font-black uppercase tracking-[0.12em] text-[#D4AF37] min-[390px]:max-w-[140px] min-[390px]:text-[11px] sm:max-w-[220px] sm:text-[13px] sm:tracking-[0.16em]">
                {companyPrimary}
              </p>

              {companySecondary && (
                <p className="mt-1 max-w-[105px] truncate text-[10px] font-semibold text-white min-[390px]:max-w-[140px] min-[390px]:text-[11px] sm:max-w-[220px] sm:text-[13px]">
                  {companySecondary}
                </p>
              )}
            </div>
          </Link>

          {/* RIGHT SIDE */}

          <div className="flex shrink-0 items-center gap-1 min-[390px]:gap-2 sm:gap-3">

            {/* NOTIFICATIONS */}

            <Link
              href="/customer/notifications"
              aria-label={unreadNotificationCount > 0 ? `Notifications, ${unreadNotificationCount} unread` : "Notifications"}
              className={`group relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 active:scale-90 sm:h-12 sm:w-12 ${
                pathname.startsWith(
                  "/customer/notifications"
                )
                  ? "border-[#D4AF37] bg-[#D4AF37] text-[#03162F] shadow-[0_5px_15px_rgba(212,175,55,0.25)]"
                  : "border-white/10 bg-white/10 text-white shadow-inner hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/15"
              }`}
            >
              <Bell className="h-5 w-5 sm:h-[21px] sm:w-[21px]" />

              {unreadNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#03162F] bg-rose-500 px-1 text-[9px] font-black leading-none text-white shadow-md">
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </span>
              )}
            </Link>

            {/* PROFILE BUTTON */}

            <button
              type="button"
              onClick={() =>
                setMenuOpen((open) => !open)
              }
              aria-label="Customer account menu"
              aria-expanded={menuOpen}
              className={`group flex items-center gap-1 rounded-full px-1 py-1 min-[390px]:gap-2 min-[390px]:px-1.5 ${
                menuOpen || profileActive
                  ? "bg-white/10 shadow-inner"
                  : "hover:bg-white/10"
              }`}
            >
              <div
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 sm:h-11 sm:w-11 ${
                  menuOpen || profileActive
                    ? "border-[#D4AF37] shadow-[0_0_0_3px_rgba(212,175,55,0.12)]"
                    : "border-white/25 group-hover:border-[#D4AF37]"
                }`}
              >
                {customerAvatarUrl ? (
                  <img
                    src={customerAvatarUrl}
                    alt={
                      customerFirstName
                        ? `${customerFirstName} profile`
                        : "Customer profile"
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#D4AF37] to-amber-500 text-base font-black text-[#03162F]">
                    {initials}
                  </div>
                )}
              </div>

              <span className="hidden max-w-[72px] truncate text-[11px] font-bold text-white min-[390px]:block min-[390px]:max-w-[90px] sm:max-w-[130px] sm:text-sm">
                {customerFirstName || "Customer"}
              </span>

              <ChevronDown
                className={`mr-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform duration-300 sm:h-4 sm:w-4 ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* =======================================================
            ACCOUNT MENU
        ======================================================= */}

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close account menu"
              onClick={closeMenu}
              className="fixed inset-0 top-16 z-[-1] h-screen w-screen bg-black/20 backdrop-blur-[2px] min-[390px]:top-[72px] sm:top-[78px]"
            />

            <div className="absolute right-3 top-16 w-[calc(100%-24px)] max-w-[370px] origin-top overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-[0_25px_70px_rgba(15,23,42,0.32)] animate-[menuIn_180ms_ease-out] min-[390px]:top-[72px] sm:top-[78px]">

              {/* ACCOUNT HEADER */}

              <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-4 py-4">
                <div
                  aria-hidden="true"
                  className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#D4AF37]/10 blur-2xl"
                />

                <div className="relative flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#D4AF37]/60 bg-[#03162F] shadow-md">
                    {customerAvatarUrl ? (
                      <img
                        src={customerAvatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-black text-[#D4AF37]">
                        {initials}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#03162F]">
                      {customerFirstName
                        ? `Hello, ${customerFirstName}`
                        : "Customer Account"}
                    </p>

                    <p className="mt-1 truncate text-[10px] font-medium text-slate-500">
                      {companyName}
                    </p>
                  </div>
                </div>
              </div>

              {/* MENU ITEMS */}

              <div className="max-h-[calc(100vh-190px)] overflow-y-auto p-2">

                <CustomerMenuItem
                  href="/customer/profile"
                  icon={UserCircle}
                  label="My Profile"
                  onClick={closeMenu}
                />

                <CustomerMenuItem
                  href="/customer/profile?section=settings"
                  icon={Settings}
                  label="Account Settings"
                  onClick={closeMenu}
                />

                <CustomerMenuItem
                  href="/customer/notifications"
                  icon={Bell}
                  label="Notifications"
                  onClick={closeMenu}
                />

                <CustomerMenuItem
                  href="/customer/messages"
                  icon={MessageCircle}
                  label="Messages"
                  onClick={closeMenu}
                />

                <CustomerMenuItem
                  href="/customer/bookings"
                  icon={CalendarDays}
                  label="My Bookings"
                  onClick={closeMenu}
                />

                <CustomerMenuItem
                  href="/customer/activity"
                  icon={Clock3}
                  label="Activity History"
                  onClick={closeMenu}
                />

                <CustomerMenuItem
                  href="/customer/requests"
                  icon={FileText}
                  label="Requests"
                  onClick={closeMenu}
                />

                <CustomerMenuItem
                  href="/customer/emails"
                  icon={Mail}
                  label="Emails"
                  onClick={closeMenu}
                />

                <div className="my-2 border-t border-slate-100" />

                <CustomerMenuItem
                  href="/customer/preferences"
                  icon={Settings}
                  label="Preferences"
                  onClick={closeMenu}
                />

                <CustomerMenuItem
                  href="/customer/support"
                  icon={HelpCircle}
                  label="Support"
                  onClick={closeMenu}
                />

                {/* SIGN OUT */}

                <button
                  type="button"
                  disabled={signingOut}
                  onClick={handleSignOut}
                  className="group mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-xs font-semibold text-red-500 transition-all duration-200 hover:bg-red-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50 transition-transform duration-200 group-hover:scale-105">
                    <LogOut className="h-4 w-4" />
                  </span>

                  <span>
                    {signingOut
                      ? "Signing Out..."
                      : "Sign Out"}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* =========================================================
          SOLID BOTTOM NAVIGATION
      ========================================================= */}

      <nav
        aria-label="Customer navigation"
        className="customer-mobile-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-[90]"
      >
        <div className="mx-auto w-full max-w-[760px] px-2 pb-2 sm:px-3 sm:pb-3">
          <div className="pointer-events-auto relative overflow-hidden rounded-[22px] border border-white/10 bg-[#03162F] shadow-[0_-8px_30px_rgba(3,22,47,0.22)]">

            {/* Subtle gold top border */}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[#D4AF37]/70"
            />

            <div className="relative grid h-[66px] grid-cols-5 px-1 sm:h-[70px] sm:px-2">
              {navigationItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={
                      active ? "page" : undefined
                    }
                    className="group relative flex min-w-0 items-center justify-center"
                  >
                    <div
                      className={`relative flex w-full min-w-0 flex-col items-center justify-center rounded-2xl px-0 py-2 transition-colors duration-200 ${
                        active
                          ? "text-[#D4AF37]"
                          : "text-white/65 hover:text-white"
                      }`}
                    >
                      {/* ICON */}

                      <span
                        className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 ${
                          active
                            ? "bg-[#D4AF37]/10"
                            : "bg-white/5 group-hover:bg-white/10"
                        }`}
                      >
                        <Icon
                          className="h-[19px] w-[19px] transition-transform duration-150 group-active:scale-[0.94]"
                          strokeWidth={active ? 2.5 : 2}
                        />
                      </span>

                      {/* LABEL */}

                      <span
                        className={`mt-1.5 max-w-[62px] truncate text-[8px] font-bold leading-none transition-colors duration-200 sm:text-[9px] ${
                          active
                            ? "text-[#D4AF37]"
                            : "text-white/65 group-hover:text-white"
                        }`}
                      >
                        {item.label}
                      </span>

                      {/* ACTIVE INDICATOR */}

                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute -bottom-0.5 h-1 w-5 rounded-full bg-[#D4AF37]"
                        />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* =========================================================
          ANIMATIONS / ACCESSIBILITY
      ========================================================= */}

      <style jsx global>{`
        @keyframes menuIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </>
  );
}

function CustomerMenuItem({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#03162F] transition-all duration-200 group-hover:scale-105 group-hover:bg-[#03162F] group-hover:text-[#D4AF37]">
        <Icon className="h-4 w-4" />
      </span>

      <span className="flex-1">
        {label}
      </span>

      <span className="translate-x-[-4px] text-slate-300 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
        →
      </span>
    </Link>
  );
}
