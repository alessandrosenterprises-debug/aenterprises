import { supabase } from "@/lib/supabase/client";

export const EMPLOYEE_DOCUMENTS_BUCKET =
  "employee-documents";

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

/* ============================================================
   CREATE DOCUMENT
============================================================ */

export async function createEmployeeDocument(
  input: EmployeeDocumentInput
): Promise<EmployeeDocument> {
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
        position
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as EmployeeDocument;
}

/* ============================================================
   UPDATE DOCUMENT
============================================================ */

export async function updateEmployeeDocument(
  id: string,
  input: Partial<EmployeeDocumentInput>
): Promise<EmployeeDocument> {
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
        position
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as EmployeeDocument;
}

/* ============================================================
   DELETE DOCUMENT
============================================================ */

export async function deleteEmployeeDocument(
  id: string,
  filePath?: string | null
): Promise<void> {
  if (filePath) {
    const { error: storageError } =
      await supabase.storage
        .from(
          EMPLOYEE_DOCUMENTS_BUCKET
        )
        .remove([filePath]);

    if (storageError) {
      throw new Error(
        `Failed to remove document file: ${storageError.message}`
      );
    }
  }

  const { error } = await supabase
    .from("hr_employee_documents")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

/* ============================================================
   UPLOAD DOCUMENT FILE
============================================================ */

export async function uploadEmployeeDocumentFile(
  file: File,
  employeeId: string
): Promise<{
  filePath: string;
}> {
  if (!file) {
    throw new Error(
      "Please select a file."
    );
  }

  if (!employeeId) {
    throw new Error(
      "Employee is required before uploading a document."
    );
  }

  /*
   * Keep the upload reasonably controlled.
   * 10 MB is sufficient for PDFs, images and
   * normal HR documents.
   */
  const MAX_FILE_SIZE =
    10 * 1024 * 1024;

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "The selected file is too large. Maximum file size is 10 MB."
    );
  }

  const extension =
    file.name.includes(".")
      ? file.name
          .split(".")
          .pop()
          ?.toLowerCase() ?? ""
      : "";

  const safeExtension =
    extension.replace(
      /[^a-z0-9]/g,
      ""
    );

  const uniqueId =
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  /*
   * Files are organised by employee:
   *
   * employee-documents/
   *   employee-id/
   *     uuid.pdf
   */
  const filePath =
    safeExtension
      ? `${employeeId}/${uniqueId}.${safeExtension}`
      : `${employeeId}/${uniqueId}`;

  const { error } =
    await supabase.storage
      .from(
        EMPLOYEE_DOCUMENTS_BUCKET
      )
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType:
          file.type ||
          "application/octet-stream",
      });

  if (error) {
    throw new Error(
      `File upload failed: ${error.message}`
    );
  }

  return {
    filePath,
  };
}

/* ============================================================
   DELETE STORAGE FILE
============================================================ */

export async function deleteEmployeeDocumentFile(
  filePath: string
): Promise<void> {
  if (!filePath) {
    return;
  }

  const { error } =
    await supabase.storage
      .from(
        EMPLOYEE_DOCUMENTS_BUCKET
      )
      .remove([filePath]);

  if (error) {
    throw new Error(
      `Failed to delete document file: ${error.message}`
    );
  }
}

/* ============================================================
   CREATE SIGNED URL
============================================================ */

export async function createEmployeeDocumentSignedUrl(
  filePath: string,
  expiresIn = 60 * 10
): Promise<string> {
  if (!filePath) {
    throw new Error(
      "Document file path is missing."
    );
  }

  const { data, error } =
    await supabase.storage
      .from(
        EMPLOYEE_DOCUMENTS_BUCKET
      )
      .createSignedUrl(
        filePath,
        expiresIn
      );

  if (error) {
    throw new Error(
      `Failed to create document URL: ${error.message}`
    );
  }

  if (!data?.signedUrl) {
    throw new Error(
      "Supabase did not return a document URL."
    );
  }

  return data.signedUrl;
}

/* ============================================================
   REPLACE DOCUMENT FILE
============================================================ */

export async function replaceEmployeeDocumentFile(
  oldFilePath: string | null | undefined,
  newFile: File,
  employeeId: string
): Promise<string> {
  const uploaded =
    await uploadEmployeeDocumentFile(
      newFile,
      employeeId
    );

  /*
   * Upload the new file first.
   * This prevents losing the old document if
   * the new upload fails.
   */
  if (oldFilePath) {
    const { error } =
      await supabase.storage
        .from(
          EMPLOYEE_DOCUMENTS_BUCKET
        )
        .remove([oldFilePath]);

    if (error) {
      /*
       * The new file exists, so clean it up
       * if removing the old file fails.
       */
      await supabase.storage
        .from(
          EMPLOYEE_DOCUMENTS_BUCKET
        )
        .remove([
          uploaded.filePath,
        ]);

      throw new Error(
        `Failed to replace old document file: ${error.message}`
      );
    }
  }

  return uploaded.filePath;
}