import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import CustomerNavigation from "@/components/customer/CustomerNavigation";
import {
  getCustomerLoanProducts,
  getLoanProductTerms,
} from "@/modules/loans/services/loan-products.service";

interface ProductsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function formatZMW(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return `K${Number(value).toLocaleString("en-ZM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function CustomerLoanProductsPage({
  params,
}: ProductsPageProps) {
  const { slug } = await params;

  const isSoftLoans =
    slug.toLowerCase() === "soft-loans" ||
    slug.toLowerCase().includes("soft-loan");

  if (!isSoftLoans) {
    return (
      <main className="min-h-screen bg-[#071426] text-white">
        <CustomerNavigation />

        <div className="mx-auto max-w-5xl px-4 pb-28 pt-8">
          <Link
            href={`/customer/businesses/${slug}`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to business
          </Link>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="mt-2 text-sm text-white/60">
              Products for this business are not configured yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const products = await getCustomerLoanProducts();

  const productsWithTerms = await Promise.all(
    products.map(async (product) => {
      const terms = await getLoanProductTerms(product.id);

      return {
        product,
        terms,
      };
    })
  );

  return (
    <main className="min-h-screen bg-[#071426] text-white">
      <CustomerNavigation />

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href={`/customer/businesses/${slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Alessandro Soft Loans
        </Link>

        {/* Header */}
        <section className="mb-8 overflow-hidden rounded-3xl border border-[#d4af37]/20 bg-gradient-to-br from-[#102442] via-[#0b1b32] to-[#071426] p-6 shadow-2xl sm:p-8">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#e5c65a]">
              <Banknote className="h-4 w-4" />
              Alessandro Soft Loans
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Loan Products
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
              Choose a loan product that suits your needs. Available amounts
              and repayment terms are based on the current Soft Loans
              configuration.
            </p>
          </div>
        </section>

        {/* Products */}
        {productsWithTerms.length === 0 ? (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <Banknote className="mx-auto h-10 w-10 text-[#d4af37]" />

            <h2 className="mt-4 text-xl font-bold">
              No loan products available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/55">
              There are currently no active loan products available for
              applications.
            </p>
          </section>
        ) : (
          <section className="grid gap-5 md:grid-cols-2">
            {productsWithTerms.map(({ product, terms }) => {
              const minAmount = formatZMW(product.min_amount);
              const maxAmount = formatZMW(product.max_amount);

              return (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] shadow-xl transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/35 hover:bg-white/[0.06]"
                >
                  {/* Product header */}
                  <div className="border-b border-white/10 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#e5c65a]">
                          <Banknote className="h-5 w-5" />
                        </div>

                        <h2 className="text-xl font-bold">
                          {product.name}
                        </h2>
                      </div>

                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Available
                      </span>
                    </div>

                    {product.description && (
                      <p className="mt-4 text-sm leading-6 text-white/60">
                        {product.description}
                      </p>
                    )}

                    {/* Amount */}
                    {(minAmount || maxAmount) && (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                          Loan amount
                        </p>

                        <p className="mt-1 text-lg font-bold text-[#e5c65a]">
                          {minAmount && maxAmount
                            ? `${minAmount} – ${maxAmount}`
                            : minAmount
                              ? `From ${minAmount}`
                              : `Up to ${maxAmount}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Terms */}
                  <div className="p-5 sm:p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[#d4af37]" />

                      <h3 className="text-sm font-semibold">
                        Repayment options
                      </h3>
                    </div>

                    {terms.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {terms.map((term) => (
                          <div
                            key={term.id}
                            className="rounded-2xl border border-white/10 bg-[#071426]/70 p-3"
                          >
                            <p className="text-lg font-bold">
                              {term.period_days}
                            </p>

                            <p className="text-xs text-white/45">
                              {term.period_days === 1
                                ? "day"
                                : "days"}
                            </p>

                            <div className="mt-2 border-t border-white/10 pt-2">
                              <p className="text-sm font-semibold text-[#e5c65a]">
                                {Number(term.interest_rate)}%
                              </p>

                              <p className="text-[11px] text-white/40">
                                interest
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-amber-400/10 bg-amber-400/5 p-4">
                        <p className="text-sm text-white/60">
                          Repayment terms are currently being configured.
                        </p>
                      </div>
                    )}

                    {/* Collateral */}
                    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-[#d4af37]" />

                      <div>
                        <p className="text-sm font-semibold">
                          Collateral
                        </p>

                        <p className="mt-0.5 text-xs text-white/45">
                          {product.requires_collateral
                            ? "Required for this loan product"
                            : "Not required for this loan product"}
                        </p>
                      </div>
                    </div>

                    {/* Apply */}
                    <Link
                      href={`/customer/businesses/${slug}/products/${product.id}/apply`}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d4af37] px-5 py-3.5 text-sm font-bold text-[#071426] transition hover:bg-[#e5c65a] active:scale-[0.98]"
                    >
                      Apply for this loan
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}