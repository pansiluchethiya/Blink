import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Keep old API shape: frontend expects `_id` string. Map Prisma `id` -> `_id`.
export const toResponse = <T extends { id: string }>(doc: T): Omit<T, "id"> & { _id: string; id: string } => {
  const { id, ...rest } = doc as T & { id: string };
  return { ...(rest as Omit<T, "id">), _id: id, id };
};

export const toList = <T extends { id: string }>(docs: T[]) => docs.map(toResponse);

export const isValidId = (id: unknown): boolean => {
  if (typeof id !== "string" || id.length === 0) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};
