// payment-qr.ts — dựng mã QR chuyển khoản VietQR cho một đơn (SPEC 2026-08-31 §4.3 + §11).
//
// Thuần tuyệt đối: không mạng, không D1, không Astro, không đọc site.config. Cấu hình đi vào
// bằng THAM SỐ theo khuôn BK5 (giống quote.ts nhận bảng giá làm đối số) — người gọi cấp, để
// test không phải dựng cấu hình site.
//
// Hàm KHÔNG kiểm hình dạng `banking`. Việc đó thuộc scripts/validators/banking-shape.ts, một
// chỗ chịu trách nhiệm chứ không ba (SPEC §4.3).

import type { PaymentMethod } from './schema'

export type Banking = {
  bin: string
  bankName: string
  accountNumber: string
  accountName: string
}

export type PaymentQr = {
  imageUrl: string
  /** Nội dung chuyển khoản: mã đơn ĐÃ BỎ GẠCH NỐI. Khách THẤY `TD-260831-K7QM`, GÕ `TD260831K7QM`. */
  addInfo: string
  amount: number
  bin: string
  bankName: string
  accountNumber: string
  accountName: string
}

/**
 * Trả `null` KHI VÀ CHỈ KHI `paymentMethod !== 'transfer'`. Đây là đường trả `null` duy nhất.
 *
 * `total` phải là `quote.total` — số ĐÃ TRỪ ưu đãi trả trước (`computeQuote()` áp cả phần trăm
 * mùa lẫn ưu đãi qua `apDieuChinh()`, quote.ts:63). KHÔNG phải `quote.prepay.totalGoc`, đó là
 * tổng chưa giảm dành cho nhân viên mặc cả (SPEC §11.6).
 */
export function buildPaymentQr(
  banking: Banking,
  code: string,
  total: number,
  paymentMethod: PaymentMethod,
): PaymentQr | null {
  if (paymentMethod !== 'transfer') return null

  // VietQR: addInfo tối đa 50 ký tự và không nhận ký tự đặc biệt. Mã đơn có gạch nối nên phải
  // bỏ. Bảng điều khiển đối soát sau này phải khớp theo DẠNG NÀY, còn cột `code` trong D1 vẫn
  // lưu có gạch (SPEC §4.3).
  const addInfo = code.replace(/-/g, '')

  // Ghép bằng encodeURIComponent cho từng giá trị, KHÔNG dùng URLSearchParams: nó mã hoá dấu
  // cách thành '+', mà accountName có dấu cách và VietQR cần '%20'.
  const q = [
    `amount=${encodeURIComponent(String(total))}`,
    `addInfo=${encodeURIComponent(addInfo)}`,
    `accountName=${encodeURIComponent(banking.accountName)}`,
  ].join('&')

  // compact2 in sẵn TÊN CHỦ TK, SỐ TK và SỐ TIỀN lên ảnh — nhưng KHÔNG in addInfo (đã đo, SPEC
  // §11.4). Nên khối chữ cạnh ảnh không phải tuỳ chọn: nội dung chuyển khoản chỉ tồn tại ở đó
  // và trong payload của mã.
  const imageUrl =
    `https://img.vietqr.io/image/${encodeURIComponent(banking.bin)}-` +
    `${encodeURIComponent(banking.accountNumber)}-compact2.png?${q}`

  return {
    imageUrl,
    addInfo,
    amount: total,
    bin: banking.bin,
    bankName: banking.bankName,
    accountNumber: banking.accountNumber,
    accountName: banking.accountName,
  }
}
