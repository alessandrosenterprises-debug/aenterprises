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
import { AEConfirmDialog } from "@/components/enterprise";
import { AEDetailsModal } from "@/components/enterprise/details";

import PayrollPeriodModal from "./PayrollPeriodModal";

import {
  deletePayrollPeriod,
} from "@/modules/payroll/services/payroll-period.client";

import type {
  PayrollPeriod,
} from "@/modules/payroll/types/payroll.types";

interface PayrollPeriodsTableProps {
  periods: PayrollPeriod[];
}

export default function PayrollPeriodsTable({
  periods,
}: PayrollPeriodsTableProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const [selectedPeriod, setSelectedPeriod] =
    useState<PayrollPeriod | null>(null);

  const [periodToDelete, setPeriodToDelete] =
    useState<PayrollPeriod | null>(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [editOpen, setEditOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  async function handleDelete() {
    if (!periodToDelete) return;

    try {
      setDeleting(true);

      await deletePayrollPeriod(
        periodToDelete.id
      );

      toast.success(
        "Payroll period deleted successfully."
      );

      setDeleteOpen(false);
      setPeriodToDelete(null);

      router.refresh();
    } catch (error) {
      console.error(
        "Payroll period delete error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete payroll period."
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleExportCSV() {
    const rows = periods.map((period) => ({
      Period: period.name,
      "Period Start": period.period_start,
      "Period End": period.period_end,
      "Payment Date":
        period.payment_date ?? "",
      Status: period.status,
      Notes: period.notes ?? "",
    }));

    exportToCSV(
      "payroll-periods",
      rows
    );
  }

  function handleExportExcel() {
    const rows = periods.map((period) => ({
      Period: period.name,
      "Period Start": period.period_start,
      "Period End": period.period_end,
      "Payment Date":
        period.payment_date ?? "",
      Status: period.status,
      Notes: period.notes ?? "",
    }));

    exportToExcel(
      "payroll-periods",
      rows
    );
  }

  function handleExportPDF() {
    const rows = periods.map((period) => ({
      Period: period.name,
      "Period Start": period.period_start,
      "Period End": period.period_end,
      "Payment Date":
        period.payment_date ?? "",
      Status: period.status,
      Notes: period.notes ?? "",
    }));

    exportToPDF(
      "Payroll Period Report",
      rows
    );
  }

  const filteredPeriods = useMemo(() => {
    if (!search.trim()) {
      return periods;
    }

    const query = search.toLowerCase();

    return periods.filter(
      (period) =>
        period.name
          ?.toLowerCase()
          .includes(query) ||
        period.status
          ?.toLowerCase()
          .includes(query) ||
        period.notes
          ?.toLowerCase()
          .includes(query)
    );
  }, [periods, search]);

  function formatDate(
    value: string | null
  ) {
    if (!value) return "—";

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString();
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
            <PayrollPeriodModal />
          </AEDataTableToolbar>
        }
      >
        <thead>
          <tr className="border-b">
            <th className="px-6 py-4 text-left font-semibold">
              Payroll Period
            </th>

            <th className="px-6 py-4 text-left font-semibold">
              Start
            </th>

            <th className="px-6 py-4 text-left font-semibold">
              End
            </th>

            <th className="px-6 py-4 text-left font-semibold">
              Payment Date
            </th>

            <th className="px-6 py-4 text-left font-semibold">
              Status
            </th>

            <th className="px-6 py-4 text-center font-semibold">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredPeriods.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="py-12 text-center text-slate-500"
              >
                {search
                  ? "No matching payroll periods found."
                  : "No payroll periods yet."}
              </td>
            </tr>
          ) : (
            filteredPeriods.map((period) => (
              <tr
                key={period.id}
                className="border-b transition hover:bg-slate-50"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {period.name}
                    </p>

                    {period.notes && (
                      <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                        {period.notes}
                      </p>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4">
                  {formatDate(
                    period.period_start
                  )}
                </td>

                <td className="px-6 py-4">
                  {formatDate(
                    period.period_end
                  )}
                </td>

                <td className="px-6 py-4">
                  {formatDate(
                    period.payment_date
                  )}
                </td>

                <td className="px-6 py-4">
                  <AEStatusBadge
                    status={period.status}
                  />
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <AERowActions
                      onView={() => {
                        setSelectedPeriod(
                          period
                        );

                        setDetailsOpen(true);
                      }}
                      onEdit={() => {
                        setSelectedPeriod(
                          period
                        );

                        setEditOpen(true);
                      }}
                      onDelete={() => {
                        setPeriodToDelete(
                          period
                        );

                        setDeleteOpen(true);
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </AEDataTable>

      <AEDetailsModal
        open={detailsOpen}
        title="Payroll Period Details"
        onClose={() => {
          setDetailsOpen(false);
          setSelectedPeriod(null);
        }}
      >
        {selectedPeriod && (
          <div className="grid gap-5">
            <div>
              <p className="text-sm text-slate-500">
                Period
              </p>

              <p className="font-semibold text-slate-900">
                {selectedPeriod.name}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">
                  Period Start
                </p>

                <p className="font-semibold">
                  {formatDate(
                    selectedPeriod.period_start
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Period End
                </p>

                <p className="font-semibold">
                  {formatDate(
                    selectedPeriod.period_end
                  )}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Payment Date
              </p>

              <p className="font-semibold">
                {formatDate(
                  selectedPeriod.payment_date
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Status
              </p>

              <AEStatusBadge
                status={
                  selectedPeriod.status
                }
              />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Notes
              </p>

              <p className="font-medium text-slate-700">
                {selectedPeriod.notes || "—"}
              </p>
            </div>
          </div>
        )}
      </AEDetailsModal>

      <PayrollPeriodModal
        mode="edit"
        period={
          selectedPeriod ?? undefined
        }
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedPeriod(null);
        }}
      />

      <AEConfirmDialog
        open={deleteOpen}
        title="Delete Payroll Period"
        message={`Are you sure you want to delete "${periodToDelete?.name}"? This action cannot be undone.`}
        loading={deleting}
        onCancel={() => {
          setDeleteOpen(false);
          setPeriodToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}