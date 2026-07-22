#!/bin/bash
# CI check — chặn dùng process.cwd() trong scripts/
# Rule: mọi script phải xác định repo root từ import.meta.url,
# không bao giờ tin vào process.cwd().
# Commit: xem DECISIONS.md

set -euo pipefail

cd "$(dirname "$0")/.."

FOUND=$(grep -rn 'process\.cwd()' scripts/ --include='*.ts' --include='*.js' --include='*.mjs' --exclude-dir=node_modules 2>/dev/null || true)

if [ -n "$FOUND" ]; then
  echo ""
  echo "❌ CẤM: process.cwd() trong scripts/"
  echo ""
  echo "$FOUND"
  echo ""
  echo "Lý do: npm --prefix đổi CWD, process.cwd() không còn trỏ về repo root."
  echo "Sửa: dùng import.meta.url (ESM) hoặc __dirname (CJS) để xác định repo root"
  echo "      từ vị trí của chính script file, không phụ thuộc CWD."
  echo ""
  exit 1
fi
