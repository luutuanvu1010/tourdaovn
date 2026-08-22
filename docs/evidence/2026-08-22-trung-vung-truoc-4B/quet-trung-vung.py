import re, os, glob, collections, html

RX = {
  'InfoBar':   re.compile(r'class="info-label"[^>]*>(.*?)</span><span class="info-value"[^>]*>(.*?)</span>', re.S),
  'InfoCard':  re.compile(r'</span>([^<]{1,40})</dt><dd class="info-row-value"[^>]*>(.*?)</dd>', re.S),
}
PRICE = {
  'thanh dinh': re.compile(r'class="sticky-bar__price"[^>]*>(.*?)</span>', re.S),
  'BookingCTA': re.compile(r'class="booking-price-value"[^>]*>(.*?)</span>', re.S),
}
def clean(s):
    s = re.sub(r'<[^>]+>', '', s)
    return html.unescape(s).strip()

rows = []
kindcount = collections.Counter()
fieldpairs = collections.Counter()
for f in sorted(glob.glob('pages/*.html')):
    name = os.path.basename(f)[:-5]
    kind = name.split('_')[0]
    doc = open(f, encoding='utf-8').read()
    regions = {}
    for reg, rx in RX.items():
        regions[reg] = {clean(v): clean(l) for l, v in rx.findall(doc)}
    prices = {}
    for reg, rx in PRICE.items():
        m = rx.findall(doc)
        if m: prices[reg] = clean(m[0])
    # gia trung: cung mot gia tri xuat hien o >1 vung bat ky
    allregions = dict(regions)
    for k, v in prices.items():
        allregions[k] = {v: '(gia)'}
    seen = collections.defaultdict(list)
    for reg, kv in allregions.items():
        for val, lab in kv.items():
            if val: seen[val].append((reg, lab))
    dups = {v: r for v, r in seen.items() if len(r) > 1}
    if dups:
        kindcount[kind] += 1
        for val, regs in dups.items():
            labs = ' / '.join(sorted({l for _, l in regs if l != '(gia)'})) or '(gia)'
            fieldpairs[(labs, ' + '.join(r for r, _ in regs))] += 1
        rows.append((name, dups))

print(f"Trang co it nhat mot gia tri hien o >1 vung: {len(rows)}/58")
for k, c in kindcount.most_common():
    tot = len(glob.glob(f'pages/{k}_*.html'))
    print(f"  {k:18s} {c}/{tot}")
print()
print("Cap (nhan) x (cac vung lap) — dem theo so trang:")
for (labs, regs), c in fieldpairs.most_common(20):
    print(f"  {c:3d} trang | {labs:38s} | {regs}")

print()
print("Chi tiet tung trang (44 trang):")
for name, dups in rows:
    items = []
    for val, regs in sorted(dups.items()):
        labs = ' / '.join(sorted({l for _, l in regs if l != '(gia)'})) or 'gia'
        items.append(f"{labs} ×{len(regs)}")
    print(f"  {name:52s} {'; '.join(items)}")
