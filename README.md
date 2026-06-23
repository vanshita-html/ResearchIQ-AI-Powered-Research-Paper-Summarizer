# ResearchIQ - AI-Powered Research Paper Summarizer & RAG Q&A System

ResearchIQ is a full-stack academic tool built to help students analyze and study research papers quickly using generative artificial intelligence. The application processes academic PDFs, extracts contents, and provides summaries, study aids, and interactive Retrieval-Augmented Generation (RAG) question answering.

---

## 🎨 Theme & Styling
- **Primary Color:** White (`#ffffff` / `#fafafa`)
- **Accent Color:** Orange (`#F97316`)
- Styled using **Tailwind CSS v4** + **Vite** for optimized, high-fidelity responsive views, smooth custom layouts, and 3D card flipping animations.

---

## 🛠️ Technology Stack
- **Frontend:** React.js, Vite, Tailwind CSS v4, React Router, Axios, Lucide React (Icons).
- **Backend:** FastAPI (Python), PyMuPDF (Text Extraction).
- **AI Integration:** Google Gemini API (`gemini-1.5-flash`).
- **Vector Database (RAG):** LangChain, FAISS (Local CPU Vector Store), Google GenAI Embeddings (`models/embedding-001`).
- **Local Data Storage:** Flat JSON files (`backend/data/*.json`) - **No external database required!**

---

## 📁 Folder Structure
```text
ResearchIQ project/
├── frontend/                 # Vite React application
│   ├── src/
│   │   ├── components/       # Sidebar, ProtectedRoute, LoadingSpinner
│   │   ├── pages/            # Login, Dashboard, Upload, Details Tabs
│   │   ├── App.jsx           # Routing & Layouts
│   │   ├── index.css         # Tailwind directives & Theme variables
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js        # Vite configurations loading Tailwind v4
├── backend/                  # FastAPI python backend
│   ├── app/
│   │   ├── services/         # PDF extraction, Gemini services, DB service
│   │   ├── config.py         # Directory config and environment variables
│   │   └── main.py           # API endpoint definitions
│   ├── data/                 # JSON file databases, local PDFs, and FAISS indices
│   ├── .env                  # Backend environment keys (API key)
│   └── requirements.txt      # Python backend packages
└── README.md                 # Setup and documentation
```

---

## 🚀 Setup & Installation

### Prerequisite
Ensure you have the following installed on your machine:
- **Node.js** (v18+ recommended)
- **Python** (v3.9 - v3.12 recommended)
- **Google Gemini API Key** (Get one from [Google AI Studio](https://aistudio.google.com/))

---

### Step 1: Backend Setup
1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (CMD):**
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **Mac/Linux:**
     ```bash
     source venv/bin/activate
     ```
4. Install python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Configure your environmental settings:
   - Rename `.env` template or modify it directly.
   - Insert your API Key:
     ```env
     GEMINI_API_KEY=your_actual_gemini_api_key_here
     PORT=8000
     HOST=127.0.0.1
     ```
6. Start the FastAPI development server:
   ```bash
   python -m app.main
   ```
   The backend should start running at `http://127.0.0.1:8000`.

---

### Step 2: Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The frontend should start running at `http://localhost:5173`. Open this URL in your browser.

---

## 🔐 Authentication Credentials
- **Username:** `student`
- **Password:** `student123`

---

## 📖 Core Features Walkthrough

### 1. Dashboard
Displays statistics (Total papers, summaries, and Q&A interactions) alongside your academic library table and quick actions buttons.

### 2. Upload Paper
Validate PDF inputs, upload documents, parse them via PyMuPDF, and trigger Gemini summarization/study guides generation.

### 3. Summary & Keywords
Displays side-by-side card views of short abstracts, detailed structural summaries, and technological tags.

### 4. Interactive Flashcards
A grid of beautiful, interactive 3D flip-cards displaying core concepts. Click to toggle between Question and Answer.

### 5. Viva Exam Preparation
An accordion-style checklist of academic project evaluation questions (concerning objectives, datasets, methods, and limitations) with detailed answers.

### 6. RAG Q&A Assistant
An interactive chat window to query paper contents. Behind the scenes, LangChain splits the paper text, stores chunk embeddings in a local FAISS index, and performs semantic search to supply context to the Gemini model.
