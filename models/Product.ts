import { Schema, model, models, type InferSchemaType } from "mongoose";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, default: "", index: true },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0, min: 0 },
    sku: { type: String, required: true, unique: true },
    specifications: { type: Map, of: String, default: {} },
    keywords: { type: [String], default: [] },
    featured: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text index for search (name + keywords + category + subcategory + description)
ProductSchema.index(
  { name: "text", keywords: "text", category: "text", subcategory: "text", description: "text" },
  { weights: { name: 10, keywords: 6, category: 4, subcategory: 3, description: 1 }, name: "product_text" }
);
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ createdAt: -1 });

export type ProductDoc = InferSchemaType<typeof ProductSchema>;
export const Product = models.Product || model("Product", ProductSchema);