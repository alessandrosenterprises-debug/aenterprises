"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import Modal from "@/components/ui/modal/Modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

import {
  createEmployeeDocument,
  updateEmployeeDocument,
  uploadEmployeeDocumentFile,
  replaceEmployeeDocumentFile,
  type EmployeeDocument,
} from "../services/employee-documents.client";

interface Employee {
  id: string;
  full_name: string;
  position?: string | null;
}

interface EmployeeDocumentModalProps {
  employees: Employee[];

  mode?: "create" | "edit";

  document?: EmployeeDocument | null;

  open?: boolean;

  onClose?: () => void;
}

interface FormState {
  employee_id: string;
  document_type: string;
  document_name: string;
  description: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  notes: string;
}

const DOCUMENT_TYPES = [
  {
    label: "National ID",
    value: "National ID",
  },
  {
    label: "Passport",
    value: "Passport",
  },
  {
    label: "Employment Contract",
    value: "Employment Contract",
  },
  {
    label: "Offer Letter",
    value: "Offer Letter",
  },
  {
    label: "Academic Certificate",
    value: "Academic Certificate",
  },
  {
    label: "Professional Certificate",
    value: "Professional Certificate",
  },
  {
    label: "Medical Certificate",
    value: "Medical Certificate",
  },
  {
    label: "Bank Details",
    value: "Bank Details",
  },
  {
    label: "Tax Document",
    value: "Tax Document",
  },
  {
    label: "Other",
    value: "Other",
  },
];

const STATUS_OPTIONS = [
  {
    label: "Active",
    value: "Active",
  },
  {
    label: "Expired",
    value: "Expired",
  },
  {
    label: "Pending",
    value: "Pending",
  },
  {
    label: "Archived",
    value: "Archived",
  },
];

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

function getToday() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

function getInitialForm(
  document?: EmployeeDocument | null
): FormState {
  return {
    employee_id:
      document?.employee_id ?? "",

    document_type:
      document?.document_type ?? "",

    document_name:
      document?.document_name ?? "",

    description:
      document?.description ?? "",

    issue_date:
      document?.issue_date ?? "",

    expiry_date:
      document?.expiry_date ?? "",

    status:
      document?.status ?? "Active",

    notes:
      document?.notes ?? "",
  };
}

export default function EmployeeDocumentModal({
  employees,
  mode = "create",
  document,
  open,
  onClose,
}: EmployeeDocumentModalProps) {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [internalOpen, setInternalOpen] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [form, setForm] =
    useState<FormState>(
      getInitialForm(document)
    );

  const isOpen =
    open !== undefined
      ? open
      : internalOpen;

  const employeeOptions =
    employees.map((employee) => ({
      label: employee.position
        ? `${employee.full_name} — ${employee.position}`
        : employee.full_name,

      value: employee.id,
    }));

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(
      getInitialForm(document)
    );

    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  }, [isOpen, document]);

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function closeModal() {
    if (saving || uploading) {
      return;
    }

    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] ??
      null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        "The selected file is too large. Maximum file size is 10 MB."
      );

      event.target.value = "";
      setSelectedFile(null);

      return;
    }

    setSelectedFile(file);
  }

  function removeSelectedFile() {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.employee_id) {
      toast.error(
        "Please select an employee."
      );
      return;
    }

    if (!form.document_type) {
      toast.error(
        "Please select a document type."
      );
      return;
    }

    if (!form.document_name.trim()) {
      toast.error(
        "Please enter a document name."
      );
      return;
    }

    if (
      form.issue_date &&
      form.expiry_date &&
      form.expiry_date <
        form.issue_date
    ) {
      toast.error(
        "Expiry date cannot be before the issue date."
      );
      return;
    }

    try {
      setSaving(true);

      let filePath =
        document?.file_path ??
        null;

      /*
       * FILE UPLOAD / REPLACEMENT
       */
      if (selectedFile) {
        setUploading(true);

        if (
          mode === "edit" &&
          document?.file_path
        ) {
          filePath =
            await replaceEmployeeDocumentFile(
              document.file_path,
              selectedFile,
              form.employee_id
            );
        } else {
          const uploaded =
            await uploadEmployeeDocumentFile(
              selectedFile,
              form.employee_id
            );

          filePath =
            uploaded.filePath;
        }

        setUploading(false);
      }

      const payload = {
        employee_id:
          form.employee_id,

        document_type:
          form.document_type,

        document_name:
          form.document_name.trim(),

        description:
          form.description.trim() ||
          null,

        /*
         * file_url intentionally stays null.
         *
         * The bucket is private, so the application
         * generates signed URLs when the user opens
         * the document.
         */
        file_url: null,

        file_path: filePath,

        issue_date:
          form.issue_date || null,

        expiry_date:
          form.expiry_date || null,

        status:
          form.status,

        notes:
          form.notes.trim() || null,
      };

      if (
        mode === "edit" &&
        document?.id
      ) {
        await updateEmployeeDocument(
          document.id,
          payload
        );

        toast.success(
          "Employee document updated successfully."
        );
      } else {
        await createEmployeeDocument(
          payload
        );

        toast.success(
          "Employee document created successfully."
        );
      }

      closeModal();

      router.refresh();
    } catch (error) {
      console.error(
        "Employee document save error:",
        error
      );

      setUploading(false);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save employee document."
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  return (
    <>
      {mode === "create" && (
        <button
          type="button"
          onClick={() =>
            setInternalOpen(true)
          }
          className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
        >
          + New Document
        </button>
      )}

      <Modal
        open={isOpen}
        title={
          mode === "edit"
            ? "Edit Employee Document"
            : "New Employee Document"
        }
        onClose={closeModal}
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* ==================================================
              EMPLOYEE
          ================================================== */}

          <Select
            label="Employee *"
            placeholder="Select Employee"
            options={employeeOptions}
            value={form.employee_id}
            onChange={(event) =>
              updateField(
                "employee_id",
                event.target.value
              )
            }
          />

          {/* ==================================================
              DOCUMENT TYPE
          ================================================== */}

          <Select
            label="Document Type *"
            placeholder="Select Document Type"
            options={DOCUMENT_TYPES}
            value={form.document_type}
            onChange={(event) =>
              updateField(
                "document_type",
                event.target.value
              )
            }
          />

          {/* ==================================================
              DOCUMENT NAME
          ================================================== */}

          <Input
            label="Document Name *"
            type="text"
            placeholder="e.g. Employment Contract 2026"
            value={form.document_name}
            onChange={(event) =>
              updateField(
                "document_name",
                event.target.value
              )
            }
          />

          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          <Textarea
            label="Description"
            placeholder="Describe this document..."
            value={form.description}
            onChange={(event) =>
              updateField(
                "description",
                event.target.value
              )
            }
          />

          {/* ==================================================
              FILE ATTACHMENT
          ================================================== */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Attach File
            </label>

            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-[#D4AF37] hover:bg-slate-100">
              <input
                ref={fileInputRef}
                type="file"
                onChange={
                  handleFileChange
                }
                disabled={
                  saving || uploading
                }
                className="block w-full cursor-pointer text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#03162F] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#0A2852]"
              />

              <p className="mt-2 text-xs text-slate-500">
                Maximum file size: 10 MB.
                PDF, Word documents,
                images and other standard
                files are supported.
              </p>

              {/* CURRENT FILE */}

              {!selectedFile &&
                document?.file_path && (
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">
                        Existing attachment
                      </p>

                      <p className="mt-1 text-xs text-blue-700">
                        Select a new file above
                        to replace it.
                      </p>
                    </div>
                  </div>
                )}

              {/* NEW FILE */}

              {selectedFile && (
                <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-emerald-900">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-xs text-emerald-700">
                      {(
                        selectedFile.size /
                        (1024 * 1024)
                      ).toFixed(2)}{" "}
                      MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      removeSelectedFile
                    }
                    disabled={
                      saving ||
                      uploading
                    }
                    className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              )}

              {uploading && (
                <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <p className="text-sm font-semibold text-blue-900">
                    Uploading document...
                  </p>

                  <p className="mt-1 text-xs text-blue-700">
                    Please wait while the file
                    is securely uploaded.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ==================================================
              DATES
          ================================================== */}

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="Issue Date"
              type="date"
              value={form.issue_date}
              onChange={(event) =>
                updateField(
                  "issue_date",
                  event.target.value
                )
              }
            />

            <Input
              label="Expiry Date"
              type="date"
              value={form.expiry_date}
              onChange={(event) =>
                updateField(
                  "expiry_date",
                  event.target.value
                )
              }
            />
          </div>

          {/* ==================================================
              STATUS
          ================================================== */}

          <Select
            label="Status"
            placeholder="Select Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(event) =>
              updateField(
                "status",
                event.target.value
              )
            }
          />

          {/* ==================================================
              NOTES
          ================================================== */}

          <Textarea
            label="Notes"
            placeholder="Additional notes..."
            value={form.notes}
            onChange={(event) =>
              updateField(
                "notes",
                event.target.value
              )
            }
          />

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={closeModal}
              disabled={
                saving || uploading
              }
              className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <SubmitButton
              loading={
                saving || uploading
              }
            >
              {uploading
                ? "Uploading..."
                : mode === "edit"
                  ? "Save Changes"
                  : "Create Document"}
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}