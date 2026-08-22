import { getEmployees } from "@/modules/employees/services/employee.service";
import {
  getEmployeeDocuments,
} from "@/modules/hr/documents/services/employee-documents.service";

import EmployeeDocumentModal from "@/modules/hr/documents/components/EmployeeDocumentModal";
import EmployeeDocumentsTable from "@/modules/hr/documents/components/EmployeeDocumentsTable";

export default async function HRDocumentsPage() {
  const [employees, documents] =
    await Promise.all([
      getEmployees(),
      getEmployeeDocuments(),
    ]);

  const activeCount = documents.filter(
    (document) =>
      document.status === "Active"
  ).length;

  const expiredCount = documents.filter(
    (document) => {
      if (!document.expiry_date) {
        return false;
      }

      const expiry = new Date(
        `${document.expiry_date}T00:00:00`
      );

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      return expiry < today;
    }
  ).length;

  const expiringSoonCount =
    documents.filter(
      (document) => {
        if (!document.expiry_date) {
          return false;
        }

        const expiry = new Date(
          `${document.expiry_date}T00:00:00`
        );

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const difference =
          expiry.getTime() -
          today.getTime();

        const daysRemaining = Math.ceil(
          difference /
            (1000 * 60 * 60 * 24)
        );

        return (
          daysRemaining >= 0 &&
          daysRemaining <= 30
        );
      }
    ).length;

  const noExpiryCount =
    documents.filter(
      (document) =>
        !document.expiry_date
    ).length;

  return (
    <div className="space-y-8">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Employee Documents
          </h1>

          <p className="mt-2 text-slate-500">
            Manage employee identification,
            contracts, certificates and
            other HR documents.
          </p>
        </div>

        <EmployeeDocumentModal
          employees={employees}
        />
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Documents
            </p>

            <p className="mt-2 text-3xl font-bold text-[#03162F]">
              {documents.length}
            </p>
          </div>

          {/* ACTIVE */}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">
              Active
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-800">
              {activeCount}
            </p>
          </div>

          {/* EXPIRING */}

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-amber-700">
              Expiring Soon
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-800">
              {expiringSoonCount}
            </p>

            <p className="mt-1 text-xs text-amber-700">
              Within 30 days
            </p>
          </div>

          {/* EXPIRED */}

          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-red-700">
              Expired
            </p>

            <p className="mt-2 text-3xl font-bold text-red-800">
              {expiredCount}
            </p>
          </div>

          {/* NO EXPIRY */}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              No Expiry
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">
              {noExpiryCount}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          DOCUMENTS TABLE
      ===================================================== */}

      <EmployeeDocumentsTable
        documents={documents}
        employees={employees}
      />
    </div>
  );
}