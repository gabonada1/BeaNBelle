import { checkMongoConnection } from "./db.js";
import { loadEnv } from "./env.js";
import { getUserFromRequest } from "./auth.js";
import { handleApiRoute } from "./routes.js";
import { sendJson } from "./http.js";

loadEnv();

let mongoStatus = {
  connected: false,
  message: "MongoDB has not been checked yet."
};

// Check DB connection lazily on cold start
let dbCheckPromise = null;
async function ensureDbConnected() {
  if (!dbCheckPromise) {
    dbCheckPromise = checkMongoConnection(process.env.MONGODB_URI)
      .then((status) => {
        mongoStatus = status;
      })
      .catch((err) => {
        mongoStatus = { connected: false, message: err.message };
      });
  }
  await dbCheckPromise;
}

// 1. MAIN EXPORTED HANDLER FOR VERCEL
export default async function handler(request, response) {
  // Ensure CORS headers are attached to EVERY response (including preflight and errors)
  setCorsHeaders(request, response);

  // Handle browser CORS preflight (OPTIONS) requests immediately
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  // Ensure DB check finishes on serverless cold-start
  await ensureDbConnected();

  const host = request.headers.host || "localhost";
  const protocol = request.headers["x-forwarded-proto"] || "http";
  const url = new URL(request.url ?? "/", `${protocol}://${host}`);

  try {
    // Health check endpoint
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        service: "bea-n-belle-backend",
        environment: process.env.NODE_ENV ?? "development",
        database: mongoStatus
      });
      return;
    }

    // Config endpoint
    if (request.method === "GET" && url.pathname === "/api/config") {
      sendJson(response, 200, {
        clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
        apiBasePath: "/api"
      });
      return;
    }

    // Authenticate and route requests
    const user = await getUserFromRequest(request);
    const result = await handleApiRoute(request, url, { user });

    if (result) {
      sendJson(response, result.status, result.body);
      return;
    }

    // Route not matched
    sendJson(response, 404, {
      error: `Route not found: ${request.method} ${url.pathname}`
    });
  } catch (error) {
    console.error("Unhandled Server Error:", error);
    sendJson(response, error.status ?? 500, {
      error: error.message || "Server error."
    });
  }
}

// 2. DYNAMIC CORS HEADER HELPER
function setCorsHeaders(request, response) {
  const origin = request.headers.origin;
  const configuredOrigin = process.env.CLIENT_ORIGIN;

  // Allow configured origin, or dynamically reflect request origin for dev/previews
  const allowedOrigin = configuredOrigin || origin || "*";

  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  response.setHeader("Access-Control-Allow-Credentials", "true");
}

// 3. LOCAL DEVELOPMENT ONLY (Run with: node server/src/index.js)
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  import("node:http").then(({ createServer }) => {
    const port = Number(process.env.PORT ?? 4000);
    const server = createServer(handler);
    server.listen(port, () => {
      console.log(`Backend API running locally at http://localhost:${port}`);
    });
  });
}