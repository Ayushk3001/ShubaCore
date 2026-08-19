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

export interface PartnerBalanceDetail {
  id: string;
  name: string;
  email?: string;
  role?: string;
  isActive: boolean;
  directInvestments: number;
  outOfPocketExpenses: number;
  totalContributed: number;
  totalWithdrawn: number;
  profitSharePercent: number;
  allocatedProfit: number;
  netBalance: number;
  withdrawableAmount: number;
  liquidCashWithdrawable: number;
  tiedUpInStock: number;
  payableAmount: number;
  status: "LOCKED_IN_STOCK" | "PARTIALLY_RECOVERED" | "WITHDRAWABLE" | "PAYABLE_TO_COMPANY" | "SETTLED";
}

export function calculatePartnerBalances({
  partners = [],
  partnerTransactions = [],
  expenses = [],
  netProfit = 0,
  totalRevenue = 0,
}: {
  partners?: Array<{ id: string; name: string; email?: string; role?: string; isActive?: boolean }>;
  partnerTransactions?: Array<{ partnerId: string; type: string; amount: number | any }>;
  expenses?: Array<{ paidById?: string | null; amount: number | any; method?: string | null }>;
  netProfit?: number;
  totalRevenue?: number;
}): {
  partnerBalances: PartnerBalanceDetail[];
  totalPartnerContributed: number;
  totalPartnerWithdrawn: number;
  totalPartnerAllocatedProfit: number;
  totalWithdrawableCapital: number;
  totalLiquidCashWithdrawable: number;
  totalTiedUpInStock: number;
  totalPayableToCompany: number;
} {
  const activePartners = partners.filter((p) => p.isActive !== false);
  const activeCount = activePartners.length;
  const equalPercent = activeCount > 0 ? 100 / activeCount : 0;

  // First pass: Calculate total capital contributed by active partners
  let totalActiveContributed = 0;
  partners.forEach((partner) => {
    if (partner.isActive !== false) {
      const pTxs = partnerTransactions.filter((t) => t.partnerId === partner.id);
      const directInvestments = pTxs
        .filter((t) => t.type === "INITIAL_INVESTMENT" || t.type === "ADDITIONAL_INVESTMENT")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const expenseTablePaid = expenses
        .filter((e) => e.paidById === partner.id)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const partnerTxExpensePaid = pTxs
        .filter((t) => t.type === "EXPENSE_PAID")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const outOfPocketExpenses = Math.max(expenseTablePaid, partnerTxExpensePaid);
      totalActiveContributed += directInvestments + outOfPocketExpenses;
    }
  });

  // Calculate capital recovery ratio from sales revenue
  const recoveryRatio =
    totalActiveContributed > 0 ? Math.min(1, Math.max(0, totalRevenue / totalActiveContributed)) : 1;

  let totalPartnerContributed = 0;
  let totalPartnerWithdrawn = 0;
  let totalPartnerAllocatedProfit = 0;
  let totalWithdrawableCapital = 0;
  let totalLiquidCashWithdrawable = 0;
  let totalTiedUpInStock = 0;
  let totalPayableToCompany = 0;

  const partnerBalances: PartnerBalanceDetail[] = partners.map((partner) => {
    const isActive = partner.isActive !== false;

    // Capital transactions for this partner
    const pTxs = partnerTransactions.filter((t) => t.partnerId === partner.id);

    const directInvestments = pTxs
      .filter((t) => t.type === "INITIAL_INVESTMENT" || t.type === "ADDITIONAL_INVESTMENT")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Out of pocket expenses paid directly by partner (from Expense log or PartnerTransaction log)
    const expenseTablePaid = expenses
      .filter((e) => e.paidById === partner.id)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const partnerTxExpensePaid = pTxs
      .filter((t) => t.type === "EXPENSE_PAID")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Deduplicate so an out-of-pocket expense logged in both places is counted only once
    const outOfPocketExpenses = Math.max(expenseTablePaid, partnerTxExpensePaid);

    const totalContributed = directInvestments + outOfPocketExpenses;

    // Expenses funded directly from Partner Capital Fund (method === "PARTNER_CAPITAL")
    const capitalExpensesDeducted = expenses
      .filter((e) => e.method === "PARTNER_CAPITAL")
      .reduce((sum, e) => {
        const amt = Number(e.amount || 0);
        if (e.paidById) {
          return e.paidById === partner.id ? sum + amt : sum;
        } else {
          return isActive ? sum + amt / activeCount : sum;
        }
      }, 0);

    const totalWithdrawn = pTxs
      .filter((t) => t.type === "WITHDRAWAL" || t.type === "REIMBURSEMENT")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const profitSharePercent = isActive ? equalPercent : 0;
    const allocatedProfit = isActive ? netProfit * (profitSharePercent / 100) : 0;

    // Net Balance = (Contributed Capital - Capital Expenses Spent) + Profit Share - Withdrawals
    const netCapitalBalance = Math.max(0, totalContributed - capitalExpensesDeducted);
    const netBalance = netCapitalBalance + allocatedProfit - totalWithdrawn;
    const withdrawableAmount = netBalance > 0 ? netBalance : 0;
    const payableAmount = netBalance < 0 ? Math.abs(netBalance) : 0;

    // Cash vs Inventory Stock Lock calculation
    const liquidCashWithdrawable = Math.round(withdrawableAmount * recoveryRatio);
    const tiedUpInStock = withdrawableAmount - liquidCashWithdrawable;

    let status: "LOCKED_IN_STOCK" | "PARTIALLY_RECOVERED" | "WITHDRAWABLE" | "PAYABLE_TO_COMPANY" | "SETTLED" =
      "SETTLED";

    if (netBalance > 0.01) {
      if (recoveryRatio >= 0.999) {
        status = "WITHDRAWABLE";
      } else if (recoveryRatio > 0.01) {
        status = "PARTIALLY_RECOVERED";
      } else {
        status = "LOCKED_IN_STOCK";
      }
    } else if (netBalance < -0.01) {
      status = "PAYABLE_TO_COMPANY";
    }

    if (isActive) {
      totalPartnerContributed += totalContributed;
      totalPartnerWithdrawn += totalWithdrawn;
      totalPartnerAllocatedProfit += allocatedProfit;
      totalWithdrawableCapital += withdrawableAmount;
      totalLiquidCashWithdrawable += liquidCashWithdrawable;
      totalTiedUpInStock += tiedUpInStock;
      totalPayableToCompany += payableAmount;
    }

    return {
      id: partner.id,
      name: partner.name,
      email: partner.email,
      role: partner.role,
      isActive,
      directInvestments,
      outOfPocketExpenses,
      totalContributed,
      totalWithdrawn,
      profitSharePercent,
      allocatedProfit,
      netBalance,
      withdrawableAmount,
      liquidCashWithdrawable,
      tiedUpInStock,
      payableAmount,
      status,
    };
  });

  return {
    partnerBalances,
    totalPartnerContributed,
    totalPartnerWithdrawn,
    totalPartnerAllocatedProfit,
    totalWithdrawableCapital,
    totalLiquidCashWithdrawable,
    totalTiedUpInStock,
    totalPayableToCompany,
  };
}


