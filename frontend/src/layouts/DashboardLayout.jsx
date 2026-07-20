import React from "react";

export function DashboardLayout({
  activeTab,
  branches,
  children,
  selectedBranchId,
  session,
  tabs,
  totalBranches,
  onBranchChange,
  onLogout,
  onTabChange
}) {
  const activeTabInfo = getTabInfo(activeTab);
  const selectedBranchName = branches.find((branch) => branch.id === selectedBranchId)?.name;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">BB</div>
          <div>
            <p className="eyebrow">Bea n Belle</p>
            <h1>Store Desk</h1>
          </div>
        </div>

        <nav className="nav-stack" aria-label="Main navigation">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab.id ? "nav-item active" : "nav-item"}
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              type="button"
            >
              <span className="nav-icon" aria-hidden="true">
                {getTabIcon(tab.id)}
              </span>
              <strong>{tab.label}</strong>
            </button>
          ))}
        </nav>

        <section className="sidebar-guide" aria-label="How to use this app">
          <p className="eyebrow">Quick guide</p>
          <ol>
            <li>Pick the right branch.</li>
            <li>Choose the task you need.</li>
            <li>Fill the form and save.</li>
          </ol>
        </section>

        <div className="user-box">
          <span>{session.role === "admin" ? "Owner access - all branches" : `Employee - ${session.branchName}`}</span>
          <strong>{session.userName}</strong>
          <button className="ghost-button" onClick={onLogout} type="button">
            Log out
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="topbar-copy-block">
            <p className="eyebrow">{activeTabInfo.eyebrow}</p>
            <h2>{activeTabInfo.title}</h2>
            <p className="topbar-copy">{activeTabInfo.description}</p>
          </div>
          <label className="topbar-search field" aria-label="Search">
            <span className="sr-only">Search</span>
            <input placeholder="Search (Ctrl+/)" type="search" />
          </label>
          <div className="topbar-actions">
            <div className="session-chip" title={session.userName}>
              <span aria-hidden="true">{session.userName.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{session.userName}</strong>
                <small>{session.role === "admin" ? "Owner access" : session.branchName}</small>
              </div>
            </div>
            {["branches", "users"].includes(activeTab) ? (
              <div className="scope-pill">
                <span>{totalBranches}</span>
                branches
              </div>
            ) : (
              <label className="field compact-field">
                <span>Branch filter</span>
                <select
                  value={selectedBranchId}
                  onChange={(event) => onBranchChange(event.target.value)}
                  disabled={session.role !== "admin" || branches.length === 0}
                >
                  {session.role === "admin" && <option value="all">All branches</option>}
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <small>{branches.length ? selectedBranchName ?? "All branch data" : "Create a branch to begin"}</small>
              </label>
            )}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

function getTabIcon(tabId) {
  const icons = {
    dashboard: "OV",
    sales: "SA",
    stocks: "ST",
    inventory: "IN",
    returns: "RT",
    reports: "RP",
    expenses: "EX",
    branches: "BR",
    users: "US"
  };

  return icons[tabId] ?? tabId.slice(0, 1).toUpperCase();
}

function getTabInfo(tabId) {
  const info = {
    dashboard: {
      eyebrow: "Store overview",
      title: "Dashboard",
      description: "Monitor revenue, purchases, stock, and branch activity in one place."
    },
    sales: {
      eyebrow: "Point of sale",
      title: "Sales dashboard",
      description: "Record purchases, track recent sales, and review branch performance."
    },
    stocks: {
      eyebrow: "Stock counter",
      title: "Stocks",
      description: "Check available item quantities and record sold stock from a branch."
    },
    inventory: {
      eyebrow: "Catalog and stock-in",
      title: "Inventory",
      description: "Add products, receive stock, and review movement history."
    },
    returns: {
      eyebrow: "Customer service",
      title: "Returns",
      description: "Refund sales and return item quantities back into branch stock."
    },
    reports: {
      eyebrow: "Business overview",
      title: "Reports",
      description: "View totals, best-selling items, low stock, and branch performance."
    },
    expenses: {
      eyebrow: "Business outflow",
      title: "Expenses",
      description: "Record salary and bills, then review how they affect revenue and profit."
    },
    branches: {
      eyebrow: "Owner setup",
      title: "Branches",
      description: "Create and manage the store locations that users and stock belong to."
    },
    users: {
      eyebrow: "Owner setup",
      title: "Users",
      description: "Create staff accounts and assign each employee to the right branch."
    }
  };

  return info[tabId] ?? info.sales;
}
