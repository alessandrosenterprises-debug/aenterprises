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

import EmployeeModal from "./EmployeeModal";

import { deleteEmployee } from "@/modules/employees/services/employee.client";
import type { EmployeeBranchOption, EmployeeManagerOption } from "@/modules/employees/services/employee.service";

interface Employee {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  position: string;
  employment_type?: string | null;
  status: string;
  user_id?: string | null;
  branch_id?: string | null;
  store_manager_profile_id?: string | null;

  businesses?: {
    id: string;
    name: string;
  } | null;

  departments?: {
    id: string;
    name: string;
  } | null;
  branch_name?: string | null;
  store_manager_name?: string | null;
}

interface Business {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface EmployeesTableProps {
  employees: Employee[];
  businesses: Business[];
  departments: Department[];
  branches: EmployeeBranchOption[];
  storeManagers: EmployeeManagerOption[];
  accountOptions: { auth_user_id: string; display_name: string; email: string }[];
}

export default function EmployeesTable({
  employees,
  businesses,
  departments,
  branches,
  storeManagers,
  accountOptions,
}: EmployeesTableProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [employeeToDelete, setEmployeeToDelete] =
    useState<Employee | null>(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [editOpen, setEditOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  async function handleDelete() {
    if (!employeeToDelete) return;

    try {
      setDeleting(true);

      await deleteEmployee(employeeToDelete.id);

      toast.success("Employee deleted successfully.");

      setDeleteOpen(false);
      setEmployeeToDelete(null);

      router.refresh();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete employee."
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleExportCSV() {
    const rows = employees.map((employee) => ({
      Employee: employee.full_name,
      Phone: employee.phone,
      Position: employee.position,
      Business: employee.businesses?.name ?? "",
      Department: employee.departments?.name ?? "",
      Branch: employee.branch_name ?? "",
      "Store Manager": employee.store_manager_name ?? "",
      Status: employee.status,
    }));

    exportToCSV("employees", rows);
  }

  function handleExportExcel() {
    const rows = employees.map((employee) => ({
      Employee: employee.full_name,
      Phone: employee.phone,
      Position: employee.position,
      Business: employee.businesses?.name ?? "",
      Department: employee.departments?.name ?? "",
      Branch: employee.branch_name ?? "",
      "Store Manager": employee.store_manager_name ?? "",
      Status: employee.status,
    }));

    exportToExcel("employees", rows);
  }

  function handleExportPDF() {
    const rows = employees.map((employee) => ({
      Employee: employee.full_name,
      Phone: employee.phone,
      Position: employee.position,
      Business: employee.businesses?.name ?? "",
      Department: employee.departments?.name ?? "",
      Branch: employee.branch_name ?? "",
      "Store Manager": employee.store_manager_name ?? "",
      Status: employee.status,
    }));

    exportToPDF("Employee Report", rows);
  }

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;

    const query = search.toLowerCase();

    return employees.filter((employee) => (
      employee.full_name?.toLowerCase().includes(query) ||
      employee.phone?.toLowerCase().includes(query) ||
      employee.position?.toLowerCase().includes(query) ||
      employee.businesses?.name?.toLowerCase().includes(query) ||
      employee.departments?.name?.toLowerCase().includes(query) ||
      employee.status?.toLowerCase().includes(query)
    ));
  }, [employees, search]);

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
            <EmployeeModal
              businesses={businesses}
              departments={departments}
              branches={branches}
              storeManagers={storeManagers}
              accountOptions={accountOptions}
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
              Phone
            </th>

            <th className="px-6 py-4 text-left font-semibold">
              Business
            </th>

            <th className="px-6 py-4 text-left font-semibold">
              Department
            </th>

            <th className="px-6 py-4 text-left font-semibold">Branch</th>

            <th className="px-6 py-4 text-left font-semibold">Store Manager</th>

            <th className="px-6 py-4 text-left font-semibold">
              Status
            </th>

            <th className="px-6 py-4 text-center font-semibold">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredEmployees.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                className="py-12 text-center text-slate-500"
              >
                {search
                  ? "No matching employees found."
                  : "No employees yet."}
              </td>
            </tr>
          ) : (
            filteredEmployees.map((employee) => (
              <tr
                key={employee.id}
                className="border-b transition hover:bg-slate-50"
              >
                <td className="px-6 py-4">
                  {employee.full_name}
                </td>

                <td className="px-6 py-4">
                  {employee.position}
                </td>

                <td className="px-6 py-4">
                  {employee.phone}
                </td>

                <td className="px-6 py-4">
                  {employee.businesses?.name ?? "—"}
                </td>

                <td className="px-6 py-4">
                  {employee.departments?.name ?? "—"}
                </td>

                <td className="px-6 py-4">{employee.branch_name ?? "—"}</td>

                <td className="px-6 py-4">{employee.store_manager_name ?? "—"}</td>

                <td className="px-6 py-4">
                  <AEStatusBadge
                    status={employee.status}
                  />
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <AERowActions
                      onView={() => {
                        setSelectedEmployee(employee);
                        setDetailsOpen(true);
                      }}
                      onEdit={() => {
                        setSelectedEmployee(employee);
                        setEditOpen(true);
                      }}
                      onDelete={() => {
                        setEmployeeToDelete(employee);
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
        title="Employee Details"
        onClose={() => {
          setDetailsOpen(false);
          setSelectedEmployee(null);
        }}
      >
        {selectedEmployee && (
          <div className="grid gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Full Name
              </p>

              <p className="font-semibold">
                {selectedEmployee.full_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Position
              </p>

              <p className="font-semibold">
                {selectedEmployee.position}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Phone
              </p>

              <p className="font-semibold">
                {selectedEmployee.phone}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Business
              </p>

              <p className="font-semibold">
                {selectedEmployee.businesses?.name ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Department
              </p>

              <p className="font-semibold">
                {selectedEmployee.departments?.name ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Branch</p>
              <p className="font-semibold">{selectedEmployee.branch_name ?? "—"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Store manager</p>
              <p className="font-semibold">{selectedEmployee.store_manager_name ?? "—"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Status
              </p>

              <AEStatusBadge
                status={selectedEmployee.status}
              />
            </div>
          </div>
        )}
      </AEDetailsModal>

      <EmployeeModal
        businesses={businesses}
        departments={departments}
        branches={branches}
        storeManagers={storeManagers}
        accountOptions={selectedEmployee?.user_id && !accountOptions.some((account) => account.auth_user_id === selectedEmployee.user_id) ? [...accountOptions, { auth_user_id: selectedEmployee.user_id, display_name: selectedEmployee.full_name, email: selectedEmployee.email ?? "" }] : accountOptions}
        mode="edit"
        employee={selectedEmployee ?? undefined}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedEmployee(null);
        }}
      />

      <AEConfirmDialog
        open={deleteOpen}
        title="Delete Employee"
        message={`Are you sure you want to delete "${employeeToDelete?.full_name}"? This action cannot be undone.`}
        loading={deleting}
        onCancel={() => {
          setDeleteOpen(false);
          setEmployeeToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}
