"""Validate every distinct built JSON-LD payload with Schema Markup Validator.

Run after npm run build. Only public structured data is sent to the validator;
the site stays noindex and disallowed. Identical payloads share a validation.
"""
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

# Submit unvalidated payloads together to avoid one request per page.
# The raw response and the exact payload hashes are retained as evidence.
pending = []
results = []
for digest, entry in payloads.items():
    saved = output / (digest + '.json')
    cached = json.loads(saved.read_text(encoding='utf-8')) if saved.exists() else None
    record = {'sha256': digest, 'types': entry['types'], 'pages': entry['pages']}
    if cached is not None and cached.get('totalNumErrors') == 0:
        record.update(errors=0, warnings=cached.get('totalNumWarnings', 0))
        if cached.get('validatedIn'): record['validatedIn'] = cached['validatedIn']
        results.append(record)
    else:
        pending.append((digest, entry, record))

if pending:
    html = '<html><head>' + ''.join('<script type="application/ld+json">' + entry['raw'] + '</script>' for _, entry, _ in pending) + '</head><body></body></html>'
    (output / 'pending-code-input.html').write_text(html, encoding='utf-8')
    batch_name = 'batch-' + hashlib.sha256(html.encode()).hexdigest() + '.json'
    request = urllib.request.Request('https://validator.schema.org/validate', data=urllib.parse.urlencode({'html': html}).encode(), headers={'User-Agent': 'HMC-JSON-LD-validation'})
    try:
        if '--export-only' in sys.argv:
            raise RuntimeError('Pending manual Schema Markup Validator code-input validation; the service requires human verification after rate limiting.')
        with urllib.request.urlopen(request, timeout=40) as response:
            text = response.read().decode()
        result = json.loads(text[text.index('{'):])
        (output / batch_name).write_text(json.dumps({'payloads': [digest for digest, _, _ in pending], 'response': result}, ensure_ascii=False, indent=2), encoding='utf-8')
        for digest, _, record in pending:
            record.update(errors=result['totalNumErrors'], warnings=result['totalNumWarnings'], validatedIn=batch_name)
            if result['totalNumErrors'] == 0:
                (output / (digest + '.json')).write_text(json.dumps({'validatedIn': batch_name, 'totalNumErrors': 0, 'totalNumWarnings': result['totalNumWarnings']}, indent=2), encoding='utf-8')
    except Exception as error:
        for _, _, record in pending: record['validationError'] = str(error)
    results.extend(record for _, _, record in pending)

report = {'validator': 'https://validator.schema.org/', 'inputMode': 'code', 'uniquePayloads': len(results), 'results': results}
(output / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
failed = [x for x in results if x.get('validationError') or x.get('errors', 0)]
print(json.dumps({'payloads': len(results), 'failures': failed, 'warnings': sum(x.get('warnings', 0) for x in results)}, ensure_ascii=False))
sys.exit(1 if failed or not results else 0)
