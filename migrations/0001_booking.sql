-- Bảng đơn đặt tour — SPEC-2026-08-21-dat-tour §4.5, ADR-0027.
-- Bản ghi gốc của mọi yêu cầu đặt. Báo tin (email, Zalo) chỉ là hệ quả, hỏng không hỏng đơn.
CREATE TABLE booking (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT NOT NULL UNIQUE,        -- TD-yymmdd-XXXX
  created_at    TEXT NOT NULL,               -- ISO 8601 UTC
  tour_slug     TEXT NOT NULL,
  tour_title    TEXT NOT NULL,
  booking_ref   TEXT,
  depart_date   TEXT NOT NULL,               -- YYYY-MM-DD
  pax_json      TEXT NOT NULL,               -- {"adult":2,"child":1,"senior":0,"infant":0}
  quoted_json   TEXT NOT NULL,               -- {"perPax":{...},"total":1450000,"quotedAt":"..."}
  customer_name TEXT NOT NULL,
  phone         TEXT NOT NULL,               -- đã chuẩn hoá 0xxxxxxxxx
  email         TEXT,
  pickup        TEXT,
  note          TEXT,
  lang          TEXT NOT NULL DEFAULT 'vi',
  source        TEXT NOT NULL DEFAULT 'web',
  status        TEXT NOT NULL DEFAULT 'new', -- new | contacted | confirmed | cancelled
  notify_email  TEXT,                        -- sent | failed:<lý do> | skipped
  notify_zalo   TEXT,
  ip_hash       TEXT,
  user_agent    TEXT
);
CREATE INDEX idx_booking_created ON booking(created_at);
CREATE INDEX idx_booking_phone   ON booking(phone);
