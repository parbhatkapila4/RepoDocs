import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

const databaseUrl = process.env.DATABASE_URL;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient(
    databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined
  );
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient(
      databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined
    );
  }
  prisma = global.prisma;
}

export default prisma;
