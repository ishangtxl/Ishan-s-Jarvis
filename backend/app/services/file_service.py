import os
from fastapi import UploadFile
import pypdf
from docx import Document

async def read_file_content(file: UploadFile) -> str:
    filename = file.filename.lower()
    content = ""
    
    # Text/Code files
    if filename.endswith(('.txt', '.md', '.py', '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.c', '.cpp', '.h')):
        content = (await file.read()).decode('utf-8')
        await file.seek(0) # Reset
        
    # PDF
    elif filename.endswith('.pdf'):
        # Save temp to read with pypdf (it likes file paths or streams)
        # using sync reader on bytes
        try:
            import io
            file_bytes = await file.read()
            pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in pdf_reader.pages:
                content += page.extract_text() + "\n"
        except Exception as e:
            print(f"Error reading PDF: {e}")
            
    # DOCX
    elif filename.endswith('.docx'):
        try:
            import io
            file_bytes = await file.read()
            doc = Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                content += para.text + "\n"
        except Exception as e:
            print(f"Error reading DOCX: {e}")
            
    else:
        # Try as text default
        try:
            content = (await file.read()).decode('utf-8')
        except:
            content = "[Binary or Unsupported File]"
            
    return content
