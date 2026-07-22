#!/usr/bin/env bash
#
# install-hooks.sh — kích hoạt git hooks cho clone này (ADR-0010 Quyết định 4).
# Chạy một lần mỗi clone: bash scripts/install-hooks.sh
#
set -eu

# Kiểm đang trong git repo.
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "✗ Không phải git repo. Chạy script này từ gốc repo." >&2
  exit 1
fi

git config core.hooksPath .githooks
echo "✓ Đã set core.hooksPath=.githooks. Git hooks trong .githooks/ sẽ chạy từ clone này."
