import { createClient } from "@/lib/supabase/server";

export interface PrintablePayslip {
  entryId: string;
  payslipNumber: string;
  status: string;
  employee: Record<string, unknown>;
  period: Record<string, unknown>;
  run: Record<string, unknown>;
  entry: Record<string, unknown>;
  business: Record<string, unknown> | null;
  branch: Record<string, unknown> | null;
  department: Record<string, unknown> | null;
  allowances: Record<string, unknown>[];
  deductions: Record<string, unknown>[];
  existingPayslip: Record<string, unknown> | null;
}

type Row = Record<string, unknown>;

async function assertPayrollAccess() {
  const supabase = await createClient();
  const [{ data: userResult }, { data: hrAllowed, error: hrError }, { data: accountsAllowed, error: accountsError }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("has_permission", { required_permission: "hr.manage" }),
    supabase.rpc("has_permission", { required_permission: "accounts.payroll" }),
  ]);
  if (!userResult.user) throw new Error("Sign in with an AEOS staff account to access payroll payslips.");
  if (hrError && accountsError) throw new Error("Payroll access could not be checked. Refresh and try again.");
  if (!hrAllowed && !accountsAllowed) throw new Error("Your staff role does not have permission to view payroll payslips.");
  return supabase;
}

async function loadPayslipRows(entryId?: string) {
  const supabase = await assertPayrollAccess();
  const runsResult = await supabase
    .from("hr_payroll_runs")
    .select("*")
    .in("status", ["Finalized", "Paid"])
    .order("created_at", { ascending: false });
  if (runsResult.error) throw new Error(`Finalized payroll runs could not be loaded: ${runsResult.error.message}`);
  const runs = (runsResult.data ?? []) as Row[];
  if (!runs.length) return [] as PrintablePayslip[];

  const runIds = runs.map((run) => run.id as string);
  let entriesQuery = supabase
    .from("hr_payroll_entries")
    .select("*")
    .in("payroll_run_id", runIds)
    .in("status", ["Approved", "Paid"])
    .order("created_at", { ascending: false });
  if (entryId) entriesQuery = entriesQuery.eq("id", entryId);
  const entriesResult = await entriesQuery;
  if (entriesResult.error) throw new Error(`Approved payroll entries could not be loaded: ${entriesResult.error.message}`);
  const entries = (entriesResult.data ?? []) as Row[];
  if (!entries.length) return [] as PrintablePayslip[];

  const runById = new Map(runs.map((run) => [run.id as string, run]));
  const ids = (key: string) => [...new Set(entries.map((entry) => entry[key] as string | null).filter((id): id is string => Boolean(id)))];
  const employeeIds = ids("employee_id");
  const periodIds = [...new Set(entries.map((entry) => runById.get(String(entry.payroll_run_id))?.payroll_period_id as string | undefined).filter((id): id is string => Boolean(id)))];
  const businessIds = ids("business_id");
  const branchIds = ids("branch_id");
  const departmentIds = ids("department_id");
  const entryIds = entries.map((entry) => entry.id as string);

  const [employeesResult, periodsResult, businessesResult, branchesResult, departmentsResult, allowancesResult, deductionsResult, slipsResult] = await Promise.all([
    employeeIds.length ? supabase.from("employees").select("*").in("id", employeeIds) : Promise.resolve({ data: [], error: null }),
    periodIds.length ? supabase.from("hr_payroll_periods").select("*").in("id", periodIds) : Promise.resolve({ data: [], error: null }),
    businessIds.length ? supabase.from("businesses").select("*").in("id", businessIds) : Promise.resolve({ data: [], error: null }),
    branchIds.length ? supabase.from("branches").select("*").in("id", branchIds) : Promise.resolve({ data: [], error: null }),
    departmentIds.length ? supabase.from("departments").select("*").in("id", departmentIds) : Promise.resolve({ data: [], error: null }),
    supabase.from("hr_payroll_allowances").select("*").in("payroll_entry_id", entryIds).order("created_at"),
    supabase.from("hr_payroll_deductions").select("*").in("payroll_entry_id", entryIds).order("created_at"),
    supabase.from("hr_payslips").select("*").in("payroll_entry_id", entryIds),
  ]);
  const results = [employeesResult, periodsResult, businessesResult, branchesResult, departmentsResult, allowancesResult, deductionsResult, slipsResult];
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(`Payslip details could not be loaded: ${failed.error.message}`);

  const mapById = (rows: unknown[] | null) => new Map(((rows ?? []) as Row[]).map((row) => [row.id as string, row]));
  const employeeById = mapById(employeesResult.data as unknown[] | null);
  const periodById = mapById(periodsResult.data as unknown[] | null);
  const businessById = mapById(businessesResult.data as unknown[] | null);
  const branchById = mapById(branchesResult.data as unknown[] | null);
  const departmentById = mapById(departmentsResult.data as unknown[] | null);
  const slipByEntryId = new Map(((slipsResult.data ?? []) as Row[]).map((row) => [row.payroll_entry_id as string, row]));
  const runByIdAgain = runById;

  return entries.flatMap((entry) => {
    const run = runByIdAgain.get(entry.payroll_run_id as string);
    const employee = employeeById.get(entry.employee_id as string);
    const period = run ? periodById.get(run.payroll_period_id as string) : null;
    if (!run || !employee || !period) return [];
    const existingPayslip = slipByEntryId.get(entry.id as string) ?? null;
    const baseNumber = `AE-${String(period.period_start ?? "PAY").slice(0, 4)}-${String(entry.id).replaceAll("-", "").slice(0, 10).toUpperCase()}`;
    return [{
      entryId: entry.id as string,
      payslipNumber: (existingPayslip?.payslip_number as string | undefined) ?? baseNumber,
      status: entry.status as string,
      employee,
      period,
      run,
      entry,
      business: businessById.get(entry.business_id as string) ?? null,
      branch: branchById.get(entry.branch_id as string) ?? null,
      department: departmentById.get(entry.department_id as string) ?? null,
      allowances: ((allowancesResult.data ?? []) as Row[]).filter((row) => row.payroll_entry_id === entry.id),
      deductions: ((deductionsResult.data ?? []) as Row[]).filter((row) => row.payroll_entry_id === entry.id),
      existingPayslip,
    }];
  });
}

export async function getPrintablePayslips() {
  return loadPayslipRows();
}

export async function getPrintablePayslip(entryId: string) {
  return (await loadPayslipRows(entryId))[0] ?? null;
}

export async function recordPayslipPrint(entryId: string) {
  const supabase = await assertPayrollAccess();
  const payslip = await getPrintablePayslip(entryId);
  if (!payslip) throw new Error("This payslip is unavailable. Only finalized, approved payroll can be printed.");
  const payload = {
    payroll_entry_id: payslip.entryId,
    employee_id: String(payslip.employee.id),
    payroll_period_id: String(payslip.run.payroll_period_id),
    payslip_number: payslip.payslipNumber,
    payment_date: payslip.period.payment_date ?? null,
    basic_salary: payslip.entry.basic_salary ?? 0,
    gross_pay: payslip.entry.gross_pay ?? 0,
    total_allowances: payslip.entry.total_allowances ?? 0,
    total_deductions: payslip.entry.total_deductions ?? 0,
    total_tax: payslip.entry.total_tax ?? 0,
    net_pay: payslip.entry.net_pay ?? 0,
    currency: "ZMW",
    status: payslip.status === "Paid" ? "Paid" : "Generated",
    notes: typeof payslip.entry.notes === "string" ? payslip.entry.notes : null,
  };
  const { error } = await supabase.from("hr_payslips").upsert(payload, { onConflict: "payroll_entry_id" });
  if (error) throw new Error(`Payslip record could not be saved: ${error.message}`);
  return payslip.payslipNumber;
}
