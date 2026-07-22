// Nguồn duy nhất cho slugify từ title — dùng chung translate/batch.ts và synthesis/field-mapper.ts.
// Quy tắc (DECISIONS 2026-07-11): slug.<lang> sinh từ title.<lang> của chính ngôn ngữ đó,
// chữ bản địa (Hangul/Hán/Cyrillic giữ nguyên qua \p{L}); title Việt bỏ dấu + đ→d ra slug ASCII
// — trùng kết quả slugify ASCII-only cũ của synthesis, không đổi hành vi slug.vi.
//
// Hai ràng buộc Unicode có chủ đích:
// 1. Chỉ strip dấu kết hợp ĐỨNG SAU ký tự Latin — strip toàn cục sẽ phá chữ Nga
//    (й = и + breve → и, ё → е) trong khi tiếng Việt vẫn cần bỏ dấu.
// 2. Kết quả normalize('NFC') — không NFC thì Hangul ra dạng Jamo tách rời (NFD),
//    lệch với so sánh NFC của r3-r4-post/filesystem dù nhìn giống hệt.
export function slugifyTitle(value: string): string {
  return value
    .normalize('NFD')
    .toLowerCase()
    .replace(/([a-z])[̀-ͯ]+/g, '$1')
    // NFC TRƯỚC bước lọc: dấu kết hợp còn lại (й, ё, Hangul Jamo) là \p{M},
    // không recompose thì [^\p{L}\p{N}] sẽ biến chúng thành '-'
    .normalize('NFC')
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}
