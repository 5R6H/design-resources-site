#!/usr/bin/env python3
import json, re
from pathlib import Path

"""
把 Notion 页面内容（纯文本粘贴）放到 data/notion_raw.txt
运行：python3 import_links.py
会生成 data/resources.json（全部先放到“未分类”）
"""

root = Path(__file__).resolve().parent
raw = root / 'data' / 'notion_raw.txt'
out = root / 'data' / 'resources.json'

text = raw.read_text(encoding='utf-8') if raw.exists() else ''
urls = re.findall(r'https?://[^\s\)\]>"]+', text)
seen = set()
items = []

for u in urls:
    u = u.rstrip('.,;')
    if u in seen:
        continue
    seen.add(u)
    name = re.sub(r'^https?://(www\.)?', '', u).split('/')[0]
    items.append({"name": name, "url": u, "tags": [], "note": "从 Notion 导入"})

data = [{"category": "未分类", "items": items}]
out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'导入完成: {len(items)} 个链接 -> {out}')
