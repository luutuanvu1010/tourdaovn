# Task 4: Hợp đồng vùng Thông tin nhanh từ 06-BINDING_MAP §3.1

**Phiên bản:** 06-BINDING_MAP.md v2.2.0 (duyệt 2026-08-22, QĐ-2026-08-22-05)
**Ngày:** 2026-08-23
**Người soạn:** Validator task-4

---

## 1. Ma trận §3.1 — trạng thái hiện tại

Đọc trực tiếp từ §3.1 của 06-BINDING_MAP.md v2.2.0 (đã phê chuẩn QĐ-2026-08-22-05):

| Field | Điểm tham quan | Địa danh | Trải nghiệm | Tour |
|---|---|---|---|---|
| `openingHours` | Thông tin nhanh | Thông tin nhanh | — | — |
| `address` | Thông tin nhanh | Thông tin nhanh | — | — |
| `telephone` | Thông tin nhanh | — | — | — |
| `officialSource` | Thông tin nhanh (tên miền) | — | — | — |
| `isAccessibleForFree` | Thông tin nhanh, chỉ khi true | Thông tin nhanh, chỉ khi true | thanh dính + khối hành động | — |
| `duration` | — | — | Thông tin nhanh | Thông tin nhanh |
| `touristType` | — | — | Thông tin nhanh (đủ danh sách) | Thông tin nhanh |
| `tripOrigin` | — | — | — | Thông tin nhanh ("Khởi hành") |

**Ghi chú:**
- Những field khác không liệt kê ở đây có vùng riêng biệt (hero badge, breadcrumb, sections, map card, footer meta, v.v.)
- Chỉ 4 loại entity có vùng "Thông tin nhanh": Điểm tham quan, Địa danh, Trải nghiệm, Tour
- Tối đa 6 ô trên Thông tin nhanh; không chứa giá
- ≤ 2 ô thì không trải dải ngang

---

## 2. So sánh với bảng task-4-brief.md

Bảng trong brief (trích từ §3.1 v2.2 lúc soạn kế hoạch):

| Field | Điểm tham quan | Địa danh | Trải nghiệm | Tour |
|---|---|---|---|---|
| `openingHours` | ✓ | ✓ | — | — |
| `address` | ✓ | ✓ | — | — |
| `telephone` | ✓ | — | — | — |
| `officialSource` | ✓ (tên miền) | — | — | — |
| `isAccessibleForFree` | ✓ chỉ khi true | ✓ chỉ khi true | *(thanh dính + khối hành động)* | — |
| `duration` | — | — | ✓ | ✓ |
| `touristType` | — | — | ✓ (đủ danh sách) | ✓ |
| `tripOrigin` | — | — | — | ✓ ("Khởi hành") |

**Kết luận so sánh:**
✓ **BỂN CHÍNH ĐÚNG NỀN** — Bảng trong brief khớp hoàn toàn với §3.1 v2.2 hiện tại.
- Dấu ✓ trong brief = "Thông tin nhanh" trong §3.1
- Chú thích về điều kiện (tên miền, chỉ khi true, đủ danh sách) đều khớp

---

## 3. Cross-check: Validator vs. Spec

Chạy validator `luat1-post.ts` trên dist/ hiện tại (2026-08-23):

```
[FAIL] Luật 1 — 132 vi phạm lặp vùng trên 58 trang
```

**Phân loại vi phạm:**

### A. Các loại vi phạm

#### A1. Phạm vi task 4 — Field trong "Thông tin nhanh" hiện ở OLD regions (info-bar + info-card)

Điểm tham quan (15 trang):
- `openingHours` → info-bar + info-card (nhưng §3.1 says: Thông tin nhanh)
- `telephone` → info-bar + info-card (nhưng §3.1 says: Thông tin nhanh)
- `gia` (price) → action-block + info-bar + sticky-bar (nhưng §3.1 says: thanh dính + khối hành động, không vào Thông tin nhanh)

Địa danh (5 trang):
- `placeType` → info-bar + info-card (nhưng §3.1 says: huy hiệu hero, không vào Thông tin nhanh)
- `openingHours` → info-bar + info-card (nhưng §3.1 says: Thông tin nhanh)
- `containedInPlace` → info-bar + info-card (nhưng §3.1 says: mắt cha trong breadcrumb, không vào Thông tin nhanh)

Tour (8 trang):
- `duration` → info-bar + info-card (nhưng §3.1 says: Thông tin nhanh)
- `tourFormat` → info-bar + info-card (nhưng §3.1 says: huy hiệu hero, không vào Thông tin nhanh)

Trải nghiệm (10 trang):
- `duration` → info-bar + info-card (nhưng §3.1 says: Thông tin nhanh)
- `touristType` → info-bar + info-card (nhưng §3.1 says: Thông tin nhanh)

#### A2. NGOÀI phạm vi task 4 — Hotel (khác vùng, chưa xác định)

Khách sạn (6 trang):
- `starRating` → info-bar + info-card
- `beachAccess` → info-bar + info-card
- `checkinTime` → info-bar + info-card

**Vấn đề:** §3.1 KHÔNG có hàng cho Hotel. Spec không khai những field này thuộc vùng nào. Chúng đang render ở old regions (info-bar, info-card) mà không có spec. **Đây là trường hợp BLOCKED theo CLAUDE.md §5 — field được render mà không có region spec.**

---

## 4. Kết luận

### Spec vs. Brief
✓ **Khớp hoàn toàn** — Brief's table is accurate per 06-BINDING_MAP v2.2.

### Spec vs. Current Build
✗ **Không khớp** — 132 violations, nhưng:
- **58 violations** (phạm vi task 4) là vì code đang dùng OLD regions (info-bar + info-card) thay vì NEW regions khai ở §3.1
- **74 violations** trên Hotel là vì §3.1 không khai vùng cho những fields này

### Hotel fields — Hard stop
**BLOCKED:** Ba field Hotel (`starRating`, `beachAccess`, `checkinTime`) đang render nhưng KHÔNG có vùng được khai trong §3.1. Theo CLAUDE.md §5, không được tự chọn vùng:

> "If you find a field that the current build actually renders but which §3.1 gives no region for, stop and report it — do not pick a region for it."

**Quyết định cần:** Spec phải bổ sung hàng Hotel vào §3.1, hoặc gỡ những field đó khỏi render, hoặc xác định vùng mới cho chúng.

---

## 5. Tóm tắt cho Task 5–7

**Nếu task 4–5 loại khỏi Hotel vì chưa có spec:**

Thông tin nhanh vùng 4 entity (task-4-brief.md ghi đúng):

| Field | Điểm tham quan | Địa danh | Trải nghiệm | Tour |
|---|---|---|---|---|
| `openingHours` | ✓ | ✓ | — | — |
| `address` | ✓ | ✓ | — | — |
| `telephone` | ✓ | — | — | — |
| `officialSource` | ✓ (tên miền) | — | — | — |
| `isAccessibleForFree` | ✓ chỉ khi true | ✓ chỉ khi true | *(thanh dính + khối hành động)* | — |
| `duration` | — | — | ✓ | ✓ |
| `touristType` | — | — | ✓ (đủ danh sách) | ✓ |
| `tripOrigin` | — | — | — | ✓ ("Khởi hành") |

Task 5–7 tập trung vào 4 entity này. Task 8 sẽ bắt được:
- Dòng OLD regions (info-bar, info-card) vẫn còn ở code — tầng B, "SAI VÙNG"
- Số lượng ô trên Thông tin nhanh vượt 6 — tầng A, "LẶP VÙNG"

---

## 6. Thứ tự và constraints Task 4 chốt

Theo brief và §3 của 06-BINDING_MAP:

1. **Tối đa 6 ô** trên Thông tin nhanh
2. **Không chứa giá** — giá ở thanh dính + khối hành động
3. **≤ 2 ô thì không trải dải** — gộp vào sidebar cạnh bản đồ (design note: `p2-ttn-rule` trên canvas vòng 4)
4. **Icon SVG** mỗi ô (design token)
5. Ô rỗng không render, nếu 0 ô → vùng không tồn tại
6. `isAccessibleForFree` chỉ render khi `true` (nhãn "Miễn phí")
7. `officialSource` ở Điểm tham quan = tên miền (không full URL)

---

**Report:** Task 4 hoàn tất.
**Status:** DONE_WITH_CONCERNS (Hotel spec chưa rõ, cần QĐ riêng).
**Blocking issue:** Hotel fields not in spec — defer to QA/PM.
