import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LoginPage } from "./features/auth/LoginPage.jsx";
import { DashboardLayout } from "./layouts/DashboardLayout.jsx";
import { DashboardPage } from "./features/dashboard/DashboardPage.jsx";
import { SalesDashboard } from "./features/sales/SalesDashboard.jsx";
import { InventoryPage } from "./features/inventory/InventoryPage.jsx";
import { StockPage } from "./features/stocks/StockPage.jsx";
import { ReportsPage } from "./features/reports/ReportsPage.jsx";
import { ReturnsPage } from "./features/returns/ReturnsPage.jsx";
import { BranchesPage } from "./features/branches/BranchesPage.jsx";
import { ExpensesPage } from "./features/expenses/ExpensesPage.jsx";
import { UsersPage } from "./features/users/UsersPage.jsx";
import { loginUser } from "./services/authApi.js";
import {
  createBranch,
  createExpense,
  createProduct,
  createRefund,
  createSale,
  createStockMovement,
  createUser,
  getBranches,
  getSummary,
  getUsers
} from "./services/storeApi.js";

const baseTabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "sales", label: "Sales" },
  { id: "stocks", label: "Stocks" },
  { id: "inventory", label: "Inventory" },
  { id: "returns", label: "Returns" },
  { id: "reports", label: "Reports" }
];

const ownerTabs = [
  { id: "expenses", label: "Expenses" },
  { id: "branches", label: "Branches" },
  { id: "users", label: "Users" }
];

const allTabIds = [...baseTabs, ...ownerTabs].map((tab) => tab.id);

const emptySummary = {
  branchId: "all",
  branchName: "All Branches",
  inventory: [],
  recentSales: [],
  refunds: [],
  stockMovements: [],
  salesByBranch: [],
  totalItems: 0,
  totalExpenses: 0,
  totalPurchases: 0,
  totalRevenue: 0,
  totalSales: 0,
  netProfit: 0,
  netRevenue: 0,
  totalStock: 0,
  grossProfit: 0,
  expenses: [],
  recentExpenses: []
};

export default function App() {
  const [session, setSession] = useState(loadSessionFromStorage);
  const [activeTab, setActiveTab] = useState(getTabFromHash());
  const [selectedBranchId, setSelectedBranchId] = useState("all");
  const [branches, setBranches] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [users, setUsers] = useState([]);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [pageError, setPageError] = useState("");
  const tabs = useMemo(
    () => (session?.role === "admin" ? [...baseTabs, ...ownerTabs] : baseTabs),
    [session?.role]
  );

  const refreshStore = useCallback(async (branchId = selectedBranchId) => {
    if (!session?.token) {
      return;
    }

    setPageError("");

    try {
      const [branchesResult, summaryResult] = await Promise.all([
        getBranches(session.token),
        getSummary(session.token, branchId)
      ]);

      setBranches(branchesResult.branches);
      setSummary(summaryResult.summary);
    } catch (error) {
      setPageError(error.message);
    }
  }, [selectedBranchId, session?.token]);

  const loadUsers = useCallback(async () => {
    if (!session?.token || session.role !== "admin") {
      return;
    }

    const result = await getUsers(session.token);
    setUsers(result.users);
  }, [session?.role, session?.token]);

  useEffect(() => {
    refreshStore();
  }, [refreshStore]);

  useEffect(() => {
    if (session) {
      window.localStorage.setItem("bea-n-belle-session", JSON.stringify(session));
    } else {
      window.localStorage.removeItem("bea-n-belle-session");
    }
  }, [session]);

  useEffect(() => {
    function handleHashChange() {
      setActiveTab(getTabFromHash());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (!session) {
    return (
      <LoginPage
        error={loginError}
        isLoading={isLoggingIn}
        onLogin={handleLogin}
      />
    );
  }

  async function handleLogin(credentials) {
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const { token, user } = await loginUser(credentials);
      const employeeSession = {
        token,
        branchId: user.branchId ?? "all",
        branchName: user.branchName ?? "All Branches",
        role: user.role === "owner" ? "admin" : user.role,
        userName: user.name
      };

      setSession(employeeSession);
      setSelectedBranchId(employeeSession.role === "admin" ? "all" : employeeSession.branchId);
      changeTab("dashboard");
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleRecordSale(sale) {
    const result = await createSale(session.token, sale);
    setLastReceipt(result.sale);
    await refreshStore(selectedBranchId);
  }

  function handleBranchChange(branchId) {
    if (session.role !== "admin") {
      setSelectedBranchId(session.branchId);
      refreshStore(session.branchId);
      return;
    }

    setSelectedBranchId(branchId);
    refreshStore(branchId);
  }

  async function handleAddStock(stockMovement) {
    await createStockMovement(session.token, stockMovement);
    await refreshStore(selectedBranchId);
  }

  async function handleAddProduct(product) {
    await createProduct(session.token, product);
    await refreshStore(selectedBranchId);
  }

  async function handleRefund(refund) {
    await createRefund(session.token, refund);
    await refreshStore(selectedBranchId);
  }

  async function handleAddBranch(branch) {
    await createBranch(session.token, branch);
    await refreshStore(selectedBranchId);
  }

  async function handleAddExpense(expense) {
    await createExpense(session.token, expense);
    await refreshStore(selectedBranchId);
  }

  async function handleAddUser(user) {
    await createUser(session.token, user);
    await loadUsers();
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      branches={branches}
      selectedBranchId={selectedBranchId}
      session={session}
      tabs={tabs}
      totalBranches={branches.length}
      onBranchChange={handleBranchChange}
      onLogout={() => {
        setSession(null);
        setBranches([]);
        setSummary(emptySummary);
        setUsers([]);
        changeTab("dashboard");
      }}
      onTabChange={changeTab}
    >
      {pageError && <p className="error-message">{pageError}</p>}
      {activeTab === "dashboard" && (
        <DashboardPage
          branches={branches}
          session={session}
          summary={summary}
        />
      )}
      {activeTab === "sales" && (
        <SalesDashboard
          session={session}
          summary={summary}
          selectedBranchId={selectedBranchId}
          lastReceipt={lastReceipt}
          onRecordSale={handleRecordSale}
        />
      )}
      {activeTab === "stocks" && (
        <StockPage
          branches={branches}
          session={session}
          summary={summary}
          onRecordSale={handleRecordSale}
        />
      )}
      {activeTab === "inventory" && (
        <InventoryPage
          branches={branches}
          session={session}
          stockHistory={summary.stockMovements}
          summary={summary}
          onAddProduct={handleAddProduct}
          onAddStock={handleAddStock}
        />
      )}
      {activeTab === "returns" && (
        <ReturnsPage
          branches={branches}
          refundRecords={summary.refunds}
          sales={summary.recentSales}
          session={session}
          onRefund={handleRefund}
        />
      )}
      {activeTab === "reports" && (
        <ReportsPage
          refundRecords={summary.refunds}
          session={session}
          stockHistory={summary.stockMovements}
          summary={summary}
        />
      )}
      {activeTab === "expenses" && (
        <ExpensesPage
          branches={branches}
          selectedBranchId={selectedBranchId}
          session={session}
          summary={summary}
          onAddExpense={handleAddExpense}
        />
      )}
      {activeTab === "branches" && (
        <BranchesPage branches={branches} onAddBranch={handleAddBranch} />
      )}
      {activeTab === "users" && (
        <UsersPage
          branches={branches}
          users={users}
          onAddUser={handleAddUser}
          onLoadUsers={loadUsers}
        />
      )}
    </DashboardLayout>
  );

  function changeTab(tabId) {
    const nextTab = allTabIds.includes(tabId) ? tabId : "dashboard";

    setActiveTab(nextTab);

    if (window.location.hash !== `#${nextTab}`) {
      window.location.hash = nextTab;
    }
  }
}

function loadSessionFromStorage() {
  try {
    const storedSession = window.localStorage.getItem("bea-n-belle-session");

    return storedSession ? JSON.parse(storedSession) : null;
  } catch {
    return null;
  }
}

function getTabFromHash() {
  const tabId = window.location.hash.replace(/^#/, "");
  return allTabIds.includes(tabId) ? tabId : "dashboard";
}
