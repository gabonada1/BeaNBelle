import { createServer } from "node:http";
import { checkMongoConnection } from "./db.js";
import { loadEnv } from "./env.js";
import { getUserFromRequest } from "./auth.js";
import { handleApiRoute } from "./routes.js";
import { sendJson } from "./http.js";

loadEnv();

const port = Number(process.env.PORT ?? 4000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
let mongoStatus = {
  connected: false,
  message: "MongoDB has not been checked yet."
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        service: "bea-n-belle-backend",
        environment: process.env.NODE_ENV ?? "development",
        database: mongoStatus
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/config") {
      sendJson(response, 200, {
        clientOrigin,
        apiBasePath: "/api"
      });
      return;
    }

    const user = await getUserFromRequest(request);
    const result = await handleApiRoute(request, url, { user });

    if (result) {
      sendJson(response, result.status, result.body);
      return;
    }

    sendJson(response, 404, {
      error: "Route not found"
    });
  } catch (error) {
    sendJson(response, error.status ?? 500, {
      error: error.message || "Server error."
    });
  }
});

server.listen(port, async () => {
  console.log(`Backend API running at http://localhost:${port}`);
  mongoStatus = await checkMongoConnection(process.env.MONGODB_URI);

  if (mongoStatus.connected) {
    console.log("MongoDB status: connected");
  } else {
    console.log("MongoDB status: not connected");
    console.log(`MongoDB reason: ${mongoStatus.message}`);
  }
});

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", clientOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}
