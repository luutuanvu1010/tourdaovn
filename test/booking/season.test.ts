import { describe, expect, it } from 'vitest'
import { pickSeason, type Season } from '../../src/lib/booking/season'

const TET: Season = { name: 'Tết', from: '2027-02-05', to: '2027-02-15', percent: 40 }
const LE_304: Season = { name: 'Lễ 30/4', from: '2027-04-30', to: '2027-05-01', percent: 30 }
const HE: Season = { name: 'Cao điểm hè', from: '2027-06-01', to: '2027-08-31', percent: 20 }
const THAP_DIEM: Season = { name: 'Thấp điểm', from: '2027-09-15', to: '2027-11-30', percent: -15 }
const DS = [TET, LE_304, HE, THAP_DIEM]

describe('pickSeason', () => {
  it('không mùa nào phủ → null', () => {
    expect(pickSeason(DS, '2027-03-10')).toBeNull()
  })
  it('chỉ một mùa phủ → mùa đó', () => {
    expect(pickSeason(DS, '2027-07-01')?.name).toBe('Cao điểm hè')
  })
  it('ngày đầu và ngày cuối của khoảng đều tính là phủ', () => {
    expect(pickSeason(DS, '2027-06-01')?.name).toBe('Cao điểm hè')
    expect(pickSeason(DS, '2027-08-31')?.name).toBe('Cao điểm hè')
  })
  it('CÁI TRÊN THẮNG: 30/4 nằm trong hè nhưng lễ đứng trên', () => {
    const ds: Season[] = [LE_304, { ...HE, from: '2027-04-01' }]
    expect(pickSeason(ds, '2027-04-30')?.name).toBe('Lễ 30/4')
  })
  it('đảo thứ tự thì kết quả đảo theo — không so số học', () => {
    const ds: Season[] = [{ ...HE, from: '2027-04-01' }, LE_304]
    expect(pickSeason(ds, '2027-04-30')?.name).toBe('Cao điểm hè')
  })
  it('mùa giảm giá cũng chọn như mọi mùa khác', () => {
    expect(pickSeason(DS, '2027-10-01')?.percent).toBe(-15)
  })
  it('mùa một ngày (ngày lễ rời rạc)', () => {
    const ds: Season[] = [{ name: 'Quốc khánh', from: '2027-09-02', to: '2027-09-02', percent: 25 }]
    expect(pickSeason(ds, '2027-09-02')?.name).toBe('Quốc khánh')
    expect(pickSeason(ds, '2027-09-03')).toBeNull()
  })
  it('danh sách rỗng → null', () => {
    expect(pickSeason([], '2027-07-01')).toBeNull()
  })
  it('mùa khai ngược đầu đuôi thì bỏ qua, không ném', () => {
    const ds: Season[] = [{ name: 'Sai', from: '2027-08-31', to: '2027-06-01', percent: 50 }, HE]
    expect(pickSeason(ds, '2027-07-01')?.name).toBe('Cao điểm hè')
  })
  it('ngày khởi hành sai hình dạng ISO thì trả null, không ném', () => {
    expect(pickSeason(DS, '')).toBeNull()
    expect(pickSeason(DS, '2027/07/01')).toBeNull()
  })
  it('mùa khai sai hình dạng ngày thì bị bỏ qua, mùa hợp lệ đứng sau vẫn được chọn', () => {
    const ds: Season[] = [{ name: 'Sai hình dạng', from: '2027/06/01', to: '2027-08-31', percent: 99 }, HE]
    expect(pickSeason(ds, '2027-07-01')?.name).toBe('Cao điểm hè')
  })
})
