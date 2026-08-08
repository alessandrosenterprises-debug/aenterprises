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

  if (!user) {
    redirect("/login");
  }

  return <AppLayout>{children}</AppLayout>;
}