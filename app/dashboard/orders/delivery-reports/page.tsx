import DeliveryRiderReport from "@/modules/orders/components/DeliveryRiderReport";
import { getDeliveryReportOrders } from "@/modules/orders/services/delivery-report.service";

export const dynamic = "force-dynamic";

export default async function DeliveryReportsPage() {
  const orders = await getDeliveryReportOrders();
  return <DeliveryRiderReport orders={orders} />;
}
