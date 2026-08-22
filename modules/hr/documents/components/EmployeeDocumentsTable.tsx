"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Pencil,
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  X,
  ExternalLink,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import EmployeeDocumentModal from "./EmployeeDocumentModal";

import {
  deleteEmployeeDocument,
  createEmployeeDocumentSignedUrl,
  type EmployeeDocument,
} from "../services/employee-documents.client";

interface Employee {
  id: string;
  full_name: string;
  position?: string | null;
}

interface EmployeeDocumentTableProps {
  documents: EmployeeDocument[];
  employees: Employee[];
}

function formatDate(
  date: string | null
) {
  if (!date) {
    return "—";
  }

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString("en-ZM", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getExpiryState(
  document: EmployeeDocument
) {
  if (!document.expiry_date) {
    return "no-expiry";
  }

  const expiry = new Date(
    `${document.expiry_date}T00:00:00`
  );

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const difference =
    expiry.getTime() -
    today.getTime();

  const daysRemaining =
    Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );

  if (daysRemaining < 0) {
    return "expired";
  }

  if (daysRemaining <= 30) {
    return "expiring";
  }

  return "valid";
}

function statusClass(
  status: string,
  expiryState: string
) {
  if (expiryState === "expired") {
    return "bg-red-100 text-red-700";
  }

  if (expiryState === "expiring") {
    return "bg-amber-100 text-amber-700";
  }

  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700";

    case "Expired":
      return "bg-red-100 text-red-700";

    case "Pending":
      return "bg-amber-100 text-amber-700";

    case "Archived":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function statusLabel(
  status: string,
  expiryState: string
) {
  if (expiryState === "expired") {
    return "Expired";
  }

  if (expiryState === "expiring") {
    return "Expiring Soon";
  }

  return status;
}

export default function EmployeeDocumentsTable({
  documents,
  employees,
}: EmployeeDocumentTableProps) {
  const router = useRouter();

  const [search, setSearch] =
    useState("");

  const [employeeFilter, setEmployeeFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [selectedDocument, setSelectedDocument] =
    useState<EmployeeDocument | null>(
      null
    );

  const [editOpen, setEditOpen] =
    useState(false);

  const [viewOpen, setViewOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [openingFileId, setOpeningFileId] =
    useState<string | null>(null);

  const [downloadingFileId, setDownloadingFileId] =
    useState<string | null>(null);

  const filteredDocuments =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return documents.filter(
        (document) => {
          const employee =
            document.employees;

          const matchesSearch =
            !query ||
            document.document_name
              .toLowerCase()
              .includes(query) ||
            document.document_type
              .toLowerCase()
              .includes(query) ||
            employee?.full_name
              ?.toLowerCase()
              .includes(query) ||
            employee?.position
              ?.toLowerCase()
              .includes(query);

          const matchesEmployee =
            !employeeFilter ||
            document.employee_id ===
              employeeFilter;

          const expiryState =
            getExpiryState(
              document
            );

          const matchesStatus =
            !statusFilter ||
            (statusFilter ===
              "Expiring"
              ? expiryState ===
                "expiring"
              : statusFilter ===
                "Expired"
              ? expiryState ===
                "expired"
              : statusFilter ===
                "Active"
              ? document.status ===
                  "Active" &&
                expiryState !==
                  "expired"
              : document.status ===
                statusFilter);

          return (
            matchesSearch &&
            matchesEmployee &&
            matchesStatus
          );
        }
      );
    }, [
      documents,
      search,
      employeeFilter,
      statusFilter,
    ]);

  const activeCount =
    documents.filter(
      (document) =>
        document.status === "Active" &&
        getExpiryState(document) !==
          "expired"
    ).length;

  const expiringCount =
    documents.filter(
      (document) =>
        getExpiryState(document) ===
        "expiring"
    ).length;

  const expiredCount =
    documents.filter(
      (document) =>
        getExpiryState(document) ===
        "expired"
    ).length;

  const noExpiryCount =
    documents.filter(
      (document) =>
        !document.expiry_date
    ).length;

  function closeDialogs() {
    setViewOpen(false);
    setEditOpen(false);
    setDeleteOpen(false);
    setSelectedDocument(null);
  }

  async function handleDelete() {
    if (!selectedDocument) {
      return;
    }

    try {
      setDeleting(true);

      await deleteEmployeeDocument(
        selectedDocument.id,
        selectedDocument.file_path
      );

      toast.success(
        "Employee document deleted successfully."
      );

      closeDialogs();

      router.refresh();
    } catch (error) {
      console.error(
        "Employee document deletion error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete employee document."
      );
    } finally {
      setDeleting(false);
    }
  }

  async function openDocument(
    document: EmployeeDocument
  ) {
    if (!document.file_path) {
      toast.error(
        "No file is attached to this document."
      );
      return;
    }

    try {
      setOpeningFileId(
        document.id
      );

      const signedUrl =
        await createEmployeeDocumentSignedUrl(
          document.file_path
        );

      window.open(
        signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error(
        "Employee document open error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to open document."
      );
    } finally {
      setOpeningFileId(null);
    }
  }

  async function downloadDocument(
    document: EmployeeDocument
  ) {
    if (!document.file_path) {
      toast.error(
        "No file is attached to this document."
      );
      return;
    }

    try {
      setDownloadingFileId(
        document.id
      );

      const signedUrl =
        await createEmployeeDocumentSignedUrl(
          document.file_path,
          60 * 10
        );

      const response =
        await fetch(signedUrl);

      if (!response.ok) {
        throw new Error(
          "Failed to download the document."
        );
      }

      const blob =
        await response.blob();

      const blobUrl =
  window.URL.createObjectURL(
    blob
  );

const anchor =
  window.document.createElement("a");

anchor.href = blobUrl;

anchor.download =
  document.document_name ||
  "employee-document";

window.document.body.appendChild(
  anchor
);

anchor.click();

anchor.remove();

window.URL.revokeObjectURL(
  blobUrl
);
    } catch (error) {
      console.error(
        "Employee document download error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to download document."
      );
    } finally {
      setDownloadingFileId(
        null
      );
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}

        <div className="border-b border-slate-200 p-6">
          <div>
            <h2 className="text-xl font-bold text-[#03162F]">
              Employee Documents
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage employee contracts,
              certificates, identification
              and other HR documents.
            </p>
          </div>

          {/* SUMMARY */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2
                  size={20}
                  className="text-emerald-600"
                />

                <p className="text-sm font-medium text-emerald-700">
                  Active
                </p>
              </div>

              <p className="mt-2 text-2xl font-bold text-emerald-800">
                {activeCount}
              </p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <div className="flex items-center gap-3">
                <Clock3
                  size={20}
                  className="text-amber-600"
                />

                <p className="text-sm font-medium text-amber-700">
                  Expiring Soon
                </p>
              </div>

              <p className="mt-2 text-2xl font-bold text-amber-800">
                {expiringCount}
              </p>
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle
                  size={20}
                  className="text-red-600"
                />

                <p className="text-sm font-medium text-red-700">
                  Expired
                </p>
              </div>

              <p className="mt-2 text-2xl font-bold text-red-800">
                {expiredCount}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <FileText
                  size={20}
                  className="text-slate-600"
                />

                <p className="text-sm font-medium text-slate-600">
                  No Expiry
                </p>
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-800">
                {noExpiryCount}
              </p>
            </div>
          </div>

          {/* FILTERS */}

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_220px_180px]">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search employee, document name or type..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#03162F] focus:ring-2 focus:ring-[#03162F]/10"
            />

            <select
              value={employeeFilter}
              onChange={(event) =>
                setEmployeeFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#03162F]"
            >
              <option value="">
                All Employees
              </option>

              {employees.map(
                (employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.full_name}
                  </option>
                )
              )}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#03162F]"
            >
              <option value="">
                All Statuses
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Expiring">
                Expiring Soon
              </option>

              <option value="Expired">
                Expired
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Archived">
                Archived
              </option>
            </select>
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Employee
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Document
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Issue Date
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Expiry Date
                </th>

                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Status
                </th>

                <th className="px-6 py-4 text-center font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredDocuments.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center"
                  >
                    <FileText
                      size={40}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 font-semibold text-slate-700">
                      {search ||
                      employeeFilter ||
                      statusFilter
                        ? "No matching documents found."
                        : "No employee documents yet."}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Add an employee document
                      to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map(
                  (document) => {
                    const expiryState =
                      getExpiryState(
                        document
                      );

                    return (
                      <tr
                        key={document.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        {/* EMPLOYEE */}

                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">
                            {document
                              .employees
                              ?.full_name ??
                              "Unknown Employee"}
                          </p>

                          {document
                            .employees
                            ?.position && (
                            <p className="mt-1 text-xs text-slate-500">
                              {
                                document
                                  .employees
                                  .position
                              }
                            </p>
                          )}
                        </td>

                        {/* DOCUMENT */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <FileText
                                size={20}
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {
                                  document.document_name
                                }
                              </p>

                              <div className="mt-1 flex items-center gap-2">
                                <p className="text-xs text-slate-500">
                                  {
                                    document.document_type
                                  }
                                </p>

                                {document.file_path && (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                    Attached
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* ISSUE DATE */}

                        <td className="px-6 py-4 text-slate-600">
                          {formatDate(
                            document.issue_date
                          )}
                        </td>

                        {/* EXPIRY */}

                        <td className="px-6 py-4">
                          <span
                            className={
                              expiryState ===
                              "expired"
                                ? "font-semibold text-red-600"
                                : expiryState ===
                                  "expiring"
                                ? "font-semibold text-amber-600"
                                : "text-slate-600"
                            }
                          >
                            {formatDate(
                              document.expiry_date
                            )}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                              document.status,
                              expiryState
                            )}`}
                          >
                            {statusLabel(
                              document.status,
                              expiryState
                            )}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            {/* VIEW DETAILS */}

                            <button
                              type="button"
                              title="View Details"
                              onClick={() => {
                                setSelectedDocument(
                                  document
                                );

                                setViewOpen(
                                  true
                                );
                              }}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye
                                size={18}
                              />
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              title="Edit"
                              onClick={() => {
                                setSelectedDocument(
                                  document
                                );

                                setEditOpen(
                                  true
                                );
                              }}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                            >
                              <Pencil
                                size={18}
                              />
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              title="Delete"
                              onClick={() => {
                                setSelectedDocument(
                                  document
                                );

                                setDeleteOpen(
                                  true
                                );
                              }}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2
                                size={18}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* EDIT */}

      <EmployeeDocumentModal
        employees={employees}
        mode="edit"
        document={
          selectedDocument ??
          undefined
        }
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedDocument(
            null
          );
        }}
      />

      {/* VIEW */}

      {viewOpen &&
        selectedDocument && (
          <DocumentDetails
            document={
              selectedDocument
            }
            openingFileId={
              openingFileId
            }
            downloadingFileId={
              downloadingFileId
            }
            onOpenDocument={
              openDocument
            }
            onDownloadDocument={
              downloadDocument
            }
            onClose={() => {
              setViewOpen(false);
              setSelectedDocument(
                null
              );
            }}
          />
        )}

      {/* DELETE */}

      {deleteOpen &&
        selectedDocument && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-[#03162F]">
                    Delete Document
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    This action cannot be
                    undone.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!deleting) {
                      setDeleteOpen(
                        false
                      );

                      setSelectedDocument(
                        null
                      );
                    }
                  }}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <p className="text-slate-600">
                  Are you sure you want to
                  delete{" "}
                  <span className="font-semibold text-slate-900">
                    "
                    {
                      selectedDocument.document_name
                    }
                    "
                  </span>
                  ?
                </p>

                {selectedDocument.file_path && (
                  <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                    The attached file will
                    also be permanently
                    removed from secure
                    storage.
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => {
                      setDeleteOpen(
                        false
                      );

                      setSelectedDocument(
                        null
                      );
                    }}
                    className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={deleting}
                    onClick={
                      handleDelete
                    }
                    className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleting
                      ? "Deleting..."
                      : "Delete Document"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
}

/* ============================================================
   DOCUMENT DETAILS
============================================================ */

function DocumentDetails({
  document,
  openingFileId,
  downloadingFileId,
  onOpenDocument,
  onDownloadDocument,
  onClose,
}: {
  document: EmployeeDocument;

  openingFileId: string | null;

  downloadingFileId: string | null;

  onOpenDocument: (
    document: EmployeeDocument
  ) => Promise<void>;

  onDownloadDocument: (
    document: EmployeeDocument
  ) => Promise<void>;

  onClose: () => void;
}) {
  const expiryState =
    getExpiryState(document);

  const opening =
    openingFileId ===
    document.id;

  const downloading =
    downloadingFileId ===
    document.id;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-[#03162F]">
              Document Details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Complete employee document
              information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-6 p-6">
          <Detail
            label="Employee"
            value={
              document.employees
                ?.full_name ??
              "Unknown Employee"
            }
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Detail
              label="Document Type"
              value={
                document.document_type
              }
            />

            <Detail
              label="Document Name"
              value={
                document.document_name
              }
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Detail
              label="Issue Date"
              value={formatDate(
                document.issue_date
              )}
            />

            <Detail
              label="Expiry Date"
              value={formatDate(
                document.expiry_date
              )}
            />
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Status
            </p>

            <span
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                document.status,
                expiryState
              )}`}
            >
              {statusLabel(
                document.status,
                expiryState
              )}
            </span>
          </div>

          <Detail
            label="Description"
            value={
              document.description ||
              "No description provided."
            }
          />

          <Detail
            label="Notes"
            value={
              document.notes ||
              "No notes provided."
            }
          />

          {/* FILE */}

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                <FileText
                  size={20}
                />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-blue-900">
                  Document Attachment
                </p>

                {document.file_path ? (
                  <p className="mt-1 break-all text-xs text-blue-700">
                    Secure attachment available
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-blue-700">
                    No file attached.
                  </p>
                )}
              </div>
            </div>

            {document.file_path && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={
                    opening ||
                    downloading
                  }
                  onClick={() =>
                    onOpenDocument(
                      document
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ExternalLink
                    size={17}
                  />

                  {opening
                    ? "Opening..."
                    : "Open Document"}
                </button>

                <button
                  type="button"
                  disabled={
                    opening ||
                    downloading
                  }
                  onClick={() =>
                    onDownloadDocument(
                      document
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download
                    size={17}
                  />

                  {downloading
                    ? "Downloading..."
                    : "Download"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#03162F] px-6 py-3 font-semibold text-white hover:bg-[#0A2852]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}