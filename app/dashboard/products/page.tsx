import { redirect } from "next/navigation";

/** Backward-compatible route for existing dashboard links. */
export default function ProductsPage() {
  redirect("/dashboard/catalog");
}
