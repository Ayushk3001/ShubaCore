import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== REMOVING DUPLICATE PURPLE PIPE CLEANER EXPENSE ===");
  
  const duplicateId = "cmto3bsum000g04l81viw0367";
  const existing = await prisma.expense.findUnique({ where: { id: duplicateId } });
  
  if (!existing) {
    console.log(`Expense ID ${duplicateId} not found or already deleted.`);
    return;
  }

  console.log("Found duplicate expense record to delete:");
  console.log(JSON.stringify(existing, null, 2));

  const deleted = await prisma.expense.delete({
    where: { id: duplicateId },
  });

  console.log(`\n✅ Successfully deleted duplicate expense ID ${deleted.id} (Amount: ₹${deleted.amount}).`);
  console.log("₹80.00 is now restored to Company Treasury & Available Capital!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
