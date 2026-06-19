import React from "react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";

export function DashboardPage({ branches, session, summary }) {
  const today = new Date().toISOString().slice(0, 10);
  const totalRevenue = summary.totalRevenue ?? summary.totalSales;
  const totalPurchases = summary.totalPurchases ?? 0;
  const grossProfit = summary.grossProfit ?? totalRevenue - totalPurchases;
  const todaysSales = summary.recentSales.filter((sale) => sale.date === today);
  const todaysRevenue = todaysSales.reduce((total, sale) => total + sale.amount, 0);
  const todaysPurchases = summary.stockMovements
    .filter((movement) => movement.date === today)
    .reduce((total, movement) => total + (movement.purchaseTotal ?? 0), 0);
  const profitPercent = totalRevenue > 0 ? Math.max(0, Math.min(100, (grossProfit / totalRevenue) * 100)) : 0;
  const purchasePercent = totalRevenue > 0 ? Math.max(0, Math.min(100, (totalPurchases / totalRevenue) * 100)) : 0;
  const maxBranchTotal = Math.max(...summary.salesByBranch.map((branch) => branch.total), 1);
  const lowStocks = summary.inventory
    .map((product) => {
      const count = summary.branchId === "all"
        ? Object.values(product.stock).reduce((total, value) => total + value, 0)
        : product.stock[summary.branchId] ?? 0;

      return { ...product, count };
    })
    .filter((product) => product.count <= 5)
    .slice(0, 5);
  const recentPurchases = summary.stockMovements.slice(0, 5);
  const recentSales = summary.recentSales.slice(0, 5);

  return (
    <div className="page-grid">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">{summary.branchName}</p>
          <h3>Good day, {session.userName}</h3>
          <p>Revenue, stock purchases, and current branch activity are ready for review.</p>
        </div>
        <div className="finance-strip">
          <span>Revenue after purchases</span>
          <strong>{formatCurrency(grossProfit)}</strong>
        </div>
      </section>

      <section className="metric-row">
        <article className="metric-card accent">
          <span>Total revenue</span>
          <strong>{formatCurrency(totalRevenue)}</strong>
        </article>
        <article className="metric-card">
          <span>Stock purchases</span>
          <strong>{formatCurrency(totalPurchases)}</strong>
        </article>
        <article className="metric-card">
          <span>Revenue after purchases</span>
          <strong>{formatCurrency(grossProfit)}</strong>
        </article>
        <article className="metric-card">
          <span>Today's revenue</span>
          <strong>{formatCurrency(todaysRevenue)}</strong>
        </article>
        <article className="metric-card">
          <span>Today's purchases</span>
          <strong>{formatCurrency(todaysPurchases)}</strong>
        </article>
        <article className="metric-card">
          <span>Current stock</span>
          <strong>{summary.totalStock}</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h3>Revenue And Purchases</h3>
              <p>Current branch scope</p>
            </div>
            <span className="total-preview">{summary.totalItems} items sold</span>
          </div>
          <div className="finance-bars">
            <div className="finance-row">
              <span>Revenue kept</span>
              <div className="bar-track">
                <div className="bar-fill success" style={{ width: `${profitPercent}%` }} />
              </div>
              <strong>{formatCurrency(grossProfit)}</strong>
            </div>
            <div className="finance-row">
              <span>Stock purchases</span>
              <div className="bar-track">
                <div className="bar-fill warning" style={{ width: `${purchasePercent}%` }} />
              </div>
              <strong>{formatCurrency(totalPurchases)}</strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h3>Sales Per Branch</h3>
              <p>Revenue comparison</p>
            </div>
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
            {summary.salesByBranch.length === 0 && <p className="empty-state">No branches yet.</p>}
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h3>Recent Sales</h3>
              <p>Latest checkout records</p>
            </div>
          </div>
          <div className="history-list">
            {recentSales.map((sale) => (
              <article className="history-row compact-history" key={sale.id}>
                <strong>{sale.productName ?? "Walk-in sale"}</strong>
                <span>{formatDate(sale.date)} - {sale.employee} - {sale.paymentMethod ?? "Cash"}</span>
                <span>{sale.items} items - {formatCurrency(sale.amount)}</span>
              </article>
            ))}
            {recentSales.length === 0 && <p className="empty-state">No sales recorded yet.</p>}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h3>Recent Purchases</h3>
              <p>Latest stock-in costs</p>
            </div>
          </div>
          <div className="history-list">
            {recentPurchases.map((movement) => (
              <article className="history-row compact-history" key={movement.id}>
                <strong>{movement.productName}</strong>
                <span>
                  {formatDate(movement.date)} - {movement.quantity} added - {branches.find((branch) => branch.id === movement.branchId)?.name ?? summary.branchName}
                </span>
                <span>{formatCurrency(movement.purchaseTotal ?? 0)} purchase total</span>
              </article>
            ))}
            {recentPurchases.length === 0 && <p className="empty-state">No stock purchases recorded yet.</p>}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h3>Low Stock Watch</h3>
              <p>5 items or below</p>
            </div>
          </div>
          <div className="product-list">
            {lowStocks.map((product) => (
              <article className="product-row" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.category} - {product.sku}</span>
                </div>
                <span className="stock-pill warning">{product.count} left</span>
              </article>
            ))}
            {lowStocks.length === 0 && <p className="empty-state">Stock levels look healthy.</p>}
          </div>
        </article>
      </section>
    </div>
  );
}
