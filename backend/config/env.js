import { config } from "dotenv";

process.env.NODE_ENV = process.env.NODE_ENV || "production";
console.log(`.env.${process.env.NODE_ENV}.local`);

config({ path: `.env.${process.env.NODE_ENV}.local` });

export const {
  PORT,
  NODE_ENV,
  DB_URL,
  DB_PASSWORD,
  JWT_SECRET = "supersecretkey",
  JWT_EXPIRES_IN = "12h",
} = process.env;
