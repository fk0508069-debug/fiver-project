import { getAdminSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  return (
    <div className="min-h-screen bg-cream">
      {session && <AdminSidebar adminEmail={session.email} />}
      <div className={session ? "lg:pl-60" : ""}>{children}</div>
    </div>
  );
}