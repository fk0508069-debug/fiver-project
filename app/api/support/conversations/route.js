import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import { Customer } from "@/models/Customer";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET() {
  try {
    const { res } = await requireAdmin();
    if (res) return res;

    await connectDB ();

    const convos = await Conversation.find()
      .sort({ lastMessageAt: -1 })
      .limit(100)
      .lean();

    const ids = convos.map((c) => c.userId).filter(Boolean);
    let map = {};
    if (ids.length) {
      const customers = await Customer.find({ _id: { $in: ids } })
        .select("fullName email lastPingAt")
        .lean();
      map = Object.fromEntries(customers.map((c) => [String(c._id), c]));
    }

    const now = Date.now();

    return NextResponse.json({
      ok: true,
      conversations: convos.map((c) => {
        const u = map[String(c.userId)];
        const online =
          u?.lastPingAt && now - new Date(u.lastPingAt).getTime() < 30_000;
        return {
          _id: String(c._id),
          status: c.status,
          lastMessageAt: c.lastMessageAt,
          lastMessageText: c.lastMessageText,
          lastSenderRole: c.lastSenderRole,
          unreadByAgent: c.unreadByAgent || 0,
          user: u
            ? { name: u.fullName || "Unknown", email: u.email || "", online }
            : { name: "Unknown", email: "", online: false },
        };
      }),
    });
  } catch (error) {
    console.error("[conversations]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}