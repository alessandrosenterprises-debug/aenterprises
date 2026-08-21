import { createClient } from "@/lib/supabase/server";

import type {
  PayrollPeriod,
} from "@/modules/payroll/types/payroll.types";

export async function getPayrollPeriods(): Promise<
  PayrollPeriod[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hr_payroll_periods")
    .select("*")
    .order("period_start", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Payroll periods loading error:",
      JSON.stringify(error, null, 2)
    );

    return [];
  }

  return (data ?? []) as PayrollPeriod[];
}