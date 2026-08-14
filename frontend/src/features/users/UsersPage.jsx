import React, { useEffect, useState } from "react";

export function UsersPage({ branches, onAddUser, onLoadUsers, users, onUpdateUser, onDeleteUser, session }) {
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "employee",
    branchId: branches[0]?.id ?? ""
  });
  const [editingUserId, setEditingUserId] = useState("");
  const [editMessage, setEditMessage] = useState("");
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
      if (editingUserId) {
        const update = {
          name: form.name,
          role: form.role
        };

        if (form.role !== "owner") update.branchId = form.branchId;
        if (form.password) update.password = form.password;

        await onUpdateUser(editingUserId, update);
        setEditMessage("User updated.");
        setEditingUserId("");
      } else {
        await onAddUser(form);
        setMessage("User account created.");
      }

      setForm({
        name: "",
        username: "",
        password: "",
        role: "employee",
        branchId: branches[0]?.id ?? ""
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function startEdit(user) {
    setEditingUserId(user._id ?? user.id ?? "");
    setForm({
      name: user.name ?? "",
      username: user.username ?? "",
      password: "",
      role: user.role ?? "employee",
      branchId: user.branchId ?? branches[0]?.id ?? ""
    });
    setMessage("");
    setError("");
    setEditMessage("");
  }

  async function handleDelete(user) {
    if (!onDeleteUser) return;
    if (user.username === session.userName) {
      setError("You cannot delete the currently logged-in user.");
      return;
    }

    const confirmed = window.confirm(`Delete user ${user.name} (${user.username})?`);
    if (!confirmed) return;

    try {
      await onDeleteUser(user._id ?? user.id);
      setEditMessage("User deleted.");
    } catch (err) {
      setError(err.message);
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
            <input placeholder={editingUserId ? "Leave blank to keep current" : "Temporary password"} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="primary-button" disabled={branches.length === 0 && form.role !== "owner"} type="submit">{editingUserId ? 'Save user' : 'Create user'}</button>
            {editingUserId && (
              <button className="secondary-button" type="button" onClick={() => { setEditingUserId(""); setForm({ name: "", username: "", password: "", role: "employee", branchId: branches[0]?.id ?? "" }); setEditMessage(""); }}>Cancel</button>
            )}
          </div>
        </form>
        {message && <p className="success-message">{message}</p>}
        {editMessage && <p className="success-message">{editMessage}</p>}
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
            <article className="entity-card" key={user.id ?? user._id}>
              <div className="entity-avatar">{(user.name ?? "").slice(0, 2).toUpperCase()}</div>
              <div>
                <strong>{user.name}</strong>
                <span>{user.username} - {user.role}</span>
                <span>{user.role === "owner" ? "All branches" : branches.find((branch) => branch.id === user.branchId)?.name ?? "No branch"}</span>
              </div>
              <div className="entity-actions">
                <button className="secondary-button" type="button" onClick={() => startEdit(user)}>Edit</button>
                {onDeleteUser && session?.role === "admin" && (
                  <button className="icon-chip danger" type="button" onClick={() => handleDelete(user)}>Delete</button>
                )}
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
