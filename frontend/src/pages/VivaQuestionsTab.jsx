import React, { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Search, 
  Sparkles, 
  SlidersHorizontal,
  Copy,
  Check
} from 'lucide-react';

const highlightKeywords = (text, keywords = []) => {
  if (!text || !keywords || keywords.length === 0) return text;
  
  const escapedKeywords = keywords
    .map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter(kw => kw.length > 2);
    
  if (escapedKeywords.length === 0) return text;
  
  const regex = new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    const isKeyword = keywords.some(kw => kw.toLowerCase() === part.toLowerCase());
    if (isKeyword) {
      return (
        <mark key={index} className="bg-orange-50 text-orange-600 px-1 py-0.5 rounded font-semibold border border-orange-100/50">
          {part}
        </mark>
      );
    }
    return part;
  });
};

const getDifficulty = (idx) => {
  const mod = idx % 3;
  if (mod === 0) {
    return { label: 'Easy', classes: 'bg-emerald-50/70 border-emerald-100 text-emerald-600' };
  }
  if (mod === 1) {
    return { label: 'Medium', classes: 'bg-amber-50/70 border-amber-100 text-amber-600' };
  }
  return { label: 'Hard', classes: 'bg-rose-50/70 border-rose-100 text-rose-600' };
};

const AccordionItem = ({ question, answer, index, defaultOpen, keywords = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const active = defaultOpen || isOpen;
  const diff = getDifficulty(index);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow ${
      active 
        ? 'border-orange-200 ring-4 ring-orange-500/5' 
        : 'border-slate-100 hover:border-orange-100'
    }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 text-left flex items-start justify-between gap-4 focus:outline-none cursor-pointer hover:bg-slate-50/30 transition-colors"
      >
        <div className="flex items-start space-x-4">
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 transition-colors duration-200 ${
            active 
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
              : 'bg-orange-50 text-orange-500'
          }`}>
            Q{index + 1}
          </span>
          <div className="space-y-1.5">
            <h4 className="font-extrabold text-slate-850 text-sm md:text-[15px] leading-relaxed pr-2">
              {question}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase block">
                Viva Interview Question
              </span>
              <span className={`px-2 py-0.5 border rounded text-[8px] font-extrabold uppercase tracking-wider ${diff.classes}`}>
                {diff.label}
              </span>
            </div>
          </div>
        </div>
        <span className={`text-slate-400 mt-1 flex-shrink-0 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center hover:bg-orange-50 hover:text-orange-500 transition-colors ${
          active ? 'bg-orange-50 text-orange-500' : ''
        }`}>
          {active ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Accordion Panel Body (CSS Grid Smooth Height Transition) */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          active ? 'grid-rows-[1fr] opacity-100 border-t border-slate-50' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-5 bg-slate-50/20 text-slate-600 text-sm leading-relaxed">
            <div className="flex items-start space-x-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-inner">
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle size={13} />
              </div>
              <div className="space-y-2.5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest block">
                    Suggested Exam Answer
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 px-2.5 py-1 border border-slate-100 hover:border-orange-100 rounded-lg text-[10px] font-extrabold text-slate-400 hover:text-orange-500 bg-slate-50 hover:bg-orange-50/50 transition-all cursor-pointer"
                    title="Copy suggested response"
                  >
                    {copied ? <Check size={11} className="text-emerald-550" /> : <Copy size={11} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="font-semibold text-slate-700 text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {highlightKeywords(answer, keywords)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VivaQuestionsTab = ({ data = [], keywords = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandAll, setExpandAll] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
          <HelpCircle size={32} />
        </div>
        <p className="text-slate-500 font-medium">No viva prep questions available for this paper.</p>
      </div>
    );
  }

  const filteredQuestions = data.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-white p-5 px-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center space-x-3.5 w-full xl:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm md:text-base">Viva Voce Mock Preparation</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Prepare for research defenses and project reviews with structured Q&A.</p>
          </div>
        </div>

        {/* Search and Expand all bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search mock questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-100 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all focus:bg-white"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setExpandAll(!expandAll)}
              className="flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-650 hover:text-orange-500 bg-slate-50 hover:bg-orange-50/50 border border-slate-100 hover:border-orange-100 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer w-full sm:w-auto font-extrabold"
            >
              <SlidersHorizontal size={12} />
              <span>{expandAll ? 'Collapse All' : 'Expand All'}</span>
            </button>

            <span className="text-xs bg-orange-50 text-orange-600 font-extrabold px-3 py-2 rounded-xl border border-orange-100 flex items-center justify-center whitespace-nowrap">
              {filteredQuestions.length} Questions
            </span>
          </div>
        </div>
      </div>

      {/* Questions Accordions list */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
          <p className="text-slate-400 font-medium">No viva questions match your search query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((item, index) => (
            <AccordionItem
              key={index}
              question={item.question}
              answer={item.answer}
              index={index}
              defaultOpen={expandAll}
              keywords={keywords}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VivaQuestionsTab;
