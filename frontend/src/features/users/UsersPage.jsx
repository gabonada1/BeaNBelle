import React, { useEffect, useState } from "react";

export function UsersPage({ branches, onAddUser, onLoadUsers, users }) {
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "employee",
    branchId: branches[0]?.id ?? ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    onLoadUsers();
  }, [onLoadUsers]);

  useEffect(() => {
    if (!form.branchId && branches[0]?.id) {
      setForm((current) => ({ ...current, branchId: branches[0].id }));
    }
  }, [branches, form.branchId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await onAddUser(form);
      setForm({
        name: "",
        username: "",
        password: "",
        role: "employee",
        branchId: branches[0]?.id ?? ""
      });
      setMessage("User account created.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="page-grid two-column setup-grid">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Add User</h3>
            <p>Create staff accounts and assign them to a branch</p>
          </div>
        </div>
        {branches.length === 0 && (
          <p className="error-message">Create a branch first before adding employee accounts.</p>
        )}
        <form className="stock-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Full name</span>
            <input placeholder="Employee full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="field">
            <span>Username</span>
            <input placeholder="Used for login" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
          </label>
          <label className="field">
            <span>Password</span>
            <input placeholder="Temporary password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </label>
          <label className="field">
            <span>Role</span>
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </select>
          </label>
          <label className="field">
            <span>Assigned branch</span>
            <select
              disabled={form.role === "owner"}
              value={form.role === "owner" ? "" : form.branchId}
              onChange={(event) => setForm({ ...form, branchId: event.target.value })}
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </label>
          <button className="primary-button" disabled={branches.length === 0 && form.role !== "owner"} type="submit">Create user</button>
        </form>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>User Accounts</h3>
            <p>{users.length} users</p>
          </div>
        </div>
        <div className="card-list">
          {users.map((user) => (
            <article className="entity-card" key={user.id}>
              <div className="entity-avatar">{user.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <strong>{user.name}</strong>
                <span>{user.username} - {user.role}</span>
                <span>{user.role === "owner" ? "All branches" : branches.find((branch) => branch.id === user.branchId)?.name ?? "No branch"}</span>
              </div>
            </article>
          ))}
          {users.length === 0 && (
            <div className="empty-state helpful-empty">
              <strong>No staff accounts yet</strong>
              <span>After creating branches, add employees and assign their working location.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
