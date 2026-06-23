import os
import json
import shutil
from typing import List, Dict, Any, Optional
from app import config

def _load_json(file_path: str, default_val: Any) -> Any:
    if not os.path.exists(file_path):
        _save_json(file_path, default_val)
        return default_val
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return default_val

def _save_json(file_path: str, data: Any) -> None:
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving to {file_path}: {e}")

# Papers
def get_papers() -> List[Dict[str, Any]]:
    return _load_json(config.PAPERS_JSON, [])

def save_paper(paper: Dict[str, Any]) -> None:
    papers = get_papers()
    papers.append(paper)
    _save_json(config.PAPERS_JSON, papers)

def delete_paper(paper_id: str) -> bool:
    # 1. Remove from papers.json
    papers = get_papers()
    original_len = len(papers)
    papers = [p for p in papers if p["id"] != paper_id]
    
    if len(papers) == original_len:
        return False
        
    _save_json(config.PAPERS_JSON, papers)
    
    # Get file name to delete the physical PDF
    pdf_name = f"{paper_id}.pdf"
    pdf_path = os.path.join(config.PDFS_DIR, pdf_name)
    if os.path.exists(pdf_path):
        try:
            os.remove(pdf_path)
        except Exception as e:
            print(f"Error removing PDF file {pdf_path}: {e}")
            
    # 2. Remove from summaries.json
    summaries = _load_json(config.SUMMARIES_JSON, {})
    if paper_id in summaries:
        del summaries[paper_id]
        _save_json(config.SUMMARIES_JSON, summaries)
        
    # 3. Remove from flashcards.json
    flashcards = _load_json(config.FLASHCARDS_JSON, {})
    if paper_id in flashcards:
        del flashcards[paper_id]
        _save_json(config.FLASHCARDS_JSON, flashcards)
        
    # 4. Remove from viva_questions.json
    viva = _load_json(config.VIVA_QUESTIONS_JSON, {})
    if paper_id in viva:
        del viva[paper_id]
        _save_json(config.VIVA_QUESTIONS_JSON, viva)
        
    # 5. Remove from questions.json
    questions = _load_json(config.QUESTIONS_JSON, {})
    if paper_id in questions:
        del questions[paper_id]
        _save_json(config.QUESTIONS_JSON, questions)
        
    # 6. Delete FAISS index folder
    faiss_path = os.path.join(config.FAISS_DIR, paper_id)
    if os.path.exists(faiss_path):
        try:
            shutil.rmtree(faiss_path)
        except Exception as e:
            print(f"Error removing FAISS index {faiss_path}: {e}")
            
    return True

# Summaries
def get_summary(paper_id: str) -> Optional[Dict[str, Any]]:
    summaries = _load_json(config.SUMMARIES_JSON, {})
    return summaries.get(paper_id)

def save_summary(paper_id: str, summary_data: Dict[str, Any]) -> None:
    summaries = _load_json(config.SUMMARIES_JSON, {})
    summaries[paper_id] = summary_data
    _save_json(config.SUMMARIES_JSON, summaries)

# Flashcards
def get_flashcards(paper_id: str) -> List[Dict[str, Any]]:
    flashcards = _load_json(config.FLASHCARDS_JSON, {})
    return flashcards.get(paper_id, [])

def save_flashcards(paper_id: str, flashcards_data: List[Dict[str, Any]]) -> None:
    flashcards = _load_json(config.FLASHCARDS_JSON, {})
    flashcards[paper_id] = flashcards_data
    _save_json(config.FLASHCARDS_JSON, flashcards)

# Viva Questions
def get_viva_questions(paper_id: str) -> List[Dict[str, Any]]:
    viva = _load_json(config.VIVA_QUESTIONS_JSON, {})
    return viva.get(paper_id, [])

def save_viva_questions(paper_id: str, viva_data: List[Dict[str, Any]]) -> None:
    viva = _load_json(config.VIVA_QUESTIONS_JSON, {})
    viva[paper_id] = viva_data
    _save_json(config.VIVA_QUESTIONS_JSON, viva)

# RAG Questions History
def get_questions_history(paper_id: str) -> List[Dict[str, Any]]:
    questions = _load_json(config.QUESTIONS_JSON, {})
    return questions.get(paper_id, [])

def save_question_answer(paper_id: str, qa_item: Dict[str, Any]) -> None:
    questions = _load_json(config.QUESTIONS_JSON, {})
    if paper_id not in questions:
        questions[paper_id] = []
    questions[paper_id].append(qa_item)
    _save_json(config.QUESTIONS_JSON, questions)

# Stats
def get_stats() -> Dict[str, int]:
    papers = get_papers()
    summaries = _load_json(config.SUMMARIES_JSON, {})
    questions = _load_json(config.QUESTIONS_JSON, {})
    
    total_papers = len(papers)
    total_summaries = len(summaries)
    
    total_questions = 0
    for q_list in questions.values():
        total_questions += len(q_list)
        
    return {
        "total_papers": total_papers,
        "total_summaries": total_summaries,
        "total_questions": total_questions
    }
