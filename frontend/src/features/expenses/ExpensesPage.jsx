import React, { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";

const billOptions = ["Water", "Rent", "Electric", "Wifi", "Other"];

export function ExpensesPage({ branches, selectedBranchId, session, summary, onAddExpense }) {
  const initialBranchId = session.role === "admin"
    ? (selectedBranchId !== "all" ? selectedBranchId : branches[0]?.id ?? "")
    : session.branchId;
  const [expenseType, setExpenseType] = useState("Salary");
  const [billType, setBillType] = useState("Water");
  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount] = useState("");
  const [branchId, setBranchId] = useState(initialBranchId);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const expenses = summary.expenses ?? summary.recentExpenses ?? [];
  const totalExpenses = summary.totalExpenses ?? expenses.reduce((total, expense) => total + Number(expense.amount ?? 0), 0);
  const netProfit = summary.netProfit ?? summary.grossProfit ?? (summary.totalRevenue ?? 0) - (summary.totalPurchases ?? 0) - totalExpenses;
  const recentExpenses = useMemo(() => expenses.slice(0, 20), [expenses]);

  useEffect(() => {
    if (session.role === "admin") {
      setBranchId(selectedBranchId !== "all" ? selectedBranchId : branches[0]?.id ?? "");
    }
  }, [branches, selectedBranchId, session.role]);

  function handleSubmit(event) {
    event.preventDefault();

    const chosenBranchId = session.role === "admin"
      ? branchId || selectedBranchId
      : session.branchId;
    const cleanAmount = Number(amount);
    const finalName = expenseType === "Bills"
      ? (billType === "Other" ? expenseName.trim() : expenseName.trim() || billType)
      : expenseName.trim() || "Salary";

    if (!chosenBranchId) {
      setMessage("Choose a branch before saving the expense.");
      return;
    }

    if (!finalName) {
      setMessage("Enter the expense details.");
      return;
    }

    if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
      setMessage("Enter a valid amount.");
      return;
    }

    onAddExpense({
      id: `EX-${Date.now().toString().slice(-6)}`,
      branchId: chosenBranchId,
      category: expenseType,
      date: new Date().toISOString().slice(0, 10),
      amount: cleanAmount,
      name: finalName,
      note
    });

    setAmount("");
    setExpenseName("");
    setNote("");
    setMessage(`Expense saved. Revenue is adjusted automatically.`);
  }

  return (
    <div className="page-grid two-column">
      <section className="panel">
        <div className="panel-heading">
          <h3>Record Expense</h3>
          <p>Salary and bills are deducted from revenue automatically</p>
        </div>
        <form className="stock-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Expense type</span>
            <select value={expenseType} onChange={(event) => setExpenseType(event.target.value)}>
              <option>Salary</option>
              <option>Bills</option>
            </select>
          </label>

          {expenseType === "Bills" ? (
            <label className="field">
              <span>Bill category</span>
              <select value={billType} onChange={(event) => setBillType(event.target.value)}>
                {billOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="field">
            <span>{expenseType === "Bills" ? "Bill detail" : "Salary detail"}</span>
            <input
              placeholder={expenseType === "Bills" ? "Water bill, rent, wifi, or custom bill name" : "Employee name or salary note"}
              value={expenseName}
              onChange={(event) => setExpenseName(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Branch</span>
            <select
              value={session.role === "admin" ? branchId : session.branchId}
              onChange={(event) => setBranchId(event.target.value)}
              disabled={session.role !== "admin"}
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Amount</span>
            <input min="0" placeholder="0" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </label>

          <label className="field">
            <span>Note</span>
            <input placeholder="Optional note" value={note} onChange={(event) => setNote(event.target.value)} />
          </label>

          <button className="primary-button" type="submit">Save expense</button>
        </form>
        {message && <p className="success-message">{message}</p>}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Expense Summary</h3>
          <p>{summary.branchName}</p>
        </div>
        <div className="metric-row">
          <article className="metric-card accent">
            <span>Total expenses</span>
            <strong>{formatCurrency(totalExpenses)}</strong>
          </article>
          <article className="metric-card">
            <span>Net revenue</span>
            <strong>{formatCurrency(netProfit)}</strong>
          </article>
          <article className="metric-card">
            <span>Transactions</span>
            <strong>{recentExpenses.length}</strong>
          </article>
        </div>
      </section>

      <section className="panel wide-panel">
        <div className="panel-heading">
          <h3>Expense Transactions</h3>
          <p>Salary and bills history</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Details</th>
                <th>Branch</th>
                <th>Amount</th>
                <th>Employee</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {recentExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{formatDate(expense.date)}</td>
                  <td><span className="stock-pill">{expense.category}</span></td>
                  <td>{expense.name}</td>
                  <td>{expense.branchName ?? branches.find((branch) => branch.id === expense.branchId)?.name ?? summary.branchName}</td>
                  <td>{formatCurrency(expense.amount)}</td>
                  <td>{expense.employee}</td>
                  <td>{expense.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentExpenses.length === 0 && <p className="empty-state">No expenses recorded yet.</p>}
        </div>
      </section>
    </div>
  );
}