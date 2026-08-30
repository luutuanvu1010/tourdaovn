-- Ý ĐỊNH của khách, KHÔNG phải sự thật thanh toán (ADR-0031 §2). Site không biết tiền đã về;
-- nhân viên đối soát ngân hàng ngoài hệ. Đơn cũ nhận 'onboard' — đúng sự thật lịch sử.
ALTER TABLE booking ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'onboard';
CREATE INDEX idx_booking_payment ON booking(payment_method);
