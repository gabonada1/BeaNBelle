import React, { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";

export function SalesDashboard({ lastReceipt, session, summary, onRecordSale }) {
  const [productId, setProductId] = useState(summary.inventory[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [priceType, setPriceType] = useState("retail");
  const [channel, setChannel] = useState("In store");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [lineItems, setLineItems] = useState([]);
  const [message, setMessage] = useState("");
  const selectedProduct = summary.inventory.find((product) => product.id === productId);
  const selectedUnitPrice = selectedProduct
    ? priceType === "reseller"
      ? selectedProduct.resellerPrice ?? selectedProduct.price
      : selectedProduct.retailPrice ?? selectedProduct.price
    : 0;
  const saleTotal = lineItems.reduce((total, item) => total + item.total, 0);
  const itemCount = lineItems.reduce((total, item) => total + item.quantity, 0);
  const maxBranchTotal = Math.max(...summary.salesByBranch.map((branch) => branch.total), 1);
  const employeeBranchName = session.branchName;
  const employeeSales = useMemo(
    () => summary.recentSales.filter((sale) => sale.employee === session.userName),
    [session.userName, summary.recentSales]
  );

  function addItemToSale() {
    const soldQuantity = Number(quantity);

    if (!selectedProduct || soldQuantity < 1) {
      setMessage("Choose an item and enter a valid quantity.");
      return;
    }

    const availableStock = selectedProduct.stock[session.branchId] ?? 0;
    const alreadyAdded = lineItems
      .filter((item) => item.productId === selectedProduct.id)
      .reduce((total, item) => total + item.quantity, 0);

    if (soldQuantity + alreadyAdded > availableStock) {
      setMessage(`Only ${availableStock} ${selectedProduct.name} available in ${employeeBranchName}.`);
      return;
    }

    setLineItems((currentItems) => [
      ...currentItems,
      {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        priceType,
        quantity: soldQuantity,
        unitPrice: selectedUnitPrice,
        total: selectedUnitPrice * soldQuantity
      }
    ]);
    setQuantity(1);
    setMessage("");
  }

  function removeLineItem(indexToRemove) {
    setLineItems((currentItems) => currentItems.filter((_, index) => index !== indexToRemove));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (lineItems.length === 0) {
      setMessage("Add at least one sold item before recording the sale.");
      return;
    }

    onRecordSale({
      id: `S-${Date.now().toString().slice(-6)}`,
      amount: saleTotal,
      branchId: session.branchId,
      channel,
      customer: "Walk-in",
      date: new Date().toISOString().slice(0, 10),
      employee: session.userName,
      items: itemCount,
      lineItems,
      paymentMethod,
      productName: lineItems.map((item) => item.productName).join(", ")
    });

    setLineItems([]);
    setQuantity(1);
    setMessage(`Sale recorded for ${employeeBranchName}.`);
  }

  return (
    <div className="page-grid">
      <section className="metric-row">
        <article className="metric-card">
          <span>Total sales</span>
          <strong>{formatCurrency(summary.totalSales)}</strong>
        </article>
        <article className="metric-card">
          <span>Items sold</span>
          <strong>{summary.totalItems}</strong>
        </article>
        <article className="metric-card">
          <span>Your recorded sales</span>
          <strong>{employeeSales.length}</strong>
        </article>
      </section>

      <section className="panel sale-entry-panel">
        <div className="panel-heading">
          <div>
            <h3>Record Sale</h3>
            <p>Add items to the POS cart, choose payment, then checkout</p>
          </div>
          <span className="total-preview">{formatCurrency(saleTotal)}</span>
        </div>

        <div className="pos-grid">
          <form className="sold-item-form" onSubmit={(event) => event.preventDefault()}>
            <label className="field">
              <span>Item</span>
              <select value={productId} onChange={(event) => setProductId(event.target.value)}>
                {summary.inventory.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Price</span>
              <input readOnly value={selectedProduct ? formatCurrency(selectedUnitPrice) : ""} />
            </label>
            <label className="field">
              <span>Price type</span>
              <select value={priceType} onChange={(event) => setPriceType(event.target.value)}>
                <option value="retail">Retail</option>
                <option value="reseller">Reseller</option>
              </select>
            </label>
            <label className="field">
              <span>Quantity</span>
              <input
                min="1"
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </label>
            <button className="secondary-button" onClick={addItemToSale} type="button">
              Add item
            </button>
          </form>

          <div className="receipt-list">
            <div className="receipt-list-heading">
              <span>Items</span>
              <span>Price</span>
              <span>Type</span>
              <span>Qty</span>
              <span>Total</span>
              <span></span>
            </div>
            {lineItems.map((item, index) => (
              <div className="receipt-line" key={`${item.productId}-${index}`}>
                <strong>{item.productName}</strong>
                <span>{formatCurrency(item.unitPrice)}</span>
                <span>{item.priceType === "reseller" ? "Reseller" : "Retail"}</span>
                <span>{item.quantity}</span>
                <span>{formatCurrency(item.total)}</span>
                <button className="text-button" onClick={() => removeLineItem(index)} type="button">
                  Remove
                </button>
              </div>
            ))}
            {lineItems.length === 0 && (
              <p className="empty-state">No items added yet.</p>
            )}
          </div>

          <form className="checkout-row" onSubmit={handleSubmit}>
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
            <div className="checkout-total">
              <span>{itemCount} items</span>
              <strong>{formatCurrency(saleTotal)}</strong>
            </div>
            <button className="primary-button" type="submit">
              Record sale
            </button>
          </form>
        </div>
        {message && <p className="success-message">{message}</p>}
      </section>

      {lastReceipt && (
        <section className="panel receipt-preview-panel">
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
                <span>Qty</span>
                <span>Total</span>
                <span></span>
              </div>
              {(lastReceipt.lineItems ?? []).map((item) => (
                <div className="receipt-line" key={item.productId}>
                  <strong>{item.productName}</strong>
                  <span>{formatCurrency(item.unitPrice)}</span>
                  <span>{item.priceType === "reseller" ? "Reseller" : "Retail"}</span>
                  <span>{item.quantity}</span>
                  <span>{formatCurrency(item.total)}</span>
                  <span></span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-heading">
          <h3>Branch Sales Total</h3>
          <p>{summary.branchName}</p>
        </div>
        <div className="branch-bars">
          {summary.salesByBranch.map((branch) => (
            <div className="bar-row" key={branch.id}>
              <span>{branch.name}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(branch.total / maxBranchTotal) * 100}%` }} />
              </div>
              <strong>{formatCurrency(branch.total)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
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
                  <td>{sale.paymentMethod ?? "Cash"}</td>
                  <td>{sale.items}</td>
                  <td>{formatCurrency(sale.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
