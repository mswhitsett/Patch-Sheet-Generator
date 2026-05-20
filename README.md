# Patch v1.0

A macOS desktop app for building, managing, and printing live production patch sheets.

## Current Features

- Archive of past patch sheets
- Duplicate Last Sunday workflow
- Categorized instrument dropdowns
- Source/input dropdowns
- Automatic FOH/Broadcast patch translation
- Dante auto-routing for tracks inputs
- Channel conflict detection
- Stereo pair warnings
- Change review against the previous patch sheet
- Print-ready PDF export
- Direct print workflow through Preview
- DANTE section automatically sorted to the bottom of exports
- Newest patch sheets appear at the top of the archive

## Installing Patch

1. Download the latest `.dmg` file.
2. Open the `.dmg` and drag **Patch** into the Applications folder.
3. The first time you open the app, macOS may block it because the app is not signed.
   - If this happens, move Patch to Applications, then **right-click the app and choose `Open` the first time**.

## Printing Setup (Important)

Patch uses macOS permissions to automatically open Preview and bring up the print dialog.

If clicking **Print** opens Preview but does **not** open the print window:

1. Open:
   **System Settings → Privacy & Security → Accessibility**
2. Make sure **Patch** is enabled.
3. If Patch is already enabled but printing still does not work:
   - Toggle it **off → on**
   - Quit and reopen Patch

You may also need to approve **Automation permissions for System Events** the first time printing is used.

## Versioning

Current stable release: **Patch v1.0**
