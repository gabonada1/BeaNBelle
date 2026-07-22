import { loadEnv } from "./env.js";
import { getDb } from "./db.js";
import { hashPassword } from "./auth.js";

loadEnv();

const ownerName = process.env.SEED_OWNER_NAME ?? "Bea N Belle Owner";
const ownerUsername = (process.env.SEED_OWNER_USERNAME ?? "owner").trim().toLowerCase();
const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "owner123";

let db;

try {
  db = await getDb();
  await createIndexes();
  await freshAccountCollections();
  await createOwner();
} catch (error) {
  console.error("Account seed failed.");
  console.error(error.message);
  process.exit(1);
}

console.log("Account seed completed. Owner account was created.");
console.log(`Owner login: ${ownerUsername}`);
console.log(`Owner password: ${ownerPassword}`);
process.exit(0);

function now() {
  return new Date();
}

async function freshAccountCollections() {
  const collections = ["users", "sessions"];

  for (const collectionName of collections) {
    await db.collection(collectionName).deleteMany({});
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
  await db.collection("expenses").createIndex({ id: 1 }, { unique: true });
  await db.collection("refunds").createIndex({ id: 1 }, { unique: true });
}
