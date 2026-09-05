import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== AUDITING ALL INVENTORY PURCHASE EXPENSES FOR DUPLICATES ===");

  const expenses = await prisma.expense.findMany({
    where: {
      type: "INVENTORY_PURCHASE",
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${expenses.length} total INVENTORY_PURCHASE expenses.\n`);

  const seenMap = new Map<string, typeof expenses>();

  for (const e of expenses) {
    // Key by simplified product name / description base & amount
    const normalizedDesc = e.description
      .replace(/\(.*\)/g, "")
      .replace(/-\s*\d+\s*(pcs|sets|grams|kg)/gi, "")
      .trim();
    
    const key = `${normalizedDesc}_${e.amount}`;
    if (!seenMap.has(key)) {
      seenMap.set(key, []);
    }
    seenMap.get(key)!.push(e);
  }

  let duplicateGroupCount = 0;
  for (const [key, group] of seenMap.entries()) {
    if (group.length > 1) {
      duplicateGroupCount++;
      console.log(`⚠️ POTENTIAL DUPLICATE GROUP #${duplicateGroupCount}: "${key}"`);
      group.forEach((e) => {
        console.log(`   - Expense ID: ${e.id} | Amount: ₹${e.amount} | Date: ${e.expenseDate.toISOString()} | Desc: "${e.description}"`);
      });
      console.log("");
    }
  }

  if (duplicateGroupCount === 0) {
    console.log("✅ No other duplicate expense groups found.");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
