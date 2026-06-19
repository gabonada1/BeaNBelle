import { apiRequest } from "./apiClient.js";

export function loginUser({ username, password }) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}
