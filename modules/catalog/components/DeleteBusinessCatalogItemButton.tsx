"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteEnterpriseCatalogItem } from "../services/enterprise-catalog.client";

export default function DeleteBusinessCatalogItemButton({
  itemId,
  collectionUrl,
}: {
  itemId: string;
  collectionUrl: string;
}) {
  const router = useRouter();

  async function removeItem() {
    if (!window.confirm("Delete this catalog item? This cannot be undone.")) return;
    try {
      await deleteEnterpriseCatalogItem(itemId);
      toast.success("Catalog item deleted.");
      router.push(collectionUrl);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not delete this catalog item.");
    }
  }

  return <button type="button" onClick={removeItem} className="inline-flex items-center justify-center rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50">Delete Item</button>;
}
