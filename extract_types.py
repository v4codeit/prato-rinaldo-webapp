#!/usr/bin/env python3
import subprocess
import json

result = subprocess.run(
    ['manus-mcp-cli', 'tool', 'call', 'generate_typescript_types',
     '--server', 'supabase', '--input', '{"project_id": "kyrliitlqshmwbzaaout"}'],
    capture_output=True, text=True
)

output = result.stdout.strip()

if "Tool execution result:" in output:
    json_part = output.split("Tool execution result:")[1].strip()
    types_content = json.loads(json_part)
    
    # If it's a string, write directly; if dict, convert to string
    content_to_write = types_content if isinstance(types_content, str) else str(types_content)
    
    with open('lib/supabase/database.types.ts', 'w') as f:
        f.write(content_to_write)
    
    print(f"✓ TypeScript types generated ({len(content_to_write)} chars)")
else:
    print("✗ Failed")
