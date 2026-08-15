import { z } from "zod";
import { moneySchema, requiredStringSchema } from "./shared";

// Enums matching schema.prisma
export const RoleEnum = z.enum(["PARTNER", "STAFF"]);
export const LeadSourceEnum = z.enum(["WHATSAPP", "INSTAGRAM", "PHONE_CALL", "OFFLINE", "OTHER"]);
export const StockMovementTypeEnum = z.enum(["PURCHASE", "SALE_CONSUMPTION", "ADJUSTMENT", "RETURN"]);
export const LeadStageEnum = z.enum(["NEW", "CONTACTED", "QUOTED", "NEGOTIATION", "WON", "LOST"]);
export const OrderStatusEnum = z.enum([
  "NEW",
  "QUOTED",
  "CONFIRMED",
  "ADVANCE_PAID",
  "DESIGNING",
  "PRODUCTION",
  "READY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
]);
export const PaymentTypeEnum = z.enum(["ADVANCE", "PARTIAL", "FINAL", "REFUND"]);
export const PaymentMethodEnum = z.enum(["UPI", "BANK_TRANSFER", "CASH", "OTHER"]);
export const ExpenseCategoryEnum = z.enum([
  "MATERIALS",
  "PACKAGING",
  "PRINTING",
  "DELIVERY",
  "MARKETING",
  "SOFTWARE",
  "EQUIPMENT",
  "SUPPLIER_PAYMENT",
  "MISCELLANEOUS",
]);
export const PartnerTransactionTypeEnum = z.enum([
  "INITIAL_INVESTMENT",
  "ADDITIONAL_INVESTMENT",
  "EXPENSE_PAID",
  "REIMBURSEMENT",
  "WITHDRAWAL",
  "OTHER",
]);

// Customer Validation
export const customerSchema = z.object({
  name: requiredStringSchema,
  phone: requiredStringSchema,
  email: z.string().trim().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

// Lead Validation
export const leadSchema = z.object({
  customerId: requiredStringSchema,
  source: LeadSourceEnum,
  stage: LeadStageEnum.default("NEW"),
  eventType: z.string().optional(),
  eventDate: z.string().optional(),
  estimatedQuantity: z.coerce.number().int().positive().optional().or(z.literal(0)),
  estimatedBudget: moneySchema.optional().or(z.literal(0)),
  quoteAmount: moneySchema.optional().or(z.literal(0)),
  assignedPartnerId: z.string().optional(),
  requirements: z.string().optional(),
  notes: z.string().optional(),
});

// Lead Conversion to Order Validation
export const leadConversionSchema = z.object({
  leadId: requiredStringSchema,
  assignedPartnerId: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        description: requiredStringSchema,
        quantity: z.coerce.number().int().positive(),
        unitPrice: moneySchema,
        customizationDetails: z.string().optional(),
      })
    )
    .min(1, "At least one item is required for an order"),
});

// Order Item Validation
export const orderItemSchema = z.object({
  description: requiredStringSchema,
  quantity: z.coerce.number().int().positive(),
  unitPrice: moneySchema,
  customizationDetails: z.string().optional(),
});

// Order Validation
export const orderSchema = z.object({
  customerId: requiredStringSchema,
  source: LeadSourceEnum,
  assignedPartnerId: z.string().optional(),
  eventType: z.string().optional(),
  eventDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  status: OrderStatusEnum.default("NEW"),
  discount: moneySchema.default(0),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

export const orderStatusUpdateSchema = z.object({
  orderId: requiredStringSchema,
  status: OrderStatusEnum,
});

// Payment Validation
export const paymentSchema = z.object({
  orderId: requiredStringSchema,
  amount: moneySchema,
  type: PaymentTypeEnum,
  method: PaymentMethodEnum,
  reference: z.string().optional(),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
});

// Expense Validation
export const expenseSchema = z.object({
  category: ExpenseCategoryEnum,
  amount: moneySchema,
  description: requiredStringSchema,
  orderId: z.string().optional(),
  paidById: z.string().optional(),
  method: PaymentMethodEnum,
  expenseDate: z.string().optional(),
});

// Partner Transaction Validation
export const partnerTransactionSchema = z.object({
  partnerId: requiredStringSchema,
  type: PartnerTransactionTypeEnum,
  amount: moneySchema,
  description: requiredStringSchema,
  method: PaymentMethodEnum.optional(),
  occurredAt: z.string().optional(),
});

// Supplier Validation
export const supplierSchema = z.object({
  name: requiredStringSchema,
  contactPerson: z.string().optional(),
  phone: requiredStringSchema,
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// Product Validation
export const productSchema = z.object({
  name: requiredStringSchema,
  sku: requiredStringSchema,
  category: z.string().optional(),
  unit: z.string().default("pcs"),
  currentStock: z.coerce.number().int().nonnegative().default(0),
  minStock: z.coerce.number().int().nonnegative().default(10),
  purchaseCost: moneySchema,
  supplierId: z.string().optional(),
});

// Stock Movement Validation
export const stockMovementSchema = z.object({
  productId: requiredStringSchema,
  type: StockMovementTypeEnum,
  quantity: z.coerce.number().int(),
  reference: z.string().optional(),
});

