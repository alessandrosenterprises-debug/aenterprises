"use client";
import { useMemo, useState } from "react";
import {
  AEDataTable,
  AEDataTableToolbar,
} from "@/components/enterprise/data-table";
import CustomerModal from "./CustomerModal";
import { AEStatusBadge } from "@/components/enterprise/badge";

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
        </tr>
      </thead>

      <tbody>
        {filteredCustomers.length === 0 ? (
          <tr>
            <td
              colSpan={4}
              className="py-12 text-center text-slate-500"
            >
              No customers yet.
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
            </tr>
          ))
        )}
      </tbody>
    </AEDataTable>
  );
}