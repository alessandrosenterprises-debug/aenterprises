"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function getAccountsClient(permission: "accounts.view" | "accounts.manage" | "accounts.payroll" = "accounts.view") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: allowed, error } = await supabase.rpc("has_permission", { required_permission: permission });
  if (error || !allowed) redirect("/dashboard/access-denied");
  return supabase;
}

export async function getAccountsDashboardData() {
  const supabase = await getAccountsClient();

  const dateParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lusaka", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const today = `${dateParts.find((part) => part.type === "year")?.value}-${dateParts.find((part) => part.type === "month")?.value}-${dateParts.find((part) => part.type === "day")?.value}`;
  const monthStart = `${today.slice(0, 7)}-01`;
  const [cashUps, payrollRuns, statutory, journals] = await Promise.all([
    supabase.from("cash_daily_reconciliations").select("id,status,variance,salary_deduction_amount,reconciliation_date").gte("reconciliation_date", monthStart),
    supabase.from("hr_payroll_runs").select("id,status,gross_pay,total_deductions,total_tax,net_pay,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("accounts_statutory_schedules").select("id,authority,status,total_amount,due_date").order("due_date", { ascending: true }),
    supabase.from("accounts_journal_entries").select("id,status,entry_date").limit(1),
  ]);

  if (cashUps.error) throw new Error("Accounts could not load the cash-up register. Confirm cash database migrations are installed.");
  if (payrollRuns.error) throw new Error("Accounts could not load payroll summaries. Confirm payroll is available and try again.");

  const records = cashUps.data ?? [];
  const runs = payrollRuns.data ?? [];
  const schedules = statutory.error ? [] : statutory.data ?? [];
  const shortageTotal = records.reduce((total, row) => total + Math.max(0, -Number(row.variance ?? 0)), 0);
  const salaryDeductionTotal = records.reduce((total, row) => total + Number(row.salary_deduction_amount ?? 0), 0);
  const payrollPending = runs.filter((run) => !["Paid", "Cancelled"].includes(run.status));
  const schedulesDue = schedules.filter((item) => item.status !== "paid");

  return {
    monthStart,
    cashUps: {
      pending: records.filter((row) => row.status === "pending_accounts").length,
      returned: records.filter((row) => row.status === "returned").length,
      shortageTotal,
      salaryDeductionTotal,
    },
    payroll: {
      runs: runs.length,
      awaitingPayment: payrollPending.length,
      gross: payrollPending.reduce((total, run) => total + Number(run.gross_pay ?? 0), 0),
      net: payrollPending.reduce((total, run) => total + Number(run.net_pay ?? 0), 0),
    },
    statutory: {
      schedules: schedules.length,
      awaitingPayment: schedulesDue.length,
      overdue: schedulesDue.filter((item) => item.due_date < today).length,
      dueAmount: schedulesDue.reduce((total, item) => total + Number(item.total_amount ?? 0), 0),
      needsMigration: Boolean(statutory.error),
    },
    journals: { available: !journals.error },
  };
}

export async function getAccountsJournalData() {
  const supabase = await getAccountsClient();
  const [chartResult, journalResult, payrollResult] = await Promise.all([
    supabase.from("accounts_chart_of_accounts").select("id,code,name,account_type,active").eq("active", true).order("code"),
    supabase.from("accounts_journal_entries")
      .select("id,entry_number,entry_date,source_type,source_id,memo,status,created_at,posted_at,lines:accounts_journal_lines(id,line_number,description,debit,credit,account:accounts_chart_of_accounts(id,code,name,account_type))")
      .order("entry_date", { ascending: false }).order("entry_number", { ascending: false }).limit(100),
    supabase.from("hr_payroll_runs").select("id,payroll_period_id,status,period:hr_payroll_periods(name,period_end)").in("status", ["Finalized", "Paid"]).order("created_at", { ascending: false }).limit(100),
  ]);
  if (chartResult.error || journalResult.error) throw new Error("The Accounts ledger is not available yet. Apply database migration 048 and refresh this page.");
  const { data: canManage } = await supabase.rpc("has_permission", { required_permission: "accounts.manage" });
  const dateParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lusaka", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const today = `${dateParts.find((part) => part.type === "year")?.value}-${dateParts.find((part) => part.type === "month")?.value}-${dateParts.find((part) => part.type === "day")?.value}`;
  const payrollRuns = payrollResult.error ? [] : (payrollResult.data ?? []).map((run) => ({ ...run, period: Array.isArray(run.period) ? run.period[0] : run.period }));
  const payrollNeedsMigration = Boolean(payrollResult.error);
  return { accounts: chartResult.data ?? [], journals: journalResult.data ?? [], payrollRuns, payrollNeedsMigration, canManage: Boolean(canManage), today };
}

export async function createPayrollJournalDraft(payrollRunId: string) {
  const supabase = await getAccountsClient("accounts.manage");
  if (!payrollRunId) throw new Error("Choose a finalized payroll run.");
  const [runResult, entriesResult, schedulesResult, chartResult] = await Promise.all([
    supabase.from("hr_payroll_runs").select("id,status,payroll_period_id,period:hr_payroll_periods(name,period_end)").eq("id", payrollRunId).maybeSingle(),
    supabase.from("hr_payroll_entries").select("id,employee_id,gross_pay,net_pay,total_tax,deductions:hr_payroll_deductions(deduction_type,amount)").eq("payroll_run_id", payrollRunId).not("status", "eq", "Cancelled"),
    supabase.from("accounts_statutory_schedules").select("authority,employee_amount,employer_amount,status").eq("payroll_run_id", payrollRunId),
    supabase.from("accounts_chart_of_accounts").select("id,code,name,account_type").eq("active", true),
  ]);
  if (runResult.error || !runResult.data || entriesResult.error || schedulesResult.error || chartResult.error) {
    throw new Error("Payroll details could not be loaded. Check payroll and Accounts setup, then try again.");
  }
  const run = runResult.data;
  if (!["Finalized", "Paid"].includes(run.status)) throw new Error("Only finalized or paid payroll can be transferred to the ledger.");
  const entries = entriesResult.data ?? [];
  if (!entries.length) throw new Error("This payroll run has no employee entries.");
  const schedules = new Map((schedulesResult.data ?? []).map((schedule) => [schedule.authority, schedule]));
  for (const authority of ["NAPSA", "NHIMA", "PAYE"]) {
    if (!schedules.has(authority) || schedules.get(authority)?.status === "draft") {
      throw new Error(`Generate and review the ${authority} schedule before transferring payroll to the ledger.`);
    }
  }
  const amounts = new Map<string, number>();
  const add = (code: string, amount: number) => { if (amount > 0.004) amounts.set(code, Math.round(((amounts.get(code) ?? 0) + amount) * 100) / 100); };
  const gross = entries.reduce((sum, row) => sum + Number(row.gross_pay ?? 0), 0);
  const net = entries.reduce((sum, row) => sum + Number(row.net_pay ?? 0), 0);
  const byType = new Map<string, number>();
  for (const entry of entries) for (const deduction of entry.deductions ?? []) {
    const type = String(deduction.deduction_type ?? "Other");
    byType.set(type, (byType.get(type) ?? 0) + Number(deduction.amount ?? 0));
  }
  const employeeNapsa = Math.max(Number(schedules.get("NAPSA")?.employee_amount ?? 0), byType.get("NAPSA") ?? 0);
  const employeeNhima = Math.max(Number(schedules.get("NHIMA")?.employee_amount ?? 0), byType.get("NHIMA") ?? 0);
  const paye = Math.max(Number(schedules.get("PAYE")?.employee_amount ?? 0), entries.reduce((sum, row) => sum + Number(row.total_tax ?? 0), 0), byType.get("PAYE") ?? 0);
  const otherEmployeeDeductions = Math.max(0, (byType.get("Pension") ?? 0) + (byType.get("Other") ?? 0));
  const loanRecovery = (byType.get("Loan") ?? 0) + (byType.get("Advance") ?? 0);
  const shortageRecovery = byType.get("Shortage") ?? 0;
  const employerNapsa = Number(schedules.get("NAPSA")?.employer_amount ?? 0);
  const employerNhima = Number(schedules.get("NHIMA")?.employer_amount ?? 0);
  const unexplained = gross - net - employeeNapsa - employeeNhima - paye - otherEmployeeDeductions - loanRecovery - shortageRecovery;
  if (unexplained < -0.02) throw new Error("Payroll deductions exceed gross-to-net withholding. Reconcile the payroll entries before ledger transfer.");
  if (unexplained > 0.02) throw new Error(`Payroll has ${unexplained.toFixed(2)} ZMW of unclassified deductions. Add the deduction type or correct the payroll before ledger transfer.`);
  add("5100", gross);
  add("5110", employerNapsa + employerNhima);
  add("2100", net);
  add("2110", employeeNapsa + employerNapsa);
  add("2120", employeeNhima + employerNhima);
  add("2130", paye);
  add("2200", otherEmployeeDeductions);
  add("1300", loanRecovery);
  add("1310", shortageRecovery);
  const totalDebits = gross + employerNapsa + employerNhima;
  const totalCredits = [...amounts.values()].reduce((sum, value) => sum + value, 0);
  if (Math.abs(totalDebits - totalCredits) > 0.02) throw new Error("Payroll totals do not balance to gross pay. Review the statutory schedules and deductions before transfer.");
  const accountByCode = new Map((chartResult.data ?? []).map((account) => [account.code, account]));
  const lines = [...amounts.entries()].map(([code, credit]) => {
    const account = accountByCode.get(code);
    if (!account) throw new Error(`Required ledger account ${code} is missing. Add it to the chart of accounts.`);
    return { account_id: account.id, description: account.name, debit: 0, credit };
  });
  const expenseAccount = accountByCode.get("5100");
  if (!expenseAccount) throw new Error("Payroll expense account 5100 is missing from the chart of accounts.");
  if (gross > 0.004) lines.unshift({ account_id: expenseAccount.id, description: "Gross payroll expense", debit: Math.round(gross * 100) / 100, credit: 0 });
  if (employerNapsa + employerNhima > 0.004) {
    const employerExpense = accountByCode.get("5110");
    if (!employerExpense) throw new Error("Employer statutory expense account 5110 is missing from the chart of accounts.");
    lines.splice(1, 0, { account_id: employerExpense.id, description: "Employer statutory contributions", debit: Math.round((employerNapsa + employerNhima) * 100) / 100, credit: 0 });
  }
  const period = Array.isArray(run.period) ? run.period[0] : run.period;
  const { data, error } = await supabase.rpc("create_accounts_journal_draft", {
    p_entry_date: period?.period_end ?? new Date().toISOString().slice(0, 10),
    p_memo: `Payroll ${period?.name ?? payrollRunId} ledger transfer`,
    p_lines: lines,
    p_source_type: "payroll_run",
    p_source_id: payrollRunId,
  });
  if (error || !data) throw new Error(error?.code === "23505" ? "A ledger journal already exists for this payroll run." : "The payroll journal draft could not be created.");
  return { id: data as string };
}

export async function createAccountsJournalDraft(input: {
  entryDate: string;
  memo: string;
  lines: { accountId: string; description: string; debit: number; credit: number }[];
}) {
  const supabase = await getAccountsClient("accounts.manage");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.entryDate) || !input.memo.trim() || input.memo.trim().length > 240 || input.lines.length < 2) {
    throw new Error("Enter a valid date, description and at least two journal lines.");
  }
  const lines = input.lines.map((line) => ({ ...line, debit: Math.round(Number(line.debit) * 100) / 100, credit: Math.round(Number(line.credit) * 100) / 100 }));
  if (lines.some((line) => !line.accountId || !Number.isFinite(line.debit) || !Number.isFinite(line.credit) || line.debit < 0 || line.credit < 0 || ((line.debit > 0) === (line.credit > 0)))) {
    throw new Error("Each journal line needs an account and either a debit or a credit amount.");
  }
  const debits = lines.reduce((sum, line) => sum + line.debit, 0);
  const credits = lines.reduce((sum, line) => sum + line.credit, 0);
  if (debits <= 0 || Math.abs(debits - credits) >= 0.01) throw new Error("Journal debits and credits must balance before saving.");
  const { data, error } = await supabase.rpc("create_accounts_journal_draft", {
    p_entry_date: input.entryDate,
    p_memo: input.memo.trim(),
    p_lines: lines.map((line) => ({ account_id: line.accountId, description: line.description.trim() || null, debit: line.debit, credit: line.credit })),
  });
  if (error || !data) throw new Error("Balanced journal could not be saved. Confirm Accounts migration 048 and try again.");
  return { id: data as string };
}

export async function postAccountsJournal(entryId: string) {
  const supabase = await getAccountsClient("accounts.manage");
  if (!entryId) throw new Error("Choose a journal entry to post.");
  const { error } = await supabase.rpc("post_accounts_journal", { p_entry_id: entryId });
  if (error) throw new Error("Journal could not be posted. It must be a balanced draft and your role must include Accounts journal access.");
  return { success: true };
}

export async function createAccountsChartAccount(input: { code: string; name: string; accountType: "asset" | "liability" | "equity" | "income" | "expense" }) {
  const supabase = await getAccountsClient("accounts.manage");
  const code = input.code.trim();
  const name = input.name.trim();
  if (!/^\d{3,8}$/.test(code) || name.length < 2 || name.length > 100 || !["asset", "liability", "equity", "income", "expense"].includes(input.accountType)) {
    throw new Error("Enter a 3–8 digit account code, name and valid account type.");
  }
  const { error } = await supabase.from("accounts_chart_of_accounts").insert({ code, name, account_type: input.accountType });
  if (error) throw new Error(error.code === "23505" ? "That account code is already in use." : "Chart account could not be created.");
  return { success: true };
}

export async function getAccountsShortageData() {
  const supabase = await getAccountsClient();
  const [deductionsResult, runsResult] = await Promise.all([
    supabase.from("accounts_salary_deductions")
      .select("id,reconciliation_id,employee_id,amount,reason,status,payroll_entry_id,approved_at,included_at,paid_at")
      .order("approved_at", { ascending: false }),
    supabase.from("hr_payroll_runs").select("id,payroll_period_id,status").in("status", ["Draft", "Processing"]).order("created_at", { ascending: false }),
  ]);
  if (deductionsResult.error) throw new Error("The shortage-to-payroll queue is not available. Apply database migration 048 and refresh.");
  if (runsResult.error) throw new Error("Open payroll runs could not be loaded.");
  const deductions = deductionsResult.data ?? [];
  const employeeIds = [...new Set(deductions.map((item) => item.employee_id))];
  const reconciliationIds = [...new Set(deductions.map((item) => item.reconciliation_id))];
  const periodIds = [...new Set((runsResult.data ?? []).map((run) => run.payroll_period_id))];
  const [employeesResult, cashUpsResult, periodsResult] = await Promise.all([
    employeeIds.length ? supabase.from("employees").select("id,full_name").in("id", employeeIds) : Promise.resolve({ data: [], error: null }),
    reconciliationIds.length ? supabase.from("cash_daily_reconciliations").select("id,reconciliation_date,business_id,staff_profile_id,business:businesses!cash_daily_reconciliations_business_id_fkey(name),staff:profiles!cash_daily_reconciliations_staff_profile_id_fkey(display_name,first_name,last_name,email)").in("id", reconciliationIds) : Promise.resolve({ data: [], error: null }),
    periodIds.length ? supabase.from("hr_payroll_periods").select("id,name,period_start,period_end").in("id", periodIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (employeesResult.error || cashUpsResult.error || periodsResult.error) throw new Error("Shortage, cashier or payroll period details could not be loaded.");
  const employees = new Map((employeesResult.data ?? []).map((item) => [item.id, item]));
  const reconciliations = new Map((cashUpsResult.data ?? []).map((item) => [item.id, item]));
  const periods = new Map((periodsResult.data ?? []).map((item) => [item.id, item]));
  const { data: canManage } = await supabase.rpc("has_permission", { required_permission: "accounts.payroll" });
  return {
    deductions: deductions.map((item) => ({ ...item, employee: employees.get(item.employee_id) ?? null, reconciliation: reconciliations.get(item.reconciliation_id) ?? null })),
    payrollRuns: (runsResult.data ?? []).map((run) => ({ ...run, period: periods.get(run.payroll_period_id) ?? null })),
    canManage: Boolean(canManage),
  };
}

export async function applyShortageDeductionsToPayroll(payrollRunId: string) {
  const supabase = await getAccountsClient("accounts.payroll");
  if (!payrollRunId) throw new Error("Choose a draft payroll run.");
  const { data, error } = await supabase.rpc("apply_accounts_shortage_deductions", { p_payroll_run_id: payrollRunId });
  if (error) throw new Error(error.message.includes("missing") ? "Every approved shortage needs an employee entry in the selected payroll run." : "Approved shortage deductions could not be added to payroll. Confirm the run is still open and try again.");
  return { applied: Number(data ?? 0) };
}

export async function getAccountsFinancialReport(startDate: string, endDate: string) {
  const supabase = await getAccountsClient();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || startDate > endDate) {
    throw new Error("Choose a valid start and end date.");
  }
  const [chartResult, ledgerResult] = await Promise.all([
    supabase.from("accounts_chart_of_accounts").select("id,code,name,account_type,active").eq("active", true).order("code"),
    supabase.from("accounts_journal_entries")
      .select("id,entry_date,status,lines:accounts_journal_lines(debit,credit,account:accounts_chart_of_accounts(id,code,name,account_type))")
      .eq("status", "posted").lte("entry_date", endDate),
  ]);
  if (chartResult.error || ledgerResult.error) throw new Error("Accounts reports are not ready. Check that migration 048 is applied and journals are available.");
  const chart = chartResult.data ?? [];
  const accounts = new Map(chart.map((account) => [account.id, { ...account, closing: 0, period: 0 }]));
  for (const journal of ledgerResult.data ?? []) {
    const inPeriod = journal.entry_date >= startDate && journal.entry_date <= endDate;
    for (const line of journal.lines ?? []) {
      const account = Array.isArray(line.account) ? line.account[0] : line.account;
      if (!account) continue;
      const row = accounts.get(account.id);
      if (!row) continue;
      const debit = Number(line.debit ?? 0);
      const credit = Number(line.credit ?? 0);
      const normalDebit = account.account_type === "asset" || account.account_type === "expense";
      row.closing += normalDebit ? debit - credit : credit - debit;
      if (inPeriod) row.period += normalDebit ? debit - credit : credit - debit;
    }
  }
  const reportAccounts = [...accounts.values()].map((row) => ({ ...row, closing: Math.round(row.closing * 100) / 100, period: Math.round(row.period * 100) / 100 }));
  const sumType = (type: string, field: "closing" | "period") => reportAccounts.filter((row) => row.account_type === type).reduce((sum, row) => sum + row[field], 0);
  const income = sumType("income", "period");
  const expense = sumType("expense", "period");
  const assets = sumType("asset", "closing");
  const liabilities = sumType("liability", "closing");
  const equity = sumType("equity", "closing");
  const retainedEarnings = sumType("income", "closing") - sumType("expense", "closing");
  const trialDebits = reportAccounts.reduce((sum, row) => {
    const normalDebit = row.account_type === "asset" || row.account_type === "expense";
    return sum + (normalDebit ? Math.max(0, row.closing) : Math.max(0, -row.closing));
  }, 0);
  const trialCredits = reportAccounts.reduce((sum, row) => {
    const normalDebit = row.account_type === "asset" || row.account_type === "expense";
    return sum + (normalDebit ? Math.max(0, -row.closing) : Math.max(0, row.closing));
  }, 0);
  return {
    startDate, endDate, accounts: reportAccounts,
    totals: {
      income, expense, netProfit: income - expense,
      assets, liabilities, equity, retainedEarnings, liabilitiesAndEquity: liabilities + equity + retainedEarnings,
      trialDebits, trialCredits,
    },
  };
}
