import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  Clock3,
  HandCoins,
  ShieldCheck,
  UserRound,
  Zap,
} from "lucide-react";

import CustomerNavigation from "@/components/customer/CustomerNavigation";

type LoanProduct = {
  id: string;
  name: string;
  description: string | null;
  min_amount: number | string | null;
  max_amount: number | string | null;
  interest_rate: number | string | null;
  repayment_period: number | string | null;
  requires_collateral: boolean;
  status: string;
};

function formatZMW(value: number | string | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return `K${amount.toLocaleString("en-ZM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function classifyLoan(name: string) {
  const value = name.toLowerCase();

  if (
    value.includes("business") ||
    value.includes("enterprise") ||
    value.includes("commercial")
  ) {
    return "business";
  }

  if (
    value.includes("emergency") ||
    value.includes("urgent")
  ) {
    return "emergency";
  }

  return "personal";
}

function getCategoryInfo(category: string) {
  switch (category) {
    case "business":
      return {
        title: "Business Loans",
        eyebrow: "For Your Business",
        description:
          "Funding support to help you grow, operate or take advantage of business opportunities.",
        icon: BriefcaseBusiness,
      };

    case "emergency":
      return {
        title: "Emergency Loans",
        eyebrow: "When You Need Help Fast",
        description:
          "Financial assistance for unexpected and urgent personal expenses.",
        icon: Zap,
      };

    default:
      return {
        title: "Personal Loans",
        eyebrow: "For Your Personal Needs",
        description:
          "Flexible financial support for everyday personal needs and planned expenses.",
        icon: UserRound,
      };
  }
}

export default async function SoftLoansServicesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: business, error: businessError } =
    await supabase
      .from("businesses")
      .select(
        "id, name, slug, description, logo_url, active"
      )
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

  if (businessError || !business) {
    return (
      <main className="min-h-screen bg-slate-50">
        <CustomerNavigation />

        <div className="mx-auto max-w-xl px-5 py-20 text-center">
          <h1 className="text-2xl font-black text-[#03162F]">
            Business Not Found
          </h1>

          <Link
            href="/customer/businesses"
            className="mt-5 inline-flex rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white"
          >
            Back to Businesses
          </Link>
        </div>
      </main>
    );
  }

  const isSoftLoans =
    slug === "soft-loans" ||
    business.name.toLowerCase().includes("soft loans");

  if (!isSoftLoans) {
    return (
      <main className="min-h-screen bg-slate-50">
        <CustomerNavigation />

        <div className="mx-auto max-w-xl px-5 py-20 text-center">
          <h1 className="text-2xl font-black text-[#03162F]">
            Services Not Available
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Loan services are available through Alessandro
            Soft Loans.
          </p>
        </div>
      </main>
    );
  }

  const { data: products, error: productsError } =
    await supabase
      .from("loan_products")
      .select(`
        id,
        name,
        description,
        min_amount,
        max_amount,
        interest_rate,
        repayment_period,
        requires_collateral,
        status
      `)
      .eq("status", "Active")
      .order("name", {
        ascending: true,
      });

  if (productsError) {
    console.error(
      "Soft Loans products loading error:",
      productsError
    );
  }

  const activeProducts = (products ??
    []) as LoanProduct[];

  const grouped = {
    personal: activeProducts.filter(
      (product) =>
        classifyLoan(product.name) === "personal"
    ),
    business: activeProducts.filter(
      (product) =>
        classifyLoan(product.name) === "business"
    ),
    emergency: activeProducts.filter(
      (product) =>
        classifyLoan(product.name) === "emergency"
    ),
  };

  const categories = [
    "personal",
    "business",
    "emergency",
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50 pb-28 text-[#03162F]">
      <CustomerNavigation />

      {/* HEADER */}
      <section className="overflow-hidden bg-[#03162F] text-white">
        <div className="mx-auto max-w-5xl px-4 pb-8 pt-5 sm:px-6">
          <Link
            href={`/customer/businesses/${slug}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 transition hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Soft Loans
          </Link>

          <div className="mt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
              Alessandro Soft Loans
            </p>

            <h1 className="mt-1 text-3xl font-black sm:text-4xl">
              Loan Services
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Choose the type of financial support that
              best fits your needs.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        {categories.map((category) => {
          const info = getCategoryInfo(category);
          const Icon = info.icon;
          const productsForCategory =
            grouped[category];

          return (
            <section
              key={category}
              className="mb-8"
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-[#03162F]">
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                    {info.eyebrow}
                  </p>

                  <h2 className="mt-0.5 text-xl font-black">
                    {info.title}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {info.description}
                  </p>
                </div>
              </div>

              {productsForCategory.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {productsForCategory.map(
                    (product) => (
                      <div
                        key={product.id}
                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]">
                            <HandCoins className="h-5 w-5" />
                          </div>

                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                            Available
                          </span>
                        </div>

                        <h3 className="mt-4 text-lg font-black">
                          {product.name}
                        </h3>

                        {product.description && (
                          <p className="mt-1.5 text-xs leading-5 text-slate-500">
                            {product.description}
                          </p>
                        )}

                        <div className="mt-5 grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              From
                            </p>

                            <p className="mt-1 text-sm font-black">
                              {formatZMW(
                                product.min_amount
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              Up to
                            </p>

                            <p className="mt-1 text-sm font-black">
                              {formatZMW(
                                product.max_amount
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              Interest
                            </p>

                            <p className="mt-1 text-sm font-black">
                              {product.interest_rate !=
                              null
                                ? `${product.interest_rate}%`
                                : "—"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              Period
                            </p>

                            <p className="mt-1 text-sm font-black">
                              {product.repayment_period !=
                              null
                                ? `${product.repayment_period} days`
                                : "—"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
                          <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />

                          {product.requires_collateral
                            ? "Collateral required"
                            : "No collateral required"}
                        </div>

                        <Link
                          href={`/customer/businesses/${slug}/apply`}
                          className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#03162F] px-4 py-3 text-xs font-black text-white transition hover:bg-[#08254a]"
                        >
                          Apply For This Loan
                        </Link>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
                  <Icon className="mx-auto h-7 w-7 text-slate-300" />

                  <p className="mt-2 text-sm font-bold text-slate-600">
                    No {info.title.toLowerCase()} available
                    yet
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    New loan products will appear here
                    when they are activated.
                  </p>
                </div>
              )}
            </section>
          );
        })}

        {activeProducts.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Banknote className="mx-auto h-10 w-10 text-slate-300" />

            <h2 className="mt-4 text-lg font-black">
              Loan products coming soon
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Alessandro Soft Loans has not activated any
              loan products yet.
            </p>
          </div>
        )}

        <div className="mb-8 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" />

            <div>
              <p className="text-xs font-black">
                Loan information
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Loan amounts, interest rates, repayment
                periods and collateral requirements are
                controlled by Alessandro Soft Loans.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}