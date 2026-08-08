import { getBusinesses } from "@/modules/businesses/services/business.service";
import CustomerModal from "@/modules/customers/components/CustomerModal";
import { getCustomers } from "@/modules/customers/services/customer.service";

export default async function CustomersPage() {
  const customers = await getCustomers();
  console.log("PAGE CUSTOMERS:", customers);
  const businesses = await getBusinesses();

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold text-[#03162F]">
            Customers
          </h1>

          <p className="mt-2 text-slate-500">
            Manage all enterprise customers.
          </p>
        </div>

        <CustomerModal
  businesses={businesses}
/>

      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="py-3 text-left">
                Customer
              </th>

              <th className="py-3 text-left">
                Phone
              </th>

              <th className="py-3 text-left">
                Business
              </th>

              <th className="py-3 text-left">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {customers.length === 0 ? (

              <tr>

                <td
                  colSpan={4}
                  className="py-12 text-center text-slate-500"
                >
                  No customers yet.
                </td>

              </tr>

            ) : (

              customers.map((customer: any) => (

                <tr
                  key={customer.id}
                  className="border-b"
                >

                  <td className="py-4">
                    {customer.full_name}
                  </td>

                  <td>
                    {customer.phone}
                  </td>

                  <td>
                    {customer.businesses?.name}
                  </td>

                  <td>
                    {customer.status}
                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}