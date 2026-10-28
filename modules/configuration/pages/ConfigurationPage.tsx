import {
  Activity,
  CheckCircle2,
  Database,
  Settings2,
} from "lucide-react";

import {
  getConfiguration,
  getCategoryUsageCounts,
} from "../services/configuration.server.service";

import {
  getConfigurationSchema,
} from "../utils/get-schema";
import type { ConfigurationType } from "../schemas";

import ConfigurationManager from "../components/ConfigurationManager";
import LoanProductStarterTemplates from "../components/LoanProductStarterTemplates";

import {
  getBusinesses,
} from "@/modules/businesses/services/business.service";

import {
  getAllConfigurationLoanProducts,
  getConfigurationLoanTerms,
} from "@/modules/loans/services/loan-products.service";

import {
  getCompanySettings,
} from "../services/configuration.service";

interface ConfigurationPageProps {
  type: ConfigurationType;
}
export default async function ConfigurationPage({
  type,
}: ConfigurationPageProps) {
  /* ==========================================================
     LOAD CONFIGURATION SCHEMA
     ========================================================== */

  const baseSchema =
    getConfigurationSchema(type);

  if (!baseSchema) {
    throw new Error(
      `Configuration schema not found for "${type}".`
    );
  }

  /* ==========================================================
     LOAD CONFIGURATION DATA
     ========================================================== */

  const rows =
    baseSchema.table === "company_settings"
      ? await loadCompanySettings()
      : await getConfiguration(
          baseSchema.table
        );

  /* ==========================================================
     LOAD BUSINESSES
     ========================================================== */

  const businesses =
    baseSchema.table === "branches"
      ? await getBusinesses()
      : [];

  /* ==========================================================
     LOAD LOAN PRODUCTS
     ========================================================== */

  const loanProducts =
    baseSchema.table ===
    "loan_product_terms"
      ? await getAllConfigurationLoanProducts()
      : [];
  const activeLoanTerms = baseSchema.table === "loan_products"
    ? await getConfigurationLoanTerms()
    : [];
  const activeTermCounts = new Map<string, number>();
  for (const term of activeLoanTerms) {
    activeTermCounts.set(term.loan_product_id, (activeTermCounts.get(term.loan_product_id) ?? 0) + 1);
  }

  /* ==========================================================
     BUILD FINAL SCHEMA
     ========================================================== */

  const schema = {
    ...baseSchema,

    fields: baseSchema.fields.map(
      (field) => {
        /* ====================================================
           LOAN PRODUCT DROPDOWN
           ==================================================== */

        if (
          baseSchema.table ===
            "loan_product_terms" &&
          field.key ===
            "loan_product_id"
        ) {
          return {
            ...field,

            type: "select" as const,

            options:
              loanProducts.map(
                (product) => ({
                  label: product.status === "Active" ? product.name : `${product.name} (Inactive)`,
                  value: product.id,
                })
              ),
          };
        }

        return field;
      }
    ),
  };

  /* ==========================================================
     DISPLAY ROWS
     ==========================================================

     loan_product_terms stores:

       loan_product_id = UUID

     The administrator should see:

       Customer Loan

     instead of:

       61365b2b-7b74-4c0b-a546-0d779b5df1d3

     We keep the original loan_product_id on the row because
     Edit still needs the UUID.
     ========================================================== */

  const categoryUsage = baseSchema.table === "categories"
    ? await getCategoryUsageCounts()
    : null;

  const displayRows =
    baseSchema.table ===
    "loan_product_terms"
      ? rows.map((row) => {
          const product =
            loanProducts.find(
              (item) =>
                item.id ===
                row.loan_product_id
            );

          return {
            ...row,

            loan_product_name:
              product?.name ??
              row.loan_product_id ??
              "Unknown Loan Product",
          };
        })
      : baseSchema.table === "categories"
        ? rows.map((row) => {
            const key = String(row.name ?? "").trim().toLocaleLowerCase();
            const usage = categoryUsage?.get(key) ?? { products: 0, services: 0 };
            return {
              ...row,
              catalog_usage: `${usage.products} product${usage.products === 1 ? "" : "s"} · ${usage.services} service${usage.services === 1 ? "" : "s"}`,
              usage_count: usage.products + usage.services,
            };
          })
        : baseSchema.table === "loan_products"
          ? rows.map((row) => {
              const termCount = activeTermCounts.get(String(row.id)) ?? 0;
              const isActive = String(row.status ?? "").toLocaleLowerCase() === "active";
              return {
                ...row,
                active_term_count: termCount,
                loan_readiness: isActive
                  ? termCount > 0 ? "Ready" : "Needs active terms"
                  : "Draft",
              };
            })
          : rows;

  /* ==========================================================
     TABLE COLUMNS
     ========================================================== */

  const columns = schema.fields
    .filter(
      (field) =>
        field.type !== "image" ||
        (schema.table === "businesses" && field.key === "logo_url")
    )
    .map((field) => {
      /*
       * Replace the raw foreign-key column with
       * the friendly loan product name.
       */

      if (
        baseSchema.table ===
          "loan_product_terms" &&
        field.key ===
          "loan_product_id"
      ) {
        return {
          key: "loan_product_name",
          label: "Loan Product",
        };
      }

      return {
        key: field.key,
        label: field.label,
      };
    });

  const tableColumns = baseSchema.table === "categories"
    ? [
        ...columns,
        { key: "catalog_usage", label: "Catalog usage" },
      ]
    : baseSchema.table === "branches"
    ? [
        ...columns.filter((column) => column.key !== "latitude" && column.key !== "longitude"),
        { key: "map_location", label: "Map Location" },
      ]
    : baseSchema.table === "loan_products"
      ? [
          ...columns,
          { key: "active_term_count", label: "Active Terms" },
          { key: "loan_readiness", label: "Offer Readiness" },
        ]
      : columns;

  const hasActiveField = schema.fields.some((field) => field.key === "active" || field.key === "status");
  const activeCount = displayRows.filter((row) => row.active === true || String(row.status ?? "").toLocaleLowerCase() === "active").length;

  /* ==========================================================
     PAGE
     ========================================================== */

  return (
    <div className="min-w-0 w-full space-y-5">
      <header className="sticky top-[-24px] z-[90] -mx-6 -mt-6 overflow-hidden rounded-none bg-[#03162F] px-5 py-5 text-white shadow-lg shadow-[#03162F]/10 sm:px-7 sm:py-6">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.2),transparent_68%)]" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#03162F] shadow-md shadow-black/10">
              <Settings2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8CA62]">
                Operations · Configuration
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[28px]">
                {schema.title}
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                {schema.description || `Manage ${schema.title.toLowerCase()} across Alessandro Enterprises.`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200">
              <Activity className="h-4 w-4" />
              Operational
            </div>
            <div className="flex min-w-[120px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5">
              <Database className="h-4 w-4 text-[#E8CA62]" />
              <div>
                <p className="text-lg font-bold leading-5">{displayRows.length}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">Records</p>
              </div>
            </div>
            {hasActiveField && (
              <div className="flex min-w-[120px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <div>
                  <p className="text-lg font-bold leading-5">{activeCount}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">Active</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {baseSchema.table === "loan_products" && <LoanProductStarterTemplates />}

      <ConfigurationManager
        schema={schema}
        initialRows={displayRows}
        columns={tableColumns}
        businesses={businesses}
      />
    </div>
  );
}

/* ==========================================================
   COMPANY SETTINGS
   ========================================================== */

type ConfigurationCellValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, unknown>;

async function loadCompanySettings() {
  const settings =
    await getCompanySettings();

  /*
   * ConfigurationManager expects configuration-style
   * rows. Keep the company settings object inside an
   * array without changing the existing configuration
   * row handling, especially loan_product_id.
   */
  return settings
    ? [settings as unknown as Record<string, ConfigurationCellValue>]
    : [];
}
