import React, { useState, useMemo } from "react";
import { useData } from "../lib/DataContext";
import { Plus, X, Search, Truck } from "lucide-react";

const STATUS_OPTIONS   = ["Pending", "In Progress", "Completed", "Cancelled"];
const PRIORITY_OPTIONS = ["High", "Medium", "Low"];
const MOB_UNITS        = ["minutes", "hours"];

function statusBadge(s) {
  const m = { "Completed":"badge-success","In Progress":"badge-info","Pending":"badge-warn","Cancelled":"badge-danger" };
  return <span className={"badge " + (m[s]||"badge-neutral")}>{s}</span>;
}
function priorityBadge(p) {
  const m = { High:"badge-danger", Medium:"badge-warn", Low:"badge-neutral" };
  return <span className={"badge " + (m[p]||"badge-neutral")}>{p}</span>;
}

function WorkOrderModal({ onClose, onSave, mechanics, equipment }) {
  const [form, setForm] = useState({
    equipmentId:"", equipmentName:"", title:"", status:"Pending",
    priority:"Medium", mechanicId:"", mechanicName:"",
    mobilization:"false", mobTime:"", mobUnit:"minutes", mobFrom:"", mobNotes:"",
    notes:""
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleEq = (id) => {
    const eq = equipment.find(e => e.id === id);
    setForm(f => ({ ...f, equipmentId: id, equipmentName: eq ? eq.name : "" }));
  };
  const handleMech = (id) => {
    const m = mechanics.find(m => m.id === id);
    setForm(f => ({ ...f, mechanicId: id, mechanicName: m ? m.name : "" }));
  };
  const handleSave = () => {
    if (!form.equipmentId || !form.title || !form.mechanicId) {
      alert("Please fill in: equipment, title and mechanic.");
      return;
    }
    if (form.mobilization === "true" && !form.mobTime) {
      alert("Please enter the mobilization time.");
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <span className="modal-title">New Work Order</span>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">

            <div className="form-group" style={{ gridColumn:"1 / -1" }}>
              <label className="form-label">Equipment *</label>
              <select className="form-input" value={form.equipmentId} onChange={e => handleEq(e.target.value)}>
                <option value="">Select equipment...</option>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>[{eq.id}] {eq.name}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn:"1 / -1" }}>
              <label className="form-label">Work Description *</label>
              <input className="form-input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Oil and filter change" />
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={e => set("priority", e.target.value)}>
                {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => set("status", e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn:"1 / -1" }}>
              <label className="form-label">Assigned Mechanic *</label>
              <select className="form-input" value={form.mechanicId} onChange={e => handleMech(e.target.value)}>
                <option value="">Select mechanic...</option>
                {mechanics.filter(m => m.active === "true").map(m => (
                  <option key={m.id} value={m.id}>{m.name} - {m.role}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn:"1 / -1" }}>
              <div style={{ height:1, background:"var(--border)", margin:"4px 0 16px" }} />
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <Truck size={15} color="var(--accent)" />
                  <span style={{ fontWeight:500, fontSize:14 }}>Mobilization Required?</span>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button type="button" className={"btn btn-sm " + (form.mobilization === "true" ? "btn-primary" : "btn-ghost")} onClick={() => set("mobilization","true")}>Yes</button>
                  <button type="button" className={"btn btn-sm " + (form.mobilization === "false" ? "btn-primary" : "btn-ghost")} onClick={() => set("mobilization","false")}>No</button>
                </div>
              </div>

              {form.mobilization === "true" && (
                <div style={{ background:"rgba(245,166,35,0.06)", border:"1px solid rgba(245,166,35,0.2)", borderRadius:"var(--radius-lg)", padding:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <div className="form-group">
                    <label className="form-label">Mobilization Time *</label>
                    <input className="form-input" type="number" min="1" value={form.mobTime} onChange={e => set("mobTime", e.target.value)} placeholder="e.g. 45" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <select className="form-input" value={form.mobUnit} onChange={e => set("mobUnit", e.target.value)}>
                      {MOB_UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn:"1 / -1" }}>
                    <label className="form-label">From / To Location</label>
                    <input className="form-input" value={form.mobFrom} onChange={e => set("mobFrom", e.target.value)} placeholder="e.g. Shop to Job Site A" />
                  </div>
                  <div className="form-group" style={{ gridColumn:"1 / -1" }}>
                    <label className="form-label">Mobilization Notes</label>
                    <input className="form-input" value={form.mobNotes} onChange={e => set("mobNotes", e.target.value)} placeholder="e.g. Needed flatbed, heavy traffic..." />
                  </div>
                </div>
              )}
            </div>

            <div className="form-group" style={{ gridColumn:"1 / -1" }}>
              <label className="form-label">Additional Notes</label>
              <textarea className="form-input" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Observations..." />
            </div>

          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Create Order</button>
        </div>
      </div>
    </div>
  );
}

export default function WorkOrders() {
  const { workOrders, mechanics, equipment, addWorkOrder, updateWorkOrder, loading } = useData();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");

  const filtered = useMemo(() => {
    return workOrders
      .filter(wo => {
        const q = search.toLowerCase();
        const matchQ = !q || wo.title?.toLowerCase().includes(q) || wo.equipmentName?.toLowerCase().includes(q) || wo.mechanicName?.toLowerCase().includes(q) || wo.id?.toLowerCase().includes(q);
        const matchS = filterStatus === "All" || wo.status === filterStatus;
        const matchP = filterPriority === "All" || wo.priority === filterPriority;
        return matchQ && matchS && matchP;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [workOrders, search, filterStatus, filterPriority]);

  const handleSave = async (form) => {
    await addWorkOrder(form);
    setShowModal(false);
  };

  const toggleStatus = async (wo) => {
    const next = { "Pending":"In Progress", "In Progress":"Completed", "Completed":"Pending" };
    await updateWorkOrder({ ...wo, status: next[wo.status] || wo.status });
  };

  if (loading) return <div className="empty-state"><p>Loading...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Work Orders</h1>
          <p className="page-subtitle">{filtered.length} orders found</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Order
        </button>
      </div>

      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--text3)" }} />
          <input className="form-input" style={{ paddingLeft:32 }} placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width:"auto" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="form-input" style={{ width:"auto" }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="All">All priorities</option>
          {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Equipment</th>
                <th>Work</th>
                <th>Mechanic</th>
                <th>Mobilization</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>No results found</td></tr>
              )}
              {filtered.map(wo => (
                <tr key={wo.id}>
                  <td><span className="text-mono" style={{ fontSize:11, color:"var(--text3)" }}>{wo.id}</span></td>
                  <td style={{ fontWeight:500 }}>{wo.equipmentName}</td>
                  <td style={{ color:"var(--text2)", maxWidth:180 }}>{wo.title}</td>
                  <td>{wo.mechanicName}</td>
                  <td>
                    {wo.mobilization === "true" ? (
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <Truck size={12} color="var(--accent)" />
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--accent)", fontWeight:600 }}>
                          {wo.mobTime} {wo.mobUnit}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color:"var(--text3)", fontSize:12 }}>-</span>
                    )}
                  </td>
                  <td>{priorityBadge(wo.priority)}</td>
                  <td>{statusBadge(wo.status)}</td>
                  <td><span style={{ fontSize:12, fontFamily:"var(--font-mono)", color:"var(--text3)" }}>{wo.createdAt?.split(" ")[0]}</span></td>
                  <td>
                    {wo.status !== "Completed" && wo.status !== "Cancelled" && (
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(wo)}>Advance</button>
                    )}
                    {wo.status === "Completed" && (
                      <span style={{ color:"var(--success)", fontSize:12 }}>Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <WorkOrderModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          mechanics={mechanics}
          equipment={equipment}
        />
      )}
    </div>
  );
}
