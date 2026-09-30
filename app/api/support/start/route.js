import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import { Customer } from "@/models/Customer";
import { getCustomerSession } from "@/lib/customerAuth";

export async function POST() {
  try {
    await connectDB ();

    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (!mongoose.isObjectIdOrHexString(session.id)) {
      return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
    }

    // Presence ping for the admin's green dot
    await Customer.updateOne(
      { _id: session.id },
      { $set: { lastPingAt: new Date() } }
    );

    const convo = await Conversation.findOneAndUpdate(
      { userId: session.id },
      {
        $setOnInsert: {
          userId: session.id,
          status: "open",
          lastSenderRole: "customer",
          lastMessageAt: new Date(),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      ok: true,
      conversation: {
        _id: String(convo._id),
        status: convo.status,
        lastMessageAt: convo.lastMessageAt,
        lastMessageText: convo.lastMessageText,
        unreadByUser: convo.unreadByUser || 0,
      },
    });
  } catch (err) {
    console.error("[support/start]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}