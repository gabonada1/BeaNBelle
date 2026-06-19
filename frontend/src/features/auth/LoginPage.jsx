import React, { useState } from "react";

export function LoginPage({ error, isLoading, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    onLogin({
      username: username.trim(),
      password
    });
  }

  return (
    <main className="login-screen">
      <section className="login-panel">
        <div className="brand-block">
          <div className="brand-mark">BB</div>
          <div>
            <p className="eyebrow">Bea n Belle</p>
            <h1>Employee Login</h1>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Username</span>
            <input
              autoComplete="username"
              placeholder="Enter username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              placeholder="Enter password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && <p className="error-message">{error}</p>}

          <button className="primary-button" type="submit">
            {isLoading ? "Signing in..." : "Open dashboard"}
          </button>
        </form>
      </section>

      <section className="login-visual" aria-label="Store system preview">
        <div className="receipt-card">
          <span>Today</span>
          <strong>Employee Tools</strong>
          <p>Record sold items, check stocks, and review branch sales in one workspace.</p>
        </div>
      </section>
    </main>
  );
}
