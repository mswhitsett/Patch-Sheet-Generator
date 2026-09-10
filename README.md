# Patch 2.0

Patch 2 is a separate macOS app from Patch 1. Its bundle identifier is
`church.waymaker.patchsheet.v2`, so installing it does not replace the working
v1 app or its local archive.

## Security decision before deployment

The repository is currently **public**. Make it private before adding the real
Supabase URL or browser-safe key to GitHub Actions. Never add a service-role key,
database password, or user password to this repository. The client uses only the
browser-safe publishable/anon key; Row Level Security limits data access to rows
in `team_members`.

## Supabase setup

1. Create a Supabase project and run
   `supabase/migrations/202609100001_patch_v2.sql` in the SQL editor.
2. In Authentication, disable public signups. Invite each team member by email.
3. Add each invited user's UUID to the allowlist:

   ```sql
   insert into public.team_members (user_id, display_name)
   values ('USER_UUID_FROM_AUTH_USERS', 'Display Name');
   ```

4. Copy `.env.example` to `.env` and enter the Supabase URL and browser-safe key.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as GitHub Actions secrets.

## Migrating the existing v1 archive

The migration is additive and never deletes or edits v1 data.

1. Keep `local-archive-export.json` in a secure local location; Git ignores it.
2. Sign in to Patch 2 as an authorized team member.
3. Choose **Migrate v1 Archive** and select the JSON file.
4. Confirm the reported count and compare several sheets with Patch 1.
5. Keep the v1 app data and JSON backup until the archive is verified.

The importer assigns new UUIDs and uploads every sheet and row. Re-importing the
same export creates duplicates, so run it once.

## Collaboration behavior

- Changes autosave with Saving, Saved, and Connection error indicators.
- A local cache remains available during interruptions.
- Realtime events update every open app without a Refresh button.
- Presence identifies other team members viewing the sheet.
- Saves preserve the prior revision and use version checks against silent overwrite.
- Final sheets are locked until deliberately returned to Draft.
- Any archived sheet can be duplicated. New UUIDs and `created_at` put it first.

## Development

```sh
npm install
npm run dev
npm run build
npm run tauri:build
```

PDF export and the Preview-based local printing workflow are preserved.
