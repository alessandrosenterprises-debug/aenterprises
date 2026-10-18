import DeliveryReviewsPage from "@/modules/orders/components/DeliveryReviewsPage";
import { getDeliveryReportOrders } from "@/modules/orders/services/delivery-report.service";

export const dynamic = "force-dynamic";

export default async function DeliveryReviewsRoute() {
  const orders = await getDeliveryReportOrders();
  return <DeliveryReviewsPage orders={orders} />;
}
