import { apiRequest, authHeaders } from "./apiClient.js";

export function getBranches(token) {
  return apiRequest("/branches", {
    headers: authHeaders(token)
  });
}

export function createBranch(token, branch) {
  return apiRequest("/branches", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(branch)
  });
}

export function getUsers(token) {
  return apiRequest("/users", {
    headers: authHeaders(token)
  });
}

export function createUser(token, user) {
  return apiRequest("/users", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(user)
  });
}

export function getSummary(token, branchId) {
  return apiRequest(`/reports/summary?branchId=${encodeURIComponent(branchId)}`, {
    headers: authHeaders(token)
  });
}

export function createProduct(token, product) {
  return apiRequest("/products", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(product)
  });
}

export function createStockMovement(token, movement) {
  return apiRequest("/stock-movements", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(movement)
  });
}

export function createSale(token, sale) {
  return apiRequest("/sales", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(sale)
  });
}

export function createRefund(token, refund) {
  return apiRequest("/refunds", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(refund)
  });
}

export function createExpense(token, expense) {
  return apiRequest("/expenses", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(expense)
  });
}
