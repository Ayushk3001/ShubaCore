"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageFinance, canManagePartnerTransactions, canManageUsers } from "@/lib/permissions";
import {
  customerSchema,
  leadSchema,
  leadConversionSchema,
  orderSchema,
  orderStatusUpdateSchema,
  paymentSchema,
  expenseSchema,
  partnerTransactionSchema,
  productSchema,
  supplierSchema,
  stockMovementSchema,
  bundleSchema,
} from "@/lib/validations";
import { Prisma } from "@/generated/prisma/client";
import { serializeData } from "@/lib/serialize";
const Decimal = Prisma.Decimal;

function formatError(err: unknown, defaultMessage: string): { success: false; error: string } {
  console.error("Action error:", err);
  if (err instanceof z.ZodError) {
    const issueMessages = err.issues.map((issue) => issue.message).join("; ");
    return { success: false, error: issueMessages || "Validation error" };
  }
  if (err instanceof Error) {
    return { success: false, error: err.message };
  }
  return { success: false, error: defaultMessage };
}

// Generate unique sequential order number ORD-2026-XXXX
async function generateOrderNumber(offset = 0): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count();
  const sequence = String(count + 1 + offset).padStart(4, "0");
  return `ORD-${year}-${sequence}`;
}

// Generate unique sequential lead number LEAD-2026-XXXX
async function generateLeadNumber(offset = 0): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.lead.count();
  const sequence = String(count + 1 + offset).padStart(4, "0");
  return `LEAD-${year}-${sequence}`;
}

// Helper to resolve unit cost price snapshot for an order item
async function getItemCostPriceSnapshot(
  tx: Prisma.TransactionClient,
  item: { productId?: string | null; bundleId?: string | null }
): Promise<Prisma.Decimal> {
  if (item.bundleId) {
    const bundle = await tx.productBundle.findUnique({
      where: { id: item.bundleId },
      include: { bundleItems: { include: { product: true } } },
    });
    if (bundle) {
      const cost = bundle.bundleItems.reduce((sum, bItem) => {
        const itemCost = Number(bItem.product?.purchaseCost || 0);
        return sum + bItem.quantity * itemCost;
      }, 0);
      return new Decimal(cost);
    }
  } else if (item.productId) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      select: { purchaseCost: true },
    });
    if (product) {
      return new Decimal(product.purchaseCost);
    }
  }
  return new Decimal(0);
}

// ================= CUSTOMERS =================

export async function createCustomerAction(formData: unknown) {
  try {
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
    return { success: true as const, customer };
  } catch (err) {
    return formatError(err, "Failed to create customer.");
  }
}

export async function updateCustomerAction(id: string, formData: unknown) {
  try {
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
    return { success: true as const, customer };
  } catch (err) {
    return formatError(err, "Failed to update customer.");
  }
}

// ================= LEADS =================

export async function createLeadAction(formData: unknown) {
  try {
    const user = await requireUser();
    const parsed = leadSchema.parse(formData);

    let attempt = 0;
    let lead;
    while (attempt < 3) {
      try {
        const leadNumber = await generateLeadNumber(attempt);
        lead = await prisma.lead.create({
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
        break;
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && attempt < 2) {
          attempt++;
          continue;
        }
        throw err;
      }
    }

    if (!lead) throw new Error("Failed to generate unique lead number.");

    await logAudit({
      actorId: user.id,
      action: "CREATE_LEAD",
      entityType: "Lead",
      entityId: lead.id,
      metadata: { leadNumber: lead.leadNumber, stage: lead.stage },
    });

    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return { success: true as const, lead };
  } catch (err) {
    return formatError(err, "Failed to create lead.");
  }
}

export async function updateLeadStatusAction(id: string, stage: "NEW" | "CONTACTED" | "QUOTED" | "NEGOTIATION" | "WON" | "LOST") {
  try {
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
    return { success: true as const, lead };
  } catch (err) {
    return formatError(err, "Failed to update lead status.");
  }
}

export async function updateLeadAction(id: string, formData: unknown) {
  try {
    const user = await requireUser();
    const parsed = leadSchema.parse(formData);

    const lead = await prisma.lead.update({
      where: { id },
      data: {
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
      action: "UPDATE_LEAD",
      entityType: "Lead",
      entityId: lead.id,
    });

    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return { success: true as const, lead };
  } catch (err) {
    return formatError(err, "Failed to update lead.");
  }
}

// ================= LEAD CONVERSION TO ORDER =================

export async function convertLeadToOrderAction(formData: unknown) {
  try {
    const user = await requireUser();
    const parsed = leadConversionSchema.parse(formData);

    const lead = await prisma.lead.findUnique({
      where: { id: parsed.leadId },
      include: { customer: true },
    });

    if (!lead) {
      return { success: false, error: "Lead not found" };
    }

    const subtotal = parsed.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    let attempt = 0;
    let order;

    while (attempt < 3) {
      try {
        const orderNumber = await generateOrderNumber(attempt);

        order = await prisma.$transaction(async (tx) => {
          const itemsWithCost = await Promise.all(
            parsed.items.map(async (item) => {
              const costPriceSnapshot = new Decimal(0);
              return {
                description: item.description,
                quantity: item.quantity,
                unitPrice: new Decimal(item.unitPrice),
                costPriceSnapshot,
                customizationDetails: item.customizationDetails || null,
              };
            })
          );

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
                create: itemsWithCost,
              },
            },
          });

          await tx.lead.update({
            where: { id: lead.id },
            data: {
              stage: "WON",
              convertedOrderId: newOrder.id,
            },
          });

          await logAudit({
            actorId: user.id,
            action: "CONVERT_LEAD_TO_ORDER",
            entityType: "Order",
            entityId: newOrder.id,
            metadata: { leadNumber: lead.leadNumber, orderNumber: newOrder.orderNumber },
            tx,
          });

          return newOrder;
        });

        break;
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && attempt < 2) {
          attempt++;
          continue;
        }
        throw err;
      }
    }

    if (!order) throw new Error("Failed to convert lead to order.");

    revalidatePath("/leads");
    revalidatePath("/orders");
    revalidatePath("/dashboard");
    return { success: true as const, order: serializeData(order) };
  } catch (err) {
    return formatError(err, "Failed to convert lead to order.");
  }
}

// ================= ORDERS =================

const FULFILLMENT_STATUSES = [
  "CONFIRMED",
  "ADVANCE_PAID",
  "DESIGNING",
  "PRODUCTION",
  "READY",
  "DELIVERED",
  "COMPLETED",
];

/**
 * Idempotent stock fulfillment synchronizer for orders.
 * Guarantees that stock is deducted EXACTLY ONCE per fulfilled order lifecycle,
 * and restored EXACTLY ONCE if the order is cancelled / moved to non-fulfilled status.
 */
async function syncOrderStockFulfillment(
  tx: Prisma.TransactionClient,
  orderId: string,
  targetStatus: string,
  userId: string
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
          bundle: {
            include: {
              bundleItems: {
                include: { product: true },
              },
            },
          },
        },
      },
    },
  });

  if (!order) return;

  const isTargetFulfilled = FULFILLMENT_STATUSES.includes(targetStatus);

  // Case 1: Order is moving to a fulfilled status and stock HAS NOT been deducted yet
  if (isTargetFulfilled && !order.stockDeducted) {
    for (const item of order.items) {
      if (item.bundleId && item.bundle) {
        for (const bItem of item.bundle.bundleItems) {
          const requiredQty = bItem.quantity * item.quantity;
          if (bItem.product.currentStock < requiredQty) {
            throw new Error(
              `Insufficient stock for component product "${bItem.product.name}" in combo "${item.bundle.name}". Required: ${requiredQty}, Available: ${bItem.product.currentStock}`
            );
          }
          await tx.product.update({
            where: { id: bItem.productId },
            data: { currentStock: { decrement: requiredQty } },
          });
          await tx.stockMovement.create({
            data: {
              productId: bItem.productId,
              orderId: order.id,
              type: "SALE_CONSUMPTION",
              quantity: requiredQty,
              reference: `Order ${order.orderNumber} (Combo: ${item.bundle.name} x${item.quantity}) - Status: ${targetStatus}`,
              createdById: userId,
            },
          });
        }
      } else if (item.productId && item.product) {
        if (item.product.currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for product "${item.product.name}". Required: ${item.quantity}, Available: ${item.product.currentStock}`
          );
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            orderId: order.id,
            type: "SALE_CONSUMPTION",
            quantity: item.quantity,
            reference: `Order ${order.orderNumber} - Status: ${targetStatus}`,
            createdById: userId,
          },
        });
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: { stockDeducted: true },
    });
  }
  // Case 2: Order is moving to a non-fulfilled status (e.g. CANCELLED) and stock HAS been deducted
  else if (!isTargetFulfilled && order.stockDeducted) {
    for (const item of order.items) {
      if (item.bundleId && item.bundle) {
        for (const bItem of item.bundle.bundleItems) {
          const qtyToRestore = bItem.quantity * item.quantity;
          await tx.product.update({
            where: { id: bItem.productId },
            data: { currentStock: { increment: qtyToRestore } },
          });
          await tx.stockMovement.create({
            data: {
              productId: bItem.productId,
              orderId: order.id,
              type: "RETURN",
              quantity: qtyToRestore,
              reference: `Order ${order.orderNumber} returned to inventory (Combo: ${item.bundle.name} x${item.quantity}) - Status: ${targetStatus}`,
              createdById: userId,
            },
          });
        }
      } else if (item.productId && item.product) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            orderId: order.id,
            type: "RETURN",
            quantity: item.quantity,
            reference: `Order ${order.orderNumber} returned to inventory - Status: ${targetStatus}`,
            createdById: userId,
          },
        });
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: { stockDeducted: false },
    });
  }
}

export async function createOrderAction(formData: unknown) {
  try {
    const user = await requireUser();
    const parsed = orderSchema.parse(formData);

    const subtotal = parsed.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const total = Math.max(0, subtotal - (parsed.discount || 0));

    const orderStatus = parsed.status || "NEW";

    let attempt = 0;
    let order;

    while (attempt < 3) {
      try {
        const orderNumber = await generateOrderNumber(attempt);

        order = await prisma.$transaction(async (tx) => {
          const itemsWithCost = await Promise.all(
            parsed.items.map(async (item) => {
              const costPriceSnapshot = await getItemCostPriceSnapshot(tx, item);
              return {
                productId: item.productId || null,
                bundleId: item.bundleId || null,
                description: item.description,
                quantity: item.quantity,
                unitPrice: new Decimal(item.unitPrice),
                costPriceSnapshot,
                customizationDetails: item.customizationDetails || null,
              };
            })
          );

          const createdOrder = await tx.order.create({
            data: {
              orderNumber,
              customerId: parsed.customerId,
              source: parsed.source,
              assignedPartnerId: parsed.assignedPartnerId || null,
              eventType: parsed.eventType || null,
              eventDate: parsed.eventDate ? new Date(parsed.eventDate) : null,
              deliveryDate: parsed.deliveryDate ? new Date(parsed.deliveryDate) : null,
              status: orderStatus,
              subtotal: new Decimal(subtotal),
              discount: new Decimal(parsed.discount || 0),
              total: new Decimal(total),
              deliveryAddress: parsed.deliveryAddress || null,
              notes: parsed.notes || null,
              items: {
                create: itemsWithCost,
              },
            },
          });

          await syncOrderStockFulfillment(tx, createdOrder.id, orderStatus, user.id);

          await logAudit({
            actorId: user.id,
            action: "CREATE_ORDER",
            entityType: "Order",
            entityId: createdOrder.id,
            metadata: { orderNumber: createdOrder.orderNumber, total, status: createdOrder.status },
            tx,
          });

          return createdOrder;
        });

        break;
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && attempt < 2) {
          attempt++;
          continue;
        }
        throw err;
      }
    }

    if (!order) throw new Error("Failed to create order.");

    revalidatePath("/orders");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true as const, order: serializeData(order) };
  } catch (err) {
    return formatError(err, "Failed to create order.");
  }
}

export async function updateOrderAction(id: string, formData: unknown) {
  try {
    const user = await requireUser();
    const parsed = orderSchema.parse(formData);

    const subtotal = parsed.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const total = Math.max(0, subtotal - (parsed.discount || 0));

    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
              bundle: { include: { bundleItems: { include: { product: true } } } },
            },
          },
        },
      });

      if (existingOrder && existingOrder.stockDeducted) {
        // Temporarily revert stock for existing items before re-creating
        for (const item of existingOrder.items) {
          if (item.bundleId && item.bundle) {
            for (const bItem of item.bundle.bundleItems) {
              const qtyToRestore = bItem.quantity * item.quantity;
              await tx.product.update({
                where: { id: bItem.productId },
                data: { currentStock: { increment: qtyToRestore } },
              });
            }
          } else if (item.productId && item.product) {
            await tx.product.update({
              where: { id: item.productId },
              data: { currentStock: { increment: item.quantity } },
            });
          }
        }
        await tx.order.update({
          where: { id },
          data: { stockDeducted: false },
        });
      }

      // Clear existing order items and recreate
      await tx.orderItem.deleteMany({ where: { orderId: id } });

      const itemsWithCost = await Promise.all(
        parsed.items.map(async (item) => {
          const costPriceSnapshot = await getItemCostPriceSnapshot(tx, item);
          return {
            productId: item.productId || null,
            bundleId: item.bundleId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            costPriceSnapshot,
            customizationDetails: item.customizationDetails || null,
          };
        })
      );

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
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
            create: itemsWithCost,
          },
        },
      });

      await syncOrderStockFulfillment(tx, updatedOrder.id, updatedOrder.status, user.id);

      await logAudit({
        actorId: user.id,
        action: "UPDATE_ORDER",
        entityType: "Order",
        entityId: updatedOrder.id,
        metadata: { orderNumber: updatedOrder.orderNumber, total },
        tx,
      });

      return updatedOrder;
    });

    revalidatePath("/orders");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true as const, order: serializeData(order) };
  } catch (err) {
    return formatError(err, "Failed to update order.");
  }
}

export async function updateOrderStatusAction(formData: unknown) {
  try {
    const user = await requireUser();
    const parsed = orderStatusUpdateSchema.parse(formData);

    const existingOrder = await prisma.order.findUnique({
      where: { id: parsed.orderId },
    });

    if (!existingOrder) {
      return { success: false, error: "Order not found." };
    }

    if (parsed.status === existingOrder.status) {
      return { success: true as const, order: serializeData(existingOrder) };
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const resOrder = await tx.order.update({
        where: { id: parsed.orderId },
        data: { status: parsed.status },
      });

      await syncOrderStockFulfillment(tx, resOrder.id, parsed.status, user.id);

      await logAudit({
        actorId: user.id,
        action: "UPDATE_ORDER_STATUS",
        entityType: "Order",
        entityId: resOrder.id,
        metadata: { status: parsed.status, previousStatus: existingOrder.status },
        tx,
      });

      return resOrder;
    });

    revalidatePath("/orders");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true as const, order: serializeData(updatedOrder) };
  } catch (err) {
    return formatError(err, "Failed to update order status.");
  }
}

// ================= PAYMENTS =================

export async function createPaymentAction(formData: unknown) {
  try {
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

      const order = await tx.order.findUnique({ where: { id: parsed.orderId } });
      let updatedStatus = order?.status;
      if (order && parsed.type === "ADVANCE" && ["NEW", "QUOTED", "CONFIRMED"].includes(order.status)) {
        updatedStatus = "ADVANCE_PAID";
        await tx.order.update({
          where: { id: order.id },
          data: { status: "ADVANCE_PAID" },
        });
      }

      if (order && updatedStatus) {
        await syncOrderStockFulfillment(tx, order.id, updatedStatus, user.id);
      }

      await logAudit({
        actorId: user.id,
        action: "RECORD_PAYMENT",
        entityType: "Payment",
        entityId: newPayment.id,
        metadata: { amount: parsed.amount, orderId: parsed.orderId },
        tx,
      });

      return newPayment;
    });

    revalidatePath("/orders");
    revalidatePath("/finance");
    revalidatePath("/dashboard");
    return { success: true as const, payment: serializeData(payment) };
  } catch (err) {
    return formatError(err, "Failed to record payment.");
  }
}

export async function updatePaymentAction(id: string, formData: unknown) {
  try {
    const user = await requireUser();
    const parsed = paymentSchema.parse(formData);

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        orderId: parsed.orderId,
        amount: new Decimal(parsed.amount),
        type: parsed.type,
        method: parsed.method,
        reference: parsed.reference || null,
        paidAt: parsed.paidAt ? new Date(parsed.paidAt) : new Date(),
        notes: parsed.notes || null,
      },
    });

    await logAudit({
      actorId: user.id,
      action: "UPDATE_PAYMENT",
      entityType: "Payment",
      entityId: payment.id,
    });

    revalidatePath("/orders");
    revalidatePath("/finance");
    revalidatePath("/dashboard");
    return { success: true as const, payment: serializeData(payment) };
  } catch (err) {
    return formatError(err, "Failed to update payment.");
  }
}

// ================= EXPENSES =================

export async function createExpenseAction(formData: unknown) {
  try {
    const user = await requireUser();
    if (!canManageFinance(user)) {
      return { success: false, error: "Not authorized." };
    }
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
    return { success: true as const, expense: serializeData(expense) };
  } catch (err) {
    return formatError(err, "Failed to record expense.");
  }
}

export async function updateExpenseAction(id: string, formData: unknown) {
  try {
    const user = await requireUser();
    if (!canManageFinance(user)) {
      return { success: false, error: "Not authorized." };
    }
    const parsed = expenseSchema.parse(formData);

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        category: parsed.category,
        amount: new Decimal(parsed.amount),
        description: parsed.description,
        orderId: parsed.orderId || null,
        paidById: parsed.paidById || user.id,
        method: parsed.method,
        expenseDate: parsed.expenseDate ? new Date(parsed.expenseDate) : new Date(),
      },
    });

    await logAudit({
      actorId: user.id,
      action: "UPDATE_EXPENSE",
      entityType: "Expense",
      entityId: expense.id,
    });

    revalidatePath("/finance");
    revalidatePath("/orders");
    revalidatePath("/dashboard");
    return { success: true as const, expense: serializeData(expense) };
  } catch (err) {
    return formatError(err, "Failed to update expense.");
  }
}

// ================= PARTNER TRANSACTIONS =================

export async function createPartnerTransactionAction(formData: unknown) {
  try {
    const user = await requireUser();
    if (!canManagePartnerTransactions(user)) {
      return { success: false, error: "Not authorized." };
    }
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
    return { success: true as const, transaction: serializeData(transaction) };
  } catch (err) {
    return formatError(err, "Failed to record partner transaction.");
  }
}

export async function updatePartnerTransactionAction(id: string, formData: unknown) {
  try {
    const user = await requireUser();
    if (!canManagePartnerTransactions(user)) {
      return { success: false, error: "Not authorized." };
    }
    const parsed = partnerTransactionSchema.parse(formData);

    const transaction = await prisma.partnerTransaction.update({
      where: { id },
      data: {
        partnerId: parsed.partnerId,
        type: parsed.type,
        amount: new Decimal(parsed.amount),
        description: parsed.description,
        method: parsed.method || null,
        occurredAt: parsed.occurredAt ? new Date(parsed.occurredAt) : new Date(),
      },
    });

    await logAudit({
      actorId: user.id,
      action: "UPDATE_PARTNER_TRANSACTION",
      entityType: "PartnerTransaction",
      entityId: transaction.id,
    });

    revalidatePath("/partners");
    revalidatePath("/dashboard");
    return { success: true as const, transaction: serializeData(transaction) };
  } catch (err) {
    return formatError(err, "Failed to update partner transaction.");
  }
}

// ================= USER MANAGEMENT =================

export async function toggleUserActiveAction(id: string, isActive: boolean) {
  try {
    const user = await requireUser();
    if (!canManageUsers(user)) {
      return { success: false, error: "Not authorized." };
    }

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
    return { success: true as const, user: updatedUser };
  } catch (err) {
    return formatError(err, "Failed to update user status.");
  }
}

export async function createPartnerUserAction(formData: { name: string; email: string }) {
  try {
    const user = await requireUser();
    if (!canManageUsers(user)) {
      return { success: false, error: "Not authorized." };
    }
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();

    if (!name || !email) {
      return { success: false, error: "Name and email are required." };
    }

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
    return { success: true as const, partner };
  } catch (err) {
    return formatError(err, "Failed to create partner user.");
  }
}

// ================= INVENTORY & SUPPLIERS =================

export async function createSupplierAction(formData: unknown) {
  try {
    const user = await requireUser();
    const parsed = supplierSchema.parse(formData);

    const supplier = await prisma.supplier.create({
      data: {
        name: parsed.name,
        contactPerson: parsed.contactPerson || null,
        phone: parsed.phone,
        email: parsed.email || null,
        address: parsed.address || null,
        notes: parsed.notes || null,
        type: parsed.type,
      },
    });

    await logAudit({
      actorId: user.id,
      action: "CREATE_SUPPLIER",
      entityType: "Supplier",
      entityId: supplier.id,
      metadata: { name: supplier.name, phone: supplier.phone, type: supplier.type },
    });

    revalidatePath("/inventory");
    return { success: true as const, supplier };
  } catch (err) {
    return formatError(err, "Failed to create supplier.");
  }
}

export async function updateSupplierAction(id: string, formData: unknown) {
  try {
    const user = await requireUser();
    const parsed = supplierSchema.parse(formData);

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: parsed.name,
        contactPerson: parsed.contactPerson || null,
        phone: parsed.phone,
        email: parsed.email || null,
        address: parsed.address || null,
        notes: parsed.notes || null,
        type: parsed.type,
      },
    });

    await logAudit({
      actorId: user.id,
      action: "UPDATE_SUPPLIER",
      entityType: "Supplier",
      entityId: supplier.id,
      metadata: { type: supplier.type },
    });

    revalidatePath("/inventory");
    return { success: true as const, supplier };
  } catch (err) {
    return formatError(err, "Failed to update supplier.");
  }
}

export async function createProductAction(formData: unknown) {
  try {
    const user = await requireUser();
    const parsed = productSchema.parse(formData);

    const product = await prisma.product.create({
      data: {
        name: parsed.name,
        sku: parsed.sku.toUpperCase(),
        category: parsed.category || null,
        unit: parsed.unit || "pcs",
        currentStock: parsed.currentStock,
        minStock: parsed.minStock,
        purchaseCost: new Decimal(parsed.purchaseCost),
        supplierId: parsed.supplierId || null,
      },
    });

    await logAudit({
      actorId: user.id,
      action: "CREATE_PRODUCT",
      entityType: "Product",
      entityId: product.id,
      metadata: { name: product.name, sku: product.sku, stock: product.currentStock },
    });

    revalidatePath("/inventory");
    return { success: true as const, product: serializeData(product) };
  } catch (err) {
    return formatError(err, "Failed to create product.");
  }
}

export async function updateProductAction(id: string, formData: unknown) {
  try {
    const user = await requireUser();
    const parsed = productSchema.parse(formData);

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: parsed.name,
        sku: parsed.sku.toUpperCase(),
        category: parsed.category || null,
        unit: parsed.unit || "pcs",
        currentStock: parsed.currentStock,
        minStock: parsed.minStock,
        purchaseCost: new Decimal(parsed.purchaseCost),
        supplierId: parsed.supplierId || null,
      },
    });

    await logAudit({
      actorId: user.id,
      action: "UPDATE_PRODUCT",
      entityType: "Product",
      entityId: product.id,
    });

    revalidatePath("/inventory");
    return { success: true as const, product: serializeData(product) };
  } catch (err) {
    return formatError(err, "Failed to update product.");
  }
}

export async function recordStockMovementAction(formData: unknown) {
  try {
    const user = await requireUser();
    const parsed = stockMovementSchema.parse(formData);

    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          productId: parsed.productId,
          type: parsed.type,
          quantity: parsed.quantity,
          reference: parsed.reference || null,
          createdById: user.id,
        },
      });

      let stockDelta = parsed.quantity;
      if (parsed.type === "SALE_CONSUMPTION") {
        stockDelta = -Math.abs(parsed.quantity);
      } else if (parsed.type === "PURCHASE" || parsed.type === "RETURN") {
        stockDelta = Math.abs(parsed.quantity);
      }

      await tx.product.update({
        where: { id: parsed.productId },
        data: {
          currentStock: { increment: stockDelta },
        },
      });

      await logAudit({
        actorId: user.id,
        action: "RECORD_STOCK_MOVEMENT",
        entityType: "StockMovement",
        entityId: movement.id,
        metadata: { productId: parsed.productId, type: parsed.type, quantity: parsed.quantity },
        tx,
      });

      return movement;
    });

    revalidatePath("/inventory");
    return { success: true as const, movement: serializeData(result) };
  } catch (err) {
    return formatError(err, "Failed to record stock movement.");
  }
}

// ================= PRODUCT BUNDLES (COMBOS) =================

export async function createProductBundleAction(formData: unknown) {
  try {
    const user = await requireUser();
    const parsed = bundleSchema.parse(formData);

    const bundle = await prisma.$transaction(async (tx) => {
      const newBundle = await tx.productBundle.create({
        data: {
          name: parsed.name,
          sku: parsed.sku.toUpperCase(),
          description: parsed.description || null,
          pricingType: parsed.pricingType,
          bundlePrice: parsed.bundlePrice !== undefined ? new Decimal(parsed.bundlePrice) : null,
          isActive: parsed.isActive ?? true,
          bundleItems: {
            create: parsed.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          bundleItems: {
            include: { product: true },
          },
        },
      });

      await logAudit({
        actorId: user.id,
        action: "CREATE_PRODUCT_BUNDLE",
        entityType: "ProductBundle",
        entityId: newBundle.id,
        metadata: { name: newBundle.name, sku: newBundle.sku },
        tx,
      });

      return newBundle;
    });

    revalidatePath("/inventory");
    revalidatePath("/orders");
    return { success: true as const, bundle: serializeData(bundle) };
  } catch (err) {
    return formatError(err, "Failed to create product bundle.");
  }
}

export async function updateProductBundleAction(id: string, formData: unknown) {
  try {
    const user = await requireUser();
    const parsed = bundleSchema.parse(formData);

    const bundle = await prisma.$transaction(async (tx) => {
      await tx.bundleItem.deleteMany({ where: { bundleId: id } });

      const updatedBundle = await tx.productBundle.update({
        where: { id },
        data: {
          name: parsed.name,
          sku: parsed.sku.toUpperCase(),
          description: parsed.description || null,
          pricingType: parsed.pricingType,
          bundlePrice: parsed.bundlePrice !== undefined ? new Decimal(parsed.bundlePrice) : null,
          isActive: parsed.isActive ?? true,
          bundleItems: {
            create: parsed.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          bundleItems: {
            include: { product: true },
          },
        },
      });

      await logAudit({
        actorId: user.id,
        action: "UPDATE_PRODUCT_BUNDLE",
        entityType: "ProductBundle",
        entityId: updatedBundle.id,
        metadata: { name: updatedBundle.name, sku: updatedBundle.sku },
        tx,
      });

      return updatedBundle;
    });

    revalidatePath("/inventory");
    revalidatePath("/orders");
    return { success: true as const, bundle: serializeData(bundle) };
  } catch (err) {
    return formatError(err, "Failed to update product bundle.");
  }
}

export async function deleteProductBundleAction(id: string) {
  try {
    const user = await requireUser();

    const bundle = await prisma.productBundle.delete({
      where: { id },
    });

    await logAudit({
      actorId: user.id,
      action: "DELETE_PRODUCT_BUNDLE",
      entityType: "ProductBundle",
      entityId: id,
      metadata: { name: bundle.name, sku: bundle.sku },
    });

    revalidatePath("/inventory");
    revalidatePath("/orders");
    return { success: true as const, id };
  } catch (err) {
    return formatError(err, "Failed to delete product bundle.");
  }
}

export async function getBundlesAction() {
  try {
    await requireUser();
    const bundles = await prisma.productBundle.findMany({
      orderBy: { name: "asc" },
      include: {
        bundleItems: {
          include: { product: true },
        },
      },
    });
    return { success: true as const, bundles: serializeData(bundles) };
  } catch (err) {
    return formatError(err, "Failed to fetch product bundles.");
  }
}
