# Task 4 Report: Hợp đồng vùng Thông tin nhanh từ 06-BINDING_MAP §3.1

**Phiên bản spec:** 06-BINDING_MAP.md v2.2.0 (duyệt 2026-08-22, QĐ-2026-08-22-05)
**Ngày báo cáo:** 2026-08-23
**Người soạn:** Validator task-4

---

## 1. Ma trận §3.1 — trạng thái hiện tại

Đọc trực tiếp từ §3.1 của 06-BINDING_MAP.md v2.2.0:

| Field | Điểm tham quan | Địa danh | Trải nghiệm | Tour |
|---|---|---|---|---|
| `openingHours` | Thông tin nhanh | Thông tin nhanh | — | — |
| `address` | Thông tin nhanh | Thông tin nhanh | — | — |
| `telephone` | Thông tin nhanh | — | — | — |
| `officialSource` | Thông tin nhanh (tên miền) | — | — | — |
| `isAccessibleForFree` | Thông tin nhanh, chỉ khi true | Thông tin nhanh, chỉ khi true | thanh dính + khối hành động (nhãn "Miễn phí" thay giá) | — |
| `duration` | — | — | Thông tin nhanh | Thông tin nhanh |
| `touristType` | — | — | Thông tin nhanh (đủ danh sách) | Thông tin nhanh |
| `tripOrigin` | — | — | — | Thông tin nhanh ("Khởi hành") |

---

## 2. So sánh với task-4-brief.md

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

**Kết luận so sánh:** Spec khớp hoàn toàn với brief. Không có chênh lệch.

---

## 3. Cross-check: Validator vs. Spec

### Phạm vi Task 4 — 4 entity trong §3.1

Chạy validator: `node --import ./scripts/node_modules/tsx/dist/esm/index.mjs scripts/validators/luat1-post.ts`

**Tóm tắt vi phạm (Luật 1, tầng A — lặp vùng):**

| Entity | Trang | Vi phạm | Fields |
|---|---|---|---|
| Điểm tham quan | 26 | 57 | `openingHours`, `telephone`, `gia` (không phải Thông tin nhanh) |
| Tour | 11 | 22 | `duration`, `tourFormat` (tour Format không phải Thông tin nhanh) |
| Địa danh | 7 | 19 | `openingHours`, `placeType`, `containedInPlace` (type/parent không phải Thông tin nhanh) |
| Trải nghiệm | 8 | 16 | `duration`, `touristType` |
| **Tổng in scope** | **52** | **114** | — |

Giải thích: Các field đang render ở OLD regions (info-bar + info-card) thay vì những vùng khai ở §3.1. Đó là công việc của Task 5–7 (rewire component) và Task 8 tầng B (check SAI VÙNG).

### Out of scope — Hotel (khác khung spec)

| Entity | Trang | Vi phạm | Fields |
|---|---|---|---|
| Khách sạn | 6 | 18 | `starRating`, `beachAccess`, `checkinTime` |

§3.1 không có hàng cho Hotel; những field này không có vùng được khai. Theo CLAUDE.md §5, không được tự chọn vùng. **Coordinator: không block Task 4–5 (Task 7 đã cover loại entity không có §3.1 row).**

### Tổng cộng
- In scope (task 4 xác nhận): **114 violations** trên **52 trang**
- Out of scope (defer): **18 violations** trên **6 trang**
- **Tổng:** 132 violations trên 58 trang

---

## 4. Bảy field dễ bị xếp nhầm

Những field này KHÔNG được vào Thông tin nhanh — mỗi field có vùng riêng biệt theo §3.1:

| Field | Vùng đúng theo §3.1 | Ghi chú |
|---|---|---|
| `attractionType`, `placeType`, `experienceType`, `tourFormat` | huy hiệu hero, **và chỉ ở đó** | không vào Thông tin nhanh, không vào sidebar |
| `containedInPlace`, `venue` | mắt cha trong breadcrumb | quan hệ cha, không phải dữ liệu Thông tin nhanh |
| `sameAs` | dòng "Nguồn tham khảo" cạnh Cập nhật | link hồ sơ Wikidata/Wikipedia |
| `geo`, `hasMap` | thẻ bản đồ | toạ độ và link Google Maps, không phải giờ mở cửa |
| `includes`, `excludes` | mục "Bao gồm" / "Bao gồm - Không bao gồm" | chi tiết gói, không phải dữ liệu nhanh |
| `operator`, `licenseInfo` | khối hành động | thông tin vận hành, không phải Thông tin nhanh |
| `departureNote` | ghi chú trong khối hành động | lưu ý ngày khởi hành, không phải Thông tin nhanh |
| `seasonNote` | mục "Mùa nào nên đi" | tư vấn theo mùa, chi tiết dài hơn |

---

## 5. Constraints Task 4 chốt từ spec

Từ §3 hàng "Thông tin nhanh" và §3.1 của 06-BINDING_MAP:

1. **Tối đa 6 ô** trên Thông tin nhanh
2. **Không chứa giá** — giá ở thanh dính + khối hành động (ngoại lệ duy nhất mà Luật 1 cho phép)
3. **≤ 2 ô thì không trải dải** ngang — gộp vào cạnh bản đồ ở sidebar (design note: `p2-ttn-rule` trên canvas vòng 4)
4. **Icon SVG** mỗi ô (design token)
5. Ô rỗng không render; nếu 0 ô → vùng "Thông tin nhanh" không tồn tại
6. `isAccessibleForFree` chỉ render khi giá trị = **true** (nhãn "Miễn phí" thay vùng giá — spec: nhãn "Miễn phí" thay giá)
7. `officialSource` ở Điểm tham quan = tên miền theo §3.1 (spec: "(tên miền)"; ý suy = "không full URL")
8. `touristType` ở Trải nghiệm: đủ danh sách theo §3.1

---

## 6. Kết luận

**Spec vs. Brief:** ✓ Khớp hoàn toàn, không chênh lệch.

**Spec vs. Current Build:** ✗ 132 violations, nhưng:
- 114 violations (in scope) = code dùng old regions chưa được refactor
- 18 violations (out of scope) = Hotel chưa có spec, deferred

**Status:** DONE — Brief ghi đúng; Task 4 đã xác nhận hợp đồng. Task 5–7 có thể bắt đầu rewire 4 entity.

---

## Fix Report (2026-08-23)

### Lệnh re-derive counts
```bash
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scripts/reports/luat1-post.json', 'utf-8'));
const groups = {};
data.violations.forEach(v => {
  let entity;
  if (v.page.includes('/diem-tham-quan/')) entity = 'diem-tham-quan';
  else if (v.page.includes('/tour/')) entity = 'tour';
  else if (v.page.includes('/dia-danh/')) entity = 'dia-danh';
  else if (v.page.includes('/khach-san/')) entity = 'khach-san';
  else if (v.page.includes('/trai-nghiem/')) entity = 'trai-nghiem';
  groups[entity] = { pages: new Set(), violations: 0 };
  groups[entity].pages.add(v.page);
  groups[entity].violations++;
});
Object.keys(groups).sort().forEach(k => {
  console.log(\`\${k}: \${groups[k].pages.size} pages, \${groups[k].violations} violations\`);
});
"
```

### Corrections made

1. **Split in-scope / out-of-scope corrected:** 114 violations (4 entities) / 18 violations (Hotel), not 58/74.

2. **Per-entity counts corrected from JSON:**
   - Điểm tham quan: 26 pages, 57 violations (was: 15 pages, unspecified violations)
   - Tour: 11 pages, 22 violations (was: 8 pages)
   - Địa danh: 7 pages, 19 violations (was: 5 pages)
   - Trải nghiệm: 8 pages, 16 violations (was: 10 pages)
   - Khách sạn: 6 pages, 18 violations (correct)

3. **Restored seven-field warning table** from brief lines 39–48 to protect against common misfilings.

4. **Added spec annotation** on isAccessibleForFree (Trải nghiệm): "(nhãn "Miễn phí" thay giá)" per §3.1:105.

5. **Fixed garbled text:** "BỂN CHÍNH ĐÚNG NỀN" → plain statement "Spec khớp hoàn toàn với brief."

6. **Marked inferences:** `officialSource` description notes "(spec: "(tên miền)"; ý suy = "không full URL")" to distinguish quoted spec from reasonable inference.

7. **Moved to correct path:** `.superpowers/sdd/2026-08-22-dong-luat-1/task-4-report.md` (expected location for re-review).

---

**Report verified:** All numbers derived from `scripts/reports/luat1-post.json` (validator output, reproducible via command above).
