import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  History,
  Landmark,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { createClient } from "@/lib/supabase/server";
import SoftLoansLoanOverview from "@/components/customer/SoftLoansLoanOverview";

interface BusinessPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CustomerBusinessPage({
  params,
}: BusinessPageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(
      `
        id,
        name,
        slug,
        description,
        logo_url,
        active
      `
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (businessError) {
    console.error("Customer business loading error:", businessError);
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-slate-50 pb-[92px]">
        <CustomerNavigation />

        <div className="mx-auto flex min-h-[70vh] w-full max-w-[720px] items-center justify-center px-5">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#03162F] text-[#D4AF37]">
              <Landmark className="h-8 w-8" />
            </div>

            <h1 className="mt-5 text-xl font-black text-[#03162F]">
              Business Not Found
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This business is unavailable or is no longer active.
            </p>

            <Link
              href="/customer/businesses"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-[#08264D] hover:shadow-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Businesses
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isSoftLoans =
    business.slug.toLowerCase() === "soft-loans" ||
    business.name.toLowerCase().includes("soft loans");

  if (!isSoftLoans) {
    return (
      <main className="min-h-screen bg-slate-50 pb-[92px]">
        <CustomerNavigation />

        <div className="mx-auto flex min-h-[70vh] w-full max-w-[720px] items-center justify-center px-5">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#03162F] text-[#D4AF37]">
              <Landmark className="h-8 w-8" />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Alessandro Enterprises
            </p>

            <h1 className="mt-2 text-xl font-black text-[#03162F]">
              {business.name}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {business.description ||
                "This business experience is being prepared."}
            </p>

            <Link
              href="/customer/businesses"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-[#08264D] hover:shadow-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Businesses
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const businessBase = `/customer/businesses/${business.slug}`;

  return (
    <main className="min-h-screen bg-slate-50 pb-[92px]">
      <CustomerNavigation />

      <div className="mx-auto w-full max-w-[720px]">
        {/* =========================================================
            BUSINESS HEADER
        ========================================================= */}
        <section className="relative overflow-hidden bg-[#03162F] px-5 pb-6 pt-3 text-white">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10">
            <Link
              href="/customer/businesses"
              className="group inline-flex items-center gap-2 text-xs font-bold text-slate-300 transition-all duration-300 hover:text-[#D4AF37]"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              All Businesses
            </Link>

            <div className="mt-4 flex items-center gap-3">
              {business.logo_url ? (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white shadow-lg transition-transform duration-300 hover:scale-105">
                  <img
                    src={business.logo_url}
                    alt={`${business.name} logo`}
                    className="h-full w-full object-contain p-1.5"
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#D4AF37]">
                  <Landmark className="h-7 w-7" />
                </div>
              )}

              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
                  Alessandro Enterprises
                </p>

                <h1 className="mt-0.5 truncate text-lg font-black tracking-tight sm:text-xl">
                  {business.name}
                </h1>

                <p className="mt-0.5 text-[11px] text-slate-300">
                  Financial support made simple.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-7 px-4 py-5 sm:px-5">
          {/* =========================================================
              MAIN APPLY HERO
          ========================================================= */}
          <section className="group relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#03162F] via-[#08264D] to-[#0B396D] p-6 text-white shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
            {/* Decorative gradients */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#D4AF37]/15 blur-3xl transition-transform duration-700 group-hover:scale-125" />

            <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-blue-400/10 blur-3xl" />

            <div className="pointer-events-none absolute right-6 top-6 text-white/5">
              <Sparkles className="h-20 w-20" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D4AF37]" />

                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  Loan Applications
                </span>
              </div>

              <h2 className="mt-4 max-w-[520px] text-[28px] font-black leading-[1.08] tracking-tight sm:text-4xl">
                Financial support
                <span className="block text-[#D4AF37]">
                  when you need it.
                </span>
              </h2>

              <p className="mt-4 max-w-[520px] text-sm leading-6 text-slate-300">
                Apply for a loan through a simple and secure application
                process.
              </p>

              <Link
                href={`${businessBase}/apply`}
                className="group/apply mt-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E4C45A] px-5 py-4 text-[#03162F] shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div>
                  <span className="block text-sm font-black">
                    Apply For A Loan
                  </span>

                  <span className="mt-0.5 block text-[11px] font-medium opacity-70">
                    Start your application
                  </span>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#03162F]/10">
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover/apply:translate-x-1" />
                </div>
              </Link>
            </div>
          </section>

          {/* =========================================================
              LOAN OVERVIEW
          ========================================================= */}
          <section className="transition-all duration-500">
            <SoftLoansLoanOverview slug={business.slug} />
          </section>

          {/* =========================================================
              QUICK ACCESS
          ========================================================= */}
          <section>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  Your Loans
                </p>

                <h2 className="mt-1 text-lg font-black text-[#03162F]">
                  Quick Access
                </h2>
              </div>

              <span className="text-[10px] font-semibold text-slate-400">
                Manage your applications
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link
                href={`${businessBase}/status`}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:shadow-lg"
              >
                <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#D4AF37]/5 blur-2xl transition-transform duration-500 group-hover:scale-150" />

                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#03162F] to-[#0B396D] text-[#D4AF37] shadow-sm transition-transform duration-300 group-hover:scale-105">
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <h3 className="mt-3 text-sm font-black text-[#03162F]">
                    Loan Status
                  </h3>

                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400 transition-colors duration-300 group-hover:text-[#03162F]">
                    Check application
                    <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

              <Link
                href={`${businessBase}/history`}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:shadow-lg"
              >
                <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-blue-500/5 blur-2xl transition-transform duration-500 group-hover:scale-150" />

                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#03162F] to-[#0B396D] text-[#D4AF37] shadow-sm transition-transform duration-300 group-hover:scale-105">
                    <History className="h-5 w-5" />
                  </div>

                  <h3 className="mt-3 text-sm font-black text-[#03162F]">
                    Loan History
                  </h3>

                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400 transition-colors duration-300 group-hover:text-[#03162F]">
                    View previous loans
                    <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </div>
          </section>

          {/* =========================================================
              LOAN SERVICES
          ========================================================= */}
          <section>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  What We Offer
                </p>

                <h2 className="mt-1 text-lg font-black text-[#03162F]">
                  Loan Services
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Explore our available loan categories.
                </p>
              </div>

              <BriefcaseBusiness className="h-5 w-5 text-[#D4AF37]" />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link
                href={`${businessBase}/services?category=personal`}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-lg"
              >
                <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#D4AF37]/5 blur-2xl transition-transform duration-500 group-hover:scale-150" />

                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#03162F] to-[#0B396D] text-[#D4AF37]">
                    <WalletCards className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </div>

                  <h3 className="mt-3 text-sm font-black text-[#03162F]">
                    Personal Loans
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Financial support for personal needs and everyday
                    expenses.
                  </p>

                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-[#03162F]">
                    Explore
                    <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

              <Link
                href={`${businessBase}/services?category=business`}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-lg"
              >
                <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-blue-500/5 blur-2xl transition-transform duration-500 group-hover:scale-150" />

                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#03162F] to-[#0B396D] text-[#D4AF37]">
                    <BriefcaseBusiness className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </div>

                  <h3 className="mt-3 text-sm font-black text-[#03162F]">
                    Business Loans
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Support for small businesses and business financial
                    needs.
                  </p>

                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-[#03162F]">
                    Explore
                    <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

              <Link
                href={`${businessBase}/services?category=emergency`}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-lg"
              >
                <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl transition-transform duration-500 group-hover:scale-150" />

                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#03162F] to-[#0B396D] text-[#D4AF37]">
                    <ShieldCheck className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </div>

                  <h3 className="mt-3 text-sm font-black text-[#03162F]">
                    Emergency Loans
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Financial assistance for unexpected expenses and urgent
                    needs.
                  </p>

                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-[#03162F]">
                    Explore
                    <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </div>

            <Link
              href={`${businessBase}/services`}
              className="group mt-3 flex items-center justify-center gap-2 rounded-xl border border-[#03162F] bg-white px-4 py-3 text-xs font-black text-[#03162F] transition-all duration-300 hover:bg-[#03162F] hover:text-white hover:shadow-md"
            >
              View All Loan Services
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </section>

          {/* =========================================================
              PROMOTIONS
              KEEP THIS — WILL BE CONNECTED TO AEOS
          ========================================================= */}
          <section>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  Latest
                </p>

                <h2 className="mt-1 text-lg font-black text-[#03162F]">
                  Promotions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Discover current Soft Loans offers.
                </p>
              </div>

              <BadgePercent className="h-5 w-5 text-[#D4AF37]" />
            </div>

            <Link
              href={`${businessBase}/promotions`}
              className="group relative mt-3 flex items-center justify-between overflow-hidden rounded-[24px] bg-gradient-to-br from-[#03162F] via-[#08264D] to-[#0B396D] p-5 text-white shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#D4AF37]/10 blur-3xl transition-transform duration-700 group-hover:scale-125" />

              <div className="relative z-10 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] transition-transform duration-300 group-hover:scale-105">
                  <BadgePercent className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                    Special Offers
                  </p>

                  <h3 className="mt-1 text-base font-black">
                    Soft Loans Promotions
                  </h3>

                  <p className="mt-1 max-w-[430px] text-xs leading-5 text-slate-300">
                    View current promotions and special loan offers from
                    Alessandro Soft Loans.
                  </p>

                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37]">
                    View Promotions
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>

              <ArrowRight className="relative z-10 ml-3 h-5 w-5 shrink-0 text-[#D4AF37] transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </section>

          {/* =========================================================
              TRUST / INFORMATION
          ========================================================= */}
          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-[#03162F] to-[#08264D] px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>

                <div>
                  <h3 className="text-sm font-black">
                    Simple. Secure. Transparent.
                  </h3>

                  <p className="mt-0.5 text-[10px] text-slate-300">
                    Everything you need in one place.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D4AF37]" />

                <span className="text-[11px] font-semibold text-slate-600">
                  Simple application
                </span>
              </div>

              <div className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D4AF37]" />

                <span className="text-[11px] font-semibold text-slate-600">
                  Track your application
                </span>
              </div>

              <div className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D4AF37]" />

                <span className="text-[11px] font-semibold text-slate-600">
                  View loan history
                </span>
              </div>
            </div>
          </section>

          {/* Small bottom breathing space */}
          <div className="h-1" />
        </section>
      </div>
    </main>
  );
}