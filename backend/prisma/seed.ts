import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  // Delete old demo accounts (optional)
  await prisma.user.deleteMany({
    where: {
      email: { in: ["admin@demo.com", "user@demo.com"] },
    },
  });

  // Hash passwords
  const adminPassword = await bcrypt.hash("admin", SALT_ROUNDS);
  const userPassword = await bcrypt.hash("user", SALT_ROUNDS);

  // Create demo accounts individually
  await prisma.user.create({
    data: {
      email: "admin@demo.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      email: "user@demo.com",
      password: userPassword,
      role: "USER",
    },
  });

  console.log("✅ Demo accounts created with hashed passwords");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
