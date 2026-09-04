#!/usr/bin/env bash

set -u -o pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
published=()
unpublished=()
errors=()
checked=0

if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  green=$'\033[32m'
  red=$'\033[31m'
  reset=$'\033[0m'
else
  green=""
  red=""
  reset=""
fi

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
    errors+=("$package_path (invalid package.json)")
    continue
  fi

  [[ -z "$metadata" ]] && continue

  IFS=$'\t' read -r package_name current_version <<< "$metadata"
  checked=$((checked + 1))
  package_spec="${package_name}@${current_version}"
  npm_output=""

  if npm_output="$(npm view "$package_spec" version 2>&1)"; then
    published_version="$(printf '%s' "$npm_output" | tr -d '\r\n')"
    if [[ "$published_version" == "$current_version" ]]; then
      published+=("$package_path — $package_spec")
    else
      unpublished+=("$package_path — $package_spec (registry returned ${published_version:-no version})")
    fi
  elif [[ "$npm_output" == *E404* || "$npm_output" == *404* ]]; then
    unpublished+=("$package_path — $package_spec (not published)")
  else
    error_summary="${npm_output//$'\n'/ }"
    error_summary="${error_summary//$'\r'/ }"
    errors+=("$package_path — $package_spec (${error_summary:0:200})")
  fi
done

printf 'Published packages:\n'
if (( ${#published[@]} == 0 )); then
  printf ' (none)\n'
else
  for item in "${published[@]}"; do
    printf ' %s✓%s %s\n' "$green" "$reset" "$item"
  done
fi

if (( ${#unpublished[@]} > 0 )); then
  printf '\nUnpublished items:\n'
  for item in "${unpublished[@]}"; do
    printf ' %s✗%s %s\n' "$red" "$reset" "$item"
  done
fi

if (( ${#errors[@]} > 0 )); then
  printf '\nErrors checking publication status:\n'
  for item in "${errors[@]}"; do
    printf ' %s✗%s %s\n' "$red" "$reset" "$item"
  done
fi

if (( ${#errors[@]} > 0 )); then
  exit 2
elif (( ${#unpublished[@]} > 0 )); then
  exit 1
fi

printf '\nAll %d publishable packages are published.\n' "$checked"
