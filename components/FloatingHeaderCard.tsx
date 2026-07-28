import React from 'react';

interface FloatingHeaderCardProps {
    children: React.ReactNode;
    className?: string;
}

const FloatingHeaderCard: React.FC<FloatingHeaderCardProps> = ({ children, className = '' }) => {
    return (
        <div className="sticky top-0 z-30 bg-gray-50 dark:bg-[#09120E] pt-4 pb-2 transition-colors duration-300 w-full flex-none no-print">
            <div className={`bg-gradient-to-br from-[#E6F3EE] to-[#F2F9F6]/80 dark:bg-gradient-to-br dark:from-[#12231A] dark:to-[#0C1A13]/90 p-4 sm:p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-emerald-200/60 dark:border-[#1E382B] flex flex-col gap-3 sm:gap-4 transition-all duration-300 ${className}`}>
                {children}
            </div>
        </div>
    );
};

export default FloatingHeaderCard;
