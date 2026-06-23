import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, User, BookOpen, AlertCircle } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:8000/api/auth/login', {
        username,
        password
      });

      if (res.data.token) {
        localStorage.setItem('researchiq_token', res.data.token);
        localStorage.setItem('researchiq_username', res.data.user.username);
        navigate('/dashboard');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Could not connect to backend server. Make sure FastAPI is running on port 8000.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium background decorative gradients */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[550px] h-[550px] bg-orange-50/60 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-orange-500/5 p-8 md:p-10 relative z-10 animate-fade-in">
        
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30 mb-4 border border-orange-655 transition-transform duration-350 hover:rotate-12 cursor-default">
            <BookOpen size={26} />
          </div>
          <h2 className="text-2xl font-black text-slate-805 tracking-tight">Welcome to ResearchIQ</h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1 text-center font-medium">AI-Powered Research Paper Summarizer & RAG Q&A</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start space-x-3 text-orange-700 text-xs md:text-sm font-semibold animate-shake">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                <User size={16} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="student"
                className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all duration-200 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                <KeyRound size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-800 placeholder-slate-455 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all duration-200 font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-2 mt-2 cursor-pointer text-xs md:text-sm uppercase tracking-wider"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Notice */}
        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
            Demo Credentials:{' '}
            <span className="text-orange-500">student</span> /{' '}
            <span className="text-orange-500">student123</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
