# Waymaker Patch Sheet App

A Tauri-based Mac desktop app project for Waymaker AVL input patch sheets.

## Current features

- Archive of past patch sheets using local browser/app storage
- Duplicate Last Sunday workflow
- Categorized instrument dropdowns
- Source/input dropdowns
- Automatic FOH/Broadcast patch translation
- Auto-switch Dante/Tracks instruments to Dante source
- Conflict detection when two rows use the same physical input
- Change review against the previous archived sheet
- PDF export window formatted to match the current patch sheet style
- DANTE section automatically exported at the bottom

## Mac app build plan

This project is ready to be built into a Mac `.app`/`.dmg` using GitHub Actions or a local Mac build environment.

For Matt's preferred workflow, the goal is not to run this from Terminal long-term. The source project should be built once into a normal Mac app that can be downloaded, dragged into Applications, and opened.
