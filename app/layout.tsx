import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Alessandro Enterprise Platform",
  description: "Enterprise Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}

        <Toaster
          position="top-right"
          theme="light"
          richColors
          closeButton
          duration={4000}
          visibleToasts={3}
          offset={{ top: 92, right: 18 }}
          mobileOffset={{ top: "calc(env(safe-area-inset-top, 0px) + 82px)", left: 12, right: 12 }}
          toastOptions={{ closeButton: true, closeButtonAriaLabel: "Dismiss notification" }}
        />
      </body>
    </html>
  );
}
