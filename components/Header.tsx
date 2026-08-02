import React, { useState, useEffect } from 'react';
import { Menu, Bell, MessageSquare, Trash2, Search, Sun, Moon, RotateCw } from 'lucide-react';
import { User, Student } from '../types';

interface HeaderProps {
    onMenuClick: () => void;
    user: User;
    notifications?: Student[];
    onDismissNotification?: (studentId: string) => void;
    onSearchClick?: () => void; // New prop to trigger search modal
    flat?: boolean;
    title?: string;
    subtitle?: string;
    actionButton?: React.ReactNode;
    backButton?: React.ReactNode; // New prop for back button
    showGreeting?: boolean;
    unreadNotesCount?: number;
    onRefresh?: () => Promise<void>;
    isRefreshing?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
    onMenuClick, 
    user, 
    notifications = [], 
    onDismissNotification, 
    onSearchClick, 
    flat = false, 
    title, 
    subtitle,
    actionButton,
    backButton,
    showGreeting = false,
    unreadNotesCount = 0,
    onRefresh,
    isRefreshing = false
}) => {
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isDark, setIsDark] = useState(() => {
        return document.documentElement.classList.contains('dark');
    });

    useEffect(() => {
        const syncTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        const observer = new MutationObserver(syncTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const toggleTheme = () => {
        const nextDark = !isDark;
        if (nextDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        setIsDark(nextDark);
    };

    const currentDate = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const greetingName = user.name.split(' ')[0].toLowerCase().startsWith('ustadz') && user.name.split(' ').length > 1
        ? `${user.name.split(' ')[0]} ${user.name.split(' ')[1]}`
        : user.name.split(' ')[0];

    return (
        <>
            {/* Mobile Header (Mockup Design Layout) */}
            <div className="md:hidden flex flex-col w-full text-slate-800 dark:text-[#E2EAE5] pb-1">
                {showGreeting ? (
                    // Dashboard Page: 2-Row Stacked Layout
                    <div className="flex flex-col w-full gap-3">
                        {/* Row 1: Greeting & Date (Left) and Profile Avatar (Right) */}
                        <div className="flex items-start justify-between w-full">
                            <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-emerald-800 dark:text-emerald-400 text-[15px] leading-tight">
                                    Hai, <span className="capitalize">{greetingName}</span>
                                </span>
                                <span className="text-slate-400 dark:text-[#8BA398] text-[11px] font-semibold">
                                    {currentDate}
                                </span>
                            </div>
                            
                            <img
                                src={user.avatar}
                                alt="Profile"
                                className="w-10 h-10 rounded-full border-2 border-white dark:border-[#1A2E24] shadow-[0_8px_30px_rgba(0,0,0,0.08)] object-cover shrink-0"
                            />
                        </div>

                        {/* Row 2: Title (Left) and Actions (Right) */}
                        <div className="flex items-center justify-between w-full mt-1">
                            {title && (
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                    {title}
                                </h1>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                {/* Search Button */}
                                {onSearchClick && (
                                    <button
                                        onClick={onSearchClick}
                                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-[#1C3026] border border-slate-100 dark:border-[#1A2E24]/30 shadow-sm text-slate-500 dark:text-[#E2EAE5] hover:bg-slate-50 dark:hover:bg-[#1C3026]/80 active:scale-95 transition-all duration-150"
                                    >
                                        <Search size={16} />
                                    </button>
                                )}

                                {/* Notification Button */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                                        className={`w-9 h-9 flex items-center justify-center rounded-full border shadow-sm active:scale-95 transition-all duration-150 ${
                                            isNotifOpen
                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                                                : 'bg-white dark:bg-[#1C3026] text-slate-500 dark:text-[#E2EAE5] border-slate-100 dark:border-[#1A2E24]/30 hover:bg-slate-50 dark:hover:bg-[#1C3026]/80'
                                        }`}
                                    >
                                        <Bell size={16} />
                                        {((user.role as string) === 'student' || (user.role as string) === 'siswa') ? (
                                            unreadNotesCount > 0 && (
                                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-[#070C09] animate-pulse">
                                                    {unreadNotesCount}
                                                </span>
                                            )
                                        ) : (
                                            notifications.length > 0 && (
                                                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-500 border-2 border-white dark:border-[#121F18] rounded-full"></span>
                                            )
                                        )}
                                    </button>

                                    {/* Notification Dropdown */}
                                    {isNotifOpen && (
                                        <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white dark:bg-[#121F18] rounded-2xl shadow-xl border border-gray-100 dark:border-[#1A2E24] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                                            <div className="bg-gray-50 dark:bg-[#1C3026]/20 p-3 border-b border-gray-100 dark:border-[#1A2E24] flex items-center justify-between">
                                                <h3 className="font-bold text-xs text-gray-800 dark:text-white">Catatan Harian</h3>
                                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                                                    {notifications.length} Baru
                                                </span>
                                            </div>

                                            <div className="max-h-[250px] overflow-y-auto">
                                                {notifications.length > 0 ? (
                                                    notifications.map((student, idx) => (
                                                        <div key={`${student.id}-${idx}`} className="p-3 border-b border-gray-50 dark:border-[#1A2E24]/50 hover:bg-gray-50 dark:hover:bg-[#1C3026]/10 transition-colors group">
                                                            <div className="flex items-start gap-2.5">
                                                                <img
                                                                    src={student.avatar}
                                                                    alt={student.name}
                                                                    className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-[#1A2E24] shrink-0"
                                                                />
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                                                                        <div className="flex items-center gap-1.5 truncate">
                                                                            <span className="font-bold text-xs text-gray-800 dark:text-[#E2EAE5] truncate">{student.name}</span>
                                                                            <span className="text-[9px] font-bold bg-gray-100 dark:bg-[#1C3026] text-gray-500 dark:text-[#8BA398] px-1 rounded">{student.class}</span>
                                                                        </div>
                                                                        {onDismissNotification && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    onDismissNotification(student.id);
                                                                                }}
                                                                                className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                                                                                title="Hapus"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex gap-1.5">
                                                                        <MessageSquare size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                                                                        <p className="text-[11px] text-gray-600 dark:text-[#8BA398] italic line-clamp-2">"{student.notes}"</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-6 text-center text-gray-400 dark:text-[#8BA398]">
                                                        <Bell size={20} className="mx-auto mb-1 opacity-50" />
                                                        <p className="text-xs">Tidak ada catatan hari ini.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sync/Refresh Button */}
                                {onRefresh && (
                                    <button
                                        onClick={onRefresh}
                                        disabled={isRefreshing}
                                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-[#1C3026] border border-slate-100 dark:border-[#1A2E24]/30 shadow-sm text-slate-500 dark:text-[#E2EAE5] hover:bg-slate-50 dark:hover:bg-[#1C3026]/80 active:scale-95 transition-all duration-150 disabled:opacity-50"
                                        title="Sinkronisasi Data"
                                    >
                                        <RotateCw size={16} className={isRefreshing ? "animate-spin text-emerald-600" : ""} />
                                    </button>
                                )}

                                {/* Theme Button */}
                                <button
                                    onClick={toggleTheme}
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-[#1C3026] border border-slate-100 dark:border-[#1A2E24]/30 shadow-sm text-slate-500 dark:text-[#E2EAE5] hover:bg-slate-50 dark:hover:bg-[#1C3026]/80 active:scale-95 transition-all duration-150"
                                >
                                    {isDark ? (
                                        <Moon size={16} className="text-emerald-400 animate-in zoom-in" />
                                    ) : (
                                        <Sun size={16} className="text-amber-500 animate-in zoom-in" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Other Pages: Single Vertically Centered Row
                    <div className="flex items-center justify-between w-full py-1">
                        <div className="flex items-center gap-2">
                            {backButton && backButton}
                            {title && (
                                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                    {title}
                                </h1>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {onSearchClick && (
                                <button
                                    onClick={onSearchClick}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-[#1C3026] border border-slate-100 dark:border-[#1A2E24]/30 shadow-sm text-slate-500 dark:text-[#E2EAE5] hover:bg-slate-50 dark:hover:bg-[#1C3026]/80 active:scale-95 transition-all duration-150"
                                >
                                    <Search size={14} />
                                </button>
                            )}

                            <div className="relative">
                                <button
                                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full border shadow-sm active:scale-95 transition-all duration-150 ${
                                        isNotifOpen
                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                                            : 'bg-white dark:bg-[#1C3026] text-slate-500 dark:text-[#E2EAE5] border-slate-100/50 dark:border-[#1A2E24]/30 hover:bg-slate-50 dark:hover:bg-[#1C3026]/80'
                                    }`}
                                >
                                    <Bell size={14} />
                                </button>
                            </div>

                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    disabled={isRefreshing}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-[#1C3026] border border-slate-100 dark:border-[#1A2E24]/30 shadow-sm text-slate-500 dark:text-[#E2EAE5] hover:bg-slate-50 dark:hover:bg-[#1C3026]/80 active:scale-95 transition-all duration-150 disabled:opacity-50"
                                    title="Sinkronisasi Data"
                                >
                                    <RotateCw size={14} className={isRefreshing ? "animate-spin text-emerald-600" : ""} />
                                </button>
                            )}

                            <button
                                onClick={toggleTheme}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-[#1C3026] border border-slate-100 dark:border-[#1A2E24]/30 shadow-sm text-slate-500 dark:text-[#E2EAE5] hover:bg-slate-50 dark:hover:bg-[#1C3026]/80 active:scale-95 transition-all duration-150"
                            >
                                {isDark ? (
                                    <Moon size={14} className="text-emerald-400" />
                                ) : (
                                    <Sun size={14} className="text-amber-500" />
                                )}
                            </button>

                            {actionButton && actionButton}

                            <img
                                src={user.avatar}
                                alt="Profile"
                                className="w-8 h-8 rounded-full border border-white dark:border-[#1A2E24] shadow-sm ml-1 object-cover shrink-0"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop Header Layout */}
            <header className={flat 
                ? "hidden md:flex flex-col-reverse lg:flex-row lg:items-center justify-between w-full gap-4 lg:gap-0 relative" 
                : "hidden md:flex sticky top-0 z-40 bg-gray-50/95 dark:bg-[#09120E]/95 backdrop-blur-sm pt-4 sm:pt-6 pb-4 -mt-4 sm:-mt-8 -mx-4 sm:-mx-8 px-4 sm:px-8 border-b border-slate-100 dark:border-[#1A2E24] flex-col-reverse lg:flex-row lg:items-center justify-between gap-4 lg:gap-0 mb-6 transition-all duration-200"
            }>
                {/* Baris Bawah di Mobile / Baris Kiri di Desktop (Grup Teks Konten) */}
                <div className="flex flex-col gap-1 w-full lg:flex-1">
                    {backButton && (
                        <div className="flex items-center mb-1 animate-in fade-in duration-200">
                            {backButton}
                        </div>
                    )}
                    {showGreeting && (
                        <>
                            <div className="hidden md:block">
                                <div className="flex flex-wrap items-center gap-2 text-sm text-emerald-500">
                                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                        Assalamualaikum, <span className="capitalize">
                                            {greetingName}
                                        </span>
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-400 font-medium">{currentDate}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Title & Subtitle */}
                    {title && (
                        <h1 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight leading-none mt-1">
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <p className="hidden sm:block text-sm text-slate-500 dark:text-[#8BA398] leading-normal mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Baris Atas di Mobile / Baris Kanan di Desktop (Navigasi & Ikon) */}
                <div className="flex justify-between items-center w-full lg:w-auto lg:justify-end gap-4 relative mt-12 md:mt-0">
                    {/* Tombol Menu Hamburger */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-lg bg-white dark:bg-[#121F18] shadow-sm text-gray-600 dark:text-[#E2EAE5] hover:bg-gray-50 dark:hover:bg-[#1C3026] transition-colors"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Grup Ikon & Profil */}
                    <div className="flex flex-row-reverse items-center gap-3 relative">
                        {/* Profil Section */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-800 dark:text-[#E2EAE5] capitalize">{user.name}</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium capitalize">
                                    {user.role === 'teacher' ? 'Head Teacher' : 'Siswa TQA'}
                                </p>
                            </div>
                            <img
                                src={user.avatar}
                                alt="Profile"
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white dark:border-[#1A2E24] shadow-md object-cover"
                            />
                        </div>

                        {/* Sync/Refresh Button */}
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                disabled={isRefreshing}
                                className="p-2 rounded-full transition-colors duration-200 focus:outline-none hover:bg-slate-100 dark:hover:bg-[#1A2E24] text-gray-500 disabled:opacity-50"
                                title="Sinkronisasi Data"
                            >
                                <RotateCw size={20} className={isRefreshing ? "animate-spin text-emerald-600" : ""} />
                            </button>
                        )}

                        {/* Vertical Divider */}
                        <div className="h-8 border-l border-gray-200 dark:border-[#1A2E24] mx-1 hidden sm:block"></div>

                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full transition-colors duration-200 focus:outline-none hover:bg-slate-100 dark:hover:bg-[#1A2E24] text-gray-500"
                            title={isDark ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
                        >
                            {isDark ? (
                                <Moon size={20} className="text-emerald-400 animate-in zoom-in spin-in-45" />
                            ) : (
                                <Sun size={20} className="text-amber-500 animate-in zoom-in spin-in-45" />
                            )}
                        </button>

                        {/* Bell/Notification Button & Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className={`
                                  relative p-2.5 rounded-full shadow-sm hover:shadow-md transition-all 
                                  ${isNotifOpen ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-[#121F18] text-gray-600 dark:text-[#E2EAE5] hover:bg-gray-50 dark:hover:bg-[#1C3026]'}
                                `}
                            >
                                <Bell size={20} />
                                {((user.role as string) === 'student' || (user.role as string) === 'siswa') ? (
                                    unreadNotesCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-[#070C09] animate-pulse">
                                            {unreadNotesCount}
                                        </span>
                                    )
                                ) : (
                                    notifications.length > 0 && (
                                        <span className="absolute top-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white dark:border-[#121F18] rounded-full"></span>
                                    )
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {isNotifOpen && (
                                <div className="absolute right-0 top-full mt-4 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center justify-between">
                                        <h3 className="font-bold text-gray-800">Catatan Harian</h3>
                                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">
                                            {notifications.length} Baru
                                        </span>
                                    </div>

                                    <div className="max-h-[300px] overflow-y-auto">
                                        {notifications.length > 0 ? (
                                            notifications.map((student, idx) => (
                                                <div key={`${student.id}-${idx}`} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                                                    <div className="flex items-start gap-3">
                                                        <img
                                                            src={student.avatar}
                                                            alt={student.name}
                                                            className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                                <div className="flex items-center gap-2 truncate">
                                                                    <span className="font-bold text-sm text-gray-800 truncate">{student.name}</span>
                                                                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 rounded">{student.class}</span>
                                                                </div>
                                                                {/* Delete Button */}
                                                                {onDismissNotification && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onDismissNotification(student.id);
                                                                        }}
                                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                                                                        title="Hapus notifikasi"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <MessageSquare size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                                                                <p className="text-xs text-gray-600 italic line-clamp-2">"{student.notes}"</p>
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 mt-2 text-right">Updated: {student.lastUpdate}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-gray-400">
                                                <Bell size={24} className="mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">Tidak ada catatan hari ini.</p>
                                            </div>
                                        )}
                                    </div>

                                    {notifications.length > 0 && (
                                        <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                                            <button
                                                onClick={() => setIsNotifOpen(false)}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 py-1"
                                            >
                                                Tutup
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Quick Search Button */}
                        {onSearchClick && (
                            <button
                                onClick={onSearchClick}
                                className="p-2.5 rounded-full bg-white dark:bg-[#121F18] text-gray-500 dark:text-[#E2EAE5] hover:bg-gray-50 dark:hover:bg-[#1C3026] hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30 group"
                                title="Cari Siswa"
                            >
                                <Search size={20} className="group-hover:scale-110 transition-transform" />
                            </button>
                        )}

                        {/* Action Button */}
                        {actionButton}
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;