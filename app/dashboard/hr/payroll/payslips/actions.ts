"use server";

import { recordPayslipPrint } from "@/modules/payroll/services/payslip.service";

export async function preparePayslipForPrint(entryId: string) {
  return recordPayslipPrint(entryId);
}
