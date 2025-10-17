#!/usr/bin/env python3
"""
Script per generare tipi TypeScript da Supabase usando MCP
"""

import subprocess
import json
import sys

def generate_types():
    """Genera i tipi TypeScript usando il tool MCP generate_typescript_types"""
    
    print("🔄 Generazione tipi TypeScript da Supabase...")
    
    # Esegui il comando MCP
    cmd = [
        "manus-mcp-cli",
        "tool",
        "call",
        "generate_typescript_types",
        "--server",
        "supabase",
        "--input",
        json.dumps({"project_id": "kyrliitlqshmwbzaaout"})
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        output = result.stdout
        
        # Il tool restituisce un messaggio con il TypeScript dentro
        # Cerchiamo di estrarre il contenuto TypeScript
        
        # L'output contiene una stringa con il TypeScript
        # Dobbiamo trovare dove inizia "export type Json" o "export interface Database"
        
        lines = output.split('\n')
        typescript_content = None
        
        # Cerca la riga che contiene il TypeScript
        for i, line in enumerate(lines):
            if 'export type Json' in line or 'export interface Database' in line:
                # Tutto da qui in poi è TypeScript
                typescript_content = '\n'.join(lines[i:])
                break
            # Potrebbe essere in una stringa JSON escaped
            if '"export type Json' in line or '"export interface Database' in line:
                # Prova a fare il parse JSON
                try:
                    # Trova la parte JSON
                    json_start = line.find('{')
                    if json_start != -1:
                        json_str = line[json_start:]
                        data = json.loads(json_str)
                        if 'content' in data:
                            typescript_content = data['content']
                        elif 'types' in data:
                            typescript_content = data['types']
                        break
                except:
                    pass
        
        # Se non troviamo il TypeScript, proviamo un approccio diverso
        if not typescript_content:
            # Cerca "export" nell'output
            for line in lines:
                if line.strip().startswith('export'):
                    idx = output.find(line)
                    typescript_content = output[idx:]
                    break
        
        if not typescript_content:
            print("⚠️  Non riesco a estrarre il TypeScript dall'output MCP")
            print("Output completo:")
            print(output)
            return False
        
        # Pulisci il contenuto (rimuovi escape sequences se presenti)
        typescript_content = typescript_content.replace('\\n', '\n')
        typescript_content = typescript_content.replace('\\"', '"')
        typescript_content = typescript_content.replace('\\t', '\t')
        
        # Scrivi il file
        output_file = "lib/supabase/database.types.ts"
        with open(output_file, 'w') as f:
            f.write(typescript_content)
        
        print(f"✅ Tipi TypeScript generati in: {output_file}")
        print(f"📊 Dimensione file: {len(typescript_content)} caratteri")
        
        # Conta le tabelle
        table_count = typescript_content.count('Tables:')
        print(f"📋 Tabelle trovate: ~{table_count}")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Errore nell'esecuzione del comando MCP:")
        print(f"   {e}")
        print(f"   Output: {e.output}")
        return False
    except Exception as e:
        print(f"❌ Errore: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = generate_types()
    sys.exit(0 if success else 1)

