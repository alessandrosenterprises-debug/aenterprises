import {
  getConfiguration,
} from "../services/configuration.server.service";

import {
  getConfigurationSchema,
} from "../utils/get-schema";

import ConfigurationManager from "../components/ConfigurationManager";

import {
  getBusinesses,
} from "@/modules/businesses/services/business.service";

import {
  getConfigurationLoanProducts,
} from "@/modules/loans/services/loan-products.service";

interface ConfigurationPageProps {
  type: string;
}

export default async function ConfigurationPage({
  type,
}: ConfigurationPageProps) {
  /* ==========================================================
     LOAD CONFIGURATION SCHEMA
     ========================================================== */

  const baseSchema =
    getConfigurationSchema(type as any);

  if (!baseSchema) {
    throw new Error(
      `Configuration schema not found for "${type}".`
    );
  }

  /* ==========================================================
     LOAD CONFIGURATION DATA
     ========================================================== */

  const rows =
    await getConfiguration(
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
      ? await getConfigurationLoanProducts()
      : [];

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
                  label: product.name,
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
      : rows;

  /* ==========================================================
     TABLE COLUMNS
     ========================================================== */

  const columns = schema.fields
    .filter(
      (field) =>
        field.type !== "image"
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

  /* ==========================================================
     PAGE
     ========================================================== */

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          {schema.title}
        </h1>

        <p className="text-slate-500">
          {schema.description}
        </p>
      </div>

      <ConfigurationManager
        schema={schema}
        initialRows={displayRows}
        columns={columns}
        businesses={businesses}
      />
    </div>
  );
}