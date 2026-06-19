import { loadEnv } from "./env.js";
import { getDb } from "./db.js";
import { hashPassword } from "./auth.js";
import { starterBranches, starterProducts, starterSales } from "./seedData.js";

loadEnv();

const ownerName = process.env.SEED_OWNER_NAME ?? "Bea N Belle Owner";
const ownerUsername = (process.env.SEED_OWNER_USERNAME ?? "owner").trim().toLowerCase();
const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "owner123";

let db;

try {
  db = await getDb();
  await createIndexes();
  await freshCollections();
  await insertMany("branches", starterBranches);
  await insertMany("products", starterProducts);
  await insertMany("sales", starterSales);
  await createOwner();
} catch (error) {
  console.error("Fresh seed failed.");
  console.error(error.message);
  process.exit(1);
}

console.log("Fresh seed completed. Branches, products, sales, refunds, and stock history are empty.");
console.log(`Owner login: ${ownerUsername}`);
console.log(`Owner password: ${ownerPassword}`);
process.exit(0);

function now() {
  return new Date();
}

async function freshCollections() {
  const collections = [
    "branches",
    "products",
    "sales",
    "refunds",
    "stockMovements",
    "users",
    "sessions"
  ];

  for (const collectionName of collections) {
    await db.collection(collectionName).deleteMany({});
  }
}

async function insertMany(collectionName, rows) {
  const collection = db.collection(collectionName);

  for (const row of rows) {
    await collection.insertOne({
      ...row,
      active: row.active ?? true,
      createdAt: now(),
      updatedAt: now()
    });
  }
}

async function createOwner() {
  await db.collection("users").insertOne({
    name: ownerName,
    username: ownerUsername,
    passwordHash: hashPassword(ownerPassword),
    role: "owner",
    branchId: null,
    active: true,
    createdAt: now(),
    updatedAt: now()
  });
}

async function createIndexes() {
  await db.collection("branches").createIndex({ id: 1 }, { unique: true });
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
  await db.collection("products").createIndex({ id: 1 }, { unique: true });
  await db.collection("sales").createIndex({ id: 1 }, { unique: true });
  await db.collection("refunds").createIndex({ id: 1 }, { unique: true });
}
