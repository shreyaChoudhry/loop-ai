import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash =
    "$2b$10$VGKWtz17H6AGR7syBzxFbuFjD9TuDTaCNzMsjZ81cjhzx88vmg6OG";

  await prisma.user.updateMany({
    where: {
      email: {
        in: [
          "admin@loop.dev",
          "analyst@loop.dev",
          "viewer@loop.dev",
        ],
      },
    },
    data: {
      password: passwordHash,
    },
  });

  console.log("✅ Password updated for all 3 users");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());