import Link from "next/link";
import {
  ArrowLeft,
  MessageSquareText,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import ConsultationWorkspace from "./ConsultationWorkspace";

type ConsultationRequest = {
  id: string;
  customer_id: string | null;
  business_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  consultation_type: string;
  preferred_date: string | null;
  preferred_time: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export default async function TechnologyConsultationsPage() {
  const supabase = await createClient();

  /*
   * ------------------------------------------------------------
   * 1. Find Alessandro Tech Solutions
   * ------------------------------------------------------------
   */
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .eq("slug", "tech-solutions")
    .eq("active", true)
    .maybeSingle();

  /*
   * ------------------------------------------------------------
   * 2. Load consultation requests
   * ------------------------------------------------------------
   */
  let consultations: ConsultationRequest[] = [];
  let consultationsError: string | null = null;

  if (business?.id) {
    const { data, error } = await supabase
      .from("technology_consultation_requests")
      .select(
        `
          id,
          customer_id,
          business_id,
          name,
          phone,
          email,
          consultation_type,
          preferred_date,
          preferred_time,
          subject,
          message,
          status,
          created_at,
          updated_at
        `
      )
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "Technology consultation dashboard query error:",
        error
      );

      consultationsError =
        "We could not load the consultation requests right now.";
    } else {
      consultations = (data ?? []) as ConsultationRequest[];
    }
  } else if (!businessError) {
    consultationsError =
      "Alessandro Tech Solutions could not be found.";
  } else {
    console.error(
      "Technology consultation business lookup error:",
      businessError
    );

    consultationsError =
      "We could not connect to Alessandro Tech Solutions.";
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative overflow-hidden bg-[#03162F]">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#D4AF37]/15 blur-3xl" />

        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/dashboard/enterprise/tech-solutions"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tech Solutions
          </Link>

          <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-semibold text-[#D4AF37]">
                <Sparkles className="h-3.5 w-3.5" />
                AEOS • Tech Solutions
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Technology Consultations
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Manage customer technology consultation requests,
                respond to customers, and move each request through
                the consultation process.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Business
                </p>

                <p className="mt-1 text-sm font-bold text-white">
                  {business?.name ??
                    "Alessandro Tech Solutions"}
                </p>
              </div>

              <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-3 text-[#D4AF37] sm:block">
                <MessageSquareText className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          MAIN
      ========================================================== */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {consultationsError && (
          <section className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">
              Unable to load consultations
            </p>

            <p className="mt-1 text-sm text-red-700">
              {consultationsError}
            </p>
          </section>
        )}

        {/* Live connection indicator */}
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-r from-[#03162F] to-[#08294f] px-4 py-3 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#D4AF37]/15 p-2 text-[#D4AF37]">
              <MessageSquareText className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-semibold">
                Customer consultation management
              </p>

              <p className="text-xs text-slate-400">
                Connected to AEOS • Alessandro Tech Solutions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <RefreshCw className="h-3.5 w-3.5" />
            Live data
          </div>
        </div>

        <ConsultationWorkspace
          consultations={consultations}
        />
      </div>
    </main>
  );
}