import { ReactNode } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import PageTransition from "./PageTransition";
import FloatingLiveChat from "@/components/shared/FloatingLiveChat";
interface AppLayoutProps {
  children: ReactNode;
  permissionKeys: string[];
  isSuperAdministrator: boolean;
  accessControlEnabled: boolean;
}

export default function AppLayout({
  children,
  permissionKeys,
  isSuperAdministrator,
  accessControlEnabled,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen min-w-0 flex-col overflow-hidden bg-[var(--background)]">
      {/* =====================================================
          GLOBAL HEADER
          Full width — owns branding, search and account area
      ===================================================== */}

      <Header permissionKeys={permissionKeys} />

      {/* =====================================================
          BODY
          Sidebar starts underneath the header
      ===================================================== */}

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <Sidebar permissionKeys={permissionKeys} isSuperAdministrator={isSuperAdministrator} accessControlEnabled={accessControlEnabled} />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-6">
  <PageTransition>
    {children}
  </PageTransition>
</main>

          <Footer />
        </div>
      </div>
      <FloatingLiveChat role="staff" />
    </div>
  );
}
