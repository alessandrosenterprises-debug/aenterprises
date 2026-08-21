"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import Modal from "@/components/ui/modal/Modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

import {
  createEmployeeLoan,
  updateEmployeeLoan,
} from "../services/employee-loans.client";

interface Employee {
  id: string;
  full_name: string;
  position?: string | null;
}

interface LoanProduct {
  id: string;
  name: string;
  description?: string | null;
  min_amount?: number | null;
  max_amount?: number | null;
  interest_rate?: number | null;
  repayment_period?: number | null;
  requires_collateral?: boolean;
  status?: string;
}

interface EmployeeLoan {
  id: string;
  employee_id: string;
  loan_product_id: string | null;
  loan_type: string;
  principal_amount: number;
  interest_rate: number;
  total_payable: number;
  repayment_period: number;
  monthly_installment: number;
  application_date: string;
  start_date: string | null;
  amount_paid: number;
  outstanding_balance: number;
  status: string;
  rejection_reason?: string | null;
  notes: string | null;
}

interface EmployeeLoanModalProps {
  employees: Employee[];
  loanProducts: LoanProduct[];

  mode?: "create" | "edit";

  loan?: EmployeeLoan;

  open?: boolean;

  onClose?: () => void;
}

interface FormState {
  employee_id: string;
  loan_product_id: string;
  loan_type: string;
  principal_amount: string;
  interest_rate: string;
  repayment_period: string;
  application_date: string;
  start_date: string;
  notes: string;
}

function getToday() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

function toNumber(value: string) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function calculateTotalPayable(
  principal: number,
  interestRate: number
) {
  if (principal <= 0) {
    return 0;
  }

  if (interestRate <= 0) {
    return principal;
  }

  return (
    principal +
    principal * (interestRate / 100)
  );
}

function calculateMonthlyInstallment(
  totalPayable: number,
  repaymentPeriod: number
) {
  if (
    totalPayable <= 0 ||
    repaymentPeriod <= 0
  ) {
    return 0;
  }

  return totalPayable / repaymentPeriod;
}

export default function EmployeeLoanModal({
  employees,
  loanProducts,
  mode = "create",
  loan,
  open,
  onClose,
}: EmployeeLoanModalProps) {
  const router = useRouter();

  const [internalOpen, setInternalOpen] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] =
    useState<FormState>({
      employee_id:
        loan?.employee_id ?? "",

      loan_product_id:
        loan?.loan_product_id ?? "",

      loan_type:
        loan?.loan_type ?? "Loan",

      principal_amount:
        loan
          ? String(loan.principal_amount)
          : "",

      interest_rate:
        loan
          ? String(loan.interest_rate)
          : "0",

      repayment_period:
        loan
          ? String(loan.repayment_period)
          : "1",

      application_date:
        loan?.application_date ??
        getToday(),

      start_date:
        loan?.start_date ?? "",

      notes:
        loan?.notes ?? "",
    });

  const isOpen =
    open !== undefined
      ? open
      : internalOpen;

  const selectedProduct = useMemo(
    () =>
      loanProducts.find(
        (product) =>
          product.id ===
          form.loan_product_id
      ) ?? null,
    [
      loanProducts,
      form.loan_product_id,
    ]
  );

  const principalAmount = toNumber(
    form.principal_amount
  );

  const interestRate = toNumber(
    form.interest_rate
  );

  const repaymentPeriod = Math.max(
    1,
    Math.floor(
      toNumber(form.repayment_period)
    )
  );

  const totalPayable =
    calculateTotalPayable(
      principalAmount,
      interestRate
    );

  const monthlyInstallment =
    calculateMonthlyInstallment(
      totalPayable,
      repaymentPeriod
    );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm({
      employee_id:
        loan?.employee_id ?? "",

      loan_product_id:
        loan?.loan_product_id ?? "",

      loan_type:
        loan?.loan_type ?? "Loan",

      principal_amount:
        loan
          ? String(loan.principal_amount)
          : "",

      interest_rate:
        loan
          ? String(loan.interest_rate)
          : "0",

      repayment_period:
        loan
          ? String(loan.repayment_period)
          : "1",

      application_date:
        loan?.application_date ??
        getToday(),

      start_date:
        loan?.start_date ?? "",

      notes:
        loan?.notes ?? "",
    });
  }, [isOpen, loan]);

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    if (mode !== "create") {
      return;
    }

    setForm((current) => ({
      ...current,

      interest_rate:
        selectedProduct.interest_rate !=
        null
          ? String(
              selectedProduct.interest_rate
            )
          : current.interest_rate,

      repayment_period:
        selectedProduct.repayment_period !=
        null
          ? String(
              selectedProduct.repayment_period
            )
          : current.repayment_period,
    }));
  }, [
    selectedProduct,
    mode,
  ]);

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function closeModal() {
    if (saving) {
      return;
    }

    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.employee_id) {
      toast.error(
        "Please select an employee."
      );
      return;
    }

    if (!form.loan_type) {
      toast.error(
        "Please select a loan type."
      );
      return;
    }

    if (principalAmount <= 0) {
      toast.error(
        "Principal amount must be greater than zero."
      );
      return;
    }

    if (interestRate < 0) {
      toast.error(
        "Interest rate cannot be negative."
      );
      return;
    }

    if (repaymentPeriod <= 0) {
      toast.error(
        "Repayment period must be greater than zero."
      );
      return;
    }

    if (!form.application_date) {
      toast.error(
        "Application date is required."
      );
      return;
    }

    if (
      selectedProduct?.min_amount !=
        null &&
      principalAmount <
        Number(
          selectedProduct.min_amount
        )
    ) {
      toast.error(
        `Amount is below the minimum of K${Number(
          selectedProduct.min_amount
        ).toFixed(2)}.`
      );
      return;
    }

    if (
      selectedProduct?.max_amount !=
        null &&
      principalAmount >
        Number(
          selectedProduct.max_amount
        )
    ) {
      toast.error(
        `Amount exceeds the maximum of K${Number(
          selectedProduct.max_amount
        ).toFixed(2)}.`
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        employee_id:
          form.employee_id,

        loan_product_id:
          form.loan_product_id ||
          null,

        loan_type:
          form.loan_type,

        principal_amount:
          principalAmount,

        interest_rate:
          interestRate,

        total_payable:
          totalPayable,

        repayment_period:
          repaymentPeriod,

        monthly_installment:
          monthlyInstallment,

        application_date:
          form.application_date,

        start_date:
          form.start_date ||
          null,

        amount_paid:
          mode === "edit"
            ? Number(
                loan?.amount_paid ?? 0
              )
            : 0,

        outstanding_balance:
          mode === "edit"
            ? Number(
                loan?.outstanding_balance ??
                  totalPayable
              )
            : totalPayable,

        status:
          mode === "edit"
            ? loan?.status ??
              "Pending"
            : "Pending",

        rejection_reason:
          mode === "edit"
            ? loan?.rejection_reason ??
              null
            : null,

        notes:
          form.notes.trim() ||
          null,
      };

      if (
        mode === "edit" &&
        loan?.id
      ) {
        await updateEmployeeLoan(
          loan.id,
          payload
        );

        toast.success(
          "Loan updated successfully."
        );
      } else {
        await createEmployeeLoan(
          payload
        );

        toast.success(
          "Loan application created successfully."
        );
      }

      closeModal();

      router.refresh();
    } catch (error) {
      console.error(
        "Employee loan save error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save employee loan."
      );
    } finally {
      setSaving(false);
    }
  }

  const employeeOptions =
    employees.map((employee) => ({
      label: employee.position
        ? `${employee.full_name} — ${employee.position}`
        : employee.full_name,

      value: employee.id,
    }));

  const loanProductOptions =
    loanProducts
      .filter(
        (product) =>
          !product.status ||
          product.status === "Active"
      )
      .map((product) => ({
        label: product.name,
        value: product.id,
      }));

  return (
    <>
      {mode === "create" && (
        <button
          type="button"
          onClick={() =>
            setInternalOpen(true)
          }
          className="rounded-xl bg-[#03162F] px-5 py-3 font-semibold text-white transition hover:bg-[#0A2852]"
        >
          + New Loan / Advance
        </button>
      )}

      <Modal
        open={isOpen}
        title={
          mode === "edit"
            ? "Edit Loan / Advance"
            : "New Loan / Advance"
        }
        onClose={closeModal}
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* EMPLOYEE */}

          <Select
            label="Employee *"
            placeholder="Select Employee"
            options={employeeOptions}
            value={form.employee_id}
            onChange={(event) =>
              updateField(
                "employee_id",
                event.target.value
              )
            }
          />

          {/* LOAN TYPE */}

          <Select
            label="Type *"
            placeholder="Select Type"
            options={[
              {
                label: "Loan",
                value: "Loan",
              },
              {
                label: "Salary Advance",
                value: "Advance",
              },
            ]}
            value={form.loan_type}
            onChange={(event) =>
              updateField(
                "loan_type",
                event.target.value
              )
            }
          />

          {/* LOAN PRODUCT */}

          <Select
            label="Loan Product"
            placeholder="Select Loan Product"
            options={loanProductOptions}
            value={
              form.loan_product_id
            }
            onChange={(event) =>
              updateField(
                "loan_product_id",
                event.target.value
              )
            }
          />

          {/* PRODUCT INFORMATION */}

          {selectedProduct && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="font-semibold text-blue-900">
                {selectedProduct.name}
              </p>

              {selectedProduct.description && (
                <p className="mt-1 text-sm text-blue-700">
                  {
                    selectedProduct.description
                  }
                </p>
              )}

              <div className="mt-3 grid gap-2 text-sm text-blue-700 sm:grid-cols-2">
                {selectedProduct.min_amount !=
                  null && (
                  <p>
                    Minimum:{" "}
                    <span className="font-semibold">
                      K
                      {Number(
                        selectedProduct.min_amount
                      ).toFixed(2)}
                    </span>
                  </p>
                )}

                {selectedProduct.max_amount !=
                  null && (
                  <p>
                    Maximum:{" "}
                    <span className="font-semibold">
                      K
                      {Number(
                        selectedProduct.max_amount
                      ).toFixed(2)}
                    </span>
                  </p>
                )}

                {selectedProduct.interest_rate !=
                  null && (
                  <p>
                    Interest:{" "}
                    <span className="font-semibold">
                      {
                        selectedProduct.interest_rate
                      }
                      %
                    </span>
                  </p>
                )}

                {selectedProduct.repayment_period !=
                  null && (
                  <p>
                    Period:{" "}
                    <span className="font-semibold">
                      {
                        selectedProduct.repayment_period
                      }{" "}
                      months
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* PRINCIPAL + INTEREST */}

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              type="number"
              label="Principal Amount (ZMW) *"
              min={0}
              step="0.01"
              value={
                form.principal_amount
              }
              onChange={(event) =>
                updateField(
                  "principal_amount",
                  event.target.value
                )
              }
            />

            <Input
              type="number"
              label="Interest Rate (%)"
              min={0}
              step="0.01"
              value={
                form.interest_rate
              }
              onChange={(event) =>
                updateField(
                  "interest_rate",
                  event.target.value
                )
              }
            />
          </div>

          {/* REPAYMENT */}

          <Input
            type="number"
            label="Repayment Period (Months)"
            min={1}
            step={1}
            value={
              form.repayment_period
            }
            onChange={(event) =>
              updateField(
                "repayment_period",
                event.target.value
              )
            }
          />

          {/* CALCULATED SUMMARY */}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Principal
              </p>

              <p className="mt-1 text-xl font-bold text-[#03162F]">
                K
                {principalAmount.toFixed(
                  2
                )}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">
                Total Payable
              </p>

              <p className="mt-1 text-xl font-bold text-emerald-800">
                K
                {totalPayable.toFixed(
                  2
                )}
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                Monthly Installment
              </p>

              <p className="mt-1 text-xl font-bold text-blue-800">
                K
                {monthlyInstallment.toFixed(
                  2
                )}
              </p>
            </div>
          </div>

          {/* DATES */}

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              type="date"
              label="Application Date *"
              value={
                form.application_date
              }
              onChange={(event) =>
                updateField(
                  "application_date",
                  event.target.value
                )
              }
            />

            <Input
              type="date"
              label="Start Date"
              value={
                form.start_date
              }
              onChange={(event) =>
                updateField(
                  "start_date",
                  event.target.value
                )
              }
            />
          </div>

          {/* NOTES */}

          <Textarea
            label="Notes"
            placeholder="Additional information about this loan or advance..."
            value={form.notes}
            onChange={(event) =>
              updateField(
                "notes",
                event.target.value
              )
            }
          />

          {/* ACTIONS */}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <SubmitButton
              loading={saving}
            >
              {mode === "edit"
                ? "Update Loan"
                : "Create Loan"}
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}