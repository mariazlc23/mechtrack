import React, { useMemo } from "react";
import { useData } from "../lib/DataContext";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle, Clock, Wrench, ChevronRight } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

function statusBadge(s) {
  const map = {
    "Completed":   "badge-success",
    "In Progress":  "badge-info",
    "Pending":    "badge-warn",
    "Cancelled":    "badge-danger",
  };
  return <span className={`badge ${map[s] || "badge-neutral"}`}>{s}</span>;
}

function priorityBadge(p) {
  const map = { High: "badge-danger", Medium: "badge-warn", Low: "badge-neutral" };
  return <span className={`badge ${map[p] || "badge-neutral"}`}>{p}</span>;
}

export default function Dashboard() {
  const { workOrders, equipment, timeEntries, mechanics, loading } = useData();

  const stats = useMemo(() => {
    const open    = workOrders.filter(w => w.status !== "Completed" && w.status !== "Cancelled").length;
    const urgent  = workOrders.filter(w => w.priority === "High" && w.status !== "Completed").length;
    const active  = equipment.filter(e => e.status === "Active").length;
    const clocked = timeEntries.filter(t => t.clockIn && !t.clockOut).length;
    const totalHrs = timeEntries.reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);
    return { open, urgent, active, clocked, totalHrs: totalHrs.toFixed(1) };
  }, [workOrders, equipment, timeEntries]);

  const recentOrders = useMemo(
    () => [...workOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6),
    [workOrders]
  );

  const activeEntries = useMemo(
    () => timeEntries.filter(t => t.clockIn && !t.clockOut),
    [timeEntries]
  );

  if (loading) return <div className="empty-state"><p>Cargando datos…</p></div>;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {format(new Date(), "EEEE, MMMM d yyyy")}
          </p>
        </div>
        <Link to="/orders" className="btn btn-primary">
          + New Order
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid-4 mb-24">
        <div className="stat-card" style={{ "--accent-line": "var(--warn)" }}>
          <span className="stat-label">Open Orders</span>
          <span className="stat-value">{stats.open}</span>
          <span className="stat-sub">{stats.urgent} urgent</span>
        </div>
        <div className="stat-card" style={{ "--accent-line": "var(--danger)" }}>
          <span className="stat-label">High Priority</span>
          <span className="stat-value">{stats.urgent}</span>
          <span className="stat-sub">need attention</span>
        </div>
        <div className="stat-card" style={{ "--accent-line": "var(--success)" }}>
          <span className="stat-label">Active Equipment</span>
          <span className="stat-value">{stats.active}</span>
          <span className="stat-sub">of {equipment.length} total</span>
        </div>
        <div className="stat-card" style={{ "--accent-line": "var(--info)" }}>
          <span className="stat-label">Total Hours</span>
          <span className="stat-value">{stats.totalHrs}</span>
          <span className="stat-sub">{stats.clocked} mechanics active now</span>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20, alignItems: "start" }}>
        {/* Recent work orders */}
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <span className="card-title">Recent Work Orders</span>
            <Link to="/orders" className="btn btn-ghost btn-sm">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Equipment</th>
                  <th>Work</th>
                  <th>Mechanic</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(wo => (
                  <tr key={wo.id}>
                    <td><span className="text-mono text-muted" style={{ fontSize: 12 }}>{wo.id}</span></td>
                    <td style={{ fontWeight: 500 }}>{wo.equipmentName}</td>
                    <td style={{ color: "var(--text2)" }}>{wo.title}</td>
                    <td>{wo.mechanicName}</td>
                    <td>{priorityBadge(wo.priority)}</td>
                    <td>{statusBadge(wo.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active clock-ins */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Mechanics Working Now</span>
            <span className="badge badge-success pulse">{activeEntries.length} active</span>
          </div>
          {activeEntries.length === 0 ? (
            <div className="empty-state" style={{ padding: "30px 0" }}>
              <Clock size={32} />
              <p>No active time entries</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeEntries.map(te => (
                <div key={te.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px",
                  background: "var(--bg3)",
                  borderRadius: "var(--radius)",
                  borderLeft: "2px solid var(--success)"
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{te.mechanicName}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
                      Order: {te.workOrderId}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="pulse" style={{ color: "var(--success)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
                      ● ACTIVE
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>
                      since {te.clockIn?.split(" ")[1]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Equipment alerts */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Equipment Alerts</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {equipment.filter(e => e.status === "In Repair" || e.status === "Inactive").map(eq => (
              <div key={eq.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px",
                background: "var(--bg3)",
                borderRadius: "var(--radius)",
                borderLeft: `2px solid ${eq.status === "In Repair" ? "var(--warn)" : "var(--danger)"}`
              }}>
                <AlertTriangle size={16} color={eq.status === "In Repair" ? "var(--warn)" : "var(--danger)"} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{eq.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
                    {eq.status} · {eq.type}
                  </div>
                </div>
              </div>
            ))}
            {equipment.filter(e => e.status === "In Repair" || e.status === "Inactive").length === 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--success)", fontSize: 13 }}>
                <CheckCircle size={16} />
                All equipment operational
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
