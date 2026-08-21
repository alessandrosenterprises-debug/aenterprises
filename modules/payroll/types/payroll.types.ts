export interface PayrollPeriod {
  id: string;

  name: string;

  period_start: string;

  period_end: string;

  payment_date: string | null;

  status: string;

  notes: string | null;

  created_by: string | null;

  created_at: string;

  updated_at: string;
}

export interface PayrollPeriodInput {
  name: string;

  period_start: string;

  period_end: string;

  payment_date?: string | null;

  status?: string;

  notes?: string | null;
}

export interface EmployeePayrollSettings {
  id: string;

  employee_id: string;

  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  branch_code: string | null;

  payment_method: string;

  tax_number: string | null;
  napsa_number: string | null;
  nhima_number: string | null;
  pension_number: string | null;

  loan_deduction_enabled: boolean;
  default_loan_deduction: number;
  default_advance_deduction: number;

  created_at: string;
  updated_at: string;

  employees?: {
    id: string;
    full_name: string;
    phone: string;
    position: string;
    salary: number | null;
    business_id: string | null;
  } | null;
}