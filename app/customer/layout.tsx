import CustomerThemeProvider from "@/components/customer/CustomerThemeProvider";
import { getCustomerPreferences } from "@/modules/customers/services/customer-preferences.service";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let appearance: "system" | "light" | "dark" = "system";

  try {
    const preferences = await getCustomerPreferences();

    if (
      preferences.appearance === "light" ||
      preferences.appearance === "dark" ||
      preferences.appearance === "system"
    ) {
      appearance = preferences.appearance;
    }
  } catch (error) {
    console.error("Customer preferences unavailable:", error);
  }

  return (
    <CustomerThemeProvider appearance={appearance}>
      {children}
    </CustomerThemeProvider>
  );
}