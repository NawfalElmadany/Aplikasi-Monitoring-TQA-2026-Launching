import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, PlusCircle, BookOpen, Star, MessageSquare, Award, TrendingUp, CalendarCheck } from 'lucide-react';
import { Student, Teacher, User } from '../types';
import { loadStudentSetoranLogs, loadStudentAttendanceLogs, getAssignedTeacher } from '../services/appData';
import { isSupabaseConfigured } from '../lib/supabase';
import Header from './Header';

interface StudentProfilePageProps {
    student: Student | null;
    students?: Student[];
    user: User;
    onMenuClick: () => void;
    notifications?: Student[];
    onDismissNotification?: (studentId: string) => void;
    onSearchClick?: () => void;
    onBack: () => void;
    onInputSetoran: (student: Student) => void;
}

const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ 
    student, 
    students = [], 
    user,
    onMenuClick,
    notifications = [],
    onDismissNotification,
    onSearchClick,
    onBack, 
    onInputSetoran 
}) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'tahfidz' | 'tartili' | 'kehadiran'>(() => {
        return student?.type === 'Tartili' ? 'tartili' : 'tahfidz';
    });

    useEffect(() => {
        let isMounted = true;
        const loadProfileLogs = async () => {
            if (!student) return;
            try {
                if (isSupabaseConfigured) {
                    const remoteLogs = await loadStudentSetoranLogs(student.id);
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
    }, [student]);

    useEffect(() => {
        let isMounted = true;
        const loadProfileAttendance = async () => {
            if (!student) return;
            try {
                const remoteLogs = await loadStudentAttendanceLogs(student.id);
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
    }, [student]);

    const studentLogs = useMemo(() => {
        if (!student) return [];
        return logs
            .filter((log: any) => log.studentId === student.id)
            .sort((a: any, b: any) => b.date.localeCompare(a.date));
    }, [student, logs]);

    const tahfidzLogs = useMemo(() => {
        return studentLogs.filter((log: any) => log.type === 'Hafalan' || log.type !== 'Tartili');
    }, [studentLogs]);

    const tartiliLogs = useMemo(() => {
        return studentLogs.filter((log: any) => log.type === 'Tartili');
    }, [studentLogs]);

    const stats = useMemo(() => {
        if (studentLogs.length === 0) {
            return {
                total: 0,
                average: 0,
                lastNote: 'Belum ada catatan setoran.'
            };
        }

        const scoredLogs = studentLogs.filter((log: any) => typeof log.score === 'number' && !isNaN(log.score));
        const totalScore = scoredLogs.reduce((acc: number, log: any) => acc + log.score, 0);
        const average = scoredLogs.length > 0 ? Math.round(totalScore / scoredLogs.length) : 0;
        
        // Find last note
        const lastLogWithNote = studentLogs.find((log: any) => log.notes && log.notes.trim().length > 0);
        const lastNote = lastLogWithNote ? lastLogWithNote.notes : 'Tidak ada catatan khusus pada setoran terakhir.';

        return {
            total: studentLogs.length,
            average,
            lastNote
        };
    }, [studentLogs]);

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
        if (!student || !students || students.length === 0) return null;
        
        // Filter students in the same class and sort by name
        const classStudents = students
            .filter(s => s.class === student.class)
            .sort((a, b) => a.name.localeCompare(b.name));
            
        // Find index of current student
        const studentIndex = classStudents.findIndex(s => s.id === student.id);
        if (studentIndex === -1) return null;
        
        return getAssignedTeacher(student.name, student.class, studentIndex);
    }, [student, students]);


    if (!student) {
        return (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-slate-400 font-bold">Data siswa tidak ditemukan.</p>
                <button onClick={onBack} className="mt-4 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors shadow-sm">
                    Kembali
                </button>
            </div>
        );
    }

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
        if (activeTab === 'kehadiran') {
            if (attendanceLogs.length === 0) {
                return (
                    <div className="text-center py-16 text-slate-400 dark:text-[#8BA398] font-medium space-y-2">
                        <p>Siswa ini belum memiliki riwayat kehadiran.</p>
                        <p className="text-xs text-slate-300 dark:text-[#5F756B]">Data absensi harian yang disimpan akan langsung terdaftar di sini.</p>
                    </div>
                );
            }
            return (
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-[#1A2E24]/20 border-b border-slate-100 dark:border-[#1A2E24] text-slate-400 dark:text-[#8BA398] text-xs font-bold uppercase tracking-wider">
                            <th className="px-6 py-4">Tanggal</th>
                            <th className="px-6 py-4">Hari</th>
                            <th className="px-6 py-4 text-center">Status Kehadiran</th>
                            <th className="px-6 py-4">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1A2E24] font-medium text-slate-700 dark:text-[#E2EAE5]">
                        {attendanceLogs.map((log: any) => {
                            const dayName = new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long' });
                            const statusConfig = {
                                present: { label: 'Hadir', className: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' },
                                permission: { label: 'Izin', className: 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-900/30' },
                                sick: { label: 'Sakit', className: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30' },
                                alpha: { label: 'Alpha', className: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30' }
                            }[log.status as 'present' | 'permission' | 'sick' | 'alpha'] || { label: log.status, className: 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-white/5' };

                            return (
                                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C3026]/10 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-[#8BA398] font-bold">
                                        {formatDate(log.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-[#E2EAE5] font-semibold">
                                        {dayName}
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-0.5 px-3 py-1 rounded-full text-xs font-extrabold border ${statusConfig.className}`}>
                                            {statusConfig.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-[#8BA398] text-xs">
                                        -
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            );
        }

        const activeLogs = activeTab === 'tahfidz' ? tahfidzLogs : tartiliLogs;
        if (activeLogs.length === 0) {
            return (
                <div className="text-center py-16 text-slate-400 dark:text-[#8BA398] font-medium space-y-2">
                    <p>Siswa ini belum memiliki riwayat setoran {activeTab === 'tahfidz' ? 'tahfidz' : 'tartili'}.</p>
                    <p className="text-xs text-slate-300 dark:text-[#5F756B]">Entri baru yang Anda masukkan akan langsung terdaftar di sini.</p>
                </div>
            );
        }

        return (
            <table className="w-full text-sm text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 dark:bg-[#1A2E24]/20 border-b border-slate-100 dark:border-[#1A2E24] text-slate-400 dark:text-[#8BA398] text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4 text-center">Jenis Setoran</th>
                        <th className="px-6 py-4">Materi Setoran</th>
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
                                <td className="px-6 py-4 text-slate-800 dark:text-white font-bold">
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
            {/* Sticky Floating Header Card */}
            <div className="sticky top-4 z-30 bg-gradient-to-br from-white to-emerald-50/60 dark:bg-[#15231A] dark:bg-none p-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-lg dark:shadow-black/30 border border-emerald-400 dark:border-white/15 flex justify-between items-center mt-4 sm:mt-6 mb-8 flex-none backdrop-blur-sm transition-all duration-300 no-print">
                <Header
                    user={user}
                    onMenuClick={onMenuClick}
                    notifications={notifications}
                    onDismissNotification={onDismissNotification}
                    onSearchClick={onSearchClick}
                    flat={true}
                    title="Informasi Detail Siswa"
                    subtitle="Pantau hafalan, statistik, dan riwayat perkembangan siswa secara lengkap"
                    actionButton={
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onBack}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] font-bold text-sm hover:bg-slate-50 dark:hover:bg-[#1A2E24] transition-colors shadow-sm cursor-pointer shrink-0"
                            >
                                <ArrowLeft size={16} className="mr-1 shrink-0" />
                                <span>Kembali</span>
                            </button>
                            <button
                                onClick={() => onInputSetoran(student)}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-700 dark:hover:bg-emerald-600 shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer shrink-0"
                            >
                                <PlusCircle size={16} className="mr-1 shrink-0" />
                                <span>Input Setoran</span>
                            </button>
                        </div>
                    }
                />
            </div>

            {/* Profile Info Card */}
            <div className="bg-gradient-to-br from-white to-emerald-50/60 dark:bg-gradient-to-r dark:from-[#0B140F] dark:to-[#111D16] border border-emerald-200/60 dark:border-white/5 rounded-3xl p-8 text-slate-800 dark:text-white relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 dark:bg-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-400/5 dark:bg-amber-400/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-24 h-24 rounded-full border-4 border-emerald-100 dark:border-white/10 shadow-xl object-cover bg-slate-100 dark:bg-slate-800"
                    />
                    <div className="text-center md:text-left flex-1 space-y-2">
                        <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">{student.name}</h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-slate-500 dark:text-slate-350 text-xs font-semibold">
                            <span className="bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/10 backdrop-blur-sm shadow-sm">
                                Kelas {student.class}
                            </span>
                            <span className="text-slate-300 dark:text-white/20">•</span>
                            <span className="bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-500/10">
                                Program {student.type === 'Tartili' ? 'TQA' : (student.type || 'Hafalan')}
                            </span>
                            {assignedTeacherInfo && (
                                <>
                                    <span className="text-slate-300 dark:text-white/20">•</span>
                                    <span className={`px-3 py-1 rounded-full border font-bold text-xs shadow-sm ${assignedTeacherInfo.colorClass}`}>
                                        Guru Pengampu: {assignedTeacherInfo.name}
                                    </span>
                                </>
                            )}
                        </div>
                        
                        {/* Current progress block */}
                        <div className="pt-2 text-slate-700 dark:text-slate-300 text-sm font-semibold flex flex-wrap justify-center md:justify-start items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <BookOpen size={16} className="text-emerald-600 dark:text-emerald-500" />
                                <span>Capaian: {student.currentSurah}</span>
                            </div>
                            {student.type === 'Tartili' && student.page && (
                                <div className="flex items-center gap-1.5">
                                    <Award size={16} className="text-emerald-600 dark:text-emerald-400" />
                                    <span>Halaman: {student.page}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="bg-white dark:bg-[#121F18] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-[#1A2E24] overflow-hidden">
                <div className="p-6 lg:p-8 border-b border-slate-50 dark:border-[#1A2E24] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap border-b border-slate-100 dark:border-[#1A2E24] sm:border-none gap-1">
                        <button
                            onClick={() => setActiveTab('tahfidz')}
                            className={`pb-3 sm:pb-0 px-4 font-bold text-lg transition-all border-b-2 sm:border-none ${
                                activeTab === 'tahfidz' ? 'text-slate-800 dark:text-[#E2EAE5] border-emerald-500' : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-350 dark:text-slate-400'
                            }`}
                        >
                            Riwayat Tahfidz
                        </button>
                        <button
                            onClick={() => setActiveTab('tartili')}
                            className={`pb-3 sm:pb-0 px-4 font-bold text-lg transition-all border-b-2 sm:border-none ${
                                activeTab === 'tartili' ? 'text-slate-800 dark:text-[#E2EAE5] border-emerald-500' : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-350 dark:text-slate-400'
                            }`}
                        >
                            Riwayat Tartili
                        </button>
                        <button
                            onClick={() => setActiveTab('kehadiran')}
                            className={`pb-3 sm:pb-0 px-4 font-bold text-lg transition-all border-b-2 sm:border-none ${
                                activeTab === 'kehadiran' ? 'text-slate-800 dark:text-[#E2EAE5] border-emerald-500' : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-350 dark:text-slate-400'
                            }`}
                        >
                            Riwayat Kehadiran
                        </button>
                    </div>

                    {activeTab === 'tahfidz' && (
                        <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1 rounded-full font-bold border border-emerald-200 dark:border-emerald-900/30 self-start sm:self-auto">
                            {tahfidzLogs.length} Entri Tahfidz
                        </span>
                    )}
                    {activeTab === 'tartili' && (
                        <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs px-3 py-1 rounded-full font-bold border border-amber-200 dark:border-amber-900/30 self-start sm:self-auto">
                            {tartiliLogs.length} Entri Tartili
                        </span>
                    )}
                    {activeTab === 'kehadiran' && (
                        <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1 rounded-full font-bold border border-emerald-200 dark:border-emerald-900/30 self-start sm:self-auto">
                            {attendanceLogs.length} Hari Tercatat
                        </span>
                    )}
                </div>

                <div className="overflow-x-auto">
                    {renderTableContent()}
                </div>
            </div>
        </div>
    );
};

export default StudentProfilePage;
