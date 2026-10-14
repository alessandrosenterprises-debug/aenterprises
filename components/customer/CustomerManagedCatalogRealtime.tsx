"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

/** Refresh server-rendered catalogue screens when admins publish catalogue changes. */
export default function CustomerManagedCatalogRealtime() {
  const router = useRouter();
  useEffect(() => {
    const channel = supabase.channel("customer-managed-catalog-refresh")
      .on("postgres_changes", { event: "*", schema: "public", table: "enterprise_catalog" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "mobile_money_services" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "loan_products" }, () => router.refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [router]);
  return null;
}
