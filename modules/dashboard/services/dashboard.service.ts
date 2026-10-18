import { createClient } from "@/lib/supabase/server";

const BUSINESS_TIME_ZONE = "Africa/Lusaka";

function dateInLusaka(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(date: string, amount: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + amount));
  return value.toISOString().slice(0, 10);
}

function startOfLusakaDay(date: string) {
  return new Date(`${date}T00:00:00+02:00`).toISOString();
}

function countByBusiness<T extends { business_id?: string | null }>(
  rows: T[],
  businessId: string,
) {
  return rows.filter((row) => row.business_id === businessId).length;
}

function recordError(label: string, error: unknown) {
  if (error) console.error(`Dashboard ${label} error:`, error);
}

export async function getDashboardStaffAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { permissionKeys: [], isSuperAdministrator: false, accessControlEnabled: false };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role_id, roles(name)")
    .eq("auth_user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  if (profileError || !profile?.role_id) {
    recordError("staff access", profileError);
    return { permissionKeys: [], isSuperAdministrator: false, accessControlEnabled: false };
  }

  const role = Array.isArray(profile.roles) ? profile.roles[0] : profile.roles;
  const { data: assignments, error } = await supabase
    .from("role_permissions")
    .select("permissions(permission_key)")
    .eq("role_id", profile.role_id);
  if (error) {
    recordError("staff permissions", error);
    return { permissionKeys: [], isSuperAdministrator: role?.name === "Super Administrator", accessControlEnabled: false };
  }

  const permissionKeys = (assignments ?? []).flatMap((assignment) => {
    const permission = Array.isArray(assignment.permissions) ? assignment.permissions[0] : assignment.permissions;
    return permission?.permission_key ? [permission.permission_key] : [];
  });

  return {
    permissionKeys,
    isSuperAdministrator: role?.name === "Super Administrator",
    accessControlEnabled: true,
  };
}

export async function getDashboardStats(requestedDate?: string) {
  const supabase = await createClient();
  const currentDate = dateInLusaka(new Date());
  const isValidDate = Boolean(requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && !Number.isNaN(Date.parse(`${requestedDate}T00:00:00Z`)));
  const selectedDate = isValidDate && requestedDate! <= currentDate ? requestedDate! : currentDate;
  const firstDay = addDays(selectedDate, -6);
  const selectedDayStart = startOfLusakaDay(selectedDate);
  const nextDayStart = startOfLusakaDay(addDays(selectedDate, 1));
  const weekStart = startOfLusakaDay(firstDay);

  const [
    businessesResult,
    bookingsResult,
    pendingBookingsResult,
    consultationResult,
    ordersResult,
    loanRequestsResult,
    employeesResult,
    catalogResult,
    customersResult,
    incomingOrdersResult,
    openLoansResult,
    activeDeliveriesResult,
    pendingConsultationsResult,
  ] = await Promise.all([
    supabase.from("businesses").select("id, name, slug, logo_url, active").order("name"),
    supabase.from("bookings").select("id, business_id, booking_date, status, amount, payment_status, created_at").gte("booking_date", firstDay).lte("booking_date", selectedDate),
    supabase.from("bookings").select("id, business_id, status").eq("status", "Pending"),
    supabase.from("technology_consultation_requests").select("id, business_id, status, created_at").gte("created_at", weekStart).lt("created_at", nextDayStart),
    supabase.from("orders").select("id, business_id, status, total_amount, payment_status, created_at").gte("created_at", weekStart).lt("created_at", nextDayStart),
    supabase.from("customer_loan_applications").select("id, status, created_at").gte("created_at", weekStart).lt("created_at", nextDayStart),
    supabase.from("employees").select("id, business_id, status, is_active, created_at"),
    supabase.from("enterprise_catalog").select("id, business_id, name, item_type, quantity, status"),
    supabase.from("customers").select("id", { count: "exact", head: true }).gte("created_at", selectedDayStart).lt("created_at", nextDayStart),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "Pending"),
    supabase.from("customer_loan_applications").select("id", { count: "exact", head: true }).in("status", ["Pending", "Under Review"]),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("fulfillment_method", "Delivery").not("rider_employee_id", "is", null).not("delivery_status", "in", '("Delivered","Delivery Failed")').not("status", "in", '("Completed","Cancelled")'),
    supabase.from("technology_consultation_requests").select("id", { count: "exact", head: true }).eq("status", "Pending"),
  ]);

  recordError("businesses", businessesResult.error);
  recordError("bookings", bookingsResult.error);
  recordError("pending bookings", pendingBookingsResult.error);
  recordError("consultations", consultationResult.error);
  recordError("orders", ordersResult.error);
  recordError("loan requests", loanRequestsResult.error);
  recordError("employees", employeesResult.error);
  recordError("catalog stock", catalogResult.error);
  recordError("new customers", customersResult.error);
  recordError("incoming orders", incomingOrdersResult.error);
  recordError("open loan applications", openLoansResult.error);
  recordError("active deliveries", activeDeliveriesResult.error);
  recordError("pending consultations", pendingConsultationsResult.error);

  const businesses = businessesResult.data ?? [];
  const bookings = bookingsResult.data ?? [];
  const selectedDayBookings = bookings.filter((booking) => booking.booking_date === selectedDate);
  const allConsultations = consultationResult.data ?? [];
  const allOrders = ordersResult.data ?? [];
  const allLoanRequests = loanRequestsResult.data ?? [];
  const selectedDayConsultations = allConsultations.filter((request) => dateInLusaka(new Date(request.created_at)) === selectedDate);
  const selectedDayOrders = allOrders.filter((order) => dateInLusaka(new Date(order.created_at)) === selectedDate);
  const selectedDayLoanRequests = allLoanRequests.filter((request) => dateInLusaka(new Date(request.created_at)) === selectedDate);
  const pendingBookings = pendingBookingsResult.data ?? [];
  const employees = employeesResult.data ?? [];
  const catalog = catalogResult.data ?? [];

  const dailyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(firstDay, index);
    const dayBookings = bookings.filter((booking) => booking.booking_date === date);
    const dayOrders = allOrders.filter((order) => dateInLusaka(new Date(order.created_at)) === date);
    const dayConsultations = allConsultations.filter((request) => dateInLusaka(new Date(request.created_at)) === date);
    const dayLoanRequests = allLoanRequests.filter((request) => dateInLusaka(new Date(request.created_at)) === date);
    return {
      date,
      label: new Intl.DateTimeFormat("en-ZM", { timeZone: BUSINESS_TIME_ZONE, weekday: "short" }).format(new Date(`${date}T12:00:00+02:00`)),
      bookings: dayBookings.length,
      requests: dayOrders.length + dayConsultations.length + dayLoanRequests.length,
      revenue: dayBookings.filter((booking) => booking.status === "Completed" && booking.payment_status === "Paid").reduce((sum, booking) => sum + Number(booking.amount ?? 0), 0)
        + dayOrders.filter((order) => order.payment_status === "Paid").reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0),
    };
  });

  const businessCards = businesses.map((business) => {
    const businessEmployees = employees.filter((employee) => employee.business_id === business.id);
    const businessCatalog = catalog.filter((item) => item.business_id === business.id);
    const lowStockItems = businessCatalog.filter((item) =>
      String(item.item_type ?? "").toLowerCase() === "product"
      && item.quantity !== null
      && Number(item.quantity) <= 5
      && String(item.status ?? "").toLowerCase() === "active",
    );
    const businessPendingStaff = businessEmployees.filter((employee) =>
      String(employee.status ?? "").toLowerCase() === "pending",
    ).length;
    const businessRequests = selectedDayOrders.filter((order) => order.business_id === business.id);
    const isSoftLoans = business.slug === "soft-loans";
    const businessLoanRequests = isSoftLoans ? selectedDayLoanRequests : [];
    const businessConsultations = selectedDayConsultations.filter((request) => request.business_id === business.id);
    const businessBookings = selectedDayBookings.filter((booking) => booking.business_id === business.id);

    return {
      id: business.id,
      name: business.name,
      slug: business.slug,
      logo_url: business.logo_url,
      active: business.active,
      bookingsToday: businessBookings.length,
      pendingBookings: countByBusiness(pendingBookings, business.id),
      consultationsToday: businessConsultations.length,
      pendingConsultations: businessConsultations.filter((request) => request.status === "Pending").length,
      requestsToday: businessRequests.length + businessLoanRequests.length,
      pendingRequests: businessRequests.filter((request) => request.status === "Pending").length
        + businessLoanRequests.filter((request) => request.status === "Pending" || request.status === "Under Review").length,
      pendingStaff: businessPendingStaff,
      lowStock: lowStockItems.length,
      lowStockItems: lowStockItems.slice(0, 3).map((item) => ({ name: item.name, quantity: Number(item.quantity) })),
    };
  });

  const selectedDayRevenue = selectedDayBookings
    .filter((booking) => booking.status === "Completed" && booking.payment_status === "Paid")
    .reduce((sum, booking) => sum + Number(booking.amount ?? 0), 0)
    + selectedDayOrders
      .filter((order) => order.payment_status === "Paid")
      .reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);

  return {
    date: selectedDate,
    currentDate,
    businesses: businesses.filter((business) => business.active !== false).length,
    employees: employees.filter((employee) => employee.is_active !== false).length,
    newCustomers: customersResult.count ?? 0,
    bookingsToday: selectedDayBookings.length,
    requestsToday: selectedDayOrders.length + selectedDayConsultations.length + selectedDayLoanRequests.length,
    pendingBookings: pendingBookings.length,
    incomingOrders: incomingOrdersResult.count ?? 0,
    openLoans: openLoansResult.count ?? 0,
    activeDeliveries: activeDeliveriesResult.count ?? 0,
    pendingConsultations: pendingConsultationsResult.count ?? 0,
    todayRevenue: selectedDayRevenue,
    businessCards,
    dailyActivity,
  };
}
