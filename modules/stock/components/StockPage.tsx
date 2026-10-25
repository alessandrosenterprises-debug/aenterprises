import { redirect } from "next/navigation";
import { getStockWorkspaceData, type StockTab } from "@/modules/stock/services/stock.service";
import StockWorkspace from "@/modules/stock/components/StockWorkspace";

export default async function StockPage({ tab }: { tab: StockTab }) {
  let data;
  try {
    data = await getStockWorkspaceData();
  } catch (error) {
    if (error instanceof Error && error.message.includes("does not have permission")) redirect("/dashboard/access-denied");
    throw error;
  }
  return <StockWorkspace data={data} initialTab={tab} />;
}
