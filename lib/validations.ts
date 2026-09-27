import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product id"),
  quantity: z.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  customer: z.object({
    fullName: z.string().min(2).max(80),
    email: z.string().email(),
    phone: z.string().min(6).max(20),
    address: z.string().min(4).max(160),
    city: z.string().min(2).max(60),
    state: z.string().min(2).max(60),
    postalCode: z.string().min(3).max(12),
    notes: z.string().max(500).optional().default(""),
  }),
  items: z.array(cartItemSchema).min(1, "Cart is empty"),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const productUpsertSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(140).optional(),
  description: z.string().min(10),
  shortDescription: z.string().max(200).optional().default(""),
  price: z.number().positive(),
  discount: z.number().min(0).max(100).optional().default(0),
  category: z.string().min(2).max(60),
  subcategory: z.string().max(60).optional().default(""),

  // Accepts both `/api/uploads/uuid.png` (relative) and `https://…` (absolute)
  images: z
    .array(
      z.string().refine(
        (val) => val.startsWith("/") || /^https?:\/\//i.test(val),
        { message: "Image must be a path or a valid URL" }
      )
    )
    .min(1, "At least one image is required"),

  stock: z.number().int().min(0),
  sku: z.string().min(2).max(40),
specifications: z.record(z.string(), z.string()).optional().default({}),
  keywords: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
});

export const orderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
});

export const customerSignupSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().max(20).optional().default(""),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const customerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;