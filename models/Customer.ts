import { Schema, model, models } from "mongoose";

const CustomerSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    defaultAddress: {
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
    },
    lastLoginAt: Date,
    // NEW — presence for support chat
    lastPingAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Customer = models.Customer || model("Customer", CustomerSchema);