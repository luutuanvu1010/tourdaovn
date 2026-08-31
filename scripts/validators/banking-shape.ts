/**
 * banking-shape — hình dạng tài khoản nhận chuyển khoản (SPEC 2026-08-31 §7).
 *
 * Mức FAIL. Đây là CHỖ DUY NHẤT kiểm hình dạng khối `banking`: hàm buildPaymentQr() cố ý
 * không tự kiểm (SPEC §4.3 — một chỗ chịu trách nhiệm, không ba).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BIÊN CỦA CỔNG NÀY — đọc trước khi trích nó làm bằng chứng.
 *
 * Nó kiểm HÌNH DẠNG, không kiểm SỰ THẬT. Một số tài khoản đúng 10 chữ số nhưng không tồn
 * tại, hoặc tồn tại nhưng của người khác, sẽ đi qua đây [pass] và im lặng. Sai chữ số là
 * tiền của khách vào tài khoản người lạ.
 *
 * Cái duy nhất bắt được lỗi đó là QUÉT MÃ BẰNG APP NGÂN HÀNG THẬT và đọc TÊN THỤ HƯỞNG
 * app hiện ra. Cổng này không thay được bước đó và không được dùng để bỏ bước đó.
 * (Ảnh QR dựng được cũng không phải bằng chứng: img.vietqr.io vẽ lại đúng tham số ta đưa
 * vào, kể cả với số tài khoản không tồn tại. SPEC §11.2.)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { banking } from '../../src/site.config'

function main(): void {
  const errors: string[] = []

  // BIN NAPAS: đúng 6 chữ số. VietQR dựng đường dẫn ảnh từ giá trị này.
  if (!/^\d{6}$/.test(banking.bin)) {
    errors.push(`bin phải đúng 6 chữ số, đang là ${JSON.stringify(banking.bin)}`)
  }

  // Số tài khoản: 1–19 ký tự chữ/số, không khoảng trắng, không gạch.
  if (!/^[0-9a-zA-Z]{1,19}$/.test(banking.accountNumber)) {
    errors.push(
      `accountNumber phải là 1–19 ký tự chữ/số không khoảng trắng, đang là ${JSON.stringify(banking.accountNumber)}`,
    )
  }

  // Tên chủ tài khoản: IN HOA, KHÔNG DẤU theo lệ ngân hàng. Không định tuyến tiền (ngân hàng
  // ghi đè bằng tên thật lúc tra cứu) nhưng khách đối chiếu bằng mắt nên vẫn phải sạch.
  if (banking.accountName.trim().length === 0) {
    errors.push('accountName rỗng')
  } else if (!/^[A-Z0-9 ]+$/.test(banking.accountName)) {
    errors.push(
      `accountName phải IN HOA không dấu (chỉ A–Z, 0–9, khoảng trắng), đang là ${JSON.stringify(banking.accountName)}`,
    )
  }

  // `bankName` là NGUỒN SỰ THẬT THỨ HAI cho cùng một thứ mà `bin` đã nói (P6/N7). Không gỡ được
  // — khối chữ phải in tên ngân hàng, mà `bin` là con số không tự đọc ra tên, và một bảng tra
  // đầy đủ trong repo lại chính là nguồn thứ hai to hơn. Nên ràng buộc CẶP tại đây.
  //
  // Ca hỏng thật nếu chỉ kiểm "không rỗng": đổi ngân hàng, sửa `bin` thành 970436 (Vietcombank),
  // QUÊN sửa nhãn. Khối chữ in "Techcombank" trong khi ẢNH QR in logo Vietcombank — VietQR suy
  // logo từ `bin`. Khách thấy hai ngân hàng trên cùng một màn hình và dừng lại.
  //
  // Chú thích "đổi bin thì đổi luôn dòng này" KHÔNG chặn được việc đó. CLAUDE.md nói thẳng:
  // ranh giới bảo đảm bằng cấu trúc, không bằng lời nhắc.
  const BIN_DA_DUNG: Record<string, RegExp> = {
    '970407': /techcombank/i,
    '970436': /vietcombank/i,
  }
  if (banking.bankName.trim().length === 0) {
    errors.push('bankName rỗng — khối chữ cạnh ảnh QR không in được tên ngân hàng')
  } else if (/^\d{6}$/.test(banking.bin)) {
    const mong = BIN_DA_DUNG[banking.bin]
    if (!mong) {
      errors.push(
        `bin ${banking.bin} chưa có trong BIN_DA_DUNG của validator này. Đổi ngân hàng là việc `
        + 'hiếm và đắt, nên nó PHẢI đi kèm một lần sửa validator có chủ ý: thêm cặp bin → tên vào '
        + 'BIN_DA_DUNG (tra tên đúng ở https://api.vietqr.io/v2/banks). Đừng nới luật này.',
      )
    } else if (!mong.test(banking.bankName)) {
      errors.push(
        `bin ${banking.bin} và bankName ${JSON.stringify(banking.bankName)} KHÔNG CÙNG MỘT NGÂN HÀNG. `
        + 'Ảnh QR suy logo từ bin, khối chữ in bankName — lệch nhau là khách thấy hai ngân hàng.',
      )
    }
  }

  if (errors.length > 0) {
    console.log(`[FAIL] banking (src/site.config.ts) — ${errors.length} lỗi:`)
    for (const err of errors) console.log(`       ${err}`)
    process.exit(1)
  }

  console.log(`[pass] banking hình dạng hợp lệ: bin=${banking.bin} (${banking.bankName}), accountNumber ${banking.accountNumber.length} ký tự`)
  console.log('[skip] KHÔNG kiểm số tài khoản có thật hay đúng chủ — chỉ app ngân hàng thật kiểm được (SPEC §11.2)')
}

main()
