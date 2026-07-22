# Ví dụ tham chiếu (không thuộc lõi)

Thư mục này chứa entity mẫu để tham khảo khi dựng site mới. **Lõi không nạp chúng.**
Studio lõi chỉ có object `seo` (xem `cms/schemas/index.ts`).

## tourdao/ — bộ 5 entity của site Tour Đảo Nha Trang

`tourdao/schemas/` gồm 5 entity đầy đủ, minh họa các kiểu ánh xạ JSON-LD schema.org:

- `organization.ts` → TravelAgency (doanh nghiệp)
- `tour.ts` → TouristTrip / Product+Offer / Service (theo serviceType)
- `hotel.ts` → Hotel (LodgingBusiness)
- `article.ts` → Article (có reference author)
- `author.ts` → Person

Cổng tương ứng ở `scripts/examples/gate.config.tourdao.ts`.

## Dùng lại thế nào

Copy file entity cần dùng vào `cms/schemas/`, đăng ký trong `cms/schemas/index.ts`,
rồi khai cổng trong `scripts/gate.config.ts` (chép mục tương ứng từ file mẫu tourdao).
Nhớ đổi các giá trị cứng của site cũ (ví dụ `initialValue: 'Nha Trang'`, nhãn liên hệ)
sang giá trị của site mới.
