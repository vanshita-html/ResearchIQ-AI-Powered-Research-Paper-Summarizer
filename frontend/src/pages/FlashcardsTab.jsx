import React, { useState, useEffect, useRef } from 'react';
import { 
  HelpCircle, 
  RefreshCw, 
  Eye, 
  Search, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';

const Flashcard = ({ question, answer, index, total, forceFlip }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardHeight, setCardHeight] = useState(250);

  const frontRef = useRef(null);
  const backRef = useRef(null);

  // If forceFlip is active, show the answer, otherwise respect local state
  const flipped = forceFlip || isFlipped;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const measureHeight = () => {
    const frontH = frontRef.current ? frontRef.current.scrollHeight : 0;
    const backH = backRef.current ? backRef.current.scrollHeight : 0;
    setCardHeight(Math.max(250, frontH, backH));
  };

  useEffect(() => {
    measureHeight();
    const timer = setTimeout(measureHeight, 100);
    return () => clearTimeout(timer);
  }, [question, answer]);

  useEffect(() => {
    window.addEventListener('resize', measureHeight);
    return () => window.removeEventListener('resize', measureHeight);
  }, []);

  return (
    <>
      <div
        onClick={handleFlip}
        style={{ height: `${cardHeight}px` }}
        className="w-full cursor-pointer flashcard-container group relative transition-all duration-300"
      >
        <div className={`flashcard-inner ${flipped ? 'flashcard-flipped' : ''}`}>
          
          {/* Front of Card (Question) */}
          <div className="flashcard-front bg-white border border-slate-100 group-hover:border-orange-300 rounded-3xl p-6 shadow-sm group-hover:shadow-md transition-all duration-300">
            <div ref={frontRef} className="flex-1 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <span className="bg-orange-50 border border-orange-100/50 text-orange-600 font-extrabold text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  Card {index + 1} of {total}
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-orange-500 group-hover:bg-orange-50 transition-colors duration-200">
                  <HelpCircle size={16} />
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center my-4">
                <p className="text-slate-850 font-extrabold text-sm md:text-base text-center leading-relaxed px-1">
                  {question}
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider pt-2 border-t border-slate-50">
                <span className="flex items-center gap-1 font-extrabold text-slate-400">
                  <Sparkles size={10} className="text-orange-500" /> Question
                </span>
                <span className="flex items-center gap-1 text-slate-400 group-hover:text-orange-500 transition-colors font-extrabold">
                  <RefreshCw size={10} className="animate-spin-slow" /> Click to Flip
                </span>
              </div>
            </div>
          </div>

          {/* Back of Card (Answer) */}
          <div className="flashcard-back bg-gradient-to-br from-orange-500 to-amber-600 border border-orange-600 rounded-3xl p-6 shadow-lg text-white">
            <div ref={backRef} className="flex-1 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <span className="bg-white/10 text-orange-100 font-extrabold text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  Card {index + 1} of {total} • Answer
                </span>
                <div className="flex space-x-1.5">
                  <button
                    onClick={handleCopy}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-orange-100 hover:text-white transition-colors cursor-pointer"
                    title="Copy Answer"
                  >
                    {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                  </button>
                  {answer && answer.length > 150 && (
                    <button
                      onClick={handleOpenModal}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-orange-100 hover:text-white transition-colors cursor-pointer"
                      title="View Full Answer"
                    >
                      <ExternalLink size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center my-4 pr-1 overflow-hidden">
                <p className="font-semibold text-xs md:text-sm text-center leading-relaxed px-1 text-orange-50 whitespace-pre-wrap break-words w-full">
                  {answer}
                </p>
                {answer && answer.length > 150 && (
                  <button
                    onClick={handleOpenModal}
                    className="mt-3.5 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/25 rounded-xl text-[10px] font-bold text-white tracking-wide uppercase transition-all duration-150 cursor-pointer"
                  >
                    View Full Answer
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center text-[10px] text-orange-200 font-semibold uppercase tracking-wider pt-2 border-t border-white/10">
                <span>Explanation</span>
                <span className="flex items-center gap-1 text-white font-extrabold">
                  <RefreshCw size={10} /> Flip Back
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                  Card {index + 1} of {total} Answer Detail
                </h4>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto text-slate-650 text-sm md:text-[15px] leading-relaxed font-medium space-y-4 max-h-[50vh] custom-scrollbar">
              <div>
                <p className="font-extrabold text-slate-450 text-[10px] uppercase tracking-widest border-b border-slate-50 pb-1.5 mb-2">Question</p>
                <p className="text-slate-800 font-extrabold text-sm md:text-base">{question}</p>
              </div>
              
              <div>
                <p className="font-extrabold text-slate-450 text-[10px] uppercase tracking-widest border-b border-slate-50 pb-1.5 mb-2">Detailed Answer</p>
                <p className="text-slate-700 leading-8 whitespace-pre-wrap">{answer}</p>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-3">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-2 text-xs font-bold text-slate-650 hover:text-orange-500 bg-white hover:bg-slate-50 border border-slate-250 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? 'Copied!' : 'Copy Answer'}</span>
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const FlashcardsTab = ({ data = [] }) => {
  const [forceFlipAll, setForceFlipAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
          <HelpCircle size={32} />
        </div>
        <p className="text-slate-500 font-medium">No study flashcards available for this document.</p>
      </div>
    );
  }

  // Filter flashcards by search query
  const filteredCards = data.filter(
    (card) =>
      card.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Utility Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-5 px-6 rounded-3xl border border-slate-100 shadow-sm">
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search questions & answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-100 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all focus:bg-white"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => setForceFlipAll(!forceFlipAll)}
            className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-orange-500 bg-slate-50 hover:bg-orange-50/50 border border-slate-100 hover:border-orange-100 px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer font-extrabold"
          >
            <RefreshCw size={13} className={forceFlipAll ? 'animate-spin-slow text-orange-500' : ''} />
            <span>{forceFlipAll ? 'Reset Flip States' : 'Reveal All Answers'}</span>
          </button>
          
          <span className="text-xs bg-orange-50 text-orange-600 font-extrabold px-3 py-2 rounded-xl border border-orange-100 whitespace-nowrap">
            {filteredCards.length} of {data.length} Flashcards
          </span>
        </div>
      </div>

      {/* Grid of Flashcards */}
      {filteredCards.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
          <p className="text-slate-400 font-medium">No flashcards matches your search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card, index) => (
            <Flashcard
              key={index}
              question={card.question}
              answer={card.answer}
              index={index}
              total={filteredCards.length}
              forceFlip={forceFlipAll}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardsTab;
