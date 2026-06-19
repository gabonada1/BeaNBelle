export async function readJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString("utf8");

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.status = 400;
    throw error;
  }
}

export function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify(payload));
}

export function getPathParts(url) {
  return url.pathname.split("/").filter(Boolean);
}

export function requireFields(body, fields) {
  const missingFields = fields.filter((field) => body[field] === undefined || body[field] === "");

  if (missingFields.length) {
    const error = new Error(`Missing required fields: ${missingFields.join(", ")}.`);
    error.status = 400;
    throw error;
  }
}

export function toNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}
