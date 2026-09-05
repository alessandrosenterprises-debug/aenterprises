import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Package,
  Truck,
  XCircle,
  Hourglass,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface OrderItem {
  id: string;
  order_id: string;
  catalog_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;

  enterprise_catalog?: {
    id: string;
    name: string;
    item_type: string;
  } | null;
}

interface Order {
  id: string;
  business_id: string;
  customer_id: string;
  status: string;
  payment_status: string;
  fulfillment_method: string;
  delivery_address: string | null;
  notes: string | null;
  subtotal: number;
  total_amount: number;
  created_at: string;
  updated_at: string;

  businesses?: {
    id: string;
    name: string;
  } | null;

  order_items?: OrderItem[];
}

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(amount: number | null | undefined) {
  return `ZMW ${Number(amount ?? 0).toFixed(2)}`;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Date not available";

  return new Date(date).toLocaleDateString("en-ZM", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return "Date not available";

  return new Date(date).toLocaleString("en-ZM", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeStatus(
  status: string | null | undefined
) {
  return status?.toLowerCase().trim() || "pending";
}

/* =========================================================
   STATUS
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = normalizeStatus(status);

  const config = {
    pending: {
      label: "Pending",
      className:
        "bg-amber-50 text-amber-700 border-amber-100",
      icon: Hourglass,
    },

    confirmed: {
      label: "Confirmed",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-100",
      icon: CheckCircle2,
    },

    processing: {
      label: "Processing",
      className:
        "bg-blue-50 text-blue-700 border-blue-100",
      icon: Package,
    },

    ready: {
      label: "Ready",
      className:
        "bg-indigo-50 text-indigo-700 border-indigo-100",
      icon: CheckCircle2,
    },

    completed: {
      label: "Completed",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-100",
      icon: CheckCircle2,
    },

    cancelled: {
      label: "Cancelled",
      className:
        "bg-red-50 text-red-700 border-red-100",
      icon: XCircle,
    },
  };

  const item =
    config[normalized as keyof typeof config] ??
    config.pending;

  const Icon = item.icon;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-3
        py-1.5
        text-xs
        font-bold
        ${item.className}
      `}
    >
      <Icon className="h-3.5 w-3.5" />

      {item.label}
    </span>
  );
}

/* =========================================================
   PAYMENT BADGE
========================================================= */

function PaymentBadge({
  status,
}: {
  status: string;
}) {
  const normalized = normalizeStatus(status);

  const config = {
    pending: {
      label: "Pending",
      className:
        "bg-amber-50 text-amber-700 border-amber-100",
    },

    partial: {
      label: "Partial",
      className:
        "bg-blue-50 text-blue-700 border-blue-100",
    },

    paid: {
      label: "Paid",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-100",
    },

    refunded: {
      label: "Refunded",
      className:
        "bg-slate-100 text-slate-700 border-slate-200",
    },
  };

  const item =
    config[normalized as keyof typeof config] ??
    config.pending;

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        border
        px-2.5
        py-1
        text-[11px]
        font-bold
        ${item.className}
      `}
    >
      {item.label}
    </span>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function CustomerOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  /* =======================================================
     AUTH
  ======================================================= */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 pb-24">
        <CustomerNavigation />

        <section className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#03162F] text-white">
              <Package className="h-5 w-5" />
            </div>

            <h1 className="mt-4 text-lg font-bold text-[#03162F]">
              Please sign in
            </h1>

            <p className="mt-1.5 text-xs text-slate-500">
              You need to sign in to view this order.
            </p>

            <Link
              href="/customer/orders"
              className="
                mt-5
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#03162F]
                px-5
                py-2.5
                text-xs
                font-bold
                text-white
                transition
                hover:bg-[#0a2548]
              "
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     CUSTOMER
  ======================================================= */

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!customer) {
    return (
      <main className="min-h-screen bg-slate-50 pb-24">
        <CustomerNavigation />

        <section className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-[#03162F]">
              <Package className="h-6 w-6" />
            </div>

            <h1 className="mt-3 text-base font-bold text-[#03162F]">
              Customer profile not found
            </h1>

            <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-500">
              We could not find a customer account connected
              to your profile.
            </p>
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     ORDER
  ======================================================= */

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        business_id,
        customer_id,
        status,
        payment_status,
        fulfillment_method,
        delivery_address,
        notes,
        subtotal,
        total_amount,
        created_at,
        updated_at,

        businesses (
          id,
          name
        ),

        order_items (
          id,
          order_id,
          catalog_item_id,
          quantity,
          unit_price,
          total_price,
          created_at,

          enterprise_catalog (
            id,
            name,
            item_type
          )
        )
      `
    )
    .eq("id", id)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Customer order details error:",
      error
    );
  }

  /* =======================================================
     ORDER NOT FOUND
  ======================================================= */

  if (!order) {
    return (
      <main className="min-h-screen bg-slate-50 pb-24">
        <CustomerNavigation />

        <section className="mx-auto max-w-4xl px-4 py-8">
          <Link
            href="/customer/orders"
            className="
              inline-flex
              items-center
              gap-2
              text-xs
              font-bold
              text-[#03162F]
              transition
              hover:text-[#D4AF37]
            "
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <XCircle className="h-6 w-6" />
            </div>

            <h1 className="mt-3 text-lg font-bold text-[#03162F]">
              Order not found
            </h1>

            <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-500">
              This order does not exist or is not connected
              to your customer account.
            </p>

            <Link
              href="/customer/orders"
              className="
                mt-5
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#03162F]
                px-5
                py-2.5
                text-xs
                font-bold
                text-white
                transition
                hover:bg-[#0a2548]
              "
            >
              View My Orders
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const typedOrder =
    order as unknown as Order;

  const items =
    typedOrder.order_items ?? [];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <CustomerNavigation />

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="bg-[#03162F] px-4 pb-7 pt-6 text-white">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/customer/orders"
            className="
              inline-flex
              items-center
              gap-2
              text-xs
              font-bold
              text-slate-300
              transition
              hover:text-white
            "
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                Order Details
              </p>

              <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl">
                Order #{typedOrder.id.slice(0, 8).toUpperCase()}
              </h1>

              <p className="mt-1.5 text-xs text-slate-300 sm:text-sm">
                {typedOrder.businesses?.name ||
                  "Alessandro Enterprises"}
              </p>
            </div>

            <StatusBadge
              status={typedOrder.status}
            />
          </div>
        </div>
      </section>

      {/* =================================================
          MAIN
      ================================================= */}

      <section className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {/* =================================================
              LEFT
          ================================================= */}

          <div className="space-y-5 lg:col-span-2">
            {/* ORDER ITEMS */}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <h2 className="text-base font-bold text-[#03162F]">
                  Order Items
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {items.length}{" "}
                  {items.length === 1
                    ? "item"
                    : "items"}{" "}
                  in this order.
                </p>
              </div>

              {items.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Package className="mx-auto h-7 w-7 text-slate-300" />

                  <p className="mt-2 text-xs text-slate-500">
                    No items found for this order.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-4 sm:px-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#03162F]">
                            <Package className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-[#03162F]">
                              {item
                                .enterprise_catalog
                                ?.name ||
                                "Product"}
                            </h3>

                            <p className="mt-1 text-[11px] text-slate-500">
                              Qty: {item.quantity}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {formatMoney(
                                item.unit_price
                              )}{" "}
                              each
                            </p>
                          </div>
                        </div>

                        <p className="shrink-0 text-sm font-bold text-[#03162F]">
                          {formatMoney(
                            item.total_price
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TOTALS */}

              <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-slate-500">
                      Subtotal
                    </p>

                    <p className="text-xs font-semibold text-[#03162F]">
                      {formatMoney(
                        typedOrder.subtotal
                      )}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2">
                    <p className="text-sm font-bold text-[#03162F]">
                      Total
                    </p>

                    <p className="text-base font-bold text-[#03162F]">
                      {formatMoney(
                        typedOrder.total_amount
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* NOTES */}

            {typedOrder.notes && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Order Notes
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {typedOrder.notes}
                </p>
              </div>
            )}

            {/* DELIVERY */}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <h2 className="text-base font-bold text-[#03162F]">
                  Fulfillment
                </h2>
              </div>

              <div className="px-4 py-4 sm:px-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#03162F]">
                    {normalizeStatus(
                      typedOrder.fulfillment_method
                    ) === "delivery" ? (
                      <Truck className="h-4 w-4" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-medium text-slate-400">
                      Fulfillment Method
                    </p>

                    <p className="mt-0.5 text-sm font-bold text-[#03162F]">
                      {typedOrder.fulfillment_method ||
                        "Pickup"}
                    </p>

                    {typedOrder.delivery_address && (
                      <>
                        <p className="mt-3 text-[10px] font-medium text-slate-400">
                          Delivery Address
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-slate-600">
                          {typedOrder.delivery_address}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              RIGHT
          ================================================= */}

          <div className="space-y-5">
            {/* PAYMENT */}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <h2 className="text-base font-bold text-[#03162F]">
                  Payment
                </h2>
              </div>

              <div className="px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-[#03162F]">
                      <CreditCard className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-[10px] font-medium text-slate-400">
                        Payment Status
                      </p>

                      <p className="mt-0.5 text-xs font-semibold text-[#03162F]">
                        {typedOrder.payment_status ||
                          "Pending"}
                      </p>
                    </div>
                  </div>

                  <PaymentBadge
                    status={
                      typedOrder.payment_status
                    }
                  />
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Amount
                    </span>

                    <span className="text-base font-bold text-[#03162F]">
                      {formatMoney(
                        typedOrder.total_amount
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ORDER INFORMATION */}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <h2 className="text-base font-bold text-[#03162F]">
                  Order Information
                </h2>
              </div>

              <div className="space-y-4 px-4 py-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#03162F]">
                    <CalendarDays className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400">
                      Order Date
                    </p>

                    <p className="text-xs font-semibold text-[#03162F]">
                      {formatDate(
                        typedOrder.created_at
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#03162F]">
                    <Clock className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400">
                      Last Updated
                    </p>

                    <p className="text-xs font-semibold text-[#03162F]">
                      {formatDateTime(
                        typedOrder.updated_at
                      )}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[10px] text-slate-400">
                    Order ID
                  </p>

                  <p className="mt-0.5 break-all text-[11px] font-semibold text-[#03162F]">
                    {typedOrder.id}
                  </p>
                </div>
              </div>
            </div>

            {/* BACK BUTTON */}

            <Link
              href="/customer/orders"
              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-[#03162F]
                bg-white
                px-4
                py-3
                text-xs
                font-bold
                text-[#03162F]
                transition
                hover:bg-[#03162F]
                hover:text-white
              "
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Orders
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}