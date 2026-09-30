import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import SupportMessage from "@/models/SupportMessage";
import { getCustomerSession } from "@/lib/customerAuth";

export async function POST(req) {
  try {
    await connectDB ();

    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { conversationId } = await req.json().catch(() => ({}));
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId required" }, { status: 400 });
    }

    const convo = await Conversation.findOne({
      _id: conversationId,
      userId: session.id,
    }).lean();
    if (!convo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await SupportMessage.updateMany(
      { conversationId, readByUser: false, senderRole: "agent" },
      { $set: { readByUser: true } }
    );

    await Conversation.findByIdAndUpdate(conversationId, { unreadByUser: 0 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}