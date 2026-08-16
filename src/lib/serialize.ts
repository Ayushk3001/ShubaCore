/**
 * Safely converts Prisma model objects (containing Decimal instances)
 * into plain JSON objects for Next.js Server Component -> Client Component boundary.
 */
export function serializeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
