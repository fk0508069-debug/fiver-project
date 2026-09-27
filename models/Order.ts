import { Schema, model, models, type InferSchemaType } from "mongoose";

const OrderItemSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true, default: null },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    sku: String,
    image: String,
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const CustomerSchema = new Schema(
  {
    
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    notes: { type: String, default: "" },
  },  { _id: false }

  
);

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;

const OrderSchema = new Schema(
  {
    trackingNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: CustomerSchema, required: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "unpaid", index: true },
    timeline: {
      type: [{ status: String, at: Date }],
      default: () => [{ status: "pending", at: new Date() }],
    },
  },
  { timestamps: true }
);

OrderSchema.index({ "customer.email": 1 });
OrderSchema.index({ createdAt: -1 });

export type OrderDoc = InferSchemaType<typeof OrderSchema>;
export const Order = models.Order || model("Order", OrderSchema);