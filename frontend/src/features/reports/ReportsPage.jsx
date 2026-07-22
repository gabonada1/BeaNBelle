import React, { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";

export function ReportsPage({ refundRecords, session, stockHistory, summary }) {
  const today = new Date().toISOString().slice(0, 10);
  const [reportPeriod, setReportPeriod] = useState("daily");
  const [reportDate, setReportDate] = useState(today);
  const todaysSales = summary.recentSales.filter((sale) => sale.date === today);
  const todaysTotal = todaysSales.reduce((total, sale) => total + sale.amount, 0);
  const totalRevenue = summary.totalRevenue ?? summary.totalSales;
  const totalPurchases = summary.totalPurchases ?? stockHistory.reduce((total, record) => total + (record.purchaseTotal ?? 0), 0);
  const totalExpenses = summary.totalExpenses ?? 0;
  const netProfit = summary.netProfit ?? totalRevenue - totalPurchases - totalExpenses;
  const employeeSales = summary.recentSales.filter((sale) => sale.employee === session.userName);
  const productTotals = summary.recentSales.reduce((result, sale) => {
    (sale.lineItems ?? []).forEach((item) => {
      result[item.productName] = (result[item.productName] ?? 0) + item.quantity;
    });
    return result;
  }, {});
  const bestSeller = Object.entries(productTotals).sort((a, b) => b[1] - a[1])[0];
  const maxBranchTotal = Math.max(...summary.salesByBranch.map((branch) => branch.total), 1);
  const lowStocks = summary.inventory.filter((product) => {
    const count = summary.branchId === "all"
      ? Object.values(product.stock).reduce((total, value) => total + value, 0)
      : product.stock[summary.branchId];

    return count <= 5;
  });
  const chartProducts = Object.entries(productTotals).slice(0, 5);
  const maxProductQty = Math.max(...chartProducts.map(([, qty]) => qty), 1);
  const reportRange = useMemo(() => getReportRange(reportPeriod, reportDate), [reportDate, reportPeriod]);
  const filteredSales = summary.recentSales.filter((sale) => isWithinRange(sale.date, reportRange));
  const filteredStockMovements = stockHistory.filter((record) => isWithinRange(record.date, reportRange));
  const filteredPurchases = filteredStockMovements.filter((record) => record.type !== "transfer");
  const filteredTransfers = filteredStockMovements.filter((record) => record.type === "transfer");
  const filteredRefunds = refundRecords.filter((refund) => isWithinRange(refund.date, reportRange));
  const filteredExpenses = (summary.expenses ?? summary.recentExpenses ?? []).filter((expense) => isWithinRange(expense.date, reportRange));
  const inventoryRows = summary.inventory.map((product) => {
    const stockCount = summary.branchId === "all"
      ? Object.values(product.stock ?? {}).reduce((total, value) => total + Number(value ?? 0), 0)
      : Number(product.stock?.[summary.branchId] ?? 0);
    const retailPrice = Number(product.retailPrice ?? product.price ?? 0);

    return {
      ...product,
      retailPrice,
      stockCount,
      stockValue: stockCount * retailPrice
    };
  });
  const detailedSalesItems = filteredSales.flatMap((sale) => {
    const lineItems = sale.lineItems?.length
      ? sale.lineItems
      : [{
          productName: sale.productName ?? sale.customer ?? "Walk-in sale",
          priceType: "retail",
          quantity: sale.items ?? 0,
          unitPrice: sale.items ? (sale.amount ?? 0) / sale.items : sale.amount ?? 0,
          total: sale.amount ?? 0
        }];

    return lineItems.map((item, index) => ({
      id: `${sale.id}-${item.productId ?? index}`,
      date: sale.date,
      saleId: sale.id,
      employee: sale.employee ?? "Branch Staff",
      paymentMethod: sale.paymentMethod ?? "Cash",
      priceType: item.priceType === "reseller" ? "Reseller" : "Retail",
      saleType: item.saleType ?? sale.saleType ?? null,
      productName: item.productName,
      quantity: Number(item.quantity ?? 0),
      total: Number(item.total ?? 0),
      unitPrice: Number(item.unitPrice ?? 0)
    }));
  });
  const filteredSalesTotal = filteredSales.reduce((total, sale) => total + (sale.amount ?? 0), 0);
  const filteredRefundTotal = filteredRefunds.reduce((total, refund) => total + (refund.amount ?? 0), 0);
  const filteredPurchaseTotal = filteredPurchases.reduce((total, record) => total + (record.purchaseTotal ?? 0), 0);
  const filteredExpenseTotal = filteredExpenses.reduce((total, expense) => total + (expense.amount ?? 0), 0);
  const filteredItemCount = filteredSales.reduce((total, sale) => total + (sale.items ?? 0), 0);
  const refundedItemCount = filteredRefunds.reduce((total, refund) => (
    total + (refund.lineItems ?? []).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)
  ), 0);
  const purchaseQuantityTotal = filteredPurchases.reduce((total, record) => total + Number(record.quantity ?? 0), 0);
  const stockMovementQuantityTotal = filteredStockMovements.reduce((total, record) => total + Number(record.quantity ?? 0), 0);
  const inventoryStockTotal = inventoryRows.reduce((total, product) => total + product.stockCount, 0);
  const inventoryValueTotal = inventoryRows.reduce((total, product) => total + product.stockValue, 0);
  const reportTitle = `${capitalize(reportPeriod)} report`;
  const reportDateRange = reportRange.start === reportRange.end
    ? formatDate(reportRange.start)
    : `${formatDate(reportRange.start)} to ${formatDate(reportRange.end)}`;

  function handlePrint() {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(createReportDocument({
      detailedSalesItems,
      filteredItemCount,
      filteredExpenseTotal,
      filteredExpenses,
      filteredPurchaseTotal,
      filteredPurchases,
      filteredRefunds,
      filteredRefundTotal,
      filteredSales,
      filteredSalesTotal,
      filteredStockMovements,
      filteredTransfers,
      inventoryRows,
      inventoryStockTotal,
      inventoryValueTotal,
      purchaseQuantityTotal,
      reportDateRange,
      reportTitle,
      refundedItemCount,
      session,
      stockMovementQuantityTotal,
      summary
    }));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div className="page-grid report-screen">
      <section className="metric-row">
        <article className="metric-card accent">
          <span>Today sales</span>
          <strong>{formatCurrency(todaysTotal)}</strong>
        </article>
        <article className="metric-card">
          <span>Revenue</span>
          <strong>{formatCurrency(totalRevenue)}</strong>
        </article>
        <article className="metric-card">
          <span>Stock purchases</span>
          <strong>{formatCurrency(totalPurchases)}</strong>
        </article>
        <article className="metric-card">
          <span>Expenses</span>
          <strong>{formatCurrency(totalExpenses)}</strong>
        </article>
        <article className="metric-card">
          <span>Revenue after expenses</span>
          <strong>{formatCurrency(netProfit)}</strong>
        </article>
        <article className="metric-card">
          <span>Transactions today</span>
          <strong>{todaysSales.length}</strong>
        </article>
        <article className="metric-card">
          <span>Best-selling item</span>
          <strong>{bestSeller?.[0] ?? "No sales yet"}</strong>
        </article>
        <article className="metric-card">
          <span>Your sales count</span>
          <strong>{employeeSales.length}</strong>
        </article>
      </section>

      <section className="panel printable-report">
        <div className="panel-heading report-controls-heading">
          <div>
            <h3>Printable Transaction Reports</h3>
            <p>Generate a clean POS-style report with item quantities, prices, and totals</p>
          </div>
          <button className="primary-button no-print" onClick={handlePrint} type="button">
            Print detailed report
          </button>
        </div>

        <div className="report-toolbar no-print">
          <label className="field">
            <span>Report period</span>
            <select value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
          <label className="field">
            <span>Report date</span>
            <input type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} />
          </label>
        </div>

        <div className="print-header">
          <p className="eyebrow">Bea n Belle</p>
          <h3>{reportTitle}</h3>
          <p>{summary.branchName} - {reportDateRange}</p>
        </div>

        <div className="report-grid compact-report-grid">
          <article className="report-card">
            <span>Sales total</span>
            <strong>{formatCurrency(filteredSalesTotal)}</strong>
            <p>{filteredSales.length} sales transactions</p>
          </article>
          <article className="report-card">
            <span>Refund total</span>
            <strong>{formatCurrency(filteredRefundTotal)}</strong>
            <p>{filteredRefunds.length} refund records</p>
          </article>
          <article className="report-card">
            <span>Stock purchases</span>
            <strong>{formatCurrency(filteredPurchaseTotal)}</strong>
            <p>{filteredPurchases.length} stock-in records</p>
          </article>
          <article className="report-card">
            <span>Expenses</span>
            <strong>{formatCurrency(filteredExpenseTotal)}</strong>
            <p>{filteredExpenses.length} expense records</p>
          </article>
          <article className="report-card">
            <span>Items sold</span>
            <strong>{filteredItemCount}</strong>
            <p>Selected {reportPeriod} period</p>
          </article>
          <article className="report-card">
            <span>Inventory stock</span>
            <strong>{inventoryStockTotal}</strong>
            <p>{formatCurrency(inventoryValueTotal)} retail value</p>
          </article>
        </div>

        <div className="report-section">
          <div className="panel-heading compact-heading">
            <h3>Detailed Sales Items</h3>
            <p>{detailedSalesItems.length} item rows</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sale ID</th>
                  <th>Item</th>
                  <th>Price type</th>
                  <th>Tag</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total price</th>
                  <th>Employee</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {detailedSalesItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button className="text-button date-link" onClick={() => { setReportPeriod("daily"); setReportDate(item.date); }} type="button">
                        {formatDate(item.date)}
                      </button>
                    </td>
                    <td>{item.saleId}</td>
                    <td>{item.productName}</td>
                    <td>{item.priceType}</td>
                    <td>{item.saleType ?? "-"}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.total)}</td>
                    <td>{item.employee}</td>
                    <td>{item.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
              {detailedSalesItems.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="6">Sales item totals</td>
                    <td>{filteredItemCount}</td>
                    <td>{formatCurrency(filteredSalesTotal)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
            {detailedSalesItems.length === 0 && <p className="empty-state">No sales items for this period.</p>}
          </div>
        </div>

        <div className="report-section">
          <div className="panel-heading compact-heading">
            <h3>Detailed Refunds</h3>
            <p>{filteredRefunds.length} records</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sale ID</th>
                  <th>Items</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Employee</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {filteredRefunds.map((refund) => (
                  <tr key={refund.id}>
                    <td>{formatDate(refund.date)}</td>
                    <td>{refund.saleId}</td>
                    <td>{(refund.lineItems ?? []).map((item) => item.productName).join(", ") || "-"}</td>
                    <td>{(refund.lineItems ?? []).reduce((total, item) => total + Number(item.quantity ?? 0), 0)}</td>
                    <td>{formatCurrency(refund.amount ?? 0)}</td>
                    <td>{refund.employee}</td>
                    <td>{refund.reason}</td>
                  </tr>
                ))}
              </tbody>
              {filteredRefunds.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="3">Refund totals</td>
                    <td>{refundedItemCount}</td>
                    <td>{formatCurrency(filteredRefundTotal)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
            {filteredRefunds.length === 0 && <p className="empty-state">No refunds for this period.</p>}
          </div>
        </div>

        <div className="report-section">
          <div className="panel-heading compact-heading">
            <h3>Detailed Expenses</h3>
            <p>{filteredExpenses.length} records</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Detail</th>
                  <th>Branch</th>
                  <th>Amount</th>
                  <th>Employee</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>
                      <button className="text-button date-link" onClick={() => { setReportPeriod("daily"); setReportDate(expense.date); }} type="button">
                        {formatDate(expense.date)}
                      </button>
                    </td>
                    <td>{expense.category}</td>
                    <td>{expense.name}</td>
                    <td>{expense.branchName ?? summary.branchName}</td>
                    <td>{formatCurrency(expense.amount)}</td>
                    <td>{expense.employee}</td>
                    <td>{expense.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredExpenses.length === 0 && <p className="empty-state">No expenses for this period.</p>}
          </div>
        </div>

        <div className="report-section">
          <div className="panel-heading compact-heading">
            <h3>Detailed Stock Movements</h3>
            <p>{filteredStockMovements.length} records</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Movement</th>
                  <th>Source</th>
                  <th>Qty</th>
                  <th>Price / unit cost</th>
                  <th>Purchase total</th>
                </tr>
              </thead>
              <tbody>
                {filteredStockMovements.map((record) => (
                  <tr key={record.id}>
                    <td>{formatDate(record.date)}</td>
                    <td>{record.productName}</td>
                    <td>{record.type === "transfer" ? `${record.fromBranchId} to ${record.toBranchId}` : (record.branchName ?? summary.branchName)}</td>
                    <td>{record.source ?? "Stock-in"}</td>
                    <td>{record.quantity}</td>
                    <td>{formatCurrency(record.unitCost ?? 0)}</td>
                    <td>{formatCurrency(record.purchaseTotal ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
              {filteredStockMovements.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="4">Stock movement totals</td>
                    <td>{stockMovementQuantityTotal}</td>
                    <td></td>
                    <td>{formatCurrency(filteredPurchaseTotal)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
            {filteredStockMovements.length === 0 && <p className="empty-state">No stock movements for this period.</p>}
          </div>
        </div>

        <div className="report-section">
          <div className="panel-heading compact-heading">
            <h3>Inventory Snapshot</h3>
            <p>{inventoryRows.length} products</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Retail price</th>
                  <th>Stock value</th>
                </tr>
              </thead>
              <tbody>
                {inventoryRows.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.category}</td>
                    <td>{product.stockCount}</td>
                    <td>{formatCurrency(product.retailPrice)}</td>
                    <td>{formatCurrency(product.stockValue)}</td>
                  </tr>
                ))}
              </tbody>
              {inventoryRows.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="3">Inventory totals</td>
                    <td>{inventoryStockTotal}</td>
                    <td></td>
                    <td>{formatCurrency(inventoryValueTotal)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
            {inventoryRows.length === 0 && <p className="empty-state">No inventory products yet.</p>}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Sales Per Branch</h3>
          <p>{summary.branchName}</p>
        </div>
        <div className="chart-list">
          {summary.salesByBranch.map((branch) => (
            <div className="chart-row" key={branch.id}>
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
          <h3>Best-Selling Items</h3>
          <p>Quantity sold</p>
        </div>
        <div className="chart-list">
          {chartProducts.map(([name, qty]) => (
            <div className="chart-row" key={name}>
              <span>{name}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(qty / maxProductQty) * 100}%` }} />
              </div>
              <strong>{qty}</strong>
            </div>
          ))}
          {chartProducts.length === 0 && <p className="empty-state">No product sales yet.</p>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Low Stock Alerts</h3>
          <p>5 items or below</p>
        </div>
        <div className="product-list">
          {lowStocks.map((product) => {
            const count = summary.branchId === "all"
              ? Object.values(product.stock).reduce((total, value) => total + value, 0)
              : product.stock[summary.branchId];

            return (
              <article className="product-row" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.category} - {product.sku}</span>
                </div>
                <span className="stock-pill warning">{count} left</span>
              </article>
            );
          })}
          {lowStocks.length === 0 && <p className="empty-state">No low-stock items right now.</p>}
        </div>
      </section>

      <section className="report-grid">
        <article className="report-card">
          <span>Refund records</span>
          <strong>{refundRecords.length}</strong>
          <p>Returned sales recorded</p>
        </article>
        <article className="report-card">
          <span>Stock-in records</span>
          <strong>{stockHistory.length}</strong>
          <p>New stock movements saved</p>
        </article>
        <article className="report-card">
          <span>Stock purchases</span>
          <strong>{formatCurrency(totalPurchases)}</strong>
          <p>Purchase cost from stock-in</p>
        </article>
        <article className="report-card">
          <span>Expenses</span>
          <strong>{formatCurrency(totalExpenses)}</strong>
          <p>Salary and bills recorded</p>
        </article>
        <article className="report-card">
          <span>Revenue total</span>
          <strong>{formatCurrency(totalRevenue)}</strong>
          <p>Current branch scope</p>
        </article>
        <article className="report-card">
          <span>Revenue after expenses</span>
          <strong>{formatCurrency(netProfit)}</strong>
          <p>Revenue minus stock purchases and expenses</p>
        </article>
      </section>
    </div>
  );
}

function getReportRange(period, dateValue) {
  const selectedDate = parseLocalDate(dateValue);

  if (period === "weekly") {
    const day = selectedDate.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = addDays(selectedDate, mondayOffset);
    const end = addDays(start, 6);

    return {
      start: toDateInputValue(start),
      end: toDateInputValue(end)
    };
  }

  if (period === "monthly") {
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    return {
      start: toDateInputValue(start),
      end: toDateInputValue(end)
    };
  }

  if (period === "yearly") {
    const start = new Date(selectedDate.getFullYear(), 0, 1);
    const end = new Date(selectedDate.getFullYear(), 11, 31);

    return {
      start: toDateInputValue(start),
      end: toDateInputValue(end)
    };
  }

  return {
    start: dateValue,
    end: dateValue
  };
}

function isWithinRange(dateValue, range) {
  return dateValue >= range.start && dateValue <= range.end;
}

function parseLocalDate(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(dateValue, days) {
  const nextDate = new Date(dateValue);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toDateInputValue(dateValue) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function capitalize(value) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function createReportDocument({
  detailedSalesItems,
  filteredItemCount,
  filteredExpenseTotal,
  filteredExpenses,
  filteredPurchaseTotal,
  filteredPurchases,
  filteredRefunds,
  filteredRefundTotal,
  filteredSales,
  filteredSalesTotal,
  filteredStockMovements,
  inventoryRows,
  inventoryStockTotal,
  inventoryValueTotal,
  purchaseQuantityTotal,
  reportDateRange,
  reportTitle,
  refundedItemCount,
  session,
  stockMovementQuantityTotal,
  summary
}) {
  const generatedAt = new Date().toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short"
  });
  const salesRows = detailedSalesItems.length
    ? detailedSalesItems.map((item) => `
        <tr>
          <td>${escapeHtml(formatDate(item.date))}</td>
          <td>${escapeHtml(item.saleId)}</td>
          <td>${escapeHtml(item.productName)}</td>
          <td>${escapeHtml(item.priceType)}</td>
          <td>${escapeHtml(item.saleType ?? "-")}</td>
          <td class="number">${escapeHtml(formatCurrency(item.unitPrice))}</td>
          <td class="number">${item.quantity}</td>
          <td class="number">${escapeHtml(formatCurrency(item.total))}</td>
          <td>${escapeHtml(item.employee)}</td>
          <td>${escapeHtml(item.paymentMethod)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="10" class="empty">No sales items for this period.</td></tr>`;
  const expenseRows = filteredExpenses.length
    ? filteredExpenses.map((expense) => `
        <tr>
          <td>${escapeHtml(formatDate(expense.date))}</td>
          <td>${escapeHtml(expense.category)}</td>
          <td>${escapeHtml(expense.name)}</td>
          <td>${escapeHtml(expense.branchName ?? summary.branchName)}</td>
          <td class="number">${escapeHtml(formatCurrency(expense.amount ?? 0))}</td>
          <td>${escapeHtml(expense.employee ?? session.userName)}</td>
          <td>${escapeHtml(expense.note ?? "-")}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="7" class="empty">No expenses for this period.</td></tr>`;
  const refundRows = filteredRefunds.length
    ? filteredRefunds.map((refund) => `
        <tr>
          <td>${escapeHtml(formatDate(refund.date))}</td>
          <td>${escapeHtml(refund.saleId)}</td>
          <td>${escapeHtml((refund.lineItems ?? []).map((item) => item.productName).join(", ") || "-")}</td>
          <td class="number">${(refund.lineItems ?? []).reduce((total, item) => total + Number(item.quantity ?? 0), 0)}</td>
          <td class="number">${escapeHtml(formatCurrency(refund.amount ?? 0))}</td>
          <td>${escapeHtml(refund.employee ?? session.userName)}</td>
          <td>${escapeHtml(refund.reason ?? "-")}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="7" class="empty">No refunds for this period.</td></tr>`;
  const stockMovementRows = filteredStockMovements.length
    ? filteredStockMovements.map((record) => `
        <tr>
          <td>${escapeHtml(formatDate(record.date))}</td>
          <td>${escapeHtml(record.productName)}</td>
          <td>${escapeHtml(record.type === "transfer" ? `${record.fromBranchId} to ${record.toBranchId}` : (record.branchName ?? summary.branchName))}</td>
          <td>${escapeHtml(record.source ?? "Stock-in")}</td>
          <td class="number">${escapeHtml(String(record.quantity ?? 0))}</td>
          <td class="number">${escapeHtml(formatCurrency(record.unitCost ?? 0))}</td>
          <td class="number">${escapeHtml(formatCurrency(record.purchaseTotal ?? 0))}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="7" class="empty">No stock movements for this period.</td></tr>`;
  const inventoryRowsHtml = inventoryRows.length
    ? inventoryRows.map((product) => `
        <tr>
          <td>${escapeHtml(product.name)}</td>
          <td>${escapeHtml(product.sku ?? "-")}</td>
          <td>${escapeHtml(product.category ?? "-")}</td>
          <td class="number">${escapeHtml(String(product.stockCount ?? 0))}</td>
          <td class="number">${escapeHtml(formatCurrency(product.retailPrice ?? 0))}</td>
          <td class="number">${escapeHtml(formatCurrency(product.stockValue ?? 0))}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="6" class="empty">No inventory products yet.</td></tr>`;

  return `<!doctype html>
    <html>
      <head>
        <title>Bea n Belle ${escapeHtml(reportTitle)}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          body {
            color: #111;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            line-height: 1.35;
            margin: 0;
          }
          .report {
            width: 100%;
          }
          .store-header {
            align-items: start;
            border-bottom: 2px solid #111;
            display: grid;
            gap: 12px;
            grid-template-columns: 1fr auto;
            padding-bottom: 10px;
          }
          .store-name {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 0;
            margin: 0;
            text-transform: uppercase;
          }
          .subtitle {
            font-size: 13px;
            font-weight: 700;
            margin: 3px 0 0;
            text-transform: uppercase;
          }
          .meta {
            display: grid;
            gap: 3px;
            text-align: right;
          }
          .meta span {
            white-space: nowrap;
          }
          .summary-grid {
            display: grid;
            gap: 8px;
            grid-template-columns: repeat(4, 1fr);
            margin: 14px 0;
          }
          .summary-box {
            border: 1px solid #222;
            min-height: 56px;
            padding: 8px;
          }
          .summary-box span {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
          }
          .summary-box strong {
            display: block;
            font-size: 15px;
            margin-top: 5px;
          }
          .section-title {
            background: #111;
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            margin: 16px 0 0;
            padding: 6px 8px;
            text-transform: uppercase;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th,
          td {
            border-bottom: 1px solid #cfcfcf;
            padding: 6px 5px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #efefef;
            border-bottom: 1px solid #111;
            font-size: 9px;
            text-transform: uppercase;
          }
          tfoot td {
            border-top: 2px solid #111;
            border-bottom: 0;
            font-weight: 800;
          }
          .number {
            text-align: right;
            white-space: nowrap;
          }
          .empty {
            color: #555;
            font-style: italic;
            text-align: center;
          }
          .signature-grid {
            display: grid;
            gap: 34px;
            grid-template-columns: repeat(3, 1fr);
            margin-top: 44px;
          }
          .signature-line {
            border-top: 1px solid #111;
            padding-top: 6px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <main class="report">
          <header class="store-header">
            <div>
              <h1 class="store-name">Bea n Belle Store System</h1>
              <p class="subtitle">${escapeHtml(reportTitle)} - Detailed Transaction Report</p>
              <p>${escapeHtml(summary.branchName)} | ${escapeHtml(reportDateRange)}</p>
            </div>
            <div class="meta">
              <span><strong>Generated:</strong> ${escapeHtml(generatedAt)}</span>
              <span><strong>Prepared by:</strong> ${escapeHtml(session.userName)}</span>
              <span><strong>Role:</strong> ${escapeHtml(session.role)}</span>
            </div>
          </header>

          <section class="summary-grid">
            <div class="summary-box">
              <span>Sales transactions</span>
              <strong>${filteredSales.length}</strong>
            </div>
            <div class="summary-box">
              <span>Items sold</span>
              <strong>${filteredItemCount}</strong>
            </div>
            <div class="summary-box">
              <span>Sales total</span>
              <strong>${escapeHtml(formatCurrency(filteredSalesTotal))}</strong>
            </div>
            <div class="summary-box">
              <span>Refunds</span>
              <strong>${escapeHtml(formatCurrency(filteredRefundTotal))}</strong>
            </div>
            <div class="summary-box">
              <span>Stock purchases</span>
              <strong>${escapeHtml(formatCurrency(filteredPurchaseTotal))}</strong>
            </div>
            <div class="summary-box">
              <span>Expenses</span>
              <strong>${escapeHtml(formatCurrency(filteredExpenseTotal))}</strong>
            </div>
            <div class="summary-box">
              <span>Inventory stock</span>
              <strong>${inventoryStockTotal}</strong>
            </div>
            <div class="summary-box">
              <span>Inventory value</span>
              <strong>${escapeHtml(formatCurrency(inventoryValueTotal))}</strong>
            </div>
          </section>

          <h2 class="section-title">Detailed Sales Items</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Sale ID</th>
                <th>Item</th>
                <th>Type</th>
                <th>Tag</th>
                <th class="number">Price</th>
                <th class="number">Qty</th>
                <th class="number">Total Price</th>
                <th>Employee</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>${salesRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="6">Sales item totals</td>
                <td class="number">${filteredItemCount}</td>
                <td class="number">${escapeHtml(formatCurrency(filteredSalesTotal))}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>

          <h2 class="section-title">Detailed Refunds</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Sale ID</th>
                <th>Items</th>
                <th class="number">Qty</th>
                <th class="number">Amount</th>
                <th>Employee</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>${refundRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="3">Refund totals</td>
                <td class="number">${refundedItemCount}</td>
                <td class="number">${escapeHtml(formatCurrency(filteredRefundTotal))}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>

          <h2 class="section-title">Detailed Expenses</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Detail</th>
                <th>Branch</th>
                <th class="number">Amount</th>
                <th>Employee</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>${expenseRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="4">Expense totals</td>
                <td class="number">${escapeHtml(formatCurrency(filteredExpenseTotal))}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>

          <h2 class="section-title">Detailed Stock Movements</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Movement</th>
                <th>Source</th>
                <th class="number">Qty</th>
                <th class="number">Unit Cost</th>
                <th class="number">Purchase Total</th>
              </tr>
            </thead>
            <tbody>${stockMovementRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="4">Stock movement totals</td>
                <td class="number">${stockMovementQuantityTotal}</td>
                <td></td>
                <td class="number">${escapeHtml(formatCurrency(filteredPurchaseTotal))}</td>
              </tr>
            </tfoot>
          </table>

          <h2 class="section-title">Inventory Snapshot</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th class="number">Stock</th>
                <th class="number">Retail Price</th>
                <th class="number">Stock Value</th>
              </tr>
            </thead>
            <tbody>${inventoryRowsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="3">Inventory totals</td>
                <td class="number">${inventoryStockTotal}</td>
                <td></td>
                <td class="number">${escapeHtml(formatCurrency(inventoryValueTotal))}</td>
              </tr>
            </tfoot>
          </table>

          <section class="signature-grid">
            <div class="signature-line">Prepared by</div>
            <div class="signature-line">Checked by</div>
            <div class="signature-line">Approved by</div>
          </section>
        </main>
      </body>
    </html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
