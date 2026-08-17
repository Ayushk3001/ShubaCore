interface OrderItemLike {
  quantity: number;
  unitPrice: number | any;
  costPriceSnapshot?: number | any | null;
}

interface OrderLike {
  id?: string;
  orderNumber?: string;
  total?: number | any;
  discount?: number | any;
  status?: string;
  items?: OrderItemLike[];
  expenses?: Array<{ amount: number | any }>;
}

interface ExpenseLike {
  amount: number | any;
}

interface PartnerTransactionLike {
  type: string;
  amount: number | any;
}

export function calculateOrderGrossProfit(order: {
  discount?: number | any;
  items?: OrderItemLike[];
}): number {
  const items = order.items || [];
  const itemsGrossMargin = items.reduce((sum, item) => {
    const price = Number(item.unitPrice || 0);
    const cost = Number(item.costPriceSnapshot || 0);
    return sum + (price - cost) * Number(item.quantity || 0);
  }, 0);
  const discount = Number(order.discount || 0);
  return itemsGrossMargin - discount;
}

export function calculateProfitMetrics({
  orders = [],
  expenses = [],
  partnerTransactions = [],
}: {
  orders?: OrderLike[];
  expenses?: ExpenseLike[];
  partnerTransactions?: PartnerTransactionLike[];
}) {
  // Exclude CANCELLED orders from revenue/cogs calculation
  const activeOrders = orders.filter((o) => o.status !== "CANCELLED");

  const totalRevenue = activeOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const totalCogs = activeOrders.reduce((sum, o) => {
    const items = o.items || [];
    const orderCogs = items.reduce((itemSum, item) => {
      return itemSum + Number(item.costPriceSnapshot || 0) * Number(item.quantity || 0);
    }, 0);
    return sum + orderCogs;
  }, 0);

  const grossProfit = activeOrders.reduce((sum, o) => {
    return sum + calculateOrderGrossProfit(o);
  }, 0);

  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const partnerPayouts = partnerTransactions
    .filter((t) => t.type === "WITHDRAWAL" || t.type === "REIMBURSEMENT")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netProfit = grossProfit - (totalOperatingExpenses + partnerPayouts);

  const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalCogs,
    grossProfit,
    totalOperatingExpenses,
    partnerPayouts,
    netProfit,
    marginPercent: marginPercent.toFixed(1),
  };
}
