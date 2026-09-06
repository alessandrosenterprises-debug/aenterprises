import CustomerThemeProvider from "@/components/customer/CustomerThemeProvider";
import { getCustomerPreferences } from "@/modules/customers/services/customer-preferences.service";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const preferences = await getCustomerPreferences();

  return (
    <CustomerThemeProvider appearance={preferences.appearance}>
      {children}
    </CustomerThemeProvider>
  );
}