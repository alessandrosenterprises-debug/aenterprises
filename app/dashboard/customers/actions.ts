"use server";

import { revalidatePath } from "next/cache";
import { createCustomer } from "@/modules/customers/services/customer.service";

export async function createCustomerAction(data: {
  business_id: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  gender?: string;
  date_of_birth?: string;
  notes?: string;
  is_active?: boolean;
}) {
  await createCustomer(data);

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");
}