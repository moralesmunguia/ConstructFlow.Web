#!/usr/bin/env python3
import sys
from pathlib import Path

def install(package):
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    import PyPDF2
except Exception:
    install("PyPDF2")
    import PyPDF2

if len(sys.argv) < 2:
    print("Uso: extract_pdf_text.py <archivo.pdf> [salida.txt]")
    sys.exit(2)

pdf_path = Path(sys.argv[1])
if not pdf_path.exists():
    print(f"ERROR: archivo no encontrado: {pdf_path}")
    sys.exit(1)

out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else pdf_path.with_suffix('.txt')

try:
    with open(pdf_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        pages = []
        for p in reader.pages:
            text = p.extract_text()
            if text:
                pages.append(text)
    text = '\n\n'.join(pages)
    out_path.write_text(text, encoding='utf-8')
    print(str(out_path))
except Exception as e:
    print('ERROR:', e)
    sys.exit(1)
