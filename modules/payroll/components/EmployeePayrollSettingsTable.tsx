"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { exportToCSV } from "@/lib/export/csv";
import { exportToExcel } from "@/lib/export/excel";
import { exportToPDF } from "@/lib/export/pdf";

import {
  AEDataTable,
  AEDataTableToolbar,
} from "@/components/enterprise/data-table";

import { AEStatusBadge } from "@/components/enterprise/badge";
import { AERowActions } from "@/components/enterprise/actions";
import { AEDetailsModal } from "@/components/enterprise/details";
import { AEConfirmDialog } from "@/components/enterprise";
import {
  deleteEmployeePayrollSettings,
} from "@/modules/payroll/services/employee-payroll-settings.client";
import EmployeePayrollSettingsModal from "./EmployeePayrollSettingsModal";

import type {
  EmployeePayrollSettings,
} from "@/modules/payroll/types/payroll.types";

interface Employee {
  id: string;
  full_name: string;
  phone?: string | null;
  position?: string | null;
  salary?: number | null;
}

interface EmployeePayrollSettingsTableProps {
  settings: EmployeePayrollSettings[];
  employees: Employee[];
}

export default function EmployeePayrollSettingsTable({
  settings,
  employees,
}: EmployeePayrollSettingsTableProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const [selectedSettings, setSelectedSettings] =
    useState<EmployeePayrollSettings | null>(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [editOpen, setEditOpen] =
    useState(false);
    const [deleteOpen, setDeleteOpen] =
  useState(false);

const [deleting, setDeleting] =
  useState(false);

  /*
   * Employees who do not yet have payroll settings.
   * These are useful because they can be configured
   * directly from this screen.
   */
  const employeesWithoutSettings = useMemo(() => {
    const configuredEmployeeIds = new Set(
      settings.map(
        (setting) => setting.employee_id
      )
    );

    return employees.filter(
      (employee) =>
        !configuredEmployeeIds.has(employee.id)
    );
  }, [employees, settings]);

  const filteredSettings = useMemo(() => {
    if (!search.trim()) {
      return settings;
    }

    const query = search.toLowerCase();

    return settings.filter((setting) => {
      const employee =
        setting.employees;

      return (
        employee?.full_name
          ?.toLowerCase()
          .includes(query) ||
        employee?.position
          ?.toLowerCase()
          .includes(query) ||
        setting.bank_name
          ?.toLowerCase()
          .includes(query) ||
        setting.payment_method
          ?.toLowerCase()
          .includes(query) ||
        setting.tax_number
          ?.toLowerCase()
          .includes(query) ||
        setting.napsa_number
          ?.toLowerCase()
          .includes(query) ||
        setting.nhima_number
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [settings, search]);
  
  async function handleDelete() {
  if (!selectedSettings) return;

  try {
    setDeleting(true);

    await deleteEmployeePayrollSettings(
      selectedSettings.id
    );

    toast.success(
      "Employee payroll settings deleted successfully."
    );

    setDeleteOpen(false);
    setSelectedSettings(null);

    router.refresh();
  } catch (error) {
    console.error(
      "Payroll settings delete error:",
      error
    );

    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to delete employee payroll settings."
    );
  } finally {
    setDeleting(false);
  }
}

  function formatCurrency(
    value: number | null | undefined
  ) {
    return `K${Number(value ?? 0).toLocaleString(
      "en-ZM",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  function handleExportCSV() {
    const rows = settings.map(
      (setting) => ({
        Employee:
          setting.employees?.full_name ?? "",

        Position:
          setting.employees?.position ?? "",

        Salary: formatCurrency(
          setting.employees?.salary
        ),

        "Payment Method":
          setting.payment_method,

        Bank:
          setting.bank_name ?? "",

        "Account Number":
          setting.bank_account_number ?? "",

        "Tax Number":
          setting.tax_number ?? "",

        "NAPSA Number":
          setting.napsa_number ?? "",

        "NHIMA Number":
          setting.nhima_number ?? "",

        "Loan Deduction":
          setting.loan_deduction_enabled
            ? "Enabled"
            : "Disabled",
      })
    );

    exportToCSV(
      "employee-payroll-settings",
      rows
    );
  }

  function handleExportExcel() {
    const rows = settings.map(
      (setting) => ({
        Employee:
          setting.employees?.full_name ?? "",

        Position:
          setting.employees?.position ?? "",

        Salary: formatCurrency(
          setting.employees?.salary
        ),

        "Payment Method":
          setting.payment_method,

        Bank:
          setting.bank_name ?? "",

        "Account Number":
          setting.bank_account_number ?? "",

        "Tax Number":
          setting.tax_number ?? "",

        "NAPSA Number":
          setting.napsa_number ?? "",

        "NHIMA Number":
          setting.nhima_number ?? "",

        "Loan Deduction":
          setting.loan_deduction_enabled
            ? "Enabled"
            : "Disabled",
      })
    );

    exportToExcel(
      "employee-payroll-settings",
      rows
    );
  }

  function handleExportPDF() {
    const rows = settings.map(
      (setting) => ({
        Employee:
          setting.employees?.full_name ?? "",

        Position:
          setting.employees?.position ?? "",

        Salary: formatCurrency(
          setting.employees?.salary
        ),

        "Payment Method":
          setting.payment_method,

        Bank:
          setting.bank_name ?? "",

        "Account Number":
          setting.bank_account_number ?? "",

        "Tax Number":
          setting.tax_number ?? "",

        "NAPSA Number":
          setting.napsa_number ?? "",

        "NHIMA Number":
          setting.nhima_number ?? "",

        "Loan Deduction":
          setting.loan_deduction_enabled
            ? "Enabled"
            : "Disabled",
      })
    );

    exportToPDF(
      "Employee Payroll Settings Report",
      rows
    );
  }

  function getLoanStatus(
    enabled: boolean
  ) {
    return enabled
      ? "Enabled"
      : "Disabled";
  }

  return (
    <>
      <AEDataTable
        toolbar={
          <AEDataTableToolbar
            search={search}
            setSearch={setSearch}
            onCSV={handleExportCSV}
            onExcel={handleExportExcel}
            onPDF={handleExportPDF}
          >
            <EmployeePayrollSettingsModal
              employees={employees}
            />
          </AEDataTableToolbar>
        }
      >
        <thead>
          <tr className="border-b">
            <th className="px-6 py-4 text-left font-semibold">
              Employee
            </th>

            <th className="px-6 py-4 text-left font-semibold">
              Position
            </th>

            <th className="px-6 py-4 text-left font-semibold">
              Salary
            </th>

            <th className="px-6 py-4 text-left font-semibold">
              Payment
            </th>

            <th className="px-6 py-4 text-left font-semibold">
              Bank
            </th>

            <th className="px-6 py-4 text-left font-semibold">
              Loan
            </th>

            <th className="px-6 py-4 text-center font-semibold">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredSettings.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="py-12 text-center text-slate-500"
              >
                {search
                  ? "No matching payroll settings found."
                  : "No employee payroll settings configured yet."}
              </td>
            </tr>
          ) : (
            filteredSettings.map(
              (setting) => (
                <tr
                  key={setting.id}
                  className="border-b transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {setting.employees
                          ?.full_name ??
                          "Unknown Employee"}
                      </p>

                      {setting.employees
                        ?.phone && (
                        <p className="mt-1 text-xs text-slate-500">
                          {
                            setting
                              .employees
                              .phone
                          }
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {setting.employees
                      ?.position ??
                      "—"}
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-900">
                    {formatCurrency(
                      setting.employees
                        ?.salary
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {setting.payment_method}
                  </td>

                  <td className="px-6 py-4">
                    {setting.bank_name ??
                      "—"}
                  </td>

                  <td className="px-6 py-4">
                    <AEStatusBadge
                      status={getLoanStatus(
                        setting.loan_deduction_enabled
                      )}
                    />
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <AERowActions
  onView={() => {
    setSelectedSettings(setting);
    setDetailsOpen(true);
  }}
  onEdit={() => {
    setSelectedSettings(setting);
    setEditOpen(true);
  }}
  onDelete={() => {
  console.log("DELETE BUTTON CLICKED", setting);
  setSelectedSettings(setting);
  setDeleteOpen(true);
}}
/>
                    </div>
                  </td>
                </tr>
              )
            )
          )}
        </tbody>
      </AEDataTable>

      {/* Details */}
      <AEDetailsModal
        open={detailsOpen}
        title="Employee Payroll Settings"
        onClose={() => {
          setDetailsOpen(false);
          setSelectedSettings(null);
        }}
      >
        {selectedSettings && (
          <div className="grid gap-6">
            <div>
              <p className="text-sm text-slate-500">
                Employee
              </p>

              <p className="font-semibold text-slate-900">
                {
                  selectedSettings
                    .employees
                    ?.full_name
                }
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">
                  Position
                </p>

                <p className="font-semibold">
                  {
                    selectedSettings
                      .employees
                      ?.position ??
                    "—"
                  }
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Salary
                </p>

                <p className="font-semibold">
                  {formatCurrency(
                    selectedSettings
                      .employees
                      ?.salary
                  )}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Payment Method
              </p>

              <p className="font-semibold">
                {
                  selectedSettings
                    .payment_method
                }
              </p>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <h3 className="font-bold text-[#03162F]">
                Bank Details
              </h3>

              <div className="mt-4 grid gap-4">
                <div>
                  <p className="text-sm text-slate-500">
                    Bank
                  </p>

                  <p className="font-medium">
                    {
                      selectedSettings
                        .bank_name ??
                      "—"
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Account Name
                  </p>

                  <p className="font-medium">
                    {
                      selectedSettings
                        .bank_account_name ??
                      "—"
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Account Number
                  </p>

                  <p className="font-medium">
                    {
                      selectedSettings
                        .bank_account_number ??
                      "—"
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Branch Code
                  </p>

                  <p className="font-medium">
                    {
                      selectedSettings
                        .branch_code ??
                      "—"
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <h3 className="font-bold text-[#03162F]">
                Statutory Numbers
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">
                    Tax Number
                  </p>

                  <p className="font-medium">
                    {
                      selectedSettings
                        .tax_number ??
                      "—"
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    NAPSA Number
                  </p>

                  <p className="font-medium">
                    {
                      selectedSettings
                        .napsa_number ??
                      "—"
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    NHIMA Number
                  </p>

                  <p className="font-medium">
                    {
                      selectedSettings
                        .nhima_number ??
                      "—"
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Pension Number
                  </p>

                  <p className="font-medium">
                    {
                      selectedSettings
                        .pension_number ??
                      "—"
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <h3 className="font-bold text-[#03162F]">
                Default Deductions
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">
                    Loan Deduction
                  </p>

                  <AEStatusBadge
                    status={getLoanStatus(
                      selectedSettings.loan_deduction_enabled
                    )}
                  />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Default Loan
                  </p>

                  <p className="font-medium">
                    {formatCurrency(
                      selectedSettings
                        .default_loan_deduction
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Default Advance
                  </p>

                  <p className="font-medium">
                    {formatCurrency(
                      selectedSettings
                        .default_advance_deduction
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </AEDetailsModal>

      {/* Edit */}
      <EmployeePayrollSettingsModal
        employees={employees}
        mode="edit"
        settings={
          selectedSettings ??
          undefined
        }
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedSettings(null);
        }}
      />

<AEConfirmDialog
  open={deleteOpen}
  title="Delete Payroll Settings"
  message={`Are you sure you want to delete the payroll settings for "${selectedSettings?.employees?.full_name ?? "this employee"}"? This action cannot be undone.`}
  loading={deleting}
  onCancel={() => {
    setDeleteOpen(false);
    setSelectedSettings(null);
  }}
  onConfirm={handleDelete}
/>

    </>
  );
}