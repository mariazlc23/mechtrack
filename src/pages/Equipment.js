import React, { useState, useMemo } from "react";
import { useData } from "../lib/DataContext";
import { Plus, X, Search, AlertTriangle, CheckCircle, Clock, Wrench, Package, Truck, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_OPTIONS = ["Active", "In Repair", "Inactive"];
const TYPE_OPTIONS   = ["Excavator", "Skid Steer", "Compactor", "Forklift", "Trailer", "Generator", "Air Compressor", "Air Scrubber", "Saw", "Drill", "Hydraulic Breaker", "Breaker", "Vacuum", "Fan", "Concrete", "Dumper", "Attachment", "Other"];

function statusBadge(s) {
  const map = { "Active": "badge-success", "In Repair": "badge-warn", "Inactive": "badge-danger" };
  return <span className={"badge " + (map[s] || "badge-neutral")}>{s}</span>;
}
function woBadge(s) {
  const map = { "Completed": "badge-success", "In Progress": "badge-info", "Pending": "badge-warn", "Cancelled": "badge-danger" };
  return <span className={"badge " + (map[s] || "badge-neutral")}>{s}</span>;
}

// ── Equipment History Modal ──────────────────────────────────
function HistoryModal({ eq, workOrders, timeEntries, parts, onClose }) {
  const [tab, setTab] = useState("orders");

  const eqOrders = useMemo(() =>
    [...workOrders.filter(w => w.equipmentId === eq.id)]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [workOrders, eq.id]
  );

  const eqParts = useMemo(() =>
    [...parts.filter(p => p.equipmentId === eq.id)]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [parts, eq.id]
  );

  const eqTime = useMemo(() =>
    [...timeEntries.filter(t => {
      const wo = workOrders.find(w => w.id === t.workOrderId);
      return wo && wo.equipmentId === eq.id;
    })].sort((a, b) => new Date(b.clockIn) - new Date(a.clockIn)),
    [timeEntries, workOrders, eq.id]
  );

  const totalHours = eqTime.reduce((s, t) => s + (parseFloat(t.hours) || 0), 0).toFixed(1);
  const totalParts = eqParts.reduce((s, p) => s + (parseFloat(p.totalCost) || 0), 0).toFixed(2);
  const mobOrders  = eqOrders.filter(w => w.mobilization === "true");

  const tabStyle = (t) => ({
    padding: "8px 16px",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.5px",
    background: tab === t ? "var(--accent)" : "transparent",
    color: tab === t ? "#000" : "var(--text2)",
    border: "1px solid " + (tab === t ? "var(--accent)" : "var(--border2)"),
    borderRadius: "var(--radius)",
    cursor: "pointer",
    fontWeight: tab === t ? 600 : 400,
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 720, maxHeight: "88vh" }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{eq.name}</div>
            <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text3)", marginTop: 3 }}>
              [{eq.id}] · {eq.type} · {statusBadge(eq.status)}
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Summary stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-head)", color: "var(--text)" }}>{eqOrders.length}</div>
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text3)", letterSpacing: 1 }}>WORK ORDERS</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-head)", color: "var(--accent)" }}>{totalHours}h</div>
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text3)", letterSpacing: 1 }}>LABOR HOURS</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-head)", color: "var(--info)" }}>${totalParts}</div>
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text3)", letterSpacing: 1 }}>PARTS COST</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-head)", color: "var(--warn)" }}>{mobOrders.length}</div>
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text3)", letterSpacing: 1 }}>MOBILIZATIONS</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, padding: "16px 24px 0", borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
          <button style={tabStyle("orders")} onClick={() => setTab("orders")}>
            Work Orders ({eqOrders.length})
          </button>
          <button style={tabStyle("time")} onClick={() => setTab("time")}>
            Time ({eqTime.length})
          </button>
          <button style={tabStyle("parts")} onClick={() => setTab("parts")}>
            Parts ({eqParts.length})
          </button>
        </div>

        {/* Tab content */}
        <div style={{ overflowY: "auto", maxHeight: 420, padding: "0 0 16px" }}>

          {/* ── Work Orders tab ── */}
          {tab === "orders" && (
            <div>
              {eqOrders.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <Wrench size={32} />
                  <p>No work orders yet</p>
                </div>
              ) : (
                eqOrders.map(wo => (
                  <div key={wo.id} style={{
                    padding: "14px 24px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: 3,
                      alignSelf: "stretch",
                      borderRadius: 2,
                      background: wo.status === "Completed" ? "var(--success)" : wo.status === "In Progress" ? "var(--info)" : "var(--warn)",
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{wo.title}</div>
                          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text3)", marginTop: 2 }}>{wo.id}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {woBadge(wo.status)}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text3)", flexWrap: "wrap" }}>
                        <span>📅 {wo.createdAt?.split(" ")[0]}</span>
                        {wo.completedAt && <span>✓ {wo.completedAt?.split(" ")[0]}</span>}
                        <span>👤 {wo.mechanicName}</span>
                        {wo.mobilization === "true" && (
                          <span style={{ color: "var(--accent)" }}>
                            🚛 {wo.mobTime} {wo.mobUnit}
                            {wo.mobFrom ? ` — ${wo.mobFrom}` : ""}
                          </span>
                        )}
                      </div>
                      {wo.notes && (
                        <div style={{ marginTop: 6, fontSize: 12, color: "var(--text2)", fontStyle: "italic" }}>
                          "{wo.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Time tab ── */}
          {tab === "time" && (
            <div>
              {eqTime.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <Clock size={32} />
                  <p>No time entries yet</p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Mechanic", "Work Order", "Clock In", "Clock Out", "Hours", "Notes"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: 1, color: "var(--text3)", borderBottom: "1px solid var(--border)", textAlign: "left", fontWeight: 400 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {eqTime.map(te => (
                      <tr key={te.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 500 }}>{te.mechanicName}</td>
                        <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--info)" }}>{te.workOrderId}</td>
                        <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 12 }}>{te.clockIn}</td>
                        <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text3)" }}>{te.clockOut || "Active"}</td>
                        <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent)" }}>{te.hours ? te.hours + "h" : "—"}</td>
                        <td style={{ padding: "10px 14px", color: "var(--text3)", fontSize: 12 }}>{te.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Parts tab ── */}
          {tab === "parts" && (
            <div>
              {eqParts.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <Package size={32} />
                  <p>No parts recorded yet</p>
                </div>
              ) : (
                <>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr>
                        {["Part", "Part #", "Qty", "Unit Cost", "Total", "Supplier", "Status"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: 1, color: "var(--text3)", borderBottom: "1px solid var(--border)", textAlign: "left", fontWeight: 400 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {eqParts.map(p => (
                        <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600 }}>{p.partName}</td>
                          <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)" }}>{p.partNumber || "—"}</td>
                          <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", textAlign: "center" }}>{p.qty}</td>
                          <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>{p.unitCost ? "$" + parseFloat(p.unitCost).toFixed(2) : "—"}</td>
                          <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent)" }}>{p.totalCost ? "$" + parseFloat(p.totalCost).toFixed(2) : "—"}</td>
                          <td style={{ padding: "10px 14px", color: "var(--text2)", fontSize: 12 }}>{p.supplier || "—"}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span className={"badge " + (p.status === "Used" ? "badge-neutral" : p.status === "Need to Order" ? "badge-danger" : "badge-info")}>{p.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", textAlign: "right", fontSize: 13 }}>
                    Total parts cost: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent)", fontSize: 15 }}>${totalParts}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Equipment Modal ──────────────────────────────────────
function EquipmentModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "", type: TYPE_OPTIONS[0], serial: "", status: "Active",
    lastService: "", nextService: "", notes: ""
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSave = () => {
    if (!form.name || !form.serial) { alert("Name and serial number are required."); return; }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Add Equipment</span>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Equipment Name *</label>
              <input className="form-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Komatsu Excavator 15 ton" />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={e => set("type", e.target.value)}>
                {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Item # / Serial *</label>
              <input className="form-input" value={form.serial} onChange={e => set("serial", e.target.value)} placeholder="EX4" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => set("status", e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Last Service</label>
              <input className="form-input" type="date" value={form.lastService} onChange={e => set("lastService", e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Next Service Due</label>
              <input className="form-input" type="date" value={form.nextService} onChange={e => set("nextService", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Equipment</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Equipment Page ──────────────────────────────────────
export default function Equipment() {
  const { equipment, workOrders, timeEntries, parts, addEquipment, loading } = useData();
  const [showModal, setShowModal]       = useState(false);
  const [historyEq, setHistoryEq]       = useState(null);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const filtered = useMemo(() => {
    return equipment.filter(eq => {
      const q = search.toLowerCase();
      const matchQ = !q || eq.name?.toLowerCase().includes(q) || eq.serial?.toLowerCase().includes(q) || eq.type?.toLowerCase().includes(q);
      const matchS = filterStatus === "All" || eq.status === filterStatus;
      return matchQ && matchS;
    });
  }, [equipment, search, filterStatus]);

  const getOpenOrders = (eqId) =>
    workOrders.filter(w => w.equipmentId === eqId && w.status !== "Completed" && w.status !== "Cancelled").length;

  const getTotalOrders = (eqId) =>
    workOrders.filter(w => w.equipmentId === eqId).length;

  const handleSave = async (form) => {
    await addEquipment(form);
    setShowModal(false);
  };

  const counts = useMemo(() => ({
    active:   equipment.filter(e => e.status === "Active").length,
    repair:   equipment.filter(e => e.status === "In Repair").length,
    inactive: equipment.filter(e => e.status === "Inactive").length,
  }), [equipment]);

  if (loading) return <div className="empty-state"><p>Loading...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Equipment</h1>
          <p className="page-subtitle">{equipment.length} units registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Equipment
        </button>
      </div>

      <div className="grid-3 mb-24">
        <div className="stat-card" style={{ "--accent-line": "var(--success)" }}>
          <span className="stat-label">Active</span>
          <span className="stat-value">{counts.active}</span>
          <span className="stat-sub">in operation</span>
        </div>
        <div className="stat-card" style={{ "--accent-line": "var(--warn)" }}>
          <span className="stat-label">In Repair</span>
          <span className="stat-value">{counts.repair}</span>
          <span className="stat-sub">out of service</span>
        </div>
        <div className="stat-card" style={{ "--accent-line": "var(--danger)" }}>
          <span className="stat-label">Inactive</span>
          <span className="stat-value">{counts.inactive}</span>
          <span className="stat-sub">not in use</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
          <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search equipment..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: "auto" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid-3">
        {filtered.map(eq => {
          const openOrders  = getOpenOrders(eq.id);
          const totalOrders = getTotalOrders(eq.id);
          const borderColor = eq.status === "Active" ? "var(--success)" : eq.status === "In Repair" ? "var(--warn)" : "var(--danger)";
          return (
            <div key={eq.id} className="card" style={{ borderLeft: "3px solid " + borderColor, padding: 18, cursor: "pointer" }}
              onClick={() => setHistoryEq(eq)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{eq.name}</div>
                  <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text3)" }}>{eq.type}</div>
                </div>
                {statusBadge(eq.status)}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text2)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text3)" }}>Item #</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{eq.serial}</span>
                </div>
                {eq.lastService && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text2)" }}>
                    <span style={{ color: "var(--text3)" }}>Last service</span>
                    <span>{eq.lastService}</span>
                  </div>
                )}
                {eq.nextService && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text3)" }}>Next service</span>
                    <span style={{ color: new Date(eq.nextService) < new Date() ? "var(--danger)" : "var(--text2)" }}>
                      {new Date(eq.nextService) < new Date() ? "⚠ " : ""}{eq.nextService}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer row */}
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
                  {totalOrders} repair{totalOrders !== 1 ? "s" : ""} on record
                </span>
                <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>
                  View history →
                </span>
              </div>

              {openOrders > 0 && (
                <div style={{ marginTop: 8, padding: "6px 10px", background: "rgba(245,166,35,0.08)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--warn)", display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={12} />
                  {openOrders} open work order{openOrders > 1 ? "s" : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state"><p>No equipment found</p></div>
      )}

      {showModal && <EquipmentModal onClose={() => setShowModal(false)} onSave={handleSave} />}

      {historyEq && (
        <HistoryModal
          eq={historyEq}
          workOrders={workOrders}
          timeEntries={timeEntries}
          parts={parts || []}
          onClose={() => setHistoryEq(null)}
        />
      )}
    </div>
  );
}
