import { checkMongoConnection } from "./db.js";
import { loadEnv } from "./env.js";

loadEnv();

const status = await checkMongoConnection(process.env.MONGODB_URI);

if (status.connected) {
  console.log("MongoDB Atlas connection successful.");
  console.log(status.message);
} else {
  console.log("MongoDB Atlas connection failed.");
  console.log(status.message);
  process.exit(1);
}
