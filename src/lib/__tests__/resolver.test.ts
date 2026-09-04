import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolvePrice } from '../resolver.ts'
import type { PriceEntry } from '../types.ts'

// ADR-0033 §2 — `perGroup`: MỘT giá cho cả nhóm, tối đa maxPax khách. Nhãn phải
// nói rõ "một lượt" (không phải giá đầu người) và số khách tối đa, ở đủ 5 ngôn
// ngữ trang — thiếu một khối trong PRICE_LABEL_TEMPLATES là ngôn ngữ đó rơi vào
// `default: return null` và mất giá trên trang.

test('perGroup: nhãn nói rõ một lượt và số khách tối đa (vi)', () => {
  const prices = new Map<string, PriceEntry>([
    ['phao-chuoi', { unit: 'perGroup', amount: 1000000, maxPax: 5 }],
  ])
  const v = resolvePrice('phao-chuoi', 'experience', undefined, prices, 'vi')
  assert.ok(v)
  assert.match(v!.label, /lượt/)
  assert.match(v!.label, /5/)
  assert.equal(v!.offers[0].price, 1000000)
  assert.equal(v!.offers[0].priceCurrency, 'VND')
  assert.equal(v!.isFree, false)
})

test('perGroup: đủ 5 ngôn ngữ — không ngôn ngữ nào rơi về null', () => {
  const prices = new Map<string, PriceEntry>([
    ['phao-chuoi', { unit: 'perGroup', amount: 1000000, maxPax: 5 }],
  ])
  const langs = ['vi', 'en', 'zh', 'ko', 'ru'] as const
  for (const lang of langs) {
    const v = resolvePrice('phao-chuoi', 'experience', undefined, prices, lang)
    assert.ok(v, `lang=${lang} không được rơi về null`)
    assert.match(v!.label, /5/, `lang=${lang} phải chứa maxPax`)
    assert.equal(v!.offers[0].price, 1000000, `lang=${lang}`)
    assert.equal(v!.isFree, false, `lang=${lang}`)
  }
})

test('perGroup: amount không nhân với số khách — nhóm 3 người vẫn trả trọn giá một lượt', () => {
  const prices = new Map<string, PriceEntry>([
    ['ca-no-keo-phao', { unit: 'perGroup', amount: 1500000, maxPax: 8 }],
  ])
  const v = resolvePrice('ca-no-keo-phao', 'experience', undefined, prices, 'vi')
  assert.ok(v)
  // offers[0].price PHẢI là entry.amount nguyên vẹn — không có phép nhân nào ở đây
  assert.equal(v!.offers[0].price, 1500000)
})
