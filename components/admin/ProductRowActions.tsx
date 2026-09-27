"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProductRowActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    if (!confirm(`Set product to ${active ? "inactive" : "active"}?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <div className="flex justify-end gap-2">
      <Link href={`/admin/products/${id}/edit`} className="text-xs font-medium text-accent-dark hover:underline">Edit</Link>
      <button onClick={toggleActive} disabled={busy} className="text-xs font-medium text-ink-muted hover:text-danger disabled:opacity-50">
        {active ? "Deactivate" : "Activate"}
      </button>
    </div>
  );
}