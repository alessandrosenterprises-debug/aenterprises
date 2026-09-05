import CustomerNavigation from "@/components/customer/CustomerNavigation";
import { createClient } from "@/lib/supabase/server";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Tag,
  ChevronRight,
  Plus,
} from "lucide-react";
import Link from "next/link";
export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

interface OrderItem {
  id: string;
  order_id: string;
  catalog_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;

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

function formatMoney(amount: number) {
  return `ZMW ${Number(amount ?? 0).toFixed(2)}`;
}

function formatDate(date: string) {
  if (!date) return "Date not available";

  return new Date(date).toLocaleDateString("en-ZM", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: string) {
  if (!date) return "";

  return new Date(date).toLocaleTimeString("en-ZM", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeStatus(status: string | null | undefined) {
  return status?.toLowerCase().trim() || "pending";
}

/* =========================================================
   STATUS CARD
========================================================= */

function StatusCard({
  type,
  count,
}: {
  type:
    | "pending"
    | "confirmed"
    | "processing"
    | "ready"
    | "completed"
    | "cancelled";
  count: number;
}) {
  const config = {
    pending: {
      label: "Pending",
      description: "Awaiting confirmation",
      icon: Hourglass,
      wrapper: "border-amber-200 bg-amber-50/40",
      iconWrapper: "bg-amber-100 text-amber-600",
      labelColor: "text-amber-700",
    },

    confirmed: {
      label: "Confirmed",
      description: "Order confirmed",
      icon: CheckCircle2,
      wrapper: "border-emerald-200 bg-emerald-50/40",
      iconWrapper: "bg-emerald-100 text-emerald-600",
      labelColor: "text-emerald-700",
    },

    processing: {
      label: "Processing",
      description: "Being prepared",
      icon: Package,
      wrapper: "border-blue-200 bg-blue-50/40",
      iconWrapper: "bg-blue-100 text-blue-600",
      labelColor: "text-blue-700",
    },

    ready: {
      label: "Ready",
      description: "Ready for collection",
      icon: ShoppingBag,
      wrapper: "border-purple-200 bg-purple-50/40",
      iconWrapper: "bg-purple-100 text-purple-600",
      labelColor: "text-purple-700",
    },

    completed: {
      label: "Completed",
      description: "Order completed",
      icon: CheckCircle2,
      wrapper: "border-blue-200 bg-blue-50/40",
      iconWrapper: "bg-blue-100 text-blue-600",
      labelColor: "text-blue-700",
    },

    cancelled: {
      label: "Cancelled",
      description: "Order cancelled",
      icon: XCircle,
      wrapper: "border-red-200 bg-red-50/40",
      iconWrapper: "bg-red-100 text-red-600",
      labelColor: "text-red-700",
    },
  };

  const item = config[type];
  const Icon = item.icon;

  return (
    <div
      className={`
        rounded-2xl
        border
        ${item.wrapper}
        px-4
        py-4
        sm:px-5
        sm:py-5
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`
              text-[11px]
              font-bold
              uppercase
              tracking-wide
              ${item.labelColor}
            `}
          >
            {item.label}
          </p>

          <p className="mt-1 text-2xl font-bold leading-none text-slate-900">
            {count}
          </p>

          <p className="mt-1.5 text-[11px] leading-4 text-slate-500">
            {item.description}
          </p>
        </div>

        <div
          className={`
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            ${item.iconWrapper}
          `}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ORDER CARD
========================================================= */

function OrderCard({
  order,
  history = false,
}: {
  order: Order;
  history?: boolean;
}) {
  const status = normalizeStatus(order.status);

  const statusConfig = {
    pending: {
      text: "Pending",
      className: "bg-amber-50 text-amber-700 border-amber-100",
      icon: Hourglass,
    },

    confirmed: {
      text: "Confirmed",
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
      icon: CheckCircle2,
    },

    processing: {
      text: "Processing",
      className: "bg-blue-50 text-blue-700 border-blue-100",
      icon: Package,
    },

    ready: {
      text: "Ready",
      className: "bg-purple-50 text-purple-700 border-purple-100",
      icon: ShoppingBag,
    },

    completed: {
      text: "Completed",
      className: "bg-blue-50 text-blue-700 border-blue-100",
      icon: CheckCircle2,
    },

    cancelled: {
      text: "Cancelled",
      className: "bg-red-50 text-red-700 border-red-100",
      icon: XCircle,
    },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] ??
    statusConfig.pending;

  const StatusIcon = config.icon;

  const itemCount =
    order.order_items?.reduce(
      (total, item) => total + Number(item.quantity ?? 0),
      0
    ) ?? 0;

  return (
    <article
      className="
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      {/* =================================================
          ORDER HEADER
      ================================================= */}

      <div className="px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D4AF37]">
              {order.businesses?.name ||
                "Alessandro Enterprises"}
            </p>

            <h3 className="mt-1 truncate text-base font-bold text-[#03162F] sm:text-lg">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h3>

            <p className="mt-1 text-[11px] text-slate-400">
              {formatDate(order.created_at)} ·{" "}
              {formatTime(order.created_at)}
            </p>
          </div>

          <span
            className={`
              inline-flex
              shrink-0
              items-center
              gap-1.5
              rounded-full
              border
              px-2.5
              py-1.5
              text-[11px]
              font-bold
              ${config.className}
            `}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {config.text}
          </span>
        </div>
      </div>

      {/* =================================================
          ITEMS
      ================================================= */}

      <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
        <div className="space-y-3">
          {order.order_items?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#03162F]">
                  <Package className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#03162F]">
                    {item.enterprise_catalog?.name ||
                      "Product"}
                  </p>

                  <p className="text-[10px] text-slate-400">
                    Qty: {item.quantity}
                  </p>
                </div>
              </div>

              <p className="shrink-0 text-xs font-bold text-[#03162F]">
                {formatMoney(item.total_price)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium text-slate-400">
              Items
            </p>

            <p className="text-xs font-semibold text-[#03162F]">
              {itemCount}
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          FULFILLMENT
      ================================================= */}

      <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#03162F]">
              {order.fulfillment_method === "Delivery" ? (
                <Truck className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-400">
                Fulfillment
              </p>

              <p className="truncate text-xs font-semibold text-[#03162F]">
                {order.fulfillment_method}
              </p>
            </div>
          </div>

          {order.fulfillment_method === "Delivery" &&
            order.delivery_address && (
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#03162F]">
                  <MapPin className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-slate-400">
                    Address
                  </p>

                  <p className="truncate text-xs font-semibold text-[#03162F]">
                    {order.delivery_address}
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* =================================================
          PAYMENT
      ================================================= */}

      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#03162F]">
              <CreditCard className="h-4 w-4" />
            </div>

            <div>
              <p className="text-[10px] font-medium text-slate-400">
                Payment
              </p>

              <p className="text-xs font-semibold capitalize text-[#03162F]">
                {order.payment_status || "Pending"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-slate-400" />

            <p className="text-sm font-bold text-[#03162F]">
              {formatMoney(order.total_amount)}
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          NOTES
      ================================================= */}

      {order.notes && (
        <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Notes
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-600">
            {order.notes}
          </p>
        </div>
      )}

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
        <div className="flex gap-2.5">
          <a
            href={`/customer/orders/${order.id}`}
            className="
              flex
              flex-1
              items-center
              justify-center
              gap-1.5
              rounded-xl
              border-2
              border-[#03162F]
              px-4
              py-3
              text-sm
              font-bold
              text-[#03162F]
              transition
              hover:bg-[#03162F]
              hover:text-white
            "
          >
            View Details
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyOrders({
  history,
}: {
  history?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-[#03162F]">
        <ShoppingBag className="h-6 w-6" />
      </div>

      <h3 className="mt-3 text-base font-bold text-[#03162F]">
        {history
          ? "No order history yet"
          : "No active orders"}
      </h3>

      <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500">
        {history
          ? "Your completed and cancelled orders will appear here."
          : "Your pending, confirmed and active orders will appear here."}
      </p>

      <a
        href="/customer/services"
        className="
          mt-4
          inline-flex
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-slate-100
          px-5
          py-2.5
          text-xs
          font-bold
          text-[#03162F]
          transition
          hover:bg-slate-200
        "
      >
        Browse Products
      </a>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default async function CustomerOrdersPage() {
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
              <ShoppingBag className="h-5 w-5" />
            </div>

            <h1 className="mt-4 text-lg font-bold text-[#03162F]">
              Please sign in
            </h1>

            <p className="mt-1.5 text-xs text-slate-500">
              You need to sign in to view your orders.
            </p>
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     FIND CUSTOMER
  ======================================================= */

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, phone")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  let customer: {
    id: string;
    full_name: string;
    phone: string;
  } | null = null;

  if (profile?.email) {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("email", profile.email)
      .maybeSingle();

    customer = data;
  }

  if (!customer && user.email) {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("email", user.email)
      .maybeSingle();

    customer = data;
  }

  if (!customer && profile?.phone) {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("phone", profile.phone)
      .maybeSingle();

    customer = data;
  }

  /* =======================================================
     NO CUSTOMER
  ======================================================= */

  if (!customer) {
    return (
      <main className="min-h-screen bg-slate-50 pb-24">
        <CustomerNavigation />

        <section className="bg-[#03162F] px-4 pb-8 pt-6 text-white">
          <div className="mx-auto max-w-4xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Customer
            </p>

            <h1 className="mt-1.5 text-2xl font-bold">
              My Orders
            </h1>

            <p className="mt-1.5 text-xs text-slate-300">
              View and manage your orders with Alessandro
              Enterprises.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-[#03162F]">
              <ShoppingBag className="h-6 w-6" />
            </div>

            <h2 className="mt-3 text-base font-bold text-[#03162F]">
              No customer profile found
            </h2>

            <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-500">
              We could not find a customer account connected
              to your profile yet.
            </p>
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     ORDERS
  ======================================================= */

  const { data, error } = await supabase
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

          enterprise_catalog (
            id,
            name,
            item_type
          )
        )
      `
    )
    .eq("customer_id", customer.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Customer orders error:", error);
  }

  const orders = (data ?? []) as unknown as Order[];

  /* =======================================================
     STATUS COUNTS
  ======================================================= */

  const pendingOrders = orders.filter(
    (order) =>
      normalizeStatus(order.status) === "pending"
  );

  const confirmedOrders = orders.filter(
    (order) =>
      normalizeStatus(order.status) === "confirmed"
  );

  const processingOrders = orders.filter(
    (order) =>
      normalizeStatus(order.status) === "processing"
  );

  const readyOrders = orders.filter(
    (order) =>
      normalizeStatus(order.status) === "ready"
  );

  const completedOrders = orders.filter(
    (order) =>
      normalizeStatus(order.status) === "completed"
  );

  const cancelledOrders = orders.filter(
    (order) =>
      normalizeStatus(order.status) === "cancelled"
  );

  /* =======================================================
     ACTIVE ORDERS
  ======================================================= */

  const activeOrders = orders.filter((order) => {
    const status = normalizeStatus(order.status);

    return (
      status === "pending" ||
      status === "confirmed" ||
      status === "processing" ||
      status === "ready"
    );
  });

  /* =======================================================
     HISTORY
  ======================================================= */

  const historyOrders = orders.filter((order) => {
    const status = normalizeStatus(order.status);

    return (
      status === "completed" ||
      status === "cancelled"
    );
  });

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                Customer
              </p>

              <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl">
                My Orders
              </h1>

              <p className="mt-1.5 max-w-xl text-xs leading-5 text-slate-300 sm:text-sm">
                View and manage your orders with Alessandro
                Enterprises.
              </p>
            </div>

            <Link
  href="/customer/orders/new"
  className="
    inline-flex
    w-full
    items-center
    justify-center
    gap-2
    rounded-xl
    bg-[#D4AF37]
    px-4
    py-3
    text-sm
    font-bold
    text-[#03162F]
    shadow-md
    transition
    hover:bg-[#e5c34a]
    sm:w-auto
  "
>
  <Plus className="h-4 w-4" />
  New Order
</Link>
          </div>
        </div>
      </section>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <section className="mx-auto max-w-5xl px-4 py-6 sm:py-8">

        {/* =================================================
            ORDER STATUS
        ================================================= */}

        <div>
          <h2 className="text-xl font-bold text-[#03162F] sm:text-2xl">
            Order Status
          </h2>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Track the status of your orders.
          </p>
        </div>

        {/* =================================================
            STATUS CARDS
        ================================================= */}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatusCard
            type="pending"
            count={pendingOrders.length}
          />

          <StatusCard
            type="confirmed"
            count={confirmedOrders.length}
          />

          <StatusCard
            type="processing"
            count={processingOrders.length}
          />

          <StatusCard
            type="ready"
            count={readyOrders.length}
          />
        </div>

        {/* =================================================
            UPCOMING / HISTORY NAVIGATION
        ================================================= */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <div className="grid grid-cols-2 gap-1">
            <a
              href="#active"
              className="
                flex
                items-center
                justify-center
                rounded-xl
                bg-[#03162F]
                px-3
                py-2.5
                text-xs
                font-bold
                text-white
                sm:text-sm
              "
            >
              Active ({activeOrders.length})
            </a>

            <a
              href="#history"
              className="
                flex
                items-center
                justify-center
                rounded-xl
                px-3
                py-2.5
                text-xs
                font-bold
                text-slate-500
                transition
                hover:bg-slate-100
                sm:text-sm
              "
            >
              History ({historyOrders.length})
            </a>
          </div>
        </div>

        {/* =================================================
            ACTIVE ORDERS
        ================================================= */}

        <section
          id="active"
          className="scroll-mt-6 pt-7"
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#03162F] sm:text-2xl">
              Active Orders
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Your pending, confirmed and active orders.
            </p>
          </div>

          {activeOrders.length === 0 ? (
            <EmptyOrders />
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                />
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            ORDER HISTORY
        ================================================= */}

        <section
          id="history"
          className="scroll-mt-6 pt-8"
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#03162F] sm:text-2xl">
              Order History
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Your completed and cancelled orders.
            </p>
          </div>

          {historyOrders.length === 0 ? (
            <EmptyOrders history />
          ) : (
            <div className="space-y-4">
              {historyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  history
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}