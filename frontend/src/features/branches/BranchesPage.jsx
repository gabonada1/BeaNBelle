import React, { useState } from "react";

export function BranchesPage({ branches, onAddBranch }) {
  const [form, setForm] = useState({ name: "", location: "", manager: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await onAddBranch(form);
      setForm({ name: "", location: "", manager: "" });
      setMessage("Branch created.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page-grid two-column setup-grid">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Add Branch</h3>
            <p>Start with one real store location. You can add more anytime.</p>
          </div>
        </div>
        <form className="stock-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Branch name</span>
            <input placeholder="Example: SM City Branch" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="field">
            <span>Location</span>
            <input placeholder="Mall, city, or address" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </label>
          <label className="field">
            <span>Manager</span>
            <input placeholder="Optional" value={form.manager} onChange={(event) => setForm({ ...form, manager: event.target.value })} />
          </label>
          <button className="primary-button" type="submit">Create branch</button>
        </form>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Branches</h3>
            <p>{branches.length ? `${branches.length} active branches` : "No branches yet"}</p>
          </div>
        </div>
        <div className="card-list">
          {branches.map((branch) => (
            <article className="entity-card" key={branch.id}>
              <div className="entity-avatar">{branch.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <strong>{branch.name}</strong>
                <span>{branch.location}</span>
                <span>Manager: {branch.manager || "Unassigned"}</span>
              </div>
            </article>
          ))}
          {branches.length === 0 && (
            <div className="empty-state helpful-empty">
              <strong>Create your first branch</strong>
              <span>Branches unlock inventory, staff assignment, sales, and reports.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
