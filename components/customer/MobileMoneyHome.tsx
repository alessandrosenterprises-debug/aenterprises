"use client";

import { useState } from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  Clock3,
  History,
  Info,
  Landmark,
  Phone,
  ReceiptText,
  Send,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";

interface Business {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  image_url?: string | null;
}

interface MobileMoneyHomeProps {
  business: Business;
}

type MobileMoneyService = {
  title: string;
  description: string;
  icon: typeof Smartphone;
  key: string;
};

const mobileMoneyServices: MobileMoneyService[] = [
  {
    title: "Airtel Money",
    description:
      "Access Airtel Money services for sending, receiving, depositing and withdrawing funds.",
    icon: Smartphone,
    key: "airtel-money",
  },
  {
    title: "MTN Money",
    description:
      "Use MTN Money for convenient everyday mobile financial transactions.",
    icon: Smartphone,
    key: "mtn-money",
  },
  {
    title: "Zamtel Money",
    description:
      "Access Zamtel Money services for convenient mobile financial transactions.",
    icon: Smartphone,
    key: "zamtel-money",
  },
  {
    title: "Send Money",
    description:
      "Send money quickly and conveniently using the available mobile money networks.",
    icon: Send,
    key: "send-money",
  },
  {
    title: "Withdraw Cash",
    description:
      "Withdraw cash from your mobile money account with convenient customer assistance.",
    icon: ArrowUpFromLine,
    key: "withdraw",
  },
  {
    title: "Cash Deposit",
    description:
      "Deposit cash into your mobile money account quickly and securely.",
    icon: ArrowDownToLine,
    key: "cash-in",
  },
  {
    title: "Buy Airtime",
    description:
      "Purchase airtime conveniently using your preferred mobile money service.",
    icon: Smartphone,
    key: "airtime",
  },
  {
    title: "Pay Bills",
    description:
      "Make supported bill payments conveniently through mobile money.",
    icon: ReceiptText,
    key: "bills",
  },
];

const quickActions = [
  {
    title: "Cash In",
    description: "Deposit funds",
    key: "cash-in",
    icon: ArrowDownToLine,
  },
  {
    title: "Cash Out",
    description: "Withdraw funds",
    key: "withdraw",
    icon: ArrowUpFromLine,
  },
  {
    title: "Send Money",
    description: "Transfer funds",
    key: "send-money",
    icon: Send,
  },
  {
    title: "Airtime",
    description: "Buy airtime",
    key: "airtime",
    icon: Smartphone,
  },
];

export default function MobileMoneyHome({
  business,
}: MobileMoneyHomeProps) {
  const [selectedService, setSelectedService] =
    useState<MobileMoneyService | null>(null);

  const businessName =
    business.name || "Alessandro Mobile Money";

  const handleServiceClick = (serviceKey: string) => {
    const service = mobileMoneyServices.find(
      (item) => item.key === serviceKey,
    );

    if (!service) return;

    setSelectedService((current) =>
      current?.key === service.key ? null : service,
    );
  };

  return (
    <div className="mx-auto w-full max-w-[720px] overflow-hidden bg-slate-50">
     {/* HERO */}
<section className="relative overflow-hidden bg-[#03162F] px-5 pb-5 pt-4 text-white">
  <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#D4AF37]/10 blur-3xl" />
  <div className="absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

  <div className="relative">
    {/* Compact header */}
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
          Alessandro Enterprises
        </p>

        <p className="mt-0.5 text-[10px] text-slate-400">
          Financial services
        </p>
      </div>

      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10">
        <WalletCards className="h-4 w-4 text-[#D4AF37]" />
      </div>
    </div>

    {/* Main hero content */}
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-[#03162F]">
          <WalletCards className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-black leading-none tracking-tight">
            Mobile Money
          </h1>

          <p className="mt-1 text-[11px] leading-4 text-slate-400">
            Fast, secure & convenient transactions
          </p>
        </div>
      </div>

      {/* Compact service badges */}
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold text-slate-300">
          <ShieldCheck className="h-3 w-3 text-[#D4AF37]" />
          Secure
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold text-slate-300">
          <Clock3 className="h-3 w-3 text-[#D4AF37]" />
          Convenient
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold text-slate-300">
          <Smartphone className="h-3 w-3 text-[#D4AF37]" />
          Multiple networks
        </div>
      </div>
    </div>

    {/* Business identity — compact */}
    <div className="mt-4 flex items-center gap-2.5 border-t border-white/10 pt-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/15">
        <Landmark className="h-3.5 w-3.5 text-[#D4AF37]" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold text-white">
          {businessName}
        </p>

        <p className="truncate text-[9px] text-slate-500">
          Trusted mobile financial services
        </p>
      </div>
    </div>
  </div>
</section>

      {/* QUICK ACTIONS */}
      <section className="px-5 pt-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B08D1E]">
              Quick access
            </p>

            <h2 className="mt-1 text-lg font-black text-[#03162F]">
              What do you need?
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isSelected =
              selectedService?.key === action.key;

            return (
              <button
                key={action.key}
                type="button"
                onClick={() =>
                  handleServiceClick(action.key)
                }
                className={[
                  "group relative overflow-hidden rounded-2xl border p-4 text-left transition duration-200",
                  "active:scale-[0.98]",
                  isSelected
                    ? "border-[#D4AF37] bg-[#03162F] shadow-lg shadow-slate-300/40"
                    : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-[#D4AF37]/50 hover:shadow-md",
                ].join(" ")}
              >
                <div
                  className={[
                    "mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition",
                    isSelected
                      ? "bg-[#D4AF37] text-[#03162F]"
                      : "bg-[#03162F]/5 text-[#03162F] group-hover:bg-[#D4AF37]/15 group-hover:text-[#8A6D12]",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <p
                  className={[
                    "text-sm font-bold",
                    isSelected
                      ? "text-white"
                      : "text-[#03162F]",
                  ].join(" ")}
                >
                  {action.title}
                </p>

                <p
                  className={[
                    "mt-1 text-[11px]",
                    isSelected
                      ? "text-slate-400"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  {action.description}
                </p>

                <ChevronRight
                  className={[
                    "absolute right-3 top-3 h-4 w-4 transition",
                    isSelected
                      ? "text-[#D4AF37]"
                      : "text-slate-300 group-hover:text-[#B08D1E]",
                  ].join(" ")}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* SERVICES */}
      <section className="px-5 pb-8 pt-8">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B08D1E]">
            Services
          </p>

          <div className="mt-1 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#03162F]">
                Mobile money services
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Choose a service to view more information.
              </p>
            </div>

            <div className="hidden shrink-0 rounded-full bg-[#03162F]/5 px-3 py-1.5 text-[10px] font-bold text-[#03162F] sm:block">
              {mobileMoneyServices.length} services
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {mobileMoneyServices.map((service) => {
            const Icon = service.icon;
            const isSelected =
              selectedService?.key === service.key;

            return (
              <div key={service.key}>
                <button
                  type="button"
                  onClick={() =>
                    handleServiceClick(service.key)
                  }
                  className={[
                    "group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition duration-200",
                    "active:scale-[0.995]",
                    isSelected
                      ? "border-[#D4AF37] bg-[#03162F] shadow-md"
                      : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-[#D4AF37]/50 hover:shadow-md",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition",
                      isSelected
                        ? "bg-[#D4AF37] text-[#03162F]"
                        : "bg-slate-100 text-[#03162F] group-hover:bg-[#D4AF37]/15 group-hover:text-[#8A6D12]",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={[
                          "truncate text-sm font-bold",
                          isSelected
                            ? "text-white"
                            : "text-[#03162F]",
                        ].join(" ")}
                      >
                        {service.title}
                      </h3>

                      {isSelected && (
                        <span className="rounded-full bg-[#D4AF37]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#D4AF37]">
                          Selected
                        </span>
                      )}
                    </div>

                    <p
                      className={[
                        "mt-1 line-clamp-2 text-xs leading-5",
                        isSelected
                          ? "text-slate-400"
                          : "text-slate-500",
                      ].join(" ")}
                    >
                      {service.description}
                    </p>
                  </div>

                  <div
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition",
                      isSelected
                        ? "bg-white/10 text-[#D4AF37]"
                        : "bg-slate-50 text-slate-400 group-hover:bg-[#D4AF37]/10 group-hover:text-[#B08D1E]",
                    ].join(" ")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </button>

                {/* INLINE SELECTED SERVICE */}
                {isSelected && (
                  <div className="mt-2 rounded-2xl border border-[#D4AF37]/25 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                        <Info className="h-4 w-4 text-[#9A7915]" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#03162F]">
                          {service.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {service.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <ShieldCheck className="h-4 w-4 text-[#9A7915]" />

                        <p className="mt-2 text-[10px] font-bold text-[#03162F]">
                          Secure
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <Clock3 className="h-4 w-4 text-[#9A7915]" />

                        <p className="mt-2 text-[10px] font-bold text-[#03162F]">
                          Convenient
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <Phone className="h-4 w-4 text-[#9A7915]" />

                        <p className="mt-2 text-[10px] font-bold text-[#03162F]">
                          Assistance
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#08264D] active:scale-[0.99]"
                    >
                      Continue with {service.title}
                      <ChevronRight className="h-4 w-4 text-[#D4AF37]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedService(null)}
                      className="mt-2 w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[#03162F]"
                    >
                      Close details
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* TRUST INFORMATION */}
      <section className="px-5 pb-8">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B08D1E]">
            Why use our service
          </p>

          <h2 className="mt-1 text-xl font-black text-[#03162F]">
            Simple. Secure. Convenient.
          </h2>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#03162F]/5">
                <ShieldCheck className="h-5 w-5 text-[#03162F]" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#03162F]">
                  Safe & Secure
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  We focus on providing a secure and trusted
                  experience for your mobile money transactions.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                <Smartphone className="h-5 w-5 text-[#9A7915]" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#03162F]">
                  Multiple Networks
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Access services across supported mobile
                  money networks from one convenient location.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#03162F]/5">
                <History className="h-5 w-5 text-[#03162F]" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#03162F]">
                  Transactions & History
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Transaction details and history can be
                  connected to your customer account experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMPORTANT INFORMATION */}
      <section className="px-5 pb-10">
        <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15">
              <Info className="h-4 w-4 text-[#8A6D12]" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#03162F]">
                Important information
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Available services, transaction requirements,
                applicable charges and other details will be
                displayed as each service is connected to the
                customer transaction flow.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}