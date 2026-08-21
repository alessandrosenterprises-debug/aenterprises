import { createClient } from "@/lib/supabase/server";

export interface HRLoanProduct {
  id: string;
  name: string;
  description: string | null;
  min_amount: number | null;
  max_amount: number | null;
  interest_rate: number | null;
  repayment_period: number | null;
  requires_collateral: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function getHRLoanProducts(): Promise<
  HRLoanProduct[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("loan_products")
    .select(`
      id,
      name,
      description,
      min_amount,
      max_amount,
      interest_rate,
      repayment_period,
      requires_collateral,
      status,
      created_at,
      updated_at
    `)
    .eq("status", "Active")
    .order("name", {
      ascending: true,
    });

  if (error) {
    console.error(
      "HR loan products loading error:",
      error
    );

    throw new Error(error.message);
  }

  return (data ?? []) as HRLoanProduct[];
}