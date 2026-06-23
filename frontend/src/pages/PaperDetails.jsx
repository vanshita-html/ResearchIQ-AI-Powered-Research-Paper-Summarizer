import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  BrainCircuit, 
  HelpCircle, 
  MessageSquare, 
  FileText, 
  Trash2,
  Calendar,
  Layers
} from 'lucide-react';
import axios from 'axios';

// Import Tabs
import SummaryTab from './SummaryTab';
import FlashcardsTab from './FlashcardsTab';
import VivaQuestionsTab from './VivaQuestionsTab';
import QAAssistantTab from './QAAssistantTab';
import LoadingSpinner from '../components/LoadingSpinner';

const PaperDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('summary');
  const [paperData, setPaperData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPaperDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`http://localhost:8000/api/papers/${id}`);
      setPaperData(res.data);
    } catch (err) {
      console.error('Failed to load paper details:', err);
      setError('Paper details could not be retrieved. Please check if the paper exists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaperDetails();
  }, [id]);

  const handleDeletePaper = async () => {
    if (!window.confirm('Are you sure you want to delete this research paper? This will remove all associated summaries, flashcards, vector indices, and chat histories.')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/papers/${id}`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting paper:', err);
      alert('Failed to delete research paper.');
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <LoadingSpinner message="Parsing paper database records..." />
      </div>
    );
  }

  if (error || !paperData) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center mt-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mx-auto mb-4">
          <Layers size={32} />
        </div>
        <h3 className="font-bold text-slate-800 text-lg">Failed to Load Paper</h3>
        <p className="text-slate-400 text-sm mt-1 mb-6">{error || 'Paper details not found.'}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  const { metadata } = paperData;

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const tabs = [
    { id: 'summary', name: 'Summary & Topics', icon: BookOpen },
    { id: 'flashcards', name: 'Flashcards', icon: BrainCircuit },
    { id: 'viva', name: 'Viva Preparation', icon: HelpCircle },
    { id: 'qa', name: 'RAG Q&A Assistant', icon: MessageSquare }
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm gap-4">
        <div className="space-y-2 max-w-3xl">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-400 hover:text-orange-500 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            <span>Back to library</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-800 leading-tight" title={metadata.title}>
            {metadata.title}
          </h1>
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <FileText size={14} className="text-orange-500" />
              <span className="truncate max-w-[200px]" title={metadata.file_name}>{metadata.file_name}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              <span>Uploaded {formatDate(metadata.upload_date)}</span>
            </span>
            {metadata.file_size && (
              <span className="bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded text-[10px]">
                {formatSize(metadata.file_size)}
              </span>
            )}
          </div>
        </div>

        {/* Delete Paper Action */}
        <button
          onClick={handleDeletePaper}
          className="flex items-center space-x-2 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 hover:border-red-200 transition-all duration-150 active:scale-95 flex-shrink-0"
        >
          <Trash2 size={14} />
          <span>Delete Paper</span>
        </button>
      </div>

      {/* Tab Selector Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-3.5 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'border-orange-500 text-orange-500 bg-orange-500/5 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
              }`}
            >
              <Icon size={16} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab View Container */}
      <div className="mt-6">
        {activeTab === 'summary' && (
          <SummaryTab data={paperData.summary} />
        )}
        {activeTab === 'flashcards' && (
          <FlashcardsTab data={paperData.flashcards} />
        )}
        {activeTab === 'viva' && (
          <VivaQuestionsTab data={paperData.viva_questions} keywords={paperData.summary?.keywords} />
        )}
        {activeTab === 'qa' && (
          <QAAssistantTab paperId={id} />
        )}
      </div>
    </div>
  );
};

export default PaperDetails;
