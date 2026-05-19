#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

#[tauri::command]
fn print_pdf(pdf_base64: String, filename: String) -> Result<(), String> {
    use base64::{engine::general_purpose, Engine as _};

    let pdf_bytes = general_purpose::STANDARD
        .decode(pdf_base64)
        .map_err(|e| format!("Failed to decode PDF: {}", e))?;

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    let temp_path = std::env::temp_dir().join(format!("{}_{}.pdf", filename, timestamp));

    fs::write(&temp_path, pdf_bytes)
        .map_err(|e| format!("Failed to write PDF: {}", e))?;

    let script = format!(
        r#"
        set pdfPath to POSIX file "{}"

        tell application "Preview"
            activate
            open pdfPath
        end tell

        delay 2

        tell application "System Events"
            tell process "Preview"
                set frontmost to true
                delay 0.5
                keystroke "p" using command down
            end tell
        end tell
        "#,
        temp_path.display()
    );

    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .map_err(|e| format!("Failed to launch Preview: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "Preview opened, but macOS did not allow the print shortcut: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok(())
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![print_pdf])
    .run(tauri::generate_context!())
    .expect("error while running Waymaker Patch Sheet App");
}
