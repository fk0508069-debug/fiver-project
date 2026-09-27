import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return {
      session: null,
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, res: null };
}