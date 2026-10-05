from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
errors = []
for path in sorted((root / '.agents/skills').glob('*/SKILL.md')):
    text = path.read_text()
    parts = text.split('---', 2)
    if len(parts) != 3 or parts[0].strip():
        errors.append(f'{path}: missing frontmatter')
        continue
    fields = dict(re.findall(r'^(name|description): (.+)$', parts[1], re.M))
    if fields.get('name') != path.parent.name or not fields.get('description'):
        errors.append(f'{path}: invalid name or description')
    if not re.fullmatch(r'[a-z0-9-]{1,63}', fields.get('name', '')):
        errors.append(f'{path}: invalid skill name')
    for reference in re.findall(r'`(\.\./[^`]+\.md)`', text):
        if not (path.parent / reference).resolve().is_file():
            errors.append(f'{path}: missing reference {reference}')
if errors:
    raise SystemExit('\n'.join(errors))
print('Validated 3 local skills and their relative document references.')
