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

# Bit thực thi là ĐIỀU KIỆN, không phải chi tiết: git BỎ QUA hook không
# executable và chỉ in một dòng `hint:` mà `git push` vẫn thành công. Script này
# thiếu chmod từ đầu, nên `.githooks/pre-push` nằm mode 100644 trong index và
# cổng sớm CHƯA TỪNG chạy cho bất kỳ clone nào — phát hiện 2026-08-25, DR-056.
chmod +x .githooks/*

echo "✓ Đã set core.hooksPath=.githooks và bật bit thực thi. Git hooks trong .githooks/ sẽ chạy từ clone này."
