import CustomerThemeProvider from "@/components/customer/CustomerThemeProvider";
import CustomerManagedCatalogRealtime from "@/components/customer/CustomerManagedCatalogRealtime";

export const dynamic = "force-dynamic";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CustomerThemeProvider appearance="system">
      <CustomerManagedCatalogRealtime />
      {children}
    </CustomerThemeProvider>
  );
}
