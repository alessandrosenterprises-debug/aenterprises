export type CustomerLoanApplicationSource =
  | "Customer App"
  | "Walk-in";

export type CustomerLoanApplicationStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Active"
  | "Completed"
  | "Cancelled";

export interface CustomerLoanApplication {
  id: string;

  customer_id: string;
  loan_product_id: string | null;
  application_number: string | null;

  application_source: CustomerLoanApplicationSource;
  application_date: string;
  loan_type: string;

  requested_amount: number;
  approved_amount: number | null;
  interest_rate: number | null;
  repayment_period: number | null;

  monthly_installment: number | null;
  total_payable: number | null;
  amount_paid: number;
  outstanding_balance: number | null;

  loan_purpose: string | null;

  collateral_required: boolean;
  collateral_description: string | null;
  collateral_id: string | null;
  collateral_worth: number | null;

  account_operator_id: string | null;

  due_date: string | null;

  residential_address: string | null;

  next_of_kin_name: string | null;
  next_of_kin_relationship: string | null;
  next_of_kin_phone: string | null;

  nrc_front_path: string | null;
  nrc_back_path: string | null;
  selfie_path: string | null;

  status: CustomerLoanApplicationStatus;

  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  notes: string | null;

  created_at: string;
  updated_at: string;

  customers?: {
    id: string;
    customer_code: string | null;
    full_name: string;
    phone: string;
    email: string | null;
  } | null;

  loan_products?: {
    id: string;
    name: string;
    description: string | null;
    min_amount: number | null;
    max_amount: number | null;
    interest_rate: number | null;
    repayment_period: number | null;
    requires_collateral: boolean;
    status: string;
  } | null;
}

export interface CustomerLoanApplicationInput {
  customer_id: string;

  loan_product_id?: string | null;

  application_source: CustomerLoanApplicationSource;

  application_date?: string;

  loan_type: string;

  requested_amount: number;

  interest_rate?: number | null;

  repayment_period?: number | null;

  loan_purpose?: string | null;

  collateral_required?: boolean;

  collateral_description?: string | null;

  collateral_id?: string | null;

  collateral_worth?: number | null;

  account_operator_id?: string | null;

  due_date?: string | null;

  residential_address?: string | null;

  next_of_kin_name?: string | null;

  next_of_kin_relationship?: string | null;

  next_of_kin_phone?: string | null;

  nrc_front_path?: string | null;
  nrc_back_path?: string | null;
  selfie_path?: string | null;

  notes?: string | null;
}