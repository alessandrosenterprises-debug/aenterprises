import { getBookings } from "@/modules/bookings/services/booking.service";
import { getCurrentProfile } from "@/modules/enterprise/services/profile.service";
import { getDashboardStaffAccess, getDashboardStats } from "@/modules/dashboard/services/dashboard.service";
import { createClient } from "@/lib/supabase/server";

export const managerRoles = ["Enterprise Manager", "Operations Manager", "Business Manager", "Store Manager", "Branch Manager"] as const;

export interface DashboardQueuePreview {
  id: string;
  title: string;
  detail: string;
  status: string;
  createdAt: string;
  amount?: number;
  fulfillmentMethod?: string;
  deliveryStatus?: string;
  riderEmployeeId?: string | null;
  orderStatus?: string;
  customerPhone?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  paymentStatus?: string;
  subtotal?: number;
  notes?: string | null;
  items?: Array<{ id: string; name: string; quantity: number; unitPrice: number; totalPrice: number }>;
}

export interface DashboardQueuePreviews {
  activity: DashboardQueuePreview[];
  bookings: DashboardQueuePreview[];
  orders: DashboardQueuePreview[];
  courier: DashboardQueuePreview[];
  loans: DashboardQueuePreview[];
  consultations: DashboardQueuePreview[];
  messages: DashboardQueuePreview[];
  customers: DashboardQueuePreview[];
  notifications: DashboardQueuePreview[];
  reviews: DashboardQueuePreview[];
}

export interface StoreStaffDashboardSummary {
  ordersToday: number;
  newOrders: number;
  successfulOrdersToday: number;
  cancelledOrdersToday: number;
  orderValueToday: number;
  bookingsToday: number;
  pendingBookings: number;
  successfulBookingsToday: number;
  cancelledBookingsToday: number;
  bookingValueToday: number;
  activeDeliveries: number;
  deliveriesToday: number;
  completedDeliveriesToday: number;
  consultationsToday: number;
  pendingConsultations: number;
  completedConsultationsToday: number;
  messagesToday: number;
  repliedMessagesToday: number;
  messagesNeedingReply: number;
  unreadNotifications: number;
  cash: null | {
    available: boolean;
    entries: number;
    received: number;
    paidOut: number;
    cashToHandIn: number;
  };
}

/** Store dashboard figures use explicit business + branch filters. Cash is
 * limited to the effective staff member's own till for the Lusaka day. */
export async function getStoreStaffDashboardSummary(input: {
  businessId: string;
  branchId: string;
  date: string;
}): Promise<StoreStaffDashboardSummary> {
  const supabase = await createClient();
  const [{ data: profileRows }, { data: canCashUp }, { data: canReviewCash }, { data: canViewReports }] = await Promise.all([
    supabase.rpc("get_effective_profile"),
    supabase.rpc("has_permission", { required_permission: "cash.reconcile" }),
    supabase.rpc("has_permission", { required_permission: "cash.review" }),
    supabase.rpc("has_permission", { required_permission: "reports.view" }),
  ]);
  const profileId = profileRows?.[0]?.id as string | undefined;
  const cashAllowed = Boolean(profileId && (canCashUp || canReviewCash || canViewReports));
  const start = new Date(`${input.date}T00:00:00+02:00`).toISOString();
  const nextDate = new Date(`${input.date}T00:00:00+02:00`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const end = nextDate.toISOString();

  const [ordersTodayResult, newOrdersResult, bookingsTodayResult, pendingBookingsResult, deliveriesResult, consultationsTodayResult, pendingConsultationsResult, messagesTodayResult, messagesReplyResult, notificationsResult, cashEntriesResult] = await Promise.all([
    supabase.from("orders").select("id, status, fulfillment_method, delivery_status, total_amount").eq("business_id", input.businessId).eq("store_branch_id", input.branchId).gte("created_at", start).lt("created_at", end),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("business_id", input.businessId).eq("store_branch_id", input.branchId).eq("status", "Pending").neq("fulfillment_method", "Delivery"),
    supabase.from("bookings").select("id, status, amount").eq("business_id", input.businessId).eq("branch_id", input.branchId).eq("booking_date", input.date),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("business_id", input.businessId).eq("branch_id", input.branchId).eq("status", "Pending"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("business_id", input.businessId).eq("store_branch_id", input.branchId).eq("fulfillment_method", "Delivery").not("delivery_status", "in", '("Delivered","Delivery Failed")').not("status", "in", '("Completed","Cancelled","Rejected")'),
    supabase.from("technology_consultation_requests").select("id, status").eq("business_id", input.businessId).eq("branch_id", input.branchId).gte("created_at", start).lt("created_at", end),
    supabase.from("technology_consultation_requests").select("id", { count: "exact", head: true }).eq("business_id", input.businessId).eq("branch_id", input.branchId).eq("status", "Pending"),
    supabase.from("messages").select("id, status").eq("business_id", input.businessId).eq("branch_id", input.branchId).gte("created_at", start).lt("created_at", end),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("business_id", input.businessId).eq("branch_id", input.branchId).in("status", ["Unread", "Read"]),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "").eq("unread", true).eq("is_read", false),
    cashAllowed
      ? supabase.from("cash_register_entries").select("amount, direction, counts_toward_till").eq("staff_profile_id", profileId!).eq("business_id", input.businessId).gte("received_at", start).lt("received_at", end)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const results = [ordersTodayResult, newOrdersResult, bookingsTodayResult, pendingBookingsResult, deliveriesResult, consultationsTodayResult, pendingConsultationsResult, messagesTodayResult, messagesReplyResult, notificationsResult];
  for (const result of results) {
    if (result.error) console.error("Store staff dashboard count unavailable:", result.error.message);
  }
  const cashEntries = cashEntriesResult.data ?? [];
  const tillEntries = cashEntries.filter((entry) => entry.counts_toward_till);
  const received = tillEntries.filter((entry) => entry.direction === "in").reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);
  const paidOut = tillEntries.filter((entry) => entry.direction === "out").reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);
  const cash = cashAllowed ? {
    available: !cashEntriesResult.error,
    entries: cashEntries.length,
    received,
    paidOut,
    cashToHandIn: Math.max(0, received - paidOut),
  } : null;

  const orderRows = (ordersTodayResult.data ?? []).filter((order) => order.fulfillment_method !== "Delivery");
  const deliveryRows = (ordersTodayResult.data ?? []).filter((order) => order.fulfillment_method === "Delivery");
  const bookingRows = bookingsTodayResult.data ?? [];
  const consultationRows = consultationsTodayResult.data ?? [];
  const messageRows = messagesTodayResult.data ?? [];
  const sumAmounts = (rows: Array<{ total_amount?: number | string | null; amount?: number | string | null }>, key: "total_amount" | "amount") =>
    rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0);

  return {
    ordersToday: orderRows.length,
    newOrders: newOrdersResult.count ?? 0,
    successfulOrdersToday: orderRows.filter((order) => order.status === "Completed").length,
    cancelledOrdersToday: orderRows.filter((order) => ["Cancelled", "Rejected"].includes(order.status)).length,
    orderValueToday: sumAmounts(orderRows, "total_amount"),
    bookingsToday: bookingRows.length,
    pendingBookings: pendingBookingsResult.count ?? 0,
    successfulBookingsToday: bookingRows.filter((booking) => booking.status === "Completed").length,
    cancelledBookingsToday: bookingRows.filter((booking) => booking.status === "Cancelled").length,
    bookingValueToday: sumAmounts(bookingRows, "amount"),
    activeDeliveries: deliveriesResult.count ?? 0,
    deliveriesToday: deliveryRows.length,
    completedDeliveriesToday: deliveryRows.filter((delivery) => delivery.delivery_status === "Delivered" || delivery.status === "Completed").length,
    consultationsToday: consultationRows.length,
    pendingConsultations: pendingConsultationsResult.count ?? 0,
    completedConsultationsToday: consultationRows.filter((consultation) => consultation.status === "Completed").length,
    messagesToday: messageRows.length,
    repliedMessagesToday: messageRows.filter((message) => message.status === "Replied").length,
    messagesNeedingReply: messagesReplyResult.count ?? 0,
    unreadNotifications: notificationsResult.count ?? 0,
    cash,
  };
}

export async function getDashboardQueuePreviews(permissionKeys: string[], isSuperAdministrator: boolean): Promise<DashboardQueuePreviews> {
  const supabase = await createClient();
  const can = (...permissions: string[]) => isSuperAdministrator || permissions.some((permission) => permissionKeys.includes(permission));
  const { data: { user } } = await supabase.auth.getUser();
  const [bookingsResult, ordersResult, deliveriesResult, loansResult, consultationsResult, messagesResult, customersResult, notificationsResult, reviewsResult] = await Promise.all([
    can("bookings.view", "bookings.manage")
      ? supabase.from("bookings").select("id, booking_date, booking_time, status, amount, created_at, customers(full_name), businesses(name), enterprise_catalog(name)").in("status", ["Pending", "Confirmed"]).order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [], error: null }),
    can("orders.view", "orders.manage")
      ? supabase.from("orders").select("id, status, fulfillment_method, delivery_status, rider_employee_id, payment_status, subtotal, total_amount, notes, created_at, customers(full_name, phone, email), businesses(name), order_items(id, quantity, unit_price, total_price, enterprise_catalog(name))").order("created_at", { ascending: false }).limit(50)
      : Promise.resolve({ data: [], error: null }),
    can("deliveries.manage")
      ? supabase.from("orders").select("id, status, delivery_status, rider_employee_id, fulfillment_method, total_amount, created_at, customers(full_name), businesses(name)").eq("fulfillment_method", "Delivery").order("created_at", { ascending: false }).limit(50)
      : Promise.resolve({ data: [], error: null }),
    can("loans.approve")
      ? supabase.from("customer_loan_applications").select("id, application_number, loan_type, status, requested_amount, created_at, customers(full_name)").in("status", ["Pending", "Under Review"]).order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [], error: null }),
    can("businesses.view")
      ? supabase.from("technology_consultation_requests").select("id, name, consultation_type, status, subject, created_at").in("status", ["Pending", "Contacted", "Scheduled"]).order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [], error: null }),
    can("communications.manage")
      ? supabase.from("messages").select("id, sender_name, subject, status, priority, created_at, business_id, branch_id").order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [], error: null }),
    can("customers.view")
      ? supabase.from("customers").select("id, full_name, phone, created_at, business_id").order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [], error: null }),
    user && can("dashboard.view")
      ? supabase.from("notifications").select("id, title, preview, message, created_at, unread, is_read, user_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [], error: null }),
    can("orders.view")
      ? supabase.from("orders").select("id, delivery_rating, delivery_review, delivery_rated_at, status, created_at, customers(full_name), businesses(name)").eq("fulfillment_method", "Delivery").not("delivery_rating", "is", null).order("delivery_rated_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const [label, error] of [["bookings", bookingsResult.error], ["orders", ordersResult.error], ["deliveries", deliveriesResult.error], ["loans", loansResult.error], ["consultations", consultationsResult.error], ["messages", messagesResult.error], ["customers", customersResult.error], ["notifications", notificationsResult.error], ["customer reviews", reviewsResult.error]] as const) {
    if (error) console.error(`Unable to load dashboard ${label} preview:`, error.message);
  }

  const relationName = (value: { full_name?: string | null; name?: string | null } | { full_name?: string | null; name?: string | null }[] | null | undefined) => {
    const record = Array.isArray(value) ? value[0] : value;
    return record?.full_name ?? record?.name ?? "Customer";
  };
  const bookingRows: DashboardQueuePreview[] = (bookingsResult.data ?? []).map((row) => ({
    id: row.id,
    title: row.customers ? relationName(row.customers) : "Booking",
    detail: `${row.enterprise_catalog ? relationName(row.enterprise_catalog) : "Appointment"} · ${row.booking_date}${row.booking_time ? ` · ${row.booking_time.slice(0, 5)}` : ""}`,
    status: row.status,
    createdAt: row.created_at,
    amount: Number(row.amount ?? 0),
  }));
  const orderRows: DashboardQueuePreview[] = (ordersResult.data ?? []).map((row) => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
    return ({
    id: row.id,
    title: `Order #${row.id.slice(0, 8).toUpperCase()}`,
    detail: `${relationName(row.customers)} · ${relationName(row.businesses)}`,
    status: row.status,
    createdAt: row.created_at,
    amount: Number(row.total_amount ?? 0),
    fulfillmentMethod: row.fulfillment_method,
    deliveryStatus: row.delivery_status,
    riderEmployeeId: row.rider_employee_id,
    customerPhone: customer?.phone,
    customerName: customer?.full_name,
    customerEmail: customer?.email,
    paymentStatus: row.payment_status,
    subtotal: Number(row.subtotal ?? 0),
    notes: row.notes,
    items: (row.order_items ?? []).map((item) => ({
      id: item.id,
      name: relationName(item.enterprise_catalog),
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unit_price ?? 0),
      totalPrice: Number(item.total_price ?? 0),
    })),
    });
  });
  const courierRows: DashboardQueuePreview[] = (deliveriesResult.data ?? []).map((row) => ({
    id: row.id,
    title: `Delivery #${row.id.slice(0, 8).toUpperCase()}`,
    detail: `${relationName(row.customers)} · ${relationName(row.businesses)}`,
    status: row.delivery_status || row.status,
    createdAt: row.created_at,
    amount: Number(row.total_amount ?? 0),
    fulfillmentMethod: row.fulfillment_method,
    deliveryStatus: row.delivery_status,
    riderEmployeeId: row.rider_employee_id,
    orderStatus: row.status,
  }));
  const loanRows: DashboardQueuePreview[] = (loansResult.data ?? []).map((row) => ({
    id: row.id,
    title: row.application_number || row.loan_type,
    detail: `${relationName(row.customers)} · ${row.loan_type}`,
    status: row.status,
    createdAt: row.created_at,
    amount: Number(row.requested_amount ?? 0),
  }));
  const consultationRows: DashboardQueuePreview[] = (consultationsResult.data ?? []).map((row) => ({
    id: row.id,
    title: row.subject || row.consultation_type,
    detail: `${row.name} · ${row.consultation_type}`,
    status: row.status,
    createdAt: row.created_at,
  }));
  const messageRows: DashboardQueuePreview[] = (messagesResult.data ?? []).map((row) => ({
    id: row.id,
    title: row.subject || "Customer message",
    detail: `${row.sender_name} · ${row.priority || "Normal"}`,
    status: row.status,
    createdAt: row.created_at,
  }));
  const customerRows: DashboardQueuePreview[] = (customersResult.data ?? []).map((row) => ({
    id: row.id,
    title: row.full_name || "Customer",
    detail: row.phone || "No phone number on file",
    status: "Customer record",
    createdAt: row.created_at,
  }));
  const notificationRows: DashboardQueuePreview[] = (notificationsResult.data ?? []).map((row) => ({
    id: row.id,
    title: row.title || "Notification",
    detail: row.preview || row.message || "New update",
    status: row.unread && !row.is_read ? "Unread" : "Read",
    createdAt: row.created_at,
  }));
  const reviewRows: DashboardQueuePreview[] = (reviewsResult.data ?? []).map((row) => ({
    id: row.id,
    title: `${relationName(row.customers)} · ${Number(row.delivery_rating).toFixed(1)} / 5`,
    detail: row.delivery_review || `Delivery review · ${relationName(row.businesses)}`,
    status: row.status,
    createdAt: row.delivery_rated_at || row.created_at,
  }));

  const activityCandidates = [
    ...bookingRows.map((item) => ({ ...item, detail: `Booking · ${item.title} · ${item.status}` })),
    ...orderRows.map((item) => ({ ...item, detail: `Order · ${item.status}` })),
    ...courierRows.map((item) => ({ ...item, detail: `Courier · ${item.status}` })),
    ...loanRows.map((item) => ({ ...item, detail: `Loan · ${item.detail} · ${item.status}` })),
    ...consultationRows.map((item) => ({ ...item, detail: `Consultation · ${item.detail} · ${item.status}` })),
  ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  const seenActivityIds = new Set<string>();
  const activity = activityCandidates.filter((item) => {
    if (seenActivityIds.has(item.id)) return false;
    seenActivityIds.add(item.id);
    return true;
  }).slice(0, 6);

  return { activity, bookings: bookingRows, orders: orderRows, courier: courierRows, loans: loanRows, consultations: consultationRows, messages: messageRows, customers: customerRows, notifications: notificationRows, reviews: reviewRows };
}

export async function getRoleDashboardData(requestedDate?: string) {
  const [profile, stats, staffAccess] = await Promise.all([
    getCurrentProfile(),
    getDashboardStats(requestedDate),
    getDashboardStaffAccess(),
  ]);
  const canManageBookings = staffAccess.permissionKeys.includes("bookings.manage") || staffAccess.isSuperAdministrator;
  const [bookings, queuePreviews] = await Promise.all([
    canManageBookings ? getBookings() : Promise.resolve([]),
    getDashboardQueuePreviews(staffAccess.permissionKeys, staffAccess.isSuperAdministrator),
  ]);
  return { profile, stats, staffAccess, canManageBookings, bookings, queuePreviews };
}

export function isManagerRole(role: string | undefined): boolean {
  return managerRoles.some((managerRole) => managerRole === role);
}
