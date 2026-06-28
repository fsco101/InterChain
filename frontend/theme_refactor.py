import re

with open('src/styles.css', 'r') as f:
    content = f.read()

# Replace panel colors
content = re.sub(r'rgba\(15,\s*23,\s*42,\s*([0-9.]+)\)', r'rgba(var(--panel-rgb), \1)', content)
content = re.sub(r'rgba\(2,\s*6,\s*23,\s*([0-9.]+)\)', r'rgba(var(--panel-rgb), \1)', content)
# Replace accent colors
content = re.sub(r'rgba\(56,\s*189,\s*248,\s*([0-9.]+)\)', r'rgba(var(--accent-rgb), \1)', content)
# Replace danger colors
content = re.sub(r'rgba\(239,\s*68,\s*68,\s*([0-9.]+)\)', r'rgba(var(--danger-rgb), \1)', content)
# Replace success colors
content = re.sub(r'rgba\(34,\s*197,\s*94,\s*([0-9.]+)\)', r'rgba(var(--success-rgb), \1)', content)
# Replace warning colors
content = re.sub(r'rgba\(245,\s*158,\s*11,\s*([0-9.]+)\)', r'rgba(var(--warning-rgb), \1)', content)

# Replace specific hardcoded hex colors
content = content.replace('color: #e2e8f0;', 'color: var(--text);')
content = content.replace('color: #38bdf8;', 'color: var(--accent);')
content = content.replace('color: #ef4444;', 'color: var(--danger);')
content = content.replace('color: #22c55e;', 'color: var(--accent-2);')
content = content.replace('color: #7dd3fc;', 'color: var(--accent);')

with open('src/styles.css', 'w') as f:
    f.write(content)

print("styles.css refactored!")
