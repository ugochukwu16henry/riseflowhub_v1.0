"""Extract plain text from .docx files (Word XML)."""
import zipfile
import xml.etree.ElementTree as ET
import os
import sys

# Word XML namespace
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

def get_text_from_docx(path):
    with zipfile.ZipFile(path, 'r') as z:
        xml_content = z.read('word/document.xml')
    root = ET.fromstring(xml_content)
    paragraphs = []
    for p in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
        texts = []
        for t in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
            if t.text:
                texts.append(t.text)
            if t.tail:
                texts.append(t.tail)
        if texts:
            paragraphs.append(''.join(texts))
    return '\n'.join(paragraphs)

def main():
    folder = r"c:\Users\Dell\Documents\Afrilauch_v1.0\TECH Platform"
    out_folder = r"c:\Users\Dell\Documents\Afrilauch_v1.0\TECH Platform\extracted"
    os.makedirs(out_folder, exist_ok=True)
    count = 0
    for fname in os.listdir(folder):
        if not fname.endswith('.docx'):
            continue
        path = os.path.join(folder, fname)
        try:
            text = get_text_from_docx(path)
            out_name = fname.replace('.docx', '.txt')
            out_path = os.path.join(out_folder, out_name)
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(text)
            count += 1
        except Exception as e:
            pass
    print("Extracted", count, "files")

if __name__ == '__main__':
    main()
