import { getEmployees } from "@/modules/employees/services/employee.service";
import { getEmployeeLoans } from "@/modules/hr/loans-advances/services/employee-loans.service";
import { getHRLoanProducts } from "@/modules/hr/loans-advances/services/loan-products.service";

import EmployeeLoanModal from "@/modules/hr/loans-advances/components/EmployeeLoanModal";
import EmployeeLoansTable from "@/modules/hr/loans-advances/components/EmployeeLoansTable";

export default async function HRLoansAdvancesPage() {
  const [employees, loans, loanProducts] =
    await Promise.all([
      getEmployees(),
      getEmployeeLoans(),
      getHRLoanProducts(),
    ]);

  /* =====================================================
     SUMMARY COUNTS
  ===================================================== */

  const pendingCount = loans.filter(
    (loan) => loan.status === "Pending"
  ).length;

  const approvedCount = loans.filter(
    (loan) =>
      loan.status === "Approved" ||
      loan.status === "Active"
  ).length;

  const completedCount = loans.filter(
    (loan) => loan.status === "Completed"
  ).length;

  /* =====================================================
     FINANCIAL TOTALS
  ===================================================== */

  const totalOutstanding = loans.reduce(
    (total, loan) =>
      total +
      Number(
        loan.outstanding_balance || 0
      ),
    0
  );

  const totalPrincipal = loans.reduce(
    (total, loan) =>
      total +
      Number(
        loan.principal_amount || 0
      ),
    0
  );

  /* =====================================================
     MONEY FORMAT
  ===================================================== */

  function formatMoney(value: number) {
    return new Intl.NumberFormat(
      "en-ZM",
      {
        style: "currency",
        currency: "ZMW",
        minimumFractionDigits: 2,
      }
    ).format(value);
  }

  return (
    <div className="space-y-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Loans & Advances
          </h1>

          <p className="mt-2 text-slate-500">
            Manage employee loans, salary advances,
            approvals and outstanding balances.
          </p>
        </div>

        {/* =================================================
            NEW LOAN BUTTON
        ================================================= */}

        <EmployeeLoanModal
          employees={employees}
          loanProducts={loanProducts}
        />

      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          {/* TOTAL APPLICATIONS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Total Applications
            </p>

            <p className="mt-2 text-3xl font-bold text-[#03162F]">
              {loans.length}
            </p>

          </div>

          {/* PENDING */}

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">

            <p className="text-sm font-medium text-amber-700">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-800">
              {pendingCount}
            </p>

          </div>

          {/* APPROVED / ACTIVE */}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">

            <p className="text-sm font-medium text-emerald-700">
              Approved / Active
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-800">
              {approvedCount}
            </p>

          </div>

          {/* COMPLETED */}

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">

            <p className="text-sm font-medium text-blue-700">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-800">
              {completedCount}
            </p>

          </div>

          {/* OUTSTANDING */}

          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5 shadow-sm">

            <p className="text-sm font-medium text-purple-700">
              Outstanding
            </p>

            <p className="mt-2 text-2xl font-bold text-purple-800">
              {formatMoney(
                totalOutstanding
              )}
            </p>

          </div>

        </div>

      </section>

      {/* =====================================================
          FINANCIAL SUMMARY
      ===================================================== */}

      <section className="grid gap-4 md:grid-cols-2">

        {/* TOTAL PRINCIPAL */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <p className="text-sm font-medium text-slate-500">
            Total Principal Issued
          </p>

          <p className="mt-2 text-3xl font-bold text-[#03162F]">
            {formatMoney(
              totalPrincipal
            )}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Across all employee loan and
            advance applications.
          </p>

        </div>

        {/* TOTAL OUTSTANDING */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <p className="text-sm font-medium text-slate-500">
            Total Outstanding Balance
          </p>

          <p className="mt-2 text-3xl font-bold text-purple-700">
            {formatMoney(
              totalOutstanding
            )}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Amount still owed by employees.
          </p>

        </div>

      </section>

      {/* =====================================================
          EMPLOYEE LOANS TABLE
      ===================================================== */}

      <section>

        <EmployeeLoansTable
          loans={loans}
          employees={employees}
          loanProducts={loanProducts}
        />

      </section>

    </div>
  );
}