import mongoose from "mongoose";

const AttachmentSchema = new mongoose.Schema(
  {
    url:      { type: String, required: true },
    name:     { type: String, default: "" },
    mime:     { type: String, default: "" },
    size:     { type: Number, default: 0 },
    kind:     { type: String, enum: ["image", "file"], default: "file" },
  },
  { _id: false }
);

const SupportMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "senderModel",
    },
    senderModel: {
      type: String,
      enum: ["User", "Customer"],
      default: "Customer",
    },
    senderRole: { type: String, enum: ["customer", "agent"], required: true },
    senderName: { type: String, default: "" },
    senderEmail: { type: String, default: "" }, // <-- ADDED THIS
    text:       { type: String, default: "", trim: true, maxlength: 4000 },
    attachments: { type: [AttachmentSchema], default: [] },
    readByAgent: { type: Boolean, default: false },
    readByUser:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

SupportMessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.SupportMessage ||
  mongoose.model("SupportMessage", SupportMessageSchema);