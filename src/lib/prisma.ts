import "server-only";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "" });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// In dev mode, refresh cached client if new models (e.g. product) are missing from cached instance
const cachedPrisma = globalForPrisma.prisma;
export const prisma =
  cachedPrisma && (cachedPrisma as any).product
    ? cachedPrisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}


