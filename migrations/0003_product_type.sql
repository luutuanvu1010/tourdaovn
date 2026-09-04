-- migrations/0003_product_type.sql
-- ADR-0033 quyết định 6: đường ghi runtime học loại sản phẩm thay vì đoán từ slug.
-- DEFAULT 'tour' để mọi đơn đã có được gán đúng loại mà không cần script vá.
-- Thao tác BỒI: mã đang chạy liệt kê cột theo tên (store.ts) nên không đọc cột này.
ALTER TABLE booking ADD COLUMN product_type TEXT NOT NULL DEFAULT 'tour';
