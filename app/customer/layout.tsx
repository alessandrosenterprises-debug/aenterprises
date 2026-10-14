import CustomerThemeProvider from "@/components/customer/CustomerThemeProvider";

export const dynamic = "force-dynamic";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CustomerThemeProvider appearance="system">
      {children}
    </CustomerThemeProvider>
  );
}
