import CustomerNavigationClient from "@/components/customer/CustomerNavigationClient";
import {
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface CompanySettings {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
}

export default async function CustomerSupportPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("company_settings")
    .select("phone, whatsapp, email")
    .eq("singleton_key", "default")
    .maybeSingle<CompanySettings>();

  const phone = settings?.phone?.trim() || "";
  const whatsapp = settings?.whatsapp?.trim() || "";
  const email = settings?.email?.trim() || "";

  const whatsappNumber = whatsapp
    ? whatsapp.replace(/\D/g, "").replace(/^0/, "260")
    : "";

  const whatsappMessage = encodeURIComponent(
    "Hello AEOS Support, I need assistance."
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-28">
      {/* Customer navigation stays at the top */}
      <CustomerNavigationClient />

      {/* Support content */}
      <div className="mx-auto w-full max-w-[720px] px-4 pb-10 pt-5 sm:px-5 sm:pt-6">
        <div className="mb-5">
          <h1 className="text-2xl font-black tracking-tight text-[#03162F] sm:text-3xl">
            Customer Support
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
            We are here to help. Contact Alessandro Enterprises
            through any of the available support channels.
          </p>
        </div>

        <div className="space-y-3">
          {phone && (
            <a
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#03162F]/20 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-white">
                <Phone className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Phone
                </p>

                <p className="mt-1 break-all text-base font-bold text-[#03162F]">
                  {phone}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Tap to call AEOS Support
                </p>
              </div>
            </a>
          )}

          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#25D366]/40 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white">
                <MessageCircle className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  WhatsApp
                </p>

                <p className="mt-1 break-all text-base font-bold text-[#03162F]">
                  {whatsapp}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Chat with AEOS Support on WhatsApp
                </p>
              </div>
            </a>
          )}

          {email && (
            <a
              href={`mailto:${email}`}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#03162F]/20 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#03162F]">
                <Mail className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Email
                </p>

                <p className="mt-1 break-all text-base font-bold text-[#03162F]">
                  {email}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Send an email to AEOS Support
                </p>
              </div>
            </a>
          )}
        </div>

        {!phone && !whatsappNumber && !email && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="font-semibold text-[#03162F]">
              Support contacts are currently unavailable.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Please try again later.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
