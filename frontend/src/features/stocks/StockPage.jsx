import React, { useState } from "react";
import { formatCurrency } from "../../utils/formatters.js";

export function StockPage({ branches, session, summary, onRecordSale }) {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [quantities, setQuantities] = useState({});
  const [priceTypes, setPriceTypes] = useState({});
  const [message, setMessage] = useState("");
  const categories = ["All", ...new Set(summary.inventory.map((product) => product.category))];
  const employeeBranch = branches.find((branch) => branch.id === session.branchId);
  const filteredStocks = summary.inventory.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  function handleSearch(event) {
    event.preventDefault();
    setSearchTerm(searchInput.trim());
  }

  function handleSold(product) {
    const quantity = Number(quantities[product.id] || 0);
    const currentStock = product.stock[session.branchId] ?? 0;

    if (quantity < 1) {
      setMessage("Enter the sold quantity before recording.");
      return;
    }

    if (quantity > currentStock) {
      setMessage(`Only ${currentStock} stocks available in ${employeeBranch?.name}.`);
      return;
    }

    const priceType = priceTypes[product.id] ?? "retail";
    const unitPrice = priceType === "reseller"
      ? product.resellerPrice ?? product.price
      : product.retailPrice ?? product.price;

    onRecordSale({
      id: `S-${Date.now().toString().slice(-6)}`,
      amount: unitPrice * quantity,
      branchId: session.branchId,
      channel: "In store",
      customer: "Walk-in",
      date: new Date().toISOString().slice(0, 10),
      employee: session.userName,
      items: quantity,
      lineItems: [{
        productId: product.id,
        productName: product.name,
        priceType,
        quantity,
        unitPrice,
        total: unitPrice * quantity
      }],
      paymentMethod: "Cash",
      productId: product.id,
      productName: product.name
    });
    setQuantities((current) => ({ ...current, [product.id]: "" }));
    setMessage(`${quantity} ${product.name} marked as sold from ${employeeBranch?.name} at ${priceType} price.`);
  }

  return (
    <div className="page-grid">
      <section className="metric-row">
        <article className="metric-card">
          <span>Total visible stocks</span>
          <strong>{summary.totalStock}</strong>
        </article>
        <article className="metric-card">
          <span>Revenue</span>
          <strong>{formatCurrency(summary.totalRevenue ?? summary.totalSales)}</strong>
        </article>
        <article className="metric-card">
          <span>Stock purchases</span>
          <strong>{formatCurrency(summary.totalPurchases ?? 0)}</strong>
        </article>
        <article className="metric-card">
          <span>Employee branch</span>
          <strong>{employeeBranch?.name}</strong>
        </article>
        <article className="metric-card">
          <span>Products listed</span>
          <strong>{summary.inventory.length}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Stocks</h3>
            <p>View all stocks and record sold items from your assigned branch</p>
          </div>
          <span className="total-preview">Selling from {employeeBranch?.name}</span>
        </div>

        <form className="inventory-toolbar" onSubmit={handleSearch}>
          <label className="search-field">
            <span className="sr-only">Search stocks</span>
            <input
              placeholder="Search stock item"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>
          <button className="primary-button search-button" type="submit">
            Search
          </button>
        </form>

        <div className="category-buttons" aria-label="Stock categories">
          {categories.map((category) => (
            <button
              className={selectedCategory === category ? "category-button active" : "category-button"}
              key={category}
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        {message && <p className="success-message">{message}</p>}

        <div className="stock-table-list">
          {filteredStocks.map((product) => {
            const employeeStock = product.stock[session.branchId] ?? 0;
            const totalStock = Object.values(product.stock).reduce((total, count) => total + count, 0);

            return (
              <article className="stock-card" key={product.id}>
                <div className="stock-card-main">
                  <div>
                    <strong>{product.name}</strong>
                    <span>
                      {product.category} - Retail {formatCurrency(product.retailPrice ?? product.price)} - Reseller {formatCurrency(product.resellerPrice ?? product.price)}
                    </span>
                  </div>
                  <span className={employeeStock < 8 ? "stock-pill warning" : "stock-pill"}>
                    {employeeStock} in your branch
                  </span>
                </div>

                <div className="branch-stock-grid">
                  {branches.map((branch) => (
                    <span key={branch.id}>
                      {branch.name}: <strong>{product.stock[branch.id]}</strong>
                    </span>
                  ))}
                  <span>
                    Total: <strong>{totalStock}</strong>
                  </span>
                </div>

                <div className="sale-stock-row">
                  <label className="field">
                    <span>Sold quantity</span>
                    <input
                      min="1"
                      max={employeeStock}
                      placeholder="0"
                      type="number"
                      value={quantities[product.id] ?? ""}
                      onChange={(event) =>
                        setQuantities((current) => ({ ...current, [product.id]: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Price type</span>
                    <select
                      value={priceTypes[product.id] ?? "retail"}
                      onChange={(event) =>
                        setPriceTypes((current) => ({ ...current, [product.id]: event.target.value }))
                      }
                    >
                      <option value="retail">Retail</option>
                      <option value="reseller">Reseller</option>
                    </select>
                  </label>
                  <button className="primary-button" onClick={() => handleSold(product)} type="button">
                    Record sold
                  </button>
                </div>
              </article>
            );
          })}
          {filteredStocks.length === 0 && (
            <p className="empty-state">No stock items match this search and category.</p>
          )}
        </div>
      </section>
    </div>
  );
}
