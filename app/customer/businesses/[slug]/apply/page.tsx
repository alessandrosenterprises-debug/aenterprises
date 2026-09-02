import Link from "next/link";
import { ArrowLeft, FileText, Landmark } from "lucide-react";

import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCustomerLoanProducts,
  getLoanProductTerms,
} from "@/modules/loans/services/loan-products.service";

import CustomerLoanApplicationForm from "./CustomerLoanApplicationForm";

interface ApplyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CustomerLoanApplyPage({
  params,
}: ApplyPageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      slug,
      description,
      logo_url,
      active
    `)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (businessError) {
    console.error("Loan application business error:", businessError);
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
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#08264D]"
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

        <div className="mx-auto w-full max-w-[720px] px-5 py-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#03162F] text-[#D4AF37]">
              <FileText className="h-7 w-7" />
            </div>

            <h1 className="mt-4 text-xl font-black text-[#03162F]">
              Applications Not Available
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Online loan applications are currently available through
              Alessandro Soft Loans.
            </p>

            <Link
              href={`/customer/businesses/${business.slug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-bold text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Business
            </Link>
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
        ...product,
        terms,
      };
    }),
  );

  /*
   * Collateral catalogue
   *
   * We deliberately use the existing collateral_catalogue table.
   * "None" is a customer UI option and is NOT inserted into the table.
   */
  const adminSupabase = createAdminClient();

  const { data: collateralData, error: collateralError } =
    await adminSupabase
      .from("collateral_catalogue")
      .select(`
        id,
        name,
        description,
        active
      `)
      .eq("active", true)
      .order("name", { ascending: true });

  if (collateralError) {
    console.error(
      "Customer collateral catalogue error:",
      collateralError,
    );
  }

  const collaterals = (collateralData ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
  }));

  return (
    <main className="min-h-screen bg-slate-50 pb-[92px]">
      <CustomerNavigation />

      <div className="mx-auto w-full max-w-[720px]">
        <section className="bg-[#03162F] px-5 pb-7 pt-5 text-white">
          <Link
            href={`/customer/businesses/${business.slug}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 transition hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Soft Loans
          </Link>

          <div className="mt-6 flex items-center gap-4">
            {business.logo_url ? (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
                <img
                  src={business.logo_url}
                  alt={`${business.name} logo`}
                  className="h-full w-full object-contain p-2"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#D4AF37]">
                <Landmark className="h-7 w-7" />
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                Alessandro Soft Loans
              </p>

              <h1 className="mt-1 text-2xl font-black">
                Apply For A Loan
              </h1>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-300">
            Complete the application below. Your application will be reviewed
            by the Alessandro Soft Loans team before any loan is approved.
          </p>
        </section>

        <section className="px-5 py-6">
          <CustomerLoanApplicationForm
            businessSlug={business.slug}
            products={productsWithTerms}
            collaterals={collaterals}
          />
        </section>
      </div>
    </main>
  );
}