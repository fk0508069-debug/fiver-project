"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebar({ adminEmail }: { adminEmail: string }) {
  const path = usePathname();

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/analytics", label: "Analytics" },
  ];

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE", credentials: "include" });
    window.location.href = "/admin/login";
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
      <div className="border-b border-line p-5">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-display text-lg font-semibold">Flowline</span>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-dark">
            ADMIN
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map((l) => {
          const active = path === l.href || (l.href !== "/admin" && path.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-sm px-3 py-2 text-sm ${
                active
                  ? "bg-accent-soft font-medium text-accent-dark"
                  : "text-ink-muted hover:bg-surface-alt hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-4">
        <p className="truncate text-xs text-ink-faint">{adminEmail}</p>
        <button
          onClick={logout}
          className="mt-2 text-xs font-medium text-ink-muted hover:text-danger"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}