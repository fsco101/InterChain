import os
import re

src_dir = r'c:\InterChain\frontend\src'

for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            changed = False
            if 'toLocaleString(' in content:
                content = re.sub(
                    r"toLocaleString\('en-PH',\s*\{(.*?)\}\)",
                    r"toLocaleString('en-PH', { timeZone: 'Asia/Manila', \g<1>})",
                    content
                )
                content = content.replace("toLocaleString()", "toLocaleString('en-PH', { timeZone: 'Asia/Manila' })")
                changed = True
            
            if 'toLocaleDateString(' in content:
                content = re.sub(
                    r"toLocaleDateString\('en-PH',\s*\{(.*?)\}\)",
                    r"toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', \g<1>})",
                    content
                )
                content = content.replace("toLocaleDateString()", "toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })")
                changed = True
            
            if changed:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print('Updated:', filepath)
