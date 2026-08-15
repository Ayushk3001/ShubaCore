"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  customerSchema,
  leadSchema,
  leadConversionSchema,
  orderSchema,
  orderStatusUpdateSchema,
  paymentSchema,
  expenseSchema,
  partnerTransactionSchema,
} from "@/lib/validations";
import { Prisma } from "@/generated/prisma/client";
const Decimal = Prisma.Decimal;

// Generate unique sequential order number ORD-2026-XXXX
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count();
  const sequence = String(count + 1).padStart(4, "0");
  return `ORD-${year}-${sequence}`;
}

// Generate unique sequential lead number LEAD-2026-XXXX
async function generateLeadNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.lead.count();
  const sequence = String(count + 1).padStart(4, "0");
  return `LEAD-${year}-${sequence}`;
}

// ================= CUSTOMERS =================

export async function createCustomerAction(formData: unknown) {
  const user = await requireUser();
  const parsed = customerSchema.parse(formData);

  const customer = await prisma.customer.create({
    data: {
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email || null,
      notes: parsed.notes || null,
    },
  });

  await logAudit({
    actorId: user.id,
    action: "CREATE_CUSTOMER",
    entityType: "Customer",
    entityId: customer.id,
    metadata: { name: customer.name, phone: customer.phone },
  });

  revalidatePath("/customers");
  revalidatePath("/leads");
  revalidatePath("/orders");
  return { success: true, customer };
}

export async function updateCustomerAction(id: string, formData: unknown) {
  const user = await requireUser();
  const parsed = customerSchema.parse(formData);

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: parsed.name,
      phone: parsed.phone,
      email: parsed.email || null,
      notes: parsed.notes || null,
    },
  });

  await logAudit({
    actorId: user.id,
    action: "UPDATE_CUSTOMER",
    entityType: "Customer",
    entityId: customer.id,
  });

  revalidatePath("/customers");
  return { success: true, customer };
}

// ================= LEADS =================

export async function createLeadAction(formData: unknown) {
  const user = await requireUser();
  const parsed = leadSchema.parse(formData);
  const leadNumber = await generateLeadNumber();

  const lead = await prisma.lead.create({
    data: {
      leadNumber,
      customerId: parsed.customerId,
      source: parsed.source,
      stage: parsed.stage,
      eventType: parsed.eventType || null,
      eventDate: parsed.eventDate ? new Date(parsed.eventDate) : null,
      estimatedQuantity: parsed.estimatedQuantity || null,
      estimatedBudget: parsed.estimatedBudget ? new Decimal(parsed.estimatedBudget) : null,
      quoteAmount: parsed.quoteAmount ? new Decimal(parsed.quoteAmount) : null,
      assignedPartnerId: parsed.assignedPartnerId || null,
      requirements: parsed.requirements || null,
      notes: parsed.notes || null,
    },
  });

  await logAudit({
    actorId: user.id,
    action: "CREATE_LEAD",
    entityType: "Lead",
    entityId: lead.id,
    metadata: { leadNumber: lead.leadNumber, stage: lead.stage },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true, lead };
}

export async function updateLeadStatusAction(id: string, stage: "NEW" | "CONTACTED" | "QUOTED" | "NEGOTIATION" | "WON" | "LOST") {
  const user = await requireUser();

  const lead = await prisma.lead.update({
    where: { id },
    data: { stage },
  });

  await logAudit({
    actorId: user.id,
    action: "UPDATE_LEAD_STAGE",
    entityType: "Lead",
    entityId: lead.id,
    metadata: { stage },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true, lead };
}

// ================= LEAD CONVERSION TO ORDER =================

export async function convertLeadToOrderAction(formData: unknown) {
  const user = await requireUser();
  const parsed = leadConversionSchema.parse(formData);

  const lead = await prisma.lead.findUnique({
    where: { id: parsed.leadId },
    include: { customer: true },
  });

  if (!lead) {
    throw new Error("Lead not found");
  }

  const orderNumber = await generateOrderNumber();

  // Calculate items subtotal
  const subtotal = parsed.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const order = await prisma.$transaction(async (tx) => {
    // 1. Create order with items
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        customerId: lead.customerId,
        source: lead.source,
        assignedPartnerId: parsed.assignedPartnerId || lead.assignedPartnerId || null,
        eventType: lead.eventType,
        eventDate: lead.eventDate,
        deliveryDate: parsed.deliveryDate ? new Date(parsed.deliveryDate) : null,
        status: "NEW",
        subtotal: new Decimal(subtotal),
        discount: new Decimal(0),
        total: new Decimal(subtotal),
        deliveryAddress: parsed.deliveryAddress || null,
        notes: parsed.notes || lead.notes || null,
        items: {
          create: parsed.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            customizationDetails: item.customizationDetails || null,
          })),
        },
      },
    });

    // 2. Link converted order ID back to lead and mark lead as WON
    await tx.lead.update({
      where: { id: lead.id },
      data: {
        stage: "WON",
        convertedOrderId: newOrder.id,
      },
    });

    return newOrder;
  });

  await logAudit({
    actorId: user.id,
    action: "CONVERT_LEAD_TO_ORDER",
    entityType: "Order",
    entityId: order.id,
    metadata: { leadNumber: lead.leadNumber, orderNumber: order.orderNumber },
  });

  revalidatePath("/leads");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { success: true, order };
}

// ================= ORDERS =================

export async function createOrderAction(formData: unknown) {
  const user = await requireUser();
  const parsed = orderSchema.parse(formData);
  const orderNumber = await generateOrderNumber();

  const subtotal = parsed.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const total = Math.max(0, subtotal - (parsed.discount || 0));

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: parsed.customerId,
      source: parsed.source,
      assignedPartnerId: parsed.assignedPartnerId || null,
      eventType: parsed.eventType || null,
      eventDate: parsed.eventDate ? new Date(parsed.eventDate) : null,
      deliveryDate: parsed.deliveryDate ? new Date(parsed.deliveryDate) : null,
      status: parsed.status || "NEW",
      subtotal: new Decimal(subtotal),
      discount: new Decimal(parsed.discount || 0),
      total: new Decimal(total),
      deliveryAddress: parsed.deliveryAddress || null,
      notes: parsed.notes || null,
      items: {
        create: parsed.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: new Decimal(item.unitPrice),
          customizationDetails: item.customizationDetails || null,
        })),
      },
    },
  });

  await logAudit({
    actorId: user.id,
    action: "CREATE_ORDER",
    entityType: "Order",
    entityId: order.id,
    metadata: { orderNumber: order.orderNumber, total },
  });

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { success: true, order };
}

export async function updateOrderStatusAction(formData: unknown) {
  const user = await requireUser();
  const parsed = orderStatusUpdateSchema.parse(formData);

  const order = await prisma.order.update({
    where: { id: parsed.orderId },
    data: { status: parsed.status },
  });

  await logAudit({
    actorId: user.id,
    action: "UPDATE_ORDER_STATUS",
    entityType: "Order",
    entityId: order.id,
    metadata: { status: parsed.status },
  });

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { success: true, order };
}

// ================= PAYMENTS =================

export async function createPaymentAction(formData: unknown) {
  const user = await requireUser();
  const parsed = paymentSchema.parse(formData);

  const payment = await prisma.$transaction(async (tx) => {
    const newPayment = await tx.payment.create({
      data: {
        orderId: parsed.orderId,
        amount: new Decimal(parsed.amount),
        type: parsed.type,
        method: parsed.method,
        reference: parsed.reference || null,
        receivedById: user.id,
        paidAt: parsed.paidAt ? new Date(parsed.paidAt) : new Date(),
        notes: parsed.notes || null,
      },
    });

    // If payment is ADVANCE and order status is NEW or QUOTED or CONFIRMED, update order status to ADVANCE_PAID
    const order = await tx.order.findUnique({ where: { id: parsed.orderId } });
    if (order && parsed.type === "ADVANCE" && ["NEW", "QUOTED", "CONFIRMED"].includes(order.status)) {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "ADVANCE_PAID" },
      });
    }

    return newPayment;
  });

  await logAudit({
    actorId: user.id,
    action: "RECORD_PAYMENT",
    entityType: "Payment",
    entityId: payment.id,
    metadata: { amount: parsed.amount, orderId: parsed.orderId },
  });

  revalidatePath("/orders");
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, payment };
}

// ================= EXPENSES =================

export async function createExpenseAction(formData: unknown) {
  const user = await requireUser();
  const parsed = expenseSchema.parse(formData);

  const expense = await prisma.expense.create({
    data: {
      category: parsed.category,
      amount: new Decimal(parsed.amount),
      description: parsed.description,
      orderId: parsed.orderId || null,
      paidById: parsed.paidById || user.id,
      method: parsed.method,
      expenseDate: parsed.expenseDate ? new Date(parsed.expenseDate) : new Date(),
      createdById: user.id,
    },
  });

  await logAudit({
    actorId: user.id,
    action: "RECORD_EXPENSE",
    entityType: "Expense",
    entityId: expense.id,
    metadata: { amount: parsed.amount, category: parsed.category },
  });

  revalidatePath("/finance");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { success: true, expense };
}

// ================= PARTNER TRANSACTIONS =================

export async function createPartnerTransactionAction(formData: unknown) {
  const user = await requireUser();
  const parsed = partnerTransactionSchema.parse(formData);

  const transaction = await prisma.partnerTransaction.create({
    data: {
      partnerId: parsed.partnerId,
      type: parsed.type,
      amount: new Decimal(parsed.amount),
      description: parsed.description,
      method: parsed.method || null,
      occurredAt: parsed.occurredAt ? new Date(parsed.occurredAt) : new Date(),
      createdById: user.id,
    },
  });

  await logAudit({
    actorId: user.id,
    action: "RECORD_PARTNER_TRANSACTION",
    entityType: "PartnerTransaction",
    entityId: transaction.id,
    metadata: { amount: parsed.amount, type: parsed.type, partnerId: parsed.partnerId },
  });

  revalidatePath("/partners");
  revalidatePath("/dashboard");
  return { success: true, transaction };
}

// ================= USER MANAGEMENT =================

export async function toggleUserActiveAction(id: string, isActive: boolean) {
  const user = await requireUser();

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { isActive },
  });

  await logAudit({
    actorId: user.id,
    action: "TOGGLE_USER_ACTIVE",
    entityType: "User",
    entityId: id,
    metadata: { isActive },
  });

  revalidatePath("/settings");
  return { success: true, user: updatedUser };
}

export async function createPartnerUserAction(formData: { name: string; email: string }) {
  const user = await requireUser();
  const name = formData.name.trim();
  const email = formData.email.trim().toLowerCase();

  if (!name || !email) {
    throw new Error("Name and email are required.");
  }

  // Generate temporary clerkUserId placeholder that will auto-link on partner's first login
  const clerkUserId = `pending_clerk_${Date.now()}`;

  const partner = await prisma.user.create({
    data: {
      clerkUserId,
      email,
      name,
      role: "PARTNER",
      isActive: true,
    },
  });

  await logAudit({
    actorId: user.id,
    action: "CREATE_PARTNER_USER",
    entityType: "User",
    entityId: partner.id,
    metadata: { name, email },
  });

  revalidatePath("/partners");
  revalidatePath("/settings");
  return { success: true, partner };
}
