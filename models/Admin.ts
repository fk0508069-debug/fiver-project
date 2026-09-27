import { Schema, model, models } from "mongoose";

const AdminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "superadmin"], default: "admin" },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

export const Admin = models.Admin || model("Admin", AdminSchema);