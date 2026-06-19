import dns from "node:dns";
import { MongoClient } from "mongodb";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

let mongoClient;
let mongoConnectPromise;

export function getMongoUri() {
  return process.env.MONGODB_URI;
}

export function getDatabaseName() {
  return process.env.MONGODB_DB_NAME ?? "bea_n_belle";
}

export async function getClient() {
  if (!mongoClient) {
    mongoClient = new MongoClient(getMongoUri(), {
      connectTimeoutMS: 8000,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 8000
    });
  }

  if (!mongoConnectPromise) {
    mongoConnectPromise = withTimeout(() => mongoClient.connect(), 10000).catch((error) => {
      const failedClient = mongoClient;
      mongoClient = null;
      mongoConnectPromise = null;
      failedClient?.close().catch(() => {});
      throw error;
    });
  }

  await mongoConnectPromise;
  return mongoClient;
}

export async function getDb() {
  const client = await getClient();
  return client.db(getDatabaseName());
}

export async function checkMongoConnection(uri) {
  if (!uri || uri.includes("<db_password>") || uri.includes("paste_your_mongodb_atlas_link_here")) {
    return {
      connected: false,
      message: "MONGODB_URI is missing or still contains a placeholder."
    };
  }

  const client = new MongoClient(uri, {
    connectTimeoutMS: 8000,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 8000
  });

  try {
    return await withTimeout(async () => {
      await client.connect();
      const result = await client.db("admin").command({ ping: 1 });

      return {
        connected: result.ok === 1,
        message: result.ok === 1 ? "MongoDB Atlas connected." : "MongoDB Atlas ping failed."
      };
    }, 10000);
  } catch (error) {
    return {
      connected: false,
      message: error.message
    };
  } finally {
    client.close().catch(() => {});
  }
}

function withTimeout(task, timeoutMs) {
  return Promise.race([
    task(),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`MongoDB connection timed out after ${timeoutMs / 1000} seconds.`));
      }, timeoutMs);
    })
  ]);
}
