import { ReactNode } from "react";
import { redirect } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
   * No authenticated user.
   * Send them to the AEOS login page.
   */
  if (!user) {
    redirect("/login");
  }

  /*
   * Authenticated user:
   * allow access to AEOS.
   *
   * Customer accounts are handled separately
   * by the /customer routes and customer login.
   */
  return <AppLayout>{children}</AppLayout>;
}