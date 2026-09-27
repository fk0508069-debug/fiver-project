import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl">New product</h1>
      <p className="mt-1 text-ink-muted">Add a product to your store.</p>
      <div className="mt-6 max-w-3xl">
        <ProductForm />
      </div>
    </div>
  );
}