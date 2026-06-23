import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  BookOpen, 
  LogOut, 
  User, 
  FileText,
  Bookmark
} from 'lucide-react';
import axios from 'axios';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecentPapers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/api/papers');
      setPapers(res.data || []);
    } catch (err) {
      console.error('Failed to load papers in sidebar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch papers when sidebar mounts or location changes (so new uploads are reflected)
    fetchRecentPapers();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('researchiq_token');
    localStorage.removeItem('researchiq_username');
    navigate('/login');
  };

  const username = localStorage.getItem('researchiq_username') || 'Student';

  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-50 flex items-center space-x-3 bg-slate-50/20">
        <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/20 border border-orange-550 transition-transform duration-300 hover:scale-105">
          IQ
        </div>
        <div>
          <h1 className="font-extrabold text-slate-805 text-lg leading-none tracking-tight">ResearchIQ</h1>
          <span className="text-[10px] text-orange-500 font-extrabold uppercase tracking-widest block mt-0.5">Academic AI Copilot</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest px-3 mb-3 block">
          Menu
        </div>
        
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10 border border-orange-550'
                : 'text-slate-600 hover:bg-slate-50/70 hover:text-slate-900'
            }`
          }
        >
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/upload"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10 border border-orange-550'
                : 'text-slate-600 hover:bg-slate-50/70 hover:text-slate-900'
            }`
          }
        >
          <UploadCloud size={16} />
          <span>Upload Paper</span>
        </NavLink>

        {/* Dynamic Papers Section */}
        <div className="pt-6">
          <div className="flex items-center justify-between px-3 mb-3">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
              Recent Papers
            </span>
            <Bookmark size={11} className="text-slate-400" />
          </div>
          
          <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
            {loading && papers.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 flex items-center space-x-2">
                <div className="w-3 h-3 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
                <span className="font-semibold uppercase tracking-wider text-[9px]">Syncing library...</span>
              </div>
            ) : papers.length === 0 ? (
              <div className="px-3 py-3.5 rounded-2xl border border-dashed border-slate-100 text-center bg-slate-50/20">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">No uploads</p>
              </div>
            ) : (
              papers.slice(0, 8).map((paper) => {
                const isSelected = location.pathname.includes(`/papers/${paper.id}`);
                return (
                  <NavLink
                    key={paper.id}
                    to={`/papers/${paper.id}`}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer truncate border ${
                      isSelected
                        ? 'bg-orange-50/80 border-orange-100/50 text-orange-600'
                        : 'border-transparent text-slate-600 hover:bg-slate-50/70 hover:text-slate-900'
                    }`}
                    title={paper.title}
                  >
                    <FileText size={13} className={isSelected ? 'text-orange-500' : 'text-slate-400'} />
                    <span className="truncate flex-1">{paper.title}</span>
                  </NavLink>
                );
              })
            )}
          </div>
        </div>
      </nav>

      {/* User Session Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0 shadow-sm">
              <User size={16} />
            </div>
            <div className="truncate">
              <p className="text-xs font-extrabold text-slate-800 truncate leading-tight">{username}</p>
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block mt-0.5">Academic User</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 border border-transparent hover:border-orange-100 rounded-xl transition-all duration-150 cursor-pointer"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
