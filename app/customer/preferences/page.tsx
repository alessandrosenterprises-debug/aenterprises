import CustomerNavigation from "@/components/customer/CustomerNavigation";
import CustomerThemeProvider from "@/components/customer/CustomerThemeProvider";
import { getCustomerPreferences } from "@/modules/customers/services/customer-preferences.service";
import PreferencesClient from "./PreferencesClient";

export const dynamic = "force-dynamic";

export default async function CustomerPreferencesPage() {
  const preferences = await getCustomerPreferences();

  return (
    <CustomerThemeProvider appearance={preferences.appearance}>
      <div className="min-h-screen bg-slate-50 pb-24 dark:bg-slate-950">
        <CustomerNavigation />

        <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4AF37]">
              Account
            </p>

            <h1 className="mt-1 text-2xl font-bold text-[#03162F] dark:text-white sm:text-3xl">
              Preferences
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Manage how Alessandro Enterprises communicates with you and how
              your customer experience works.
            </p>
          </div>

          <PreferencesClient initialPreferences={preferences} />
        </main>
      </div>
    </CustomerThemeProvider>
  );
}