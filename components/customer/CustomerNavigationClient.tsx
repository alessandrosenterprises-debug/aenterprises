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
          return;
        }

        const { data: profileData } =
          await supabase
            .from("profiles")
            .select(
              `
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
        }
      } catch (error) {
        console.error(
          "Customer navigation loading error:",
          error
        );
      }
    }

    void loadNavigationData();

    return () => {
      mounted = false;
    };
  }, []);

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
      <header className="sticky top-0 z-[100] border-b border-white/10 bg-[#03162F]/95 text-white shadow-[0_4px_20px_rgba(3,22,47,0.18)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-[720px] items-center justify-between px-3 sm:h-[78px] sm:px-5">

          <Link
            href="/customer"
            onClick={closeMenu}
            className="group flex min-w-0 items-center gap-2.5"
            aria-label={`${companyName} Home`}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D4AF37]/50 bg-white shadow-md transition duration-300 group-hover:scale-105 sm:h-14 sm:w-14">
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
            </div>

            <div className="min-w-0 leading-none">
              <p className="max-w-[150px] truncate text-[11px] font-black uppercase tracking-[0.16em] text-[#D4AF37] sm:max-w-[220px] sm:text-[13px]">
                {companyPrimary}
              </p>

              {companySecondary && (
                <p className="mt-1 max-w-[150px] truncate text-[11px] font-semibold text-white sm:max-w-[220px] sm:text-[13px]">
                  {companySecondary}
                </p>
              )}
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">

            <Link
              href="/customer/notifications"
              aria-label="Notifications"
              className={`relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 active:scale-95 sm:h-12 sm:w-12 ${
                pathname.startsWith(
                  "/customer/notifications"
                )
                  ? "border-[#D4AF37] bg-[#D4AF37] text-[#03162F]"
                  : "border-white/10 bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              <Bell className="h-5 w-5 sm:h-[21px] sm:w-[21px]" />

              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#D4AF37]" />
            </Link>

            <button
              type="button"
              onClick={() =>
                setMenuOpen((open) => !open)
              }
              aria-label="Customer account menu"
              aria-expanded={menuOpen}
              className={`group flex items-center gap-2 rounded-full px-1.5 py-1 transition-all duration-200 active:scale-[0.98] ${
                menuOpen || profileActive
                  ? "bg-white/10"
                  : "hover:bg-white/10"
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 transition-all duration-200 sm:h-12 sm:w-12 ${
                  menuOpen || profileActive
                    ? "border-[#D4AF37]"
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
                  <div className="flex h-full w-full items-center justify-center bg-[#D4AF37] text-base font-black text-[#03162F]">
                    {initials}
                  </div>
                )}
              </div>

              <span className="max-w-[105px] truncate text-[11px] font-bold text-white sm:max-w-[130px] sm:text-sm">
                {customerFirstName || "Customer"}
              </span>

              <ChevronDown
                className={`mr-0.5 h-4 w-4 shrink-0 text-slate-300 transition-transform duration-200 ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close account menu"
              onClick={closeMenu}
              className="fixed inset-0 top-[72px] z-[-1] h-screen w-screen bg-black/10 sm:top-[78px]"
            />

            <div className="absolute right-3 top-[78px] w-[calc(100%-24px)] max-w-[370px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-[0_20px_50px_rgba(15,23,42,0.28)] sm:right-5 sm:top-[84px]">

              <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#D4AF37]/60 bg-[#03162F]">
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
                    <p className="truncate text-sm font-bold text-[#03162F]">
                      {customerFirstName
                        ? `Hello, ${customerFirstName}`
                        : "Customer Account"}
                    </p>

                    <p className="mt-1 truncate text-[10px] text-slate-500">
                      {companyName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2">

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

                {/* Messages moved from bottom navigation into account menu */}
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

                {/* Emails remain available from the account menu */}
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

                <button
                  type="button"
                  disabled={signingOut}
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-red-500 transition hover:bg-red-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50">
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

      <nav
        aria-label="Customer navigation"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[90]"
      >
        <div className="mx-auto w-full max-w-[720px] px-2 pb-2">
          <div className="pointer-events-auto overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_-8px_35px_rgba(15,23,42,0.14)] backdrop-blur-xl">

            {/* 4 bottom navigation items: Home, Businesses, Services, Bookings */}
            <div className="grid h-[66px] grid-cols-5 sm:h-[68px]">
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
                    className={`group relative flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 transition-all duration-200 active:scale-95 ${
                      active
                        ? "text-[#03162F]"
                        : "text-slate-400 hover:text-[#03162F]"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200 sm:h-9 sm:w-9 ${
                        active
                          ? "bg-[#03162F] text-[#D4AF37] shadow-sm"
                          : "bg-transparent group-hover:bg-slate-100"
                      }`}
                    >
                      <Icon
                        className="h-[16px] w-[16px] sm:h-[17px] sm:w-[17px]"
                        strokeWidth={
                          active ? 2.4 : 2
                        }
                      />
                    </span>

                    <span
                      className={`max-w-full truncate text-[8px] font-semibold leading-none sm:text-[9px] ${
                        active
                          ? "text-[#03162F]"
                          : "text-slate-400"
                      }`}
                    >
                      {item.label}
                    </span>

                    {active && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#D4AF37]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
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
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#03162F]">
        <Icon className="h-4 w-4" />
      </span>

      <span>{label}</span>
    </Link>
  );
}