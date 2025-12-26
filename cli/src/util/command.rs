pub fn command_exists(cmd: &str) -> bool {
    let path = std::env::var_os("PATH").unwrap_or_default();
    for dir in std::env::split_paths(&path) {
        let p = dir.join(cmd);
        if p.exists() {
            return true;
        }
        #[cfg(windows)]
        {
            let p_exe = dir.join(format!("{cmd}.exe"));
            if p_exe.exists() {
                return true;
            }
        }
    }
    false
}
