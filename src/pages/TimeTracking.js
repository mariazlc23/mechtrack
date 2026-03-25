import React, { useState, useMemo, useEffect } from "react";
import { useData } from "../lib/DataContext";
import { Play, Square, Clock, X, CheckCircle } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

const STATUS_OPTIONS = ["Pending", "In Progress", "Completed", "Cancelled"];

function LiveTimer({ clockIn }) {
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    const tick = () => {
      const mins = differenceInMinutes(new Date(), new Date(clockIn));
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      setElapsed(`${h}h ${m.toString().padStart(2, "0")}m`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [clockIn]);
  return (
    <span className="pulse" style={{ color: "var(--success)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
      ● {elapsed}
    </span>
  );
}

function ClockInModal({ onClose, onSave, mechanics, workOrders }) {
  const [mechanicId, setMechanicId] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");
  const activeOrders = workOrders.filter(w => w.status !== "Completed" && w.status !== "Cancelled");

  const handleSave = () => {
    if (!mechanicId || !workOrderId) { alert("Please select a mechanic and a work order."); return; }
    onSave({ mechanicId, workOrderId });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title" style={{ color: "var(--success)" }}>⏱ Start Work</span>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Mechanic</label>
            <select className="form-input" value={mechanicId} onChange={e => setMechanicId(e.target.value)}>
              <option value="">Select mechanic...</option>
              {mechanics.filter(m => m.active === "true").map(m => (
                <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Work Order</label>
            <select className="form-input" value={workOrderId} onChange={e => setWorkOrderId(e.target.value)}>
              <option value="">Select order...</option>
              {activeOrders.map(wo => (
                <option key={wo.id} value={wo.id}>
                  {wo.id} — [{wo.equipmentId}] {wo.equipmentName} — {wo.title}
                </option>
              ))}
            </select>
          </div>
          <div style={{ padding: "12px 14px", background: "rgba(61,202,126,0.08)", border: "1px solid rgba(61,202,126,0.2)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--success)", fontFamily: "var(--font-mono)" }}>
            Start time: {format(new Date(), "HH:mm:ss")}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={handleSave}><Play size={14} /> Start</button>
        </div>
      </div>
    </div>
  );
}

function ClockOutModal({ entry, workOrder, onClose, onSave }) {
  const [notes, setNotes]           = useState("");
  const [newStatus, setNewStatus]   = useState(workOrder?.status || "In Progress");
  const [updateStatus, setUpdateStatus] = useState(false);

  const currentStatus = workOrder?.status || "";

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <span className="modal-title" style={{ color: "var(--danger)" }}>⏹ Clock Out</span>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">

          {/* Summary card */}
          <div style={{ padding: "14px", background: "var(--bg3)", borderRadius: "var(--radius)", marginBottom: 4 }}>
            <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 15 }}>{entry.mechanicName}</div>
            <div style={{ color: "var(--text3)", fontFamily: "var(--font-mono)", fontSize: 12, marginBottom: 6 }}>
              {entry.workOrderId} · {workOrder?.equipmentName} · Started: {entry.clockIn?.split(" ")[1]}
            </div>
            <LiveTimer clockIn={entry.clockIn} />
          </div>

          {/* Work notes */}
          <div className="form-group">
            <label className="form-label">Work Notes</label>
            <textarea
              className="form-input"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What was done? Any observations..."
            />
          </div>

          {/* ── Status update section ── */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={15} color="var(--accent)" />
                <span style={{ fontWeight: 500, fontSize: 14 }}>Update Order Status?</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className={"btn btn-sm " + (updateStatus ? "btn-primary" : "btn-ghost")}
                  onClick={() => setUpdateStatus(true)}
                >Yes</button>
                <button
                  type="button"
                  className={"btn btn-sm " + (!updateStatus ? "btn-primary" : "btn-ghost")}
                  onClick={() => setUpdateStatus(false)}
                >No</button>
              </div>
            </div>

            {updateStatus && (
              <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "var(--radius-lg)", padding: 14 }}>
                <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10, fontFamily: "var(--font-mono)" }}>
                  Current status: <span style={{ color: "var(--text2)" }}>{currentStatus}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewStatus(s)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "var(--radius)",
                        border: newStatus === s ? "2px solid var(--accent)" : "1px solid var(--border2)",
                        background: newStatus === s ? "rgba(245,166,35,0.12)" : "var(--bg3)",
                        color: newStatus === s ? "var(--accent)" : "var(--text2)",
                        fontWeight: newStatus === s ? 600 : 400,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.15s",
                      }}
                    >
                      {s === "Completed"   && "✓ "}
                      {s === "In Progress" && "⚙ "}
                      {s === "Pending"     && "⏳ "}
                      {s === "Cancelled"   && "✕ "}
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-danger"
            onClick={() => onSave(entry.id, notes, updateStatus ? newStatus : null)}
          >
            <Square size={14} /> Clock Out
            {updateStatus && newStatus === "Completed" && " & Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TimeTracking() {
  const { timeEntries, mechanics, workOrders, clockIn, clockOut, updateWorkOrder, loading } = useData();
  const [showClockIn,  setShowClockIn]  = useState(false);
  const [clockingOut,  setClockOutEntry] = useState(null);

  const activeEntries = useMemo(() =>
    timeEntries.filter(t => t.clockIn && !t.clockOut),
    [timeEntries]
  );
  const completed = useMemo(() =>
    [...timeEntries.filter(t => t.clockOut)]
      .sort((a, b) => new Date(b.clockOut) - new Date(a.clockOut))
      .slice(0, 30),
    [timeEntries]
  );
  const totalHrs = useMemo(() =>
    completed.reduce((s, t) => s + (parseFloat(t.hours) || 0), 0).toFixed(1),
    [completed]
  );

  const handleClockIn = async ({ mechanicId, workOrderId }) => {
    await clockIn({ mechanicId, workOrderId });
    setShowClockIn(false);
  };

  const handleClockOut = async (entryId, notes, newStatus) => {
    // Clock out the time entry
    await clockOut(entryId, notes);

    // If mechanic chose to update the order status
    if (newStatus) {
      const entry = timeEntries.find(t => t.id === entryId);
      if (entry) {
        const wo = workOrders.find(w => w.id === entry.workOrderId);
        if (wo) {
          await updateWorkOrder({ ...wo, status: newStatus });
        }
      }
    }
    setClockOutEntry(null);
  };

  if (loading) return <div className="empty-state"><p>Loading...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Time Tracking</h1>
          <p className="page-subtitle">{activeEntries.length} mechanic{activeEntries.length !== 1 ? "s" : ""} working now</p>
        </div>
        <button className="btn btn-success" onClick={() => setShowClockIn(true)}>
          <Play size={16} /> Clock In
        </button>
      </div>

      {/* Stats */}
      <div className="grid-3 mb-24">
        <div className="stat-card" style={{ "--accent-line": "var(--success)" }}>
          <span className="stat-label">Active Now</span>
          <span className="stat-value">{activeEntries.length}</span>
          <span className="stat-sub">mechanics on shift</span>
        </div>
        <div className="stat-card" style={{ "--accent-line": "var(--info)" }}>
          <span className="stat-label">Total Entries</span>
          <span className="stat-value">{timeEntries.length}</span>
          <span className="stat-sub">historical records</span>
        </div>
        <div className="stat-card" style={{ "--accent-line": "var(--accent)" }}>
          <span className="stat-label">Completed Hours</span>
          <span className="stat-value">{totalHrs}</span>
          <span className="stat-sub">last 30 entries</span>
        </div>
      </div>

      {/* Active entries */}
      {activeEntries.length > 0 && (
        <div className="section-gap">
          <div className="card-title mb-16">Currently Working</div>
          <div className="grid-2">
            {activeEntries.map(te => {
              const wo = workOrders.find(w => w.id === te.workOrderId);
              return (
                <div key={te.id} className="card" style={{ borderLeft: "3px solid var(--success)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>{te.mechanicName}</div>
                      <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
                        {te.workOrderId}
                      </div>
                      {wo && (
                        <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>
                          {wo.equipmentName} — {wo.title}
                        </div>
                      )}
                      <LiveTimer clockIn={te.clockIn} />
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setClockOutEntry(te)}
                    >
                      <Square size={12} /> Clock Out
                    </button>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
                    Started: {te.clockIn}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      <div className="card-title mb-16">Recent History</div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mechanic</th>
                <th>Order</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Hours</th>
                <th>Notes</th>
                <th>Billable</th>
              </tr>
            </thead>
            <tbody>
              {completed.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>No completed entries</td></tr>
              )}
              {completed.map(te => (
                <tr key={te.id}>
                  <td style={{ fontWeight: 500 }}>{te.mechanicName}</td>
                  <td><span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--info)" }}>{te.workOrderId}</span></td>
                  <td><span style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>{te.clockIn}</span></td>
                  <td><span style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>{te.clockOut}</span></td>
                  <td><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--accent)" }}>{te.hours ? te.hours + "h" : "—"}</span></td>
                  <td style={{ color: "var(--text2)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{te.notes || "—"}</td>
                  <td>{te.billable === "true" ? <span className="badge badge-success">Yes</span> : <span className="badge badge-neutral">No</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showClockIn && (
        <ClockInModal
          onClose={() => setShowClockIn(false)}
          onSave={handleClockIn}
          mechanics={mechanics}
          workOrders={workOrders}
        />
      )}

      {clockingOut && (
        <ClockOutModal
          entry={clockingOut}
          workOrder={workOrders.find(w => w.id === clockingOut.workOrderId)}
          onClose={() => setClockOutEntry(null)}
          onSave={handleClockOut}
        />
      )}
    </div>
  );
}
