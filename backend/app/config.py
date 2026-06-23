import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "127.0.0.1")

# Setup base directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
PDFS_DIR = os.path.join(DATA_DIR, "pdfs")
FAISS_DIR = os.path.join(DATA_DIR, "faiss_indexes")

# Ensure physical directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(PDFS_DIR, exist_ok=True)
os.makedirs(FAISS_DIR, exist_ok=True)

# File paths
PAPERS_JSON = os.path.join(DATA_DIR, "papers.json")
SUMMARIES_JSON = os.path.join(DATA_DIR, "summaries.json")
FLASHCARDS_JSON = os.path.join(DATA_DIR, "flashcards.json")
QUESTIONS_JSON = os.path.join(DATA_DIR, "questions.json")
VIVA_QUESTIONS_JSON = os.path.join(DATA_DIR, "viva_questions.json")
