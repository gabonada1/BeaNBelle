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
            <h1>Welcome back</h1>
          </div>
        </div>

        <div className="login-copy">
          <p className="login-intro">Sign in to record sales, check stock, and handle returns.</p>
          <ul className="login-notes" aria-label="What you can do after logging in">
            <li>Sales are big and simple.</li>
            <li>Branch information is shown for you.</li>
            <li>Every screen explains the next step.</li>
          </ul>
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
          <span>Simple workflow</span>
          <strong>Start with the task card</strong>
          <p>Choose a task, fill the highlighted fields, then press the main button at the bottom.</p>
          <div className="visual-stat-grid">
            <div className="visual-stat">
              <span>1</span>
              <strong>Pick branch</strong>
            </div>
            <div className="visual-stat">
              <span>2</span>
              <strong>Enter details</strong>
            </div>
            <div className="visual-stat">
              <span>3</span>
              <strong>Save record</strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
