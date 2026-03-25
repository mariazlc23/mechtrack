import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { readSheet, appendRow, updateRowById, TABS } from "./sheets";
import {
  DEMO_MECHANICS, DEMO_EQUIPMENT,
  DEMO_WORK_ORDERS, DEMO_TIME_ENTRIES, DEMO_PARTS,
} from "./demoData";
import { format } from "date-fns";

const DEMO_MODE = !process.env.REACT_APP_SPREADSHEET_ID;

const DataCtx = createContext({
  mechanics:   [],
  equipment:   [],
  workOrders:  [],
  timeEntries: [],
  parts:       [],
  loading:     true,
  error:       null,
  isDemo:      true,
  loadAll:     () => {},
  addWorkOrder:  () => {},
  updateWorkOrder: () => {},
  clockIn:     () => {},
  clockOut:    () => {},
  addEquipment:() => {},
  addPart:     () => {},
  updatePart:  () => {},
  deletePart:  () => {},
});

const initialState = {
  mechanics:   [],
  equipment:   [],
  workOrders:  [],
  timeEntries: [],
  parts:       [],
  loading:     true,
  error:       null,
  isDemo:      DEMO_MODE,
};

function reducer(state, action) {
  switch (action.type) {
    case "LOADED":
      return { ...state, ...action.payload, loading: false, error: null };
    case "ERROR":
      return { ...state, loading: false, error: action.payload };
    case "ADD_WORK_ORDER":
      return { ...state, workOrders: [...state.workOrders, action.payload] };
    case "UPDATE_WORK_ORDER":
      return {
        ...state,
        workOrders: state.workOrders.map(wo =>
          wo.id === action.payload.id ? { ...wo, ...action.payload } : wo
        ),
      };
    case "ADD_TIME_ENTRY":
      return { ...state, timeEntries: [...state.timeEntries, action.payload] };
    case "UPDATE_TIME_ENTRY":
      return {
        ...state,
        timeEntries: state.timeEntries.map(te =>
          te.id === action.payload.id ? { ...te, ...action.payload } : te
        ),
      };
    case "ADD_EQUIPMENT":
      return { ...state, equipment: [...state.equipment, action.payload] };
    case "UPDATE_EQUIPMENT":
      return {
        ...state,
        equipment: state.equipment.map(eq =>
          eq.id === action.payload.id ? { ...eq, ...action.payload } : eq
        ),
      };
    case "ADD_PART":
      return { ...state, parts: [...state.parts, action.payload] };
    case "UPDATE_PART":
      return {
        ...state,
        parts: state.parts.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        ),
      };
    case "DELETE_PART":
      return { ...state, parts: state.parts.filter(p => p.id !== action.payload) };
    default:
      return state;
  }
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadAll = useCallback(async () => {
    if (DEMO_MODE) {
      dispatch({
        type: "LOADED",
        payload: {
          mechanics:   DEMO_MECHANICS,
          equipment:   DEMO_EQUIPMENT,
          workOrders:  DEMO_WORK_ORDERS,
          timeEntries: DEMO_TIME_ENTRIES,
          parts:       DEMO_PARTS,
        },
      });
      return;
    }
    try {
      const [mechanics, equipment, workOrders, timeEntries, parts] = await Promise.all([
        readSheet(TABS.MECHANICS),
        readSheet(TABS.EQUIPMENT),
        readSheet(TABS.WORK_ORDERS),
        readSheet(TABS.TIME_ENTRIES),
        readSheet(TABS.PARTS),
      ]);
      dispatch({ type: "LOADED", payload: { mechanics, equipment, workOrders, timeEntries, parts } });
    } catch (e) {
      dispatch({ type: "ERROR", payload: e.message });
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Actions ────────────────────────────────────────────────
  const addWorkOrder = async (wo) => {
    const newWO = {
      ...wo,
      id: `WO-${Date.now()}`,
      createdAt: format(new Date(), "yyyy-MM-dd HH:mm"),
      completedAt: "",
      mobilization: wo.mobilization || "false",
      mobTime:  wo.mobTime  || "",
      mobUnit:  wo.mobUnit  || "",
      mobFrom:  wo.mobFrom  || "",
      mobNotes: wo.mobNotes || "",
    };
    dispatch({ type: "ADD_WORK_ORDER", payload: newWO });
    if (!DEMO_MODE) await appendRow(TABS.WORK_ORDERS, newWO);
    return newWO;
  };

  const updateWorkOrder = async (wo) => {
    dispatch({ type: "UPDATE_WORK_ORDER", payload: wo });
    if (!DEMO_MODE) await updateRowById(TABS.WORK_ORDERS, wo.id, wo);
  };

  const clockIn = async ({ workOrderId, mechanicId }) => {
    const mechanic = state.mechanics.find(m => m.id === mechanicId);
    const entry = {
      id: `TE-${Date.now()}`,
      workOrderId,
      mechanicId,
      mechanicName: mechanic?.name ?? "",
      clockIn: format(new Date(), "yyyy-MM-dd HH:mm"),
      clockOut: "",
      hours: "",
      notes: "",
      billable: "true",
    };
    dispatch({ type: "ADD_TIME_ENTRY", payload: entry });
    if (!DEMO_MODE) await appendRow(TABS.TIME_ENTRIES, entry);
    return entry;
  };

  const clockOut = async (entryId, notes = "") => {
    const te = state.timeEntries.find(t => t.id === entryId);
    if (!te) return;
    const out = new Date();
    const inn = new Date(te.clockIn);
    const hrs = ((out - inn) / 3_600_000).toFixed(2);
    const updated = {
      ...te,
      clockOut: format(out, "yyyy-MM-dd HH:mm"),
      hours: hrs,
      notes,
    };
    dispatch({ type: "UPDATE_TIME_ENTRY", payload: updated });
    if (!DEMO_MODE) await updateRowById(TABS.TIME_ENTRIES, entryId, updated);
    return updated;
  };

  const addEquipment = async (eq) => {
    const newEq = { ...eq, id: `EQ-${Date.now()}` };
    dispatch({ type: "ADD_EQUIPMENT", payload: newEq });
    if (!DEMO_MODE) await appendRow(TABS.EQUIPMENT, newEq);
    return newEq;
  };

  const addPart = async (part) => {
    const newPart = {
      ...part,
      id: `PT-${Date.now()}`,
      createdAt: format(new Date(), "yyyy-MM-dd HH:mm"),
    };
    dispatch({ type: "ADD_PART", payload: newPart });
    if (!DEMO_MODE) await appendRow(TABS.PARTS, newPart);
    return newPart;
  };

  const updatePart = async (part) => {
    dispatch({ type: "UPDATE_PART", payload: part });
    if (!DEMO_MODE) await updateRowById(TABS.PARTS, part.id, part);
  };

  const deletePart = async (partId) => {
    dispatch({ type: "DELETE_PART", payload: partId });
  };

  return (
    <DataCtx.Provider value={{ ...state, loadAll, addWorkOrder, updateWorkOrder, clockIn, clockOut, addEquipment, addPart, updatePart, deletePart }}>
      {children}
    </DataCtx.Provider>
  );
}

export const useData = () => useContext(DataCtx);
