"use server";

import {
  createCustomerLoanApplication,
  updateCustomerLoanApplication,
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

export async function updateCustomerLoanAction(
  id: string,
  input: Partial<CustomerLoanApplicationInput>
): Promise<CustomerLoanApplication> {
  try {
    return await updateCustomerLoanApplication(id, input);
  } catch (error) {
    console.error("Customer loan update action error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to update customer loan."
    );
  }
}
