import re, glob, os
SRC='/Users/tuanbao/Documents/Projects/ctytnhhtourdao/tourdaovn/src/components'
def arr(doc, name):
    m = re.search(rf'const {name} = \[(.*?)\n\]', doc, re.S)
    return m.group(1) if m else ''
def fields(block):
    out={}
    for line in block.split('\n'):
        if 'label:' not in line: continue
        lab = re.search(r"label: t\('(\w+)'\)", line)
        fs = set(re.findall(r'data\.(\w+)', line))
        fs |= set(re.findall(r'\b(priceView|typeLabel|formatLabel)\b', line))
        if lab: out[lab.group(1)] = frozenset(fs)
    return out
print(f"{'template':24s} {'field nuoi CA HAI vung':52s} nhan")
print('─'*104)
tot=0
for f in sorted(glob.glob(f'{SRC}/*Detail.astro')):
    doc=open(f,encoding='utf-8').read()
    ib, sb = fields(arr(doc,'infoBarItems')), fields(arr(doc,'sidebarRows'))
    if not ib or not sb: continue
    hits=[]
    for lk, lf in ib.items():
        for sk, sf in sb.items():
            if lf and sf and lf == sf:
                hits.append((sorted(lf), lk, sk))
    for fs, lk, sk in hits:
        tot+=1
        tag = f"{lk}" if lk==sk else f"{lk} / {sk}  ← HAI NHAN"
        print(f"  {os.path.basename(f)[:-6]:22s} {', '.join(fs):50s} {tag}")
print(f"\nTong cap field-trung-vung o tang template: {tot}")
