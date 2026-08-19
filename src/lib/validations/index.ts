import { z } from "zod";
import {
  moneySchema,
  positiveMoneySchema,
  requiredStringSchema,
  optionalStringSchema,
  optionalDateSchema,
  optionalEmailSchema,
} from "./shared";

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
export const PaymentMethodEnum = z.enum(["UPI", "BANK_TRANSFER", "CASH", "PARTNER_CAPITAL", "OTHER"]);
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
export const ExpenseTypeEnum = z.enum([
  "OPERATING_EXPENSE",
  "INVENTORY_PURCHASE",
  "CAPITAL_INVESTMENT",
  "OTHER",
]);
export const PartnerTransactionTypeEnum = z.enum([
  "INITIAL_INVESTMENT",
  "ADDITIONAL_INVESTMENT",
  "EXPENSE_PAID",
  "REIMBURSEMENT",
  "WITHDRAWAL",
  "OTHER",
]);
export const SupplierTypeEnum = z.enum(["LEAD", "CONFIRMED"]);

// Customer Validation
export const customerSchema = z.object({
  name: requiredStringSchema,
  phone: requiredStringSchema,
  email: optionalEmailSchema,
  notes: optionalStringSchema,
});

// Lead Validation
export const leadSchema = z.object({
  customerId: requiredStringSchema,
  source: LeadSourceEnum,
  stage: LeadStageEnum.default("NEW"),
  eventType: optionalStringSchema,
  eventDate: optionalDateSchema,
  estimatedQuantity: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || Number.isNaN(Number(val)) || Number(val) <= 0 ? undefined : Number(val)),
    z.number().int().positive().optional()
  ),
  estimatedBudget: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || Number.isNaN(Number(val)) || Number(val) <= 0 ? undefined : Number(val)),
    moneySchema.optional()
  ),
  quoteAmount: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || Number.isNaN(Number(val)) || Number(val) <= 0 ? undefined : Number(val)),
    moneySchema.optional()
  ),
  assignedPartnerId: optionalStringSchema,
  requirements: optionalStringSchema,
  notes: optionalStringSchema,
});

// Lead Conversion to Order Validation
export const leadConversionSchema = z.object({
  leadId: requiredStringSchema,
  assignedPartnerId: optionalStringSchema,
  deliveryDate: optionalDateSchema,
  deliveryAddress: optionalStringSchema,
  notes: optionalStringSchema,
  items: z
    .array(
      z.object({
        description: requiredStringSchema,
        quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
        unitPrice: moneySchema,
        customizationDetails: optionalStringSchema,
      })
    )
    .min(1, "At least one item is required for an order"),
});

export const BundlePricingTypeEnum = z.enum(["FIXED", "DYNAMIC_SUM"]);

// Bundle Item Validation
export const bundleItemSchema = z.object({
  productId: requiredStringSchema,
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

// Bundle Validation
export const bundleSchema = z.object({
  name: requiredStringSchema,
  sku: requiredStringSchema,
  description: optionalStringSchema,
  pricingType: BundlePricingTypeEnum.default("DYNAMIC_SUM"),
  bundlePrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || Number.isNaN(Number(val)) ? undefined : Number(val)),
    positiveMoneySchema.optional()
  ),
  isActive: z.boolean().optional().default(true),
  items: z.array(bundleItemSchema).min(1, "A product bundle must contain at least 1 component product"),
});

// Order Item Validation
export const orderItemSchema = z.object({
  productId: optionalStringSchema,
  bundleId: optionalStringSchema,
  description: requiredStringSchema,
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  unitPrice: moneySchema,
  costPrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    moneySchema.optional()
  ),
  marginRate: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  customizationDetails: optionalStringSchema,
});

// Order Validation
export const orderSchema = z.object({
  customerId: requiredStringSchema,
  source: LeadSourceEnum,
  assignedPartnerId: optionalStringSchema,
  eventType: optionalStringSchema,
  eventDate: optionalDateSchema,
  deliveryDate: optionalDateSchema,
  status: OrderStatusEnum.default("NEW"),
  discount: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || Number.isNaN(Number(val)) ? 0 : Number(val)),
    moneySchema.default(0)
  ),
  deliveryAddress: optionalStringSchema,
  notes: optionalStringSchema,
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

export const orderStatusUpdateSchema = z.object({
  orderId: requiredStringSchema,
  status: OrderStatusEnum,
});

// Payment Validation
export const paymentSchema = z.object({
  orderId: requiredStringSchema,
  amount: positiveMoneySchema,
  type: PaymentTypeEnum,
  method: PaymentMethodEnum,
  reference: optionalStringSchema,
  paidAt: optionalDateSchema,
  notes: optionalStringSchema,
});

// Expense Validation
export const expenseSchema = z.object({
  category: ExpenseCategoryEnum,
  type: ExpenseTypeEnum.default("OPERATING_EXPENSE"),
  amount: positiveMoneySchema,
  description: requiredStringSchema,
  orderId: optionalStringSchema,
  paidById: optionalStringSchema,
  method: PaymentMethodEnum,
  expenseDate: optionalDateSchema,
});

// Partner Transaction Validation
export const partnerTransactionSchema = z.object({
  partnerId: requiredStringSchema,
  type: PartnerTransactionTypeEnum,
  amount: positiveMoneySchema,
  description: requiredStringSchema,
  method: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : val), PaymentMethodEnum.optional()),
  occurredAt: optionalDateSchema,
});

// Supplier Validation
export const supplierSchema = z.object({
  name: requiredStringSchema,
  contactPerson: optionalStringSchema,
  phone: requiredStringSchema,
  email: optionalEmailSchema,
  address: optionalStringSchema,
  notes: optionalStringSchema,
  type: SupplierTypeEnum.default("CONFIRMED"),
});

// Product Validation
export const productSchema = z.object({
  name: requiredStringSchema,
  sku: requiredStringSchema,
  category: optionalStringSchema,
  unit: z.string().default("pcs"),
  currentStock: z.coerce.number().int().nonnegative().default(0),
  minStock: z.coerce.number().int().nonnegative().default(10),
  purchaseCost: moneySchema,
  supplierId: optionalStringSchema,
});

// Stock Movement Validation
export const stockMovementSchema = z.object({
  productId: requiredStringSchema,
  type: StockMovementTypeEnum,
  quantity: z.coerce.number().int(),
  reference: optionalStringSchema,
});


