import React, { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";

export function SalesDashboard({ lastReceipt, selectedBranchId, session, summary, onRecordSale }) {
  const [productId, setProductId] = useState(summary.inventory[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [priceType, setPriceType] = useState("retail");
  const [saleType, setSaleType] = useState("");
  const [overridePrice, setOverridePrice] = useState("");
  const [channel, setChannel] = useState("In store");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [lineItems, setLineItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Show All");
  const [cartSearch, setCartSearch] = useState("");
  const [message, setMessage] = useState("");
  const selectedProduct = summary.inventory.find((product) => product.id === productId);
  const selectedUnitPrice = selectedProduct ? getUnitPrice(selectedProduct, priceType) : 0;
  const activeUnitPrice = saleType ? Number(overridePrice || selectedUnitPrice) : selectedUnitPrice;
  const saleTotal = lineItems.reduce((total, item) => total + item.total, 0);
  const itemCount = lineItems.reduce((total, item) => total + item.quantity, 0);
  const employeeBranchId = session.role === "admin" ? selectedBranchId : session.branchId;
  const employeeBranchName = summary.branchName ?? session.branchName;
  const categories = ["Show All", ...new Set(summary.inventory.map((product) => product.category).filter(Boolean))];
  const filteredProducts = summary.inventory.filter((product) => {
    const haystack = `${product.name} ${product.category ?? ""} ${product.sku ?? ""}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Show All" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });
  const visibleLineItems = lineItems.filter((item) => {
    if (!cartSearch.trim()) {
      return true;
    }

    return item.productName.toLowerCase().includes(cartSearch.toLowerCase());
  });
  const employeeSales = useMemo(
    () => summary.recentSales.filter((sale) => sale.employee === session.userName),
    [session.userName, summary.recentSales]
  );

  function getUnitPrice(product, type = priceType) {
    return type === "reseller"
      ? product.resellerPrice ?? product.price
      : product.retailPrice ?? product.price;
  }

  function addProductToSale(product, quantityToAdd = 1) {
    if (!product || quantityToAdd < 1) {
      setMessage("Choose an item and enter a valid quantity.");
      return;
    }

    if (session.role === "admin" && employeeBranchId === "all") {
      setMessage("Select a specific branch before adding items.");
      return;
    }

    const unitPrice = saleType ? Number(overridePrice || getUnitPrice(product)) : getUnitPrice(product);

    if (saleType && (!Number.isFinite(unitPrice) || unitPrice <= 0)) {
      setMessage("Enter a valid price for the selected tag.");
      return;
    }

    const availableStock = product.stock[employeeBranchId] ?? 0;
    const alreadyAdded = lineItems
      .filter((item) => item.productId === product.id)
      .reduce((total, item) => total + item.quantity, 0);

    if (quantityToAdd + alreadyAdded > availableStock) {
      setMessage(`Only ${availableStock} ${product.name} available in ${employeeBranchName}.`);
      return;
    }

    setLineItems((currentItems) => [
      ...currentItems,
      {
        productId: product.id,
        productName: product.name,
        priceType,
        saleType: saleType || undefined,
        quantity: quantityToAdd,
        unitPrice,
        total: unitPrice * quantityToAdd
      }
    ]);
    setQuantity(1);
    setMessage("");
  }

  function addItemToSale() {
    addProductToSale(selectedProduct, Number(quantity));
  }

  function removeLineItem(indexToRemove) {
    setLineItems((currentItems) => currentItems.filter((_, index) => index !== indexToRemove));
  }

  function clearCart() {
    setLineItems([]);
    setQuantity(1);
    setMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (lineItems.length === 0) {
      setMessage("Add at least one sold item before recording the sale.");
      return;
    }

    if (session.role === "admin" && employeeBranchId === "all") {
      setMessage("Select a specific branch before recording the sale.");
      return;
    }

    onRecordSale({
      id: `S-${Date.now().toString().slice(-6)}`,
      amount: saleTotal,
      branchId: employeeBranchId,
      channel,
      customer: "Walk-in",
      date: new Date().toISOString().slice(0, 10),
      employee: session.userName,
      items: itemCount,
      saleType: saleType || undefined,
      lineItems,
      paymentMethod,
      productName: lineItems.map((item) => item.productName).join(", ")
    });

    setLineItems([]);
    setQuantity(1);
    setSaleType("");
    setOverridePrice("");
    setMessage(`Sale recorded for ${employeeBranchName}.`);
  }

  return (
    <div className="page-grid pos-page">
      <section className="pos-hero panel">
        <div>
          <p className="eyebrow">Point of Sale (POS)</p>
          <h2>Dashboard • POS</h2>
        </div>
        <div className="pos-hero-actions">
          <button className="primary-button pos-action" type="button">+ New</button>
        </div>
      </section>

      <div className="pos-shell">
        <section className="panel pos-catalog">
          <div className="pos-toolbar">
            <label className="field search-field">
              <span>Search in products</span>
              <input placeholder="Search by name, SKU, or category" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
            </label>
            <label className="field compact-field pos-select">
              <span>All Category</span>
              <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="field compact-field pos-select">
              <span>Select price type</span>
              <select value={priceType} onChange={(event) => setPriceType(event.target.value)}>
                <option value="retail">Retail</option>
                <option value="reseller">Reseller</option>
              </select>
            </label>
          </div>

          <div className="category-row" aria-label="Product categories">
            {categories.map((category) => (
              <button
                className={selectedCategory === category ? "category-chip active" : "category-chip"}
                key={category}
                onClick={() => setSelectedCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>

          <div className="catalog-grid">
            {filteredProducts.map((product) => {
              const unitPrice = getUnitPrice(product);

              return (
                <article className="product-card" key={product.id}>
                  <div className="product-thumb">{getProductBadge(product.name)}</div>
                  <div className="product-card-body">
                    <strong>{product.name}</strong>
                    <span>{product.category} {product.sku ? `• ${product.sku}` : ""}</span>
                    <p>{formatCurrency(unitPrice)}</p>
                  </div>
                  <button className="add-pill" onClick={() => addProductToSale(product, 1)} type="button">
                    +
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="panel pos-order">
          <label className="field">
            <span>Search in existing</span>
            <input placeholder="Search current cart" value={cartSearch} onChange={(event) => setCartSearch(event.target.value)} />
          </label>

          <div className="order-heading">
            <div>
              <p className="eyebrow">Order #20</p>
              <h3>Current order</h3>
            </div>
            <button className="ghost-button" onClick={clearCart} type="button">Clear</button>
          </div>

          <div className="quick-add-card">
            <label className="field">
              <span>Quick add item</span>
              <select value={productId} onChange={(event) => setProductId(event.target.value)}>
                {summary.inventory.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
            <div className="quick-add-grid">
              <label className="field">
                <span>Quantity</span>
                <input min="1" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </label>
              <div className="quick-price">
                <span>Price</span>
                <strong>{selectedProduct ? formatCurrency(activeUnitPrice) : ""}</strong>
              </div>
            </div>
            <label className="field">
              <span>Transaction tag</span>
              <select value={saleType} onChange={(event) => setSaleType(event.target.value)}>
                <option value="">None</option>
                <option value="Sale">Sale</option>
                <option value="Raffle">Raffle</option>
              </select>
            </label>
            {saleType && (
              <label className="field">
                <span>Override price</span>
                <input
                  min="0"
                  step="0.01"
                  type="number"
                  value={overridePrice}
                  onChange={(event) => setOverridePrice(event.target.value)}
                  placeholder={String(selectedUnitPrice)}
                />
              </label>
            )}
            <button className="secondary-button full-width" onClick={addItemToSale} type="button">
              Add item
            </button>
          </div>

          <div className="cart-list">
            {visibleLineItems.map((item, index) => (
              <article className="cart-item" key={`${item.productId}-${index}`}>
                <div>
                  <strong>{item.productName}</strong>
                  <span>{formatCurrency(item.unitPrice)} x {item.quantity} = {formatCurrency(item.total)}</span>
                </div>
                <button className="icon-chip danger" onClick={() => removeLineItem(index)} type="button">×</button>
              </article>
            ))}
            {visibleLineItems.length === 0 && <p className="empty-state">No items added yet.</p>}
          </div>

          <form className="checkout-card" onSubmit={handleSubmit}>
            <label className="field">
              <span>Sales channel</span>
              <select value={channel} onChange={(event) => setChannel(event.target.value)}>
                <option>In store</option>
                <option>E-commerce</option>
                <option>Pickup</option>
              </select>
            </label>
            <label className="field">
              <span>Payment method</span>
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <option>Cash</option>
                <option>GCash</option>
                <option>Card</option>
                <option>Bank Transfer</option>
                <option>Online Payment</option>
              </select>
            </label>
            <div className="totals-stack">
              <div>
                <span>Sub total</span>
                <strong>{formatCurrency(saleTotal)}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatCurrency(saleTotal)}</strong>
              </div>
            </div>
            <button className="primary-button full-width" type="submit">
              Bill & Payment
            </button>
            <button className="secondary-button full-width" type="button" onClick={clearCart}>
              Draft
            </button>
          </form>

          {message && <p className="success-message">{message}</p>}
        </aside>
      </div>

      {lastReceipt && (
        <section className="panel receipt-preview-panel pos-receipt">
          <div className="panel-heading">
            <div>
              <h3>Receipt Preview</h3>
              <p>{lastReceipt.id} - {formatDate(lastReceipt.date)}</p>
            </div>
            <span className="total-preview">{formatCurrency(lastReceipt.amount)}</span>
          </div>
          <div className="receipt-preview">
            <div className="receipt-meta">
              <span>Branch: <strong>{employeeBranchName}</strong></span>
              <span>Employee: <strong>{lastReceipt.employee}</strong></span>
              <span>Payment: <strong>{lastReceipt.paymentMethod ?? "Cash"}</strong></span>
            </div>
            <div className="receipt-list compact">
              <div className="receipt-list-heading">
                <span>Items</span>
                <span>Price</span>
                <span>Type</span>
                <span>Tag</span>
                <span>Qty</span>
                <span>Total</span>
                <span></span>
              </div>
              {(lastReceipt.lineItems ?? []).map((item) => (
                <div className="receipt-line" key={item.productId}>
                  <strong>{item.productName}</strong>
                  <span>{formatCurrency(item.unitPrice)}</span>
                  <span>{item.priceType === "reseller" ? "Reseller" : "Retail"}</span>
                  <span>{item.saleType ?? lastReceipt.saleType ?? "-"}</span>
                  <span>{item.quantity}</span>
                  <span>{formatCurrency(item.total)}</span>
                  <span></span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="panel wide-panel">
        <div className="panel-heading">
          <h3>Recent Sold Items</h3>
          <p>Latest employee records</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Employee</th>
                <th>Channel</th>
                <th>Tag</th>
                <th>Payment</th>
                <th>Qty</th>
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.id}</td>
                  <td>{formatDate(sale.date)}</td>
                  <td>{sale.productName ?? sale.customer}</td>
                  <td>{sale.employee ?? "Branch Staff"}</td>
                  <td>{sale.channel}</td>
                    <td>{sale.saleType ?? "-"}</td>
                  <td>{sale.paymentMethod ?? "Cash"}</td>
                  <td>{sale.items}</td>
                  <td>{formatCurrency(sale.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel wide-panel">
        <div className="panel-heading">
          <h3>Branch Sales Total</h3>
          <p>{summary.branchName}</p>
        </div>
        <div className="branch-bars">
          {summary.salesByBranch.map((branch) => (
            <div className="bar-row" key={branch.id}>
              <span>{branch.name}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(branch.total / Math.max(...summary.salesByBranch.map((entry) => entry.total), 1)) * 100}%` }} />
              </div>
              <strong>{formatCurrency(branch.total)}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function getProductBadge(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
