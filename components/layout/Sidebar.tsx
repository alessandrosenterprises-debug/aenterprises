"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Building2,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  navigation,
  type NavigationItem,
} from "@/lib/navigation";

import { supabase } from "@/lib/supabase/client";

/* ============================================================
   TYPES
============================================================ */

interface CompanySettings {
  company_name: string;
  tagline: string;
  logo_url: string;
}

/* ============================================================
   BRAND WORD
   Distributes letters across the same width so that:
   
   A........................O
   E........................S
   
   line up perfectly.
============================================================ */

function BrandWord({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const letters = text.split("");

  return (
    <div
      className={`flex w-full items-center justify-between whitespace-nowrap ${className}`}
      aria-label={text}
    >
      {letters.map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          className="inline-block"
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

/* ============================================================
   SIDEBAR ITEM
============================================================ */

function SidebarItem({
  item,
  pathname,
}: {
  item: NavigationItem;
  pathname: string;
}) {
  const hasChildren = !!item.children?.length;

  const activeChild =
    item.children?.some(
      (child) =>
        child.href &&
        (pathname === child.href ||
          pathname.startsWith(`${child.href}/`))
    ) ?? false;

  const [open, setOpen] = useState(
    Boolean(activeChild)
  );

  /* ==========================================================
     ITEM WITH CHILDREN
  ========================================================== */

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() =>
            setOpen((value) => !value)
          }
          className={`flex w-full items-center justify-between rounded-xl px-4 py-3 transition ${
            activeChild
              ? "bg-[#0A2852] text-white"
              : "text-slate-300 hover:bg-[#0A2852]/70 hover:text-white"
          }`}
        >
          <span className="flex min-w-0 items-center gap-4">
            {item.icon && (
              <item.icon className="h-5 w-5 shrink-0" />
            )}

            <span className="truncate font-medium">
              {item.title}
            </span>
          </span>

          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="ml-5 space-y-1 border-l border-white/10 pl-3">
            {item.children!.map((child) => {
              if (!child.href) {
                return null;
              }

              const active =
                pathname === child.href ||
                pathname.startsWith(
                  `${child.href}/`
                );

              return (
                <Link
                  key={child.title}
                  href={child.href}
                  className={`block rounded-lg px-4 py-2.5 text-sm transition ${
                    active
                      ? "bg-[#D4AF37] font-semibold text-[#03162F]"
                      : "text-slate-300 hover:bg-[#0A2852] hover:text-white"
                  }`}
                >
                  {child.title}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ==========================================================
     NORMAL ITEM
  ========================================================== */

  const active =
    !!item.href &&
    (pathname === item.href ||
      pathname.startsWith(
        `${item.href}/`
      ));

  return (
    <Link
      href={item.href ?? "#"}
      className={`flex items-center gap-4 rounded-xl px-4 py-3 transition ${
        active
          ? "border-l-4 border-[#D4AF37] bg-[#0A2852] text-white shadow-lg"
          : "text-slate-300 hover:bg-[#0A2852]/70 hover:text-white"
      }`}
    >
      {item.icon && (
        <item.icon className="h-5 w-5 shrink-0" />
      )}

      <span className="truncate font-medium">
        {item.title}
      </span>
    </Link>
  );
}

/* ============================================================
   SIDEBAR
============================================================ */

export default function Sidebar() {
  const pathname = usePathname();

  /* ==========================================================
     COMPANY STATE
  ========================================================== */

  const [company, setCompany] =
    useState<CompanySettings>({
      company_name:
        "Alessandro Enterprises",

      tagline:
        "The Name That Covers All",

      logo_url: "",
    });

  const [loading, setLoading] =
    useState(true);

  /* ==========================================================
     LOAD COMPANY SETTINGS
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadCompany() {
      try {
        setLoading(true);

        const {
          data,
          error,
        } = await supabase
          .from("company_settings")
          .select(
            "company_name, tagline, logo_url"
          )
          .eq(
            "singleton_key",
            "default"
          )
          .maybeSingle();

        if (error) {
          console.error(
            "Failed to load company branding:",
            error
          );

          return;
        }

        if (!mounted) {
          return;
        }

        if (data) {
          setCompany({
            company_name:
              data.company_name?.trim() ||
              "Alessandro Enterprises",

            tagline:
              data.tagline?.trim() ||
              "The Name That Covers All",

            logo_url:
              data.logo_url?.trim() ||
              "",
          });
        }
      } catch (error) {
        console.error(
          "Company branding error:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCompany();

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================
     COMPANY NAME
  ========================================================== */

  const companyName =
    company.company_name.trim();

  const normalizedName =
    companyName.toLowerCase();

  const isAlessandroEnterprises =
    normalizedName ===
    "alessandro enterprises";

  const firstLine =
    isAlessandroEnterprises
      ? "Alessandro"
      : companyName.split(" ")[0] ||
        "Alessandro";

  const secondLine =
    isAlessandroEnterprises
      ? "Enterprises"
      : companyName
          .split(" ")
          .slice(1)
          .join(" ") ||
        "Enterprises";

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <aside
      className="
        sticky
        top-0
        z-40
        flex
        h-screen
        w-[280px]
        min-w-[280px]
        shrink-0
        flex-col
        overflow-hidden
        bg-[#03162F]
        text-white
        shadow-xl
      "
    >
      {/* =====================================================
          COMPANY BRAND
      ===================================================== */}

      <div
        className="
          shrink-0
          border-b
          border-white/10
          bg-[#03162F]
          px-4
          py-5
        "
      >
        <div
          className="
            flex
            w-full
            items-center
            gap-4
          "
        >
          {/* =================================================
              LOGO
          ================================================= */}

          <div
            className="
              flex
              h-[68px]
              w-[68px]
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-2xl
              border
              border-[#D4AF37]/50
              bg-white
              shadow-[0_4px_18px_rgba(0,0,0,0.25)]
            "
          >
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={`${company.company_name} logo`}
                className="
                  h-full
                  w-full
                  object-contain
                  p-2
                "
              />
            ) : loading ? (
              <Loader2
                className="
                  h-6
                  w-6
                  animate-spin
                  text-[#D4AF37]
                "
              />
            ) : (
              <Building2
                className="
                  h-8
                  w-8
                  text-[#03162F]
                "
              />
            )}
          </div>

          {/* =================================================
              BRAND TEXT
          ================================================= */}

          <div
            className="
              min-w-0
              flex-1
              overflow-hidden
            "
          >
            {/* 
              EXACT WIDTH BRANDING

              Both words use the SAME container width.

              A........................O
              E........................S
            */}

            <div
              className="
                w-full
                max-w-[142px]
              "
            >
              <BrandWord
                text={firstLine}
                className="
                  text-[22px]
                  font-extrabold
                  leading-none
                  tracking-[-0.025em]
                  text-[#D4AF37]
                "
              />

              <BrandWord
                text={secondLine}
                className="
                  mt-[2px]
                  text-[20px]
                  font-extrabold
                  leading-none
                  tracking-[-0.02em]
                  text-white
                "
              />

              {/* =================================================
                  TAGLINE
              ================================================= */}

              <p
                className="
                  mt-2
                  w-full
                  whitespace-nowrap
                  text-[11px]
                  font-medium
                  leading-4
                  tracking-[0.005em]
                  text-slate-300
                "
              >
                {company.tagline}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav
        className="
          min-h-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
          p-4
        "
      >
        <div className="flex flex-col gap-2">
          {navigation.map((item) => (
            <SidebarItem
              key={item.title}
              item={item}
              pathname={pathname}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
}