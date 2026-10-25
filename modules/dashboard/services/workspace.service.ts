import { getBookings } from "@/modules/bookings/services/booking.service";
import { getCurrentProfile } from "@/modules/enterprise/services/profile.service";
import { getDashboardStaffAccess, getDashboardStats } from "@/modules/dashboard/services/dashboard.service";
import { createClient } from "@/lib/supabase/server";

export const managerRoles = ["Enterprise Manager", "Operations Manager", "Business Manager"] as const;

export interface DashboardQueuePreview {
  id: string;
  title: string;
  detail: string;
  status: string;
  createdAt: string;
  amount?: number;
}

export interface DashboardQueuePreviews {
  activity: DashboardQueuePreview[];
  bookings: DashboardQueuePreview[];
  orders: DashboardQueuePreview[];
  courier: DashboardQueuePreview[];
  loans: DashboardQueuePreview[];
  consultations: DashboardQueuePreview[];
}

export async function getDashboardQueuePreviews(permissionKeys: string[], isSuperAdministrator: boolean): Promise<DashboardQueuePreviews> {
  const supabase = await createClient();
  const can = (...permissions: string[]) => isSuperAdministrator || permissions.some((permission) => permissionKeys.includes(permission));
  const [bookingsResult, ordersResult, deliveriesResult, loansResult, consultationsResult] = await Promise.all([
    can("bookings.view", "bookings.manage")
      ? supabase.from("bookings").select("id, booking_date, booking_time, status, amount, created_at, customers(full_name), businesses(name), enterprise_catalog(name)").in("status", ["Pending", "Confirmed"]).order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [], error: null }),
    can("orders.view", "orders.manage")
      ? supabase.from("orders").select("id, status, fulfillment_method, total_amount, created_at, customers(full_name), businesses(name)").not("status", "in", '("Completed","Cancelled")').order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [], error: null }),
    can("deliveries.manage")
      ? supabase.from("orders").select("id, status, delivery_status, total_amount, created_at, customers(full_name), businesses(name)").eq("fulfillment_method", "Delivery").not("delivery_status", "in", '("Delivered","Delivery Failed")').not("status", "in", '("Completed","Cancelled")').order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [], error: null }),
    can("loans.approve")
      ? supabase.from("customer_loan_applications").select("id, application_number, loan_type, status, requested_amount, created_at, customers(full_name)").in("status", ["Pending", "Under Review"]).order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [], error: null }),
    can("businesses.view")
      ? supabase.from("technology_consultation_requests").select("id, name, consultation_type, status, subject, created_at").in("status", ["Pending", "Contacted", "Scheduled"]).order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const [label, error] of [["bookings", bookingsResult.error], ["orders", ordersResult.error], ["deliveries", deliveriesResult.error], ["loans", loansResult.error], ["consultations", consultationsResult.error]] as const) {
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
  const orderRows: DashboardQueuePreview[] = (ordersResult.data ?? []).map((row) => ({
    id: row.id,
    title: `Order #${row.id.slice(0, 8).toUpperCase()}`,
    detail: `${relationName(row.customers)} · ${relationName(row.businesses)}`,
    status: row.status,
    createdAt: row.created_at,
    amount: Number(row.total_amount ?? 0),
  }));
  const courierRows: DashboardQueuePreview[] = (deliveriesResult.data ?? []).map((row) => ({
    id: row.id,
    title: `Delivery #${row.id.slice(0, 8).toUpperCase()}`,
    detail: `${relationName(row.customers)} · ${relationName(row.businesses)}`,
    status: row.delivery_status || row.status,
    createdAt: row.created_at,
    amount: Number(row.total_amount ?? 0),
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

  return { activity, bookings: bookingRows, orders: orderRows, courier: courierRows, loans: loanRows, consultations: consultationRows };
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
