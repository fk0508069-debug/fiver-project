import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import SupportMessage from "@/models/SupportMessage";
import { Customer } from "@/models/Customer";
import { getCustomerSession } from "@/lib/customerAuth";

export async function POST(req) {
  try {
    await connectDB();

    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { conversationId, text, attachments } = await req.json().catch(() => ({}));
    const hasText = text && text.trim();
    const hasFiles = Array.isArray(attachments) && attachments.length > 0;

    if (!hasText && !hasFiles) {
      return NextResponse.json(
        { error: "text or attachments required" },
        { status: 400 }
      );
    }

    const customer = await Customer.findById(session.id).lean();
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    let convo = conversationId
      ? await Conversation.findOne({ _id: conversationId, userId: session.id })
      : await Conversation.findOne({ userId: session.id });

    if (!convo) {
      convo = await Conversation.create({
        userId: session.id,
        status: "open",
        lastSenderRole: "customer",
      });
    }
    if (convo.status === "closed") convo.status = "open";

    const cleanAttachments = (attachments || []).slice(0, 5).map((a) => ({
      url: String(a.url || ""),
      name: String(a.name || ""),
      mime: String(a.mime || ""),
      size: Number(a.size) || 0,
      kind: a.kind === "image" ? "image" : "file",
    }));

    const senderName = customer.fullName || customer.email || "Customer";
    const senderEmail = customer.email || ""; // <-- EXTRACT EMAIL

    const msg = await SupportMessage.create({
      conversationId: convo._id,
      senderId: customer._id,
      senderModel: "Customer",
      senderRole: "customer",
      senderName,
      senderEmail, // <-- SAVE EMAIL HERE
      text: hasText ? text.trim() : "",
      attachments: cleanAttachments,
    });

    convo.lastMessageAt = msg.createdAt;
    convo.lastMessageText = hasText
      ? msg.text.slice(0, 120)
      : `📎 ${cleanAttachments[0]?.name || "attachment"}`;
    convo.lastSenderRole = "customer";
    convo.unreadByAgent = (convo.unreadByAgent || 0) + 1;
    await convo.save();

    return NextResponse.json({
      ok: true,
      messageId: String(msg._id),
      conversationId: String(convo._id),
    });
  } catch (err) {
    console.error("[support/user/reply]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}