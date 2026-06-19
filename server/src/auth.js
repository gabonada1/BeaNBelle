import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "./db.js";

const TOKEN_BYTES = 32;

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedPassword) {
  const [salt, hash] = String(storedPassword ?? "").split(":");

  if (!salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(user) {
  const db = await getDb();
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const now = new Date();

  await db.collection("sessions").insertOne({
    tokenHash: hashToken(token),
    userId: user._id,
    createdAt: now,
    lastUsedAt: now
  });

  return token;
}

export async function getUserFromRequest(request) {
  const authHeader = request.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return null;
  }

  const db = await getDb();
  const session = await db.collection("sessions").findOne({ tokenHash: hashToken(token) });

  if (!session) {
    return null;
  }

  await db.collection("sessions").updateOne(
    { _id: session._id },
    { $set: { lastUsedAt: new Date() } }
  );

  return db.collection("users").findOne({ _id: new ObjectId(session.userId), active: { $ne: false } });
}

export function requireUser(context) {
  if (!context.user) {
    return {
      status: 401,
      body: { error: "Login required." }
    };
  }

  return null;
}

export function requireOwner(context) {
  const authError = requireUser(context);

  if (authError) {
    return authError;
  }

  if (context.user.role !== "owner") {
    return {
      status: 403,
      body: { error: "Owner access required." }
    };
  }

  return null;
}

export function serializeUser(user, branch = null) {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    role: user.role,
    branchId: user.branchId ?? null,
    branchName: branch?.name ?? null,
    active: user.active !== false,
    createdAt: user.createdAt
  };
}
