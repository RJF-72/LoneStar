#!/usr/bin/env bash
set -euo pipefail

URL="${1:-}"
MID="${2:-}"
if [[ -z "$URL" || -z "$MID" ]]; then
  echo "Usage: $0 <model_url> <model_id>"
  exit 1
fi

progress() {
  curl -s "http://localhost:8000/api/compression/progress?modelId=$MID" | jq -r '.progress.status + " " + ( .progress.downloaded|tostring ) + "/" + ( .progress.total|tostring )'
}

wait_until_complete() {
  echo "Waiting for modelId=$MID to complete..."
  while true; do
    S=$(curl -s "http://localhost:8000/api/compression/progress?modelId=$MID" | jq -r '.progress.status // "unknown"')
    [[ "$S" == "complete" ]] && echo "Baseline complete." && break
    [[ "$S" == "error" ]] && echo "Job error." && exit 2
    sleep 5
  done
}

report_models() {
  curl -s "http://localhost:8000/api/compression/models" | jq .
}

# 1) Wait for baseline to complete
wait_until_complete

echo "Baseline models index:"
report_models

# 2) Restart backend to load new 88% target
echo "Restarting backend to apply 88% target..."
fuser -k 8000/tcp || true
cd "$(dirname "$0")/../backend"
npm run build >/dev/null 2>&1
SKIP_MODEL_LOAD=true nohup npm start > server.log 2>&1 &
sleep 1
curl -s http://localhost:8000/health | jq . >/dev/null || { echo "Backend failed to start"; exit 3; }

# 3) Remove previous compressed artifact (same modelId = hash(url))
echo "Removing previous artifact for modelId=$MID..."
curl -s -X DELETE "http://localhost:8000/api/compression/models/$MID" | jq .

# 4) Re-run with same URL (applies new target)
echo "Re-starting compression with 88% target..."
RESP=$(curl -s -X POST -H 'Content-Type: application/json' -d "{\"url\":\"$URL\"}" "http://localhost:8000/api/compression/download-compress?async=1")
echo "$RESP" | jq .

# ModelId remains the same (md5(url))

# 5) Wait for re-run to complete
wait_until_complete

echo "Re-run models index:"
report_models

echo "Done."
