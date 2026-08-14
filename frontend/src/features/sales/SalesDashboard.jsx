import React, { useState } from "react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";

export function SalesDashboard({ lastReceipt, selectedBranchId, session, summary, onRecordSale, onDeleteSale }) {
  const [productId, setProductId] = useState(summary.inventory[0]?.id ?? "");
  const [quickQuantity, setQuickQuantity] = useState(1);
  const [priceType, setPriceType] = useState("retail");
  const [quickSearch, setQuickSearch] = useState("");
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
  const [saleType, setSaleType] = useState("");
  const [overridePrice, setOverridePrice] = useState("");
  const [channel, setChannel] = useState("In store");
  const [paymentMethod, setPaymentMethod] = useState(["Cash"]);
  const [lineItems, setLineItems] = useState([]);
  const [cartSearch, setCartSearch] = useState("");
  const [message, setMessage] = useState("");
  const [showSaleModal, setShowSaleModal] = useState(false);

  function openSaleModal() {
    setShowSaleModal(true);
    setMessage("");
  }

  function closeSaleModal() {
    setShowSaleModal(false);
  }
  const suggestedProducts = quickSearch.trim() === "" ? [] : summary.inventory
    .filter((p) => p.name.toLowerCase().includes(quickSearch.toLowerCase()))
    .slice(0, 8);

  const selectedProduct = summary.inventory.find((product) => product.id === productId);
  const selectedUnitPrice = selectedProduct ? getUnitPrice(selectedProduct, priceType) : 0;
  const activeUnitPrice = saleType ? Number(overridePrice || selectedUnitPrice) : selectedUnitPrice;
  const saleTotal = lineItems.reduce((total, item) => total + item.total, 0);
  const itemCount = lineItems.reduce((total, item) => total + item.quantity, 0);
  const employeeBranchId = session.role === "admin" ? selectedBranchId : session.branchId;
  const employeeBranchName = summary.branchName ?? session.branchName;
  const visibleLineItems = lineItems.filter((item) => {
    if (!cartSearch.trim()) {
      return true;
    }

    return item.productName.toLowerCase().includes(cartSearch.toLowerCase());
  });
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
    setQuickQuantity(1);
    setMessage("");
  }

  function selectQuickSuggestion(product) {
    setProductId(product.id);
    setQuickSearch(product.name);
    setShowQuickSuggestions(false);
    setHighlightedSuggestionIndex(-1);
  }

  function addItemToSale() {
    addProductToSale(selectedProduct, Number(quickQuantity));
  }

  function removeLineItem(indexToRemove) {
    setLineItems((currentItems) => currentItems.filter((_, index) => index !== indexToRemove));
  }

  function clearCart() {
    setLineItems([]);
    setQuickQuantity(1);
    setPriceType("retail");
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
    setQuickQuantity(1);
    setPriceType("retail");
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
          <button className="primary-button pos-action" type="button" onClick={openSaleModal}>+ New Sale</button>
        </div>
      </section>

      {showSaleModal && (
        <div className="modal-backdrop" onClick={closeSaleModal}>
          <div className="sale-modal panel" onClick={(event) => event.stopPropagation()}>
            <div className="pos-hero modal-hero">
              <div>
                <p className="eyebrow">Point of Sale (POS)</p>
                <h2>Add Sale</h2>
              </div>
              <button className="secondary-button" type="button" onClick={closeSaleModal}>Close</button>
            </div>
            <div className="pos-shell">
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
                    <input
                      placeholder="Search item to add"
                      value={quickSearch}
                      onChange={(event) => {
                        setQuickSearch(event.target.value);
                        setShowQuickSuggestions(true);
                        setHighlightedSuggestionIndex(0);
                      }}
                      onFocus={() => {
                        setShowQuickSuggestions(true);
                        setHighlightedSuggestionIndex(0);
                      }}
                      onBlur={() => setTimeout(() => setShowQuickSuggestions(false), 150)}
                      onKeyDown={(event) => {
                        if (!showQuickSuggestions || suggestedProducts.length === 0) {
                          return;
                        }

                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          setHighlightedSuggestionIndex((index) => Math.min(index + 1, suggestedProducts.length - 1));
                        }

                        if (event.key === "ArrowUp") {
                          event.preventDefault();
                          setHighlightedSuggestionIndex((index) => Math.max(index - 1, 0));
                        }

                        if (event.key === "Enter") {
                          event.preventDefault();
                          const selectedIndex = highlightedSuggestionIndex >= 0 ? highlightedSuggestionIndex : 0;
                          const selected = suggestedProducts[selectedIndex];
                          if (selected) {
                            selectQuickSuggestion(selected);
                          }
                        }

                        if (event.key === "Escape") {
                          setShowQuickSuggestions(false);
                        }
                      }}
                    />
                    {showQuickSuggestions && suggestedProducts.length > 0 && (
                      <div className="suggestions-list">
                        {suggestedProducts.map((p, index) => (
                          <button
                            key={p.id}
                            type="button"
                            className={`suggestion-item${index === highlightedSuggestionIndex ? " active" : ""}`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectQuickSuggestion(p)}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </label>
                  <div className="quick-add-grid">
                    <label className="field">
                      <span>Quantity</span>
                      <input min="1" type="number" value={quickQuantity} onChange={(event) => setQuickQuantity(event.target.value)} />
                    </label>
                    <div className="quick-price">
                      <span>Price</span>
                      <strong>{selectedProduct ? formatCurrency(activeUnitPrice) : ""}</strong>
                    </div>
                  </div>
                  <label className="field">
                    <span>Price type</span>
                    <select value={priceType} onChange={(event) => setPriceType(event.target.value)}>
                      <option value="retail">Retail price</option>
                      <option value="reseller">Reseller price</option>
                    </select>
                  </label>
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
                    <div className="multi-select-chips">
                      {[
                        "Cash",
                        "GCash",
                        "Card",
                        "Bank Transfer",
                        "Online Payment",
                      ].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`chip ${Array.isArray(paymentMethod) && paymentMethod.includes(opt) ? "selected" : ""}`}
                          onClick={() => {
                            setPaymentMethod((prev) => {
                              const arr = Array.isArray(prev) ? prev.slice() : [];
                              if (arr.includes(opt)) return arr.filter((p) => p !== opt);
                              return [...arr, opt];
                            });
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {Array.isArray(paymentMethod) && paymentMethod.length > 0 && (
                      <div className="selected-text">
                        <small>Selected: {paymentMethod.join(" + ")}</small>
                      </div>
                    )}
                    {Array.isArray(paymentMethod) && paymentMethod.includes("Cash") && paymentMethod.includes("GCash") && (
                      <p className="info-note">Note: Split payment selected (Cash + GCash). Confirm split amounts if applicable.</p>
                    )}
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
          </div>
        </div>
      )}

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
              <span>Payment: <strong>{Array.isArray(lastReceipt.paymentMethod) ? lastReceipt.paymentMethod.join(", ") : lastReceipt.paymentMethod ?? "Cash"}</strong></span>
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
                <th>Actions</th>
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
                  <td>{Array.isArray(sale.paymentMethod) ? sale.paymentMethod.join(", ") : sale.paymentMethod ?? "Cash"}</td>
                  <td>{sale.items}</td>
                  <td>{formatCurrency(sale.amount)}</td>
                  <td>
                    {onDeleteSale && (session.role === "admin" || sale.branchId === session.branchId) && (
                      <button
                        className="icon-chip danger"
                        onClick={() => {
                          if (!confirm(`Delete sale ${sale.id}? This will restore sold stock to the branch.`)) return;
                          onDeleteSale(sale.id);
                        }}
                        type="button"
                      >
                        Delete
                      </button>
                    )}
                  </td>
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
