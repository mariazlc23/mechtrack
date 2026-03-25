const SHEETS_BASE    = "https://sheets.googleapis.com/v4/spreadsheets";
const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID || "";
const API_KEY        = process.env.REACT_APP_GOOGLE_API_KEY  || "";

export const TABS = {
  MECHANICS:    "Mechanics",
  EQUIPMENT:    "Equipment",
  WORK_ORDERS:  "WorkOrders",
  TIME_ENTRIES: "TimeEntries",
  PARTS:        "Parts",
};

// ── Read all rows from a tab ──────────────────────────────────
export async function readSheet(tab) {
  const url = `${SHEETS_BASE}/${SPREADSHEET_ID}/values/${tab}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheets read failed: ${res.statusText}`);
  const data = await res.json();
  const [headers, ...rows] = data.values || [];
  if (!headers) return [];
  return rows.map(row =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""]))
  );
}

// ── Append a new row ──────────────────────────────────────────
export async function appendRow(tab, rowObj) {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated. Please sign in with Google.");

  const headersRes = await fetch(
    `${SHEETS_BASE}/${SPREADSHEET_ID}/values/${tab}?key=${API_KEY}`
  );
  const headersData = await headersRes.json();
  const headers = headersData.values?.[0] ?? Object.keys(rowObj);
  const row = headers.map(h => rowObj[h] ?? "");

  const res = await fetch(
    `${SHEETS_BASE}/${SPREADSHEET_ID}/values/${tab}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!res.ok) throw new Error(`Sheets append failed: ${res.statusText}`);
  return res.json();
}

// ── Find row by ID and update entire row ──────────────────────
export async function updateRowById(tab, id, rowObj) {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated. Please sign in with Google.");

  const res = await fetch(
    `${SHEETS_BASE}/${SPREADSHEET_ID}/values/${tab}?key=${API_KEY}`
  );
  const data = await res.json();
  const rows = data.values || [];
  if (rows.length < 2) throw new Error("Sheet is empty");

  const headers  = rows[0];
  const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === id);
  if (rowIndex === -1) throw new Error(`Row with id "${id}" not found in ${tab}`);

  const updatedRow = headers.map(h => rowObj[h] ?? "");
  const range = `${tab}!A${rowIndex + 1}`;

  const updateRes = await fetch(
    `${SHEETS_BASE}/${SPREADSHEET_ID}/values/${range}?valueInputOption=USER_ENTERED&key=${API_KEY}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ values: [updatedRow] }),
    }
  );
  if (!updateRes.ok) throw new Error(`Sheets update failed: ${updateRes.statusText}`);
  return updateRes.json();
}

// ── Auth token helpers ────────────────────────────────────────
export function getAuthToken() {
  return sessionStorage.getItem("gapi_token");
}
export function setAuthToken(token) {
  sessionStorage.setItem("gapi_token", token);
}
export function clearAuthToken() {
  sessionStorage.removeItem("gapi_token");
}

// ── Wait for Google Identity Services to load ─────────────────
function waitForGoogle(timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(interval);
        resolve();
      }
    }, 200);
    setTimeout(() => {
      clearInterval(interval);
      reject(new Error("Google Identity Services failed to load."));
    }, timeout);
  });
}

// ── Google OAuth sign-in ──────────────────────────────────────
export async function initGoogleAuth(onSuccess, onError) {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.warn("REACT_APP_GOOGLE_CLIENT_ID not set — running in demo mode");
    onSuccess?.(null);
    return;
  }
  try {
    await waitForGoogle();
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      callback: (resp) => {
        if (resp.error) {
          onError?.(resp.error);
          return;
        }
        if (resp.access_token) {
          setAuthToken(resp.access_token);
          onSuccess?.(resp.access_token);
        }
      },
    });
    client.requestAccessToken({ prompt: "consent" });
  } catch (err) {
    console.error("Google auth error:", err);
    onError?.(err.message);
  }
}
