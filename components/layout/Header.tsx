"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Building2,
  ChevronDown,
  Settings,
} from "lucide-react";

import NotificationCenter from "./NotificationCenter";
import UserProfile from "./UserProfile";
import { supabase } from "@/lib/supabase/client";

interface CompanySettings {
  company_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  active: boolean | null;
}

const FALLBACK_COMPANY_NAME = "Alessandro Enterprises";
const FALLBACK_TAGLINE = "The Name That Covers All";

export default function Header() {
  const [company, setCompany] = useState<CompanySettings>({
    company_name: FALLBACK_COMPANY_NAME,
    tagline: FALLBACK_TAGLINE,
    logo_url: null,
    active: true,
  });

  const [logoError, setLogoError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCompanySettings() {
      try {
        const { data, error } = await supabase
          .from("company_settings")
          .select(
            `
              company_name,
              tagline,
              logo_url,
              active
            `
          )
          .eq("singleton_key", "default")
          .maybeSingle();

        if (error) {
          console.error(
            "Failed to load company settings:",
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
            FALLBACK_COMPANY_NAME,

          tagline:
            data.tagline?.trim() ||
            FALLBACK_TAGLINE,

          logo_url:
            data.logo_url?.trim() || null,

          active:
            data.active ?? true,
        });

        setLogoError(false);
      } catch (error) {
        console.error(
          "Unexpected error loading company settings:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCompanySettings();

    return () => {
      mounted = false;
    };
  }, []);

  const companyName =
    company.company_name || FALLBACK_COMPANY_NAME;

  const companyTagline =
    company.tagline || FALLBACK_TAGLINE;

  const nameParts = companyName.trim().split(/\s+/);

  const primaryName =
    nameParts.length > 1
      ? nameParts.slice(0, -1).join(" ")
      : companyName;

  const secondaryName =
    nameParts.length > 1
      ? nameParts[nameParts.length - 1]
      : "";

  const showLogo =
    Boolean(company.logo_url) && !logoError;

  return (
    <header
      className="
        sticky
        top-0
        z-[200]
        border-b
        border-slate-200
        bg-[#03162F]
        text-white
        shadow-[0_8px_30px_rgba(3,22,47,0.16)]
      "
    >
      <div
        className="
          flex
          min-h-[82px]
          items-center
          justify-between
          gap-4
          px-4
          py-3
          sm:px-6
          lg:px-8
        "
      >
        {/* =====================================================
            BRAND
            ===================================================== */}

        <Link
          href="/dashboard"
          className="
            group
            flex
            min-w-0
            items-center
            gap-3
            rounded-2xl
            transition
            hover:opacity-95
          "
          aria-label={`${companyName} dashboard`}
        >
          <div
            className="
              relative
              flex
              h-14
              w-14
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-2xl
              border-2
              border-[#D4AF37]
              bg-white
              shadow-[0_6px_22px_rgba(212,175,55,0.18)]
              transition
              duration-300
              group-hover:scale-[1.03]
              group-hover:shadow-[0_8px_28px_rgba(212,175,55,0.28)]
              sm:h-16
              sm:w-16
            "
          >
            {showLogo ? (
              <img
                src={company.logo_url!}
                alt={`${companyName} logo`}
                className="
                  h-full
                  w-full
                  object-contain
                  p-1.5
                "
                onError={() => {
                  setLogoError(true);
                }}
              />
            ) : (
              <Building2
                className="
                  h-8
                  w-8
                  text-[#D4AF37]
                "
                strokeWidth={1.7}
              />
            )}

            {loading && (
              <div
                className="
                  absolute
                  inset-0
                  animate-pulse
                  bg-slate-100/60
                "
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span
                className="
                  truncate
                  text-base
                  font-bold
                  tracking-tight
                  text-white
                  sm:text-lg
                "
              >
                {primaryName}
              </span>

              {secondaryName && (
                <span
                  className="
                    hidden
                    text-base
                    font-black
                    tracking-tight
                    text-[#D4AF37]
                    sm:inline
                    sm:text-lg
                  "
                >
                  {secondaryName}
                </span>
              )}
            </div>

            <p
              className="
                mt-0.5
                hidden
                max-w-[300px]
                truncate
                text-[10px]
                font-medium
                uppercase
                tracking-[0.16em]
                text-slate-300
                sm:block
              "
            >
              {companyTagline}
            </p>
          </div>
        </Link>

        {/* =====================================================
            RIGHT SIDE ACTIONS
            ===================================================== */}

        <div className="flex items-center gap-1.5 sm:gap-3">
          <NotificationCenter />

          <Link
            href="/dashboard/settings"
            aria-label="Settings"
            className="
              hidden
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-white/10
              bg-white/5
              text-slate-300
              transition
              hover:border-[#D4AF37]/40
              hover:bg-[#D4AF37]/10
              hover:text-[#D4AF37]
              sm:flex
            "
          >
            <Settings
              className="h-5 w-5"
              strokeWidth={1.8}
            />
          </Link>

          <UserProfile />

          <div
            className="
              hidden
              h-10
              items-center
              justify-center
              text-slate-500
              md:flex
            "
          >
            <ChevronDown
              className="h-4 w-4"
              strokeWidth={1.5}
            />
          </div>
        </div>
      </div>
    </header>
  );
}