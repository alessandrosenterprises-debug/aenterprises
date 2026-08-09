"use client";

import { useMemo, useState } from "react";

import {
  AEDataTable,
  AEDataTableToolbar,
} from "@/components/enterprise/data-table";

import { AEStatusBadge } from "@/components/enterprise/badge";
import { AERowActions } from "@/components/enterprise/actions";

import CustomerModal from "./CustomerModal";
import { AEDetailsModal } from "@/components/enterprise/details";

interface Customer {
  id: string;
  full_name: string;
  phone: string;
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

const [selectedCustomer, setSelectedCustomer] =
  useState<Customer | null>(null);

const [detailsOpen, setDetailsOpen] =
  useState(false);
  const [editOpen, setEditOpen] =
  useState(false);
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
              colSpan={5}
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

              <td className="px-6 py-4">
                {customer.businesses?.name}
              </td>

              <td className="px-6 py-4">
                <AEStatusBadge
                  status={customer.status}
                />
              </td>

              <td className="px-6 py-4">
                <div className="flex justify-center">
                  <AERowActions
                    onView={() => {
                      setSelectedCustomer(customer);
                      setDetailsOpen(true);
                    }}
                    onEdit={() => {
  setSelectedCustomer(customer);
  setEditOpen(true);
}}
                    onDelete={() =>
                      alert(`Delete ${customer.full_name}`)
                    }
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
/>
  </>
  
  
);  
}