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

import DepartmentModal from "./DepartmentModal";

import { deleteDepartment } from "@/modules/departments/services/department.client";

interface Department {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DepartmentsTableProps {
  departments: Department[];
}

export default function DepartmentsTable({
  departments,
}: DepartmentsTableProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

  const [departmentToDelete, setDepartmentToDelete] =
    useState<Department | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!departmentToDelete) return;

    try {
      setDeleting(true);

      await deleteDepartment(departmentToDelete.id);

      toast.success("Department deleted successfully.");

      setDeleteOpen(false);
      setDepartmentToDelete(null);

      router.refresh();
    } catch (error) {
      console.error("Department delete error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete department."
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleExportCSV() {
    const rows = departments.map((department) => ({
      Department: department.name,
      Description: department.description ?? "",
      Status: department.status,
    }));

    exportToCSV("departments", rows);
  }

  function handleExportExcel() {
    const rows = departments.map((department) => ({
      Department: department.name,
      Description: department.description ?? "",
      Status: department.status,
    }));

    exportToExcel("departments", rows);
  }

  function handleExportPDF() {
    const rows = departments.map((department) => ({
      Department: department.name,
      Description: department.description ?? "",
      Status: department.status,
    }));

    exportToPDF("Department Report", rows);
  }

  const filteredDepartments = useMemo(() => {
    if (!search.trim()) {
      return departments;
    }

    const query = search.toLowerCase();

    return departments.filter((department) => (
      department.name?.toLowerCase().includes(query) ||
      department.description?.toLowerCase().includes(query) ||
      department.status?.toLowerCase().includes(query)
    ));
  }, [departments, search]);

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
            <DepartmentModal />
          </AEDataTableToolbar>
        }
      >
        <thead>
          <tr className="border-b">
            <th className="px-6 py-4 text-left font-semibold">
              Department
            </th>

            <th className="px-6 py-4 text-left font-semibold">
              Description
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
          {filteredDepartments.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="py-12 text-center text-slate-500"
              >
                {search
                  ? "No matching departments found."
                  : "No departments yet."}
              </td>
            </tr>
          ) : (
            filteredDepartments.map((department) => (
              <tr
                key={department.id}
                className="border-b transition hover:bg-slate-50"
              >
                <td className="px-6 py-4 font-medium text-slate-900">
                  {department.name}
                </td>

                <td className="px-6 py-4 text-slate-600">
                  {department.description || "—"}
                </td>

                <td className="px-6 py-4">
                  <AEStatusBadge
                    status={department.status}
                  />
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <AERowActions
                      onView={() => {
                        setSelectedDepartment(department);
                        setDetailsOpen(true);
                      }}
                      onEdit={() => {
                        setSelectedDepartment(department);
                        setEditOpen(true);
                      }}
                      onDelete={() => {
                        setDepartmentToDelete(department);
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
        title="Department Details"
        onClose={() => {
          setDetailsOpen(false);
          setSelectedDepartment(null);
        }}
      >
        {selectedDepartment && (
          <div className="grid gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Department
              </p>

              <p className="font-semibold text-slate-900">
                {selectedDepartment.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Description
              </p>

              <p className="font-semibold text-slate-900">
                {selectedDepartment.description || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Status
              </p>

              <AEStatusBadge
                status={selectedDepartment.status}
              />
            </div>
          </div>
        )}
      </AEDetailsModal>

      <DepartmentModal
        mode="edit"
        department={selectedDepartment ?? undefined}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedDepartment(null);
        }}
      />

      <AEConfirmDialog
        open={deleteOpen}
        title="Delete Department"
        message={`Are you sure you want to delete "${departmentToDelete?.name}"? This action cannot be undone.`}
        loading={deleting}
        onCancel={() => {
          setDeleteOpen(false);
          setDepartmentToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}