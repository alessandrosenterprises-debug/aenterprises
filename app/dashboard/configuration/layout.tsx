import { ReactNode } from "react";

import ConfigurationSidebar from "@/modules/configuration/components/ConfigurationSidebar";

export default function ConfigurationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex gap-6">

      <ConfigurationSidebar />

      <main className="min-w-0 flex-1">
        {children}
      </main>

    </div>
  );
}