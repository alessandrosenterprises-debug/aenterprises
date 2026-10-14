import CustomerThemeProvider from "@/components/customer/CustomerThemeProvider";
import CustomerManagedCatalogRealtime from "@/components/customer/CustomerManagedCatalogRealtime";
import CustomerLayoutNavigation from "@/components/customer/CustomerLayoutNavigation";

export const dynamic = "force-dynamic";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CustomerThemeProvider appearance="system">
      <CustomerLayoutNavigation />
      <CustomerManagedCatalogRealtime />
      {children}
    </CustomerThemeProvider>
  );
}
