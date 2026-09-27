"use client";

import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  async function handle() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
    router.refresh();
  }

  return (
    <button onClick={handle} className="btn btn-ghost btn-sm">
      Sign out
    </button>
  );
}