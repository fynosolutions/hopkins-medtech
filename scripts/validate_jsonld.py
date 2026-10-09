"""Validate every distinct built JSON-LD payload with Schema Markup Validator.

Run after npm run build. Only public structured data is sent to the validator;
the site stays noindex and disallowed. Identical payloads share a validation.
"""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import sys
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')
output = Path('qa/issue-1/schema')
output.mkdir(parents=True, exist_ok=True)
payloads = {}
for page in Path('.next/server/app').rglob('*.html'):
    html = page.read_text(encoding='utf-8')
    for match in re.finditer(r'<script\b[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S):
        raw = match.group(1)
        data = json.loads(raw)
        digest = hashlib.sha256(raw.encode()).hexdigest()
        entry = payloads.setdefault(digest, {'raw': raw, 'types': [x.get('@type') for x in data] if isinstance(data, list) else [data.get('@type')], 'pages': []})
        entry['pages'].append(str(page.relative_to('.next/server/app')).replace('\\', '/'))

def validate(item):
    digest, entry = item
    html = '<html><head><script type="application/ld+json">' + entry['raw'] + '</script></head><body></body></html>'
    request = urllib.request.Request('https://validator.schema.org/validate', data=urllib.parse.urlencode({'html': html}).encode(), headers={'User-Agent': 'HMC-JSON-LD-validation'})
    record = {'sha256': digest, 'types': entry['types'], 'pages': entry['pages']}
    try:
        with urllib.request.urlopen(request, timeout=40) as response:
            text = response.read().decode()
        result = json.loads(text[text.index('{'):])
        record.update(errors=result['totalNumErrors'], warnings=result['totalNumWarnings'])
        (output / (digest + '.json')).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    except Exception as error:
        record['validationError'] = str(error)
    return record

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(validate, payloads.items()))
report = {'validator': 'https://validator.schema.org/', 'inputMode': 'code', 'uniquePayloads': len(results), 'results': results}
(output / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
failed = [x for x in results if x.get('validationError') or x.get('errors', 0)]
print(json.dumps({'payloads': len(results), 'failures': failed, 'warnings': sum(x.get('warnings', 0) for x in results)}, ensure_ascii=False))
sys.exit(1 if failed or not results else 0)
