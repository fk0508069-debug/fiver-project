import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Order, type ORDER_STATUSES } from "@/models/Order";
import { generateTrackingNumber, effectivePrice } from "@/lib/utils";
import type { CheckoutInput } from "@/lib/validations";

const FREE_SHIPPING_THRESHOLD = 150;
const FLAT_SHIPPING = 12;

export class OrderError extends Error {
  constructor(message: string, public code: string = "ORDER_ERROR") {
    super(message);
  }
}

export async function createOrder(input: CheckoutInput, customerId: string | null = null) {
  await connectDB();

  const ids = input.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids }, active: true });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  // 1. Validate every item exists and has stock
  const decremented: { id: string; qty: number }[] = [];
  const lineItems: Array<{
    product: unknown;
    name: string;
    sku: string;
    image: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }> = [];
  let subtotal = 0;

  try {
    for (const item of input.items) {
      const product = byId.get(item.productId);
      if (!product) {
        throw new OrderError(`Product not found: ${item.productId}`, "PRODUCT_NOT_FOUND");
      }
      if (product.stock < item.quantity) {
        throw new OrderError(`Insufficient stock for "${product.name}"`, "OUT_OF_STOCK");
      }

      // Server-side price calculation — NEVER trust client price
      const unitPrice = effectivePrice(product.price, product.discount ?? 0);
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;

      // Atomic stock decrement
      const res = await Product.updateOne(
        { _id: product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity, sold: item.quantity } }
      );
      if (res.modifiedCount !== 1) {
        throw new OrderError(`Stock changed for "${product.name}"`, "STOCK_RACE");
      }
      decremented.push({ id: String(product._id), qty: item.quantity });

      lineItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        image: product.images?.[0] ?? "",
        unitPrice,
        quantity: item.quantity,
        lineTotal,
      });
      subtotal += lineTotal;
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
    const total = Math.round((subtotal + shipping) * 100) / 100;

    // Generate a unique tracking number (retry on collision)
    let trackingNumber = "";
    for (let i = 0; i < 5; i++) {
      const candidate = generateTrackingNumber();
      const exists = await Order.exists({ trackingNumber: candidate });
      if (!exists) {
        trackingNumber = candidate;
        break;
      }
    }
    if (!trackingNumber) {
      throw new OrderError("Could not generate tracking number", "TRACKING_FAIL");
    }

    const order = await Order.create({
      trackingNumber,
      customer: input.customer,
      customerId,                                        // ← ADDED
      items: lineItems,
      subtotal,
      shipping,
      total,
      status: "pending",
      paymentStatus: "unpaid",
      timeline: [{ status: "pending", at: new Date() }],
    });

    return order.toObject();
  } catch (err) {
    // Rollback stock decrements
    await Promise.all(
      decremented.map(({ id, qty }) =>
        Product.updateOne({ _id: id }, { $inc: { stock: qty, sold: -qty } })
      )
    );
    throw err;
  }
}

export async function getOrderByTracking(tracking: string) {
  await connectDB();
  return Order.findOne({ trackingNumber: tracking.toUpperCase() }).lean();
}

export async function listOrders(params: {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
  from?: string;
  to?: string;
}) {
  await connectDB();
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));

  const filter: Record<string, unknown> = {};
  if (params.status) filter.status = params.status;
  if (params.q) {
    const re = new RegExp(params.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { trackingNumber: re },
      { "customer.fullName": re },
      { "customer.email": re },
      { "customer.phone": re },
    ];
  }
  if (params.from || params.to) {
    filter.createdAt = {};
    if (params.from) (filter.createdAt as Record<string, Date>).$gte = new Date(params.from);
    if (params.to) (filter.createdAt as Record<string, Date>).$lte = new Date(params.to);
  }

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateOrderStatus(
  id: string,
  status: (typeof ORDER_STATUSES)[number],
  paymentStatus?: "unpaid" | "paid" | "refunded"
) {
  await connectDB();
  const update: Record<string, unknown> = {
    status,
    $push: { timeline: { status, at: new Date() } },
  };
  if (paymentStatus) update.paymentStatus = paymentStatus;
  return Order.findByIdAndUpdate(id, update, { new: true }).lean();
}

export async function getDashboardStats() {
  await connectDB();
  const [agg] = await Order.aggregate([
    {
      $facet: {
        totals: [
          { $match: { status: { $ne: "cancelled" } } },
          {
            $group: {
              _id: null,
              revenue: { $sum: "$total" },
              orders: { $sum: 1 },
              avgOrder: { $avg: "$total" },
            },
          },
        ],
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        customers: [{ $group: { _id: "$customer.email" } }, { $count: "count" }],
        byDay: [
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 30 * 864e5) },
              status: { $ne: "cancelled" },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              revenue: { $sum: "$total" },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
        topProducts: [
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.name",
              qty: { $sum: "$items.quantity" },
              revenue: { $sum: "$items.lineTotal" },
            },
          },
          { $sort: { qty: -1 } },
          { $limit: 6 },
        ],
      },
    },
  ]);

  const totalProducts = await Product.countDocuments({ active: true });
  const totals = agg.totals[0] ?? { revenue: 0, orders: 0, avgOrder: 0 };

  return {
    revenue: Math.round((totals.revenue ?? 0) * 100) / 100,
    orders: totals.orders ?? 0,
    avgOrder: Math.round((totals.avgOrder ?? 0) * 100) / 100,
    products: totalProducts,
    customers: agg.customers[0]?.count ?? 0,
    byStatus: agg.byStatus.reduce(
      (acc: Record<string, number>, r: { _id: string; count: number }) => {
        acc[r._id] = r.count;
        return acc;
      },
      {}
    ),
    byDay: agg.byDay,
    topProducts: agg.topProducts,
  };
}