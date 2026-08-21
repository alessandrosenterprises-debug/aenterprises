import { supabase } from "@/lib/supabase/client";

import type {
  PayrollPeriodInput,
} from "@/modules/payroll/types/payroll.types";

export async function createPayrollPeriod(
  data: PayrollPeriodInput
) {
  const { data: period, error } = await supabase
    .from("hr_payroll_periods")
    .insert({
      name: data.name.trim(),

      period_start: data.period_start,

      period_end: data.period_end,

      payment_date:
        data.payment_date || null,

      status:
        data.status || "Draft",

      notes:
        data.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Payroll period create error:",
      error
    );

    throw new Error(error.message);
  }

  return period;
}

export async function updatePayrollPeriod(
  id: string,
  data: PayrollPeriodInput
) {
  const { data: period, error } = await supabase
    .from("hr_payroll_periods")
    .update({
      name: data.name.trim(),

      period_start: data.period_start,

      period_end: data.period_end,

      payment_date:
        data.payment_date || null,

      status:
        data.status || "Draft",

      notes:
        data.notes?.trim() || null,

      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Payroll period update error:",
      error
    );

    throw new Error(error.message);
  }

  return period;
}

export async function deletePayrollPeriod(
  id: string
) {
  const { data, error } = await supabase
    .from("hr_payroll_periods")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Payroll period delete error:",
      error
    );

    throw new Error(error.message);
  }

  return data;
}