import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  MessageSquare, 
  BookOpen, 
  Upload, 
  Trash2, 
  Clock, 
  ArrowRight,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_papers: 0, total_summaries: 0, total_questions: 0 });
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      // Parallel fetches for stats and papers list
      const [statsRes, papersRes] = await Promise.all([
        axios.get('http://localhost:8000/api/stats'),
        axios.get('http://localhost:8000/api/papers')
      ]);
      setStats(statsRes.data || { total_papers: 0, total_summaries: 0, total_questions: 0 });
      setPapers(papersRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      setError('Could not connect to the API server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeletePaper = async (paperId, e) => {
    e.preventDefault(); // Stop row clicks or links
    if (!window.confirm('Are you sure you want to delete this research paper? This will remove all associated summaries, flashcards, vector indices, and chat histories.')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/papers/${paperId}`);
      // Refresh list
      fetchDashboardData();
    } catch (err) {
      console.error('Error deleting paper:', err);
      alert('Failed to delete research paper.');
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb > 1024) {
      return `${(kb / 1024).toFixed(1)} MB`;
    }
    return `${kb.toFixed(0)} KB`;
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Welcome to ResearchIQ</h1>
          <p className="text-slate-400 text-xs md:text-sm font-medium">Accelerate your learning. Upload papers, generate summary dashboards, study flashcards, and run RAG chats.</p>
        </div>
        <Link
          to="/upload"
          className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 active:scale-95 transition-all duration-150 cursor-pointer text-sm shrink-0"
        >
          <Upload size={16} />
          <span>Upload Paper</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-700 text-sm font-semibold flex items-center space-x-2">
          <TrendingUp size={16} className="text-orange-500 animate-pulse" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">Total Papers Uploaded</span>
            <h3 className="text-3xl font-black text-slate-800">
              {loading ? <div className="w-8 h-8 bg-slate-100 animate-pulse rounded-md"></div> : stats.total_papers}
            </h3>
            <span className="text-[10px] text-orange-500 font-extrabold uppercase tracking-wider flex items-center gap-1 pt-1">
              <TrendingUp size={11} /> Local JSON storage
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100/50 text-orange-500 flex items-center justify-center">
            <FileText size={20} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">Summaries Generated</span>
            <h3 className="text-3xl font-black text-slate-800">
              {loading ? <div className="w-8 h-8 bg-slate-100 animate-pulse rounded-md"></div> : stats.total_summaries}
            </h3>
            <span className="text-[10px] text-orange-500 font-extrabold uppercase tracking-wider flex items-center gap-1 pt-1">
              <BrainCircuit size={11} /> Detailed Summaries
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100/50 text-orange-500 flex items-center justify-center">
            <BookOpen size={20} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">Questions Answered</span>
            <h3 className="text-3xl font-black text-slate-800">
              {loading ? <div className="w-8 h-8 bg-slate-100 animate-pulse rounded-md"></div> : stats.total_questions}
            </h3>
            <span className="text-[10px] text-orange-500 font-extrabold uppercase tracking-wider flex items-center gap-1 pt-1">
              <MessageSquare size={11} /> FAISS Vector Index
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100/50 text-orange-500 flex items-center justify-center">
            <MessageSquare size={20} />
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          to="/upload" 
          className="group bg-white p-6 rounded-3xl border border-slate-100 hover:border-orange-200 shadow-sm hover:shadow-md transition-all duration-300 flex items-start space-x-4 hover:-translate-y-0.5"
        >
          <div className="p-3.5 bg-orange-50 group-hover:bg-orange-500 rounded-2xl text-orange-500 group-hover:text-white transition-colors duration-200 shadow-sm">
            <Upload size={22} />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="font-extrabold text-slate-800 group-hover:text-orange-600 transition-colors duration-200 text-base md:text-lg">Upload a New Paper</h4>
            <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed">Drop a new PDF here to extract textual content and index using LangChain FAISS.</p>
            <div className="text-xs text-orange-500 font-extrabold flex items-center space-x-1 pt-2">
              <span>Start uploading</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start space-x-4 transition-all duration-300 hover:shadow-md">
          <div className="p-3.5 bg-orange-50 rounded-2xl text-orange-500 shadow-sm">
            <MessageSquare size={22} />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="font-extrabold text-slate-800 text-base md:text-lg">Explore Paper Analysis</h4>
            <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed">Select any paper from the sidebar history or recent uploads list to view summaries, flashcards, and use Q&A.</p>
            <span className="text-[10px] text-slate-400 block pt-2 font-extrabold uppercase tracking-wider">Click on a document below to open it</span>
          </div>
        </div>
      </div>

      {/* Recent Uploads Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
          <h3 className="font-extrabold text-slate-800 text-base md:text-lg flex items-center gap-2">
            <Clock size={18} className="text-orange-500" />
            <span>Recent Uploads</span>
          </h3>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">{papers.length} total papers</span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Loading library records...</p>
          </div>
        ) : papers.length === 0 ? (
          <div className="p-16 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-50 rounded-3xl border border-slate-100/50 flex items-center justify-center text-slate-355 mx-auto mb-4">
              <FileText size={30} />
            </div>
            <p className="text-slate-700 font-extrabold text-base md:text-lg">Your library is empty</p>
            <p className="text-slate-400 text-xs md:text-sm mt-1.5 mb-6 font-medium leading-relaxed">Upload your first research paper to get started with AI study aids.</p>
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Upload size={14} />
              <span>Upload PDF</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30 border-b border-slate-100 text-slate-450 font-extrabold text-[10px] uppercase tracking-wider">
                  <th className="py-4.5 px-6">Paper Title / Name</th>
                  <th className="py-4.5 px-6">Upload Date</th>
                  <th className="py-4.5 px-6">File Size</th>
                  <th className="py-4.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 text-xs md:text-sm font-semibold">
                {papers.map((paper) => (
                  <tr 
                    key={paper.id} 
                    className="hover:bg-slate-55 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/papers/${paper.id}`)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-start space-x-3 max-w-md">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100/50 text-orange-500 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-800 group-hover:text-orange-600 transition-colors line-clamp-1 text-xs md:text-sm">{paper.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{paper.file_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs font-medium">
                      {formatDate(paper.upload_date)}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-mono text-[11px] font-medium">
                      {formatSize(paper.file_size)}
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/papers/${paper.id}`}
                          className="px-3.5 py-1.5 border border-slate-100 hover:border-orange-200 text-slate-600 hover:text-orange-600 rounded-xl text-[10px] font-extrabold hover:bg-orange-50/50 transition-all uppercase tracking-wider"
                        >
                          Analyze
                        </Link>
                        <button
                          onClick={(e) => handleDeletePaper(paper.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Paper"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
