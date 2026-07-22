# PROMPT FACTORY — Cơ chế sinh & kiểm prompt cho Code Agent

> **Vị trí trong hệ thống:** Cowork (lên kế hoạch) → Prompt Factory (sinh + QA prompt) → Claude Code (thực thi)
> **Nguồn quyền:** GOVERNANCE.md §4.7 (Prompt QA 6 tiêu chí P1–P6), RACI §3.1 (Cowork soạn, Founder duyệt)
> **Ngày:** 2026-06-12

---

## 0. Prompt là gì trong hệ thống này

Prompt là **hợp đồng** giữa Cowork (người lên kế hoạch) và Claude Code (người thực thi).

Nó không phải là câu chat. Nó là văn bản pháp lý nội bộ: quy định Claude Code được làm gì, không được làm gì, phải đọc gì, phải dừng khi nào, phải qua QA nào.

Prompt sai → code sai toàn bộ đợt. Prompt không có QA → lỗ hổng kiểm soát.

---

## 1. Sơ đồ dòng chảy

```
┌──────────────┐    ┌─────────────────┐    ┌──────────────────────────┐
│   Cowork     │    │  Prompt Factory │    │  Claude Code (khép kín) │
│              │    │                 │    │                          │
│ 1. Hoàn tất  │───→│ 2. Sinh prompt  │───→│ 3. Đọc spec, viết code  │
│    spec/mock │    │    từ template  │    │ 4. git commit           │
│              │    │                 │    │ 5. SPAWN QA AGENT (auto)│
│              │    │ 6. QA prompt    │    │    ├─ TRƯỢT → sửa → QA  │
│              │←───│    (P1-P6)      │    │    └─ ĐẠT → commit msg   │
│              │    │                 │    │       + QA agent ID     │
│ 7. Nhận báo  │←───│ → ĐẠT: bàn giao │←───│ 8. Báo Cowork           │
│    cáo ĐẠT   │    │ → TRƯỢT: sửa    │    │                          │
└──────────────┘    └─────────────────┘    └──────────────────────────┘
```

---

## 2. Prompt Template chuẩn

Mọi prompt cho Claude Code phải theo cấu trúc 7 phần này. Không phần nào được bỏ.

```markdown
# PROMPT — [Mã bước]: [Tên nhiệm vụ]

**Vai:** Tác nhân thực thi (Claude Code). Làm đúng spec, không tự quyết.

---

## Trước khi code

```
git checkout -b feat/[mã bước]-[mô tả]
```

Làm trên branch này. Mỗi đợt commit riêng. Merge về main chỉ khi toàn bộ đợt đạt QA.

---

## Đầu vào bắt buộc

| Thứ tự | File | Vai trò |
|---|---|---|
| ... | ... | ... |

---

## Phạm vi — được làm gì

[Liệt kê cụ thể: file nào, entity nào, thứ tự nào]

---

## Ràng buộc cứng — vi phạm là fail QA

### R1 — [Tên ràng buộc]
[Mô tả cụ thể, trỏ về spec gốc]

---

## Cấm

- Cấm tự quyết định kiến trúc. Mơ hồ → DỪNG, hỏi.
- [Các điều cấm cụ thể từ CONSTITUTION và spec]

---

## Cổng ra — sau mỗi đợt (vòng lặp khép kín)

1. Viết code xong → `git add` + `git commit -m "feat(...): [mô tả]"`
2. **Spawn QA agent độc lập** (sub-agent, model khác, không context code vừa viết) với prompt: "Audit commit [hash] trên branch này. Spec: [đường dẫn]. Trả về: ĐẠT/TRƯỢT + danh sách lỗi."
3. Nếu TRƯỢT (có lỗi Cao): sửa code, `git commit --amend`, quay lại bước 2
4. Nếu ĐẠT (0 lỗi Cao): `git commit --amend -m "[msg gốc] | QA: [agent-id], ĐẠT"` — **ghi agent ID QA vào commit message**
5. Báo Cowork: "Đợt N + QA đạt, commit [hash]"

**Không vi phạm vì:** QA agent là instance riêng (không context code) — thỏa GOVERNANCE §4.3 "không phải agent đã soạn". Cowork kiểm hậu kiểm: commit message phải có dòng QA với agent ID thật. Thiếu = reject.

---
## QA Prompt — P1–P6

| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| P1 — Đầu vào đủ | ✅ / ❌ | ... |
| P2 — Ràng buộc cứng | ✅ / ❌ | ... |
| P3 — Phạm vi rõ | ✅ / ❌ | ... |
| P4 — Cấm tự quyết | ✅ / ❌ | ... |
| P5 — Cổng ra | ✅ / ❌ | ... |
| P6 — Không tạo luật | ✅ / ❌ | ... |

**Kết luận:** ĐẠT (6/6) / TRƯỢT (n lỗi)
**Người QA:** ... | **Timestamp:** YYYY-MM-DD
```

**Nguyên tắc điền template:**

- Phần "Đầu vào": luôn trỏ file spec cụ thể kèm section — không "đọc những gì liên quan"
- Phần "Phạm vi": dùng bảng — mỗi dòng một file output
- Phần "Ràng buộc": mỗi R trỏ về một dòng cụ thể trong CONSTITUTION hoặc 04-CONSTRAINTS
- Phần "Cấm": câu đầu tiên luôn là "Cấm tự quyết định kiến trúc. Mơ hồ → DỪNG, hỏi." — đây là P4
- Phần "Cổng ra": luôn có "Dừng" — không có "nếu thấy ổn thì làm tiếp"

---

## 3. Prompt QA — P1 đến P6

Trước khi bàn giao prompt cho Claude Code, chạy 6 câu kiểm. Cả 6 phải ĐẠT.

| # | Tiêu chí | Hỏi gì | Nguồn |
|---|---|---|---|
| P1 | Đầu vào đủ | Prompt có liệt kê đủ spec cần đọc không? Thiếu spec đầu vào là nguyên nhân số một của code sai | — |
| P2 | Ràng buộc cứng | Prompt có liệt kê các điều cấm và ràng buộc từ CONSTITUTION và 04-CONSTRAINTS không? | GOVERNANCE §4.7 |
| P3 | Phạm vi rõ | Prompt có giới hạn rõ việc gì được làm, việc gì phải dừng không? Không có câu "làm thêm nếu thấy cần" | GOVERNANCE §4.7 |
| P4 | Cấm tự quyết | Prompt có dòng "gặp mơ hồ thì DỪNG, hỏi" không? Không có câu "tùy bạn quyết định" cho việc chạm cấu trúc | GOVERNANCE §4.7 |
| P5 | Cổng ra | Prompt có chỉ định phải qua QA nào trước khi sang bước tiếp không? | GOVERNANCE §4.7 |
| P6 | Không tạo luật | Prompt có vô tình tạo quy tắc mới, cổng mới, hoặc thay đổi thẩm quyền không? | GOVERNANCE §4.7, §10.2 |

### Cách chạy

1. Cowork đọc prompt mình vừa viết
2. Với mỗi P, tự hỏi câu hỏi và trả lời ĐẠT / TRƯỢT kèm lý do
3. Nếu TRƯỢT → sửa prompt, chạy lại từ đầu
4. Nếu cả 6 ĐẠT → báo cáo founder (nếu founder muốn duyệt), hoặc bàn giao trực tiếp

### Người chạy

- **Mặc định:** Cowork tự QA (tự kiểm nội bộ)
- **Nếu founder yêu cầu:** QA agent độc lập kiểm prompt (cùng 6 tiêu chí), xuất báo cáo, founder duyệt

---

## 4. Ví dụ prompt đã qua QA

File: `playbook/ai/prompts/B8.1-SCHEMA.md`

Kết quả tự audit 2026-06-12:

| Tiêu chí | Kết quả | Ghi chú |
|---|---|---|
| P1 | ✅ | 4 file: 08-SCHEMA_PLAN, 01-CONTENT_MODEL, 04-CONSTRAINTS, DESIGN.md |
| P2 | ✅ | R1–R7 trỏ về CONTENT_MODEL + 04-CONSTRAINTS |
| P3 | ✅ | 18 file chia 3 đợt, mỗi đợt có bảng checklist |
| P4 | ✅ | "Gặp mơ hồ → DỪNG, hỏi" |
| P5 | ✅ | QA đối chiếu với CONTENT_MODEL + kiểm R1–R7 mỗi đợt |
| P6 | ✅ | Không cổng mới, không quy tắc mới |

---

## 5. Tích hợp vào quy trình Cowork

```
Bước N hoàn tất spec/mockup/plan
  │
  ├─→ Cowork sinh prompt theo template §2
  │
  ├─→ Cowork tự QA prompt theo P1–P6 (§3)
  │     │
  │     ├─ TRƯỢT → sửa prompt → QA lại
  │     │
  │     └─ ĐẠT → bàn giao
  │
  └─→ Claude Code nhận prompt, thực thi
        │
        └─→ QA1 sau mỗi đợt (theo cổng ra trong prompt)
```

---

## 6. Prompt lưu ở đâu

Mọi prompt đã qua QA được lưu tại `playbook/ai/prompts/` với tên file `[Mã bước]-[Mô tả ngắn].md`.

Đây là artifact lịch sử: nếu code sai, truy ngược về prompt để biết prompt có lệch không.

Prompt không sửa sau khi đã bàn giao. Nếu phát hiện prompt sai sau khi Claude Code đã chạy → dừng Claude Code, sửa prompt, chạy lại từ đầu.

---

## 7. QA Prompt — khối P1–P6 ở cuối mỗi prompt

Khối QA (§2 phần 7) là một phần của prompt — không phải file riêng. Nó là bằng chứng prompt đã qua kiểm (GOVERNANCE §4.1).
