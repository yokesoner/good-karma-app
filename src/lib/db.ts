import { PrismaClient } from "@prisma/client";

// Next.js в dev-режиме перезагружает модули при каждом изменении файла.
// Без этого синглтона каждый hot-reload открывал бы новое соединение
// с базой, и через пару минут разработки упирались бы в лимит подключений.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
