import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../generated/prisma/client";

const useTurso =
  process.env.VERCEL === "1" &&
  Boolean(process.env.TURSO_DATABASE_URL) &&
  Boolean(process.env.TURSO_AUTH_TOKEN);

const prismaAdapter = useTurso
  ? new PrismaLibSql({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    })
  : new PrismaBetterSqlite3({
      url: "file:./dev.db",
    });

export const prisma = new PrismaClient({
  adapter: prismaAdapter,
});