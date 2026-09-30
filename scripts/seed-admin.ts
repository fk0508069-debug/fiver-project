import { config } from "dotenv";
config({ path: ".env.local" });

import { connectDB } from "../lib/mongodb";
import { Admin } from "../models/Admin";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

  if (!email || !passwordHash) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD_HASH in .env.local first.");
    process.exit(1);
  }

  await connectDB ();
  console.log("Connected to MongoDB");

  const existing = await Admin.findOne({ email });
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = "superadmin";
    await existing.save();
    console.log("Updated existing admin: " + email);
  } else {
    await Admin.create({ email, passwordHash, role: "superadmin" });
    console.log("Created admin: " + email);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});