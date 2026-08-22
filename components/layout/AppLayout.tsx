import { ReactNode } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen min-w-0 flex-col overflow-hidden bg-[var(--background)]">
      {/* =====================================================
          GLOBAL HEADER
          Full width — owns branding, search and account area
      ===================================================== */}

      <Header />

      {/* =====================================================
          BODY
          Sidebar starts underneath the header
      ===================================================== */}

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-6">
            {children}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}