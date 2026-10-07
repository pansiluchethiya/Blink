import { prisma } from "./prisma.js";

export const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.DATABASE_URL) {
      console.error(
        "ERROR: DATABASE_URL environment variable is not set!\n" +
        "Please ensure DATABASE_URL is set in your environment variables or .env file.\n" +
        "Local: Add DATABASE_URL to the .env file in backend/.\n" +
        "Production (Koyeb): Set DATABASE_URL in your service environment variables (Postgres -> Connection details -> .env)."
      );
      process.exit(1);
    }

    await prisma.$connect();
    console.log(`Postgres connected via Prisma`);
  } catch (error) {
    console.log("Postgres connection error:", error);
    process.exit(1);
  }
};
