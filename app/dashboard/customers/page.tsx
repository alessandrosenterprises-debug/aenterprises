import { getBusinesses } from "@/modules/businesses/services/business.service";
import CustomersTable from "@/modules/customers/components/CustomersTable";
import { getCustomers } from "@/modules/customers/services/customer.service";

export default async function CustomersPage() {
  const customers = await getCustomers();
  const businesses = await getBusinesses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          Customers
        </h1>

        <p className="mt-2 text-slate-500">
          Manage all enterprise customers.
        </p>
      </div>

      <CustomersTable
        customers={customers}
        businesses={businesses}
      />
    </div>
  );
}