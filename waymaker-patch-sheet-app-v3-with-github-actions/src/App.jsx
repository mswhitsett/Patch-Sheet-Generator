import React, { useMemo, useState, useEffect } from "react";
import "./styles.css";

const sourceTypes = ["DX1", "DX2", "DX3", "DX4", "Dante"];

const instrumentGroups = [
  { label: "Drums", instruments: ["Kick In", "Kick Out", "Snare Top", "Snare Bottom", "HiHat", "Tom 1", "Tom 2", "Tom 3", "Tom 1 Gate", "Tom 2 Gate", "Tom 3 Gate", "OVH L", "OVH R", "SPD L", "SPD R"] },
  { label: "Guitars", instruments: ["EG1 L", "EG1 R", "EG2 L", "EG2 R", "Acoustic 1", "Acoustic 2"] },
  { label: "Bass", instruments: ["Bass", "Bass Dirty", "Synth Bass"] },
  { label: "Keys / Strings", instruments: ["Piano L", "Piano R", "Keys L", "Keys R", "Cello", "Violin"] },
  { label: "Vocals", instruments: ["BGVS 1", "BGVS 2", "BGVS 3", "BGVS 4"] },
  { label: "Percussion", instruments: ["Aux Perc OVH", "Aux Perc Tom", "Aux Perc Snare", "Cajon Front", "Cajon Back"] },
  { label: "Dante / Tracks", instruments: ["Tracks Pad L", "Tracks Pad R", "Tracks EG L", "Tracks EG R", "Tracks Orch L", "Tracks Orch R", "Tracks Bass", "Tracks Perc", "Click"] }
];

const instrumentOptions = instrumentGroups.flatMap((group) => group.instruments);
const danteInstruments = ["Tracks Pad L", "Tracks Pad R", "Tracks EG L", "Tracks EG R", "Tracks Orch L", "Tracks Orch R", "Tracks Bass", "Tracks Perc", "Click", "Keys L", "Keys R"];

const starterSheet = {
  id: "sheet-1",
  title: "Patch Sheet - May 17, 2026",
  date: "2026-05-17",
  rows: [
    { id: "1", instrument: "Kick In", sourceType: "DX2", input: 1 },
    { id: "2", instrument: "Kick Out", sourceType: "DX2", input: 2 },
    { id: "3", instrument: "Snare Top", sourceType: "DX2", input: 3 },
    { id: "4", instrument: "Snare Bottom", sourceType: "DX2", input: 4 },
    { id: "5", instrument: "HiHat", sourceType: "DX2", input: 5 },
    { id: "6", instrument: "Tom 1", sourceType: "DX2", input: 6 },
    { id: "7", instrument: "Tom 2", sourceType: "DX2", input: 7 },
    { id: "8", instrument: "OVH L", sourceType: "DX2", input: 8 },
    { id: "9", instrument: "OVH R", sourceType: "DX2", input: 9 },
    { id: "10", instrument: "SPD L", sourceType: "DX2", input: 10 },
    { id: "11", instrument: "Aux Perc OVH", sourceType: "DX1", input: 3 },
    { id: "12", instrument: "Bass", sourceType: "DX2", input: 14 },
    { id: "13", instrument: "Piano L", sourceType: "DX3", input: 3 },
    { id: "14", instrument: "Piano R", sourceType: "DX3", input: 4 },
    { id: "15", instrument: "Acoustic 1", sourceType: "DX4", input: 10 },
    { id: "16", instrument: "EG1 L", sourceType: "DX3", input: 10 },
    { id: "17", instrument: "EG1 R", sourceType: "DX3", input: 10 },
    { id: "18", instrument: "EG2 L", sourceType: "DX3", input: 11 },
    { id: "19", instrument: "EG2 R", sourceType: "DX3", input: 12 },
    { id: "20", instrument: "Tracks Pad L", sourceType: "Dante", input: 1 },
    { id: "21", instrument: "Tracks Pad R", sourceType: "Dante", input: 2 },
    { id: "22", instrument: "Keys L", sourceType: "Dante", input: 3 },
    { id: "23", instrument: "Keys R", sourceType: "Dante", input: 4 },
    { id: "24", instrument: "Tracks Orch L", sourceType: "Dante", input: 5 },
    { id: "25", instrument: "Tracks Orch R", sourceType: "Dante", input: 6 },
    { id: "26", instrument: "Tracks Bass", sourceType: "Dante", input: 7 },
    { id: "27", instrument: "Tracks Perc", sourceType: "Dante", input: 8 },
    { id: "28", instrument: "Click", sourceType: "Dante", input: 9 }
  ]
};

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDateForTitle(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function nextSunday(fromDate = new Date()) {
  const date = new Date(fromDate);
  const daysUntilSunday = (7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + daysUntilSunday);
  return date.toISOString().slice(0, 10);
}

function getInputOptions(sourceType) {
  return Array.from({ length: sourceType === "Dante" ? 9 : 16 }, (_, i) => i + 1);
}

export function translatePatch(sourceType, physicalInput) {
  const input = Number(physicalInput);
  if (!sourceType || !input) return { foh: "", broadcast: "" };
  if (sourceType === "Dante") return { foh: `IO Port 1 - ch${54 + input}`, broadcast: `IO Port 1 - ch${92 + input}` };
  if (sourceType === "DX1") return { foh: `DX1/2 - ch${input}`, broadcast: `IO Port 1 - ch${input + 12}` };
  if (sourceType === "DX2") return { foh: `DX1/2 - ch${input + 16}`, broadcast: `IO Port 1 - ch${input + 28}` };
  if (sourceType === "DX3") return { foh: `DX3/4 - ch${input}`, broadcast: `IO Port 1 - ch${input + 44}` };
  if (sourceType === "DX4") return { foh: `DX3/4 - ch${input + 16}`, broadcast: `IO Port 1 - ch${input + 60}` };
  return { foh: "", broadcast: "" };
}

function sortForExport(rows) {
  return [...rows].sort((a, b) => {
    if (a.sourceType === "Dante" && b.sourceType !== "Dante") return 1;
    if (a.sourceType !== "Dante" && b.sourceType === "Dante") return -1;
    return 0;
  });
}

function formatPhysicalPatch(row) {
  if (!row.sourceType || !row.input) return "Unpatched";
  return `${row.sourceType} ch${row.input}`;
}

function compareRows(previousRows, currentRows) {
  const previousByInstrument = new Map(previousRows.map((row) => [row.instrument.toLowerCase().trim(), row]));
  return currentRows.map((currentRow) => {
    const previousRow = previousByInstrument.get(currentRow.instrument.toLowerCase().trim());
    if (!previousRow) return { type: "Added", instrument: currentRow.instrument || "Unnamed input", before: "", after: formatPhysicalPatch(currentRow) };
    const before = formatPhysicalPatch(previousRow);
    const after = formatPhysicalPatch(currentRow);
    return before !== after ? { type: "Moved", instrument: currentRow.instrument || "Unnamed input", before, after } : null;
  }).filter(Boolean);
}

function findConflicts(rows) {
  const map = new Map();
  rows.forEach((row) => {
    if (!row.sourceType || !row.input) return;
    const key = `${row.sourceType}-${row.input}`;
    const existing = map.get(key) || [];
    existing.push(row);
    map.set(key, existing);
  });
  return [...map.entries()]
    .filter(([, matches]) => matches.length > 1)
    .map(([key, matches]) => ({ key, input: formatPhysicalPatch(matches[0]), instruments: matches.map((row) => row.instrument || "Unnamed input") }));
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function buildExportHtml(sheet) {
  const sorted = sortForExport(sheet.rows);
  const standardRows = sorted.filter((row) => row.sourceType !== "Dante");
  const danteRows = sorted.filter((row) => row.sourceType === "Dante");
  const tableRow = (row) => {
    const translated = translatePatch(row.sourceType, row.input);
    return `<tr><td>${escapeHtml(row.instrument)}</td><td>${escapeHtml(translated.foh)}</td><td>${escapeHtml(translated.broadcast)}</td></tr>`;
  };
  return `<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(sheet.title)}</title><style>
    @page{size:letter;margin:0.65in 0.5in}*{box-sizing:border-box}body{margin:0;background:white;color:black;font-family:Arial,Helvetica,sans-serif}.page{width:100%;display:flex;flex-direction:column;align-items:center;padding-top:.45in}h1{margin:0 0 .28in 0;text-align:center;font-size:25px;line-height:1.15;font-weight:700}table{border-collapse:collapse;border:1px solid #000;font-size:16px;line-height:1.15}th,td{border:1px solid #000;padding:5px 11px;text-align:left;white-space:nowrap;font-weight:400}th,.section-row td{background:#d9d9d9}.section-row td{font-weight:700}
  </style></head><body><div class="page"><h1>${escapeHtml(sheet.title)}</h1><table><thead><tr><th>Instrument</th><th>FOH Patch</th><th>Broadcast Patch</th></tr></thead><tbody>${standardRows.map(tableRow).join("")}${danteRows.length ? `<tr class="section-row"><td colspan="3">DANTE</td></tr>${danteRows.map(tableRow).join("")}` : ""}</tbody></table></div><script>window.onload=function(){window.print()};</script></body></html>`;
}

function safeLoadSheets() {
  try {
    const saved = localStorage.getItem("waymakerPatchSheets");
    return saved ? JSON.parse(saved) : [starterSheet];
  } catch {
    return [starterSheet];
  }
}

export default function App() {
  const [sheets, setSheets] = useState(safeLoadSheets);
  const [activeSheetId, setActiveSheetId] = useState(() => localStorage.getItem("activePatchSheetId") || "sheet-1");

  useEffect(() => {
    localStorage.setItem("waymakerPatchSheets", JSON.stringify(sheets));
    localStorage.setItem("activePatchSheetId", activeSheetId);
  }, [sheets, activeSheetId]);

  const activeSheet = sheets.find((sheet) => sheet.id === activeSheetId) || sheets[0];
  const activeIndex = sheets.findIndex((sheet) => sheet.id === activeSheet.id);
  const previousSheet = activeIndex > 0 ? sheets[activeIndex - 1] : null;
  const changes = useMemo(() => previousSheet ? compareRows(previousSheet.rows, activeSheet.rows) : [], [previousSheet, activeSheet]);
  const conflicts = useMemo(() => findConflicts(activeSheet.rows), [activeSheet.rows]);

  function updateActiveSheet(updater) {
    setSheets((current) => current.map((sheet) => sheet.id === activeSheet.id ? updater(sheet) : sheet));
  }

  function updateRow(rowId, field, value) {
    updateActiveSheet((sheet) => ({
      ...sheet,
      rows: sheet.rows.map((row) => {
        if (row.id !== rowId) return row;
        const updated = { ...row, [field]: value };
        if (field === "sourceType") updated.input = 1;
        if (field === "instrument" && danteInstruments.includes(value)) updated.sourceType = "Dante";
        return updated;
      })
    }));
  }

  function addRow() {
    updateActiveSheet((sheet) => ({ ...sheet, rows: [...sheet.rows, { id: createId(), instrument: "", sourceType: "DX1", input: 1 }] }));
  }

  function deleteRow(rowId) {
    updateActiveSheet((sheet) => ({ ...sheet, rows: sheet.rows.filter((row) => row.id !== rowId) }));
  }

  function duplicateSheet() {
    const date = nextSunday();
    const newSheet = {
      id: createId(),
      title: `Patch Sheet - ${formatDateForTitle(date)}`,
      date,
      rows: activeSheet.rows.map((row) => ({ ...row, id: createId() }))
    };
    setSheets((current) => [...current, newSheet]);
    setActiveSheetId(newSheet.id);
  }

  function updateSheetDate(date) {
    updateActiveSheet((sheet) => ({ ...sheet, date, title: `Patch Sheet - ${formatDateForTitle(date)}` }));
  }

  function exportPdf() {
    const exportWindow = window.open("", "_blank", "width=900,height=1100");
    if (!exportWindow) return alert("Popup blocked. Please allow popups and try again.");
    exportWindow.document.open();
    exportWindow.document.write(buildExportHtml(activeSheet));
    exportWindow.document.close();
  }

  return (
    <div className="app">
      <header className="topbar">
        <div><div className="eyebrow">Waymaker AVL</div><h1>Patch Sheet App</h1></div>
        <div className="actions"><button className="primary" onClick={duplicateSheet}>Duplicate Last Sunday</button><button onClick={addRow}>Add Input</button><button onClick={exportPdf}>Export PDF</button></div>
      </header>

      <div className="layout">
        <aside className="archive"><h2>Archive</h2>{sheets.map((sheet) => <button key={sheet.id} className={sheet.id === activeSheet.id ? "active" : ""} onClick={() => setActiveSheetId(sheet.id)}><strong>{sheet.title}</strong><span>{sheet.date}</span></button>)}</aside>

        <main>
          {conflicts.length > 0 && <section className="warning"><strong>Patch conflicts found:</strong>{conflicts.map((conflict) => <div key={conflict.key}>{conflict.input}: {conflict.instruments.join(", ")}</div>)}</section>}

          <section className="card">
            <input className="titleInput" value={activeSheet.title} onChange={(e) => updateActiveSheet((sheet) => ({ ...sheet, title: e.target.value }))} />
            <input className="dateInput" type="date" value={activeSheet.date} onChange={(e) => updateSheetDate(e.target.value)} />
            <div className="tableWrap"><table><thead><tr><th>Instrument</th><th>Source</th><th>Physical Input</th><th>FOH Patch</th><th>Broadcast Patch</th><th></th></tr></thead><tbody>
              {activeSheet.rows.map((row) => {
                const translated = translatePatch(row.sourceType, row.input);
                const hasConflict = conflicts.some((conflict) => conflict.input === formatPhysicalPatch(row));
                return <tr key={row.id} className={hasConflict ? "conflictRow" : ""}>
                  <td><select value={row.instrument} onChange={(e) => updateRow(row.id, "instrument", e.target.value)}><option value="">Select Instrument</option>{instrumentGroups.map((group) => <optgroup key={group.label} label={group.label}>{group.instruments.map((instrument) => <option key={instrument} value={instrument}>{instrument}</option>)}</optgroup>)}</select></td>
                  <td><select value={row.sourceType} onChange={(e) => updateRow(row.id, "sourceType", e.target.value)}>{sourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></td>
                  <td><select value={row.input} onChange={(e) => updateRow(row.id, "input", Number(e.target.value))}>{getInputOptions(row.sourceType).map((input) => <option key={input} value={input}>ch{input}</option>)}</select></td>
                  <td className="patch">{translated.foh}</td><td className="patch">{translated.broadcast}</td><td><button onClick={() => deleteRow(row.id)}>Delete</button></td>
                </tr>
              })}
            </tbody></table></div>
          </section>

          <section className="card"><h2>Change Review</h2>
            {!previousSheet && <p className="muted">No previous sheet selected for comparison yet.</p>}
            {previousSheet && changes.length === 0 && <p className="muted">No patch changes from the previous archived sheet.</p>}
            {changes.length > 0 && <table><thead><tr><th>Type</th><th>Instrument</th><th>Previous</th><th>Current</th></tr></thead><tbody>{changes.map((change, index) => <tr key={`${change.instrument}-${index}`}><td className="patch">{change.type}</td><td>{change.instrument}</td><td className="muted">{change.before}</td><td>{change.after}</td></tr>)}</tbody></table>}
          </section>
        </main>
      </div>
    </div>
  );
}
