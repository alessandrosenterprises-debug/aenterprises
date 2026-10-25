"use server";

import { createClient } from "@/lib/supabase/server";

async function getCashAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to access cash reconciliation.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, first_name, last_name, email, active")
    .eq("auth_user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  if (profileError || !profile) throw new Error("Your active staff profile could not be found.");

  const [{ data: canReport }, { data: canReconcile }, { data: canReview }, { data: canManageCash }, { data: canFinalize }] = await Promise.all([
    supabase.rpc("has_permission", { required_permission: "reports.view" }),
    supabase.rpc("has_permission", { required_permission: "cash.reconcile" }),
    supabase.rpc("has_permission", { required_permission: "cash.review" }),
    supabase.rpc("has_permission", { required_permission: "cash.manage" }),
    supabase.rpc("has_permission", { required_permission: "cash.finalize" }),
  ]);
  if (!canReport && !canReconcile && !canReview && !canManageCash && !canFinalize) throw new Error("Your role does not have access to cash reconciliation.");
  return { supabase, profile, canReport: Boolean(canReport), canReconcile: Boolean(canReconcile), canReview: Boolean(canReview), canManageCash: Boolean(canManageCash), canFinalize: Boolean(canFinalize) };
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export async function getCashReconciliationData(date: string) {
  if (!validDate(date)) throw new Error("Choose a valid reconciliation date.");
  const { supabase, profile, canReport, canReconcile, canReview, canManageCash, canFinalize } = await getCashAccess();
  const start = new Date(`${date}T00:00:00+02:00`).toISOString();
  const end = new Date(`${date}T00:00:00+02:00`);
  end.setUTCDate(end.getUTCDate() + 1);
  const endIso = end.toISOString();
  const [businessResult, entryResult, reconciliationResult, assignmentResult, modesResult] = await Promise.all([
    supabase.from("businesses").select("id, name").order("name"),
    supabase.from("cash_register_entries")
      .select("id, staff_profile_id, business_id, transaction_mode_id, counts_toward_till, direction, source, reference, description, amount, received_at, mode:cash_transaction_modes!cash_register_entries_transaction_mode_id_fkey(id, name, affects_cash_balance), staff:profiles!cash_register_entries_staff_profile_id_fkey(id, display_name, first_name, last_name, email), business:businesses!cash_register_entries_business_id_fkey(id, name)")
      .gte("received_at", start).lt("received_at", endIso).order("received_at", { ascending: false }),
    supabase.from("cash_daily_reconciliations")
      .select("id, staff_profile_id, business_id, reconciliation_date, opening_float, cash_dropped, expected_cash, variance, counted_cash, notes, status, salary_deduction_note, salary_deduction_amount, submitted_at, manager_verified_at, reconciled_by_profile_id, accounts_review_note, staff:profiles!cash_daily_reconciliations_staff_profile_id_fkey(id, display_name, first_name, last_name, email), reconciler:profiles!cash_daily_reconciliations_reconciled_by_profile_id_fkey(id, display_name, first_name, last_name, email), business:businesses!cash_daily_reconciliations_business_id_fkey(id, name)")
      .eq("reconciliation_date", date),
    supabase.from("cashier_assignments")
      .select("staff_profile_id, business_id, active, staff:profiles!cashier_assignments_staff_profile_id_fkey(id, display_name, first_name, last_name, email), business:businesses!cashier_assignments_business_id_fkey(id, name)")
      .eq("active", true),
    supabase.from("cash_transaction_modes").select("id, mode_key, name, affects_cash_balance, active").eq("active", true).order("name"),
  ]);
  if (businessResult.error) throw new Error("Businesses could not be loaded. Check your access and try again.");
  if (entryResult.error) {
    console.error("[cash reconciliation] failed to load cash register entries", { code: entryResult.error.code, message: entryResult.error.message, details: entryResult.error.details, hint: entryResult.error.hint });
    throw new Error("Cash reconciliation is not fully set up yet. Ask your system administrator to apply database migrations 038–043, then reload this page.");
  }
  if (reconciliationResult.error) {
    console.error("[cash reconciliation] failed to load daily till counts", { code: reconciliationResult.error.code, message: reconciliationResult.error.message, details: reconciliationResult.error.details, hint: reconciliationResult.error.hint });
    throw new Error("Daily till counts are not fully set up yet. Ask your system administrator to apply database migrations 038–043, then reload this page.");
  }
  if (assignmentResult.error) {
    console.error("[cash reconciliation] failed to load cashier assignments", { code: assignmentResult.error.code, message: assignmentResult.error.message, details: assignmentResult.error.details, hint: assignmentResult.error.hint });
    throw new Error("Cashier access is not fully set up yet. Ask your system administrator to apply database migration 039, then reload this page.");
  }
  if (modesResult.error) {
    console.error("[cash reconciliation] failed to load transaction modes", { code: modesResult.error.code, message: modesResult.error.message, details: modesResult.error.details, hint: modesResult.error.hint });
    throw new Error("Payment modes are not set up yet. Apply database migration 041, then reload this page.");
  }

  const canViewAll = canReport || canReview || canManageCash || canFinalize;
  const { data: rosterData, error: rosterError } = canViewAll
    ? await supabase.rpc("get_cash_handler_roster")
    : { data: [], error: null };
  if (rosterError) throw new Error("The cash handler list could not be loaded. Apply the cash reconciliation database migration and try again.");
  const roster = [...(rosterData ?? [])];
  if (canReconcile && !roster.some((staff) => staff.id === profile.id)) {
    roster.push({ id: profile.id, display_name: profile.display_name, first_name: profile.first_name, last_name: profile.last_name, email: profile.email });
  }

  return {
    date,
    currentProfileId: profile.id as string,
    canReport,
    canReconcile,
    canReview,
    canManageCash,
    canCashUp: canReview || canManageCash,
    canFinalize,
    businesses: businessResult.data ?? [],
    modes: modesResult.data ?? [],
    staffRoster: roster,
    assignments: assignmentResult.data ?? [],
    entries: entryResult.data ?? [],
    reconciliations: reconciliationResult.data ?? [],
  };
}

export async function recordCashReceipt(input: {
  businessId: string;
  transactionModeId: string;
  direction: "in" | "out";
  source: string;
  reference: string;
  description: string;
  amount: number;
}) {
  const { supabase, profile, canReconcile, canManageCash } = await getCashAccess();
  if (!canReconcile) throw new Error("Your role is not allowed to record cash receipts.");
  if (!input.businessId || !input.transactionModeId || !input.description.trim() || !Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Choose a business and payment mode, then enter a reason and amount greater than zero.");
  }
  if (!["Order", "Booking", "Loan", "Expense", "Refund", "Other"].includes(input.source)) throw new Error("Choose a valid cash source.");
  if (!["in", "out"].includes(input.direction)) throw new Error("Choose whether cash was received or paid out.");
  if (input.direction === "out" && !["Expense", "Refund", "Other"].includes(input.source)) throw new Error("Choose Expense, Refund or Other for cash paid out.");

  const { data: mode, error: modeError } = await supabase.from("cash_transaction_modes")
    .select("id, affects_cash_balance").eq("id", input.transactionModeId).eq("active", true).maybeSingle();
  if (modeError || !mode) throw new Error("That payment mode is no longer available. Refresh the page and try again.");

  const { data: assignment, error: assignmentError } = await supabase.from("cashier_assignments")
    .select("id").eq("staff_profile_id", profile.id).eq("business_id", input.businessId).eq("active", true).maybeSingle();
  if (assignmentError || (!assignment && !canManageCash)) throw new Error("You are not assigned to handle cash for this business. Ask a manager to set up your cashier access.");

  const { error } = await supabase.from("cash_register_entries").insert({
    staff_profile_id: profile.id,
    business_id: input.businessId,
    transaction_mode_id: mode.id,
    counts_toward_till: mode.affects_cash_balance,
    direction: input.direction,
    source: input.source,
    reference: input.reference.trim() || null,
    description: input.description.trim(),
    amount: Math.round(input.amount * 100) / 100,
  });
  if (error) throw new Error("Payment could not be recorded. Confirm cash migrations 038–041 are installed and try again.");
  return { success: true };
}

export async function getCashTransactionModes() {
  const { supabase, canManageCash } = await getCashAccess();
  if (!canManageCash) throw new Error("Your role is not allowed to manage payment modes.");
  const { data, error } = await supabase.from("cash_transaction_modes")
    .select("id, mode_key, name, affects_cash_balance, active, created_at")
    .order("name");
  if (error) throw new Error("Payment modes could not be loaded. Apply database migration 041 and try again.");
  return data ?? [];
}

export async function saveCashTransactionMode(input: { name: string; affectsCashBalance: boolean; active?: boolean }) {
  const { supabase, profile, canManageCash } = await getCashAccess();
  if (!canManageCash) throw new Error("Your role is not allowed to manage payment modes.");
  const name = input.name.trim();
  if (name.length < 2 || name.length > 60) throw new Error("Enter a payment mode name between 2 and 60 characters.");
  const modeKey = name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const { error } = await supabase.from("cash_transaction_modes").upsert({
    mode_key: modeKey,
    name,
    affects_cash_balance: Boolean(input.affectsCashBalance),
    active: input.active ?? true,
    created_by_profile_id: profile.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "mode_key" });
  if (error) throw new Error("Payment mode could not be saved. Check that its name is not already in use.");
  return { success: true };
}

export async function submitCashCount(input: {
  businessId: string;
  cashierProfileId: string;
  date: string;
  openingFloat: number;
  cashDropped: number;
  countedCash: number;
  notes: string;
  salaryDeductionNote: string;
  salaryDeductionAmount: number;
}) {
  const { supabase, profile, canReview, canManageCash } = await getCashAccess();
  if (!canReview && !canManageCash) throw new Error("Only a manager on shift can complete cashier cash-up.");
  const todayParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lusaka", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const today = `${todayParts.find((part) => part.type === "year")?.value}-${todayParts.find((part) => part.type === "month")?.value}-${todayParts.find((part) => part.type === "day")?.value}`;
  if (!validDate(input.date) || input.date > today || !input.businessId || !input.cashierProfileId || !Number.isFinite(input.openingFloat) || input.openingFloat < 0 || !Number.isFinite(input.cashDropped) || input.cashDropped < 0 || !Number.isFinite(input.countedCash) || input.countedCash < 0) {
    throw new Error("Enter valid opening float and counted cash amounts.");
  }

  const { data: assignment } = await supabase.from("cashier_assignments").select("id")
    .eq("staff_profile_id", input.cashierProfileId).eq("business_id", input.businessId).eq("active", true).maybeSingle();
  if (!assignment) throw new Error("That cashier is not actively assigned to this business.");

  const { data: existingCashUp, error: existingError } = await supabase.from("cash_daily_reconciliations")
    .select("id, status").eq("staff_profile_id", input.cashierProfileId).eq("business_id", input.businessId).eq("reconciliation_date", input.date).maybeSingle();
  if (existingError) throw new Error("The cashier's existing cash-up status could not be checked.");
  if (existingCashUp && existingCashUp.status !== "returned") throw new Error("This cashier's till is already locked and awaiting Accounts, or it has already been approved.");

  const start = new Date(`${input.date}T00:00:00+02:00`).toISOString();
  const end = new Date(`${input.date}T00:00:00+02:00`);
  end.setUTCDate(end.getUTCDate() + 1);
  const { data: movements, error: movementsError } = await supabase.from("cash_register_entries")
    .select("direction, amount, counts_toward_till").eq("staff_profile_id", input.cashierProfileId).eq("business_id", input.businessId)
    .gte("received_at", start).lt("received_at", end.toISOString());
  if (movementsError) throw new Error("Cash transactions could not be totaled for this date.");
  const netMovements = (movements ?? []).filter((movement) => movement.counts_toward_till).reduce((sum, movement) => sum + (movement.direction === "out" ? -1 : 1) * Number(movement.amount ?? 0), 0);
  const expectedCash = Math.round((input.openingFloat + netMovements - input.cashDropped) * 100) / 100;
  const variance = Math.round((input.countedCash - expectedCash) * 100) / 100;
  const shortage = Math.max(0, -variance);
  if (variance >= 0.01) throw new Error(`The till is over by ZMW ${variance.toFixed(2)}. Correct the amounts before verifying cash-up.`);
  if (shortage >= 0.01) {
    if (!input.notes.trim()) throw new Error("Explain the cash shortage before verifying this cash-up.");
    if (!input.salaryDeductionNote.trim()) throw new Error("Add a salary deduction note for the cashier before submitting the shortage for review.");
    if (!Number.isFinite(input.salaryDeductionAmount) || Math.abs(input.salaryDeductionAmount - shortage) >= 0.01) throw new Error(`The salary deduction amount must match the shortage of ZMW ${shortage.toFixed(2)}.`);
  } else if (input.salaryDeductionAmount > 0 || input.salaryDeductionNote.trim()) {
    throw new Error("A salary deduction can only be recorded when the till has a shortage.");
  }

  const { error } = await supabase.from("cash_daily_reconciliations").upsert({
    staff_profile_id: input.cashierProfileId,
    business_id: input.businessId,
    reconciliation_date: input.date,
    opening_float: Math.round(input.openingFloat * 100) / 100,
    cash_dropped: Math.round(input.cashDropped * 100) / 100,
    counted_cash: Math.round(input.countedCash * 100) / 100,
    notes: input.notes.trim() || null,
    expected_cash: expectedCash,
    variance,
    status: "pending_accounts",
    manager_verified_at: new Date().toISOString(),
    salary_deduction_note: input.salaryDeductionNote.trim() || null,
    salary_deduction_amount: Math.round(input.salaryDeductionAmount * 100) / 100,
    reconciled_by_profile_id: profile.id,
    accounts_reviewed_by_profile_id: null,
    accounts_reviewed_at: null,
    accounts_review_note: null,
    submitted_at: new Date().toISOString(),
  }, { onConflict: "staff_profile_id,business_id,reconciliation_date" });
  if (error) throw new Error("Cash-up could not be saved. Confirm cash migrations 038–043 are installed and try again.");
  return { success: true };
}

export async function getPendingCashUps() {
  const { supabase, canFinalize } = await getCashAccess();
  if (!canFinalize) throw new Error("Only the Accounts Department can give final cash-up confirmation.");
  const { data, error } = await supabase.from("cash_daily_reconciliations")
    .select("id, staff_profile_id, business_id, reconciliation_date, opening_float, cash_dropped, expected_cash, counted_cash, variance, notes, salary_deduction_note, salary_deduction_amount, submitted_at, manager_verified_at, reconciled_by_profile_id, staff:profiles!cash_daily_reconciliations_staff_profile_id_fkey(id, display_name, first_name, last_name, email), manager:profiles!cash_daily_reconciliations_reconciled_by_profile_id_fkey(id, display_name, first_name, last_name, email), business:businesses!cash_daily_reconciliations_business_id_fkey(id, name)")
    .eq("status", "pending_accounts").order("reconciliation_date", { ascending: false });
  if (error) {
    console.error("Failed to load the Accounts cash-up review queue:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    if (["PGRST200", "PGRST204", "42703", "42P01"].includes(error.code ?? "")) {
      throw new Error("The Accounts cash-up review setup is incomplete. Apply cash database migrations 038–043 to the database used by this AEOS app, then refresh and try again.");
    }
    if (error.code === "42501") {
      throw new Error("AEOS could not access the cash-up review queue. Check that the Accounts role has Cash-up finalization permission.");
    }
    throw new Error("Cash-ups awaiting Accounts review could not be loaded. Refresh the page or contact an administrator if the issue continues.");
  }
  return data ?? [];
}

export async function reviewCashUp(input: { reconciliationId: string; decision: "approve" | "return"; note: string }) {
  const { supabase, canFinalize } = await getCashAccess();
  if (!canFinalize) throw new Error("Only the Accounts Department can give final cash-up confirmation.");
  if (!input.reconciliationId || !["approve", "return"].includes(input.decision)) throw new Error("Choose a cash-up and a valid review decision.");
  if (input.decision === "return" && !input.note.trim()) throw new Error("Add a reason when returning a cash-up to the manager.");
  const { error } = await supabase.rpc("review_cash_reconciliation", {
    p_reconciliation_id: input.reconciliationId,
    p_decision: input.decision,
    p_note: input.note.trim() || null,
  });
  if (error) throw new Error(error.message || "Cash-up review could not be saved.");
  return { success: true };
}

export async function getCashierManagementData() {
  const { supabase, canManageCash } = await getCashAccess();
  if (!canManageCash) throw new Error("Your role is not allowed to manage cashiers.");
  const [{ data: staff, error: staffError }, { data: businesses, error: businessError }, { data: assignments, error: assignmentsError }] = await Promise.all([
    supabase.rpc("get_cash_handler_roster"),
    supabase.from("businesses").select("id, name").order("name"),
    supabase.from("cashier_assignments").select("id, staff_profile_id, business_id, active, notes, assigned_at, staff:profiles!cashier_assignments_staff_profile_id_fkey(id, display_name, first_name, last_name, email), business:businesses!cashier_assignments_business_id_fkey(id, name)").order("assigned_at", { ascending: false }),
  ]);
  if (staffError || businessError || assignmentsError) throw new Error("Cashier setup could not be loaded. Apply the cash balancing migration and try again.");
  return { staff: staff ?? [], businesses: businesses ?? [], assignments: assignments ?? [] };
}

export async function saveCashierAssignment(input: { staffProfileId: string; businessId: string; active: boolean; notes: string }) {
  const { supabase, profile, canManageCash } = await getCashAccess();
  if (!canManageCash) throw new Error("Your role is not allowed to manage cashiers.");
  if (!input.staffProfileId || !input.businessId) throw new Error("Choose a staff member and business.");
  if (input.active) {
    const { data: eligibleStaff, error: eligibilityError } = await supabase.rpc("get_cash_handler_roster");
    if (eligibilityError || !(eligibleStaff as Array<{ id: string }> | null)?.some((staff: { id: string }) => staff.id === input.staffProfileId)) throw new Error("This staff member must first be given the Record cash and reconcile till role permission.");
  }
  const { error } = await supabase.from("cashier_assignments").upsert({
    staff_profile_id: input.staffProfileId,
    business_id: input.businessId,
    assigned_by_profile_id: profile.id,
    active: input.active,
    notes: input.notes.trim() || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "staff_profile_id,business_id" });
  if (error) throw new Error("Cashier assignment could not be saved. Confirm the cash balancing migration is installed.");
  return { success: true };
}
