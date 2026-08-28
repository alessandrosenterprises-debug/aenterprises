"use server";

import {
  createCustomerLoanApplication,
} from "@/modules/loans/services/customer-loans.service";

import type {
  CustomerLoanApplication,
  CustomerLoanApplicationInput,
} from "@/modules/loans/types/customer-loan";

/* ============================================================
   CREATE CUSTOMER LOAN
   ============================================================ */

export async function createCustomerLoanAction(
  input: CustomerLoanApplicationInput
): Promise<CustomerLoanApplication> {
  try {
    return await createCustomerLoanApplication(input);
  } catch (error) {
    console.error(
      "Customer loan action error:",
      error
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to create customer loan."
    );
  }
}