import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SupportMessage from "@/models/SupportMessage";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    // --- DEBUG LOGS ---
    console.log("=== GET /api/support/messages ===");
    console.log("Raw URL:", req.url);
    console.log("Extracted conversationId:", conversationId);
    console.log("Type of conversationId:", typeof conversationId);
    // ------------------

    if (!conversationId || conversationId === "undefined" || conversationId === "null") {
      console.log("Returning 400: conversationId is missing or invalid.");
      return NextResponse.json(
        { error: "A valid conversationId is required" },
        { status: 400 }
      );
    }

    const messages = await SupportMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    console.log(`Found ${messages.length} messages for this conversation.`);

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("[support/messages] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}