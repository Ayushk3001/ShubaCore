const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();
async function main() {
  const txs = await prisma.partnerTransaction.findMany();
  const expenses = await prisma.expense.findMany();
  const payments = await prisma.payment.findMany();
  const products = await prisma.product.findMany();
  const orders = await prisma.order.findMany();
  console.log('PARTNER_TXS:', JSON.stringify(txs, null, 2));
  console.log('EXPENSES:', JSON.stringify(expenses, null, 2));
  console.log('PAYMENTS:', JSON.stringify(payments, null, 2));
  console.log('PRODUCTS:', JSON.stringify(products, null, 2));
}
main().finally(() => prisma.$disconnect());
