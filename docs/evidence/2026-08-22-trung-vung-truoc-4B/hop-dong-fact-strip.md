# Hợp đồng vùng Thông tin nhanh từ 06-BINDING_MAP §3.1

Deliverable cho Task 5–7. Trích trực tiếp từ §3.1 của 06-BINDING_MAP.md v2.2.0 (duyệt 2026-08-22, QĐ-2026-08-22-05).

**Ngày chốt:** 2026-08-23 | **Phiên bản spec:** v2.2.0 | **Trạng thái:** VERIFIED

---

## Ma trận: Field → Vùng Thông tin nhanh

Mỗi cell ghi **vùng** mà field đó được hiện trên trang chi tiết loại entity tương ứng.

| Field | Điểm tham quan | Địa danh | Trải nghiệm | Tour |
|---|---|---|---|---|
| `openingHours` | Thông tin nhanh | Thông tin nhanh | — | — |
| `address` | Thông tin nhanh | Thông tin nhanh | — | — |
| `telephone` | Thông tin nhanh | — | — | — |
| `officialSource` | Thông tin nhanh (tên miền) | — | — | — |
| `isAccessibleForFree` | Thông tin nhanh, chỉ khi true | Thông tin nhanh, chỉ khi true | thanh dính + khối hành động (nhãn "Miễn phí" thay giá) | — |
| `duration` | — | — | Thông tin nhanh | Thông tin nhanh |
| `touristType` | — | — | Thông tin nhanh (đủ danh sách) | Thông inform nhanh |
| `tripOrigin` | — | — | — | Thông tin nhanh ("Khởi hành") |

**Ghi chú:** Spec text "(nhãn "Miễn phí" thay giá)" = 06-BINDING_MAP.md:105; description "(tên miền)" = spec, "(không full URL)" = inference để làm rõ ý.

---

## Ba constraints chốt từ §3

1. **Tối đa 6 ô** trên Thông tin nhanh
2. **Không chứa giá** — giá ở thanh dính + khối hành động (ngoại lệ duy nhất mà Luật 1 cho phép)
3. **≤ 2 ô thì không trải dải** ngang — gộp vào cạnh bản đồ ở sidebar (design note: `p2-ttn-rule` trên canvas vòng 4)

---

## Bảy field dễ bị xếp nhầm vào đây

Những field này **KHÔNG** vào Thông tin nhanh — mỗi field có vùng riêng biệt theo §3.1:

| Field | Vùng đúng theo §3.1 |
|---|---|
| `attractionType` · `placeType` · `experienceType` · `tourFormat` | huy hiệu hero, **và chỉ ở đó** |
| `containedInPlace` · `venue` | mắt cha trong breadcrumb |
| `sameAs` | dòng "Nguồn tham khảo" cạnh Cập nhật |
| `geo` · `hasMap` | thẻ bản đồ |
| `includes` · `excludes` | mục "Bao gồm" / "Bao gồm - Không bao gồm" |
| `operator` · `licenseInfo` | khối hành động |
| `departureNote` | ghi chú trong khối hành động |
| `seasonNote` | mục "Mùa nào nên đi" |

---

## Hiện trạng Build (2026-08-23)

Validator `luat1-post.ts` (Luật 1, tầng A — lặp vùng):

### In scope: 4 entity có §3.1 row

| Entity | Trang | Vi phạm | Ghi chú |
|---|---|---|---|
| Điểm tham quan | 26 | 57 | Field đang ở old regions (info-bar + info-card), chưa rewire |
| Tour | 11 | 22 | idem |
| Địa danh | 7 | 19 | idem |
| Trải nghiệm | 8 | 16 | idem |
| **Tổng** | **52** | **114** | Task 5–7 refactor |

### Out of scope: Hotel

| Entity | Trang | Vi phạm | Ghi chú |
|---|---|---|---|
| Khách sạn | 6 | 18 | §3.1 không có hàng; spec chưa khai. Task 7 defer. |

**Tổng cộng:** 58 trang, 132 violations.

---

## Điều kiện render chi tiết

Từ §3.1 và §3 hàng "Thông tin nhanh":

1. `isAccessibleForFree`: **chỉ render khi giá trị = true** (nhãn "Miễn phí")
2. `officialSource` (Điểm tham quan): **tên miền**, không full URL (spec: tên miền; inference: để khác biệt với URL full)
3. `touristType` (Trải nghiệm): **đủ danh sách** per spec
4. Ô rỗng không render; **0 ô → vùng không tồn tại**
5. Icon SVG mỗi ô (design token)

---

**Status:** VERIFIED. Spec khớp brief. Task 5–7 dùng bảng này làm contract.
