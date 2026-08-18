import React, { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { SearchableItemSelect } from "./SearchableItemSelect.jsx";

export function InventoryPage({
  branches,
  session,
  stockHistory,
  summary,
  onAddProduct,
  onAddStock,
  onDeleteProduct,
  onDeleteStockMovement,
  onTransferStock,
  onUpdateStockMovement,
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
  const [stockSource, setStockSource] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingProductId, setEditingProductId] = useState("");
  const [editingMovementId, setEditingMovementId] = useState("");
  const [editForm, setEditForm] = useState({
    category: "",
    costPrice: "",
    image: "",
    name: "",
    resellerPrice: "",
    retailPrice: "",
    sku: ""
  });
  const [movementEditForm, setMovementEditForm] = useState({
    branchId: "",
    productId: "",
    quantity: "",
    source: ""
  });
  const [productForm, setProductForm] = useState({
    branchId: session.role === "admin" ? branches[0]?.id : session.branchId,
    category: "Dresses",
    name: "",
    resellerPrice: "",
    retailPrice: ""
  });
  const [bulkStockItems, setBulkStockItems] = useState([]);
  const [bulkStockForm, setBulkStockForm] = useState({
    source: ""
  });
  const [selectedProductForBulk, setSelectedProductForBulk] = useState("");
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

  const pageCount = Math.max(1, Math.ceil(filteredInventory.length / itemsPerPage));
  const pagedInventory = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, itemsPerPage, summary.inventory.length]);

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
    transferToBranchId,
    branches
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

    if (session.role === "admin") {
      const items = branches
        .map((branch) => ({
          branchId: branch.id,
          productId: movementProductId,
          quantity: branch.id === movementBranchId ? stockQuantity : "",
          source: stockSource
        }))
        .filter((item) => item.quantity !== "" && Number(item.quantity) > 0);

      if (items.length === 0) {
        setMessage("Enter a quantity for at least one branch before saving stock-in.");
        return;
      }

      onAddStock({ items });
      setStockQuantity("");
      setStockSource("");
      setMessage("Stock-in record saved for all selected branches.");
      return;
    }

    onAddStock({
      branchId: session.branchId,
      productId: movementProductId,
      quantity: stockQuantity,
      source: stockSource
    });
    setStockQuantity("");
    setStockSource("");
    setMessage("Stock-in record saved.");
  }

  function handleAddItemToBulk(event) {
    event.preventDefault();

    if (!selectedProductForBulk) {
      setMessage("Select an item to add.");
      return;
    }

    const product = summary.inventory.find((p) => p.id === selectedProductForBulk);
    const newItem = {
      id: Date.now(),
      productId: selectedProductForBulk,
      productName: product?.name ?? "",
      totalQuantity: "",
      quantityByBranch: Object.fromEntries((branches || []).map((branch) => [branch.id, ""]))
    };

    setBulkStockItems([...bulkStockItems, newItem]);
    setSelectedProductForBulk("");
  }

  function handleRemoveItemFromBulk(itemId) {
    setBulkStockItems(bulkStockItems.filter((item) => item.id !== itemId));
  }

  function handleUpdateBulkItemTotal(itemId, value) {
    setBulkStockItems(
      bulkStockItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        if (value === "") {
          return {
            ...item,
            totalQuantity: "",
            quantityByBranch: Object.fromEntries((branches || []).map((branch) => [branch.id, ""]))
          };
        }

        const total = Math.max(0, Number(value) || 0);
        const branchCount = branches.length || 1;
        const base = Math.floor(total / branchCount);
        let remainder = total % branchCount;

        const quantityByBranch = {};
        branches.forEach((branch) => {
          const extra = remainder > 0 ? 1 : 0;
          quantityByBranch[branch.id] = String(base + extra);
          remainder -= extra;
        });

        return {
          ...item,
          totalQuantity: String(total),
          quantityByBranch
        };
      })
    );
  }

  function handleUpdateBulkItemQuantity(itemId, branchId, value) {
    setBulkStockItems(
      bulkStockItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantityByBranch: {
                ...item.quantityByBranch,
                [branchId]: value
              },
              totalQuantity: String(
                branches.reduce((total, branch) => total + Number(branch.id === branchId ? value : item.quantityByBranch?.[branch.id] ?? 0), 0)
              )
            }
          : item
      )
    );
  }

  function handleBulkStockIn(event) {
    event.preventDefault();

    if (bulkStockItems.length === 0) {
      setMessage("Add at least one item before saving bulk stock-in.");
      return;
    }

    const items = [];
          bulkStockItems.forEach((item) => {
      branches.forEach((branch) => {
        const quantity = item.quantityByBranch?.[branch.id];
        if (quantity !== "" && Number(quantity) > 0) {
          items.push({
            branchId: branch.id,
            productId: item.productId,
            quantity: quantity,
            source: bulkStockForm.source
          });
        }
      });
    });

    if (items.length === 0) {
      setMessage("Enter at least one quantity for a branch before saving bulk stock-in.");
      return;
    }

    onAddStock({ items });

    setBulkStockItems([]);
    setBulkStockForm({
      source: ""
    });
    setSelectedProductForBulk("");
    setMessage("Bulk stock-in saved.");
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

  function startEditingMovement(record) {
    setEditingMovementId(record.id);
    setMovementEditForm({
      branchId: record.branchId ?? "",
      productId: record.productId ?? "",
      quantity: String(record.quantity ?? ""),
      source: record.source ?? ""
    });
    setMessage("");
  }

  async function handleUpdateStockMovement(event) {
    event.preventDefault();

    if (!movementEditForm.productId) {
      setMessage("Choose an item for this stock-in record.");
      return;
    }

    if (Number(movementEditForm.quantity) < 1) {
      setMessage("Quantity must be at least 1.");
      return;
    }

    try {
      await onUpdateStockMovement?.(editingMovementId, {
        ...movementEditForm,
        branchId: session.role === "admin" ? movementEditForm.branchId : session.branchId
      });
      setEditingMovementId("");
      setMessage("Stock-in record updated.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDeleteMovement(record) {
    const confirmed = window.confirm(`Delete stock-in record for ${record.productName}?`);

    if (!confirmed) {
      return;
    }

    try {
      await onDeleteStockMovement?.(record.id);
      if (editingMovementId === record.id) {
        setEditingMovementId("");
      }
      setMessage("Stock-in record deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="page-grid two-column inventory-page">
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
          <SearchableItemSelect
            label="Item"
            value={movementProductId}
            onChange={setMovementProductId}
            items={movementProducts}
            placeholder="Search items..."
          />
          {session.role === "admin" ? (
            <div className="branch-stock-grid" style={{ marginBottom: 16 }}>
              {branches.map((branch) => (
                <label className="field" key={branch.id}>
                  <span>{branch.name}</span>
                  <input
                    min="0"
                    placeholder="0"
                    type="number"
                    value={branch.id === movementBranchId ? stockQuantity : ""}
                    onChange={(event) => {
                      setMovementBranchId(branch.id);
                      setStockQuantity(event.target.value);
                    }}
                  />
                </label>
              ))}
            </div>
          ) : (
            <label className="field">
              <span>Branch</span>
              <input value={branches.find((branch) => branch.id === session.branchId)?.name ?? session.branchId} disabled />
            </label>
          )}
          <label className="field">
            <span>Quantity</span>
            <input min="1" placeholder="0" type="number" value={stockQuantity} onChange={(event) => setStockQuantity(event.target.value)} />
          </label>
          <label className="field">
            <span>Supplier / Source</span>
            <input placeholder="Supplier, transfer, delivery" value={stockSource} onChange={(event) => setStockSource(event.target.value)} />
          </label>
          <button className="primary-button" type="submit">Save stock-in</button>
        </form>
        {message && <p className="success-message">{message}</p>}
      </section>

      <section className="panel wide-panel">
        <div className="panel-heading">
          <h3>Bulk Stock-In</h3>
          <p>Add multiple items with quantities for each branch, then stock-in all at once</p>
        </div>
        <form className="stock-form" onSubmit={handleBulkStockIn}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <SearchableItemSelect
                  label="Add Item"
                  value={selectedProductForBulk}
                  onChange={setSelectedProductForBulk}
                  items={summary.inventory}
                  placeholder="Search items..."
                />
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={handleAddItemToBulk}
                style={{ alignSelf: "flex-end", height: 40 }}
              >
                Add Item
              </button>
            </div>
          </div>

          {bulkStockItems.length > 0 && (
            <div className="bulk-stock-table-container" style={{ marginBottom: 16 }}>
              <table className="bulk-stock-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 200 }}>Item</th>
                    <th style={{ width: 96 }}>Total</th>
                    {branches.map((branch) => (
                      <th key={branch.id} style={{ textAlign: "center", width: 80 }}>
                        {branch.name}
                      </th>
                    ))}
                    <th style={{ width: 60 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkStockItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.productName}</td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          min="0"
                          placeholder="0"
                          type="number"
                          value={item.totalQuantity}
                          onChange={(event) => handleUpdateBulkItemTotal(item.id, event.target.value)}
                          style={{
                            width: "100%",
                            padding: 6,
                            border: "1px solid #ddd",
                            borderRadius: 4,
                            textAlign: "center"
                          }}
                        />
                      </td>
                      {branches.map((branch) => (
                        <td key={branch.id} style={{ textAlign: "center" }}>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={item.quantityByBranch?.[branch.id] ?? ""}
                            onChange={(event) => handleUpdateBulkItemQuantity(item.id, branch.id, event.target.value)}
                            style={{
                              width: "100%",
                              padding: 6,
                              border: "1px solid #ddd",
                              borderRadius: 4,
                              textAlign: "center"
                            }}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="danger-button"
                          type="button"
                          onClick={() => handleRemoveItemFromBulk(item.id)}
                          style={{ padding: 6 }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="field">
              <span>Supplier / Source</span>
              <input
                value={bulkStockForm.source}
                onChange={(event) => setBulkStockForm({ ...bulkStockForm, source: event.target.value })}
              />
            </label>
          </div>
          <button className="primary-button" type="submit" disabled={bulkStockItems.length === 0}>
            Stock-In All Items
          </button>
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
          <SearchableItemSelect
            label="Item"
            value={transferProductId}
            onChange={setTransferProductId}
            items={transferProducts}
            placeholder="Search items..."
          />
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
        <div className="inventory-pagination">
          <span className="inventory-pagination-meta">
            Showing {pagedInventory.length} of {filteredInventory.length} item{filteredInventory.length === 1 ? "" : "s"}
          </span>
          <div className="pagination-controls">
            <label className="field compact-field">
              <span>Items per page</span>
              <select value={itemsPerPage} onChange={(event) => setItemsPerPage(Number(event.target.value))}>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </label>
            <div className="pagination-buttons">
              <button className="secondary-button" type="button" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                Previous
              </button>
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  className={page === currentPage ? "pagination-button active" : "pagination-button"}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button className="secondary-button" type="button" onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))} disabled={currentPage === pageCount}>
                Next
              </button>
            </div>
          </div>
        </div>
        <div className="product-list">
          {pagedInventory.map((product) => {
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
              {editingMovementId === record.id ? (
                <form className="stock-movement-edit-form" onSubmit={handleUpdateStockMovement}>
                  <SearchableItemSelect
                    label="Item"
                    value={movementEditForm.productId}
                    onChange={(productId) => setMovementEditForm({ ...movementEditForm, productId })}
                    items={summary.inventory}
                    placeholder="Search items..."
                  />
                  <label className="field">
                    <span>Branch</span>
                    <select
                      value={session.role === "admin" ? movementEditForm.branchId : session.branchId}
                      onChange={(event) => setMovementEditForm({ ...movementEditForm, branchId: event.target.value })}
                      disabled={session.role !== "admin"}
                    >
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Quantity</span>
                    <input
                      min="1"
                      type="number"
                      value={movementEditForm.quantity}
                      onChange={(event) => setMovementEditForm({ ...movementEditForm, quantity: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Supplier / Source</span>
                    <input
                      value={movementEditForm.source}
                      onChange={(event) => setMovementEditForm({ ...movementEditForm, source: event.target.value })}
                    />
                  </label>
                  <div className="product-actions">
                    <button className="primary-button" type="submit">Save</button>
                    <button className="secondary-button" onClick={() => setEditingMovementId("")} type="button">Cancel</button>
                  </div>
                </form>
              ) : (
                <>
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
                  <div className="product-actions">
                    {record.type !== "transfer" && (
                      <button className="secondary-button" type="button" onClick={() => startEditingMovement(record)}>Edit</button>
                    )}
                    <button className="danger-button" type="button" onClick={() => handleDeleteMovement(record)}>Delete</button>
                  </div>
                </>
              )}
            </article>
          ))}
          {stockHistory.length === 0 && <p className="empty-state">No stock-in history yet.</p>}
        </div>
      </section>
    </div>
  );
}
