import { ObjectId } from "mongodb";
import { createSession, hashPassword, requireOwner, requireUser, serializeUser, verifyPassword } from "./auth.js";
import { getClient, getDb } from "./db.js";
import { getPathParts, readJson, requireFields, toNumber } from "./http.js";
import { makeId, slugifyId } from "./ids.js";

export async function handleApiRoute(request, url, context) {
  const parts = getPathParts(url);

  if (parts[0] !== "api") {
    return null;
  }

  if (request.method === "POST" && parts[1] === "auth" && parts[2] === "bootstrap-owner") {
    return bootstrapOwner(request);
  }

  if (request.method === "POST" && parts[1] === "auth" && parts[2] === "login") {
    return login(request);
  }

  if (request.method === "GET" && parts[1] === "me") {
    const authError = requireUser(context);
    if (authError) return authError;
    return { status: 200, body: { user: serializeUser(context.user) } };
  }

  if (parts[1] === "branches") {
    return handleBranches(request, parts, context);
  }

  if (parts[1] === "users") {
    return handleUsers(request, parts, context);
  }

  if (parts[1] === "products") {
    return handleProducts(request, parts, context);
  }

  if (parts[1] === "stock-movements") {
    return handleStockMovements(request, context);
  }

  if (parts[1] === "sales") {
    return handleSales(request, parts, context);
  }

  if (parts[1] === "refunds") {
    return handleRefunds(request, context);
  }

  if (parts[1] === "reports" && parts[2] === "summary") {
    return getReportSummary(url, context);
  }

  return {
    status: 404,
    body: { error: "API route not found." }
  };
}

async function bootstrapOwner(request) {
  const db = await getDb();
  const usersCount = await db.collection("users").countDocuments();

  if (usersCount > 0) {
    return { status: 409, body: { error: "Owner already exists. Login as owner to add more users." } };
  }

  const body = await readJson(request);
  requireFields(body, ["name", "username", "password"]);

  const now = new Date();
  const result = await db.collection("users").insertOne({
    name: body.name.trim(),
    username: body.username.trim().toLowerCase(),
    passwordHash: hashPassword(body.password),
    role: "owner",
    branchId: null,
    active: true,
    createdAt: now,
    updatedAt: now
  });

  const user = await db.collection("users").findOne({ _id: result.insertedId });
  const token = await createSession(user);

  return {
    status: 201,
    body: { token, user: serializeUser(user) }
  };
}

async function login(request) {
  const db = await getDb();
  const body = await readJson(request);
  requireFields(body, ["username", "password"]);

  const user = await db.collection("users").findOne({
    username: body.username.trim().toLowerCase(),
    active: { $ne: false }
  });

  if (!user || !verifyPassword(body.password, user.passwordHash)) {
    return { status: 401, body: { error: "Invalid username or password." } };
  }

  const branch = user.branchId ? await db.collection("branches").findOne({ id: user.branchId }) : null;
  const token = await createSession(user);

  return {
    status: 200,
    body: { token, user: serializeUser(user, branch) }
  };
}

async function handleBranches(request, parts, context) {
  const db = await getDb();

  if (request.method === "GET" && parts.length === 2) {
    const branches = await db.collection("branches").find({ active: { $ne: false } }).sort({ name: 1 }).toArray();
    return { status: 200, body: { branches: branches.map(serializeBranch) } };
  }

  if (request.method === "POST" && parts.length === 2) {
    const ownerError = requireOwner(context);
    if (ownerError) return ownerError;

    const body = await readJson(request);
    requireFields(body, ["name", "location"]);
    const now = new Date();
    const id = body.id ? slugifyId(body.id) : slugifyId(body.name);

    const branch = {
      id,
      name: body.name.trim(),
      location: body.location.trim(),
      manager: body.manager?.trim() ?? "",
      active: true,
      createdAt: now,
      updatedAt: now
    };

    await db.collection("branches").insertOne(branch);
    await db.collection("products").updateMany({}, { $set: { [`stock.${id}`]: 0 } });

    return { status: 201, body: { branch: serializeBranch(branch) } };
  }

  if (request.method === "PATCH" && parts.length === 3) {
    const ownerError = requireOwner(context);
    if (ownerError) return ownerError;

    const body = await readJson(request);
    const update = pick(body, ["name", "location", "manager", "active"]);
    update.updatedAt = new Date();

    const branch = await db.collection("branches").findOneAndUpdate(
      { id: parts[2] },
      { $set: update },
      { returnDocument: "after" }
    );

    return found(branch, "Branch not found.", (value) => ({ branch: serializeBranch(value) }));
  }

  return methodNotAllowed();
}

async function handleUsers(request, parts, context) {
  const db = await getDb();
  const ownerError = requireOwner(context);
  if (ownerError) return ownerError;

  if (request.method === "GET" && parts.length === 2) {
    const users = await db.collection("users").find().sort({ createdAt: -1 }).toArray();
    return { status: 200, body: { users: users.map((user) => serializeUser(user)) } };
  }

  if (request.method === "POST" && parts.length === 2) {
    const body = await readJson(request);
    requireFields(body, ["name", "username", "password", "role"]);

    const role = normalizeRole(body.role);
    const branchId = role === "owner" ? null : body.branchId;

    if (role !== "owner") {
      requireFields({ branchId }, ["branchId"]);
      const branch = await db.collection("branches").findOne({ id: branchId, active: { $ne: false } });
      if (!branch) return { status: 400, body: { error: "Assigned branch does not exist." } };
    }

    const now = new Date();
    const result = await db.collection("users").insertOne({
      name: body.name.trim(),
      username: body.username.trim().toLowerCase(),
      passwordHash: hashPassword(body.password),
      role,
      branchId,
      active: true,
      createdAt: now,
      updatedAt: now
    });
    const user = await db.collection("users").findOne({ _id: result.insertedId });

    return { status: 201, body: { user: serializeUser(user) } };
  }

  if (request.method === "PATCH" && parts.length === 3) {
    const body = await readJson(request);
    const update = pick(body, ["name", "role", "branchId", "active"]);

    if (update.role) {
      update.role = normalizeRole(update.role);
    }

    if (body.password) {
      update.passwordHash = hashPassword(body.password);
    }

    if (update.role === "owner") {
      update.branchId = null;
    }

    update.updatedAt = new Date();

    const user = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(parts[2]) },
      { $set: update },
      { returnDocument: "after" }
    );

    return found(user, "User not found.", (value) => ({ user: serializeUser(value) }));
  }

  return methodNotAllowed();
}

async function handleProducts(request, parts, context) {
  const db = await getDb();
  const authError = requireUser(context);
  if (authError) return authError;

  if (request.method === "GET" && parts.length === 2) {
    const products = await db.collection("products").find({ active: { $ne: false } }).sort({ name: 1 }).toArray();
    return { status: 200, body: { products: products.map(serializeProduct) } };
  }

  if (request.method === "POST" && parts.length === 2) {
    const body = await readJson(request);
    requireFields(body, ["name", "category"]);
    const branches = await db.collection("branches").find({ active: { $ne: false } }).toArray();
    const branchId = context.user.role === "owner" ? body.branchId : context.user.branchId;
    const stock = Object.fromEntries(branches.map((branch) => [branch.id, 0]));
    const retailPrice = toNumber(body.retailPrice ?? body.price);
    const resellerPrice = toNumber(body.resellerPrice ?? retailPrice);

    if (branchId) {
      stock[branchId] = toNumber(body.startingStock);
    }

    const now = new Date();
    const product = {
      id: makeId("P"),
      sku: body.sku?.trim() || `BB-${Date.now().toString().slice(-5)}`,
      image: body.image?.trim() || body.name.trim().slice(0, 2).toUpperCase(),
      name: body.name.trim(),
      category: body.category.trim(),
      price: retailPrice,
      retailPrice,
      resellerPrice,
      costPrice: toNumber(body.costPrice),
      stock,
      active: true,
      createdAt: now,
      updatedAt: now
    };

    await db.collection("products").insertOne(product);
    return { status: 201, body: { product: serializeProduct(product) } };
  }

  if (request.method === "PATCH" && parts.length === 3) {
    const body = await readJson(request);
    const update = pick(body, ["sku", "image", "name", "category", "price", "retailPrice", "resellerPrice", "costPrice", "active"]);

    if (update.price !== undefined) update.price = toNumber(update.price);
    if (update.retailPrice !== undefined) {
      update.retailPrice = toNumber(update.retailPrice);
      update.price = update.retailPrice;
    }
    if (update.resellerPrice !== undefined) update.resellerPrice = toNumber(update.resellerPrice);
    if (update.costPrice !== undefined) update.costPrice = toNumber(update.costPrice);
    update.updatedAt = new Date();

    const product = await db.collection("products").findOneAndUpdate(
      { id: parts[2] },
      { $set: update },
      { returnDocument: "after" }
    );

    return found(product, "Product not found.", (value) => ({ product: serializeProduct(value) }));
  }

  return methodNotAllowed();
}

async function handleStockMovements(request, context) {
  const db = await getDb();
  const authError = requireUser(context);
  if (authError) return authError;

  if (request.method === "GET") {
    const filter = context.user.role === "owner" ? {} : { branchId: context.user.branchId };
    const movements = await db.collection("stockMovements").find(filter).sort({ createdAt: -1 }).toArray();
    return { status: 200, body: { stockMovements: movements.map(serializeMovement) } };
  }

  if (request.method === "POST") {
    const body = await readJson(request);
    requireFields(body, ["productId", "quantity"]);
    const branchId = context.user.role === "owner" ? body.branchId : context.user.branchId;
    requireFields({ branchId }, ["branchId"]);

    const quantity = toNumber(body.quantity);
    if (quantity < 1) return { status: 400, body: { error: "Quantity must be at least 1." } };

    const product = await db.collection("products").findOneAndUpdate(
      { id: body.productId },
      { $inc: { [`stock.${branchId}`]: quantity }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!product) return { status: 404, body: { error: "Product not found." } };

    const unitCost = toNumber(body.unitCost, toNumber(product.costPrice));
    const purchaseTotal = unitCost * quantity;
    const movement = {
      id: makeId("ST"),
      productId: body.productId,
      productName: product.name,
      branchId,
      quantity,
      unitCost,
      purchaseTotal,
      source: body.source?.trim() || "Stock-in",
      employee: context.user.name,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date()
    };

    await db.collection("stockMovements").insertOne(movement);
    return { status: 201, body: { stockMovement: serializeMovement(movement), product: serializeProduct(product) } };
  }

  return methodNotAllowed();
}

async function handleSales(request, parts, context) {
  const db = await getDb();
  const authError = requireUser(context);
  if (authError) return authError;

  if (request.method === "GET" && parts.length === 2) {
    const filter = context.user.role === "owner" ? {} : { branchId: context.user.branchId };
    const sales = await db.collection("sales").find(filter).sort({ createdAt: -1, date: -1 }).toArray();
    return { status: 200, body: { sales: sales.map(serializeSale) } };
  }

  if (request.method === "POST" && parts.length === 2) {
    const body = await readJson(request);
    requireFields(body, ["lineItems"]);
    const branchId = context.user.role === "owner" ? body.branchId : context.user.branchId;
    requireFields({ branchId }, ["branchId"]);

    const lineItems = Array.isArray(body.lineItems) ? body.lineItems : [];
    if (!lineItems.length) return { status: 400, body: { error: "Sale must include at least one line item." } };

    const client = await getClient();
    const session = client.startSession();
    let sale;

    try {
      await session.withTransaction(async () => {
        const products = db.collection("products");

        for (const item of lineItems) {
          const quantity = toNumber(item.quantity);
          if (quantity < 1) throw Object.assign(new Error("Line item quantity must be at least 1."), { status: 400 });

          const updated = await products.findOneAndUpdate(
            { id: item.productId, [`stock.${branchId}`]: { $gte: quantity } },
            { $inc: { [`stock.${branchId}`]: -quantity }, $set: { updatedAt: new Date() } },
            { returnDocument: "after", session }
          );

          if (!updated) {
            throw Object.assign(new Error(`Not enough stock for product ${item.productId}.`), { status: 400 });
          }
        }

        const amount = lineItems.reduce((total, item) => total + toNumber(item.total, toNumber(item.unitPrice) * toNumber(item.quantity)), 0);
        const items = lineItems.reduce((total, item) => total + toNumber(item.quantity), 0);

        sale = {
          id: body.id || makeId("S"),
          amount,
          branchId,
          channel: body.channel || "In store",
          customer: body.customer || "Walk-in",
          date: body.date || new Date().toISOString().slice(0, 10),
          employee: context.user.name,
          employeeId: context.user._id,
          items,
          lineItems,
          paymentMethod: body.paymentMethod || "Cash",
          productName: lineItems.map((item) => item.productName).join(", "),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.collection("sales").insertOne(sale, { session });
      });
    } finally {
      await session.endSession();
    }

    return { status: 201, body: { sale: serializeSale(sale) } };
  }

  return methodNotAllowed();
}

async function handleRefunds(request, context) {
  const db = await getDb();
  const authError = requireUser(context);
  if (authError) return authError;

  if (request.method === "GET") {
    const filter = context.user.role === "owner" ? {} : { branchId: context.user.branchId };
    const refunds = await db.collection("refunds").find(filter).sort({ createdAt: -1 }).toArray();
    return { status: 200, body: { refunds: refunds.map(serializeRefund) } };
  }

  if (request.method === "POST") {
    const body = await readJson(request);
    requireFields(body, ["saleId"]);

    const sale = await db.collection("sales").findOne({ id: body.saleId });
    if (!sale) return { status: 404, body: { error: "Sale not found." } };
    if (context.user.role !== "owner" && sale.branchId !== context.user.branchId) {
      return { status: 403, body: { error: "Cannot refund another branch sale." } };
    }

    for (const item of sale.lineItems ?? []) {
      await db.collection("products").updateOne(
        { id: item.productId },
        { $inc: { [`stock.${sale.branchId}`]: toNumber(item.quantity) }, $set: { updatedAt: new Date() } }
      );
    }

    const refund = {
      id: makeId("RF"),
      amount: sale.amount,
      branchId: sale.branchId,
      date: new Date().toISOString().slice(0, 10),
      employee: context.user.name,
      employeeId: context.user._id,
      lineItems: sale.lineItems ?? [],
      reason: body.reason || "Customer return",
      saleId: sale.id,
      createdAt: new Date()
    };

    await db.collection("refunds").insertOne(refund);
    return { status: 201, body: { refund: serializeRefund(refund) } };
  }

  return methodNotAllowed();
}

async function getReportSummary(url, context) {
  const db = await getDb();
  const authError = requireUser(context);
  if (authError) return authError;

  const requestedBranchId = url.searchParams.get("branchId") ?? "all";
  const branchId = context.user.role === "owner" ? requestedBranchId : context.user.branchId;
  const branches = await db.collection("branches").find({ active: { $ne: false } }).sort({ name: 1 }).toArray();
  const products = await db.collection("products").find({ active: { $ne: false } }).sort({ name: 1 }).toArray();
  const saleFilter = branchId === "all" ? {} : { branchId };
  const sales = await db.collection("sales").find(saleFilter).sort({ createdAt: -1, date: -1 }).toArray();
  const refunds = await db.collection("refunds").find(saleFilter).sort({ createdAt: -1 }).toArray();
  const stockMovements = await db.collection("stockMovements").find(saleFilter).sort({ createdAt: -1 }).toArray();
  const branchIds = branchId === "all" ? branches.map((branch) => branch.id) : [branchId];
  const totalSales = sales.reduce((total, sale) => total + toNumber(sale.amount), 0);
  const totalItems = sales.reduce((total, sale) => total + toNumber(sale.items), 0);
  const totalPurchases = stockMovements.reduce((total, movement) => {
    const fallbackTotal = toNumber(movement.unitCost) * toNumber(movement.quantity);
    return total + toNumber(movement.purchaseTotal, fallbackTotal);
  }, 0);
  const totalStock = products.reduce(
    (total, product) => total + branchIds.reduce((sum, id) => sum + toNumber(product.stock?.[id]), 0),
    0
  );
  const salesByBranch = branches.map((branch) => {
    const branchRows = sales.filter((sale) => sale.branchId === branch.id);
    return {
      ...serializeBranch(branch),
      total: branchRows.reduce((total, sale) => total + toNumber(sale.amount), 0),
      transactions: branchRows.length
    };
  });

  return {
    status: 200,
    body: {
      summary: {
        branchId,
        branchName: branchId === "all" ? "All Branches" : branches.find((branch) => branch.id === branchId)?.name,
        inventory: products.map(serializeProduct),
        recentSales: sales.map(serializeSale),
        refunds: refunds.map(serializeRefund),
        stockMovements: stockMovements.map(serializeMovement),
        salesByBranch,
        totalItems,
        totalPurchases,
        totalRevenue: totalSales,
        totalSales,
        totalStock,
        grossProfit: totalSales - totalPurchases
      }
    }
  };
}

function normalizeRole(role) {
  if (["owner", "admin"].includes(role)) return "owner";
  if (["manager", "employee"].includes(role)) return role;
  return "employee";
}

function serializeBranch(branch) {
  return {
    id: branch.id,
    name: branch.name,
    location: branch.location,
    manager: branch.manager ?? "",
    active: branch.active !== false,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt
  };
}

function serializeProduct(product) {
  const retailPrice = product.retailPrice ?? product.price ?? 0;

  return {
    id: product.id,
    sku: product.sku,
    image: product.image,
    name: product.name,
    category: product.category,
    price: retailPrice,
    retailPrice,
    resellerPrice: product.resellerPrice ?? retailPrice,
    costPrice: product.costPrice ?? 0,
    stock: product.stock ?? {},
    active: product.active !== false
  };
}

function serializeSale(sale) {
  return {
    id: sale.id,
    amount: sale.amount,
    branchId: sale.branchId,
    channel: sale.channel,
    customer: sale.customer,
    date: sale.date,
    employee: sale.employee,
    items: sale.items,
    lineItems: sale.lineItems ?? [],
    paymentMethod: sale.paymentMethod,
    productName: sale.productName,
    createdAt: sale.createdAt
  };
}

function serializeRefund(refund) {
  return {
    id: refund.id,
    amount: refund.amount,
    branchId: refund.branchId,
    date: refund.date,
    employee: refund.employee,
    lineItems: refund.lineItems ?? [],
    reason: refund.reason,
    saleId: refund.saleId,
    createdAt: refund.createdAt
  };
}

function serializeMovement(movement) {
  return {
    id: movement.id,
    productId: movement.productId,
    productName: movement.productName,
    branchId: movement.branchId,
    date: movement.date,
    employee: movement.employee,
    quantity: movement.quantity,
    unitCost: movement.unitCost ?? 0,
    purchaseTotal: movement.purchaseTotal ?? 0,
    source: movement.source,
    createdAt: movement.createdAt
  };
}

function pick(source, fields) {
  return fields.reduce((result, field) => {
    if (source[field] !== undefined) {
      result[field] = source[field];
    }
    return result;
  }, {});
}

function found(value, message, mapper) {
  if (!value) {
    return { status: 404, body: { error: message } };
  }

  return { status: 200, body: mapper(value) };
}

function methodNotAllowed() {
  return {
    status: 405,
    body: { error: "Method not allowed." }
  };
}
