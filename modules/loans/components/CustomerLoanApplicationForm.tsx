"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

import { createCustomerLoanAction } from "@/app/dashboard/loans/actions";
import { supabase } from "@/lib/supabase/client";

/* ============================================================
   TYPES
   ============================================================ */

interface Customer {
  id: string;
  customer_code?: string | null;
  full_name: string;
  phone: string;
  email?: string | null;
  national_id?: string | null;
}

interface Collateral {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

interface Operator {
  id: string;
  name: string;
  type: string;
  code: string | null;
  active: boolean;
}

interface LoanProduct {
  id: string;
  name: string;
}

interface LoanTerm {
  id: string;
  loan_product_id?: string | null;
  period_days: number;
  interest_rate: number;
  active: boolean;
  loan_products?: LoanProduct | null;
}

interface CustomerLoanApplicationFormProps {
  customers: Customer[];
  collaterals: Collateral[];
  operators: Operator[];
  loanTerms: LoanTerm[];
  onSuccess?: () => void;
}

interface FormValues {
  customer_id: string;
  application_date: string;

  residential_address: string;

  next_of_kin_name: string;
  next_of_kin_relationship: string;
  next_of_kin_phone: string;

  nrc_front?: FileList;
  nrc_back?: FileList;
  selfie?: FileList;

  collateral_id: string;
  collateral_worth: string;

  repayment_period: string;
  account_operator_id: string;

  principal: string;
  amount_paid: string;

  due_date: string;
  notes: string;
}

/* ============================================================
   HELPERS
   ============================================================ */

function money(value: number) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDateForInput(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDaysToDate(
  dateString: string,
  days: number
) {
  if (!dateString || !days) {
    return "";
  }

  const date = new Date(
    `${dateString}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setDate(
    date.getDate() + days
  );

  return formatDateForInput(date);
}

function displayDate(
  dateString: string
) {
  if (!dateString) {
    return "Not calculated";
  }

  const date = new Date(
    `${dateString}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat(
    "en-ZM",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function createPreview(
  fileList: FileList | undefined
) {
  if (
    !fileList ||
    fileList.length === 0
  ) {
    return null;
  }

  return URL.createObjectURL(
    fileList[0]
  );
}

/* ============================================================
   CLIENT-SIDE SUPABASE STORAGE UPLOAD
   ============================================================ */

async function uploadVerificationFile(
  file: File,
  customerId: string,
  documentType:
    | "nrc-front"
    | "nrc-back"
    | "selfie"
) {
  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase() || "jpg";

  const fileName =
    `${documentType}-${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const filePath =
    `${customerId}/${fileName}`;

  const {
    error,
  } = await supabase.storage
    .from("customer-verification")
    .upload(
      filePath,
      file,
      {
        cacheControl: "3600",
        upsert: false,
        contentType:
          file.type || "image/jpeg",
      }
    );

  if (error) {
    throw new Error(
      `Failed to upload ${documentType}: ${error.message}`
    );
  }

  return filePath;
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function CustomerLoanApplicationForm({
  customers,
  collaterals,
  operators,
  loanTerms,
  onSuccess,
}: CustomerLoanApplicationFormProps) {
  const router = useRouter();

  /* ==========================================================
     DATE
     ========================================================== */

  const today = formatDateForInput(
    new Date()
  );

  /* ==========================================================
     IMAGE PREVIEWS
     ========================================================== */

  const [
    nrcFrontPreview,
    setNrcFrontPreview,
  ] = useState<string | null>(null);

  const [
    nrcBackPreview,
    setNrcBackPreview,
  ] = useState<string | null>(null);

  const [
    selfiePreview,
    setSelfiePreview,
  ] = useState<string | null>(null);

  /* ==========================================================
     FORM
     ========================================================== */

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: {
      isSubmitting,
    },
  } = useForm<FormValues>({
    defaultValues: {
      customer_id: "",

      application_date: today,

      residential_address: "",

      next_of_kin_name: "",
      next_of_kin_relationship: "",
      next_of_kin_phone: "",

      collateral_id: "",
      collateral_worth: "",

      repayment_period: "",
      account_operator_id: "",

      principal: "",
      amount_paid: "0",

      due_date: "",
      notes: "",
    },
  });

  /* ==========================================================
     WATCHED VALUES
     ========================================================== */

  const customerId = watch(
    "customer_id"
  );

  const principalValue = watch(
    "principal"
  );

  const selectedTermId = watch(
    "repayment_period"
  );

  const applicationDate = watch(
    "application_date"
  );

  const amountPaidValue = watch(
    "amount_paid"
  );

  /* ==========================================================
     SELECTED CUSTOMER
     ========================================================== */

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState<Customer | null>(
    null
  );

  /* ==========================================================
     NUMERIC VALUES
     ========================================================== */

  const principal = Number(
    principalValue || 0
  );

  const amountPaid = Number(
    amountPaidValue || 0
  );

  /* ==========================================================
     ACTIVE LOAN TERMS
     ========================================================== */

  const activeLoanTerms = useMemo(() => {
    return [...(loanTerms ?? [])]
      .filter(
        (term) =>
          term.active === true &&
          Boolean(term.id) &&
          Number(term.period_days) > 0
      )
      .sort(
        (a, b) =>
          Number(a.period_days) -
          Number(b.period_days)
      );
  }, [loanTerms]);

  /* ==========================================================
     SELECTED LOAN TERM
     ========================================================== */

  const selectedTerm = useMemo(() => {
    if (!selectedTermId) {
      return null;
    }

    return (
      activeLoanTerms.find(
        (term) =>
          term.id === selectedTermId
      ) ?? null
    );
  }, [
    selectedTermId,
    activeLoanTerms,
  ]);

  /* ==========================================================
     INTEREST RATE
     ========================================================== */

  const interestRate = Number(
    selectedTerm?.interest_rate ?? 0
  );

  /* ==========================================================
     INTEREST
     ========================================================== */

  const interest = useMemo(() => {
    if (
      principal <= 0 ||
      interestRate <= 0
    ) {
      return 0;
    }

    return (
      principal *
      (interestRate / 100)
    );
  }, [
    principal,
    interestRate,
  ]);

  /* ==========================================================
     TOTAL DEBT
     ========================================================== */

  const debt = useMemo(() => {
    return Math.max(
      principal + interest,
      0
    );
  }, [
    principal,
    interest,
  ]);

  /* ==========================================================
     BALANCE
     ========================================================== */

  const balance = useMemo(() => {
    return Math.max(
      debt - amountPaid,
      0
    );
  }, [
    debt,
    amountPaid,
  ]);

  /* ==========================================================
     STATUS
     ========================================================== */

  const status = useMemo(() => {
    if (debt <= 0) {
      return "Pending";
    }

    if (balance <= 0) {
      return "Cleared";
    }

    if (amountPaid > 0) {
      return "Partial";
    }

    return "Pending";
  }, [
    debt,
    balance,
    amountPaid,
  ]);

  /* ==========================================================
     CALCULATED DUE DATE
     ========================================================== */

  const calculatedDueDate = useMemo(() => {
    if (
      !applicationDate ||
      !selectedTerm
    ) {
      return "";
    }

    return addDaysToDate(
      applicationDate,
      Number(
        selectedTerm.period_days
      )
    );
  }, [
    applicationDate,
    selectedTerm,
  ]);

  /* ==========================================================
     SYNC DUE DATE
     ========================================================== */

  useEffect(() => {
    setValue(
      "due_date",
      calculatedDueDate
    );
  }, [
    calculatedDueDate,
    setValue,
  ]);

  /* ==========================================================
     FIND SELECTED CUSTOMER
     ========================================================== */

  useEffect(() => {
    const customer =
      customers.find(
        (item) =>
          item.id === customerId
      ) ?? null;

    setSelectedCustomer(customer);
  }, [
    customerId,
    customers,
  ]);

  /* ==========================================================
     CLEAN UP IMAGE PREVIEWS
     ========================================================== */

  useEffect(() => {
    return () => {
      if (nrcFrontPreview) {
        URL.revokeObjectURL(
          nrcFrontPreview
        );
      }
    };
  }, [nrcFrontPreview]);

  useEffect(() => {
    return () => {
      if (nrcBackPreview) {
        URL.revokeObjectURL(
          nrcBackPreview
        );
      }
    };
  }, [nrcBackPreview]);

  useEffect(() => {
    return () => {
      if (selfiePreview) {
        URL.revokeObjectURL(
          selfiePreview
        );
      }
    };
  }, [selfiePreview]);

  /* ==========================================================
     CUSTOMER OPTIONS
     ========================================================== */

  const customerOptions =
    customers.map((customer) => ({
      label: `${customer.full_name}${
        customer.customer_code
          ? ` — ${customer.customer_code}`
          : ""
      }`,
      value: customer.id,
    }));

  /* ==========================================================
     COLLATERAL OPTIONS
     ========================================================== */

  const collateralOptions =
    collaterals
      .filter(
        (item) => item.active
      )
      .map((item) => ({
        label: item.name,
        value: item.id,
      }));

  /* ==========================================================
     OPERATOR OPTIONS
     ========================================================== */

  const operatorOptions =
    operators
      .filter(
        (item) => item.active
      )
      .map((operator) => ({
        label: `${operator.name}${
          operator.code
            ? ` (${operator.code})`
            : ""
        }`,
        value: operator.id,
      }));

  /* ==========================================================
     LOAN TERM OPTIONS
     ========================================================== */

  const loanTermOptions =
    activeLoanTerms.map((term) => ({
      label: `${term.period_days} Days — ${term.interest_rate}% Interest`,
      value: term.id,
    }));

  /* ==========================================================
     SUBMIT
     ========================================================== */

  async function onSubmit(
    data: FormValues
  ) {
    try {
      /* ------------------------------------------------------
         CUSTOMER
         ------------------------------------------------------ */

      if (!data.customer_id) {
        toast.error(
          "Please select a customer."
        );

        return;
      }

      /* ------------------------------------------------------
         RESIDENTIAL ADDRESS
         ------------------------------------------------------ */

      const residentialAddress =
        data.residential_address.trim();

      if (
        residentialAddress.length < 5
      ) {
        toast.error(
          "Please enter a complete residential address."
        );

        return;
      }

      /* ------------------------------------------------------
         NEXT OF KIN
         ------------------------------------------------------ */

      const nextOfKinName =
        data.next_of_kin_name.trim();

      const nextOfKinRelationship =
        data.next_of_kin_relationship.trim();

      const nextOfKinPhone =
        data.next_of_kin_phone.trim();

      if (!nextOfKinName) {
        toast.error(
          "Please enter the next of kin's name."
        );

        return;
      }

      if (!nextOfKinRelationship) {
        toast.error(
          "Please select the next of kin relationship."
        );

        return;
      }

      if (
        nextOfKinPhone.length < 9
      ) {
        toast.error(
          "Please enter a valid next of kin phone number."
        );

        return;
      }

      /* ------------------------------------------------------
         NRC FRONT
         ------------------------------------------------------ */

      const nrcFront =
        data.nrc_front?.[0];

      if (!nrcFront) {
        toast.error(
          "Please upload the front of the NRC."
        );

        return;
      }

      /* ------------------------------------------------------
         NRC BACK
         ------------------------------------------------------ */

      const nrcBack =
        data.nrc_back?.[0];

      if (!nrcBack) {
        toast.error(
          "Please upload the back of the NRC."
        );

        return;
      }

      /* ------------------------------------------------------
         SELFIE
         ------------------------------------------------------ */

      const selfie =
        data.selfie?.[0];

      if (!selfie) {
        toast.error(
          "Please upload a customer selfie."
        );

        return;
      }

      /* ------------------------------------------------------
         FILE VALIDATION
         ------------------------------------------------------ */

      const verificationFiles = [
        {
          file: nrcFront,
          name: "NRC front",
        },
        {
          file: nrcBack,
          name: "NRC back",
        },
        {
          file: selfie,
          name: "Customer selfie",
        },
      ];

      for (
        const item of verificationFiles
      ) {
        if (
          !item.file.type.startsWith(
            "image/"
          )
        ) {
          toast.error(
            `${item.name} must be an image.`
          );

          return;
        }

        if (
          item.file.size >
          5 * 1024 * 1024
        ) {
          toast.error(
            `${item.name} must be 5MB or smaller.`
          );

          return;
        }
      }

      /* ------------------------------------------------------
         ACCOUNT
         ------------------------------------------------------ */

      if (
        !data.account_operator_id
      ) {
        toast.error(
          "Please select the disbursement account."
        );

        return;
      }

      /* ------------------------------------------------------
         COLLATERAL
         ------------------------------------------------------ */

      if (!data.collateral_id) {
        toast.error(
          "Please select the collateral."
        );

        return;
      }

      /* ------------------------------------------------------
         PRINCIPAL
         ------------------------------------------------------ */

      if (
        !Number.isFinite(principal) ||
        principal <= 0
      ) {
        toast.error(
          "Principal must be greater than zero."
        );

        return;
      }

      /* ------------------------------------------------------
         LOAN TERM
         ------------------------------------------------------ */

      if (!selectedTerm) {
        toast.error(
          "Please select a valid loan term."
        );

        return;
      }

      /* ------------------------------------------------------
         INTEREST
         ------------------------------------------------------ */

      if (
        !Number.isFinite(interestRate) ||
        interestRate < 0
      ) {
        toast.error(
          "Interest rate cannot be negative."
        );

        return;
      }

      /* ------------------------------------------------------
         REPAYMENT
         ------------------------------------------------------ */

      if (
        !Number.isFinite(amountPaid) ||
        amountPaid < 0
      ) {
        toast.error(
          "Repaid amount cannot be negative."
        );

        return;
      }

      if (amountPaid > debt) {
        toast.error(
          "Repaid amount cannot exceed the total debt."
        );

        return;
      }

      /* ------------------------------------------------------
         DUE DATE
         ------------------------------------------------------ */

      if (!calculatedDueDate) {
        toast.error(
          "Unable to calculate the loan due date."
        );

        return;
      }

      /* ======================================================
         UPLOAD VERIFICATION DOCUMENTS DIRECTLY TO SUPABASE
         ====================================================== */

      toast.loading(
        "Uploading customer verification documents...",
        {
          id: "customer-loan",
        }
      );

      /*
       * IMPORTANT:
       *
       * These uploads happen in the browser directly to
       * Supabase Storage.
       *
       * The files NEVER pass through the Next.js Server Action.
       *
       * Therefore the 1MB Server Action body limit does
       * not apply to these images.
       */

      const nrcFrontPath =
        await uploadVerificationFile(
          nrcFront,
          data.customer_id,
          "nrc-front"
        );

      const nrcBackPath =
        await uploadVerificationFile(
          nrcBack,
          data.customer_id,
          "nrc-back"
        );

      const selfiePath =
        await uploadVerificationFile(
          selfie,
          data.customer_id,
          "selfie"
        );

      /* ======================================================
         SAVE LOAN
         ====================================================== */

      toast.loading(
        "Saving customer loan...",
        {
          id: "customer-loan",
        }
      );

      /*
       * ONLY STRINGS AND NORMAL DATA ARE SENT TO THE
       * SERVER ACTION.
       *
       * No File objects are sent here.
       */

      await createCustomerLoanAction({
        customer_id:
          data.customer_id,

        loan_product_id:
          selectedTerm.loan_product_id ??
          null,

        application_source:
          "Walk-in",

        application_date:
          data.application_date ||
          today,

        loan_type:
          "Customer Loan",

        requested_amount:
          principal,

        interest_rate:
          interestRate,

        repayment_period:
          Number(
            selectedTerm.period_days
          ),

        loan_purpose:
          null,

        collateral_required:
          true,

        collateral_description:
          null,

        collateral_id:
          data.collateral_id ||
          null,

        collateral_worth:
          data.collateral_worth
            ? Number(
                data.collateral_worth
              )
            : null,

        account_operator_id:
          data.account_operator_id ||
          null,

        due_date:
          calculatedDueDate,

        residential_address:
          residentialAddress,

        next_of_kin_name:
          nextOfKinName,

        next_of_kin_relationship:
          nextOfKinRelationship,

        next_of_kin_phone:
          nextOfKinPhone,

        notes:
          data.notes.trim() ||
          null,

        /*
         * Supabase Storage paths.
         * These are small strings, NOT File objects.
         */

        nrc_front_path:
          nrcFrontPath,

        nrc_back_path:
          nrcBackPath,

        selfie_path:
          selfiePath,
      });

      /* ======================================================
         SUCCESS
         ====================================================== */

      toast.success(
        "Customer loan recorded successfully.",
        {
          id: "customer-loan",
        }
      );

      onSuccess?.();

      router.refresh();
    } catch (error) {
      console.error(
        "Customer loan creation error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to record customer loan.",
        {
          id: "customer-loan",
        }
      );
    }
  }

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <form
      onSubmit={handleSubmit(
        onSubmit
      )}
      className="space-y-8"
    >
      {/* ======================================================
          CUSTOMER INFORMATION
          ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#03162F]">
            Customer Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select the customer receiving
            the loan.
          </p>
        </div>

        <div className="grid gap-6">
          <Select
            label="Customer *"
            placeholder="Select Customer"
            options={
              customerOptions
            }
            {...register(
              "customer_id",
              {
                required:
                  "Please select a customer.",
              }
            )}
          />

          {selectedCustomer && (
            <div className="grid gap-4 rounded-xl bg-slate-50 p-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Customer
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {
                    selectedCustomer.full_name
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  NRC
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {
                    selectedCustomer.national_id ||
                    "Not provided"
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Contact
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {
                    selectedCustomer.phone
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ======================================================
          CUSTOMER VERIFICATION
          ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#03162F]">
            Customer Verification
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Capture the customer's identity
            documents, residential address,
            and next of kin information.
          </p>
        </div>

        {/* NRC DOCUMENTS */}

        <div className="mb-8">
          <h3 className="mb-1 text-base font-bold text-slate-900">
            NRC Documents
          </h3>

          <p className="mb-4 text-sm text-slate-500">
            Capture clear images of both
            sides of the customer's NRC.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {/* NRC FRONT */}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="mb-3 block text-sm font-semibold text-slate-800">
                NRC Front *
              </label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                {...register(
                  "nrc_front",
                  {
                    required:
                      "NRC front is required.",

                    validate: {
                      fileType: (
                        files
                      ) => {
                        if (!files?.[0]) {
                          return "NRC front is required.";
                        }

                        return (
                          files[0].type.startsWith(
                            "image/"
                          ) ||
                          "Please select an image."
                        );
                      },

                      fileSize: (
                        files
                      ) => {
                        if (!files?.[0]) {
                          return true;
                        }

                        return (
                          files[0]
                            .size <=
                            5 *
                              1024 *
                              1024 ||
                          "Image must be 5MB or smaller."
                        );
                      },
                    },
                  }
                )}
                onChange={(
                  event
                ) => {
                  setNrcFrontPreview(
                    createPreview(
                      event.target.files ??
                        undefined
                    )
                  );
                }}
                className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-3 text-sm"
              />

              {nrcFrontPreview && (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <img
                    src={
                      nrcFrontPreview
                    }
                    alt="NRC front preview"
                    className="h-52 w-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* NRC BACK */}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="mb-3 block text-sm font-semibold text-slate-800">
                NRC Back *
              </label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                {...register(
                  "nrc_back",
                  {
                    required:
                      "NRC back is required.",

                    validate: {
                      fileType: (
                        files
                      ) => {
                        if (!files?.[0]) {
                          return "NRC back is required.";
                        }

                        return (
                          files[0].type.startsWith(
                            "image/"
                          ) ||
                          "Please select an image."
                        );
                      },

                      fileSize: (
                        files
                      ) => {
                        if (!files?.[0]) {
                          return true;
                        }

                        return (
                          files[0]
                            .size <=
                            5 *
                              1024 *
                              1024 ||
                          "Image must be 5MB or smaller."
                        );
                      },
                    },
                  }
                )}
                onChange={(
                  event
                ) => {
                  setNrcBackPreview(
                    createPreview(
                      event.target.files ??
                        undefined
                    )
                  );
                }}
                className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-3 text-sm"
              />

              {nrcBackPreview && (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <img
                    src={
                      nrcBackPreview
                    }
                    alt="NRC back preview"
                    className="h-52 w-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SELFIE */}

        <div className="mb-8">
          <h3 className="mb-1 text-base font-bold text-slate-900">
            Customer Selfie
          </h3>

          <p className="mb-4 text-sm text-slate-500">
            Capture a clear selfie of the
            customer for identity verification.
          </p>

          <div className="max-w-md rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="mb-3 block text-sm font-semibold text-slate-800">
              Selfie *
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="user"
              {...register(
                "selfie",
                {
                  required:
                    "Customer selfie is required.",

                  validate: {
                    fileType: (
                      files
                    ) => {
                      if (!files?.[0]) {
                        return "Customer selfie is required.";
                      }

                      return (
                        files[0].type.startsWith(
                          "image/"
                        ) ||
                        "Please select an image."
                      );
                    },

                    fileSize: (
                      files
                    ) => {
                      if (!files?.[0]) {
                        return true;
                      }

                      return (
                        files[0]
                          .size <=
                          5 *
                            1024 *
                            1024 ||
                        "Image must be 5MB or smaller."
                      );
                    },
                  },
                }
              )}
              onChange={(
                event
              ) => {
                setSelfiePreview(
                  createPreview(
                    event.target.files ??
                      undefined
                  )
                );
              }}
              className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-3 text-sm"
            />

            {selfiePreview && (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <img
                  src={
                    selfiePreview
                  }
                  alt="Customer selfie preview"
                  className="h-64 w-full object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* RESIDENTIAL ADDRESS */}

        <div className="mb-8">
          <h3 className="mb-1 text-base font-bold text-slate-900">
            Residential Address
          </h3>

          <p className="mb-4 text-sm text-slate-500">
            Enter the customer's current
            residential address.
          </p>

          <Input
            label="Residential Address *"
            placeholder="Enter full residential address"
            {...register(
              "residential_address",
              {
                required:
                  "Residential address is required.",

                validate: (
                  value
                ) =>
                  value.trim()
                    .length >=
                    5 ||
                  "Please enter a complete residential address.",
              }
            )}
          />
        </div>

        {/* NEXT OF KIN */}

        <div>
          <h3 className="mb-1 text-base font-bold text-slate-900">
            Next of Kin
          </h3>

          <p className="mb-4 text-sm text-slate-500">
            Provide someone who can be
            contacted regarding the customer.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            <Input
              label="Full Name *"
              placeholder="Next of kin full name"
              {...register(
                "next_of_kin_name",
                {
                  required:
                    "Next of kin name is required.",
                }
              )}
            />

            <Select
              label="Relationship *"
              placeholder="Select Relationship"
              options={[
                {
                  label: "Parent",
                  value: "Parent",
                },
                {
                  label: "Spouse",
                  value: "Spouse",
                },
                {
                  label: "Sibling",
                  value: "Sibling",
                },
                {
                  label: "Child",
                  value: "Child",
                },
                {
                  label: "Relative",
                  value: "Relative",
                },
                {
                  label: "Friend",
                  value: "Friend",
                },
                {
                  label: "Other",
                  value: "Other",
                },
              ]}
              {...register(
                "next_of_kin_relationship",
                {
                  required:
                    "Next of kin relationship is required.",
                }
              )}
            />

            <Input
              label="Phone Number *"
              type="tel"
              placeholder="+260..."
              {...register(
                "next_of_kin_phone",
                {
                  required:
                    "Next of kin phone number is required.",

                  validate: (
                    value
                  ) =>
                    value.trim()
                      .length >=
                      9 ||
                    "Enter a valid phone number.",
                }
              )}
            />
          </div>
        </div>
      </section>

      {/* ======================================================
          LOAN INFORMATION
          ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#03162F]">
            Loan Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select a configured loan term.
            Interest and the final repayment
            date are calculated automatically.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Input
            type="date"
            label="Loan Date *"
            {...register(
              "application_date",
              {
                required:
                  "Loan date is required.",
              }
            )}
          />

          <Select
            label="Account *"
            placeholder="Select Account"
            options={
              operatorOptions
            }
            {...register(
              "account_operator_id",
              {
                required:
                  "Please select the disbursement account.",
              }
            )}
          />

          <Input
            type="number"
            min="0"
            step="0.01"
            label="Principal (ZMW) *"
            placeholder="Enter principal"
            {...register(
              "principal",
              {
                required:
                  "Principal is required.",
              }
            )}
          />

          <div>
            <Select
              label="Loan Term *"
              placeholder={
                activeLoanTerms.length >
                0
                  ? "Select Loan Term"
                  : "No active loan terms configured"
              }
              options={
                loanTermOptions
              }
              disabled={
                activeLoanTerms.length ===
                0
              }
              {...register(
                "repayment_period",
                {
                  required:
                    "Please select a loan term.",
                }
              )}
            />

            {activeLoanTerms.length ===
              0 && (
              <p className="mt-2 text-xs text-red-600">
                No active loan terms were
                supplied to this form.
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Interest Rate
            </label>

            <div className="flex min-h-[46px] items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-[#03162F]">
              {selectedTerm
                ? `${interestRate}%`
                : "Select a loan term"}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Due Date
            </label>

            <div className="flex min-h-[46px] items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-[#03162F]">
              {displayDate(
                calculatedDueDate
              )}
            </div>
          </div>
        </div>

        {selectedTerm && (
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Term
                </p>

                <p className="mt-1 text-lg font-bold text-blue-900">
                  {
                    selectedTerm.period_days
                  }{" "}
                  Days
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Interest Rate
                </p>

                <p className="mt-1 text-lg font-bold text-blue-900">
                  {
                    selectedTerm.interest_rate
                  }
                  %
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Final Date
                </p>

                <p className="mt-1 text-lg font-bold text-blue-900">
                  {displayDate(
                    calculatedDueDate
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ======================================================
          COLLATERAL
          ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#03162F]">
            Collateral
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select the collateral from the
            approved catalogue.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Select
            label="Collateral *"
            placeholder="Select Collateral"
            options={
              collateralOptions
            }
            {...register(
              "collateral_id",
              {
                required:
                  "Please select the collateral.",
              }
            )}
          />

          <Input
            type="number"
            min="0"
            step="0.01"
            label="Collateral Worth (ZMW)"
            placeholder="Enter estimated worth"
            {...register(
              "collateral_worth"
            )}
          />
        </div>
      </section>

      {/* ======================================================
          FINANCIAL SUMMARY
          ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#03162F]">
            Financial Summary
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            These values are calculated
            automatically from the principal
            and configured interest rate.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">
              Principal
            </p>

            <p className="mt-2 text-xl font-bold text-[#03162F]">
              {money(principal)}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">
              Interest Rate
            </p>

            <p className="mt-2 text-xl font-bold text-[#03162F]">
              {interestRate}%
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">
              Interest Amount
            </p>

            <p className="mt-2 text-xl font-bold text-[#03162F]">
              {money(interest)}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Debt
            </p>

            <p className="mt-2 text-xl font-bold text-[#03162F]">
              {money(debt)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            label="Repaid Amount (ZMW)"
            placeholder="0.00"
            {...register(
              "amount_paid"
            )}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">
              Status
            </p>

            <div
              className={`flex min-h-[46px] items-center rounded-xl border px-4 font-semibold ${
                status === "Cleared"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : status === "Partial"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-blue-200 bg-blue-50 text-blue-700"
              }`}
            >
              {status}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 p-4">
          <p className="text-sm font-medium text-purple-700">
            Outstanding Balance
          </p>

          <p className="mt-1 text-2xl font-bold text-purple-900">
            {money(balance)}
          </p>
        </div>
      </section>

      {/* ======================================================
          NOTES
          ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Input
          label="Notes"
          placeholder="Additional loan notes..."
          {...register("notes")}
        />
      </section>

      {/* ======================================================
          ACTIONS
          ====================================================== */}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onSuccess}
          disabled={isSubmitting}
          className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <SubmitButton
          loading={isSubmitting}
        >
          Save Loan
        </SubmitButton>
      </div>
    </form>
  );
}