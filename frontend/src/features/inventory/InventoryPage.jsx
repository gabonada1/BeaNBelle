import React, { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";

export function InventoryPage({
  branches,
  session,
  stockHistory,
  summary,
  onAddProduct,
  onAddStock,
  onDeleteProduct,
  onTransferStock,
  onUpdateProduct
}) {
  const [movementCategory, setMovementCategory] = useState(summary.inventory[0]?.category ?? "");
  const [movementProductId, setMovementProductId] = useState(summary.inventory[0]?.id ?? "");
  const [movementBranchId, setMovementBranchId] = useState(session.role === "admin" ? branches[0]?.id : session.branchId);
  const [transferCategory, setTransferCategory] = useState(summary.inventory[0]?.category ?? "");
  const [transferProductId, setTransferProductId] = useState(summary.inventory[0]?.id ?? "");
  const [transferFromBranchId, setTransferFromBranchId] = useState(session.role === "admin" ? branches[0]?.id : session.branchId);
  const [transferToBranchId, setTransferToBranchId] = useState(branches.find((branch) => branch.id !== (session.role === "admin" ? branches[0]?.id : session.branchId))?.id ?? "");
  const [transferQuantity, setTransferQuantity] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockUnitCost, setStockUnitCost] = useState("");
  const [stockSource, setStockSource] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editingProductId, setEditingProductId] = useState("");
  const [editForm, setEditForm] = useState({
    category: "",
    costPrice: "",
    image: "",
    name: "",
    resellerPrice: "",
    retailPrice: "",
    sku: ""
  });
  const [productForm, setProductForm] = useState({
    branchId: session.role === "admin" ? branches[0]?.id : session.branchId,
    category: "Dresses",
    name: "",
    resellerPrice: "",
    retailPrice: ""
  });
  const [message, setMessage] = useState("");
  const [transferMessage, setTransferMessage] = useState("");
  const categories = ["All", ...new Set(summary.inventory.map((product) => product.category))];
  const movementCategories = [...new Set(summary.inventory.map((product) => product.category))];
  const movementProducts = summary.inventory.filter((product) => product.category === movementCategory);
  const transferProducts = summary.inventory.filter((product) => product.category === transferCategory);
  const transferDestinationBranches = branches.filter((branch) => branch.id !== (session.role === "admin" ? transferFromBranchId : session.branchId));
  const filteredInventory = summary.inventory.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    const firstCategory = summary.inventory[0]?.category ?? "";
    const firstProduct = summary.inventory.find((product) => product.category === transferCategory) ?? summary.inventory[0];
    const currentFromBranchId = session.role === "admin" ? transferFromBranchId : session.branchId;

    if (!movementCategory && firstCategory) {
      setMovementCategory(firstCategory);
    }

    if (!movementProductId && summary.inventory[0]?.id) {
      setMovementProductId(summary.inventory[0].id);
    }

    if (!movementBranchId && branches[0]?.id) {
      setMovementBranchId(session.role === "admin" ? branches[0].id : session.branchId);
    }

    if (!transferCategory && firstCategory) {
      setTransferCategory(firstCategory);
    }

    if (!transferProductId && firstProduct?.id) {
      setTransferProductId(firstProduct.id);
    }

    if (!transferFromBranchId && branches[0]?.id) {
      setTransferFromBranchId(session.role === "admin" ? branches[0].id : session.branchId);
    }

    if (!transferToBranchId || transferToBranchId === currentFromBranchId) {
      setTransferToBranchId(branches.find((branch) => branch.id !== currentFromBranchId)?.id ?? "");
    }
  }, [
    branches,
    movementBranchId,
    movementCategory,
    movementProductId,
    session.branchId,
    session.role,
    summary.inventory,
    transferCategory,
    transferFromBranchId,
    transferProductId,
    transferToBranchId
  ]);

  function handleSearch(event) {
    event.preventDefault();
    setSearchTerm(searchInput.trim());
  }

  function handleMovementCategoryChange(category) {
    const firstProduct = summary.inventory.find((product) => product.category === category);

    setMovementCategory(category);
    setMovementProductId(firstProduct?.id ?? "");
  }

  function handleTransferCategoryChange(category) {
    const firstProduct = summary.inventory.find((product) => product.category === category);

    setTransferCategory(category);
    setTransferProductId(firstProduct?.id ?? "");
  }

  function handleTransferFromBranchChange(branchId) {
    setTransferFromBranchId(branchId);

    if (transferToBranchId === branchId) {
      setTransferToBranchId(branches.find((branch) => branch.id !== branchId)?.id ?? "");
    }
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

  async function handleTransfer(event) {
    event.preventDefault();
    const fromBranchId = session.role === "admin" ? transferFromBranchId : session.branchId;

    if (!transferToBranchId || fromBranchId === transferToBranchId) {
      setTransferMessage("Choose another branch to receive the stock.");
      return;
    }

    try {
      await onTransferStock({
        fromBranchId,
        productId: transferProductId,
        quantity: transferQuantity,
        toBranchId: transferToBranchId,
        note: transferNote
      });
      setTransferQuantity("");
      setTransferNote("");
      setTransferMessage("Stock transfer saved.");
    } catch (error) {
      setTransferMessage(error.message);
    }
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
      name: "",
      resellerPrice: "",
      retailPrice: ""
    }));
    setMessage("New product added.");
  }

  function startEditingProduct(product) {
    setEditingProductId(product.id);
    setEditForm({
      category: product.category ?? "",
      costPrice: String(product.costPrice ?? ""),
      image: product.image ?? "",
      name: product.name ?? "",
      resellerPrice: String(product.resellerPrice ?? product.price ?? ""),
      retailPrice: String(product.retailPrice ?? product.price ?? ""),
      sku: product.sku ?? ""
    });
    setMessage("");
  }

  async function handleUpdateProduct(event) {
    event.preventDefault();

    if (!editForm.name.trim()) {
      setMessage("Enter a product name.");
      return;
    }

    try {
      await onUpdateProduct(editingProductId, editForm);
      setEditingProductId("");
      setMessage("Product updated.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDeleteProduct(product) {
    const confirmed = window.confirm(`Delete ${product.name} from the product list?`);

    if (!confirmed) {
      return;
    }

    try {
      await onDeleteProduct(product.id);
      if (editingProductId === product.id) {
        setEditingProductId("");
      }
      setMessage("Product deleted.");
    } catch (error) {
      setMessage(error.message);
    }
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
          <p>Add products with retail and reseller prices</p>
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
          <h3>Branch Transfer</h3>
          <p>Move available products from one branch to another</p>
        </div>
        <form className="stock-form" onSubmit={handleTransfer}>
          <label className="field">
            <span>Category</span>
            <select value={transferCategory} onChange={(event) => handleTransferCategoryChange(event.target.value)}>
              {movementCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Item</span>
            <select value={transferProductId} onChange={(event) => setTransferProductId(event.target.value)}>
              {transferProducts.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>From branch</span>
            <select
              value={session.role === "admin" ? transferFromBranchId : session.branchId}
              onChange={(event) => handleTransferFromBranchChange(event.target.value)}
              disabled={session.role !== "admin"}
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>To branch</span>
            <select value={transferToBranchId} onChange={(event) => setTransferToBranchId(event.target.value)}>
              {transferDestinationBranches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Quantity</span>
            <input min="1" placeholder="0" type="number" value={transferQuantity} onChange={(event) => setTransferQuantity(event.target.value)} />
          </label>
          <label className="field">
            <span>Note</span>
            <input placeholder="Delivery rider, request, batch" value={transferNote} onChange={(event) => setTransferNote(event.target.value)} />
          </label>
          <button className="primary-button" type="submit">Transfer stock</button>
        </form>
        {transferMessage && <p className="success-message">{transferMessage}</p>}
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
                {editingProductId === product.id ? (
                  <form className="product-edit-form" onSubmit={handleUpdateProduct}>
                    <label className="field">
                      <span>Product name</span>
                      <input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>Category</span>
                      <input value={editForm.category} onChange={(event) => setEditForm({ ...editForm, category: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>Retail price</span>
                      <input min="0" type="number" value={editForm.retailPrice} onChange={(event) => setEditForm({ ...editForm, retailPrice: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>Reseller price</span>
                      <input min="0" type="number" value={editForm.resellerPrice} onChange={(event) => setEditForm({ ...editForm, resellerPrice: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>Purchase cost</span>
                      <input min="0" type="number" value={editForm.costPrice} onChange={(event) => setEditForm({ ...editForm, costPrice: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>SKU / Barcode</span>
                      <input value={editForm.sku} onChange={(event) => setEditForm({ ...editForm, sku: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>Image initials</span>
                      <input value={editForm.image} onChange={(event) => setEditForm({ ...editForm, image: event.target.value })} />
                    </label>
                    <div className="product-actions">
                      <button className="primary-button" type="submit">Save</button>
                      <button className="secondary-button" onClick={() => setEditingProductId("")} type="button">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="product-identity">
                      <span className="product-thumb">{product.image}</span>
                      <div>
                        <strong>{product.name}</strong>
                        <span>
                          {product.category} - {product.sku} - Retail {formatCurrency(product.retailPrice ?? product.price)} - Reseller {formatCurrency(product.resellerPrice ?? product.price)}
                        </span>
                      </div>
                    </div>
                    <div className="product-actions">
                      <span className={stockCount <= 5 ? "stock-pill warning" : "stock-pill"}>{stockCount} in stock</span>
                      <button className="secondary-button" onClick={() => startEditingProduct(product)} type="button">Edit</button>
                      <button className="danger-button" onClick={() => handleDeleteProduct(product)} type="button">Delete</button>
                    </div>
                  </>
                )}
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
                {formatDate(record.date)} - {record.quantity} {record.type === "transfer" ? "transferred" : "added"} - {record.source}
                {record.purchaseTotal ? ` - Purchase ${formatCurrency(record.purchaseTotal)}` : ""}
              </span>
              <span>
                {record.type === "transfer"
                  ? `${branches.find((branch) => branch.id === record.fromBranchId)?.name ?? record.fromBranchId} to ${branches.find((branch) => branch.id === record.toBranchId)?.name ?? record.toBranchId}`
                  : branches.find((branch) => branch.id === record.branchId)?.name} - {record.employee}
              </span>
            </article>
          ))}
          {stockHistory.length === 0 && <p className="empty-state">No stock-in history yet.</p>}
        </div>
      </section>
    </div>
  );
}
