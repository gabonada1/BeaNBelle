import { loadEnv } from "./env.js";
import { getDb } from "./db.js";

loadEnv();

const wipeAccounts = process.env.WIPE_ACCOUNTS === "true";
const collections = [
  "branches",
  "products",
  "sales",
  "expenses",
  "refunds",
  "stockMovements",
  "sessions",
  ...(wipeAccounts ? ["users"] : [])
];

try {
  const db = await getDb();

  for (const collectionName of collections) {
    const result = await db.collection(collectionName).deleteMany({});
    console.log(`${collectionName}: deleted ${result.deletedCount} records`);
  }

  console.log(wipeAccounts ? "Database data wipe completed, including accounts." : "Database data wipe completed. Accounts were kept.");
  process.exit(0);
} catch (error) {
  console.error("Database data wipe failed.");
  console.error(error.message);
  process.exit(1);
}
