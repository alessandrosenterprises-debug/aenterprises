"use client";

import { useMemo, useState } from "react";
import { exportToCSV } from "@/lib/export/csv";
import {
  AEDataTable,
  AEDataTableToolbar,
} from "@/components/enterprise/data-table";
import { toast } from "sonner";
import { AEStatusBadge } from "@/components/enterprise/badge";
import { AERowActions } from "@/components/enterprise/actions";
import { AEConfirmDialog } from "@/components/enterprise";
import CustomerModal from "./CustomerModal";
import { AEDetailsModal } from "@/components/enterprise/details";
import { deleteCustomer } from "@/modules/customers/services/customer.client";
import { useRouter } from "next/navigation";
import { exportToExcel } from "@/lib/export/excel";
import { exportToPDF } from "@/lib/export/pdf";
import { KeyRound } from "lucide-react";
import { sendCustomerPasswordReset } from "@/app/dashboard/customers/actions";

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  auth_user_id?: string | null;
  is_active?: boolean;
  status: string;
  businesses?: {
    name: string;
  };
}

interface Business {
  id: string;
  name: string;
}

interface CustomersTableProps {
  customers: Customer[];
  businesses: Business[];
}

export default function CustomersTable({
  customers,
  businesses,
}: CustomersTableProps) {
  
    const [search, setSearch] = useState("");
   const router = useRouter();
const [selectedCustomer, setSelectedCustomer] =
  useState<Customer | null>(null);
const [customerToDelete, setCustomerToDelete] =
  useState<Customer | null>(null);
 const [detailsOpen, setDetailsOpen] =
  useState(false);  
const [editOpen, setEditOpen] =
  useState(false);
const [deleteOpen, setDeleteOpen] =
  useState(false);
const [deleting, setDeleting] =
  useState(false); 

  async function handleDelete() {
  if (!customerToDelete) return;

  try {
    setDeleting(true);

    await deleteCustomer(customerToDelete.id);
toast.success("Customer deleted successfully.");
    setDeleteOpen(false);
    setCustomerToDelete(null);

    router.refresh();
  } catch (error) {
    console.error(error);
  } finally {
    setDeleting(false);
  }
}

async function handlePasswordReset(customer: Customer) {
  try {
    const result = await sendCustomerPasswordReset(customer.id);
    toast.success(`Password reset link sent to ${result.email}.`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not send a customer password reset link.");
  }
}
function handleExportCSV() {
  const rows = customers.map((customer) => ({
    Customer: customer.full_name,
    Phone: customer.phone,
    Business: customer.businesses?.name ?? "",
    Status: customer.status,
  }));

  exportToCSV("customers", rows);
}

function handleExportExcel() {
  const rows = customers.map((customer) => ({
    Customer: customer.full_name,
    Phone: customer.phone,
    Business: customer.businesses?.name ?? "",
    Status: customer.status,
  }));

  exportToExcel("customers", rows);
}

function handleExportPDF() {
  const rows = customers.map((customer) => ({
    Customer: customer.full_name,
    Phone: customer.phone,
    Business: customer.businesses?.name ?? "",
    Status: customer.status,
  }));

  exportToPDF("Customer Report", rows);
}
    const filteredCustomers = useMemo(() => {
  if (!search.trim()) return customers;

  const query = search.toLowerCase();

  return customers.filter((customer) => {
    return (
      customer.full_name?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.businesses?.name?.toLowerCase().includes(query) ||
      customer.status?.toLowerCase().includes(query)
    );
  });
}, [customers, search]);
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
        <CustomerModal businesses={businesses} />
      </AEDataTableToolbar>
    }
  >
      <thead>
        <tr className="border-b">
          <th className="px-6 py-4 text-left font-semibold">
            Customer
          </th>

          <th className="px-6 py-4 text-left font-semibold">
            Phone
          </th>

          <th className="px-6 py-4 text-left font-semibold">Email / app login</th>

          <th className="px-6 py-4 text-left font-semibold">
            Business
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
        {filteredCustomers.length === 0 ? (
          <tr>
            <td
            colSpan={6}
              className="py-12 text-center text-slate-500"
            >
              {search
                ? "No matching customers found."
                : "No customers yet."}
            </td>
          </tr>
        ) : (
          filteredCustomers.map((customer) => (
            <tr
              key={customer.id}
              className="border-b transition hover:bg-slate-50"
            >
              <td className="px-6 py-4">
                {customer.full_name}
              </td>

              <td className="px-6 py-4">
                {customer.phone}
              </td>

              <td className="px-6 py-4 text-sm text-slate-600">{customer.email || "No email"}<span className={`mt-1 block text-xs font-semibold ${customer.auth_user_id ? "text-emerald-700" : "text-slate-400"}`}>{customer.auth_user_id ? "Customer App account linked" : "No app login linked"}</span></td>

              <td className="px-6 py-4">
                {customer.businesses?.name}
              </td>

              <td className="px-6 py-4">
                <AEStatusBadge
                  status={customer.status}
                />
              </td>

              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                  <AERowActions
                    onView={() => {
                      setSelectedCustomer(customer);
                      setDetailsOpen(true);
                    }}
                    onEdit={() => {
  setSelectedCustomer(customer);
  setEditOpen(true);
}}
                    onDelete={() => {
  setCustomerToDelete(customer);
  setDeleteOpen(true);
}}
                  />
                  <button type="button" title={customer.auth_user_id ? "Send password reset link" : "No Customer App login is linked"} aria-label={`Send password reset link for ${customer.full_name}`} disabled={!customer.auth_user_id || !customer.email || !customer.is_active || customer.status.toLowerCase() !== "active"} onClick={() => void handlePasswordReset(customer)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[#D4AF37] hover:bg-[#FBF8EC] hover:text-[#03162F] disabled:cursor-not-allowed disabled:opacity-40"><KeyRound className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </AEDataTable>

    <AEDetailsModal
      open={detailsOpen}
      title="Customer Details"
      onClose={() => setDetailsOpen(false)}
    >
      {selectedCustomer && (
        <div className="grid gap-4">
          <div>
            <p className="text-sm text-slate-500">
              Full Name
            </p>
            <p className="font-semibold">
              {selectedCustomer.full_name}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Phone
            </p>
            <p className="font-semibold">
              {selectedCustomer.phone}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Business
            </p>
            <p className="font-semibold">
              {selectedCustomer.businesses?.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Status
            </p>

            <AEStatusBadge
              status={selectedCustomer.status}
            />
          </div>
        </div>
      )}
    </AEDetailsModal>
    <CustomerModal
  businesses={businesses}
  mode="edit"
  customer={selectedCustomer ?? undefined}
  open={editOpen}
  onClose={() => setEditOpen(false)}
/><AEConfirmDialog
  open={deleteOpen}
  title="Delete Customer"
  message={`Are you sure you want to delete "${customerToDelete?.full_name}"? This action cannot be undone.`}
  loading={deleting}
  onCancel={() => {
    setDeleteOpen(false);
    setCustomerToDelete(null);
  }}
  onConfirm={handleDelete}
/>
  </>
  
  
  
);  
}
