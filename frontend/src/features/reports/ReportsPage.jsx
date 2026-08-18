import React, { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";

export function ReportsPage({
  branches,
  refundRecords,
  selectedBranchId,
  session,
  stockHistory,
  summary,
  onBranchChange
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [reportType, setReportType] = useState("sales");
  const [reportPeriod, setReportPeriod] = useState("daily");
  const [reportDate, setReportDate] = useState(today);

  const branchScopeId = session.role === "admin" ? selectedBranchId ?? "all" : session.branchId ?? summary.branchId ?? "all";
  const branchScopeLabel = branchScopeId === "all"
    ? "All branches"
    : branches.find((branch) => branch.id === branchScopeId)?.name ?? summary.branchName ?? "Selected branch";
  const visibleBranches = branchScopeId === "all"
    ? branches
    : branches.filter((branch) => branch.id === branchScopeId);

  const totalRevenue = summary.totalRevenue ?? summary.totalSales;
  const totalPurchases = summary.totalPurchases ?? stockHistory.reduce((total, record) => total + (record.purchaseTotal ?? 0), 0);
  const totalExpenses = summary.totalExpenses ?? 0;
  const netProfit = summary.netProfit ?? totalRevenue - totalPurchases - totalExpenses;
  const todaysSales = summary.recentSales.filter((sale) => sale.date === today);
  const todaysTotal = todaysSales.reduce((total, sale) => total + sale.amount, 0);
  const employeeSales = summary.recentSales.filter((sale) => sale.employee === session.userName);
  const productTotals = summary.recentSales.reduce((result, sale) => {
    (sale.lineItems ?? []).forEach((item) => {
      result[item.productName] = (result[item.productName] ?? 0) + item.quantity;
    });
    return result;
  }, {});
  const bestSeller = Object.entries(productTotals).sort((a, b) => b[1] - a[1])[0];

  const reportRange = useMemo(() => getReportRange(reportPeriod, reportDate), [reportDate, reportPeriod]);
  const filteredSales = summary.recentSales.filter((sale) => isWithinRange(sale.date, reportRange));
  const filteredStockMovements = stockHistory.filter((record) => isWithinRange(record.date, reportRange));
  const filteredPurchases = filteredStockMovements.filter((record) => record.type !== "transfer");
  const filteredRefunds = refundRecords.filter((refund) => isWithinRange(refund.date, reportRange));
  const filteredExpenses = (summary.expenses ?? summary.recentExpenses ?? []).filter((expense) => isWithinRange(expense.date, reportRange));

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
      paymentMethod: Array.isArray(sale.paymentMethod) ? sale.paymentMethod.join(", ") : sale.paymentMethod ?? "Cash",
      priceType: item.priceType === "reseller" ? "Reseller" : "Retail",
      saleType: item.saleType ?? sale.saleType ?? null,
      productName: item.productName,
      quantity: Number(item.quantity ?? 0),
      total: Number(item.total ?? 0),
      unitPrice: Number(item.unitPrice ?? 0)
    }));
  });

  const stockInRows = useMemo(() => groupStockInRows(filteredPurchases, visibleBranches), [filteredPurchases, visibleBranches]);

  const salesTotal = filteredSales.reduce((total, sale) => total + (sale.amount ?? 0), 0);
  const refundTotal = filteredRefunds.reduce((total, refund) => total + (refund.amount ?? 0), 0);
  const purchaseTotal = filteredPurchases.reduce((total, record) => total + (record.purchaseTotal ?? 0), 0);
  const expenseTotal = filteredExpenses.reduce((total, expense) => total + (expense.amount ?? 0), 0);
  const itemCount = filteredSales.reduce((total, sale) => total + (sale.items ?? 0), 0);
  const stockCountTotal = stockInRows.reduce((total, row) => total + row.totalQuantity, 0);
  const stockEntryCount = filteredPurchases.length;
  const stockItemCount = stockInRows.length;

  const reportTypeLabel = getReportTypeLabel(reportType);
  const reportTitle = `${capitalize(reportPeriod)} ${reportTypeLabel}`;
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
      branchScopeLabel,
      branchScopeId,
      detailedSalesItems,
      expenseTotal,
      filteredExpenses,
      filteredRefunds,
      filteredSales,
      itemCount,
      purchaseTotal,
      reportDateRange,
      reportTitle,
      reportType,
      salesTotal,
      session,
      stockCountTotal,
      stockEntryCount,
      stockInRows,
      stockItemCount,
      summary,
      refundTotal,
      visibleBranches
    }));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  const reportCards = getReportCards({
    branchScopeLabel,
    expenseTotal,
    filteredExpenses,
    filteredRefunds,
    itemCount,
    purchaseTotal,
    reportType,
    salesTotal,
    stockCountTotal,
    stockEntryCount,
    stockItemCount,
    refundTotal
  });

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
            <h3>Printable Reports</h3>
            <p>Pick sales, stock-in, or expenses, then scope it to a branch before printing</p>
          </div>
          <button className="primary-button no-print" onClick={handlePrint} type="button">
            Print report
          </button>
        </div>

        <div className="report-toolbar no-print">
          <label className="field">
            <span>Report type</span>
            <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
              <option value="sales">Sales</option>
              <option value="stock">Stock in</option>
              <option value="expenses">Expenses</option>
            </select>
          </label>
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
          <label className="field">
            <span>Branch scope</span>
            <select
              value={branchScopeId}
              onChange={(event) => onBranchChange(event.target.value)}
              disabled={session.role !== "admin"}
            >
              {session.role === "admin" && <option value="all">All branches</option>}
              {(branches ?? []).map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="print-header">
          <p className="eyebrow">Bea n Belle</p>
          <h3>{reportTitle}</h3>
          <p>{branchScopeLabel} - {reportDateRange}</p>
        </div>

        <div className="report-grid compact-report-grid">
          {reportCards.map((card) => (
            <article className="report-card" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.note}</p>
            </article>
          ))}
        </div>

        {reportType === "sales" && (
          <ReportTable title="Sales Report" count={`${detailedSalesItems.length} item rows`}>
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
                    <td>{itemCount}</td>
                    <td>{formatCurrency(salesTotal)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
            {detailedSalesItems.length === 0 && <p className="empty-state">No sales items for this period.</p>}
          </ReportTable>
        )}

        {reportType === "stock" && (
          <ReportTable title="Stock-in Report" count={`${stockInRows.length} grouped rows`}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Total stock added</th>
                  {visibleBranches.map((branch) => (
                    <th key={branch.id}>{branch.name}</th>
                  ))}
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {stockInRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button className="text-button date-link" onClick={() => { setReportPeriod("daily"); setReportDate(row.date); }} type="button">
                        {formatDate(row.date)}
                      </button>
                    </td>
                    <td>{row.productName}</td>
                    <td>{row.totalQuantity}</td>
                    {visibleBranches.map((branch) => (
                      <td key={branch.id}>{row.branchQuantities[branch.id] ?? 0}</td>
                    ))}
                    <td>{row.source}</td>
                  </tr>
                ))}
              </tbody>
              {stockInRows.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="2">Stock-in totals</td>
                    <td>{stockCountTotal}</td>
                    {visibleBranches.map((branch) => (
                      <td key={branch.id}>
                        {stockInRows.reduce((total, row) => total + Number(row.branchQuantities[branch.id] ?? 0), 0)}
                      </td>
                    ))}
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
            {stockInRows.length === 0 && <p className="empty-state">No stock-in rows for this period.</p>}
          </ReportTable>
        )}

        {reportType === "expenses" && (
          <ReportTable title="Expenses Report" count={`${filteredExpenses.length} records`}>
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
                    <td>{expense.branchName ?? branchScopeLabel}</td>
                    <td>{formatCurrency(expense.amount)}</td>
                    <td>{expense.employee}</td>
                    <td>{expense.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
              {filteredExpenses.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="4">Expense totals</td>
                    <td>{formatCurrency(expenseTotal)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
            {filteredExpenses.length === 0 && <p className="empty-state">No expenses for this period.</p>}
          </ReportTable>
        )}
      </section>
    </div>
  );
}

function ReportTable({ title, count, children }) {
  return (
    <div className="report-section">
      <div className="panel-heading compact-heading">
        <h3>{title}</h3>
        <p>{count}</p>
      </div>
      <div className="table-wrap">{children}</div>
    </div>
  );
}

function getReportCards({
  branchScopeLabel,
  expenseTotal,
  filteredExpenses,
  filteredRefunds,
  itemCount,
  purchaseTotal,
  reportType,
  salesTotal,
  stockCountTotal,
  stockEntryCount,
  stockItemCount,
  refundTotal
}) {
  if (reportType === "stock") {
    return [
      { label: "Stock-in entries", value: stockEntryCount, note: "Individual branch stock records" },
      { label: "Grouped items", value: stockItemCount, note: "Unique stock-in rows in this period" },
      { label: "Total stock added", value: stockCountTotal, note: "All branches combined" },
      { label: "Branch scope", value: branchScopeLabel, note: "Current report filter" }
    ];
  }

  if (reportType === "expenses") {
    return [
      { label: "Expense total", value: formatCurrency(expenseTotal), note: `${filteredExpenses.length} records` },
      { label: "Records", value: filteredExpenses.length, note: "Expenses in the selected period" },
      { label: "Refund total", value: formatCurrency(refundTotal), note: `${filteredRefunds.length} refund records` },
      { label: "Net after expenses", value: formatCurrency(salesTotal - expenseTotal), note: "Sales minus expenses" }
    ];
  }

  return [
    { label: "Sales total", value: formatCurrency(salesTotal), note: `${itemCount} items sold` },
    { label: "Refund total", value: formatCurrency(refundTotal), note: `${filteredRefunds.length} refund records` },
    { label: "Items sold", value: itemCount, note: "Selected period total" },
    { label: "Net after expenses", value: formatCurrency(salesTotal - expenseTotal), note: "Sales minus expenses" }
  ];
}

function groupStockInRows(records, branches) {
  const grouped = new Map();

  records.forEach((record) => {
    const key = `${record.date}|${record.productId ?? record.productName}|${record.source ?? "Stock-in"}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        branchQuantities: Object.fromEntries(branches.map((branch) => [branch.id, 0])),
        date: record.date,
        productName: record.productName ?? "Stock item",
        source: record.source ?? "Stock-in",
        totalQuantity: 0
      });
    }

    const row = grouped.get(key);
    const branchId = record.branchId ?? record.toBranchId ?? branches[0]?.id ?? "all";
    const quantity = Number(record.quantity ?? 0);

    row.totalQuantity += quantity;
    row.branchQuantities[branchId] = (row.branchQuantities[branchId] ?? 0) + quantity;
  });

  return Array.from(grouped.values()).sort((a, b) => b.date.localeCompare(a.date));
}

function getReportTypeLabel(type) {
  if (type === "stock") return "stock-in report";
  if (type === "expenses") return "expenses report";
  return "sales report";
}

function createReportDocument({
  branchScopeId,
  branchScopeLabel,
  detailedSalesItems,
  expenseTotal,
  filteredExpenses,
  filteredRefunds,
  filteredSales,
  itemCount,
  purchaseTotal,
  reportDateRange,
  reportTitle,
  reportType,
  salesTotal,
  session,
  stockCountTotal,
  stockEntryCount,
  stockInRows,
  stockItemCount,
  summary,
  refundTotal,
  visibleBranches
}) {
  const generatedAt = new Date().toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  const body = reportType === "stock"
    ? renderStockRows(stockInRows, visibleBranches)
    : reportType === "expenses"
      ? renderExpenseRows(filteredExpenses, branchScopeLabel, session)
      : renderSalesRows(detailedSalesItems, session);

  const tableMarkup = reportType === "stock"
    ? `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Item</th>
            <th class="number">Total stock added</th>
            ${visibleBranches.map((branch) => `<th class="number">${escapeHtml(branch.name)}</th>`).join("")}
            <th>Source</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
        <tfoot>
          <tr>
            <td colspan="2">Stock-in totals</td>
            <td class="number">${stockCountTotal}</td>
            ${visibleBranches.map((branch) => `<td class="number">${stockInRows.reduce((total, row) => total + Number(row.branchQuantities[branch.id] ?? 0), 0)}</td>`).join("")}
            <td></td>
          </tr>
        </tfoot>
      </table>`
    : reportType === "expenses"
      ? `
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
          <tbody>${body}</tbody>
          <tfoot>
            <tr>
              <td colspan="4">Expense totals</td>
              <td class="number">${escapeHtml(formatCurrency(expenseTotal))}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>`
      : `
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
          <tbody>${body}</tbody>
          <tfoot>
            <tr>
              <td colspan="6">Sales item totals</td>
              <td class="number">${itemCount}</td>
              <td class="number">${escapeHtml(formatCurrency(salesTotal))}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>`;

  const summaryCards = reportType === "stock"
    ? `
      <div class="summary-box"><span>Stock-in entries</span><strong>${stockEntryCount}</strong></div>
      <div class="summary-box"><span>Grouped items</span><strong>${stockItemCount}</strong></div>
      <div class="summary-box"><span>Total stock added</span><strong>${stockCountTotal}</strong></div>
      <div class="summary-box"><span>Branch scope</span><strong>${escapeHtml(branchScopeLabel)}</strong></div>`
    : reportType === "expenses"
      ? `
      <div class="summary-box"><span>Expense total</span><strong>${escapeHtml(formatCurrency(expenseTotal))}</strong></div>
      <div class="summary-box"><span>Expense records</span><strong>${filteredExpenses.length}</strong></div>
      <div class="summary-box"><span>Refund total</span><strong>${escapeHtml(formatCurrency(refundTotal))}</strong></div>
      <div class="summary-box"><span>Branch scope</span><strong>${escapeHtml(branchScopeLabel)}</strong></div>`
      : `
      <div class="summary-box"><span>Sales total</span><strong>${escapeHtml(formatCurrency(salesTotal))}</strong></div>
      <div class="summary-box"><span>Items sold</span><strong>${itemCount}</strong></div>
      <div class="summary-box"><span>Refund total</span><strong>${escapeHtml(formatCurrency(refundTotal))}</strong></div>
      <div class="summary-box"><span>Branch scope</span><strong>${escapeHtml(branchScopeLabel)}</strong></div>`;

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
          .report { width: 100%; }
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
          .meta span { white-space: nowrap; }
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
          th, td {
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
          .number { text-align: right; white-space: nowrap; }
          .empty { color: #555; font-style: italic; text-align: center; }
        </style>
      </head>
      <body>
        <main class="report">
          <header class="store-header">
            <div>
              <h1 class="store-name">Bea n Belle Store System</h1>
              <p class="subtitle">${escapeHtml(reportTitle)} - ${escapeHtml(branchScopeLabel)}</p>
              <p>${escapeHtml(branchScopeLabel)} | ${escapeHtml(reportDateRange)}</p>
            </div>
            <div class="meta">
              <span><strong>Generated:</strong> ${escapeHtml(generatedAt)}</span>
              <span><strong>Prepared by:</strong> ${escapeHtml(session.userName)}</span>
              <span><strong>Role:</strong> ${escapeHtml(session.role)}</span>
            </div>
          </header>

          <section class="summary-grid">
            ${summaryCards}
          </section>

          <h2 class="section-title">${escapeHtml(reportTypeLabelForPrint(reportType))}</h2>
          ${tableMarkup}
        </main>
      </body>
    </html>`;
}

function renderSalesRows(detailedSalesItems, session) {
  return detailedSalesItems.length
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
          <td>${escapeHtml(item.employee ?? session.userName)}</td>
          <td>${escapeHtml(item.paymentMethod)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="10" class="empty">No sales items for this period.</td></tr>`;
}

function renderExpenseRows(filteredExpenses, branchScopeLabel, session) {
  return filteredExpenses.length
    ? filteredExpenses.map((expense) => `
        <tr>
          <td>${escapeHtml(formatDate(expense.date))}</td>
          <td>${escapeHtml(expense.category)}</td>
          <td>${escapeHtml(expense.name)}</td>
          <td>${escapeHtml(expense.branchName ?? branchScopeLabel)}</td>
          <td class="number">${escapeHtml(formatCurrency(expense.amount ?? 0))}</td>
          <td>${escapeHtml(expense.employee ?? session.userName)}</td>
          <td>${escapeHtml(expense.note ?? "-")}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="7" class="empty">No expenses for this period.</td></tr>`;
}

function renderStockRows(stockInRows, visibleBranches) {
  return stockInRows.length
    ? stockInRows.map((row) => `
        <tr>
          <td>${escapeHtml(formatDate(row.date))}</td>
          <td>${escapeHtml(row.productName)}</td>
          <td class="number">${row.totalQuantity}</td>
          ${visibleBranches.map((branch) => `<td class="number">${row.branchQuantities[branch.id] ?? 0}</td>`).join("")}
          <td>${escapeHtml(row.source)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="${3 + visibleBranches.length + 1}" class="empty">No stock-in rows for this period.</td></tr>`;
}

function reportTypeLabelForPrint(type) {
  if (type === "stock") return "Stock-in Report";
  if (type === "expenses") return "Expenses Report";
  return "Sales Report";
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
