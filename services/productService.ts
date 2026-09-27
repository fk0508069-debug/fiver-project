import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";

/* ---------- Serializer: Mongoose doc → plain JSON-safe object ---------- */
function serializeProduct(p: any) {
  if (!p) return p;
  return {
    _id: String(p._id),
    name: p.name ?? "",
    slug: p.slug ?? "",
    description: p.description ?? "",
    shortDescription: p.shortDescription ?? "",
    price: p.price ?? 0,
    discount: p.discount ?? 0,
    category: p.category ?? "",
    subcategory: p.subcategory ?? "",
    images: Array.isArray(p.images) ? p.images.map(String) : [],
    stock: p.stock ?? 0,
    sku: p.sku ?? "",
    specifications: p.specifications
      ? Object.fromEntries(
          p.specifications instanceof Map ? p.specifications : Object.entries(p.specifications)
        )
      : {},
    keywords: Array.isArray(p.keywords) ? p.keywords.map(String) : [],
    featured: !!p.featured,
    active: p.active !== false,
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    sold: p.sold ?? 0,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
  };
}

export type ListParams = {
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "popular";
  featured?: boolean;
  activeOnly?: boolean;
  inStockOnly?: boolean;
};

export async function listProducts(params: ListParams = {}) {
  await connectDB();
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(48, Math.max(1, params.limit ?? 12));
  const skip = (page - 1) * limit;

  // ✅ Fixed: Replaced FilterQuery with a generic Record type
  const filter: Record<string, any> = {};
  
  if (params.activeOnly !== false) filter.active = true;
  if (params.category) filter.category = params.category;
  if (params.subcategory) filter.subcategory = params.subcategory;
  if (params.featured) filter.featured = true;
  if (params.inStockOnly) filter.stock = { $gt: 0 };
  
  if (params.minPrice != null || params.maxPrice != null) {
    filter.price = {};
    if (params.minPrice != null) filter.price.$gte = params.minPrice;
    if (params.maxPrice != null) filter.price.$lte = params.maxPrice;
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    popular: { sold: -1, rating: -1 },
  };

  const [items, total] = await Promise.all([
    Product.find(filter).sort(sortMap[params.sort ?? "newest"]).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  return {
    items: items.map(serializeProduct),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProductById(id: string) {
  await connectDB();
  const p = await Product.findById(id).lean();
  return p ? serializeProduct(p) : null;
}

export async function getProductBySlug(slug: string) {
  await connectDB();
  const p = await Product.findOne({ slug, active: true }).lean();
  return p ? serializeProduct(p) : null;
}

export async function getRelatedProducts(productId: string, category: string, limit = 4) {
  await connectDB();
  const items = await Product.find({ _id: { $ne: productId }, category, active: true })
    .sort({ sold: -1 })
    .limit(limit)
    .lean();
  return items.map(serializeProduct);
}

export async function searchProducts(q: string, limit = 20) {
  await connectDB();
  const term = q.trim();
  if (!term) return [];

  // Try text search first
  const textResults = await Product.find(
    { $text: { $search: term }, active: true },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .lean();

  if (textResults.length) return textResults.map(serializeProduct);

  // Fallback: regex on name/category/keywords
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const regexResults = await Product.find({
    active: true,
    $or: [{ name: re }, { category: re }, { subcategory: re }, { keywords: re }],
  })
    .limit(limit)
    .lean();
  return regexResults.map(serializeProduct);
}

export async function getCategories() {
  await connectDB();
  const rows = await Product.aggregate([
    { $match: { active: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return rows.map((r) => ({ _id: String(r._id), count: Number(r.count) }));
}