import "dotenv/config"; 
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "apps/web/prisma/schema.prisma",   // path to your schema file
  migrations: {
    path: "./prisma/migrations",      // migrations folder
  },
  datasource: {
    url: env("DATABASE_URL"),         // read from .env
  },
  // engine: "classic" is optional — default is fine
});
