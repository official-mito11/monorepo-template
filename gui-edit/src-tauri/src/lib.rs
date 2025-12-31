mod commands;
mod parser;

use commands::fs::{
    create_directory, create_file, delete_path, read_directory, read_file, rename_path, write_file,
};
use parser::route_analyzer::{self, RouteAnalysis};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn analyze_route_file(path: String, routes_dir: Option<String>) -> RouteAnalysis {
    let routes_dir = routes_dir.unwrap_or_else(|| {
        // Try to infer routes directory from path
        if let Some(idx) = path.find("/routes/") {
            path[..idx + 8].to_string()
        } else if let Some(idx) = path.find("/routes-admin/") {
            path[..idx + 14].to_string()
        } else {
            std::path::Path::new(&path)
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default()
        }
    });
    route_analyzer::analyze_route_file(&path, &routes_dir)
}

#[tauri::command]
fn analyze_routes_directory(dir: String) -> Vec<RouteAnalysis> {
    route_analyzer::analyze_routes_directory(&dir)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            // File system commands
            read_directory,
            read_file,
            write_file,
            create_file,
            create_directory,
            delete_path,
            rename_path,
            // Route analysis commands
            analyze_route_file,
            analyze_routes_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
