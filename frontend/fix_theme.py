import os
import re

# 1. Update JSX files
for root, _, files in os.walk('c:/InterChain/frontend/src'):
    for file in files:
        if file.endswith('.jsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace dark inline background with css variable
            new_content = re.sub(r"rgba\(15,\s*23,\s*42,\s*([0-9.]+)\)", "var(--input-bg)", content)
            
            # Replace hardcoded white texts with css variable
            new_content = new_content.replace("color: '#fff'", "color: 'var(--text)'")
            new_content = new_content.replace("color: '#ffffff'", "color: 'var(--text)'")
            new_content = new_content.replace('color: "white"', "color: 'var(--text)'")
            new_content = new_content.replace("color: 'white'", "color: 'var(--text)'")
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated JSX: {path}")

# 2. Update styles.css for "dirty white" light theme and <option> tags
css_path = 'c:/InterChain/frontend/src/styles.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css_content = f.read()

# Replace light theme colors
css_content = css_content.replace('--bg: #fbfdff;', '--bg: #fafaf9;')
css_content = css_content.replace('--bg-soft: #f1f5f9;', '--bg-soft: #f5f5f4;')
css_content = css_content.replace('--panel: rgba(255, 255, 255, 0.95);', '--panel: rgba(250, 250, 249, 0.95);')
css_content = css_content.replace('--panel-border: rgba(203, 213, 225, 0.6);', '--panel-border: rgba(214, 211, 209, 0.6);')
css_content = css_content.replace('--body-bg-gradient-start: #ffffff;', '--body-bg-gradient-start: #fafaf9;')
css_content = css_content.replace('--body-bg-gradient-mid: #f8fafc;', '--body-bg-gradient-mid: #f5f5f4;')
css_content = css_content.replace('--body-bg-gradient-end: #e2e8f0;', '--body-bg-gradient-end: #e7e5e4;')
css_content = css_content.replace('--panel-rgb: 255, 255, 255;', '--panel-rgb: 250, 250, 249;')
css_content = css_content.replace('--input-bg: rgba(255, 255, 255, 0.8);', '--input-bg: rgba(250, 250, 249, 0.8);')

# Add select option style if not exists
if 'select option {' not in css_content:
    css_content += "\n\nselect option {\n  background: var(--panel);\n  color: var(--text);\n}\n"

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css_content)
print("Updated styles.css")
