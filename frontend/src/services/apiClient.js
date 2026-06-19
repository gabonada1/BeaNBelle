const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error ?? `API request failed with status ${response.status}`);
  }

  return response.json();
}

export { API_BASE_URL };

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
