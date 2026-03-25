import React, { useState, useMemo } from "react";
import { useData } from "../lib/DataContext";
import { Plus, X, Search, ShoppingCart, Package, DollarSign, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const STATUS_OPTIONS = ["In Stock", "Need to Order", "Ordered", "Used", "Returned"];

function statusBadge(s) {
  const map = {
    "In Stock":      "badge-success",
    "Need to Order": "badge-danger",
    "Ordered":       "badge-warn",
    "Used":          "badge-neutral",
    "Returned":      "badge-info",
  };
  return <span className={`badge ${map[s] || "badge-neutral"}`}>{s}</span>;
}

function PartModal({ onClose, onSave, workOrders, equipment }) {
  const [form, setForm] = useState({
    workOrderId: "", equipmentId: "", equipmentName: "",
    partName: "", partNumber: "", qty: "1",
    unitCost: "", totalCost: "", supplier: "",
    status: "Need to Order", needToBuy: "true", notes: "",
  });

  const set = (k, v) => setForm(f => {
    const updated = { ...f, [k]: v };
    // Auto-calc total when qty or unitCost changes
    if (k === "qty" || k === "unitCost") {
      const q = parseFloat(k === "qty" ? v : updated.qty) || 0;
      const c = parseFloat(k === "unitCost" ? v : updated.unitCost) || 0;
      updated.totalCost = (q * c).toFixed(2);
    }
    return updated;
  });

  const handleWO = (id) => {
    const wo = workOrders.find(w => w.id === id);
    set("workOrderId", id);
    if (wo) {
      setForm(f => ({ ...f, workOrderId: id, equipmentId: wo.equipmentId, equipmentName: wo.equipmentName }));
    }
  };

  const handleSave = () => {
    if (!form.partName || !form.workOrderId) {
      alert("Part name and Work Order are required.");
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <span className="modal-title">Add Part</span>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">

            {/* Work Order */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Work Order *</label>
              <select className="form-input" value={form.workOrderId} onChange={e => handleWO(e.target.value)}>
                <option value="">Select work order…</option>
                {workOrders.filter(w => w.status !== "Completed" && w.status !== "Cancelled").map(wo => (
                  <option key={wo.id} value={wo.id}>
                    {wo.id} — [{wo.equipmentId}] {wo.equipmentName}
                  </option>
                ))}
              </select>
            </div>

            {/* Part name */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Part Name *</label>
              <input
                className="form-input"
                value={form.partName}
                onChange={e => set("partName", e.target.value)}
                placeholder="e.g. Hydraulic Filter, Brake Pad Set…"
              />
            </div>

            {/* Part number */}
            <div className="form-group">
              <label className="form-label">Part Number</label>
              <input
                className="form-input"
                value={form.partNumber}
                onChange={e => set("partNumber", e.target.value)}
                placeholder="e.g. HF-4892"
              />
            </div>

            {/* Supplier */}
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <input
                className="form-input"
                value={form.supplier}
                onChange={e => set("supplier", e.target.value)}
                placeholder="e.g. NAPA, Dealer…"
              />
            </div>

            {/* Qty */}
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                className="form-input"
                type="number"
                min="1"
                value={form.qty}
                onChange={e => set("qty", e.target.value)}
              />
            </div>

            {/* Unit cost */}
            <div className="form-group">
              <label className="form-label">Unit Cost ($)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                step="0.01"
                value={form.unitCost}
                onChange={e => set("unitCost", e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Total cost (read-only) */}
            <div className="form-group">
              <label className="form-label">Total Cost ($)</label>
              <input
                className="form-input"
                readOnly
                value={form.totalCost || ""}
                style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 600 }}
                placeholder="Auto-calculated"
              />
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => set("status", e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Notes */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Notes</label>
              <textarea
                className="form-input"
                rows={2}
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="Lead time, special instructions…"
              />
            </div>

          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Plus size={14} /> Add Part
          </button>
        </div>
      </div>
    </div>
  );
}

function EditStatusModal({ part, onClose, onSave }) {
  const [status, setStatus] = useState(part.status);
  const [notes, setNotes] = useState(part.notes || "");
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <span className="modal-title">Update Part</span>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div style={{ padding: "12px 14px", background: "var(--bg3)", borderRadius: "var(--radius)", marginBottom: 4 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{part.partName}</div>
            <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
              {part.partNumber && `#${part.partNumber} · `}{part.supplier}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave({ ...part, status, notes })}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function Parts() {
  const { parts, workOrders, equipment, addPart, updatePart, deletePart, loading } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editPart, setEditPart] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const filtered = useMemo(() => {
    return [...parts]
      .filter(p => {
        const q = search.toLowerCase();
        const matchQ = !q ||
          p.partName?.toLowerCase().includes(q) ||
          p.partNumber?.toLowerCase().includes(q) ||
          p.supplier?.toLowerCase().includes(q) ||
          p.equipmentName?.toLowerCase().includes(q) ||
          p.workOrderId?.toLowerCase().includes(q);
        const matchS = filterStatus === "All" || p.status === filterStatus;
        return matchQ && matchS;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [parts, search, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const needToBuy  = parts.filter(p => p.status === "Need to Order").length;
    const ordered    = parts.filter(p => p.status === "Ordered").length;
    const totalSpent = parts
      .filter(p => p.status === "Used")
      .reduce((s, p) => s + (parseFloat(p.totalCost) || 0), 0);
    const totalPending = parts
      .filter(p => p.status === "Need to Order" || p.status === "Ordered")
      .reduce((s, p) => s + (parseFloat(p.totalCost) || 0), 0);
    return { needToBuy, ordered, totalSpent, totalPending };
  }, [parts]);

  const handleSave = async (form) => {
    await addPart(form);
    setShowModal(false);
  };

  const handleUpdate = async (part) => {
    await updatePart(part);
    setEditPart(null);
  };

  if (loading) return <div className="empty-state"><p>Loading…</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Parts Used</h1>
          <p className="page-subtitle">{parts.length} parts tracked</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Part
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-24">
        <div className="stat-card" style={{ "--accent-line": "var(--danger)" }}>
          <span className="stat-label">Need to Order</span>
          <span className="stat-value">{stats.needToBuy}</span>
          <span className="stat-sub">parts pending purchase</span>
        </div>
        <div className="stat-card" style={{ "--accent-line": "var(--warn)" }}>
          <span className="stat-label">Ordered</span>
          <span className="stat-value">{stats.ordered}</span>
          <span className="stat-sub">waiting on delivery</span>
        </div>
        <div className="stat-card" style={{ "--accent-line": "var(--accent)" }}>
          <span className="stat-label">Pending Cost</span>
          <span className="stat-value">${stats.totalPending.toFixed(0)}</span>
          <span className="stat-sub">to order or arriving</span>
        </div>
        <div className="stat-card" style={{ "--accent-line": "var(--success)" }}>
          <span className="stat-label">Total Spent</span>
          <span className="stat-value">${stats.totalSpent.toFixed(0)}</span>
          <span className="stat-sub">parts used so far</span>
        </div>
      </div>

      {/* Need to buy alert banner */}
      {stats.needToBuy > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 18px", marginBottom: 20,
          background: "rgba(224,83,83,0.08)",
          border: "1px solid rgba(224,83,83,0.25)",
          borderRadius: "var(--radius-lg)",
          fontSize: 13,
        }}>
          <ShoppingCart size={16} color="var(--danger)" />
          <span style={{ color: "var(--danger)", fontWeight: 600 }}>
            {stats.needToBuy} part{stats.needToBuy > 1 ? "s" : ""} need to be purchased
          </span>
          <span style={{ color: "var(--text3)" }}>— estimated cost: ${stats.totalPending.toFixed(2)}</span>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: "auto" }}
            onClick={() => setFilterStatus("Need to Order")}
          >
            View list
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
          <input
            className="form-input"
            style={{ paddingLeft: 32 }}
            placeholder="Search parts, order, equipment…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-input" style={{ width: "auto" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Part #</th>
                <th>Work Order</th>
                <th>Equipment</th>
                <th>Qty</th>
                <th>Unit Cost</th>
                <th>Total</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 40 }}>
                    <div className="empty-state" style={{ padding: 0 }}>
                      <Package size={32} />
                      <p>No parts found</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map(p => (
                <tr key={p.id} style={{
                  borderLeft: p.status === "Need to Order" ? "3px solid var(--danger)" :
                               p.status === "Ordered"       ? "3px solid var(--warn)"   : "3px solid transparent"
                }}>
                  <td style={{ fontWeight: 600 }}>{p.partName}</td>
                  <td>
                    {p.partNumber
                      ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text3)" }}>{p.partNumber}</span>
                      : <span style={{ color: "var(--text3)" }}>—</span>
                    }
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--info)" }}>
                      {p.workOrderId}
                    </span>
                  </td>
                  <td style={{ color: "var(--text2)", fontSize: 13 }}>{p.equipmentName}</td>
                  <td style={{ fontFamily: "var(--font-mono)", textAlign: "center" }}>{p.qty}</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>
                    {p.unitCost ? `$${parseFloat(p.unitCost).toFixed(2)}` : "—"}
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--accent)" }}>
                      {p.totalCost ? `$${parseFloat(p.totalCost).toFixed(2)}` : "—"}
                    </span>
                  </td>
                  <td style={{ color: "var(--text2)", fontSize: 13 }}>{p.supplier || "—"}</td>
                  <td>{statusBadge(p.status)}</td>
                  <td style={{ color: "var(--text3)", fontSize: 12, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.notes || "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditPart(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--danger)" }}
                        onClick={() => {
                          if (window.confirm(`Delete "${p.partName}"?`)) deletePart(p.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer total */}
        {filtered.length > 0 && (
          <div style={{
            display: "flex", justifyContent: "flex-end", alignItems: "center",
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            gap: 24,
            fontSize: 13,
          }}>
            <span style={{ color: "var(--text3)" }}>{filtered.length} parts shown</span>
            <span style={{ color: "var(--text2)" }}>
              Subtotal:{" "}
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--accent)", fontSize: 15 }}>
                ${filtered.reduce((s, p) => s + (parseFloat(p.totalCost) || 0), 0).toFixed(2)}
              </span>
            </span>
          </div>
        )}
      </div>

      {showModal && (
        <PartModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          workOrders={workOrders}
          equipment={equipment}
        />
      )}

      {editPart && (
        <EditStatusModal
          part={editPart}
          onClose={() => setEditPart(null)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}
