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
  type?: "OPERATING_EXPENSE" | "INVENTORY_PURCHASE" | "CAPITAL_INVESTMENT" | "OTHER" | string;
  category?: string;
}

interface PartnerTransactionLike {
  type: string;
  amount: number | any;
}

interface ProductLike {
  currentStock: number | any;
  purchaseCost: number | any;
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
  products = [],
}: {
  orders?: OrderLike[];
  expenses?: ExpenseLike[];
  partnerTransactions?: PartnerTransactionLike[];
  products?: ProductLike[];
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

  // Separate OpEx (Operating Overhead) from Inventory Stock Purchases & Capital Investments
  const operatingExpenses = expenses
    .filter((e) => !e.type || e.type === "OPERATING_EXPENSE" || e.type === "OTHER")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const inventoryStockPurchases = expenses
    .filter((e) => e.type === "INVENTORY_PURCHASE")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const capitalInvestments = expenses
    .filter((e) => e.type === "CAPITAL_INVESTMENT")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalAllExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const partnerPayouts = partnerTransactions
    .filter((t) => t.type === "WITHDRAWAL" || t.type === "REIMBURSEMENT")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Net Operating Profit = Gross Profit - Operating Overhead - Partner Payouts
  const netProfit = grossProfit - (operatingExpenses + partnerPayouts);

  const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Physical Inventory Asset Valuation in Warehouse = sum(currentStock * purchaseCost)
  const inventoryAssetValuation = products.reduce((sum, p) => {
    const stock = Number(p.currentStock || 0);
    const cost = Number(p.purchaseCost || 0);
    return sum + (stock > 0 ? stock * cost : 0);
  }, 0);

  // Capital Recovery Tracking
  const totalCapitalInvested = inventoryStockPurchases + capitalInvestments;
  const unrecoveredCapitalBalance = Math.max(0, totalCapitalInvested - totalRevenue);
  const capitalRecoveredPercent =
    totalCapitalInvested > 0
      ? Math.min(100, (totalRevenue / totalCapitalInvested) * 100)
      : 100;

  return {
    totalRevenue,
    totalCogs,
    grossProfit,
    operatingExpenses,
    inventoryStockPurchases,
    capitalInvestments,
    totalAllExpenses,
    partnerPayouts,
    netProfit,
    marginPercent: marginPercent.toFixed(1),
    inventoryAssetValuation,
    totalCapitalInvested,
    unrecoveredCapitalBalance,
    capitalRecoveredPercent: capitalRecoveredPercent.toFixed(1),
  };
}
