import React, { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "../../utils/formatters.js";

export function ReturnsPage({ branches, refundRecords, sales, session, onRefund }) {
  const availableSales = useMemo(
    () => sales.filter((sale) => session.role === "admin" || sale.branchId === session.branchId),
    [sales, session.branchId, session.role]
  );
  const [saleId, setSaleId] = useState(availableSales[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const selectedSale = availableSales.find((sale) => sale.id === saleId);

  function handleRefund(event) {
    event.preventDefault();

    if (!selectedSale) {
      setMessage("Choose a sale to refund.");
      return;
    }

    onRefund({
      id: `RF-${Date.now().toString().slice(-6)}`,
      amount: selectedSale.amount,
      branchId: selectedSale.branchId,
      date: new Date().toISOString().slice(0, 10),
      employee: session.userName,
      lineItems: selectedSale.lineItems ?? [],
      reason: reason || "Customer return",
      saleId: selectedSale.id
    });
    setReason("");
    setMessage(`Refund recorded for ${selectedSale.id}. Stock has been added back.`);
  }

  return (
    <div className="page-grid two-column">
      <section className="panel">
        <div className="panel-heading">
          <h3>Return / Refund</h3>
          <p>Record returned sold items and add stock back</p>
        </div>
        <form className="stock-form" onSubmit={handleRefund}>
          <label className="field">
            <span>Sale record</span>
            <select value={saleId} onChange={(event) => setSaleId(event.target.value)}>
              {availableSales.map((sale) => (
                <option key={sale.id} value={sale.id}>
                  {sale.id} - {formatCurrency(sale.amount)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Reason</span>
            <input placeholder="Wrong item, damaged, customer return" value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <button className="primary-button" type="submit">Record refund</button>
        </form>
        {message && <p className="success-message">{message}</p>}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Sale Preview</h3>
          <p>{selectedSale?.id ?? "No sale selected"}</p>
        </div>
        {selectedSale ? (
          <div className="receipt-preview">
            <div className="receipt-meta">
              <span>Date: <strong>{formatDate(selectedSale.date)}</strong></span>
              <span>Branch: <strong>{branches.find((branch) => branch.id === selectedSale.branchId)?.name}</strong></span>
              <span>Total: <strong>{formatCurrency(selectedSale.amount)}</strong></span>
            </div>
            <div className="receipt-list compact">
              {(selectedSale.lineItems ?? []).map((item) => (
                <div className="receipt-line" key={item.productId}>
                  <strong>{item.productName}</strong>
                  <span>{formatCurrency(item.unitPrice)}</span>
                  <span>{item.quantity}</span>
                  <span>{formatCurrency(item.total)}</span>
                  <span></span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="empty-state">No sale available for refund.</p>
        )}
      </section>

      <section className="panel wide-panel">
        <div className="panel-heading">
          <h3>Refund Records</h3>
          <p>Returned sales history</p>
        </div>
        <div className="history-list">
          {refundRecords.map((refund) => (
            <article className="history-row" key={refund.id}>
              <strong>{refund.id} - {refund.saleId}</strong>
              <span>{formatDate(refund.date)} - {formatCurrency(refund.amount)} - {refund.reason}</span>
              <span>{branches.find((branch) => branch.id === refund.branchId)?.name} - {refund.employee}</span>
            </article>
          ))}
          {refundRecords.length === 0 && <p className="empty-state">No refunds recorded yet.</p>}
        </div>
      </section>
    </div>
  );
}
