import CustomerNavigation from "@/components/customer/CustomerNavigation";
import {
  getAuthenticatedCustomerId,
  getCustomerEmailById,
} from "@/modules/emails/services/customer-email.service";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import CustomerEmailCompose from "./CustomerEmailCompose";

export const dynamic = "force-dynamic";

export default async function CustomerEmailComposePage({
  searchParams,
}: {
  searchParams: Promise<{ replyTo?: string }>;
}) {
  const params = await searchParams;

  const customerId = await getAuthenticatedCustomerId();

  if (!customerId) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <CustomerNavigation />

        <main className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-[#03162F]">
              Customer account not found
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              We could not connect this account to a customer record.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const replyEmail = params.replyTo
    ? await getCustomerEmailById(params.replyTo)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <CustomerNavigation />

      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={
            replyEmail
              ? `/customer/emails/${replyEmail.id}`
              : "/customer/emails"
          }
          className="mb-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#03162F] shadow-sm ring-1 ring-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <CustomerEmailCompose
          customerId={customerId}
          replyEmail={replyEmail}
        />
      </main>
    </div>
  );
}