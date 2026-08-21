import { createClient } from "@/lib/supabase/server";

import type {
  EmployeePayrollSettings,
} from "@/modules/payroll/types/payroll.types";

export async function getEmployeePayrollSettings(): Promise<
  EmployeePayrollSettings[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hr_employee_payroll_settings")
    .select(`
      *,
      employees (
        id,
        full_name,
        phone,
        position,
        salary,
        business_id
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Employee payroll settings loading error:",
      JSON.stringify(error, null, 2)
    );

    return [];
  }

  return (data ?? []) as unknown as EmployeePayrollSettings[];
}