# CLAUDE.md — Master Project Framework (repo khuôn)

> File này dành cho phiên làm việc TRONG repo khuôn. Nó không thuộc về dự án nào. Mỗi dự án có CLAUDE.md riêng trong repo của dự án đó.

## 1. Repo này là gì

Khuôn chuẩn cho mọi dự án web vận hành bởi một founder cộng đội tác nhân AI. Chứa: hiến pháp (CONSTITUTION v2.2.0), luật thực thi (GOVERNANCE v1.0.0), quy trình 9 bước (PLAYBOOK v1.1.0), buồng máy governance/, 10 template, 4 prompt theo vai. Không chứa code, không chứa nội dung dự án.

## 2. Được làm gì trong repo này

- Chỉnh tài liệu luật, template, prompt vai. Hết.
- Mọi thay đổi luật đi qua quy trình sửa đổi (CONSTITUTION Điều 9) và ghi vào CHANGELOG.md trước khi có hiệu lực.
- Không tự sửa CONSTITUTION.md: đề xuất rồi chủ dự án quyết.
- Nguyên tắc bánh cóc: nguyên tắc và điều cấm chỉ siết thêm, không nới.

## 3. Cấm trong repo này

- Không điền nội dung dự án vào templates/ hay bất kỳ đâu. Dự án sống ở repo riêng, sinh bằng `./init-project.sh ten-du-an`.
- Không tạo nguồn sự thật thứ hai: mỗi loại quy tắc có đúng một file gốc (xem GOVERNANCE mục 10.1).
- Không giữ file tạm: spec mới vào specs/inbox/, xử lý xong phải merge rồi archive.

## 4. Nghi thức phiên

Đầu phiên: đọc README.md và CHANGELOG.md (3 dòng cuối) để biết khuôn đang ở phiên bản nào. Cuối phiên: nếu có sửa luật thì ghi CHANGELOG kèm lý do và người duyệt; nếu có quyết định bị loại thì ghi rõ phương án đã loại.

## 5. Văn phong

Tiếng Việt, sentence case. Không Title Case, không ALL CAPS, không lạm dụng bold, không dùng gạch ngang dài tách mệnh đề. Giữ tên khái niệm tiếng Anh khi cần (spec, gate, ADR, artifact). Giọng trực diện, thiên logic, có phản biện.

## 6. Bản đồ nhanh

Hướng dẫn sử dụng đầy đủ: `docs/huong-dan-su-dung.md`. Thứ bậc tài liệu: CONSTITUTION → overlay dự án → ADR → PLAYBOOK → spec → sản phẩm. Khi hai tài liệu mâu thuẫn, tài liệu tầng trên thắng và tầng dưới phải sửa.
