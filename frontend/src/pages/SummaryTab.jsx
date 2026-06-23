import React, { useState } from 'react';
import { 
  AlignLeft, 
  FileText, 
  Hash, 
  Sparkles, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Cpu, 
  TrendingUp, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const highlightKeywords = (text, keywords = []) => {
  if (!text || !keywords || keywords.length === 0) return text;
  
  // Escape regex special chars in keywords and filter short words to avoid matching single letters
  const escapedKeywords = keywords
    .map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter(kw => kw.length > 2);
    
  if (escapedKeywords.length === 0) return text;
  
  // Case-insensitive match on word boundaries
  const regex = new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    const isKeyword = keywords.some(kw => kw.toLowerCase() === part.toLowerCase());
    if (isKeyword) {
      return (
        <mark key={index} className="bg-orange-50/80 text-orange-600 px-1 py-0.5 rounded font-semibold border border-orange-100/50">
          {part}
        </mark>
      );
    }
    return part;
  });
};

const parseDetailedSummary = (text) => {
  if (!text) return [];
  const lines = text.split('\n');
  const sections = [];
  let currentSection = null;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match markdown heading (up to h6)
    const headingMatch = trimmed.match(/^(#{1,6})\s*(.*)$/);
    if (headingMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: headingMatch[2].replace(/[#*`]/g, '').trim(),
        level: headingMatch[1].length,
        content: []
      };
    } else {
      if (!currentSection) {
        currentSection = {
          title: "Overview & Introduction",
          level: 3,
          content: []
        };
      }
      // Remove inline bold/italics symbols for clean look
      const cleanLine = trimmed.replace(/\*\*|__|\*|_/g, '');
      currentSection.content.push(cleanLine);
    }
  }
  if (currentSection) {
    sections.push(currentSection);
  }
  return sections;
};

const getSectionIcon = (title) => {
  const lower = title.toLowerCase();
  if (lower.includes('overview') || lower.includes('introduction') || lower.includes('background') || lower.includes('motivation')) {
    return <BookOpen className="text-orange-500" size={18} />;
  }
  if (lower.includes('method') || lower.includes('proposed') || lower.includes('architecture') || lower.includes('system') || lower.includes('model')) {
    return <Cpu className="text-orange-500" size={18} />;
  }
  if (lower.includes('result') || lower.includes('evaluation') || lower.includes('discussion') || lower.includes('experiment') || lower.includes('validation')) {
    return <TrendingUp className="text-orange-500" size={18} />;
  }
  if (lower.includes('conclusion') || lower.includes('future') || lower.includes('scope') || lower.includes('summary')) {
    return <CheckCircle className="text-orange-500" size={18} />;
  }
  return <FileText className="text-orange-500" size={18} />;
};

const DetailedSectionCard = ({ section, keywords }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${
      isOpen ? 'border-slate-100' : 'border-slate-100 hover:border-orange-100'
    }`}>
      {/* Card Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 px-5 text-left flex items-center justify-between gap-4 focus:outline-none cursor-pointer hover:bg-slate-50/40 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
            {getSectionIcon(section.title)}
          </div>
          <h4 className="font-extrabold text-slate-800 text-sm md:text-[15px]">
            {section.title}
          </h4>
        </div>
        <span className={`text-slate-400 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center hover:bg-orange-50 hover:text-orange-500 transition-colors ${
          isOpen ? 'bg-orange-50/50 text-orange-500' : ''
        }`}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Card Content Accordion */}
      <div className={`grid transition-all duration-300 ease-in-out ${
        isOpen ? 'grid-rows-[1fr] opacity-100 border-t border-slate-50' : 'grid-rows-[0fr] opacity-0'
      }`}>
        <div className="overflow-hidden">
          <div className="p-5 px-6 space-y-3 bg-slate-50/20 text-slate-600 text-[13px] md:text-sm leading-relaxed">
            {section.content.map((paragraph, index) => {
              // check if it is a list item
              if (paragraph.startsWith('•') || paragraph.startsWith('-') || paragraph.startsWith('*')) {
                return (
                  <div key={index} className="flex items-start space-x-2 pl-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                    <p className="font-medium text-slate-700 flex-1">
                      {highlightKeywords(paragraph.replace(/^[•\-*]\s*/, ''), keywords)}
                    </p>
                  </div>
                );
              }
              return (
                <p key={index} className="font-medium text-slate-700">
                  {highlightKeywords(paragraph, keywords)}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryTab = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data) return null;

  const { short_summary = '', detailed_summary = '', keywords = [] } = data;

  // Calculate read time based on ~200 wpm
  const wordCount = short_summary ? short_summary.split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const parsedSections = parseDetailedSummary(detailed_summary);

  const shouldTruncate = short_summary.length > 320;
  const displayedAbstract = shouldTruncate && !isExpanded 
    ? short_summary.slice(0, 320) + '...'
    : short_summary;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Short Summary Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
        {/* Header Badge Row */}
        <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-4">
          <div className="flex items-center space-x-2.5">
            <AlignLeft className="text-orange-500" size={20} />
            <h3 className="font-extrabold text-slate-800 text-base md:text-lg">Short Abstract</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-600 rounded-full text-xs font-bold">
              <Sparkles size={11} className="animate-pulse" />
              <span>AI Summary</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-50 border border-slate-100 text-slate-500 rounded-full text-xs font-semibold">
              <Clock size={11} />
              <span>{readTime} min read</span>
            </span>
          </div>
        </div>

        {/* Content Topics Map */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          <span className="px-2.5 py-0.5 bg-orange-50 border border-orange-100/50 text-[10px] text-orange-600 font-extrabold uppercase rounded-lg tracking-wider">Research Objective</span>
          <span className="px-2.5 py-0.5 bg-orange-50 border border-orange-100/50 text-[10px] text-orange-600 font-extrabold uppercase rounded-lg tracking-wider">Methodology</span>
          <span className="px-2.5 py-0.5 bg-orange-50 border border-orange-100/50 text-[10px] text-orange-600 font-extrabold uppercase rounded-lg tracking-wider">Key Findings</span>
        </div>

        {/* Paragraph Text */}
        <div className="max-w-4xl text-slate-700 text-[15px] leading-8 font-medium space-y-4">
          {short_summary ? (
            displayedAbstract.split('\n\n').map((para, index) => (
              <p key={index}>
                {highlightKeywords(para, keywords)}
              </p>
            ))
          ) : (
            <p className="text-slate-400 italic">No abstract generated for this paper.</p>
          )}
        </div>

        {/* Read More Toggle Button */}
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 flex items-center space-x-1 text-xs font-extrabold text-orange-500 hover:text-orange-600 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <span>{isExpanded ? 'Read Less' : 'Read Full Abstract'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Detailed Analysis Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2.5 px-1 py-1">
          <FileText className="text-orange-500" size={20} />
          <h3 className="font-extrabold text-slate-800 text-base md:text-lg">Detailed Academic Analysis</h3>
        </div>

        {parsedSections.length > 0 ? (
          <div className="space-y-4">
            {parsedSections.map((sec, idx) => (
              <DetailedSectionCard key={idx} section={sec} keywords={keywords} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center text-slate-400 italic text-sm">
            No detailed summary sections generated for this paper.
          </div>
        )}
      </div>

      {/* Keywords Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="flex items-center space-x-2.5 mb-4 border-b border-slate-50 pb-3">
          <Hash className="text-orange-500" size={20} />
          <h3 className="font-extrabold text-slate-800 text-base md:text-lg">Extracted Keywords & Technologies</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.length > 0 ? (
            keywords.map((tag, index) => (
              <span
                key={index}
                className="px-3.5 py-1.5 bg-orange-50/50 hover:bg-orange-50 border border-orange-100/50 text-orange-600 font-extrabold rounded-xl text-xs transition-all duration-150 uppercase tracking-wider cursor-default"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-slate-400 text-xs">No keywords extracted.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryTab;
