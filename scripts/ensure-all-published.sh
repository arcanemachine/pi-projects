#!/usr/bin/env bash

set -u -o pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
unpublished=()
checked=0

shopt -s nullglob
for package_json in "$repo_root"/packages/*/package.json; do
  package_dir="$(dirname -- "$package_json")"
  package_path="${package_dir#"$repo_root"/}"
  metadata="$(node - "$package_json" <<'NODE'
const fs = require("node:fs");

const packageJsonPath = process.argv[2];
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  if (
    packageJson.private === true ||
    typeof packageJson.name !== "string" ||
    typeof packageJson.version !== "string"
  ) {
    process.exit(0);
  }

  process.stdout.write(`${packageJson.name}\t${packageJson.version}`);
} catch {
  process.exit(1);
}
NODE
  )"

  if [[ $? -ne 0 ]]; then
    unpublished+=("$package_path (invalid package.json)")
    continue
  fi

  [[ -z "$metadata" ]] && continue

  IFS=$'\t' read -r package_name current_version <<< "$metadata"
  checked=$((checked + 1))

  published_output=""
  if published_output="$(npm view "${package_name}@${current_version}" version 2>/dev/null)"; then
    published_version="$(printf '%s' "$published_output" | tr -d '\r\n')"
    if [[ "$published_version" != "$current_version" ]]; then
      unpublished+=("$package_path — ${package_name}@${current_version} (registry returned ${published_version})")
    fi
  else
    unpublished+=("$package_path — ${package_name}@${current_version} (not published)")
  fi
done

if (( ${#unpublished[@]} > 0 )); then
  printf 'Unpublished or stale packages:\n'
  printf ' - %s\n' "${unpublished[@]}"
  exit 1
fi

printf 'All %d publishable packages are published.\n' "$checked"
