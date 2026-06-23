import os
import json
import re
from collections import Counter
from typing import Dict, Any, List, Optional

# pyrefly: ignore [missing-import]
import google.generativeai as genai
# pyrefly: ignore [missing-import]
from langchain.text_splitter import RecursiveCharacterTextSplitter
# pyrefly: ignore [missing-import]
from langchain_community.embeddings import HuggingFaceEmbeddings
# pyrefly: ignore [missing-import]
from langchain_community.vectorstores import FAISS
from app import config

# Define standard English stopwords for local NLP analysis
STOPWORDS = {
    'the', 'a', 'of', 'and', 'in', 'to', 'is', 'for', 'on', 'with', 'by', 'as', 'at', 'an', 'be',
    'this', 'that', 'from', 'are', 'it', 'was', 'were', 'or', 'but', 'not', 'he', 'she', 'they',
    'we', 'our', 'you', 'your', 'his', 'her', 'their', 'which', 'who', 'whom', 'whose', 'has', 'have',
    'had', 'do', 'does', 'did', 'been', 'being', 'having', 'about', 'against', 'between', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
    'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
    'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'only', 'own', 'same',
    'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'would', 'now'
}

def _check_api_key():
    if not config.GEMINI_API_KEY or config.GEMINI_API_KEY.strip() == "":
        raise ValueError("Google Gemini API Key is not configured. Please add GEMINI_API_KEY to the backend/.env file.")
    genai.configure(api_key=config.GEMINI_API_KEY)

# ==========================================
# Local NLP Fallback Algorithms (Offline Mode)
# ==========================================

def _clean_academic_text(text: str) -> str:
    # Remove excessive newlines, tab spaces, and strange characters
    text = re.sub(r'\s+', ' ', text)
    # Remove PDF extraction symbols like (cid:123)
    text = re.sub(r'\(cid:\d+\)', '', text)
    return text.strip()

def _split_into_sentences(text: str) -> List[str]:
    # Split sentences by period, question mark, or exclamation followed by spaces and capitalized letter
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
    return [s.strip() for s in sentences if len(s.strip()) > 10]

def _extract_clean_title(text: str) -> str:
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Common headers, databases, publisher boilerplate to ignore
    ignore_keywords = [
        "issn", "isbn", "journal", "volume", "issue", "vol.", "pages", "received", "accepted", 
        "published", "copyright", "©", "http", "www", "conference", "proceedings", "abstract",
        "arxiv", "preprint", "researchgate", "doi:", "ieee", "springer", "elsevier"
    ]
    
    candidate_lines = []
    for line in lines[:25]:  # Scan top 25 non-empty lines
        line_lower = line.lower()
        if any(kw in line_lower for kw in ignore_keywords):
            continue
        words = line.split()
        if 3 <= len(words) <= 15:
            # Title generally has capitalization and is alphabetic
            cap_letters = sum(1 for c in line if c.isupper())
            letters = sum(1 for c in line if c.isalpha())
            if letters > 0 and (cap_letters / letters) > 0.1:
                candidate_lines.append(line)
                
    if candidate_lines:
        return candidate_lines[0]
    
    # Fallback: find first non-empty line with a reasonable length
    for line in lines[:10]:
        if 20 < len(line) < 100:
            return line
            
    return "Academic Research Paper"

def _extract_local_keywords(text: str) -> List[str]:
    # Search for an explicit "Keywords" or "Key words" section in the text
    keywords_match = re.search(r'(?:keywords|key\s*words|index\s*terms)[:\-\s]+(.*?)(?:\n\n|\n[A-Z]|\. [A-Z]|$)', text, re.IGNORECASE | re.DOTALL)
    if keywords_match:
        kw_text = keywords_match.group(1).replace('\n', ' ')
        kws = re.split(r'[,;.]', kw_text)
        cleaned_kws = [kw.strip() for kw in kws if kw.strip()]
        if len(cleaned_kws) >= 3:
            return [k.title() for k in cleaned_kws[:8]]
            
    # Fallback to calculating keyword occurrence frequencies
    tech_keywords = [
        "deep learning", "machine learning", "neural network", "convolutional neural network",
        "cnn", "transformer", "attention mechanism", "classification", "segmentation",
        "detection", "image processing", "computer vision", "natural language processing",
        "nlp", "dataset", "accuracy", "performance", "optimization", "framework",
        "supervised learning", "unsupervised learning", "reinforcement learning",
        "feature extraction", "artificial intelligence", "data analysis", "evaluation",
        "explainable ai", "xai", "vision transformer", "vit", "transfer learning",
        "precision", "recall", "f1-score", "validation", "tumor", "medical imaging",
        "mri", "segmentation", "healthcare", "diagnostics"
    ]
    
    text_lower = text.lower()
    found_kws = []
    for kw in tech_keywords:
        count = text_lower.count(kw)
        if count > 0:
            found_kws.append((kw, count))
            
    found_kws.sort(key=lambda x: x[1], reverse=True)
    kws = [kw[0].title() for kw in found_kws[:8]]
    if not kws:
        kws = ["Research", "Academic", "AI", "Analysis"]
    return kws

def _generate_local_summaries(text: str) -> Dict[str, Any]:
    cleaned_text = _clean_academic_text(text)
    
    # Extract Abstract section if present
    abstract_text = ""
    abstract_match = re.search(r'(?:abstract|summary)[:\-\s]+(.*?)(?:\n\s*(?:introduction|1\.\s+introduction|i\.\s+introduction)|\. [A-Z][a-z]+|$)', text, re.IGNORECASE | re.DOTALL)
    if abstract_match:
        abstract_text = _clean_academic_text(abstract_match.group(1))
        if len(abstract_text) > 200:
            abstract_text = abstract_text[:1800]
            
    if not abstract_text:
        abstract_text = cleaned_text[:2000]
        
    sentences = _split_into_sentences(cleaned_text[:15000])  # Use first 15k characters
    
    # Calculate local term frequency to score sentence representation
    words = re.findall(r'\b[a-zA-Z]{3,15}\b', cleaned_text.lower())
    word_counts = Counter(w for w in words if w not in STOPWORDS)
    
    scored_sentences = []
    for idx, sentence in enumerate(sentences):
        s_words = re.findall(r'\b[a-zA-Z]{3,15}\b', sentence.lower())
        non_stopwords = [w for w in s_words if w not in STOPWORDS]
        if 8 <= len(s_words) <= 35:
            score = sum(word_counts[w] for w in non_stopwords) / len(s_words)
            scored_sentences.append((idx, sentence, score))
            
    scored_sentences.sort(key=lambda x: x[2], reverse=True)
    
    # Short summary: top 3 representation sentences in chronological order
    top_short = sorted(scored_sentences[:3], key=lambda x: x[0])
    short_summary = " ".join(s[1] for s in top_short)
    
    # Detailed summary: structure it based on academic chapters
    intro_match = re.search(r'(?:introduction|1\.\s+introduction|i\.\s+introduction)[:\-\s]+(.*?)(?:\n\s*(?:method|proposed|system|2\.)|\. [A-Z][a-z]+|$)', text, re.IGNORECASE | re.DOTALL)
    method_match = re.search(r'(?:methodology|proposed method|architecture|system model|method|3\.)[:\-\s]+(.*?)(?:\n\s*(?:results|evaluation|discussion|experimental|4\.)|\. [A-Z][a-z]+|$)', text, re.IGNORECASE | re.DOTALL)
    results_match = re.search(r'(?:results|discussion|evaluation|experimental evaluation|5\.)[:\-\s]+(.*?)(?:\n\s*(?:conclusion|future work|acknowledgement|6\.)|\. [A-Z][a-z]+|$)', text, re.IGNORECASE | re.DOTALL)
    conclusion_match = re.search(r'(?:conclusion|conclusions|concluding remarks)[:\-\s]+(.*?)(?:\n\s*(?:references|acknowledgement)|$)', text, re.IGNORECASE | re.DOTALL)
    
    detailed_parts = []
    
    overview_text = abstract_text
    if len(overview_text) > 400:
        overview_text = overview_text[:400] + "..."
    detailed_parts.append(f"### Research Overview\n{overview_text}")
    
    if intro_match:
        intro_text = _clean_academic_text(intro_match.group(1))[:450].strip()
        if len(intro_text) > 50:
            detailed_parts.append(f"### Introduction & Background\n{intro_text}...")
            
    if method_match:
        method_text = _clean_academic_text(method_match.group(1))[:500].strip()
        if len(method_text) > 50:
            detailed_parts.append(f"### Proposed Methodology\n{method_text}...")
            
    if results_match:
        results_text = _clean_academic_text(results_match.group(1))[:500].strip()
        if len(results_text) > 50:
            detailed_parts.append(f"### Experimental Results\n{results_text}...")
            
    if conclusion_match:
        conclusion_text = _clean_academic_text(conclusion_match.group(1))[:450].strip()
        if len(conclusion_text) > 50:
            detailed_parts.append(f"### Conclusion & Future Scope\n{conclusion_text}...")
            
    if len(detailed_parts) <= 2:
        top_detailed = sorted(scored_sentences[:10], key=lambda x: x[0])
        p1 = " ".join(s[1] for s in top_detailed[:3])
        p2 = " ".join(s[1] for s in top_detailed[3:7])
        p3 = " ".join(s[1] for s in top_detailed[7:])
        detailed_summary = f"### Overview & Motivation\n{p1}\n\n### Methodology & Core Details\n{p2}\n\n### Validation & Findings\n{p3}"
    else:
        detailed_summary = "\n\n".join(detailed_parts)
        
    return {
        "title": _extract_clean_title(text),
        "short_summary": short_summary,
        "detailed_summary": detailed_summary,
        "keywords": _extract_local_keywords(text)
    }

def _find_best_sentence_for_query(sentences: List[str], keywords: List[str]) -> str:
    scored_sentences = []
    for s in sentences:
        s_lower = s.lower()
        score = sum(3 if kw in s_lower else 0 for kw in keywords)
        words_count = len(s.split())
        if words_count < 8 or words_count > 45:
            score -= 2
        if score > 0:
            scored_sentences.append((s, score))
            
    if scored_sentences:
        scored_sentences.sort(key=lambda x: x[1], reverse=True)
        return scored_sentences[0][0]
    return ""

def _generate_local_flashcards(text: str) -> List[Dict[str, str]]:
    cleaned_text = _clean_academic_text(text)
    sentences = _split_into_sentences(cleaned_text)
    
    card_templates = [
        {
            "question": "What is the primary objective of this research paper?",
            "keywords": ["objective", "aim", "propose", "presents", "goal of this study", "we target"]
        },
        {
            "question": "What core methodology or model architecture is proposed?",
            "keywords": ["architecture", "methodology", "method", "proposed approach", "framework", "cnn", "transformer"]
        },
        {
            "question": "Which dataset or evaluation data was utilized?",
            "keywords": ["dataset", "datasets", "database", "mri images", "clinical data", "evaluation", "labeled"]
        },
        {
            "question": "What classification algorithm or neural network models are evaluated?",
            "keywords": ["model", "algorithm", "classifier", "neural network", "efficientnet", "vit", "cnn", "network"]
        },
        {
            "question": "What are the primary performance metrics achieved (e.g. accuracy)?",
            "keywords": ["accuracy", "precision", "f1-score", "recall", "performance", "sensitivity", "metric"]
        },
        {
            "question": "How does the proposed method compare with state-of-the-art systems?",
            "keywords": ["state-of-the-art", "comparison", "outperform", "existing methods", "prior work", "baselines", "compare"]
        },
        {
            "question": "What key limitations or technical challenges are identified?",
            "keywords": ["limitation", "limitations", "drawback", "challenges", "technical challenge", "fails to"]
        },
        {
            "question": "What future work or directions do the authors suggest?",
            "keywords": ["future work", "next steps", "extension", "directions", "future research", "will focus"]
        },
        {
            "question": "What practical or clinical applications does this research target?",
            "keywords": ["application", "clinical", "practical", "healthcare", "real-world", "deployment"]
        },
        {
            "question": "What is the significance of features extracted during analysis?",
            "keywords": ["feature extraction", "features", "grad-cam", "xai", "explainable", "interpretability", "layer"]
        }
    ]
    
    flashcards = []
    for idx, card in enumerate(card_templates):
        answer = _find_best_sentence_for_query(sentences, card["keywords"])
        if not answer:
            answer = sentences[min(idx * 3, len(sentences)-1)]
        flashcards.append({
            "question": card["question"],
            "answer": answer
        })
        
    return flashcards

def _generate_local_viva_questions(text: str) -> List[Dict[str, str]]:
    cleaned_text = _clean_academic_text(text)
    sentences = _split_into_sentences(cleaned_text)
    
    viva_templates = [
        {
            "question": "How does the proposed approach improve upon existing work in this domain?",
            "keywords": ["state-of-the-art", "comparison", "outperforms", "existing methods", "prior work", "advantage", "novelty"]
        },
        {
            "question": "Describe the experimental setup and validation strategy used in this study.",
            "keywords": ["experimental", "setup", "validation", "cross-validation", "metrics", "evaluation", "split", "epoch"]
        },
        {
            "question": "Explain the key components of the proposed system architecture.",
            "keywords": ["architecture", "composed of", "consists of", "pipeline", "framework", "layers", "model structure"]
        },
        {
            "question": "What were the primary experimental results and key performance metrics?",
            "keywords": ["accuracy", "results show", "table", "performance", "achieved", "highest accuracy", "recall"]
        },
        {
            "question": "If you were to extend this work, what key limitations would you address first?",
            "keywords": ["limitations", "drawbacks", "shortcomings", "future research", "unresolved", "error analysis"]
        },
        {
            "question": "What is the clinical or real-world significance of the findings in this paper?",
            "keywords": ["application", "clinical", "practical", "useful for", "real-world", "healthcare", "diagnostics"]
        }
    ]
    
    viva = []
    for idx, item in enumerate(viva_templates):
        answer = _find_best_sentence_for_query(sentences, item["keywords"])
        if not answer:
            answer = sentences[min(idx * 4 + 2, len(sentences)-1)]
        viva.append({
            "question": item["question"],
            "answer": answer
        })
        
    return viva

# ==========================================
# Primary Service Endpoints
# ==========================================

# 1. Summarization & Keyword Generation
def generate_summary_and_keywords(text: str) -> Dict[str, Any]:
    try:
        _check_api_key()
        cropped_text = text[:40000]
        
        prompt = f"""
        Analyze the following research paper text. Generate:
        1. A clean academic title of the paper.
        2. A short summary (around 100 words).
        3. A detailed summary (around 300 to 500 words).
        4. A list of important keyword tags: Research topics, important keywords, algorithms, and technologies.
        
        You must format your response as a valid JSON object matching the following structure:
        {{
          "title": "Clean Academic Title...",
          "short_summary": "Short summary text...",
          "detailed_summary": "Detailed summary text...",
          "keywords": ["tag1", "tag2", "tag3", "tag4"]
        }}
        
        Do not wrap the response in markdown blocks (e.g. do not include ```json). Return raw JSON only.
        
        Research Paper Text:
        {cropped_text}
        """
        
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating summary via Gemini (switching to Local NLP Fallback): {e}")
        return _generate_local_summaries(text)

# 2. Flashcard Generation
def generate_flashcards(text: str) -> List[Dict[str, str]]:
    try:
        _check_api_key()
        cropped_text = text[:40000]
        
        prompt = f"""
        Based on the following research paper text, generate between 10 to 15 educational flashcards.
        Each flashcard must contain:
        - A question (academic, testing understanding of the concepts, methodology, or results).
        - An answer (clear, concise explanation).
        
        Format the response as a JSON array of objects, where each object has "question" and "answer" keys.
        Example:
        [
          {{"question": "What is the primary contribution?", "answer": "The paper proposes a new..."}},
          {{"question": "What dataset was used?", "answer": "The authors used the ImageNet..."}}
        ]
        
        Do not wrap the response in markdown blocks (e.g. do not include ```json). Return raw JSON only.
        
        Research Paper Text:
        {cropped_text}
        """
        
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating flashcards via Gemini (switching to Local NLP Fallback): {e}")
        return _generate_local_flashcards(text)

# 3. Viva Question Generation
def generate_viva_questions(text: str) -> List[Dict[str, str]]:
    try:
        _check_api_key()
        cropped_text = text[:40000]
        
        prompt = f"""
        Generate a list of 5 to 10 oral exam (viva) questions based on the following research paper.
        Include core academic questions, such as:
        - What is the objective of this paper?
        - Which dataset was used?
        - What methodology was applied?
        - What were the main results?
        - What are the limitations or future work?
        
        For each question, provide a detailed answer that the student can study.
        Format the response as a JSON array of objects, where each object has "question" and "answer" keys.
        Example:
        [
          {{"question": "What is the primary objective of this study?", "answer": "The objective is to..."}},
          {{"question": "Which dataset was utilized for training?", "answer": "They utilized the..."}}
        ]
        
        Do not wrap the response in markdown blocks (e.g. do not include ```json). Return raw JSON only.
        
        Research Paper Text:
        {cropped_text}
        """
        
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating viva questions via Gemini (switching to Local NLP Fallback): {e}")
        return _generate_local_viva_questions(text)

# 4. LangChain FAISS Vector Indexing
def create_vector_store(text: str, paper_id: str) -> None:
    """
    Splits paper text into chunks, computes local HuggingFace embeddings,
    and saves a local FAISS index.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    chunks = text_splitter.split_text(text)
    if not chunks:
        chunks = ["This document is empty or text could not be extracted."]

    # Local embeddings (FREE)
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # Build vector store
    vector_store = FAISS.from_texts(
        chunks,
        embeddings
    )

    # Save FAISS index
    index_path = os.path.join(
        config.FAISS_DIR,
        paper_id
    )
    vector_store.save_local(index_path)   

# 5. RAG Q&A Assistant Query
def query_rag(paper_id: str, question: str) -> str:
    """
    Loads local FAISS index, retrieves relevant chunks,
    and queries Gemini (or uses local NLP fallback) for the answer.
    """
    index_path = os.path.join(
        config.FAISS_DIR,
        paper_id
    )

    if not os.path.exists(index_path):
        return "RAG index not found for this paper. Please re-upload the paper."

    # Local embeddings (FREE)
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # Load vector store
    vector_store = FAISS.load_local(
        index_path,
        embeddings,
        allow_dangerous_deserialization=True
    )

    # Retrieve relevant chunks
    docs = vector_store.similarity_search(
        question,
        k=4
    )

    context = "\n\n".join([doc.page_content for doc in docs])

    try:
        _check_api_key()
        
        prompt = f"""
        You are ResearchIQ, an AI-powered academic assistant.
        Answer the user's question using ONLY the provided context.
        If the answer is not present in the context, clearly state that it is not explicitly mentioned.
        
        Context:
        {context}
        
        Question:
        {question}
        
        Answer:
        """
        
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error querying Gemini RAG (switching to Local NLP RAG Fallback): {e}")
        
        # Parse sentences from the retrieved chunks
        cleaned_context = _clean_academic_text(context)
        doc_sentences = _split_into_sentences(cleaned_context)
        
        # Tokenize question terms
        question_words = [w for w in re.findall(r'\b[a-zA-Z]{3,15}\b', question.lower()) if w not in STOPWORDS]
        if not question_words:
            question_words = question.lower().split()
            
        # Score retrieved sentences based on keyword overlap
        best_sentences = []
        for s in doc_sentences:
            s_lower = s.lower()
            score = sum(1 for w in question_words if w in s_lower)
            if score > 0:
                best_sentences.append((s, score))
                
        best_sentences.sort(key=lambda x: x[1], reverse=True)
        
        # Deduplicate and return top 4 sentences
        seen = set()
        unique_sentences = []
        for s, score in best_sentences:
            if s.lower() not in seen:
                seen.add(s.lower())
                unique_sentences.append(s)
                if len(unique_sentences) >= 4:
                    break
                    
        if unique_sentences:
            bullets = "\n".join(f"• {s}" for s in unique_sentences)
            return (
                f"[Offline Local RAG] Here are the relevant excerpts retrieved from the paper that answer your question:\n\n"
                f"{bullets}\n\n"
                f"Note: Synthesized in offline mode due to AI API limit."
            )
        else:
            excerpt = context[:1200] + "..." if len(context) > 1200 else context
            return (
                f"[Offline Local RAG] No direct sentence matches found, but here is the retrieved context from the paper:\n\n"
                f"{excerpt}"
            )