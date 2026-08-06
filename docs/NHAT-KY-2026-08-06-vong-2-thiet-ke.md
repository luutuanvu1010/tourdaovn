# Nhật ký phiên làm việc — vòng thiết kế thứ hai, tầng dữ liệu trang chủ, và hai lần đổi chữ

**Ngày:** 2026-08-06 · **Vai:** Code · **Thi hành:** `docs/plans/2026-08-06-trang-chu-xung-tam.md`, mockup vòng 2 của Claude Design

Ghi lại **thứ tự thật sự xảy ra**, các chỗ rẽ hướng, và cả những chỗ tôi làm sai rồi phải quay lại — để người đọc sau không phải đoán lại vì sao mọi thứ thành ra như vậy. Báo cáo có cấu trúc nằm ở ADR-0024 và `DECISIONS` QĐ-09 đến QĐ-11.

---

## Mở đầu — nhận mockup vòng 2

Phiên bắt đầu bằng bốn mockup Claude Design dán vào: trải nghiệm, tour, địa điểm, trang chủ. Ba file lưu được ngay; file trải nghiệm không lưu được ở lượt đầu nên phải lấy lại. Cả bốn lưu vào `docs/design/vong2/` và commit làm hiện vật bước 7 **trước khi** đụng vào code — có hiện vật rồi mới có cái để đối chiếu.

Kiểm nhanh cả bốn: token chép nguyên văn từ `tokens.css`, đủ ba bộ giao diện, và token đề xuất được đánh dấu rõ "chờ duyệt" chứ không lẫn vào token thật. Design làm đúng luật.

## Design tìm ra hai lỗi thật

Đây là phần đáng giá nhất của vòng này, và nó không phải chuyện thẩm mỹ.

**Một.** `ExperienceDetail` không truyền `jumpLinks`, `priceLabel`, `ctaHref` nào vào `DetailLayout`, nên điều kiện `showStickyBar` **luôn sai**. Trang có giá và có Zalo lại không bao giờ có thanh đặt chỗ, trong khi trang tour cùng khung thì có. Đọc code là thấy ngay — nhưng phải có người vẽ hai trang cạnh nhau mới lộ ra.

**Hai.** `AttractionDetail` đặt `ctaUrl` thành `#booking-<key>` — một neo tới phần tử **không tồn tại trên trang**. Đúng là "CTA giả" mà R4 cấm. Cùng file còn không truyền gì vào hero nên cũng mất luôn thanh dính.

Sửa cả hai. Chứng minh lỗi CTA chết bằng đọc mã chứ không bằng dữ liệu, vì điểm tham quan duy nhất đang có lại chưa nối giá nên không kích hoạt được nhánh đó — ghi rõ giới hạn của bằng chứng thay vì nói suông là đã kiểm.

## Bốn trang chi tiết và hai chỗ dọn nợ token

Sửa tour, địa danh, điểm tham quan, trải nghiệm theo mockup. Hai chỗ đáng ghi:

**`InfoBar` co theo số ô thật.** Lưới trước cố định bốn cột, ô thiếu dữ liệu dùng `display:none` — nên ba ô có dữ liệu vẫn để hở một cột. Đổi sang biến `--info-cols` tính theo số ô hiện thật.

**Gạch chân tiêu đề mục về đúng token.** Bản cũ dùng 34px với gradient pha `--c-sand` sang `--c-green`, cộng một đường kẻ mờ ở đầu mỗi mục. Cả ba giá trị đó nằm ngoài nguồn token — tức là nguồn sự thật thứ hai, đúng thứ R1 cấm. Design bắt được và tôi thay bằng `--underline-width` đặc màu cát.

## Pha B — tầng dữ liệu, đi đúng thứ tự đặc tả trước

`CONTENT_MODEL` v1.0.16 → `DECISIONS` → schema Sanity → GROQ → kiểu → `g1` → `BINDING_MAP` §5.7. Không viết component nào trước khi bốn field có tên chính thức.

**Kế hoạch dự đoán sai một tín hiệu.** Bước 5 của việc 4 nói: sau khi thêm field vào `CONTENT_MODEL`, `g1` sẽ báo WARN vì đặc tả đi trước thi hành. Chạy thật thì `g1` vẫn `[pass]` — vì `g1` **chép cứng bảng field trong mã validator, không đọc markdown** (DR-027). Nó không thấy gì thay đổi cả. Ghi thẳng vào commit rằng tín hiệu đó không tồn tại, thay vì lặng lẽ bỏ qua bước kiểm.

**Kế hoạch thiếu một chỗ.** Việc 5 bảo thêm mấy field con vào `SUB_FIELD_IGNORE`. Làm theo thì `g1` vẫn hỏng, vì `name`, `logo`, `url`, `value` là sub-field của `partners[]`/`stats[]` nhưng lại là field **top-level** của entity khác — bỏ qua toàn cục là làm mù cả chỗ khác. Phải thêm vào `AMBIGUOUS_SUB_FIELDS.siteSettings`. Ghi lệch này vào commit.

**Chứng minh cổng hai chiều.** Bỏ một dòng khỏi bảng `g1` → nó báo `[FAIL]` đúng chỗ; khôi phục → `[pass]`. Cổng có kiểm thật, không phải xanh vì không nhìn.

## Pha D — bốn khối trang chủ, và cách chứng minh guard rỗng mà không đụng dữ liệu thật

Dựng `HomeStatsBand`, `HomePartners`, `HomeTestimonials`, `HomeGroupQuote`; `HomeTrustBar` đổi vai thành khối "Vì sao chọn".

Chiều **ẩn** đo thẳng trên `dist/index.html`: bốn khối đều 0, trang vẫn dựng 33 KB. Chiều **hiện** thì cần dữ liệu, mà Sanity đang trống và tôi không có quyền ghi. Cách làm: dựng một trang tạm với dữ liệu mẫu, build, đếm, rồi **xoá trang đó đi**. Kết quả: 3 ô số liệu, 2 ô đối tác, 2 thẻ đánh giá, CTA Zalo — và **0 JSON-LD**, đúng ràng buộc cấm serialize đánh giá.

Không đụng một byte nào trong Sanity để lấy bằng chứng này.

## Bốn token và font Lora — vào rồi ra trong cùng một ngày

Chủ dự án duyệt cả bốn token Design đề xuất cộng font Lora. Thi hành đầy đủ: tải Lora tự host (font biến thiên nên chỉ 2 file thay vì 6), sửa `07-DESIGN_TOKENS`, ghi QĐ-10, và ghi luôn cái giá — Lora dừng ở cấp đậm 700 nên mọi chỗ xin 800/900 bị trình duyệt kẹp xuống, tức **mã nói một đằng màn hình hiện một nẻo**.

Chỗ này tôi cố ý **không tự quét 16 chỗ đó**. Hạ hết xuống 700 làm mã trung thực nhưng mất đường lùi; đó là đánh đổi ở tầng token, không phải việc dọn dẹp. Ghi thành DR-031 với ba cách xử để người có quyền chọn.

Vài giờ sau, chủ dự án nhìn bản dựng thật và yêu cầu **một phông tiếng Việt phổ thông, mềm mại hơn**. Chọn **Nunito**: bo tròn đầu nét nên mềm thật, nằm trong nhóm chữ được dùng nhiều nhất nên mắt người Việt đã quen, và đủ bộ dấu tiếng Việt.

Đổi sang Nunito hoá ra tốt hơn cả ba mặt: nó chạy 400–800 nên **lấy lại cấp đậm 800** và DR-031 co từ 16 chỗ xuống còn 1; gỡ được cả Lora lẫn Plus Jakarta Sans nên thư mục font từ ~220 KB xuống **~104 KB**, thấp hơn cả mốc ~140 KB trước khi bắt đầu; và chỉ còn một dòng preload.

Ghi QĐ-11 kèm câu này, để người đọc lịch sử không tưởng là lật lọng: **đây là quyết định thẩm mỹ của người có quyền, sau khi thấy hàng thật.**

## Chỗ tôi từ chối làm

Chủ dự án yêu cầu "gỡ bỏ toàn bộ validator". Tôi không làm — `CLAUDE.md` §5 xếp việc bỏ cổng QA vào nhóm điểm dừng **không vượt được bằng một câu trong hội thoại**, và đó là luật của chính dự án này.

Nhưng phần hữu ích hơn là một sự thật đã kiểm: **validator không chặn gì cả.** `npm run build` chỉ chạy `astro check && astro build`; `npm run deploy` chỉ đẩy `dist`. Không lệnh nào gọi validator — điều này vốn đã được quyết ở ADR-0022 ("gỡ cổng validator khỏi đường phát hành"). Nếu mục đích là "đừng cản tôi ra mắt" thì điều đó đã đúng sẵn. Nêu ba cách nhẹ hơn thay cho xoá sạch.

## Tra dữ liệu để soạn bản kê nhập liệu — và bắt được hai lỗi

Chủ dự án hỏi nhập gì ở đâu. Trong lúc tra Sanity để viết bản kê, lộ ra hai chuyện:

**Có hai document tổ chức cho cùng một công ty.** Một tên đúng nhưng không có số giấy phép; một có giấy phép nhưng đường dẫn lại là đường dẫn của một **bài viết** (`tour-3-dao-nha-trang-review-chi-tiet`). Tour đang trỏ đơn vị vận hành vào cái thứ hai.

**`4201969169` gần như chắc chắn là mã số thuế, không phải giấy phép lữ hành.** Mã số thuế Việt Nam là 10 chữ số; giấy phép lữ hành quốc tế có dạng `56-xxx/2024/TCDL-GP LHQT`. Và số này **đang hiện công khai trên trang tour dưới nhãn "Giấy phép"** — do chính tôi dựng ở đợt này. Nhãn sai trên một tín hiệu tin cậy, ở đúng trang khách quyết chuyển tiền. Báo ngay, chờ xác nhận để sửa hoặc gỡ.

**`featuredTours` của Nha Trang đang trống** nên trang chủ của một công ty bán tour không bán gì — tạo tour thôi chưa đủ, phải gắn vào đó.

## Trang xem thử, và lời phán "giao diện xấu"

Chủ dự án muốn thấy giao diện ngay. Dựng một trang xem thử chạy đúng `SiteHome` thật, bơm số liệu thật vào, và **nói rõ ở đầu trang** cái nào thật cái nào mẫu. Công cụ chụp màn hình trình duyệt time-out năm lần liên tiếp nên không tự soi được — mở thẳng tab trong Chrome của chủ dự án thay vì thử mãi.

Phán quyết: **xấu.** Yêu cầu một câu prompt đơn giản để Claude Design tự do sáng tạo.

Chỗ này đáng ghi vì nó là lỗi của tôi, không phải của Design: prompt vòng 2 tôi viết **mở đầu bằng sáu điều cấm R1–R6 và mục "gặp mơ hồ thì DỪNG và hỏi"**. Design làm đúng như thế — cẩn thận, dẫn đủ điều khoản, và nhạt. Bằng chứng rõ nhất: nó đề xuất bốn token rồi **tự dựng hero bằng cỡ chữ cũ để không phạm R1**, ghi thẳng "chưa duyệt thì hero sẽ nhỏ hơn bản này một bậc". Nó đã tự làm mình xấu đi để tuân thủ.

Câu prompt mới đảo thứ tự: tự do đứng trước, ràng buộc còn đúng một điều (field thật và token), và kết bằng "đừng tự bó mình".

## Deploy

Deploy hai lần, cả hai lần giữ nguyên dòng chuyển hướng `/` sang tourdaonhatrang.com — chủ dự án nói "tạm thời deploy", không nói công bố, mà gỡ dòng đó là mở site ra công chúng sớm ba ngày so với mốc đã chốt.

Trước khi dựng, **xoá trang xem thử và quét `dist`** tìm ba cái tên khách bịa và hai logo mẫu. Đánh giá bịa mà lên production là chuyện khác hẳn.

**Lần deploy Nunito suýt hỏng câm.** `wrangler` in "Success" nhưng file font chính **không lên** — trang sẽ preload một file 404 rồi rơi về chữ hệ thống. Bắt được vì kiểm từng file sau khi đẩy chứ không tin dòng "Success". Deploy lại thì nó tải đúng 4 file còn thiếu.

Bài học ghi lại: sau `wrangler deploy`, luôn kiểm bằng `curl` từng tài nguyên mới, và nhớ **phá cache** — Cloudflare trả `cf-cache-status: HIT` với HTML cũ, làm tôi tưởng deploy hỏng trong khi nó đã xong.

## Bốn chỗ tôi làm sai trong phiên và phải quay lại

Ghi ra vì chúng đều là loại lỗi sẽ lặp lại nếu không ghi.

1. **`git add -A` cuốn nhầm file của người dùng.** `Buglog/1.log` đang untracked bị đưa vào commit. Amend để gỡ ra, trả về đúng trạng thái cũ. Bài học: đừng `add -A` khi cây làm việc có file lạ.

2. **`git stash` rồi build làm hỏng bằng chứng.** Tôi stash để so sánh, chạy build, rồi pop — nhưng `dist` lúc đó dựng từ **mã đã stash**. Kiểm trang điểm tham quan thấy trống trơn và suýt kết luận là code không chạy. Phải dựng lại mới ra đúng. Bài học: sau `stash pop` phải build lại trước khi đo.

3. **Thư mục làm việc của shell giữ nguyên giữa các lệnh.** Sau một lệnh `cd dist/...`, các lệnh `grep` sau đó chạy sai chỗ và trả về rỗng. Suýt báo hai lần rằng thay đổi không có tác dụng. Bài học: dùng đường dẫn tuyệt đối khi kiểm bằng chứng.

4. **Kiểm bằng regex sai rồi tin kết quả.** Grep `nearby-grid:has` không ra vì trình nén CSS bỏ dấu cách trong `:has(> :last-child)`. Kết luận đầu tiên là luật không lên — sai.

Cả bốn đều cùng một dạng: **phép kiểm của tôi hỏng, không phải mã hỏng.** Khi bằng chứng nói "không có gì", điều cần nghi trước tiên là phép đo.

## Trạng thái lúc chốt phiên

**Đã lên production:** bốn trang chi tiết theo mockup vòng 2, chữ Nunito, thanh dính trỏ Zalo, giấy phép cạnh nút đặt, lưới co theo số mục thật.

**Chưa lên:** trang chủ vẫn bị chuyển hướng nên bốn khối bằng chứng chưa ai thấy — và chúng cũng đang trống vì Sanity chưa có dữ liệu.

**Cổng:** `astro check` 0 lỗi; `check:theme` ba bộ đều đạt AA; `gate:all` 9/10 xanh, `deferred-gate` đỏ là lỗi có sẵn trước đợt này (đã đối chiếu bằng `git stash`); `validate` 24 pass / 2 fail / 2 warn, cả bốn đều là lỗi dữ liệu bên Sanity.

**Còn nợ, xếp theo mức chặn ra mắt:**

1. Nhập dữ liệu — bốn khối trang chủ, ba sản phẩm nữa, và gắn tour vào "Tour nổi bật" của Nha Trang
2. Xác nhận số giấy phép, hoặc gỡ dòng đó khỏi trang tour
3. Gộp hai document tổ chức trùng
4. Hai lỗi validator (dữ liệu)
5. Gỡ dòng chuyển hướng `/` khi công bố
6. **Chưa đo LCP sau hai lần đổi chữ** — cân nặng giảm nên chiều gió thuận, nhưng chưa đo là chưa biết
7. `I16` deferred mà sổ kiểm soát không khai ai chạy — đang làm `gate:all` đỏ
8. DR-028, DR-030, DR-031 (còn 1 chỗ), ND-004/006/007, và 15 cảnh báo "Phân loại" của `g3`

**Đang chờ chủ dự án:** có dựng gói bàn giao cho vòng thiết kế thứ ba không.
