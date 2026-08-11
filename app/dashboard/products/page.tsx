import { getProducts } from "@/modules/products/services/product.service";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#03162F]">
        Products
      </h1>

      <pre className="rounded-xl bg-slate-100 p-4 text-sm">
        {JSON.stringify(products, null, 2)}
      </pre>
    </div>
  );
}