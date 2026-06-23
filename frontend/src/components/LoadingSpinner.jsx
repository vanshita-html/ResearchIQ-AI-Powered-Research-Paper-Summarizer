import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', fullPage = false }) => {
  const spinnerContent = (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="relative flex items-center justify-center w-16 h-16 mb-4">
        {/* Outer Ring */}
        <div className="absolute w-full h-full border-4 border-orange-100 rounded-full"></div>
        {/* Spinning Segment */}
        <div className="absolute w-full h-full border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
        {/* Inner Pulsing Circle */}
        <div className="w-8 h-8 bg-orange-500/10 rounded-full animate-pulse flex items-center justify-center">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
        </div>
      </div>
      <p className="text-slate-600 font-medium text-lg animate-pulse">{message}</p>
      <p className="text-slate-400 text-sm mt-1">This might take a moment for large papers</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-sm">
          {spinnerContent}
        </div>
      </div>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;
