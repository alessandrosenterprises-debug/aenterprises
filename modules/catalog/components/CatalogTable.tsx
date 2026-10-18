"use client";
import { Select } from "@/components/ui/select";
import { useState } from "react";
import { deleteEnterpriseCatalogItem } from "../services/enterprise-catalog.client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AEDataTable,
  AEDataTableToolbar,
} from "@/components/enterprise/data-table";
import { AEStatusBadge } from "@/components/enterprise/badge";
import { AERowActions } from "@/components/enterprise/actions";
import { AEDetailsModal } from "@/components/enterprise/details";

import { exportToCSV } from "@/lib/export/csv";
import { exportToExcel } from "@/lib/export/excel";
import { exportToPDF } from "@/lib/export/pdf";

import { EnterpriseCatalogItem } from "../types/enterprise-catalog";

import CatalogModal from "./CatalogModal";

interface Business {
  id: string;
  name: string;
  slug?: string;
}

interface CatalogTableProps {
  items: EnterpriseCatalogItem[];
  businesses: Business[];
  categories?: string[];
  initialBusinessId?: string;
}

export default function CatalogTable({
  items,
  businesses,
  categories = [],
  initialBusinessId = "",
}: CatalogTableProps) {
  const [search, setSearch] = useState("");

  const [businessFilter, setBusinessFilter] =
  useState(initialBusinessId);

const [categoryFilter, setCategoryFilter] =
  useState("");

const [statusFilter, setStatusFilter] =
  useState("");

const [typeFilter, setTypeFilter] = useState("");

  const router = useRouter();

  const [selectedItem, setSelectedItem] =
    useState<EnterpriseCatalogItem | null>(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

    const [editOpen, setEditOpen] =
  useState(false);

  async function handleDelete(id: string) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this catalog item?"
  );

  if (!confirmed) return;

  try {
    await deleteEnterpriseCatalogItem(id);

    toast.success("Catalog item deleted successfully.");

    router.refresh();
  } catch (error) {
    console.error(error);

    toast.error("Failed to delete catalog item.");
  }
}

  function handleExportCSV() {
    const rows = filteredItems.map((item) => ({
      Name: item.name,
      Business: item.businesses?.name ?? "",
      Type: item.item_type,
      Price: item.base_price,
      Status: item.status,
    }));

    exportToCSV("enterprise_catalog", rows);
  }

  function handleExportExcel() {
    const rows = filteredItems.map((item) => ({
      Name: item.name,
      Business: item.businesses?.name ?? "",
      Type: item.item_type,
      Price: item.base_price,
      Status: item.status,
    }));

    exportToExcel("enterprise_catalog", rows);
  }

  function handleExportPDF() {
    const rows = filteredItems.map((item) => ({
      Name: item.name,
      Business: item.businesses?.name ?? "",
      Type: item.item_type,
      Price: item.base_price,
      Status: item.status,
    }));

    exportToPDF("Enterprise Catalog", rows);
  }

const businessOptions = Array.from(new Map(businesses.map((business) => [business.id, business])).values());

const categoryOptions = [
  ...new Set(
    items.map(
      (item) => item.category ?? ""
    )
  ),
].filter(Boolean);

const typeOptions = [...new Set(items.map((item) => item.item_type).filter(Boolean))];
const statusOptions = ["Active", "Inactive"];

const query = search.toLowerCase();
const filteredItems = items.filter((item) => {
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      (item.businesses?.name ?? "")
        .toLowerCase()
        .includes(query) ||
      item.item_type.toLowerCase().includes(query) ||
      (item.category ?? "").toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query);

    const matchesBusiness =
      !businessFilter ||
      item.businesses?.id === businessFilter;

    const matchesCategory =
      !categoryFilter ||
      item.category === categoryFilter;

    const matchesStatus =
      !statusFilter ||
      item.status === statusFilter;

    const matchesType = !typeFilter || item.item_type === typeFilter;

    return (
      matchesSearch &&
      matchesBusiness &&
      matchesCategory &&
      matchesStatus &&
      matchesType
    );
});
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
  filters={
    <>
      <Select
        options={[
          { label: "All Types", value: "" },
          ...typeOptions.map((type) => ({ label: type === "financial" ? "Financial offer" : type, value: type })),
        ]}
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
      />

      <Select
        options={[
          {
            label: "All Businesses",
            value: "",
          },
          ...businessOptions.map((business) => ({
            label: business.name,
            value: business.id,
          })),
        ]}
        value={businessFilter}
        onChange={(e) =>
          setBusinessFilter(e.target.value)
        }
      />

      <Select
        options={[
          {
            label: "All Categories",
            value: "",
          },
          ...categoryOptions.map((name) => ({
            label: name,
            value: name,
          })),
        ]}
        value={categoryFilter}
        onChange={(e) =>
          setCategoryFilter(e.target.value)
        }
      />

      <Select
        options={[
          {
            label: "All Statuses",
            value: "",
          },
          ...statusOptions.map((status) => ({
            label: status,
            value: status,
          })),
        ]}
        value={statusFilter}
        onChange={(e) =>
          setStatusFilter(e.target.value)
        }
      />

      <button
        type="button"
        onClick={() => {
          setSearch("");
          setBusinessFilter("");
          setCategoryFilter("");
          setStatusFilter("");
          setTypeFilter("");
        }}
        className="rounded-xl border border-slate-300 px-4 py-3 transition hover:bg-slate-100"
      >
        Reset
      </button>
    </>
  }
>
  <CatalogModal
    businesses={businesses}
    categories={categories}
  />
</AEDataTableToolbar>
        }
      >
        <thead>
          <tr className="border-b">
           <th className="px-4 py-4 text-left font-semibold">
  Image
</th>

<th className="px-6 py-4 text-left font-semibold">
  Item
</th>

<th className="px-6 py-4 text-left font-semibold">
  Business
</th>

<th className="px-6 py-4 text-left font-semibold">
  Category
</th>

<th className="px-6 py-4 text-center font-semibold">
  Inventory
</th>

<th className="px-6 py-4 text-right font-semibold">
  Price
</th>

<th className="px-6 py-4 text-center font-semibold">
  Status
</th>

<th className="px-6 py-4 text-center font-semibold">
  Actions
</th> 
          </tr>
        </thead>

        <tbody>
          {filteredItems.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="py-12 text-center text-slate-500"
              >
                {search || businessFilter || categoryFilter || statusFilter || typeFilter
                  ? "No matching catalog items found."
                  : "No catalog items yet."}
              </td>
            </tr>
          ) : (
            filteredItems.map((item) => (
              <tr
                key={item.id}
                className="border-b transition hover:bg-slate-50"
              >
               <td className="px-4 py-4">
  {item.image_url ? (
    <img
      src={item.image_url}
      alt={item.name}
      className="h-14 w-14 rounded-xl border object-cover"
    />
  ) : (
    <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-slate-100 text-2xl">
      📦
    </div>
  )}
</td>

<td className="px-6 py-4">
  <div className="font-semibold text-slate-900">
    {item.name}
  </div>

  <div className="text-sm text-slate-500 capitalize">
    {item.item_type === "financial" ? "Financial offer" : item.item_type === "service" ? "Service" : "Product"}
  </div>
</td>

<td className="px-6 py-4">
  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
    {item.businesses?.name}
  </span>
</td>

<td className="px-6 py-4">
  {item.category ?? "-"}
</td>

<td className="px-6 py-4 text-center">
  {item.item_type !== "product" ? (
    <span className="text-xs text-slate-400">Not tracked</span>
  ) : item.quantity == null ? (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Not set</span>
  ) : item.quantity <= 0 ? (
    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
      Out of stock
    </span>
  ) : item.quantity <= 5 ? (
    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
      Low stock · {item.quantity}
    </span>
  ) : (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
      {item.quantity} In Stock
    </span>
  )}
</td>

<td className="px-6 py-4 text-right font-semibold">
  K
  {Number(item.base_price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</td>

<td className="px-6 py-4 text-center">
  <AEStatusBadge status={item.status} />
</td>

<td className="px-6 py-4">
  <div className="flex justify-center">
    <AERowActions
      onView={() => {
        setSelectedItem(item);
        setDetailsOpen(true);
      }}
      onEdit={() => {
  setSelectedItem(item);
  setEditOpen(true);
}}
      onDelete={() => handleDelete(item.id)}
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
        title="Catalog Item Details"
        onClose={() => setDetailsOpen(false)}
      >
        {selectedItem && (
  <div className="space-y-8">

    <div className="flex flex-col items-center">

      {selectedItem.image_url ? (
        <img
          src={selectedItem.image_url}
          alt={selectedItem.name}
          className="h-52 w-52 rounded-2xl border object-cover shadow-lg"
        />
      ) : (
        <div className="flex h-52 w-52 items-center justify-center rounded-2xl border bg-slate-100 text-6xl">
          📦
        </div>
      )}

      <h2 className="mt-6 text-2xl font-bold text-[#03162F]">
        {selectedItem.name}
      </h2>

      <div className="mt-2 flex flex-wrap justify-center gap-3">

        <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold">
          {selectedItem.businesses?.name}
        </span>

        <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
          {selectedItem.category ?? "General"}
        </span>

        <AEStatusBadge status={selectedItem.status} />

      </div>

    </div>

    <div className="grid gap-5 md:grid-cols-2">

      <div className="rounded-xl border p-5">
        <p className="text-sm text-slate-500">
          Price
        </p>

        <p className="mt-2 text-2xl font-bold">
          K
          {Number(selectedItem.base_price).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      <div className="rounded-xl border p-5">
        <p className="text-sm text-slate-500">
          Quantity
        </p>

        <p className="mt-2 text-2xl font-bold">
          {selectedItem.quantity}
        </p>
      </div>

    </div>

    {selectedItem.description && (
      <div className="rounded-xl border p-5">

        <h3 className="mb-3 text-lg font-semibold">
          Description
        </h3>

        <p className="leading-7 text-slate-600">
          {selectedItem.description}
        </p>

      </div>
    )}

  </div>
)}
      </AEDetailsModal>
      <CatalogModal
  businesses={businesses}
  categories={categories}
  mode="edit"
  item={selectedItem ?? undefined}
  open={editOpen}
  onClose={() => {
    setEditOpen(false);
    setSelectedItem(null);
  }}
/>
    </>
  );
}
