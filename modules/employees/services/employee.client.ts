import {
  createEmployeeAction,
  deleteEmployeeAction,
  updateEmployeeAction,
} from "./employee.actions";

export interface CreateEmployeeInput {
  business_id: string | null;
  department_id: string | null;
  user_id?: string | null;
  full_name: string;
  phone: string;
  email?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  national_id?: string | null;
  address?: string | null;
  position: string;
  employment_type?: string | null;
  salary?: number | null;
  date_joined?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export async function createEmployee(employee: CreateEmployeeInput) {
  return createEmployeeAction(employee);
}

export async function updateEmployee(id: string, employee: CreateEmployeeInput) {
  return updateEmployeeAction(id, employee);
}

export async function deleteEmployee(id: string) {
  return deleteEmployeeAction(id);
}
