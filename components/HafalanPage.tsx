import React, { useState, useEffect, useMemo } from 'react';
import { Student, User } from '../types';
import { 
    Calendar, ChevronDown, Info, MessageCircle, Book, Users, X, Plus, CheckCircle2, ChevronRight,
    ArrowLeft, PlusCircle, BookOpen, Star, MessageSquare, Award, TrendingUp, CalendarCheck
} from 'lucide-react';
import Header from './Header';
import { loadStudentSetoranLogs, loadStudentAttendanceLogs, getAssignedTeacher } from '../services/appData';
import { isSupabaseConfigured } from '../lib/supabase';

interface HafalanPageProps {
    user: User;
    students: Student[];
    onMenuClick: () => void;
    notifications?: Student[];
    onDismissNotification?: (studentId: string) => void;
    onSearchClick?: () => void;
    unreadNotesCount?: number;
}

interface HistoryItem {
    id: number;
    studentName?: string; // Added for teacher view
    date: string;
    surah: string;
    verses: string;
    score: number;
    status: 'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Perlu Bimbingan';
    note?: string;
}

const HafalanPage: React.FC<HafalanPageProps> = ({ 
    user, 
    students,
    onMenuClick,
    notifications = [],
    onDismissNotification,
    onSearchClick,
    unreadNotesCount = 0
}) => {
    // State for Teacher View
    const [viewingClass, setViewingClass] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Check if user is a teacher
    const isTeacher = user.role === 'teacher';

    const currentStudent = students.find(s =>
        (user.studentId && s.id === user.studentId) ||
        s.name.toUpperCase() === user.name.toUpperCase()
    );

    if (!isTeacher && !currentStudent) {
        return (
            <div className="p-8 text-center text-gray-500">
                Data siswa tidak ditemukan. Pastikan Anda login sebagai siswa yang terdaftar.
            </div>
        );
    }

    // Helper to generate month options
    const getMonthOptions = () => {
        const options = [];
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            options.push({
                value: date.toISOString().slice(0, 7),
                label: date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
            });
        }
        return options;
    };

    // Fetch History Data (Real setoran logs)
    const getHistoryData = (month: string, className?: string): HistoryItem[] => {
        try {
            const allLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
            
            // Filter logs by type ('Hafalan' or 'Drill Munaqosah'), month (YYYY-MM), and target (class or student)
            const filteredLogs = allLogs.filter((log: any) => {
                const isHafalanType = log.type === 'Hafalan' || log.type === 'Drill Munaqosah';
                if (!isHafalanType) return false;

                const logMonth = log.date ? log.date.slice(0, 7) : '';
                if (logMonth !== month) return false;

                if (className) {
                    return log.class === className;
                } else if (currentStudent) {
                    return log.studentId === currentStudent.id || log.studentName === currentStudent.name;
                }
                return false;
            });

            return filteredLogs.map((log: any) => {
                const currentSurah = log.currentSurah || '';
                let surah = currentSurah;
                let verses = '';
                if (currentSurah.includes(':')) {
                    const parts = currentSurah.split(':');
                    surah = parts[0].trim();
                    verses = `Ayat ${parts[1].trim()}`;
                } else if (log.page) {
                    verses = `Hal. ${log.page}`;
                }

                const score = log.score || log.lastScore || 0;
                const status = (() => {
                    if (log.status) return log.status;
                    const scoreNum = typeof score === 'number' ? score : parseInt(score);
                    if (!isNaN(scoreNum)) {
                        if (scoreNum >= 92) return 'Mumtaz';
                        if (scoreNum >= 83) return 'Jayyid Jiddan';
                        if (scoreNum >= 80) return 'Jayyid';
                        return 'Perlu Bimbingan';
                    }
                    return 'Jayyid';
                })();

                return {
                    id: log.id || Date.now(),
                    studentName: log.studentName,
                    date: log.date ? log.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
                    surah,
                    verses,
                    score,
                    status,
                    note: log.notes || ''
                };
            }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } catch (e) {
            console.error('Failed to load real history data:', e);
            return [];
        }
    };

    const historyData = getHistoryData(selectedMonth, isTeacher ? viewingClass || undefined : undefined);

    // --- Teacher Dashboard View ---
    if (isTeacher) {
        return (
            <div className="space-y-6 flex-1 flex flex-col min-h-0 animate-in fade-in duration-500 font-sans">
                {/* Header */}
                <div className="sticky top-0 z-30 bg-slate-50 dark:bg-[#09120E] pt-4 pb-2 w-full flex-none no-print transition-colors duration-300">
                    <div className="bg-gradient-to-br from-white to-emerald-50/60 dark:bg-[#15231A] dark:bg-none p-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-lg dark:shadow-black/30 border border-emerald-400 dark:border-white/15 flex justify-between items-center transition-all duration-300">
                        <Header
                            user={user}
                            onMenuClick={onMenuClick}
                            notifications={notifications}
                            onDismissNotification={onDismissNotification}
                            onSearchClick={onSearchClick}
                            flat={true}
                            title="Monitoring Hafalan"
                            subtitle="Jadwal dan riwayat setoran hafalan siswa"
                            unreadNotesCount={unreadNotesCount}
                        />
                    </div>
                </div>

                {/* Class Overview Cards */}
                <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 px-1 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-6">
                        {[
                            { class: '5B', color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-200', icon: 'bg-blue-400/20' },
                            { class: '5C', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-200', icon: 'bg-emerald-400/20' },
                            { class: '5D', color: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-200', icon: 'bg-pink-400/20' },
                            { class: '6C', color: 'from-violet-500 to-purple-600', shadow: 'shadow-purple-200', icon: 'bg-purple-400/20' },
                            { class: '6D', color: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-200', icon: 'bg-orange-400/20' }
                        ].map((item) => {
                            const count = getHistoryData(selectedMonth, item.class).length;
                            return (
                                <button
                                    key={item.class}
                                    onClick={() => setViewingClass(item.class)}
                                    className={`bg-gradient-to-br ${item.color} rounded-2xl p-3.5 sm:p-5 text-white shadow-lg ${item.shadow} transition-all hover:scale-105 duration-300 text-left relative overflow-hidden group`}
                                >
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-2.5 sm:mb-4">
                                            <div className={`p-1.5 sm:p-2 rounded-lg ${item.icon}`}>
                                                <Users size={16} className="text-white sm:w-6 sm:h-6" />
                                            </div>
                                            <div className="bg-white/20 backdrop-blur-sm px-2 py-0.5 sm:px-3 sm:py-1 rounded-md text-[9px] sm:text-xs font-extrabold">
                                                Lihat Data
                                            </div>
                                        </div>
                                        <h3 className="text-sm sm:text-2xl font-black mb-0.5 sm:mb-1 truncate">Kelas {item.class}</h3>
                                        <p className="text-white/80 text-[10px] sm:text-sm font-semibold truncate">{count} Setoran Bulan Ini</p>
                                    </div>
                                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white dark:bg-dark-card/10 rounded-full blur-2xl group-hover:bg-white dark:bg-dark-card/20 transition-all duration-500" />
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-white dark:bg-dark-card/5 rounded-full blur-xl" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Class Details Modal */}
                {viewingClass && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                            <div className="p-4 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-dark-card-hover/50">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <Users className="text-indigo-600" size={24} />
                                        Riwayat Hafalan Kelas {viewingClass}
                                    </h2>
                                    <p className="text-sm text-gray-500">Daftar setoran hafalan terbaru</p>
                                </div>
                                <button onClick={() => setViewingClass(null)} className="p-2 hover:bg-gray-100 dark:bg-dark-card-hover rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-300 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Month Filter in Modal */}
                            <div className="p-4 border-b border-gray-100 dark:border-dark-border bg-white">
                                <div className="relative max-w-xs">
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-dark-card-hover px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border cursor-pointer hover:bg-gray-100 dark:bg-dark-card-hover transition-colors pointer-events-none justify-between">
                                        <span className="flex items-center gap-2"><Calendar size={16} /> {new Date(selectedMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                                        <ChevronDown size={16} />
                                    </div>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                    >
                                        {getMonthOptions().map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                {historyData.length > 0 ? (
                                    <div className="space-y-3">
                                        {historyData.map((item, idx) => (
                                            <div key={idx} className="p-4 rounded-xl border border-gray-100 dark:border-dark-border hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors flex items-center gap-4 bg-white dark:bg-dark-card shadow-sm">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-bold border border-indigo-200">
                                                    {item.score}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-800">{item.studentName}</h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{item.surah} <span className="text-gray-400">•</span> {item.verses}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${item.status === 'Mumtaz' ? 'bg-emerald-100 text-emerald-700' :
                                                        item.status === 'Jayyid Jiddan' ? 'bg-blue-100 text-blue-700' :
                                                            item.status === 'Jayyid' ? 'bg-indigo-100 text-indigo-700' :
                                                                'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-dark-card-hover rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                            <Book size={32} />
                                        </div>
                                        <h3 className="font-medium text-gray-900">Belum ada data</h3>
                                        <p className="text-gray-500 text-sm mt-1">Belum ada setoran hafalan tercatat untuk kelas ini pada bulan yang dipilih.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- Student View (Detail Profile Layout) ---
    const [logs, setLogs] = useState<any[]>([]);
    const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);

    useEffect(() => {
        let isMounted = true;
        const loadProfileLogs = async () => {
            if (!currentStudent) return;
            try {
                if (isSupabaseConfigured) {
                    const remoteLogs = await loadStudentSetoranLogs(currentStudent.id);
                    if (isMounted) {
                        setLogs(remoteLogs);
                    }
                } else {
                    const currentLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
                    if (isMounted) {
                        setLogs(currentLogs);
                    }
                }
            } catch (e) {
                console.error('Failed to load profile logs:', e);
                const currentLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
                if (isMounted) {
                    setLogs(currentLogs);
                }
            }
        };
        loadProfileLogs();
        return () => {
            isMounted = false;
        };
    }, [currentStudent]);

    useEffect(() => {
        let isMounted = true;
        const loadProfileAttendance = async () => {
            if (!currentStudent) return;
            try {
                const remoteLogs = await loadStudentAttendanceLogs(currentStudent.id);
                if (isMounted) {
                    setAttendanceLogs(remoteLogs);
                }
            } catch (e) {
                console.error('Failed to load profile attendance logs:', e);
            }
        };
        loadProfileAttendance();
        return () => {
            isMounted = false;
        };
    }, [currentStudent]);

    const studentLogs = useMemo(() => {
        if (!currentStudent) return [];
        return logs
            .filter((log: any) => log.studentId === currentStudent.id)
            .sort((a: any, b: any) => b.date.localeCompare(a.date));
    }, [currentStudent, logs]);

    const tahfidzLogs = useMemo(() => {
        return studentLogs.filter((log: any) => log.type === 'Hafalan' || log.type !== 'Tartili');
    }, [studentLogs]);

    const stats = useMemo(() => {
        if (tahfidzLogs.length === 0) {
            return {
                total: 0,
                average: 0,
                lastNote: 'Belum ada catatan setoran.'
            };
        }

        const scoredLogs = tahfidzLogs.filter((log: any) => typeof log.score === 'number' && !isNaN(log.score));
        const totalScore = scoredLogs.reduce((acc: number, log: any) => acc + log.score, 0);
        const average = scoredLogs.length > 0 ? Math.round(totalScore / scoredLogs.length) : 0;
        
        // Find last note
        const lastLogWithNote = tahfidzLogs.find((log: any) => log.notes && log.notes.trim().length > 0);
        const lastNote = lastLogWithNote ? lastLogWithNote.notes : 'Tidak ada catatan khusus pada setoran terakhir.';

        return {
            total: tahfidzLogs.length,
            average,
            lastNote
        };
    }, [tahfidzLogs]);

    const attendanceStats = useMemo(() => {
        if (attendanceLogs.length === 0) {
            return {
                total: 0,
                present: 0,
                permission: 0,
                sick: 0,
                alpha: 0,
                percentage: 0
            };
        }

        const present = attendanceLogs.filter(log => log.status === 'present').length;
        const permission = attendanceLogs.filter(log => log.status === 'permission').length;
        const sick = attendanceLogs.filter(log => log.status === 'sick').length;
        const alpha = attendanceLogs.filter(log => log.status === 'alpha').length;
        const total = attendanceLogs.length;
        const percentage = Math.round((present / total) * 100);

        return {
            total,
            present,
            permission,
            sick,
            alpha,
            percentage
        };
    }, [attendanceLogs]);

    const assignedTeacherInfo = useMemo(() => {
        if (!currentStudent || !students || students.length === 0) return null;
        
        // Filter students in the same class and sort by name
        const classStudents = students
            .filter(s => s.class === currentStudent.class)
            .sort((a, b) => a.name.localeCompare(b.name));
            
        // Find index of current student
        const studentIndex = classStudents.findIndex(s => s.id === currentStudent.id);
        if (studentIndex === -1) return null;
        
        return getAssignedTeacher(currentStudent.name, currentStudent.class, studentIndex);
    }, [currentStudent, students]);

    const formatDate = (isoStr: string) => {
        try {
            const date = new Date(isoStr);
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return isoStr.slice(0, 10);
        }
    };

    const renderTableContent = () => {
        const activeLogs = tahfidzLogs;
        if (activeLogs.length === 0) {
            return (
                <div className="text-center py-16 text-slate-400 dark:text-[#8BA398] font-medium space-y-2">
                    <p>Anda belum memiliki riwayat setoran tahfidz.</p>
                    <p className="text-xs text-slate-300 dark:text-[#5F756B]">Entri baru yang dimasukkan akan langsung terdaftar di sini.</p>
                </div>
            );
        }

        return (
            <table className="w-full min-w-max text-sm text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 dark:bg-[#1A2E24]/20 border-b border-slate-100 dark:border-[#1A2E24] text-slate-400 dark:text-[#8BA398] text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4 text-center">Jenis Setoran</th>
                        <th className="px-6 py-4 min-w-[140px] whitespace-nowrap">Materi Setoran</th>
                        <th className="px-6 py-4 text-center">Nilai</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4">Catatan Guru</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1A2E24] font-medium text-slate-700 dark:text-[#E2EAE5]">
                    {activeLogs.map((log: any) => {
                        const scoreVal = log.score || log.lastScore;
                        const logStatus = (() => {
                            if (log.status) return log.status;
                            const scoreNum = typeof scoreVal === 'number' ? scoreVal : parseInt(scoreVal);
                            if (!isNaN(scoreNum)) {
                                if (scoreNum >= 92) return 'Mumtaz';
                                if (scoreNum >= 83) return 'Jayyid Jiddan';
                                if (scoreNum >= 80) return 'Jayyid';
                                return 'Perlu Bimbingan';
                            }
                            return '-';
                        })();

                        return (
                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C3026]/10 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-[#8BA398] font-bold">
                                    {formatDate(log.date)}
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                    <span className="text-[11px] font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-350 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/5">
                                        {log.jenisSetoran || 'Lanjut'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-800 dark:text-white font-bold min-w-[140px] whitespace-nowrap">
                                    {log.currentSurah}
                                </td>
                                <td className="px-6 py-4 text-center font-black text-slate-900 dark:text-white whitespace-nowrap">
                                    {scoreVal || '-'}
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                        logStatus === 'Mumtaz' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' :
                                        logStatus === 'Jayyid Jiddan' ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-900/30' :
                                        logStatus === 'Jayyid' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30' :
                                        logStatus === 'Perlu Bimbingan' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30' :
                                        'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-white/5'
                                    }`}>
                                        {logStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 dark:text-[#8BA398] text-xs font-semibold max-w-[200px] truncate" title={log.notes}>
                                    {log.notes || '-'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    if (!currentStudent) {
        return (
            <div className="p-8 text-center text-gray-500">
                Data siswa tidak ditemukan. Pastikan Anda login sebagai siswa yang terdaftar.
            </div>
        );
    }

    return (
        <div className="space-y-6 flex-1 flex flex-col min-h-0 animate-in fade-in duration-500 font-sans">
            {/* Header Section */}
            <div className="sticky top-0 z-30 bg-slate-50 dark:bg-[#09120E] pt-4 pb-2 w-full flex-none no-print transition-colors duration-300">
                <div className="bg-gradient-to-br from-white to-emerald-50/60 dark:bg-[#15231A] dark:bg-none p-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-lg dark:shadow-black/30 border border-emerald-400 dark:border-white/15 flex justify-between items-center transition-all duration-300">
                    <Header
                        user={user}
                        onMenuClick={onMenuClick}
                        notifications={notifications}
                        onDismissNotification={onDismissNotification}
                        onSearchClick={undefined}
                        flat={true}
                        title="Informasi Detail Hafalan Saya"
                        subtitle="Pantau hafalan, statistik, dan riwayat perkembangan Anda secara lengkap"
                        unreadNotesCount={unreadNotesCount}
                    />
                </div>
            </div>

            {/* History List Container */}
            <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 px-1">
                <div className="w-full flex flex-col gap-8 animate-in fade-in">
                    
                    {/* Profile Info Card */}
                    <div className="bg-gradient-to-br from-white to-emerald-50/60 dark:bg-gradient-to-r dark:from-[#0B140F] dark:to-[#111D16] border border-emerald-200/60 dark:border-white/5 rounded-3xl p-8 text-slate-800 dark:text-white relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 dark:bg-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-400/5 dark:bg-amber-400/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                            <img
                                src={currentStudent.avatar}
                                alt={currentStudent.name}
                                className="w-24 h-24 rounded-full border-4 border-emerald-100 dark:border-white/10 shadow-xl object-cover bg-slate-100 dark:bg-slate-800"
                            />
                            <div className="text-center md:text-left flex-1 space-y-2">
                                <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">{currentStudent.name}</h2>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-slate-500 dark:text-slate-350 text-xs font-semibold mt-3">
                                    <span className="bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/10 backdrop-blur-sm shadow-sm">
                                        Kelas {currentStudent.class}
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400 text-sm mb-[2px] flex items-center">•</span>
                                    <span className="bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-500/10">
                                        Program {currentStudent.type === 'Tartili' ? 'TQA' : (currentStudent.type || 'Hafalan')}
                                    </span>
                                    {assignedTeacherInfo && (
                                        <>
                                            <span className="text-slate-500 dark:text-slate-400 text-sm mb-[2px] flex items-center">•</span>
                                            <span className={`px-3 py-1 rounded-full border font-bold text-xs shadow-sm ${assignedTeacherInfo.colorClass}`}>
                                                Guru Pengampu: {assignedTeacherInfo.name}
                                            </span>
                                        </>
                                    )}
                                </div>
                                

                            </div>
                        </div>
                    </div>

                    {/* Stats Dashboard Grid */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Setoran */}
                        <div className="bg-white dark:bg-[#121F18] rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-[#1A2E24] flex items-center gap-5">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-widest">Total Setoran</p>
                                <h4 className="text-2xl font-black text-slate-800 dark:text-[#E2EAE5] mt-1">{stats.total} Kali</h4>
                            </div>
                        </div>

                        {/* Rata-rata Nilai */}
                        <div className="bg-white dark:bg-[#121F18] rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-[#1A2E24] flex items-center gap-5">
                            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                <Star size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-widest">Rata-rata Nilai</p>
                                <h4 className="text-2xl font-black text-slate-800 dark:text-[#E2EAE5] mt-1">{stats.average || '-'}</h4>
                            </div>
                        </div>

                        {/* Kehadiran */}
                        <div className="bg-white dark:bg-[#121F18] rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-[#1A2E24] flex items-center gap-5">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                <CalendarCheck size={24} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-widest">Kehadiran</p>
                                <h4 className="text-2xl font-black text-slate-800 dark:text-[#E2EAE5] mt-1">{attendanceStats.percentage}%</h4>
                                <p className="text-[10px] text-slate-500 dark:text-[#8BA398] font-bold mt-0.5 truncate" title={`Hadir: ${attendanceStats.present}, Izin: ${attendanceStats.permission}, Sakit: ${attendanceStats.sick}, Alpha: ${attendanceStats.alpha}`}>
                                    H:{attendanceStats.present} | I:{attendanceStats.permission} | S:{attendanceStats.sick} | A:{attendanceStats.alpha}
                                </p>
                            </div>
                        </div>

                        {/* Catatan Terakhir */}
                        <div className="bg-white dark:bg-[#121F18] rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-[#1A2E24] flex items-center gap-5">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                <MessageSquare size={24} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-widest">Catatan Terakhir</p>
                                <h4 className="text-sm font-bold text-slate-700 dark:text-[#E2EAE5] mt-1 truncate" title={stats.lastNote}>{stats.lastNote}</h4>
                            </div>
                        </div>
                    </div>

                    {/* Historical Logs List Section */}
                    <div className="w-full bg-white dark:bg-[#121F18] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-[#1A2E24] overflow-hidden">
                        <div className="p-6 lg:p-8 border-b border-slate-50 dark:border-[#1A2E24] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap border-b border-slate-100 dark:border-[#1A2E24] sm:border-none gap-1">
                                <span className="text-slate-800 dark:text-[#E2EAE5] font-bold text-lg">
                                    Riwayat Tahfidz
                                </span>
                            </div>

                            <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1 rounded-full font-bold border border-emerald-200 dark:border-emerald-900/30 self-start sm:self-auto">
                                {tahfidzLogs.length} Entri Tahfidz
                            </span>
                        </div>

                        <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
                            {renderTableContent()}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HafalanPage;
