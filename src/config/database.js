import "dotenv/config";
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
}

const databaseUrl = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.slice(1),
    connectionLimit: 5
});


const prisma = new PrismaClient({
    adapter
});


export default prisma;
