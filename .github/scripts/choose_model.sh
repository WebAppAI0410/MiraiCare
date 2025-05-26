#!/usr/bin/env bash
set -euo pipefail
body="${1:-""}"
case "$body" in
  *"[opus]"*   | *"#opus"*)   key=opus   ;;
  *"[sonnet]"* | *"#sonnet"*) key=sonnet ;;
  *"[haiku]"*  | *"#haiku"*)  key=haiku  ;;
  *"[heavy]"*  | *"#heavy"*)  key=opus   ;;
  *)                          key=haiku ;;
esac
params=$(jq -c ".${key}" .github/claude-models.json)
echo "anthropic_parameters=$params" >>"$GITHUB_OUTPUT"
echo "model=$key"                   >>"$GITHUB_OUTPUT" 