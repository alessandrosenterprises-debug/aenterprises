"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createOperationsAwareServerClient } from "@/lib/supabase/operations-aware-server";

async function billingClient(permission: "billing.view" | "billing.manage" = "billing.view") {
  const supabase = await createOperationsAwareServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: allowed, error } = await supabase.rpc("has_permission", { required_permission: permission });
  if (error || !allowed) redirect("/dashboard/access-denied");
  return supabase;
}

export async function getBillingWorkspaceData() {
  const supabase = await billingClient();
  const [{ data: canManage }, businesses, documents, orders, bookings, customers, catalog] = await Promise.all([
    supabase.rpc("has_permission", { required_permission: "billing.manage" }),
    supabase.from("businesses").select("id,name").order("name"),
    supabase.from("accounts_documents").select("id,business_id,branch_id,document_type,document_number,status,customer_id,customer_name,customer_phone,customer_email,source_type,source_id,issue_date,due_date,currency,subtotal,discount_amount,tax_rate,tax_amount,total_amount,amount_paid,notes,created_at,lines:accounts_document_lines(id,description,quantity,unit_price,line_total),payments:accounts_document_payments(id,amount,paid_at,payment_method,reference,notes)").order("issue_date", { ascending: false }).order("created_at", { ascending: false }).limit(250),
    supabase.from("orders").select("id,business_id,store_branch_id,customer_id,total_amount,created_at,status").not("status", "eq", "Cancelled").order("created_at", { ascending: false }).limit(200),
    supabase.from("bookings").select("id,business_id,branch_id,customer_id,catalog_item_id,amount,booking_date,status").not("status", "eq", "Cancelled").order("booking_date", { ascending: false }).limit(200),
    supabase.from("customers").select("id,full_name,phone").order("full_name").limit(1000),
    supabase.from("enterprise_catalog").select("id,name,business_id"),
  ]);
  const failed = [businesses, documents, orders, bookings, customers, catalog].find((result) => result.error);
  if (failed?.error) {
    if (["42P01", "PGRST200", "PGRST204", "42703"].includes(failed.error.code ?? "")) throw new Error("Invoices and quotations need database migration 053. Apply supabase/migrations/053_accounts_invoices_and_quotations.sql and refresh.");
    throw new Error(`Invoices and quotations could not be loaded: ${failed.error.message}`);
  }
  const orderIds = (orders.data ?? []).map((order) => order.id);
  const { data: orderItems, error: orderItemsError } = orderIds.length
    ? await supabase.from("order_items").select("id,order_id,catalog_item_id,quantity,unit_price,total_price").in("order_id", orderIds)
    : { data: [], error: null };
  if (orderItemsError) throw new Error(`Order item details could not be loaded: ${orderItemsError.message}`);
  const { data: branches, error: branchError } = await supabase.from("branches").select("id,business_id,name").order("name");
  if (branchError && !["42P01", "PGRST200", "PGRST204", "42703"].includes(branchError.code ?? "")) throw new Error(`Branches could not be loaded: ${branchError.message}`);
  return {
    businesses: businesses.data ?? [], documents: documents.data ?? [], orders: orders.data ?? [], orderItems: orderItems ?? [],
    bookings: bookings.data ?? [], customers: customers.data ?? [], catalog: catalog.data ?? [], branches: branches ?? [], canManage: Boolean(canManage),
  };
}

export async function createBillingDocument(input: {
  businessId: string; branchId?: string; documentType: "Invoice" | "Quotation"; customerId?: string;
  customerName: string; customerPhone?: string; customerEmail?: string; sourceType: "Manual" | "Order" | "Booking";
  sourceId?: string; issueDate: string; dueDate?: string; discountAmount: number; taxRate: number; notes?: string;
  lines: Array<{ description: string; quantity: number; unitPrice: number }>;
}) {
  const supabase = await billingClient("billing.manage");
  if (!input.businessId || input.customerName.trim().length < 2 || !input.lines.length || input.lines.some((line) => !line.description.trim() || !Number.isFinite(line.quantity) || line.quantity <= 0 || !Number.isFinite(line.unitPrice) || line.unitPrice < 0) || !Number.isFinite(input.discountAmount) || input.discountAmount < 0 || !Number.isFinite(input.taxRate) || input.taxRate < 0 || input.taxRate > 100) throw new Error("Check the customer, dates, line items, discount and optional tax rate.");
  const { data, error } = await supabase.rpc("create_accounts_document", {
    p_business_id: input.businessId, p_branch_id: input.branchId || null, p_document_type: input.documentType,
    p_customer_id: input.customerId || null, p_customer_name: input.customerName.trim(), p_customer_phone: input.customerPhone?.trim() || null,
    p_customer_email: input.customerEmail?.trim() || null, p_source_type: input.sourceType, p_source_id: input.sourceId || null,
    p_issue_date: input.issueDate, p_due_date: input.dueDate || null, p_discount_amount: input.discountAmount, p_tax_rate: input.taxRate,
    p_notes: input.notes?.trim() || null, p_lines: input.lines.map((line) => ({ description: line.description.trim(), quantity: line.quantity, unit_price: line.unitPrice })),
  });
  if (error || !data) throw new Error(error?.message || "The document could not be created.");
  revalidatePath("/dashboard/accounts/invoices"); revalidatePath("/dashboard/accounts");
  return { id: data as string };
}

export async function updateBillingDocumentStatus(documentId: string, status: string) {
  const supabase = await billingClient("billing.manage");
  const { error } = await supabase.rpc("set_accounts_document_status", { p_document_id: documentId, p_status: status });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/accounts/invoices");
}

export async function recordInvoicePayment(input: { documentId: string; amount: number; paidAt: string; paymentMethod: string; reference?: string; notes?: string }) {
  const supabase = await billingClient("billing.manage");
  if (!input.documentId || !Number.isFinite(input.amount) || input.amount <= 0 || !input.paymentMethod.trim()) throw new Error("Enter a valid amount, payment date and method.");
  const { error } = await supabase.rpc("record_accounts_document_payment", { p_document_id: input.documentId, p_amount: input.amount, p_paid_at: input.paidAt, p_payment_method: input.paymentMethod.trim(), p_reference: input.reference?.trim() || null, p_notes: input.notes?.trim() || null });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/accounts/invoices"); revalidatePath("/dashboard/accounts");
}

export async function convertQuotationToInvoice(documentId: string, dueDate: string) {
  const supabase = await billingClient("billing.manage");
  const { data, error } = await supabase.rpc("convert_accounts_quote_to_invoice", { p_document_id: documentId, p_due_date: dueDate || null });
  if (error || !data) throw new Error(error?.message || "The accepted quotation could not be converted.");
  revalidatePath("/dashboard/accounts/invoices");
  return { id: data as string };
}
