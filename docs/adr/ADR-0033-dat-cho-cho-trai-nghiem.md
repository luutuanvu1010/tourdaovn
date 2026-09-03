# ADR-0033 — Form đặt chỗ mở sang trang Trải nghiệm; và Google Sheet là nguồn giá của **mọi** entity thương mại

<!-- ═══════════ GHI CHÚ CORE (multi-site) ═══════════
Quyết định RIÊNG của tourdaovn, nhưng cơ chế tái dùng được: (1) một module đặt chỗ đã chạy
được mở sang loại trang thứ hai bằng cách THAM SỐ HOÁ loại sản phẩm chứ không nhân bản mã;
(2) đường ghi runtime học một trường `productType` thay vì đoán loại trang từ slug; (3) nguồn
giá một chiều được khai là nguồn cho MỌI entity thương mại, không riêng loại đầu tiên dùng nó.
Ba loại trang, tên khoá giá và con số là của site này.
═══════════════════════════════════════════════════ -->

- **Trạng thái:** **proposed** — chờ chủ dự án phê chuẩn toàn văn
- **Ngày:** soạn 2026-09-04   **Người soạn:** Cowork   **Người phê chuẩn:** Lưu Tuấn Vũ (chủ dự án)
- **Loại quyết định:** cửa **một chiều** ở **hai** điểm — (1) thêm cột `product_type` vào bảng
  `booking` đang nhận đơn thật (migration `0003`); (2) **mở đơn vị giá thứ tư `perGroup`** trong
  lược đồ `prices.yaml`, đúng loại cửa mà `05-URL_MAP` §4 đòi ADR. Cửa **hai chiều** ở phần còn
  lại: giao diện form trên trang Trải nghiệm, nhãn báo tin, nhãn ô đếm.
- **Sửa trong ngày 2026-09-04:** bản đầu chốt *không* mở đơn vị giá nhóm (quyết định 2); chủ dự án
  bác cùng ngày. Lý do và cả hai phía của lập luận ghi nguyên văn trong quyết định 2 — **không xoá
  vết bản cũ**, theo luật sổ chỉ-thêm (`04-CONSTRAINTS` §2.5).
- **Supersedes:** `ADR-0027` **quyết định 8, phần phạm vi** ("form là kênh đặt thêm trên trang
  Tour"). Mọi phần khác của `ADR-0027` — ba lớp dữ liệu, D1 là bản ghi gốc, notifier cắm thêm,
  hình dạng `paxRates`, bốn bất biến BK1–BK5, chống lạm dụng ba lớp — **giữ nguyên hiệu lực và
  áp y nguyên cho trang Trải nghiệm.**
- **Liên quan:** `ADR-0003` (seam giá một chiều), `ADR-0007` (nguồn giá là `prices.yaml`),
  `ADR-0027` (module đặt tour), `ADR-0030` (bảng mùa), `ADR-0031` (ưu đãi thanh toán trước),
  `06-BINDING_MAP` §3 §4.8, `04-CONSTRAINTS` §1d BK1–BK5, `docs/gia/README.md`,
  `docs/specs/SPEC-2026-09-04-dat-cho-trai-nghiem.md`

## Bối cảnh

`ADR-0027` mở đường ghi runtime đầu tiên của hệ và chốt phạm vi hẹp có chủ ý: **chỉ trang chi
tiết Tour**. Mười ba tháng vận hành sau đó, 28 dòng giá trong `data/prices.yaml` đều gắn vào
document `tour` — kể cả những sản phẩm không phải tour theo nghĩa thường: vé VinWonders, vé Vin
Harbour, sáu chuyến du thuyền. Nghĩa là quy ước *thực tế* của site đã thành "bán được thì làm
document `tour`", và tám trang `/trai-nghiem/{slug}` — dù bay, jetski, sea walker, lặn biển,
snorkeling, fly board, phao chuối — ở lại làm nội dung thuần, không giá, không nút đặt, chỉ Zalo.

Chủ dự án yêu cầu (2026-09-03) đưa chức năng đặt chỗ sang các hoạt động trải nghiệm.

Bốn sự thật đo được lúc soạn, quyết định hình dạng của ADR này:

1. **Bảng giá đã có sẵn.** Tab `gia` của Google Sheet đã chứa tám dòng `TTB01–TTB08` cho các
   hoạt động trải nghiệm. **Bảy trong tám** là `perPax` chỉ có giá người lớn — **đúng hình dạng
   `priceTableFromEntry()` đang đọc**, không phải mở lược đồ. Dòng thứ tám (Phao chuối) mới là
   dòng buộc phải mở, xem điểm 3.
2. **Không dòng nào chảy tới nơi.** `prices.yaml` không có khoá `TTB` nào, và **không entity
   `experience` nào có `bookingRef.key`** (đo 2026-09-04, GROQ trên dataset `production`). Hai
   lỗi trong Sheet chặn cứng `prices:pull`: khoá `Fly-board-nha-trang` có chữ hoa (`DANG_KHOA`
   chỉ nhận chữ thường, `prices-pull.mjs:403`), và dòng Phao chuối để `Đơn vị = per5pax` trong
   khi script chỉ nhận `perPax` (`:416`).
3. **Một sản phẩm không diễn tả được bằng lược đồ hiện hành.** Phao chuối bán **một giá cho nhóm
   tối đa 5 người** (`per5pax`), và chủ dự án xác nhận 2026-09-04: **nhóm 3 người vẫn trả trọn
   1.000.000** — cano chạy một chuyến là một chuyến. Đó là giá nhóm thật, không phải giá đầu người
   trá hình. `prices.yaml` không có đơn vị nào chở được: `perPax` + `tiers[]` **vẫn nhân với số
   người** — `computeQuote` tính `total = amount * n` (`quote.ts:76-84`), tức tiers là "giá mỗi
   người theo cỡ nhóm", không phải "một giá cho cả nhóm".
4. **Bốn chỗ trong đường ghi viết cứng chữ "tour".** `backHref` dựng `/tour/${slug}/`
   (`handler.ts:62`) — khách trải nghiệm không bật JavaScript sẽ rơi vào 404; tiêu đề thư SES
   `[Đặt tour]` và dòng `Tour: …` (`notify/format.ts:17,34`); câu khách nhìn thấy *"Đã nhận yêu
   cầu đặt tour"* (`handler.ts:210,285`); và bảng D1 có cột `tour_slug`/`tour_title` mà không
   trường nào nói đơn thuộc loại sản phẩm gì.

## Quyết định

1. **Nới phạm vi `ADR-0027` sang trang Trải nghiệm.** `BookingForm` render trên
   `/trai-nghiem/{slug}` theo **đúng điều kiện đang áp cho Tour**: có `bookingRef.key`, khoá tra
   được một dòng `perPax` trong `prices.yaml`, và `priceTableFromEntry()` trả về bảng giá. Không
   giá thì không form, giữ `ContactChannels` — quyết định nền 3 của `06-BINDING_MAP` áp y nguyên.

2. **Mở đơn vị giá thứ tư: `perGroup`.** Hình dạng:

   ```yaml
   phao-chuoi:
     unit: perGroup
     amount: 1000000     # giá MỘT LƯỢT, không phải giá mỗi người
     maxPax: 5           # số khách tối đa một lượt chở được
   ```

   Khách vẫn **đếm người** — thứ khách biết. Máy quy ra lượt: `soLuot = ceil(soKhach / maxPax)`,
   `tong = amount × soLuot`. Ba người đi một lượt trả trọn 1.000.000; tám người thành hai lượt.

   > **Mục này ĐẢO bản đầu của ADR, và nói rõ vì sao.** Bản 2026-09-04 đầu tiên chốt *"KHÔNG mở đơn
   > vị giá nhóm, Phao chuối giữ Zalo"*, cân theo YAGNI: một cửa một chiều không đáng cho 1/8 sản
   > phẩm. Chủ dự án bác cùng ngày, bằng một lý lẽ mà lập luận cũ đã bỏ sót: **"giữ Zalo" không phải
   > là giữ nguyên hiện trạng — nó nghĩa là khách không đặt được**, đúng thứ đợt này sinh ra để sửa.
   > Yêu cầu đổi thì phép cân đổi theo. Ghi lại nguyên văn cả hai phía để lần sau không ai đọc mục
   > này như một quyết định tuỳ hứng.

   Cái giá nhận rõ: PY1 hiện có enum **ba** đơn vị (`perPax`, `perRoomNight`, `perTicket` —
   `py1-py8.ts:4,25`); thêm cái **thứ tư** kéo theo PY2/PY7 và tập khoá đóng, **hai bản chép tay**
   của `PriceEntry` (`src/lib/types.ts:10-13` và `scripts/lib/price-loader.ts:10-13` — `ADR-0027`
   đã ghi rõ lệch hai bản là lỗi), `resolver.ts` cộng một nhãn giá mới cho 5 ngôn ngữ, `quote.ts`,
   `BookingForm`, `notify/format.ts`, và `prices-pull.mjs`.

   *Ba hình dạng bị loại, ghi lại để không ai thử lại:*

   - **`tiers[]` ép thành giá nhóm** (khai `amount` = giá nhóm chia `maxPax`): hỏng hai chỗ.
     (a) phép chia thường lẻ — 500.000 chia 3 ra 166.667, nhân lại thành **500.001 đ**; (b)
     `quote.ts:82` trả `perPax: { adult: amount }`, nên form **hiện cho khách một con số "mỗi
     người" bịa ra** không có trong bảng giá nào. Sai tiền *và* sai nhãn.
   - **`perPax` rồi bảo khách đếm *lượt* thay vì đếm người**: số học ra đúng, nhưng nhãn ô đếm là
     "Số khách" và **không có chỗ nào trong `prices.yaml` để sửa nhãn đó** (tập khoá đóng). Một
     nhóm 5 người gõ `5` sẽ bị tính **5.000.000 đ — gấp năm lần giá thật**. Loại thẳng.
   - **Giá sàn cộng phụ thu theo đầu người** (dưới 5 thu trọn, từ người thứ 6 cộng thêm): chủ dự án
     xác nhận **không phải** cách bán của mình. Không thiết kế cho tình huống không tồn tại.

3. **`per5pax` trong cột `Đơn vị` của Sheet là ký hiệu HỢP LỆ**, đọc bằng `^per(\d+)pax$` →
   `{ unit: 'perGroup', amount, maxPax: N }`. Không thêm cột nào vào bảng 13 cột. Lý do chọn ký
   hiệu này thay vì một cột "Số khách mỗi lượt": **chủ dự án đã tự viết đúng như vậy** trước khi có
   ai đặc tả gì — ký hiệu khớp sẵn với cách người kinh doanh nghĩ. Chuỗi đó **không rời khỏi biên
   Sheet**: trong `prices.yaml` nó thành hai khoá tường minh `unit` + `maxPax`.

4. **`prices-pull.mjs` bỏ qua dòng có đơn vị **thật sự lạ**, kèm cảnh báo, thay vì chặn cả lượt
   pull.** Hôm nay một ô `Đơn vị` sai làm hỏng toàn bộ lần đồng bộ, kể cả 34 dòng còn lại đang
   đúng. Đổi thành cảnh báo-và-bỏ-qua. Khoá sai dạng (`DANG_KHOA`) vẫn **chặn cứng như cũ**: đó là
   lỗi gõ, không phải một hình giá site chưa hỗ trợ.

5. **`giuNguyen` phải khai theo *Sheet chở được gì*, không theo *có phải `perPax` không*.**
   `prices-pull.mjs:646-648` hiện định nghĩa "ngoài tầm Sheet" là mọi khoá có `unit !== 'perPax'`.
   Để nguyên thì dòng `perGroup` vừa sinh ra sẽ bị đánh dấu ngoài tầm ở **lần pull kế tiếp** và
   **chép nguyên văn mãi mãi** — chủ dự án sửa giá trong Sheet, chạy pull, **không có gì xảy ra và
   không ai báo**. Đúng loại lỗi im lặng tệ nhất, và nó sẽ nổ ra *sau* khi đợt này đã nghiệm thu
   xong. Định nghĩa mới: ngoài tầm Sheet = `perRoomNight`, `perTicket`, và `perPax` có `tiers[]`.

6. **Đường ghi runtime học `productType`, không đoán từ slug.** Thêm trường
   `productType: 'tour' | 'experience'` vào payload `/api/dat-tour`, và cột `product_type` vào
   bảng `booking` (migration `0003`, mặc định `'tour'` cho mọi dòng đã có). `backHref` và nhãn
   báo tin đọc từ trường này. Ba lý do không suy từ slug: slug không mang loại; hai nhánh URL **có
   thể** đẻ ra slug trùng nhau về sau — đo 2026-09-04, `dist/tour/` và `dist/trai-nghiem/` **hôm nay
   chưa có tên chung**, nên đây là hiểm hoạ tương lai chứ không phải chuyện đang xảy ra; và nhân
   viên đọc đơn cần biết đơn thuộc sản phẩm gì mà không phải tra ngược.

7. **Tên endpoint `/api/dat-tour` giữ nguyên.** Tên nay hơi hẹp so với việc nó làm, nhưng đổi
   đường dẫn của một endpoint đang nhận đơn thật đổi lấy một cái tên đẹp hơn là đánh đổi sai. Ghi
   ở đây để lần sau không ai tưởng là sót.

8. **Nhãn ô đếm theo *số hạng giá*, không theo loại trang.** Bảng giá chỉ có một hạng thì ô đếm
   ghi **"Số khách"** thay vì "Người lớn". Luật áp chung cho mọi trang, nên tour nào sau này chỉ
   có một hạng cũng hưởng. Lý do: "Người lớn" đứng một mình, không có hạng nào bên cạnh để đối
   chiếu, đọc lạc nghĩa trên trang jetski hay fly board.

   *Phạm vi thật của lập luận này:* nó đúng với **tiếng Việt** (`Người lớn` → `Số khách`) và
   **tiếng Anh** (`Adults` → `Guests`). Với **zh/ko/ru thì trung tính**, vì cả hai khoá ở ba thứ
   tiếng đó đang là **chuỗi tiếng Anh chưa dịch** (`uiCopy.ts:486-490,687-691,888-892`). Đây là
   **nợ dịch có sẵn**, không phải thứ đợt này gây ra — form đặt chỗ dịch loang lổ: `bookingPayTransfer`
   có đủ 5 thứ tiếng, còn `paxAdult`, `paxGuests`, `bookingPickup`, `bookingSubtotalNote` thì không.
   Ghi vào nợ tồn, không gộp vào đợt này.

9. **Ô "Điểm đón" ẩn trên trang Trải nghiệm.** Chủ dự án chốt: khách tự ra bãi, không có đón.
   Trường `pickup` trong payload và D1 **giữ nguyên** (gửi rỗng) — không đụng hợp đồng dữ liệu chỉ
   vì một ô không hiện.

10. **Không thêm trường giờ.** Khách chọn **ngày**, như tour. Muốn dặn giờ thì ghi vào ô Ghi chú,
   nhân viên gọi lại xếp. Khung giờ cố định là **dữ liệu lịch**, thứ `01-CONTENT_MODEL` §2.8 và
   `ADR-0027` cố ý để ngoài phạm vi; đưa vào là quyết định mới.

11. **Google Sheet tab `gia` là nguồn giá của MỌI entity thương mại**, không riêng Tour. Đây là
   phần chủ dự án yêu cầu ghi thành luật (2026-09-03). Không đảo `ADR-0003`/`ADR-0007` — đường đi
   vẫn là **Sheet → `prices:pull` → `data/prices.yaml` → build**, `prices.yaml` vẫn là thứ mã
   nguồn đọc. Câu này chỉ đóng một khoảng mở: trước đây cả tài liệu lẫn thực tế đều chỉ nói về
   tour, nên "giá của một trải nghiệm nhập ở đâu" chưa từng có câu trả lời viết ra. Nay có:
   **cùng một Sheet, cùng một tab, cùng một lệnh.** Không nhập giá vào Sanity (S2.8), không sửa
   tay `data/prices.yaml` (bị `prices:pull` ghi đè), không nguồn thứ hai.
   **Mã Sheet không vào repo** — repo công khai; mã ở `.env` dưới tên `PRICES_SHEET_ID`
   (`docs/gia/README.md`, `docs/HANDOFF-2026-08-29-dat-tour.md:75`).

## Lý do

- **Tham số hoá, không nhân bản.** `BookingForm`, `quote.ts`, `schema.ts`, `store.ts`, hai
  notifier và toàn bộ lớp chống lạm dụng đã chạy thật 13 tháng trên 28 trang tour. Thứ khác nhau
  giữa hai loại trang chỉ là **một nhãn và một tiền tố đường dẫn**. Chép ra một `ExperienceBookingForm`
  thứ hai là tạo nguồn sự thật thứ hai cho cùng một phép tính tiền — đúng loại lỗi `DR-046` và
  `DR-061` đã ghi ở tầng giao diện.
- **`productType` là dữ liệu, `backHref` là dẫn xuất.** Suy loại trang từ slug là đoán; lưu loại
  trang là biết. Cột này cũng là thứ trang quản trị đơn (nợ mở của `ADR-0027`) sẽ cần ngay ngày
  đầu tiên nó tồn tại.
- **YAGNI với `per5pax`.** Một sản phẩm không biện minh được cho một cửa một chiều chạm năm tệp
  và một validator. Giữ nó ở Zalo là **giữ nguyên hiện trạng**, không phải mất mát mới.
- **Cảnh báo-và-bỏ-qua đúng với triết lý "biến lỗi im lặng thành lỗi ồn ào"** (`QĐ-2026-08-05-14`)
  chứ không trái: dòng bị bỏ qua **được nêu tên ra màn hình**, chỉ là nó không kéo theo 34 dòng
  vô can cùng chết.
- **Câu "mọi entity thương mại" đóng một lỗ hổng vận hành, không mở cửa mới.** Nó không cho
  `prices.yaml` thêm quyền gì, không cho Sanity thêm quyền gì; nó chỉ trả lời một câu hỏi trước
  đây không có chỗ nào trả lời.

## Phương án bị loại

| Phương án | Vì sao loại |
|---|---|
| **Chuyển 8 trang trải nghiệm thành document `tour`** | khớp quy ước thực tế của site và **không phải sửa dòng mã nào**. Loại vì đổi URL của tám trang đang chạy và đang có thứ hạng — chính trang chủ dự án dẫn ra làm ví dụ (`/trai-nghiem/du-bay-parasailing-keo-bang-cano/`) sẽ chết. R4 cấm link trang không tồn tại; chuyển trang thì phải kèm redirect, mà `_redirects` là nơi duy nhất chuyển hướng chạy được (Worker vô hiệu hoá Page Rules) |
| **Hoãn `perGroup` sang đợt sau, Phao chuối giữ Zalo** | đây là **quyết định 2 của bản đầu**, chủ dự án bác 2026-09-04. Giữ Zalo nghe như "không mất gì", nhưng nó nghĩa là **khách không đặt được** — chính thứ đợt này sinh ra để sửa. Ghi lại ở đây, không xoá |
| **Dùng `tiers[]` cho giá nhóm** | không diễn tả được: `computeQuote` nhân `amount × số người` (`quote.ts:76-84`). Ép dùng là **báo sai số tiền cho khách** |
| **`perPax` + bảo khách đếm lượt** | số học đúng nhưng nhãn ô đếm là "Số khách" và không sửa được từ `prices.yaml`; nhóm 5 người gõ `5` bị tính **gấp năm lần** |
| **Thêm một cột "Số khách mỗi lượt" vào Sheet** | đổi hợp đồng bảng 13 cột, trong khi ký hiệu `per5pax` chủ dự án **đã tự dùng sẵn** chở đủ thông tin |
| **Suy `productType` từ tiền tố URL của `Referer`** | không thêm cột, không migration — nhưng `Referer` khách gửi lên là thứ sửa được, và đơn không JavaScript thì không có. Loại: dữ liệu đơn hàng không dựa vào header khách kiểm soát |
| **Dùng lại cột `source` đã có** — gửi `source='web-experience'` thay vì `'web'` | **rẻ hơn thật**: `0001_booking.sql:19` đã có `source TEXT NOT NULL DEFAULT 'web'`, nên **không migration, không cửa một chiều, không cửa sổ 500** của §7. Vẫn loại: `source` nói về **kênh đơn tới từ đâu**, không phải **sản phẩm là loại gì**; chồng hai nghĩa lên một cột là thứ trang quản trị đơn sẽ phải gỡ ra sau. Kể tên ở đây để người đọc biết cửa sổ 500 là thứ **mua có ý thức**, không phải chỗ chưa nghĩ tới |
| **Nhét `productType` vào `quoted_json`** | `quoted` là bản ghi *vì sao ra con số tạm tính này*, không phải chỗ chứa thuộc tính sản phẩm — `ADR-0031` §4 đã chốt vai của nó. Cột truy vấn được cũng là thứ trang quản trị cần |
| **Chép `BookingForm` thành bản riêng cho Trải nghiệm** | hai bản chép tay của cùng một phép tính tiền; lệch là lệch bằng tiền khách |
| **Đổi tên endpoint thành `/api/dat-cho`** | tên đúng hơn, nhưng đổi đường dẫn endpoint đang nhận đơn thật không đổi lấy giá trị nào cho khách |
| **Thêm ô chọn giờ cho hoạt động trải nghiệm** | khung giờ cố định là dữ liệu lịch — `01-CONTENT_MODEL` §2.8 và `ADR-0027` cố ý để ngoài. Ô Ghi chú đã chở được lời dặn giờ |
| **Ghi mã Google Sheet vào tài liệu trong repo** | repo công khai; mã Sheet là bí mật yếu nhưng vẫn là bí mật. `.env` là chỗ của nó |

## Hệ quả

- **Bảng `booking` đổi hình.** Migration `0003` thêm `product_type`; runbook phát hành có thêm
  bước `wrangler d1 migrations apply` **trước** lần deploy đầu của đợt này. Quên bước đó thì mọi
  đơn mới đều lỗi 500 — đây là bước ép buộc, không phải tuỳ chọn.
- **Cả tám trang mọc form.** Sáu trang `perPax` (`snorkeling-nha-trang`,
  `du-bay-parasailing-keo-bang-cano`, `motor-nuoc-nha-trang-jetski`,
  `di-bo-duoi-day-bien-sea-walker`, `lan-bien-scuba-diving`, `fly-board-nha-trang`) cộng
  **`phao-chuoi` và `phao-bay-flying-banana-boat`** — hai trang này là **một sản phẩm** (chủ dự án
  xác nhận 2026-09-04), nên **cùng trỏ một khoá `phao-chuoi`**, `unit: perGroup`.
- **Hai trang bán cùng một thứ nay đều đặt được** — nợ trùng trang ở §Nợ mở **nặng thêm**: hai đơn
  từ hai URL cho cùng một hoạt động, thống kê không cộng được. Chưa chặn đợt này, nhưng không còn
  là chuyện thẩm mỹ.
- **`perGroup` là đơn vị đầu tiên `resolver.ts` phải sinh nhãn mà chưa có khuôn chữ.** Cần một khoá
  `uiCopy` mới cho 5 ngôn ngữ. Nhãn phải nói rõ **giá một lượt**, không được để khách đọc nhầm
  thành giá mỗi người — đây là chỗ dễ hỏng nhất về mặt chữ nghĩa của cả đợt.
- **`prices-pull.mjs` lần đầu phải dựng khối yaml không phải `perPax`.** `dungKhoi()` hiện chỉ biết
  `unit`/`amount`/`paxRates` (`:562-579`); thêm `maxPax`. Kèm quyết định 5 (`giuNguyen`) — thiếu một
  trong hai là giá Phao chuối đóng băng im lặng.
- **Form chỉ mọc sau khi chủ dự án gắn `bookingRef.key` trong Studio.** Mã đúng mà chưa gắn khoá
  thì **không trang nào đổi gì** — đây là công tắc thật, không phải bước phụ.
- **`06-BINDING_MAP` phải sửa** ở §3 (hàng "Khối hành động" đang khai form thuộc riêng Tour) và
  thêm hàng cho `/trai-nghiem/{slug}`. Bản vá đề xuất kèm trong spec; **file luật không tự sửa**,
  chờ phiếu quyết định.
- **`04-CONSTRAINTS` §1d BK1–BK5 không đổi một chữ** và nay che thêm một loại trang. Đã đối chiếu
  `04-CONSTRAINTS.md:92-96`: cả năm bất biến nói về *endpoint, form, PII, bí mật, hàm tính tiền* —
  **không bất biến nào nhắc tới "tour"**, nên chúng áp sang trang Trải nghiệm không cần sửa chữ nào.
  BK5 (client và server dùng chung `computeQuote`) là bất biến quan trọng nhất của đợt này.
- **Nợ mở, DRI chủ dự án:** dọn hai trang trùng `phao-chuoi` / `phao-bay-flying-banana-boat` (một
  sản phẩm, hai trang đã xuất bản); quyết có mở đơn vị giá nhóm hay không; thêm dòng giá cho Phao
  bay nếu muốn bán; trang gom "Lặn biển Hòn Tằm" nếu muốn (việc nội dung, không phải việc giá).
- **Một cạm bẫy đã biết, phải có test canh:** `BookingForm` yêu cầu tạm tính dựng ở máy chủ khớp
  **từng tham số** với trạng thái mở màn ở trình duyệt; lệch là số tiền nhảy một nhịp ngay khi
  trang tải xong (`DR-102`, lỗi tiền thật đã xảy ra). Trang Trải nghiệm đi lại đúng đường đó.
- **Ranh giới không nới.** `00-PROJECT_BRIEF` §5 — không thanh toán, không giỏ hàng, không quản
  lý chỗ trống — còn nguyên. Đơn vẫn là *yêu cầu đặt*, nhân viên gọi lại chốt.
