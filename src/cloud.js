import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const cloudConfigured = Boolean(url && key);
export const supabase = cloudConfigured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

export async function loadSheets() {
  const { data, error } = await supabase
    .from("patch_sheets")
    .select("*, patch_rows(*)")
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "patch_rows", ascending: true });
  if (error) throw error;
  return data.map(fromDatabaseSheet);
}

function fromDatabaseSheet(sheet) {
  return {
    id: sheet.id,
    title: sheet.title,
    date: sheet.sheet_date,
    name: sheet.name || "",
    status: sheet.status,
    version: sheet.version,
    created_at: sheet.created_at,
    rows: (sheet.patch_rows || []).map((row) => ({
      id: row.id,
      instrument: row.instrument,
      sourceType: row.source_type,
      input: row.input_number,
      position: row.position,
      version: row.version
    }))
  };
}

export async function saveSheet(sheet, expectedVersion) {
  const { data, error } = await supabase.rpc("save_patch_sheet", {
    p_sheet_id: sheet.id,
    p_expected_version: expectedVersion,
    p_title: sheet.title,
    p_sheet_date: sheet.date,
    p_name: sheet.name || "",
    p_status: sheet.status || "draft",
    p_rows: sheet.rows.map((row, position) => ({
      id: row.id,
      instrument: row.instrument,
      source_type: row.sourceType,
      input_number: Number(row.input),
      position
    }))
  });
  if (error) throw error;
  return data;
}

export async function importLocalSheets(sheets) {
  const payload = sheets.map((sheet, index) => ({
    ...sheet,
    id: crypto.randomUUID(),
    rows: (sheet.rows || []).map((row) => ({ ...row, id: crypto.randomUUID() })),
    status: "draft",
    created_at: new Date(Date.now() - index).toISOString()
  }));
  for (const sheet of payload) await saveSheet(sheet, 0);
  return payload.length;
}

export function subscribeToArchive(onChange) {
  return supabase.channel("patch-archive")
    .on("postgres_changes", { event: "*", schema: "public", table: "patch_sheets" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "patch_rows" }, onChange)
    .subscribe();
}

export function joinSheetPresence(sheetId, user, onPresence) {
  const channel = supabase.channel(`sheet:${sheetId}`, { config: { presence: { key: user.id } } });
  channel.on("presence", { event: "sync" }, () => {
    const people = Object.values(channel.presenceState()).flat()
      .filter((person) => person.user_id !== user.id);
    onPresence(people);
  });
  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({ user_id: user.id, email: user.email, name: user.user_metadata?.name || "" });
    }
  });
  return channel;
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}
