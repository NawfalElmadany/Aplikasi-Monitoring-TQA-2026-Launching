import React from 'react';

const PageLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-8 space-y-4 animate-in fade-in duration-200">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-200 dark:border-emerald-950 opacity-30"></div>
        <div className="absolute inset-0 rounded-full border-4 border-emerald-600 dark:border-emerald-400 border-t-transparent animate-spin"></div>
      </div>
      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 animate-pulse">
        Memuat halaman...
      </p>
    </div>
  );
};

export default PageLoader;
