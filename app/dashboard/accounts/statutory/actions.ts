"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Authority = "NAPSA" | "NHIMA" | "PAYE";
type PayrollEntry = {
  employee_id: string;
  basic_salary: number | string | null;
  gross_pay: number | string | null;
  taxable_pay: number | string | null;
  total_tax: number | string | null;
  deductions?: { deduction_type: string; amount: number | string | null }[] | null;
};

async function accountsClient(permission: "accounts.view" | "accounts.payroll" = "accounts.view") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: allowed, error } = await supabase.rpc("has_permission", { required_permission: permission });
  if (error || !allowed) redirect("/dashboard/access-denied");
  return supabase;
}

export async function getAccountsStatutoryData() {
  const supabase = await accountsClient();
  const [scheduleResult, rulesResult] = await Promise.all([
    supabase.from("accounts_statutory_schedules")
      .select("id,payroll_run_id,payroll_period_id,authority,period_name,period_end,due_date,employee_amount,employer_amount,total_amount,status,filing_reference,payment_reference,filed_at,paid_at,created_at")
      .order("due_date", { ascending: false }),
    supabase.from("hr_payroll_rules")
      .select("code,employee_rate,employer_rate,configuration,effective_from,effective_to,active")
      .in("code", ["NAPSA", "NHIMA", "PAYE"]),
  ]);
  if (scheduleResult.error) throw new Error("The statutory remittance register is not available yet. Apply database migration 048 and refresh this page.");
  if (rulesResult.error) throw new Error("Payroll statutory rules could not be loaded. Check that payroll migration 010 is installed.");

  const scheduleIds = (scheduleResult.data ?? []).map((row) => row.id);
  const lineResult = scheduleIds.length
    ? await supabase.from("accounts_statutory_schedule_lines")
      .select("id,schedule_id,employee_id,napsa_number,nhima_number,employee_amount,employer_amount,employee:employees!accounts_statutory_schedule_lines_employee_id_fkey(id,full_name)")
      .in("schedule_id", scheduleIds)
    : { data: [], error: null };
  if (lineResult.error) throw new Error("Employee-level statutory schedule lines could not be loaded.");

  const { data: canManage } = await supabase.rpc("has_permission", { required_permission: "accounts.payroll" });
  return {
    schedules: scheduleResult.data ?? [],
    lines: lineResult.data ?? [],
    rules: rulesResult.data ?? [],
    canManage: Boolean(canManage),
  };
}

function nextMonthTenth(periodEnd: string) {
  const [year, month] = periodEnd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month, 10));
  return date.toISOString().slice(0, 10);
}

function cents(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100; }

export async function generateStatutorySchedules() {
  const supabase = await accountsClient("accounts.payroll");
  const [runsResult, rulesResult] = await Promise.all([
    supabase.from("hr_payroll_runs")
      .select("id,payroll_period_id,status")
      .in("status", ["Finalized", "Paid"]),
    supabase.from("hr_payroll_rules")
      .select("code,employee_rate,employer_rate,configuration,active,effective_from,effective_to")
      .in("code", ["NAPSA", "NHIMA"]),
  ]);
  if (runsResult.error) throw new Error("Finalized payroll runs could not be read. Check payroll access and try again.");
  if (rulesResult.error) throw new Error("NAPSA and NHIMA payroll rules could not be read.");
  const runs = runsResult.data ?? [];
  if (!runs.length) throw new Error("Finalize or mark a payroll run as paid before generating statutory schedules.");

  const runIds = runs.map((run) => run.id);
  const periodIds = [...new Set(runs.map((run) => run.payroll_period_id))];
  const [periodsResult, entriesResult] = await Promise.all([
    supabase.from("hr_payroll_periods").select("id,name,period_end").in("id", periodIds),
    supabase.from("hr_payroll_entries")
      .select("id,payroll_run_id,employee_id,basic_salary,gross_pay,taxable_pay,total_tax,deductions:hr_payroll_deductions(deduction_type,amount)")
      .in("payroll_run_id", runIds)
      .not("status", "eq", "Cancelled"),
  ]);
  if (periodsResult.error || entriesResult.error) throw new Error("Payroll periods or employee payroll details could not be loaded.");
  const periods = new Map((periodsResult.data ?? []).map((period) => [period.id, period]));
  const entriesByRun = new Map<string, PayrollEntry[]>();
  for (const raw of entriesResult.data ?? []) {
    const entry = raw as unknown as PayrollEntry & { payroll_run_id: string };
    entriesByRun.set(entry.payroll_run_id, [...(entriesByRun.get(entry.payroll_run_id) ?? []), entry]);
  }
  const employeeIds = [...new Set((entriesResult.data ?? []).map((entry) => entry.employee_id))];
  const [employeesResult, settingsResult, existingResult] = await Promise.all([
    employeeIds.length ? supabase.from("employees").select("id,full_name").in("id", employeeIds) : Promise.resolve({ data: [], error: null }),
    employeeIds.length ? supabase.from("hr_employee_payroll_settings").select("employee_id,napsa_number,nhima_number").in("employee_id", employeeIds) : Promise.resolve({ data: [], error: null }),
    supabase.from("accounts_statutory_schedules").select("id,payroll_run_id,authority,status"),
  ]);
  if (employeesResult.error || settingsResult.error || existingResult.error) throw new Error("Employee statutory IDs or existing schedules could not be checked.");
  const employeeNames = new Map((employeesResult.data ?? []).map((employee) => [employee.id, employee.full_name]));
  const employeeSettings = new Map((settingsResult.data ?? []).map((setting) => [setting.employee_id, setting]));
  const existing = new Map((existingResult.data ?? []).map((schedule) => [`${schedule.payroll_run_id}:${schedule.authority}`, schedule]));
  const rules = new Map((rulesResult.data ?? []).map((rule) => [rule.code, rule]));
  let saved = 0;
  let protectedExisting = 0;

  for (const run of runs) {
    const period = periods.get(run.payroll_period_id);
    if (!period) continue;
    const entries = entriesByRun.get(run.id) ?? [];
    if (!entries.length) continue;
    const authorities: Authority[] = ["NAPSA", "NHIMA", "PAYE"];
    for (const authority of authorities) {
      const present = existing.get(`${run.id}:${authority}`);
      if (present && present.status !== "draft") { protectedExisting += 1; continue; }
      const rateRule = rules.get(authority);
      const config = (rateRule?.configuration ?? {}) as Record<string, unknown>;
      const ceiling = authority === "NAPSA" ? Number(config.monthly_earnings_ceiling ?? 0) : 0;
      const employeeRate = Number(rateRule?.employee_rate ?? 0);
      const employerRate = Number(rateRule?.employer_rate ?? 0);
      const lines = entries.map((entry) => {
        const deductions = entry.deductions ?? [];
        const matching = deductions.filter((deduction) => deduction.deduction_type.toUpperCase() === authority);
        const deductionTotal = matching.reduce((sum, deduction) => sum + Number(deduction.amount ?? 0), 0);
        const base = authority === "NHIMA" ? Number(entry.gross_pay ?? 0) : Number(entry.gross_pay ?? 0);
        const employeeAmount = authority === "PAYE"
          ? cents(deductionTotal || Number(entry.total_tax ?? 0))
          : cents(matching.length ? deductionTotal : Math.min(base, ceiling || base) * employeeRate / 100);
        const employerBase = authority === "NHIMA" ? Number(entry.basic_salary ?? 0) : Math.min(Number(entry.gross_pay ?? 0), ceiling || Number(entry.gross_pay ?? 0));
        const employerAmount = authority === "PAYE" ? 0 : cents(employerBase * employerRate / 100);
        const settings = employeeSettings.get(entry.employee_id);
        return {
          employee_id: entry.employee_id,
          napsa_number: settings?.napsa_number ?? null,
          nhima_number: settings?.nhima_number ?? null,
          employee_amount: employeeAmount,
          employer_amount: employerAmount,
        };
      });
      const employeeAmount = cents(lines.reduce((sum, line) => sum + line.employee_amount, 0));
      const employerAmount = cents(lines.reduce((sum, line) => sum + line.employer_amount, 0));
      const { error } = await supabase.rpc("save_accounts_statutory_schedule", {
        p_schedule: {
          payroll_run_id: run.id,
          payroll_period_id: period.id,
          authority,
          period_name: period.name,
          period_end: period.period_end,
          due_date: nextMonthTenth(period.period_end),
          employee_amount: employeeAmount,
          employer_amount: employerAmount,
        },
        p_lines: lines,
      });
      if (error) {
        console.error("Statutory schedule generation failed", { code: error.code, message: error.message });
        throw new Error(`A ${authority} remittance schedule could not be saved. Refresh the page; no payment has been made.`);
      }
      saved += present ? 0 : 1;
    }
  }
  return { saved, protectedExisting };
}

export async function markStatutoryFiled(scheduleId: string, filingReference: string) {
  const supabase = await accountsClient("accounts.payroll");
  const reference = filingReference.trim();
  if (!scheduleId || reference.length < 2) throw new Error("Enter the authority filing or return reference before saving.");
  const { error } = await supabase.rpc("advance_accounts_statutory_schedule", {
    p_schedule_id: scheduleId, p_next_status: "filed", p_filing_reference: reference, p_payment_reference: null,
  });
  if (error) throw new Error(error.message.includes("permission") ? "Your role cannot file statutory schedules." : "The filing status could not be saved. Check the schedule and try again.");
  return { success: true };
}

export async function markStatutoryPaid(scheduleId: string, paymentReference: string) {
  const supabase = await accountsClient("accounts.payroll");
  const reference = paymentReference.trim();
  if (!scheduleId || reference.length < 2) throw new Error("Enter the payment confirmation or transaction reference before saving.");
  const { error } = await supabase.rpc("advance_accounts_statutory_schedule", {
    p_schedule_id: scheduleId, p_next_status: "paid", p_filing_reference: null, p_payment_reference: reference,
  });
  if (error) throw new Error(error.message.includes("permission") ? "Your role cannot confirm statutory payments." : "The payment confirmation could not be saved. Make sure the return is marked filed first.");
  return { success: true };
}
