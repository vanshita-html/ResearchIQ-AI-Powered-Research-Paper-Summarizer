import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const UploadPaper = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('Uploading PDF...');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Rotate pipeline steps for high-fidelity UX during backend generation
  useEffect(() => {
    let interval;
    if (loading) {
      const messages = [
        'Uploading PDF to local storage...',
        'Extracting document text using PyMuPDF...',
        'Extracting academic title and key topics...',
        'Generating short and detailed summaries via Google Gemini...',
        'Compiling 10-15 study flashcards...',
        'Generating academic viva interview questions...',
        'Splitting document chunks & building FAISS vector store...',
        'Finalizing database indexing...'
      ];
      let step = 0;
      setProgressMsg(messages[0]);
      
      interval = setInterval(() => {
        if (step < messages.length - 1) {
          step++;
          setProgressMsg(messages[step]);
        }
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError('');

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      setFile(null);
      return;
    }
    // Limit file size to 25MB for local dev
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size exceeds 25MB limit.');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:8000/api/papers/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(`/papers/${res.data.id}`);
      }, 1500);
    } catch (err) {
      console.error('Upload failed:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Server communication failure. Please verify the backend is running.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center md:text-left bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Upload Research Paper</h1>
        <p className="text-slate-400 text-xs md:text-sm font-medium mt-1">
          Upload any academic paper in PDF format. We will parse it, generate summary dashboards, flashcards, mock viva Q&A, and prepare a RAG vector index.
        </p>
      </div>

      {loading && (
        <LoadingSpinner message={progressMsg} fullPage={true} />
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 transition-all duration-300 hover:shadow-md">
        {error && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start space-x-3 text-orange-700 text-xs md:text-sm font-semibold">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50/70 border border-green-150 rounded-2xl flex items-start space-x-3 text-green-700 text-xs md:text-sm font-semibold">
            <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>Paper processed successfully! Redirecting to dashboard details...</span>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-6">
          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
              dragActive 
                ? 'border-orange-500 bg-orange-50/20 shadow-inner' 
                : 'border-slate-200 hover:border-orange-400 bg-slate-50/30 hover:bg-slate-50/50 hover:shadow-sm'
            }`}
            onClick={() => document.getElementById('pdf-input').click()}
          >
            <input
              id="pdf-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 mb-4 transition-colors duration-200 group-hover:border-orange-200">
              <UploadCloud size={28} className="text-orange-500" />
            </div>

            <p className="font-extrabold text-slate-700 text-sm md:text-base text-center">
              Drag and drop your PDF here, or <span className="text-orange-500">browse files</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-2 text-center font-semibold uppercase tracking-wider">
              Only standard PDF files are supported (Max 25MB)
            </p>

            {file && (
              <div 
                className="absolute inset-0 bg-white rounded-3xl p-6 flex flex-col items-center justify-center border border-orange-200 shadow-sm z-10 animate-fade-in" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 mb-3 border border-orange-100/50">
                  <File size={22} />
                </div>
                <p className="font-extrabold text-slate-800 text-sm max-w-xs truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="mt-4 text-xs font-extrabold text-orange-500 hover:text-orange-600 underline uppercase tracking-wider cursor-pointer"
                >
                  Remove file
                </button>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-750 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || loading || success}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 transition-all cursor-pointer"
            >
              Process Paper
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadPaper;
