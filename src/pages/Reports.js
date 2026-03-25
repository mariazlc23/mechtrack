import React, { useMemo } from "react";
import { useData } from "../lib/DataContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#f5a623", "#4a9eff", "#3dca7e", "#e05353", "#a78bfa", "#f472b6"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 6, padding: "8px 14px", fontSize: 12, fontFamily: "var(--font-mono)" }}>
      <div style={{ color: "var(--text2)", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function Reports() {
  const { workOrders, timeEntries, equipment, mechanics, loading } = useData();

  // Hours per mechanic
  const hoursByMechanic = useMemo(() => {
    const map = {};
    timeEntries.forEach(t => {
      if (!t.mechanicName || !t.hours) return;
      map[t.mechanicName] = (map[t.mechanicName] || 0) + (parseFloat(t.hours) || 0);
    });
    return Object.entries(map)
      .map(([name, hours]) => ({ name: name.split(" ")[0], hours: parseFloat(hours.toFixed(1)) }))
      .sort((a, b) => b.hours - a.hours);
  }, [timeEntries]);

  // Orders by status
  const ordersByStatus = useMemo(() => {
    const map = {};
    workOrders.forEach(wo => { map[wo.status] = (map[wo.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [workOrders]);

  // Orders by equipment (top 5)
  const ordersByEquipment = useMemo(() => {
    const map = {};
    workOrders.forEach(wo => { map[wo.equipmentName] = (map[wo.equipmentName] || 0) + 1; });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name: name.split(" ").slice(0, 2).join(" "), count }));
  }, [workOrders]);

  // Summary metrics
  const metrics = useMemo(() => {
    const totalHrs    = timeEntries.reduce((s, t) => s + (parseFloat(t.hours) || 0), 0);
    const billableHrs = timeEntries.filter(t => t.billable === "true").reduce((s, t) => s + (parseFloat(t.hours) || 0), 0);
    const completed   = workOrders.filter(w => w.status === "Completed").length;
    const completion  = workOrders.length ? Math.round((completed / workOrders.length) * 100) : 0;
    const mobOrders   = workOrders.filter(w => w.mobilization === "true");
    const mobMins     = mobOrders.reduce((s, w) => {
      const t = parseFloat(w.mobTime) || 0;
      return s + (w.mobUnit === "hours" ? t * 60 : t);
    }, 0);
    const mobHrs = (mobMins / 60).toFixed(1);
    return { totalHrs: totalHrs.toFixed(1), billableHrs: billableHrs.toFixed(1), completed, completion, mobOrders: mobOrders.length, mobHrs };
  }, [workOrders, timeEntries]);

  if (loading) return <div className="empty-state"><p>Loading…</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Shop performance analysis</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4 mb-24">
        <div className="stat-card" style={{ "--accent-line": "var(--accent)" }}>
          <span className="stat-label">Total Hours</span>
          <span className="stat-value">{metrics.totalHrs}</span>
          <span className="stat-sub">recorded</span>
        </div>
        <div className="stat-card" style={{ "--accent-line": "var(--success)" }}>
          <span className="stat-label">Billable Hours</span>
          <span className="stat-value">{metrics.billableHrs}</span>
          <span className="stat-sub">billable hours</span>
        </div>
        <div className="stat-card" style={{ "--accent-line": "var(--info)" }}>
          <span className="stat-label">Completed Orders</span>
          <span className="stat-value">{metrics.completed}</span>
          <span className="stat-sub">of {workOrders.length} total</span>
        </div>
        <div className="stat-card" style={{ "--accent-line": "var(--success)" }}>
          <span className="stat-label">Completion Rate</span>
          <span className="stat-value">{metrics.completion}%</span>
          <span className="stat-sub">overall efficiency</span>
        </div>
      </div>

      {/* Mobilization summary */}
      {metrics.mobOrders > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "14px 20px", marginBottom: 24,
          background: "rgba(245,166,35,0.06)",
          border: "1px solid rgba(245,166,35,0.2)",
          borderRadius: "var(--radius-lg)",
          flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>🚛 Mobilization Summary</span>
          <span style={{ color: "var(--text2)", fontSize: 13 }}>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{metrics.mobOrders}</span> orders required mobilization
          </span>
          <span style={{ color: "var(--text2)", fontSize: 13 }}>
            Total mobilization time: <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", fontWeight: 600 }}>{metrics.mobHrs} hrs</span>
          </span>
        </div>
      )}

      <div className="grid-2" style={{ gap: 20, alignItems: "start" }}>
        {/* Hours by mechanic */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Hours by Mechanic</span>
          </div>
          {hoursByMechanic.length === 0
            ? <div className="empty-state" style={{ padding: 30 }}><p>No data</p></div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hoursByMechanic} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fill: "var(--text3)", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text3)", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" name="Hours" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Orders by status pie */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Orders by Status</span>
          </div>
          {ordersByStatus.length === 0
            ? <div className="empty-state" style={{ padding: 30 }}><p>No data</p></div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(val) => <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text2)" }}>{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Orders by equipment */}
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <span className="card-title">Top Equipment by Orders</span>
          </div>
          {ordersByEquipment.length === 0
            ? <div className="empty-state" style={{ padding: 30 }}><p>No data</p></div>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ordersByEquipment} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                  <XAxis type="number" tick={{ fill: "var(--text3)", fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={130} tick={{ fill: "var(--text2)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Orders" fill="var(--info)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Mechanic table */}
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <span className="card-title">Summary by Mechanic</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mechanic</th>
                  <th>Role</th>
                  <th>Assigned Orders</th>
                  <th>Completed</th>
                  <th>Total Hours</th>
                  <th>Billable Hrs</th>
                </tr>
              </thead>
              <tbody>
                {mechanics.map(m => {
                  const myOrders    = workOrders.filter(wo => wo.mechanicId === m.id);
                  const myCompleted = myOrders.filter(wo => wo.status === "Completed").length;
                  const myEntries   = timeEntries.filter(t => t.mechanicId === m.id && t.hours);
                  const myHrs       = myEntries.reduce((s, t) => s + (parseFloat(t.hours) || 0), 0).toFixed(1);
                  const myBillable  = myEntries.filter(t => t.billable === "true").reduce((s, t) => s + (parseFloat(t.hours) || 0), 0).toFixed(1);
                  return (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 500 }}>{m.name}</td>
                      <td><span className="badge badge-neutral">{m.role}</span></td>
                      <td style={{ fontFamily: "var(--font-mono)", textAlign: "center" }}>{myOrders.length}</td>
                      <td style={{ fontFamily: "var(--font-mono)", textAlign: "center", color: "var(--success)" }}>{myCompleted}</td>
                      <td style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", fontWeight: 600 }}>{myHrs}h</td>
                      <td style={{ fontFamily: "var(--font-mono)", color: "var(--success)" }}>{myBillable}h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
