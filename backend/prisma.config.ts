import {config as dotenv} from "dotenv";
dotenv();

import { defineConfig } from "@prisma/config";

if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in .env");
}

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});