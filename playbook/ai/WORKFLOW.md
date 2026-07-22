# WORKFLOW — Quy trình batch + QA gate

> **Vị trí:** Cầu nối giữa PROMPT_FACTORY (sinh prompt) và Claude Code (thực thi)
> **Nguyên lý:** QA gate là vật lý — không thể vượt vì prompt đợt sau chưa tồn tại
> **Ngày:** 2026-06-12

---

## 0. Tại sao cần file này

Prompt nhét cả 3 đợt vào một file → Claude Code chạy một mạch 18 file, không dừng QA giữa chừng.

Giải pháp: **mỗi đợt = một prompt riêng.** Cowork chỉ sinh prompt đợt N+1 sau khi đợt N đạt QA. Claude Code không thể chạy đợt tiếp vì prompt chưa tồn tại — đây là gate vật lý.

---

## 1. Cấu trúc prompt cho nhiệm vụ nhiều đợt

```
playbook/ai/prompts/
├── B8.1.1-SCHEMA-DOT1.md    ← Đợt 1: 6 file nền móng
├── B8.1.2-SCHEMA-DOT2.md    ← Đợt 2: 5 entity reference (CHỈ SINH SAU KHI ĐỢT 1 ĐẠT QA)
├── B8.1.3-SCHEMA-DOT3.md    ← Đợt 3: 5 entity + 2 config (CHỈ SINH SAU KHI ĐỢT 2 ĐẠT QA)
└── B8.1-COMPLETE.md         ← Merge + báo cáo tổng (CHỈ SINH SAU KHI ĐỢT 3 ĐẠT QA)
```

Mỗi prompt có cấu trúc 7 phần giống nhau (theo PROMPT_FACTORY §2), chỉ khác phần Phạm vi. Cuối mỗi prompt là khối P1–P6.

---

## 2. Sơ đồ — vòng lặp khép kín một đợt

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Cowork                        Claude Code (tự QA)          │
│  ──────                        ───────────────────          │
│                                                              │
│  1. Sinh prompt → lưu                                        │
│                                                              │
│           ──────────────────→  2. Nhận prompt                │
│                                   git checkout -b             │
│                                   đọc spec → viết code        │
│                                   git commit                  │
│                                                              │
│                                3. SPAWN QA AGENT (sub-agent) │
│                                   ├─ ĐẠT → commit --amend    │
│                                   │         + QA agent ID    │
│                                   └─ TRƯỢT → sửa → QA lại   │
│                                                              │
│           ◄──────────────────  4. "Đợt N + QA đạt,          │
│                                    commit [hash]"            │
│                                                              │
│  5. Kiểm hậu kiểm:                                           │
│     commit message có QA agent ID? → OK                     │
│                                                              │
│  6. Sinh prompt Đợt N+1                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Cơ chế gate — tại sao không thể bỏ qua

| Cơ chế | Vật lý / Luận lý |
|---|---|
| **Prompt đợt N+1 chưa tồn tại** | Vật lý — file không có trên đĩa |
| **Prompt có khối P1–P6 bắt buộc** | Claude Code từ chối nếu thiếu |
| **QA agent là sub-agent độc lập** | Instance riêng (Haiku, không context code) — thỏa GOVERNANCE §4.3 |
| **Commit message phải ghi QA agent ID** | Cowork kiểm hậu kiểm: không có ID = reject. Không giả được |
| **Chỉ sinh prompt tiếp khi QA đạt** | Cowork là gatekeeper duy nhất cho prompt tiếp theo |

---

## 4. Prompt B8.1 được tách như thế nào

### B8.1.1 — Đợt 1: Nền móng

```
playbook/ai/prompts/B8.1.1-SCHEMA-DOT1.md
```

**Phạm vi:** 6 file (baseFields, lodgingBase, category, person, touristDestination, place)

**Sau khi xong:** commit, báo Cowork. Cowork spawn QA. Nếu đạt → Cowork sinh B8.1.2.

### B8.1.2 — Đợt 2: Reference phức tạp

```
playbook/ai/prompts/B8.1.2-SCHEMA-DOT2.md
```

**Phạm vi:** 5 file (attraction, restaurant, specialty, hotel, resort)

**Sau khi xong:** commit, báo Cowork. Nếu QA đạt → Cowork sinh B8.1.3.

### B8.1.3 — Đợt 3: Cấu trúc lồng + i18n

```
playbook/ai/prompts/B8.1.3-SCHEMA-DOT3.md
```

**Phạm vi:** 7 file (experience, organization, event, tour, article, index.ts, sanity.config.ts)

**Sau khi xong:** commit, báo Cowork. Nếu QA đạt → Cowork sinh B8.1-COMPLETE.

### B8.1-COMPLETE — Merge

```
playbook/ai/prompts/B8.1-COMPLETE.md
```

**Phạm vi:** `git checkout main && git merge feat/b8.1-schema && git push`

---

## 5. Tích hợp vào PROMPT_FACTORY

PROMPT_FACTORY.md §5 (Tích hợp vào quy trình Cowork) được cập nhật:

```
Bước N hoàn tất spec/mockup/plan
  │
  ├─→ Cowork xác định: nhiệm vụ này có mấy đợt?
  │
  ├─→ Với mỗi đợt:
  │     │
  │     ├─ Sinh prompt theo template §2
  │     ├─ QA prompt P1–P6
  │     ├─ Lưu vào playbook/ai/prompts/
  │     ├─ Bàn giao Claude Code
  │     ├─ Claude Code viết code → commit → báo
  │     ├─ Cowork spawn QA agent audit G2
  │     │
  │     ├─ ĐẠT → sinh prompt đợt tiếp
  │     └─ TRƯỢT → báo lỗi, Claude Code sửa, QA lại
  │
  └─→ Đợt cuối đạt QA → prompt COMPLETE (merge)
```

---

## 6. Prompt B8.1.1 mẫu (thay thế B8.1 cũ)

Prompt cũ `B8.1-SCHEMA.md` chứa cả 3 đợt → thay bằng file B8.1.1 chỉ chứa Đợt 1. Các đợt sau được sinh động khi đợt trước đạt QA.
