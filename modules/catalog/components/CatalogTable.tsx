"use client";

import { useMemo, useState } from "react";

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

interface CatalogTableProps {
  items: EnterpriseCatalogItem[];
}

export default function CatalogTable({
  items,
}: CatalogTableProps) {
  const [search, setSearch] = useState("");

  const [selectedItem, setSelectedItem] =
    useState<EnterpriseCatalogItem | null>(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  function handleExportCSV() {
    const rows = items.map((item) => ({
      Name: item.name,
      Business: item.businesses?.name ?? "",
      Type: item.item_type,
      Price: item.base_price,
      Status: item.status,
    }));

    exportToCSV("enterprise_catalog", rows);
  }

  function handleExportExcel() {
    const rows = items.map((item) => ({
      Name: item.name,
      Business: item.businesses?.name ?? "",
      Type: item.item_type,
      Price: item.base_price,
      Status: item.status,
    }));

    exportToExcel("enterprise_catalog", rows);
  }

  function handleExportPDF() {
    const rows = items.map((item) => ({
      Name: item.name,
      Business: item.businesses?.name ?? "",
      Type: item.item_type,
      Price: item.base_price,
      Status: item.status,
    }));

    exportToPDF("Enterprise Catalog", rows);
  }

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;

    const query = search.toLowerCase();

    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        (item.businesses?.name ?? "")
          .toLowerCase()
          .includes(query) ||
        item.item_type.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query)
      );
    });
  }, [items, search]);

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
            <button
  className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
>
  + Add Catalog Item
</button>
          </AEDataTableToolbar>
        }
      >
        <thead>
          <tr className="border-b">
            <th className="px-6 py-4 text-left font-semibold">
              Name
            </th>

            <th className="px-6 py-4 text-left font-semibold">
              Business
            </th>

            <th className="px-6 py-4 text-left font-semibold">
              Type
            </th>

            <th className="px-6 py-4 text-left font-semibold">
              Price
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
          {filteredItems.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="py-12 text-center text-slate-500"
              >
                {search
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
                <td className="px-6 py-4">
                  {item.name}
                </td>

                <td className="px-6 py-4">
                  {item.businesses?.name}
                </td>

                <td className="px-6 py-4">
                  {item.item_type}
                </td>

                <td className="px-6 py-4 font-medium">
                  ZMW{" "}
                  {Number(item.base_price).toLocaleString()}
                </td>

                <td className="px-6 py-4">
                  <AEStatusBadge
                    status={item.status}
                  />
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <AERowActions
                      onView={() => {
                        setSelectedItem(item);
                        setDetailsOpen(true);
                      }}
                      onEdit={() => {
                        console.log("Edit", item);
                      }}
                      onDelete={() => {
                        console.log("Delete", item);
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
        title="Catalog Item Details"
        onClose={() => setDetailsOpen(false)}
      >
        {selectedItem && (
          <div className="grid gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Name
              </p>

              <p className="font-semibold">
                {selectedItem.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Business
              </p>

              <p className="font-semibold">
                {selectedItem.businesses?.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Type
              </p>

              <p className="font-semibold">
                {selectedItem.item_type}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Price
              </p>

              <p className="font-semibold">
                ZMW{" "}
                {Number(
                  selectedItem.base_price
                ).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Status
              </p>

              <AEStatusBadge
                status={selectedItem.status}
              />
            </div>

            {selectedItem.category && (
              <div>
                <p className="text-sm text-slate-500">
                  Category
                </p>

                <p className="font-semibold">
                  {selectedItem.category}
                </p>
              </div>
            )}

            {selectedItem.description && (
              <div>
                <p className="text-sm text-slate-500">
                  Description
                </p>

                <p className="font-semibold">
                  {selectedItem.description}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-slate-500">
                Quantity
              </p>

              <p className="font-semibold">
                {selectedItem.quantity}
              </p>
            </div>
          </div>
        )}
      </AEDetailsModal>
    </>
  );
}