import React, { useState, useEffect } from 'react';
import { LogOut, X } from 'lucide-react';
import { MENU_ITEMS } from '../constants';
import { User } from '../types';
import logoUrl from '../assets/logo.png';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { loadStudentSetoranLogs } from '../services/appData';


interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activePage: string;
    onNavigate: (page: string) => void;
    onLogout: () => void;
    user: User;
    unreadNotesCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activePage, onNavigate, onLogout, user, unreadNotesCount: propUnreadNotesCount = 0 }) => {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [unreadNotesCount, setUnreadNotesCount] = useState(propUnreadNotesCount);

    useEffect(() => {
        setUnreadNotesCount(propUnreadNotesCount);
    }, [propUnreadNotesCount]);

    useEffect(() => {
        const isStudent = user?.role === 'student' || user?.role === 'siswa';
        const studentId = user?.studentId;
        const studentName = user?.name;
        if (!isStudent || !studentId) {
            setUnreadNotesCount(0);
            return;
        }

        let isMounted = true;
        const checkUnreadCount = async () => {
            try {
                // 1. Setoran logs
                let logs: any[] = [];
                if (isSupabaseConfigured && supabase) {
                    logs = await loadStudentSetoranLogs(studentId);
                } else {
                    const localLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
                    logs = localLogs.filter((l: any) => l.studentId === studentId);
                }
                const unreadSetoran = logs.filter((l: any) => l.notes && l.notes.trim() !== '' && !l.isRead);

                // 2. Personal messages
                const localMsgs = JSON.parse(localStorage.getItem('tqa_personal_messages') || '[]');
                const unreadMsgs = localMsgs.filter((msg: any) => 
                    (msg.studentId === studentId || (studentName && msg.studentName.toUpperCase() === studentName.toUpperCase())) &&
                    msg.status === 'Terkirim'
                );

                if (isMounted) {
                    setUnreadNotesCount(unreadSetoran.length + unreadMsgs.length);
                }
            } catch (e) {
                console.error('Failed to load unread notes count in Sidebar:', e);
                const localLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
                const unreadSetoran = localLogs.filter((l: any) => l.studentId === studentId && l.notes && l.notes.trim() !== '' && !l.isRead);
                
                const localMsgs = JSON.parse(localStorage.getItem('tqa_personal_messages') || '[]');
                const unreadMsgs = localMsgs.filter((msg: any) => 
                    (msg.studentId === studentId || (studentName && msg.studentName.toUpperCase() === studentName.toUpperCase())) &&
                    msg.status === 'Terkirim'
                );
                
                if (isMounted) {
                    setUnreadNotesCount(unreadSetoran.length + unreadMsgs.length);
                }
            }
        };

        void checkUnreadCount();

        let subscription: any = null;
        if (isSupabaseConfigured && supabase) {
            subscription = supabase
                .channel('setoran-sidebar-unread')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'setoran',
                        filter: `student_id=eq.${studentId}`
                    },
                    () => {
                        void checkUnreadCount();
                    }
                )
                .subscribe();
        }

        const interval = setInterval(checkUnreadCount, 10000);

        const handleStorageChange = () => {
            void checkUnreadCount();
        };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('tqa_new_personal_message', handleStorageChange);

        return () => {
            isMounted = false;
            clearInterval(interval);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('tqa_new_personal_message', handleStorageChange);
            if (subscription) {
                supabase?.removeChannel(subscription);
            }
        };
    }, [user, activePage]);

    useEffect(() => {
        if (showLogoutConfirm) {
            document.body.classList.add('logout-confirm-open');
        } else {
            document.body.classList.remove('logout-confirm-open');
        }
        return () => {
            document.body.classList.remove('logout-confirm-open');
        };
    }, [showLogoutConfirm]);

    const filteredMenu = MENU_ITEMS.filter(item => {
        if (user.role === 'student' || user.role === 'siswa') {
            // Tampilkan hanya menu Dashboard, Hafalan, Tartili, Catatan, Absensi, dan Profil untuk Siswa
            return ['dashboard', 'hafalan', 'tartili', 'catatan', 'absensi', 'profil'].includes(item.id);
        }
        // Guru-only menu items
        return ['dashboard', 'input_setoran', 'murojaah', 'tartili', 'gharib', 'santri', 'riwayat', 'ujian_tartili', 'catatan', 'laporan', 'settings', 'absensi'].includes(item.id);
    });

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        onLogout();
    };

    return (
        <>
            <style>{`
        @keyframes overlayShow {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes contentShow {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-overlay {
          animation: overlayShow 0.2s ease-out forwards;
        }
        .animate-content {
          animation: contentShow 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .logout-confirm-open .sticky {
          display: none !important;
        }
      `}</style>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-overlay">
                    <div className="bg-white dark:bg-[#121F18] border border-transparent dark:border-[#1A2E24] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-content">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mb-4 border border-red-100 dark:border-red-900/30">
                                <LogOut size={28} className="text-red-500 ml-1" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-[#E2EAE5] mb-2">Konfirmasi Logout</h3>
                            <p className="text-gray-500 dark:text-[#8BA398] text-sm mb-6 leading-relaxed">
                                Apakah Anda yakin ingin keluar dari aplikasi? <br />Anda harus login kembali untuk mengakses data.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-[#1A2E24] text-gray-700 dark:text-[#E2EAE5] font-bold hover:bg-gray-50 dark:hover:bg-[#1C3026] transition-colors text-sm cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmLogout}
                                    className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all transform hover:-translate-y-0.5 text-sm cursor-pointer"
                                >
                                    Ya, Keluar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/20 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar Content */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[280px] bg-white dark:bg-[#121F18] border-r border-gray-100 dark:border-[#1A2E24]
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-full shadow-2xl lg:shadow-none font-sans transition-colors duration-300
      `}>
                {/* Logo */}
                <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden">
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-extrabold text-gray-900 dark:text-[#E2EAE5] tracking-tight leading-none">SiTQA</span>
                            <span className="text-[10px] text-gray-500 dark:text-[#8BA398] leading-tight mt-1 font-medium max-w-[120px]">Sistem Informasi Tahfidz Qur'an Al Irsyad</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Menu */}
                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                    {filteredMenu.map((item) => {
                        const isStudent = user.role === 'student' || user.role === 'siswa';
                        


                        const isActive = activePage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onNavigate(item.id);
                                    if (window.innerWidth < 1024) onClose();
                                }}
                                className={`
                  w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden cursor-pointer
                  ${isActive
                                        ? 'bg-gradient-to-r from-emerald-800 to-emerald-600 text-white dark:text-white font-bold shadow-sm'
                                        : 'text-gray-500 dark:text-[#8BA398] hover:bg-gray-50 dark:hover:bg-[#121F18]/50 hover:text-gray-900 dark:hover:text-[#E2EAE5] font-medium'
                                    }
                `}
                            >
                                <div className="flex items-center justify-between w-full">
                                    {item.id === 'catatan' && isStudent ? (
                                        <>
                                            <div className="flex items-center gap-x-3">
                                                <item.icon size={22} className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white dark:text-white' : 'text-gray-400 dark:text-[#8BA398]/70 group-hover:text-gray-600 dark:group-hover:text-[#E2EAE5]'}`} strokeWidth={isActive ? 2.5 : 2} />
                                                <span className="text-[15px]">{item.label}</span>
                                            </div>
                                            {unreadNotesCount > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                                                    {unreadNotesCount > 99 ? '99+' : unreadNotesCount}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-4">
                                                <item.icon size={22} className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white dark:text-white' : 'text-gray-400 dark:text-[#8BA398]/70 group-hover:text-gray-600 dark:group-hover:text-[#E2EAE5]'}`} strokeWidth={isActive ? 2.5 : 2} />
                                                <span className="text-[15px]">{item.label}</span>
                                            </div>
                                            {item.id === 'catatan' && unreadNotesCount > 0 && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-xs font-medium text-red-500 shrink-0 animate-pulse">
                                                    {unreadNotesCount}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-6 border-t border-gray-50 dark:border-[#1A2E24] mt-auto">
                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-500 dark:text-[#8BA398] hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
                    >
                        <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                        <span className="font-medium text-[15px]">Keluar</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

// Import BookOpen locally just for the logo placeholder if needed,
// but better to rely on what's available or use the image.
import { BookOpen } from 'lucide-react';

export default Sidebar;