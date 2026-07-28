import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    gradient: string;
    onClick?: () => void;
    footer?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, gradient, onClick, footer }) => {
    return (
        <div
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${onClick ? 'cursor-pointer' : ''} ${gradient}`}
        >
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white dark:bg-dark-card/20 rounded-xl backdrop-blur-sm">
                        <Icon size={24} className="text-white" />
                    </div>
                    {onClick && (
                        <div className="px-3 py-1 bg-white dark:bg-dark-card/20 rounded-full text-xs font-medium backdrop-blur-sm">
                            Detail
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <h3 className="text-indigo-100 text-sm font-medium">{title}</h3>
                    <p className="text-3xl font-bold tracking-tight">{value}</p>
                </div>

                {footer && (
                    <div className="mt-4 pt-4 border-t border-white/10 text-xs text-indigo-100 flex items-center gap-2">
                        {footer}
                    </div>
                )}
            </div>

            {/* Decorative Background Circles */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white dark:bg-dark-card/10 rounded-full blur-2xl"></div>
            <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
        </div>
    );
};

export default StatCard;
