const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("./src/generated/prisma");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== CHECKING ALL PRODUCTS ===");
  const products = await prisma.product.findMany({
    include: {
      stockMovements: true,
    },
  });
  console.log(`Found ${products.length} products total:`);
  products.forEach((p) => {
    console.log(`- ID: ${p.id} | Name: "${p.name}" | Stock: ${p.currentStock} | Cost: ₹${p.purchaseCost} | Selling: ₹${p.sellingPrice}`);
    if (p.stockMovements && p.stockMovements.length > 0) {
      console.log(`  Stock Movements (${p.stockMovements.length}):`);
      p.stockMovements.forEach((m) => {
        console.log(`    - Movement ID: ${m.id} | Type: ${m.type} | Qty: ${m.quantity} | Reason: ${m.reason} | Date: ${m.createdAt}`);
      });
    }
  });

  console.log("\n=== CHECKING ALL EXPENSES ===");
  const expenses = await prisma.expense.findMany({
    include: {
      paidBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  console.log(`Found ${expenses.length} expenses total:`);
  expenses.forEach((e) => {
    console.log(`- Expense ID: ${e.id} | Type: ${e.type} | Category: ${e.category} | Amount: ₹${e.amount} | Method: ${e.method} | PaidBy: ${e.paidBy?.name || "Company Treasury"} | Description: "${e.description}" | Date: ${e.expenseDate}`);
  });

  console.log("\n=== CHECKING ALL PARTNER TRANSACTIONS ===");
  const partnerTxns = await prisma.partnerTransaction.findMany({
    include: {
      partner: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  console.log(`Found ${partnerTxns.length} partner transactions total:`);
  partnerTxns.forEach((t) => {
    console.log(`- Tx ID: ${t.id} | Partner: ${t.partner.name} | Type: ${t.type} | Amount: ₹${t.amount} | Method: ${t.method} | Desc: "${t.description}" | Date: ${t.occurredAt}`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
