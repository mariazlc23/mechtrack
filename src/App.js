import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { DataProvider, useData } from "./lib/DataContext";
import Dashboard from "./pages/Dashboard";
import WorkOrders from "./pages/WorkOrders";
import Equipment from "./pages/Equipment";
import TimeTracking from "./pages/TimeTracking";
import Reports from "./pages/Reports";
import Parts from "./pages/Parts";
import { getAuthToken, initGoogleAuth } from "./lib/sheets";
import {
  LayoutDashboard, ClipboardList, Wrench,
  Timer, BarChart2, Settings, Package, LogIn, LogOut, CheckCircle
} from "lucide-react";
import "./index.css";

const NAV = [
  { to: "/",          icon: LayoutDashboard, label: "Dashboard" },
  { to: "/orders",    icon: ClipboardList,   label: "Orders" },
  { to: "/equipment", icon: Wrench,          label: "Equipment" },
  { to: "/time",      icon: Timer,           label: "Time" },
  { to: "/parts",     icon: Package,         label: "Parts" },
  { to: "/reports",   icon: BarChart2,       label: "Reports" },
];

function Shell({ children }) {
  const data     = useData();
  const isDemo   = data?.isDemo ?? true;
  const [authed,    setAuthed]   = useState(!!getAuthToken());
  const [signing,   setSigning]  = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!isDemo && !authed) {
      const t = setTimeout(() => doSignIn(), 1500);
      return () => clearTimeout(t);
    }
  }, [isDemo]);

  const doSignIn = () => {
    setAuthError("");
    setSigning(true);
    initGoogleAuth(
      (token) => {
        setSigning(false);
        if (token) { setAuthed(true); setAuthError(""); }
      },
      (err) => {
        setSigning(false);
        setAuthError(String(err));
      }
    );
  };

  const doSignOut = () => {
    sessionStorage.removeItem("gapi_token");
    setAuthed(false);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-logo"><Wrench size={20} />MechTrack</div>
        <span className="topbar-tag">v1.0</span>
        {isDemo && <span className="topbar-demo-badge">DEMO MODE</span>}
        <div className="topbar-spacer" />

        {!isDemo && (
          authed ? (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <CheckCircle size={14} color="var(--success)" />
              <span style={{ fontSize:12, color:"var(--success)", fontFamily:"var(--font-mono)" }}>Connected</span>
              <button className="btn btn-ghost btn-sm" onClick={doSignOut} style={{ marginLeft:4 }}>
                <LogOut size={13} /> Sign out
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={doSignIn} disabled={signing} style={{ opacity: signing ? 0.7 : 1 }}>
              <LogIn size={13} />
              {signing ? "Opening Google..." : "Sign in with Google"}
            </button>
          )
        )}

        <div className="topbar-user" style={{ marginLeft:12 }}>
          <div className="topbar-avatar">MT</div>
          <span style={{ fontSize:13, color:"var(--text2)" }}>{isDemo ? "Demo User" : "MechTrack"}</span>
        </div>
      </header>

      {!isDemo && !authed && (
        <div style={{
          gridColumn:"1 / -1",
          background:"rgba(224,83,83,0.1)",
          border:"1px solid rgba(224,83,83,0.3)",
          padding:"10px 24px",
          display:"flex", alignItems:"center", gap:12, fontSize:13, flexWrap:"wrap"
        }}>
          <span style={{ color:"var(--danger)" }}>
            ⚠ Not signed in — you can view data but cannot save records.
          </span>
          {authError && <span style={{ color:"var(--text3)", fontSize:12 }}>({authError})</span>}
          <button className="btn btn-primary btn-sm" onClick={doSignIn} disabled={signing} style={{ marginLeft:"auto" }}>
            <LogIn size={13} /> {signing ? "Opening Google..." : "Sign in with Google"}
          </button>
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-section">Navigation</div>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            <Icon size={16} />{label}
          </NavLink>
        ))}
        <div className="sidebar-section" style={{ marginTop:"auto" }}>System</div>
        <NavLink to="/settings" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
          <Settings size={16} /> Settings
        </NavLink>
      </aside>

      <main className="main-content">{children}</main>

      <nav className="mobile-nav">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => isActive ? "active" : ""}>
            <Icon size={20} />{label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={
            <Shell>
              <Routes>
                <Route path="/"          element={<Dashboard />} />
                <Route path="/orders"    element={<WorkOrders />} />
                <Route path="/equipment" element={<Equipment />} />
                <Route path="/time"      element={<TimeTracking />} />
                <Route path="/parts"     element={<Parts />} />
                <Route path="/reports"   element={<Reports />} />
                <Route path="/settings"  element={<SettingsPage />} />
              </Routes>
            </Shell>
          } />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

function SettingsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Connect your Google Sheet</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-header">
          <span className="card-title">Google Sheets API</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <p style={{ fontSize:13, color:"var(--text2)", lineHeight:1.7 }}>
            To connect your spreadsheet, create a <code style={{ fontFamily:"var(--font-mono)", background:"var(--bg3)", padding:"2px 6px", borderRadius:3 }}>.env</code> file in the project root with these variables:
          </p>
          <pre style={{ background:"var(--bg3)", padding:16, borderRadius:6, fontSize:12, fontFamily:"var(--font-mono)", color:"var(--accent)", overflowX:"auto" }}>
{`REACT_APP_SPREADSHEET_ID=your_spreadsheet_id
REACT_APP_GOOGLE_API_KEY=your_api_key
REACT_APP_GOOGLE_CLIENT_ID=your_client_id`}
          </pre>
          <div style={{ background:"rgba(74,158,255,0.08)", border:"1px solid rgba(74,158,255,0.2)", borderRadius:6, padding:14, fontSize:13, color:"var(--info)" }}>
            <strong>Required tabs in your Sheet:</strong> Mechanics · Equipment · WorkOrders · TimeEntries · Parts
          </div>
          <a href="https://developers.google.com/sheets/api/quickstart/js" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ alignSelf:"flex-start" }}>
            View Google Sheets API docs →
          </a>
        </div>
      </div>
    </div>
  );
}
