"use server";

import { revalidatePath } from "next/cache";

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
    const application = await createCustomerLoanApplication(input);
    revalidatePath("/dashboard/enterprise/soft-loans");
    return application;
  } catch (error) {
    console.error(
      "Customer loan action error:",
      error
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to create loan application."
    );
  }
}

export async function updateCustomerLoanAction(
  id: string,
  input: Partial<CustomerLoanApplicationInput>
): Promise<CustomerLoanApplication> {
  try {
    const application = await updateCustomerLoanApplication(id, input);
    revalidatePath("/dashboard/enterprise/soft-loans");
    return application;
  } catch (error) {
    console.error("Customer loan update action error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to update loan application."
    );
  }
}
