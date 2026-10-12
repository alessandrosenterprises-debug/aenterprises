"use client";

import Image from "next/image";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { FileText, Image as ImageIcon, Megaphone, Package, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { deleteBusinessContentAction, saveBusinessContentAction, type BusinessContentSection } from "@/app/dashboard/enterprise/content/actions";
import ImageUpload from "@/components/ui/image-upload/ImageUpload";

export interface ManagedBusiness {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
}

export interface ManagedContentRecord {
  id: string;
  business_id: string;
  [key: string]: unknown;
}

export type ManagedContentSeed = Record<BusinessContentSection, Record<string, ManagedContentRecord[]>>;

const sections: { id: BusinessContentSection; label: string; icon: typeof Wrench }[] = [
  { id: "services", label: "Services", icon: Wrench },
  { id: "products", label: "Products", icon: Package },
  { id: "promotions", label: "Promotions", icon: Megaphone },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "posts", label: "Posts", icon: FileText },
];
const singularLabel: Record<BusinessContentSection, string> = { services: "Service", products: "Product", promotions: "Promotion", gallery: "Gallery image", posts: "Post" };

type FormValues = Record<string, string | boolean>;

function asText(record: ManagedContentRecord, key: string, fallback = "") {
  const value = record[key];
  return value == null ? fallback : String(value);
}

function localDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function initialValues(section: BusinessContentSection, businessSlug: string, record?: ManagedContentRecord): FormValues {
  if (record) {
    const values: FormValues = {};
    for (const [key, value] of Object.entries(record)) {
      if (["active", "published", "featured", "is_featured", "requires_collateral"].includes(key)) values[key] = Boolean(value);
      else if (key === "start_date" || key === "end_date" || key === "published_at") values[key] = localDateTime(String(value ?? ""));
      else if (typeof value === "string" || typeof value === "number") values[key] = String(value);
    }
    values.name = asText(record, "name", asText(record, "title"));
    values.title = asText(record, "title", asText(record, "name"));
    values.category = asText(record, "category", asText(record, "service_type"));
    values.description = asText(record, "description", asText(record, "content"));
    values.status = asText(record, "status", "active");
    return values;
  }

  const defaults: FormValues = { name: "", title: "", category: businessSlug === "mobile-money" ? "cash_in" : "", description: "", content: "", image_url: "", status: "active", active: true, published: true, featured: false, is_featured: false, requires_collateral: false };
  if (section === "posts") defaults.post_type = "update";
  if (section === "gallery") defaults.display_order = "0";
  if (section === "products") defaults.quantity = "";
  return defaults;
}

function normalizeSavedRecord(record: Record<string, unknown>, section: BusinessContentSection, business: ManagedBusiness, sourceTable?: string): ManagedContentRecord {
  if (sourceTable === "mobile_money_services") {
    return { ...record, id: String(record.id), business_id: business.id, name: String(record.name ?? ""), title: String(record.name ?? ""), category: String(record.service_type ?? ""), description: String(record.description ?? ""), item_type: "service", status: String(record.status ?? "Active"), source_table: sourceTable };
  }
  if (sourceTable === "loan_products") {
    return { ...record, id: String(record.id), business_id: business.id, name: String(record.name ?? ""), title: String(record.name ?? ""), category: "Loan Product", item_type: "loan_product", status: String(record.status ?? "Active"), source_table: sourceTable };
  }
  if (section === "services" || section === "products") {
    return { ...record, id: String(record.id), business_id: String(record.business_id ?? business.id), name: String(record.name ?? ""), title: String(record.name ?? ""), item_type: String(record.item_type ?? section.slice(0, -1)), source_table: "enterprise_catalog" };
  }
  return { ...record, id: String(record.id), business_id: String(record.business_id ?? business.id) };
}

function stringValue(values: FormValues, key: string) { return typeof values[key] === "string" ? values[key] as string : ""; }

export default function BusinessContentWorkspace({ businesses, initialContent, initialBusinessId, initialSection }: { businesses: ManagedBusiness[]; initialContent: ManagedContentSeed; initialBusinessId?: string; initialSection?: BusinessContentSection }) {
  const [businessId, setBusinessId] = useState(initialBusinessId ?? businesses[0]?.id ?? "");
  const [section, setSection] = useState<BusinessContentSection>(initialSection ?? "services");
  const [content, setContent] = useState(initialContent);
  const [editing, setEditing] = useState<ManagedContentRecord | null>(null);
  const [form, setForm] = useState<FormValues>({});
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isPending, startTransition] = useTransition();
  const business = useMemo(() => businesses.find((entry) => entry.id === businessId) ?? businesses[0], [businesses, businessId]);
  const activeSection = sections.find((item) => item.id === section)!;
  const ActiveSectionIcon = activeSection.icon;
  const records = content[section][business?.id ?? ""] ?? [];
  const isMobileMoneyService = section === "services" && business?.slug === "mobile-money" && editing?.source_table !== "enterprise_catalog";
  const isSoftLoanProduct = section === "products" && business?.slug === "soft-loans" && editing?.source_table !== "enterprise_catalog";

  function openNewForm() {
    if (!business) return;
    setEditing(null);
    setForm(initialValues(section, business.slug));
    setFormOpen(true);
    setError("");
    setNotice("");
  }

  function openEditForm(record: ManagedContentRecord) {
    if (!business) return;
    setEditing(record);
    setForm(initialValues(section, business.slug, record));
    setFormOpen(true);
    setError("");
    setNotice("");
  }

  function change(key: string, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!business) return;
    setError("");
    setNotice("");
    startTransition(async () => {
      try {
        const result = await saveBusinessContentAction({ section, businessId: business.id, id: editing?.id, sourceTable: typeof editing?.source_table === "string" ? editing.source_table : undefined, values: form });
        const sourceTable = typeof result.source_table === "string" ? result.source_table : typeof editing?.source_table === "string" ? editing.source_table : undefined;
        const saved = normalizeSavedRecord(result, section, business, sourceTable);
        setContent((current) => ({
          ...current,
          [section]: {
            ...current[section],
            [business.id]: editing ? (current[section][business.id] ?? []).map((record) => record.id === saved.id ? saved : record) : [saved, ...(current[section][business.id] ?? [])],
          },
        }));
        setEditing(null);
        setFormOpen(false);
      setNotice(`${singularLabel[section]} saved.`);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save this item.");
      }
    });
  }

  function remove(record: ManagedContentRecord) {
    if (!business || !window.confirm(`Delete “${asText(record, "name", asText(record, "title", "this item"))}”?`)) return;
    setError("");
    setNotice("");
    startTransition(async () => {
      try {
        await deleteBusinessContentAction({ section, businessId: business.id, id: record.id, sourceTable: typeof record.source_table === "string" ? record.source_table : undefined });
        setContent((current) => ({ ...current, [section]: { ...current[section], [business.id]: (current[section][business.id] ?? []).filter((item) => item.id !== record.id) } }));
        setNotice("Content deleted.");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not delete this item.");
      }
    });
  }

  if (!business) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">There are no active businesses to manage.</div>;

  const fields = (key: string, label: string, options?: { type?: string; required?: boolean; placeholder?: string; min?: string; step?: string }) => <label key={key} className="grid gap-1.5 text-sm font-semibold text-slate-700"><span>{label}</span><input type={options?.type ?? "text"} required={options?.required} min={options?.min} step={options?.step} placeholder={options?.placeholder} value={stringValue(form, key)} onChange={(event) => change(key, event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-[#03162F] outline-none focus:border-[#174D8C] focus:ring-2 focus:ring-blue-100" /></label>;
  const textArea = (key: string, label: string, rows = 4) => <label key={key} className="grid gap-1.5 text-sm font-semibold text-slate-700"><span>{label}</span><textarea rows={rows} value={stringValue(form, key)} onChange={(event) => change(key, event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-[#03162F] outline-none focus:border-[#174D8C] focus:ring-2 focus:ring-blue-100" /></label>;
  const toggle = (key: string, label: string) => <label key={key} className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={Boolean(form[key])} onChange={(event) => change(key, event.target.checked)} className="h-4 w-4 accent-[#03162F]" />{label}</label>;
  const imageUpload = <div className="grid gap-2 sm:col-span-2"><span className="text-sm font-semibold text-slate-700">Image</span><ImageUpload value={stringValue(form, "image_url")} onChange={(url) => change("image_url", url)} /></div>;

  return <div className="space-y-6 pb-10">
    <header className="rounded-3xl bg-gradient-to-br from-[#03162F] via-[#0A2852] to-[#174D8C] p-6 text-white shadow-lg sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">Enterprise content management</p>
      <h1 className="mt-2 text-3xl font-black sm:text-4xl">Business Content</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Update customer-facing services, products, promotions, gallery images and posts for any active business.</p>
    </header>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <label className="grid max-w-xl gap-2 text-sm font-bold text-[#03162F]">Choose a business<select value={business.id} onChange={(event) => { setBusinessId(event.target.value); setFormOpen(false); setNotice(""); setError(""); }} className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 font-medium"><option value="" disabled>Select a business</option>{businesses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <div className="mt-5 flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">{sections.map((item) => { const Icon = item.icon; const selected = section === item.id; return <button key={item.id} type="button" onClick={() => { setSection(item.id); setFormOpen(false); setNotice(""); setError(""); }} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${selected ? "bg-[#03162F] text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}><Icon className="h-4 w-4" />{item.label}<span className={`rounded-full px-2 py-0.5 text-xs ${selected ? "bg-white/15 text-white" : "bg-white text-slate-500"}`}>{content[item.id][business.id]?.length ?? 0}</span></button>; })}</div>
      <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black text-[#03162F]">{business.name} · {activeSection.label}</h2><p className="mt-1 text-sm text-slate-500">Add and update the content customers see for this business.</p></div><button type="button" onClick={openNewForm} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0A2852]"><Plus className="h-4 w-4" />Add {singularLabel[section]}</button></div>
    </section>

    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</p>}
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

    {formOpen && <form onSubmit={save} className="space-y-5 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#D4AF37]">{editing ? "Edit item" : "New item"}</p><h2 className="mt-1 text-xl font-black text-[#03162F]">{editing ? `Update ${singularLabel[section]}` : `Add ${singularLabel[section]}`}</h2></div><button type="button" onClick={() => setFormOpen(false)} className="rounded-lg px-3 py-2 text-sm font-bold text-slate-500 hover:bg-white">Cancel</button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {section === "services" && <>{fields("name", "Service name", { required: true })}{fields("category", isMobileMoneyService ? "Service type (e.g. cash_in)" : "Category")}{!isMobileMoneyService && imageUpload}{fields("base_price", "Price (ZMW)", { type: "number", min: "0", step: "0.01" })}{textArea("description", "Description")}{fields("status", "Status (active or inactive)", { placeholder: "active" })}{isMobileMoneyService && <p className="text-xs text-slate-500">Use types such as cash_in, cash_out, transfer, bill_payment or airtime.</p>}</>}
        {section === "products" && <>{fields("name", isSoftLoanProduct ? "Loan product name" : "Product name", { required: true })}{!isSoftLoanProduct && fields("category", "Category")}{!isSoftLoanProduct && imageUpload}{isSoftLoanProduct ? <>{fields("min_amount", "Minimum amount (ZMW)", { type: "number", min: "0", step: "0.01" })}{fields("max_amount", "Maximum amount (ZMW)", { type: "number", min: "0", step: "0.01" })}{fields("interest_rate", "Interest rate (%)", { type: "number", min: "0", step: "0.01" })}{fields("repayment_period", "Repayment period (days)", { type: "number", min: "1", step: "1" })}{toggle("requires_collateral", "Collateral required")}</> : <>{fields("base_price", "Price (ZMW)", { type: "number", min: "0", step: "0.01" })}{fields("quantity", "Stock quantity", { type: "number", min: "0", step: "1" })}</>}{textArea("description", "Description")}{fields("status", "Status (active or inactive)", { placeholder: "active" })}</>}
        {section === "promotions" && <>{fields("title", "Promotion title", { required: true })}{fields("discount_text", "Offer label", { placeholder: "20% off" })}{fields("price", "Offer price (ZMW)", { type: "number", min: "0", step: "0.01" })}{imageUpload}{fields("start_date", "Starts", { type: "datetime-local" })}{fields("end_date", "Ends", { type: "datetime-local" })}{textArea("description", "Description")}{toggle("active", "Active")}{toggle("published", "Visible to customers")}{toggle("featured", "Feature this promotion")}</>}
        {section === "gallery" && <>{fields("title", "Image title")}{imageUpload}{fields("display_order", "Display order", { type: "number", min: "0", step: "1" })}{textArea("caption", "Caption")}{toggle("active", "Visible to customers")}{toggle("is_featured", "Feature this image")}</>}
        {section === "posts" && <>{fields("title", "Post title", { required: true })}{fields("post_type", "Post type", { placeholder: "update" })}{imageUpload}{fields("published_at", "Publish date and time", { type: "datetime-local" })}{textArea("content", "Post content", 5)}{toggle("published", "Publish to customers")}{toggle("featured", "Feature this post")}</>}
      </div>
      <div className="flex flex-wrap gap-3"><button disabled={isPending} type="submit" className="min-h-11 rounded-xl bg-[#03162F] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{isPending ? "Saving…" : "Save changes"}</button><button type="button" onClick={() => setFormOpen(false)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700">Cancel</button></div>
    </form>}

    {records.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><ActiveSectionIcon className="mx-auto h-9 w-9 text-slate-300" /><h3 className="mt-3 font-bold text-[#03162F]">No {activeSection.label.toLowerCase()} yet</h3><p className="mt-1 text-sm text-slate-500">Add the first {singularLabel[section].toLowerCase()} for {business.name}.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{records.map((record) => {
      const title = asText(record, "name", asText(record, "title", activeSection.label.slice(0, -1)));
      const description = asText(record, "description", asText(record, "content", asText(record, "caption")));
      const imageUrl = asText(record, "image_url");
      const status = asText(record, "status", Boolean(record.published) ? "Published" : "Draft");
      return <article key={record.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {imageUrl && <div className="relative aspect-[4/3] bg-slate-100"><Image src={imageUrl} alt={title} fill unoptimized className="object-cover" /></div>}
        <div className="space-y-3 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#9A7910]">{asText(record, "category", asText(record, "discount_text", activeSection.label.slice(0, -1)))}</p><h3 className="mt-1 text-lg font-black text-[#03162F]">{title}</h3></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${status.toLowerCase() === "active" || status.toLowerCase() === "published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{status}</span></div>{description && <p className="line-clamp-3 text-sm leading-6 text-slate-500">{description}</p>}{section === "products" && record.item_type !== "loan_product" && <div className="flex justify-between border-t border-slate-100 pt-3 text-sm"><span className="font-bold text-[#03162F]">{record.base_price ? `ZMW ${asText(record, "base_price")}` : "Price not set"}</span><span className="text-slate-500">{record.quantity !== "" && record.quantity != null ? `${asText(record, "quantity")} in stock` : ""}</span></div>}{section === "products" && record.item_type === "loan_product" && <p className="text-sm text-slate-600">{record.min_amount != null ? `Min ZMW ${asText(record, "min_amount")}` : ""}{record.max_amount != null ? ` · Max ZMW ${asText(record, "max_amount")}` : ""}{record.interest_rate != null ? ` · ${asText(record, "interest_rate")}% interest` : ""}</p>}<div className="flex gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={() => openEditForm(record)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 text-sm font-bold text-[#03162F] hover:bg-slate-200"><Pencil className="h-4 w-4" />Edit</button><button type="button" onClick={() => remove(record)} disabled={isPending} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /><span className="sr-only">Delete</span></button></div></div>
      </article>;
    })}</div>}
  </div>;
}
