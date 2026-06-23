import os
import sys
import uuid
from datetime import datetime

# Ensure the backend directory is in the Python search path for robust imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, UploadFile, File, HTTPException, status
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from app import config
from app.services import db_service, pdf_service, ai_service

app = FastAPI(title="ResearchIQ API", description="Backend API for AI-Powered Research Paper Summarizer")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify front-end domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class QARequest(BaseModel):
    question: str

# Endpoints
@app.post("/api/auth/login")
def login(req: LoginRequest):
    if req.username == "student" and req.password == "student123":
        return {
            "status": "success",
            "token": "researchiq_token_student123",
            "user": {
                "username": "student",
                "role": "student"
            }
        }
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password"
    )

@app.get("/api/stats")
def get_stats():
    try:
        return db_service.get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/papers")
def list_papers():
    try:
        return db_service.get_papers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/papers/upload")
async def upload_paper(file: UploadFile = File(...)):
    # Validate PDF
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed."
        )
        
    paper_id = str(uuid.uuid4())
    file_name = file.filename
    pdf_path = os.path.join(config.PDFS_DIR, f"{paper_id}.pdf")
    
    # Save physical file
    try:
        content = await file.read()
        with open(pdf_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save PDF upload: {str(e)}"
        )
        
    # Process PDF file contents
    try:
        # 1. Extract text using PyMuPDF
        text = pdf_service.extract_text_from_pdf(pdf_path)
        if not text.strip():
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Extracted text is empty. The PDF might contain only scanned images."
            )
            
        # 2. Extract Title, Summaries & Keywords via Gemini
        summary_res = ai_service.generate_summary_and_keywords(text)
        title = summary_res.get("title") or file_name[:-4]
        
        # 3. Generate Flashcards via Gemini
        flashcards = ai_service.generate_flashcards(text)
        
        # 4. Generate Viva Questions via Gemini
        viva = ai_service.generate_viva_questions(text)
        
        # 5. Build FAISS Vector Database for RAG
        ai_service.create_vector_store(text, paper_id)
        
        # Save to database files
        paper_metadata = {
            "id": paper_id,
            "title": title,
            "file_name": file_name,
            "upload_date": datetime.utcnow().isoformat() + "Z",
            "file_size": len(content)
        }
        
        db_service.save_paper(paper_metadata)
        db_service.save_summary(paper_id, summary_res)
        db_service.save_flashcards(paper_id, flashcards)
        db_service.save_viva_questions(paper_id, viva)
        
        return paper_metadata
        
    except ValueError as val_err:
        # Clean up file
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(val_err)
        )
    except Exception as e:
        # Clean up file
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(e)}"
        )

@app.get("/api/papers/{paper_id}")
def get_paper_details(paper_id: str):
    papers = db_service.get_papers()
    paper = next((p for p in papers if p["id"] == paper_id), None)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    summary = db_service.get_summary(paper_id)
    flashcards = db_service.get_flashcards(paper_id)
    viva = db_service.get_viva_questions(paper_id)
    
    return {
        "metadata": paper,
        "summary": summary,
        "flashcards": flashcards,
        "viva_questions": viva
    }

@app.delete("/api/papers/{paper_id}")
def delete_paper(paper_id: str):
    success = db_service.delete_paper(paper_id)
    if not success:
        raise HTTPException(status_code=404, detail="Paper not found")
    return {"status": "success", "message": f"Paper {paper_id} deleted successfully."}

@app.post("/api/papers/{paper_id}/qa")
def ask_question(paper_id: str, req: QARequest):
    # Verify paper exists
    papers = db_service.get_papers()
    paper = next((p for p in papers if p["id"] == paper_id), None)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    try:
        # Perform RAG query
        answer = ai_service.query_rag(paper_id, req.question)
        
        # Save to history
        qa_item = {
            "id": str(uuid.uuid4()),
            "question": req.question,
            "answer": answer,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        db_service.save_question_answer(paper_id, qa_item)
        
        return qa_item
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(val_err)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG query failed: {str(e)}"
        )

@app.get("/api/papers/{paper_id}/qa")
def get_qa_history(paper_id: str):
    try:
        return db_service.get_questions_history(paper_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("app.main:app", host=config.HOST, port=config.PORT, reload=True)
