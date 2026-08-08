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
          richColors
          closeButton
          duration={3000}
        />
      </body>
    </html>
  );
}