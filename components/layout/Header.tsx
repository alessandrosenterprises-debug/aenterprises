"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Loader2,
  Settings,
} from "lucide-react";

import SearchInput from "@/components/ui/search/SearchInput";
import NotificationCenter from "@/components/layout/NotificationCenter";
import UserProfile from "./UserProfile";

import { supabase } from "@/lib/supabase/client";

interface CompanySettings {
  company_name: string;
  tagline: string;
  logo_url: string;
}

/* ============================================================
   BLOCK BRAND WORD
============================================================ */

function BrandWord({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={`whitespace-nowrap font-black uppercase ${className}`}
    >
      {text}
    </div>
  );
}

/* ============================================================
   HEADER
============================================================ */

export default function Header() {
  const [company, setCompany] =
    useState<CompanySettings>({
      company_name: "Alessandro Enterprises",
      tagline: "The Name That Covers All",
      logo_url: "",
    });

  const [loading, setLoading] =
    useState(true);

  /* ==========================================================
     LOAD COMPANY BRANDING
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadCompany() {
      try {
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

        if (!mounted || !data) {
          return;
        }

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
     BRAND NAME
  ========================================================== */

  const companyName =
    company.company_name.trim();

  const isAlessandro =
    companyName.toLowerCase() ===
    "alessandro enterprises";

  const firstLine =
    isAlessandro
      ? "ALESSANDRO"
      : companyName
          .split(" ")[0]
          ?.toUpperCase() ||
        "ALESSANDRO";

  const secondLine =
    isAlessandro
      ? "ENTERPRISES"
      : companyName
          .split(" ")
          .slice(1)
          .join(" ")
          .toUpperCase() ||
        "ENTERPRISES";

  return (
    <header
      className="
        relative
        z-[100]
        flex
        h-[92px]
        w-full
        shrink-0
        items-center
        border-b
        border-[#8F6500]
        bg-[#03162F]
        text-white
        shadow-[0_4px_18px_rgba(3,22,47,0.25)]
      "
    >
      {/* =====================================================
          COMPANY BRAND
      ===================================================== */}

      <div
        className="
          flex
          h-full
          shrink-0
          items-center
          pl-4
          pr-5
          sm:pl-5
          sm:pr-6
          lg:pl-6
          lg:pr-8
        "
      >
        <div className="flex items-center gap-4">
          {/* LOGO */}

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
              border-2
              border-[#D4AF37]
              bg-white
              shadow-[0_4px_18px_rgba(0,0,0,0.35)]
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
                  text-[#B8860B]
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

          {/* BRAND */}

          <div className="hidden sm:block">
            <BrandWord
              text={firstLine}
              className="
                text-[19px]
                leading-none
                tracking-[0.16em]
                text-[#D4AF37]
              "
            />

            <BrandWord
              text={secondLine}
              className="
                mt-1
                text-[18px]
                leading-none
                tracking-[0.18em]
                text-white
              "
            />

            <p
              className="
                mt-1.5
                whitespace-nowrap
                text-[10px]
                font-bold
                uppercase
                tracking-[0.08em]
                text-slate-300
              "
            >
              {company.tagline}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          DIVIDER
      ===================================================== */}

      <div
        className="
          hidden
          h-12
          w-px
          bg-white/15
          lg:block
        "
      />

      {/* =====================================================
          MANAGEMENT PORTAL
      ===================================================== */}

      <div
        className="
          hidden
          shrink-0
          items-center
          px-5
          xl:flex
        "
      >
        <div>
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <span
              className="
                text-[15px]
                font-black
                uppercase
                tracking-[0.1em]
                text-white
              "
            >
              ALESSANDRO
            </span>

            <ChevronRight
              className="
                h-4
                w-4
                text-[#D4AF37]
              "
            />
          </div>

          <p
            className="
              mt-1
              text-[11px]
              font-black
              uppercase
              tracking-[0.12em]
              text-[#D4AF37]
            "
          >
            Management Portal
          </p>
        </div>
      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div
        className="
          mx-4
          hidden
          min-w-0
          flex-1
          lg:flex
        "
      >
        <SearchInput />
      </div>

      {/* =====================================================
          RIGHT CONTROLS
      ===================================================== */}

      <div
        className="
          ml-auto
          flex
          shrink-0
          items-center
          gap-2
          px-3
          sm:px-5
          lg:gap-3
          lg:px-6
        "
      >
        {/* ===================================================
            SYSTEM ONLINE
        =================================================== */}

        <div
          className="
            hidden
            items-center
            gap-2
            rounded-xl
            border
            border-white/20
            bg-white/5
            px-4
            py-2.5
            xl:flex
          "
        >
          <span
            className="
              h-2.5
              w-2.5
              rounded-full
              bg-emerald-400
              shadow-[0_0_10px_rgba(52,211,153,0.8)]
            "
          />

          <span
            className="
              text-xs
              font-black
              uppercase
              tracking-wide
              text-slate-200
            "
          >
            System Online
          </span>
        </div>

        {/* ===================================================
            NOTIFICATION — WHITE BOX
        =================================================== */}

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-white
            shadow-[0_3px_12px_rgba(0,0,0,0.2)]
            transition
            hover:bg-slate-50
          "
        >
          <NotificationCenter />
        </div>

        {/* ===================================================
            SETTINGS — WHITE BOX
        =================================================== */}

        <Link
          href="/dashboard/settings"
          aria-label="Settings"
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-white
            text-[#03162F]
            shadow-[0_3px_12px_rgba(0,0,0,0.2)]
            transition
            hover:bg-slate-50
            hover:text-[#8F6500]
          "
        >
          <Settings className="h-5 w-5" />
        </Link>

        {/* ===================================================
            DIVIDER
        =================================================== */}

        <div
          className="
            mx-1
            hidden
            h-10
            w-px
            bg-white/20
            sm:block
          "
        />

        {/* ===================================================
            SUPER ADMINISTRATOR — WHITE PANEL
        =================================================== */}

        <div
          className="
            flex
            min-w-[190px]
            items-center
            rounded-xl
            bg-white
            px-2
            py-1.5
            text-[#03162F]
            shadow-[0_3px_14px_rgba(0,0,0,0.22)]
            transition
            hover:bg-slate-50
          "
        >
          <UserProfile />
        </div>
      </div>
    </header>
  );
}