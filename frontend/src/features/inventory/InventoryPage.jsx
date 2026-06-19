import React, { useState } from "react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";

export function InventoryPage({ branches, session, stockHistory, summary, onAddProduct, onAddStock }) {
  const [movementCategory, setMovementCategory] = useState(summary.inventory[0]?.category ?? "");
  const [movementProductId, setMovementProductId] = useState(summary.inventory[0]?.id ?? "");
  const [movementBranchId, setMovementBranchId] = useState(session.role === "admin" ? branches[0]?.id : session.branchId);
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockUnitCost, setStockUnitCost] = useState("");
  const [stockSource, setStockSource] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [productForm, setProductForm] = useState({
    branchId: session.role === "admin" ? branches[0]?.id : session.branchId,
    category: "Dresses",
    costPrice: "",
    name: "",
    resellerPrice: "",
    retailPrice: "",
    sku: "",
    startingStock: ""
  });
  const [message, setMessage] = useState("");
  const categories = ["All", ...new Set(summary.inventory.map((product) => product.category))];
  const movementCategories = [...new Set(summary.inventory.map((product) => product.category))];
  const movementProducts = summary.inventory.filter((product) => product.category === movementCategory);
  const filteredInventory = summary.inventory.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  function handleSearch(event) {
    event.preventDefault();
    setSearchTerm(searchInput.trim());
  }

  function handleMovementCategoryChange(category) {
    const firstProduct = summary.inventory.find((product) => product.category === category);

    setMovementCategory(category);
    setMovementProductId(firstProduct?.id ?? "");
  }

  function handleStockIn(event) {
    event.preventDefault();
    const branchId = session.role === "admin" ? movementBranchId : session.branchId;

    onAddStock({
      branchId,
      productId: movementProductId,
      quantity: stockQuantity,
      unitCost: stockUnitCost,
      source: stockSource
    });
    setStockQuantity("");
    setStockUnitCost("");
    setStockSource("");
    setMessage("Stock-in record saved.");
  }

  function handleAddProduct(event) {
    event.preventDefault();

    if (!productForm.name.trim()) {
      setMessage("Enter a product name.");
      return;
    }

    onAddProduct({
      ...productForm,
      branchId: session.role === "admin" ? productForm.branchId : session.branchId
    });
    setProductForm((current) => ({
      ...current,
      costPrice: "",
      name: "",
      resellerPrice: "",
      retailPrice: "",
      sku: "",
      startingStock: ""
    }));
    setMessage("New product added.");
  }

  return (
    <div className="page-grid two-column">
      <section className="panel">
        <div className="panel-heading">
          <h3>Stock-In</h3>
          <p>Add new stocks and save movement history</p>
        </div>
        <form className="stock-form" onSubmit={handleStockIn}>
          <label className="field">
            <span>Category</span>
            <select value={movementCategory} onChange={(event) => handleMovementCategoryChange(event.target.value)}>
              {movementCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Item</span>
            <select value={movementProductId} onChange={(event) => setMovementProductId(event.target.value)}>
              {movementProducts.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Branch</span>
            <select
              value={session.role === "admin" ? movementBranchId : session.branchId}
              onChange={(event) => setMovementBranchId(event.target.value)}
              disabled={session.role !== "admin"}
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Quantity</span>
            <input min="1" placeholder="0" type="number" value={stockQuantity} onChange={(event) => setStockQuantity(event.target.value)} />
          </label>
          <label className="field">
            <span>Purchase cost each</span>
            <input min="0" placeholder="0" type="number" value={stockUnitCost} onChange={(event) => setStockUnitCost(event.target.value)} />
          </label>
          <label className="field">
            <span>Supplier / Source</span>
            <input placeholder="Supplier, transfer, delivery" value={stockSource} onChange={(event) => setStockSource(event.target.value)} />
          </label>
          <button className="primary-button" type="submit">Save stock-in</button>
        </form>
        {message && <p className="success-message">{message}</p>}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Product Management</h3>
          <p>Add products with retail, reseller, purchase cost, and starting stock</p>
        </div>
        <form className="product-form" onSubmit={handleAddProduct}>
          <label className="field">
            <span>Product name</span>
            <input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} />
          </label>
          <label className="field">
            <span>Category</span>
            <input value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} />
          </label>
          <label className="field">
            <span>Retail price</span>
            <input min="0" type="number" value={productForm.retailPrice} onChange={(event) => setProductForm({ ...productForm, retailPrice: event.target.value })} />
          </label>
          <label className="field">
            <span>Reseller price</span>
            <input min="0" type="number" value={productForm.resellerPrice} onChange={(event) => setProductForm({ ...productForm, resellerPrice: event.target.value })} />
          </label>
          <label className="field">
            <span>Purchase cost</span>
            <input min="0" type="number" value={productForm.costPrice} onChange={(event) => setProductForm({ ...productForm, costPrice: event.target.value })} />
          </label>
          <label className="field">
            <span>SKU / Barcode</span>
            <input value={productForm.sku} onChange={(event) => setProductForm({ ...productForm, sku: event.target.value })} />
          </label>
          <label className="field">
            <span>Starting stock</span>
            <input min="0" type="number" value={productForm.startingStock} onChange={(event) => setProductForm({ ...productForm, startingStock: event.target.value })} />
          </label>
          <label className="field">
            <span>Starting branch</span>
            <select
              value={session.role === "admin" ? productForm.branchId : session.branchId}
              onChange={(event) => setProductForm({ ...productForm, branchId: event.target.value })}
              disabled={session.role !== "admin"}
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="submit">Add product</button>
        </form>
      </section>

      <section className="panel wide-panel">
        <div className="panel-heading">
          <h3>Inventory List</h3>
          <p>{summary.branchName}</p>
        </div>
        <form className="inventory-toolbar" onSubmit={handleSearch}>
          <label className="search-field">
            <span className="sr-only">Search inventory</span>
            <input placeholder="Search product name" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
          </label>
          <button className="primary-button search-button" type="submit">Search</button>
        </form>
        <div className="category-buttons" aria-label="Inventory categories">
          {categories.map((category) => (
            <button className={selectedCategory === category ? "category-button active" : "category-button"} key={category} onClick={() => setSelectedCategory(category)} type="button">
              {category}
            </button>
          ))}
        </div>
        <div className="product-list">
          {filteredInventory.map((product) => {
            const stockCount = summary.branchId === "all"
              ? Object.values(product.stock).reduce((total, count) => total + count, 0)
              : product.stock[summary.branchId];

            return (
              <article className="product-row" key={product.id}>
                <div className="product-identity">
                  <span className="product-thumb">{product.image}</span>
                  <div>
                    <strong>{product.name}</strong>
                    <span>
                      {product.category} - {product.sku} - Retail {formatCurrency(product.retailPrice ?? product.price)} - Reseller {formatCurrency(product.resellerPrice ?? product.price)}
                    </span>
                  </div>
                </div>
                <span className={stockCount <= 5 ? "stock-pill warning" : "stock-pill"}>{stockCount} in stock</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel wide-panel">
        <div className="panel-heading">
          <h3>Stock-In History</h3>
          <p>Latest additions and sources</p>
        </div>
        <div className="history-list">
          {stockHistory.map((record) => (
            <article className="history-row" key={record.id}>
              <strong>{record.productName}</strong>
              <span>
                {formatDate(record.date)} - {record.quantity} added - {record.source}
                {record.purchaseTotal ? ` - Purchase ${formatCurrency(record.purchaseTotal)}` : ""}
              </span>
              <span>{branches.find((branch) => branch.id === record.branchId)?.name} - {record.employee}</span>
            </article>
          ))}
          {stockHistory.length === 0 && <p className="empty-state">No stock-in history yet.</p>}
        </div>
      </section>
    </div>
  );
}
