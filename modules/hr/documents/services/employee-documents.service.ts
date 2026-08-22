import { createClient } from "@/lib/supabase/server";

export interface EmployeeDocument {
  id: string;
  employee_id: string;

  document_type: string;
  document_name: string;

  description: string | null;

  file_url: string | null;
  file_path: string | null;

  issue_date: string | null;
  expiry_date: string | null;

  status: string;

  notes: string | null;

  created_at: string;
  updated_at: string;

  employees?: {
    id: string;
    full_name: string;
    position: string | null;
    department_id: string | null;
  } | null;
}

export interface EmployeeDocumentInput {
  employee_id: string;

  document_type: string;
  document_name: string;

  description?: string | null;

  file_url?: string | null;
  file_path?: string | null;

  issue_date?: string | null;
  expiry_date?: string | null;

  status?: string;

  notes?: string | null;
}

export async function getEmployeeDocuments(): Promise<
  EmployeeDocument[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hr_employee_documents")
    .select(`
      *,
      employees (
        id,
        full_name,
        position,
        department_id
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Employee documents loading error:",
      JSON.stringify(error, null, 2)
    );

    throw new Error(error.message);
  }

  return (data ?? []) as EmployeeDocument[];
}

export async function createEmployeeDocument(
  input: EmployeeDocumentInput
): Promise<EmployeeDocument> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hr_employee_documents")
    .insert({
      employee_id: input.employee_id,

      document_type:
        input.document_type,

      document_name:
        input.document_name,

      description:
        input.description ?? null,

      file_url:
        input.file_url ?? null,

      file_path:
        input.file_path ?? null,

      issue_date:
        input.issue_date ?? null,

      expiry_date:
        input.expiry_date ?? null,

      status:
        input.status ?? "Active",

      notes:
        input.notes ?? null,
    })
    .select(`
      *,
      employees (
        id,
        full_name,
        position,
        department_id
      )
    `)
    .single();

  if (error) {
    console.error(
      "Employee document creation error:",
      JSON.stringify(error, null, 2)
    );

    throw new Error(error.message);
  }

  return data as EmployeeDocument;
}

export async function updateEmployeeDocument(
  id: string,
  input: Partial<EmployeeDocumentInput>
): Promise<EmployeeDocument> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hr_employee_documents")
    .update({
      ...input,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .select(`
      *,
      employees (
        id,
        full_name,
        position,
        department_id
      )
    `)
    .single();

  if (error) {
    console.error(
      "Employee document update error:",
      JSON.stringify(error, null, 2)
    );

    throw new Error(error.message);
  }

  return data as EmployeeDocument;
}

export async function deleteEmployeeDocument(
  id: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("hr_employee_documents")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Employee document deletion error:",
      JSON.stringify(error, null, 2)
    );

    throw new Error(error.message);
  }
}