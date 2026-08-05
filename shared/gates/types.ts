// Vi phạm gate entity-local: thông điệp lỗi dạng chuỗi. Giữ NGUYÊN văn bản như validator
// CI hiện tại (ADR-0011 Đợt A, R1 behavior-preserving). Đợt B (Studio) đọc cùng kiểu này
// qua Rule.custom để chặn Publish khi thiếu field gate.
export type Violation = string
