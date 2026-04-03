#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:4100}"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

run_case() {
  local name="$1"
  local url="$2"
  local expected="$3"
  local header_file="${TMP_DIR}/${name}.headers"
  local body_file="${TMP_DIR}/${name}.body"

  local status
  status="$(curl -sS -D "${header_file}" "${url}" -o "${body_file}" -w "%{http_code}")"

  echo "=== ${name} ==="
  echo "URL: ${url}"
  echo "Status: ${status} (expected ${expected})"
  echo "--- Headers ---"
  sed -n '1,20p' "${header_file}"
  echo "--- Body ---"
  cat "${body_file}"
  echo
}

echo "Verifying ${BASE_URL}/api/news"
echo

run_case "valid_request" "${BASE_URL}/api/news?q=world&language=en" "200"
run_case "missing_q" "${BASE_URL}/api/news?language=en" "400"
run_case "invalid_language" "${BASE_URL}/api/news?q=world&language=xx" "400"
run_case "forced_upstream_error" "${BASE_URL}/api/news?__debug=upstream_error&q=world&language=en" "502"

echo "=== rate_limit ==="
first_429_headers=""
first_429_body=""

for i in $(seq 1 40); do
  header_file="${TMP_DIR}/rate-${i}.headers"
  body_file="${TMP_DIR}/rate-${i}.body"
  status="$(curl -sS -D "${header_file}" "${BASE_URL}/api/news?__debug=upstream_error&q=rapid-${i}&language=en" -o "${body_file}" -w "%{http_code}")"
  echo "request ${i}: ${status}"

  if [[ "${status}" == "429" ]]; then
    first_429_headers="${header_file}"
    first_429_body="${body_file}"
    break
  fi
done

if [[ -n "${first_429_headers}" ]]; then
  echo "--- First 429 headers ---"
  cat "${first_429_headers}"
  echo "--- First 429 body ---"
  cat "${first_429_body}"
else
  echo "No 429 response observed in 40 rapid requests."
fi
