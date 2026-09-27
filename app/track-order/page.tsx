"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TrackOrderPage() {
  const [tracking, setTracking] = useState("");
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = tracking.trim().toUpperCase();
    if (t) router.push(`/order/${encodeURIComponent(t)}`);
  }

  return (
    <div className="container-x max-w-narrow py-20">
      <h1 className="text-3xl">Track your order</h1>
      <p className="mt-3 text-ink-muted">Enter the tracking number from your confirmation email.</p>
      <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="ORD-2026-XXXXXXXX"
          className="input flex-1"
          aria-label="Tracking number"
        />
        <button className="btn btn-primary">Track order</button>
      </form>
    </div>
  );
}