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
  packingCost?: number | any;
  status?: string;
  items?: OrderItemLike[];
  expenses?: Array<{ amount: number | any }>;
}

interface ExpenseLike {
  amount: number | any;
  type?: "OPERATING_EXPENSE" | "INVENTORY_PURCHASE" | "CAPITAL_INVESTMENT" | "OTHER" | string;
  category?: string;
  paidById?: string | null;
  method?: string | null;
}

interface PartnerTransactionLike {
  partnerId?: string;
  type: string;
  amount: number | any;
}

interface ProductLike {
  currentStock: number | any;
  purchaseCost: number | any;
}

interface PaymentLike {
  amount: number | any;
  type?: string;
}

export function calculateOrderGrossProfit(order: {
  discount?: number | any;
  packingCost?: number | any;
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
  payments = [],
}: {
  orders?: OrderLike[];
  expenses?: ExpenseLike[];
  partnerTransactions?: PartnerTransactionLike[];
  products?: ProductLike[];
  payments?: PaymentLike[];
}) {
  // Revenue and COGS are recognized only for COMMITTED orders (CONFIRMED onward).
  // Unconfirmed enquiries (NEW, QUOTED) and CANCELLED orders are excluded so that
  // quotes nobody has committed to cannot inflate revenue or profit.
  const REVENUE_STATUSES = [
    "CONFIRMED",
    "ADVANCE_PAID",
    "DESIGNING",
    "PRODUCTION",
    "READY",
    "DELIVERED",
    "COMPLETED",
  ];
  const activeOrders = orders.filter((o) => REVENUE_STATUSES.includes(String(o.status)));

  const totalRevenue = activeOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  // Net payments collected from customers (REFUND reduces collected cash)
  const totalCollected = payments.length > 0
    ? payments.reduce(
        (sum, p) => sum + (p.type === "REFUND" ? -Number(p.amount || 0) : Number(p.amount || 0)),
        0
      )
    : totalRevenue;

  const totalCogs = activeOrders.reduce((sum, o) => {
    const items = o.items || [];
    const orderCogs = items.reduce((itemSum, item) => {
      return itemSum + Number(item.costPriceSnapshot || 0) * Number(item.quantity || 0);
    }, 0);
    const packingCost = Number(o.packingCost || 0);
    return sum + orderCogs + packingCost;
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

  // Partner direct cash investments injected into the business pool
  const directPartnerInvestments = partnerTransactions
    .filter((t) => t.type === "INITIAL_INVESTMENT" || t.type === "ADDITIONAL_INVESTMENT")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Partner payouts (withdrawals / reimbursements)
  const partnerPayouts = partnerTransactions
    .filter((t) => t.type === "WITHDRAWAL" || t.type === "REIMBURSEMENT")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Net Operating Profit = Gross Profit - Operating Overhead.
  const netProfit = grossProfit - operatingExpenses;
  const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Physical Inventory Asset Valuation in Warehouse = sum(currentStock * purchaseCost)
  const inventoryAssetValuation = products.reduce((sum, p) => {
    const stock = Number(p.currentStock || 0);
    const cost = Number(p.purchaseCost || 0);
    return sum + (stock > 0 ? stock * cost : 0);
  }, 0);

  // Total Partner Capital Injected across all partner transactions & contributions
  const totalPartnerCapitalInjected = partnerTransactions
    .filter((t) => t.type === "INITIAL_INVESTMENT" || t.type === "ADDITIONAL_INVESTMENT" || t.type === "EXPENSE_PAID")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Total Capital Injected: Partner Inflow + any CapEx
  const totalCapitalInvested = totalPartnerCapitalInjected > 0 
    ? totalPartnerCapitalInjected 
    : (directPartnerInvestments + inventoryStockPurchases + capitalInvestments);

  // Unrecovered capital balance (against realized net profit)
  const unrecoveredCapitalBalance = Math.max(0, totalCapitalInvested - netProfit);
  const capitalRecoveredPercent =
    totalCapitalInvested > 0
      ? Math.min(100, Math.max(0, (netProfit / totalCapitalInvested) * 100))
      : 100;

  // Available Liquid Company Capital / Cash Balance = (Total All Invested Capital + Total Revenue Collected) - (Total All Expenses Paid + Total Partner Withdrawals)
  const totalCashInflow = totalCapitalInvested + totalCollected;
  const totalCashOutflow = totalAllExpenses + partnerPayouts;
  const availableCompanyCash = Math.max(0, totalCashInflow - totalCashOutflow);

  // Total Business Net Worth / Assets (Liquid Cash + Warehouse Physical Stock)
  const totalCompanyAssets = availableCompanyCash + inventoryAssetValuation;

  return {
    totalRevenue,
    totalCollected,
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
    directPartnerInvestments,
    availableCompanyCash,
    totalCompanyAssets,
    totalCashInflow,
    totalCashOutflow,
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
  stakePercent: number;
  equalRequiredInvestment: number;
  investmentDifference: number;
  investmentSurplus: number;
  investmentDeficit: number;
  profitUsedForInvestmentSplit: number;
  remainingInvestmentDeficit: number;
  allocatedProfit: number;
  withdrawableProfit: number;
  withdrawableCapital: number;
  netBalance: number;
  stakeAmount: number;
  withdrawableAmount: number;
  liquidCashWithdrawable: number;
  liquidShareWithdrawable: number;
  maxIndividualWithdrawable: number;
  stockBackedStake: number;
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
  payments = [],
}: {
  partners?: Array<{ id: string; name: string; email?: string; role?: string; isActive?: boolean }>;
  partnerTransactions?: Array<{ partnerId: string; type: string; amount: number | any }>;
  expenses?: Array<{ paidById?: string | null; amount: number | any; method?: string | null }>;
  netProfit?: number;
  totalRevenue?: number;
  payments?: Array<{ amount: number | any; type?: string }>;
}): {
  partnerBalances: PartnerBalanceDetail[];
  totalPartnerContributed: number;
  totalPartnerWithdrawn: number;
  totalPartnerAllocatedProfit: number;
  totalWithdrawableProfit: number;
  totalWithdrawableCapital: number;
  totalLiquidCashWithdrawable: number;
  totalTiedUpInStock: number;
  totalPayableToCompany: number;
  availableCompanyCapital: number;
  reconciliation: {
    capitalContributed: number;
    capitalFundExpenses: number;
    profitAllocated: number;
    cashWithdrawn: number;
    expectedTotalEquity: number;
    actualTotalEquity: number;
    difference: number;
    isBalanced: boolean;
  };
} {
  // Round money to 2 decimal places (paise) so floating-point dust never leaks into output.
  const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  const activePartners = partners.filter((p) => p.isActive !== false);
  const activeCount = activePartners.length;

  // A partner's contributed capital = direct investments + business expenses they paid
  // personally out-of-pocket minus any payback reimbursements received.
  const contributionOf = (partnerId: string) => {
    const pTxs = partnerTransactions.filter((t) => t.partnerId === partnerId);
    const rawDirectInvestments = pTxs
      .filter((t) => t.type === "INITIAL_INVESTMENT" || t.type === "ADDITIONAL_INVESTMENT")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const reimbursements = pTxs
      .filter((t) => t.type === "REIMBURSEMENT")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const directInvestments = Math.max(0, rawDirectInvestments - reimbursements);

    const expenseOutlay = expenses
      .filter((e) => e.paidById === partnerId && e.method !== "PARTNER_CAPITAL")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const pTxExpensePaid = pTxs
      .filter((t) => t.type === "EXPENSE_PAID")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const outOfPocketExpenses = Math.max(expenseOutlay, pTxExpensePaid);
    return { directInvestments, outOfPocketExpenses };
  };

  // Total capital contributed across ALL partners
  let totalContributedAll = 0;
  let totalDirectInvestmentsAll = 0;
  partners.forEach((partner) => {
    const c = contributionOf(partner.id);
    totalDirectInvestmentsAll += c.directInvestments;
    totalContributedAll += c.directInvestments + c.outOfPocketExpenses;
  });

  // Equal investment required per active partner
  const equalRequiredInvestment = activeCount > 0 ? totalContributedAll / activeCount : 0;

  // Expenses funded from the pooled Partner Capital Fund (method === "PARTNER_CAPITAL").
  const capitalFundExpenses = expenses
    .filter((e) => e.method === "PARTNER_CAPITAL")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalProfitAllocated = activeCount > 0 ? netProfit : 0;

  // Business-wide cash withdrawals from company capital treasury
  const totalCashOut = partnerTransactions
    .filter((t) => t.type === "WITHDRAWAL")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Cash Inflow & Outflow for Liquid Treasury Capital
  const totalCustomerPayments = payments.length > 0
    ? payments.reduce(
        (sum, p) => sum + (p.type === "REFUND" ? -Number(p.amount || 0) : Number(p.amount || 0)),
        0
      )
    : totalRevenue;
  
  const totalAllExpensesPaid = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const availableCompanyCapital = Math.max(
    0,
    (totalContributedAll + totalCustomerPayments) - (totalAllExpensesPaid + totalCashOut)
  );

  let totalPartnerContributed = 0;
  let totalPartnerWithdrawn = 0;
  let totalPartnerAllocatedProfit = 0;
  let totalWithdrawableProfit = 0;
  let totalWithdrawableCapital = 0;
  let totalLiquidCashWithdrawable = 0;
  let totalTiedUpInStock = 0;
  let totalPayableToCompany = 0;
  let sumAllNetBalances = 0;

  const partnerBalances: PartnerBalanceDetail[] = partners.map((partner) => {
    const isActive = partner.isActive !== false;

    const { directInvestments, outOfPocketExpenses } = contributionOf(partner.id);
    const totalContributed = directInvestments + outOfPocketExpenses;

    // Stake % and Profit Share % are EQUAL for all active partners (100 / N)
    const stakePercent = isActive && activeCount > 0 ? 100 / activeCount : 0;
    const profitSharePercent = stakePercent;

    // Equal allocated profit share from net profit
    const allocatedProfit = isActive && activeCount > 0 ? netProfit / activeCount : 0;

    // Investment deficit / surplus relative to equal required investment share
    const investmentDifference = isActive ? totalContributed - equalRequiredInvestment : 0;
    const investmentSurplus = isActive && investmentDifference > 0 ? investmentDifference : 0;
    const investmentDeficit = isActive && investmentDifference < 0 ? Math.abs(investmentDifference) : 0;

    // Deficits are settled explicitly via the Payback/Settlement option (Profit Share vs Direct Payment)
    const profitUsedForInvestmentSplit = 0;
    const remainingInvestmentDeficit = investmentDeficit;

    // Capital expenses deducted
    const capitalExpensesDeducted =
      totalContributedAll > 0 ? (totalContributed / totalContributedAll) * capitalFundExpenses : 0;

    const pTxs = partnerTransactions.filter((t) => t.partnerId === partner.id);
    const totalWithdrawn = pTxs
      .filter((t) => t.type === "WITHDRAWAL" || t.type === "REIMBURSEMENT")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Capital standing in the business for this partner
    const netCapitalBalance = totalContributed - capitalExpensesDeducted;

    // Total Net Stake Amount (Total Equity Owned) = Contributed Capital + Profit Share - Withdrawals
    const netBalance = netCapitalBalance + allocatedProfit - totalWithdrawn;
    const stakeAmount = netBalance;

    // Total positive equity stake
    const positiveEquity = isActive ? Math.max(0, netBalance) : 0;

    // Pro-rata fair liquid share from Available Company Capital
    const liquidShareWithdrawable =
      isActive && positiveEquity > 0
        ? Math.min(positiveEquity, availableCompanyCapital * (stakePercent / 100))
        : 0;

    // Absolute maximum individual withdrawal bounded by Available Company Capital
    const maxIndividualWithdrawable = Math.min(positiveEquity, availableCompanyCapital);

    const rawWithdrawable = liquidShareWithdrawable > 0 ? liquidShareWithdrawable : maxIndividualWithdrawable;

    // Profit share available for withdrawal
    const withdrawableProfit = isActive && allocatedProfit > 0
      ? Math.max(0, Math.min(allocatedProfit - totalWithdrawn, rawWithdrawable))
      : 0;

    const withdrawableCapital = isActive
      ? Math.max(0, Math.min(rawWithdrawable - withdrawableProfit, positiveEquity))
      : 0;

    const withdrawableAmount = withdrawableProfit + withdrawableCapital;
    const liquidCashWithdrawable = withdrawableAmount;

    // Remaining equity stake preserved in warehouse inventory stock
    const stockBackedStake = Math.max(0, positiveEquity - withdrawableAmount);
    const tiedUpInStock = stockBackedStake;

    const payableAmount = netBalance < -0.01 ? Math.abs(netBalance) : remainingInvestmentDeficit;

    let status: "LOCKED_IN_STOCK" | "PARTIALLY_RECOVERED" | "WITHDRAWABLE" | "PAYABLE_TO_COMPANY" | "SETTLED" =
      "SETTLED";

    if (payableAmount > 0.01 || netBalance < -0.01) {
      status = "PAYABLE_TO_COMPANY";
    } else if (withdrawableAmount > 0.01 && stockBackedStake > 0.01) {
      status = "PARTIALLY_RECOVERED";
    } else if (withdrawableAmount > 0.01) {
      status = "WITHDRAWABLE";
    } else if (stockBackedStake > 0.01) {
      status = "LOCKED_IN_STOCK";
    }

    sumAllNetBalances += netBalance;

    if (isActive) {
      totalPartnerContributed += totalContributed;
      totalPartnerWithdrawn += totalWithdrawn;
      totalPartnerAllocatedProfit += allocatedProfit;
      totalWithdrawableProfit += withdrawableProfit;
      totalWithdrawableCapital += withdrawableCapital;
      totalLiquidCashWithdrawable += withdrawableAmount;
      totalTiedUpInStock += tiedUpInStock;
      totalPayableToCompany += payableAmount;
    }

    return {
      id: partner.id,
      name: partner.name,
      email: partner.email,
      role: partner.role,
      isActive,
      directInvestments: round2(directInvestments),
      outOfPocketExpenses: round2(outOfPocketExpenses),
      totalContributed: round2(totalContributed),
      totalWithdrawn: round2(totalWithdrawn),
      profitSharePercent: round2(profitSharePercent),
      stakePercent: round2(stakePercent),
      equalRequiredInvestment: round2(equalRequiredInvestment),
      investmentDifference: round2(investmentDifference),
      investmentSurplus: round2(investmentSurplus),
      investmentDeficit: round2(investmentDeficit),
      profitUsedForInvestmentSplit: round2(profitUsedForInvestmentSplit),
      remainingInvestmentDeficit: round2(remainingInvestmentDeficit),
      allocatedProfit: round2(allocatedProfit),
      withdrawableProfit: round2(withdrawableProfit),
      withdrawableCapital: round2(withdrawableCapital),
      netBalance: round2(netBalance),
      stakeAmount: round2(stakeAmount),
      withdrawableAmount: round2(withdrawableAmount),
      liquidCashWithdrawable: round2(liquidCashWithdrawable),
      liquidShareWithdrawable: round2(liquidShareWithdrawable),
      maxIndividualWithdrawable: round2(maxIndividualWithdrawable),
      stockBackedStake: round2(stockBackedStake),
      tiedUpInStock: round2(tiedUpInStock),
      payableAmount: round2(payableAmount),
      status,
    };
  });

  // Independent reconciliation check: total partner equity MUST equal
  //   capital contributed − capital-fund spending + profit allocated − cash withdrawn.
  const expectedTotalEquity =
    totalContributedAll - capitalFundExpenses + totalProfitAllocated - totalCashOut;
  const difference = sumAllNetBalances - expectedTotalEquity;

  return {
    partnerBalances,
    totalPartnerContributed: round2(totalPartnerContributed),
    totalPartnerWithdrawn: round2(totalPartnerWithdrawn),
    totalPartnerAllocatedProfit: round2(totalPartnerAllocatedProfit),
    totalWithdrawableProfit: round2(totalWithdrawableProfit),
    totalWithdrawableCapital: round2(totalWithdrawableCapital),
    totalLiquidCashWithdrawable: round2(totalLiquidCashWithdrawable),
    totalTiedUpInStock: round2(totalTiedUpInStock),
    totalPayableToCompany: round2(totalPayableToCompany),
    availableCompanyCapital: round2(availableCompanyCapital),
    reconciliation: {
      capitalContributed: round2(totalContributedAll),
      capitalFundExpenses: round2(capitalFundExpenses),
      profitAllocated: round2(totalProfitAllocated),
      cashWithdrawn: round2(totalCashOut),
      expectedTotalEquity: round2(expectedTotalEquity),
      actualTotalEquity: round2(sumAllNetBalances),
      difference: round2(difference),
      isBalanced: Math.abs(difference) < 0.01,
    },
  };
}


