use std::collections::BTreeSet;

pub fn missing_env_keys(example: &str, actual: &str) -> Vec<String> {
    let expected = parse_env_keys(example);
    let present = parse_env_keys(actual);
    expected.difference(&present).cloned().collect::<Vec<_>>()
}

pub fn parse_env_keys(input: &str) -> BTreeSet<String> {
    let mut keys = BTreeSet::new();
    for line in input.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        if let Some((k, _)) = line.split_once('=') {
            let k = k.trim();
            if !k.is_empty() {
                keys.insert(k.to_string());
            }
        }
    }
    keys
}
