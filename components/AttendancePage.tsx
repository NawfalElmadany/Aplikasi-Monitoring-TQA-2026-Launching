import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Filter, CalendarCheck, Check, X, Clock, FileText, Save, CheckCircle2, AlertCircle, Calendar, Loader2 } from 'lucide-react';
import { Student, User, AttendanceRecord } from '../types';
import Header from './Header';
import FloatingHeaderCard from './FloatingHeaderCard';
import { loadAttendanceLogs, saveAttendanceLogs, loadStudentAttendanceLogs, getAssignedTeacher } from '../services/appData';


interface AttendancePageProps {
    students: Student[];
    user: User;
    onMenuClick: () => void;
    notifications?: Student[];
    onDismissNotification?: (studentId: string) => void;
    onSearchClick?: () => void;
    unreadNotesCount?: number;
}

const AttendancePage: React.FC<AttendancePageProps> = ({ 
    students,
    user,
    onMenuClick,
    notifications = [],
    onDismissNotification,
    onSearchClick,
    unreadNotesCount = 0
}) => {
    const isStudent = user.role === 'student' || user.role === 'siswa';

    // Student specific states
    const [attLogs, setAttLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(isStudent);
    const [selectedStudentMonth, setSelectedStudentMonth] = useState('Semua Waktu');

    const filteredAttLogs = useMemo(() => {
        if (selectedStudentMonth === 'Semua Waktu') return attLogs;
        return attLogs.filter((log: any) => {
            const dateObj = new Date(log.date);
            const monthNames = [
                "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                "Juli", "Agustus", "September", "Oktober", "November", "Desember"
            ];
            const logMonthYear = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
            return logMonthYear.toLowerCase() === selectedStudentMonth.toLowerCase();
        });
    }, [attLogs, selectedStudentMonth]);

    const currentStudent = students.find(s => 
        (user.studentId && s.id === user.studentId) || 
        s.name.toUpperCase() === user.name.toUpperCase()
    );

    useEffect(() => {
        if (!isStudent || !currentStudent) return;
        
        let isMounted = true;
        const fetchLogs = async () => {
            setLoadingLogs(true);
            try {
                const logs = await loadStudentAttendanceLogs(currentStudent.id);
                if (isMounted) {
                    setAttLogs(logs);
                }
            } catch (err) {
                console.error("Failed to load student attendance logs:", err);
            } finally {
                if (isMounted) setLoadingLogs(false);
            }
        };

        void fetchLogs();
        return () => {
            isMounted = false;
        };
    }, [isStudent, currentStudent]);

    // Student stats calculation
    const attStats = React.useMemo(() => {
        const total = attLogs.length;
        const present = attLogs.filter(l => l.status === 'present').length;
        const permission = attLogs.filter(l => l.status === 'permission').length;
        const sick = attLogs.filter(l => l.status === 'sick').length;
        const alpha = attLogs.filter(l => l.status === 'alpha').length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 100;
        
        return { total, present, permission, sick, alpha, rate };
    }, [attLogs]);

    const [selectedClass, setSelectedClass] = useState('5B');
    const [selectedTeacher, setSelectedTeacher] = useState('Semua');
    const [searchQuery, setSearchQuery] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isScrolled, setIsScrolled] = useState(false);


    useEffect(() => {
        const mainContainer = document.querySelector('main');
        const handleScroll = () => {
            if (mainContainer) {
                setIsScrolled(mainContainer.scrollTop > 10);
            }
        };

        if (mainContainer) {
            mainContainer.addEventListener('scroll', handleScroll);
            handleScroll();
        }

        return () => {
            if (mainContainer) {
                mainContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    // Helper to generate mock monthly stats
    const generateMonthlyStats = (className: string) => {
        return students
            .filter(s => s.class === className)
            .map(s => {
                // Mock random attendance data
                // Deterministic pseudo-random based on ID to keep it consistent during re-renders
                const seed = s.id.charCodeAt(0) + selectedMonth;
                const present = 20 + (seed % 5);
                const permission = seed % 3;
                const sick = seed % 2;
                const alpha = Math.max(0, 25 - (present + permission + sick));
                const totalDays = present + permission + sick + alpha;
                const percentage = Math.round((present / totalDays) * 100);

                return {
                    id: s.id,
                    name: s.name,
                    avatar: s.avatar,
                    present,
                    permission,
                    sick,
                    alpha,
                    percentage
                };
            });
    };

    // Derived state
    const filteredStudents = useMemo(() => {
        return students.filter((student, index) => {
            const matchesClass = selectedClass === 'Semua' || student.class === selectedClass;
            const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
            
            const teacherInfo = getAssignedTeacher(student.name, student.class, index);
            const matchesTeacher = selectedTeacher === 'Semua' || teacherInfo.name === selectedTeacher;
            
            return matchesClass && matchesSearch && matchesTeacher;
        });
    }, [students, selectedClass, searchQuery, selectedTeacher]);


    // Attendance state
    const [attendance, setAttendance] = useState<Record<string, 'present' | 'permission' | 'sick' | 'alpha'>>({});
    const [isTableMissing, setIsTableMissing] = useState(false);

    // Load attendance state on date/class change
    useEffect(() => {
        let isMounted = true;
        const fetchAttendance = async () => {
            try {
                const classFilter = selectedTeacher !== 'Semua' ? 'Semua' : selectedClass;
                const logs = await loadAttendanceLogs(date, classFilter);
                if (isMounted) {
                    const recordMap: Record<string, 'present' | 'permission' | 'sick' | 'alpha'> = {};
                    logs.forEach(log => {
                        recordMap[log.studentId] = log.status;
                    });
                    setAttendance(recordMap);
                    setIsTableMissing(false);
                }
            } catch (err: any) {
                console.error("Failed to load attendance logs:", err);
                if (err?.message?.includes('public.attendance') || err?.message?.includes('schema cache')) {
                    if (isMounted) setIsTableMissing(true);
                }
            }
        };
        fetchAttendance();
        return () => {
            isMounted = false;
        };
    }, [date, selectedClass, selectedTeacher]);


    const handleAttendanceChange = (studentId: string, status: 'present' | 'permission' | 'sick' | 'alpha') => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const markAllPresent = () => {
        const newAttendance = { ...attendance };
        filteredStudents.forEach(s => {
            if (!newAttendance[s.id]) {
                newAttendance[s.id] = 'present';
            }
        });
        setAttendance(newAttendance);
    };

    const [isSaving, setIsSaving] = useState(false);

    const playSuccessSound = () => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
        oscillator.frequency.exponentialRampToValueAtTime(1174.66, audioContext.currentTime + 0.1); // High pitch sweep

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    };

    const handleSaveAttendance = async () => {
        setIsSaving(true);
        try {
            const recordsToSave: AttendanceRecord[] = filteredStudents.map(student => ({
                id: `${student.id}_${date}`,
                studentId: student.id,
                studentName: student.name,
                class: student.class,
                date: date,
                status: attendance[student.id] || 'present'
            }));

            await saveAttendanceLogs(recordsToSave);
            playSuccessSound();
            setIsTableMissing(false);
        } catch (err: any) {
            console.error("Failed to save attendance:", err);
            if (err?.message?.includes('public.attendance') || err?.message?.includes('schema cache')) {
                setIsTableMissing(true);
                playSuccessSound(); // Still play sound because it's successfully saved to localStorage
            } else {
                alert(err.message || "Gagal menyimpan absensi.");
            }
        } finally {
            setIsSaving(false);
        }
    };




    if (isStudent) {
        return (
            <div className="space-y-6 flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="sticky top-4 z-30 bg-gradient-to-br from-white to-emerald-50/60 dark:bg-[#15231A] dark:bg-none p-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-lg dark:shadow-black/30 border border-emerald-400 dark:border-white/15 flex justify-between items-center mt-4 sm:mt-6 mb-8 flex-none">
                    <Header
                        user={user}
                        onMenuClick={onMenuClick}
                        notifications={notifications}
                        onDismissNotification={onDismissNotification}
                        onSearchClick={undefined}
                        flat={true}
                        title="Kehadiran Saya"
                        subtitle="Rekapitulasi dan riwayat kehadiran harian Anda."
                        unreadNotesCount={unreadNotesCount}
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 pt-2">
                    <div className="space-y-6 w-full max-w-none">
                        
                        {/* Attendance Statistics Grid */}
                        <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {/* Card: Persentase */}
                            <div className="w-full bg-white dark:bg-[#111D16] border border-slate-200 dark:border-white/5 shadow-lg shadow-black/20 rounded-xl p-5 text-center flex flex-col justify-center">
                                <span className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Persentase</span>
                                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{attStats.rate}%</span>
                            </div>

                            {/* Card: Hadir */}
                            <div className="w-full bg-white dark:bg-[#111D16] border border-slate-200 dark:border-white/5 shadow-lg shadow-black/20 rounded-xl p-5 text-center flex flex-col justify-center">
                                <span className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Hadir</span>
                                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 block">{attStats.present}</span>
                            </div>

                            {/* Card: Sakit */}
                            <div className="w-full bg-white dark:bg-[#111D16] border border-slate-200 dark:border-white/5 shadow-lg shadow-black/20 rounded-xl p-5 text-center flex flex-col justify-center">
                                <span className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Sakit</span>
                                <span className="text-2xl font-bold text-amber-500 mt-2 block">{attStats.sick}</span>
                            </div>

                            {/* Card: Izin */}
                            <div className="w-full bg-white dark:bg-[#111D16] border border-slate-200 dark:border-white/5 shadow-lg shadow-black/20 rounded-xl p-5 text-center flex flex-col justify-center">
                                <span className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Izin</span>
                                <span className="text-2xl font-bold text-teal-500 mt-2 block">{attStats.permission}</span>
                            </div>

                            {/* Card: Alpha */}
                            <div className="w-full bg-white dark:bg-[#111D16] border border-slate-200 dark:border-white/5 shadow-lg shadow-black/20 rounded-xl p-5 text-center flex flex-col justify-center">
                                <span className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Alpha</span>
                                <span className="text-2xl font-bold text-red-500 mt-2 block">{attStats.alpha}</span>
                            </div>
                        </div>

                        {/* Attendance Logs Table */}
                        <div className="w-full max-w-none bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] rounded-3xl p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Riwayat Kehadiran</h3>
                                <select
                                    value={selectedStudentMonth}
                                    onChange={(e) => setSelectedStudentMonth(e.target.value)}
                                    className="bg-transparent dark:bg-[#111D16] border dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer self-start sm:self-auto"
                                >
                                    <option value="Semua Waktu" className="dark:bg-[#111D16]">Semua Waktu</option>
                                    <option value="Juli 2026" className="dark:bg-[#111D16]">Juli 2026</option>
                                    <option value="Juni 2026" className="dark:bg-[#111D16]">Juni 2026</option>
                                </select>
                            </div>
                            
                            {loadingLogs ? (
                                <div className="py-12 text-center text-slate-400">
                                    <Loader2 className="animate-spin mx-auto mb-2 text-emerald-600" size={24} />
                                    <span>Memuat data absensi...</span>
                                </div>
                            ) : filteredAttLogs.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <div className="w-full text-sm text-left min-w-[600px]">
                                        {/* Table Header with 10-Column Grid */}
                                        <div className="w-full grid grid-cols-10 gap-4 py-3 border-b border-slate-100 dark:border-white/5 text-slate-400 dark:text-[#8BA398] font-bold text-xs uppercase tracking-wider items-center">
                                            <div className="col-span-4 pl-1 text-left">Tanggal</div>
                                            <div className="col-span-3 text-left">Status</div>
                                            <div className="col-span-3 text-left">Keterangan</div>
                                        </div>
                                        
                                        {/* Table Body */}
                                        <div className="divide-y divide-slate-100 dark:divide-[#1A2E24]">
                                            {filteredAttLogs.map((log, index) => {
                                                const formattedDate = new Date(log.date).toLocaleDateString('id-ID', {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                });
                                                
                                                let badgeStyle = "";
                                                let statusLabel = "";
                                                switch (log.status) {
                                                    case 'present':
                                                        badgeStyle = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400";
                                                        statusLabel = "Hadir";
                                                        break;
                                                    case 'permission':
                                                        badgeStyle = "bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400";
                                                        statusLabel = "Izin";
                                                        break;
                                                    case 'sick':
                                                        badgeStyle = "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500";
                                                        statusLabel = "Sakit";
                                                        break;
                                                    case 'alpha':
                                                        badgeStyle = "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400";
                                                        statusLabel = "Alpha";
                                                        break;
                                                    default:
                                                        badgeStyle = "bg-slate-50 text-slate-600";
                                                        statusLabel = log.status || "-";
                                                }
 
                                                return (
                                                    <div 
                                                        key={log.id || index} 
                                                        className="w-full grid grid-cols-10 gap-4 py-4 border-b dark:border-white/5 items-center hover:bg-slate-50/50 dark:hover:bg-[#1C3026]/10 transition-colors text-slate-700 dark:text-slate-200"
                                                    >
                                                        <div className="col-span-4 font-bold text-slate-700 dark:text-[#E2EAE5] pl-1 text-left">
                                                            {formattedDate}
                                                        </div>
                                                        <div className="col-span-3 text-left">
                                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badgeStyle}`}>
                                                                {statusLabel}
                                                            </span>
                                                        </div>
                                                        <div className="col-span-3 text-slate-500 dark:text-[#8BA398] text-xs text-left">
                                                            {log.notes || '-'}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400">
                                    <Calendar className="mx-auto mb-2 text-slate-300" size={32} />
                                    <span>Tidak ada riwayat kehadiran untuk periode filter ini.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 flex-1 flex flex-col min-h-0">
            {/* Header Card */}
            <FloatingHeaderCard className="no-print">
                <Header
                    user={user}
                    onMenuClick={onMenuClick}
                    notifications={notifications}
                    onDismissNotification={onDismissNotification}
                    onSearchClick={onSearchClick}
                    flat={true}
                    title="Absensi Siswa"
                    subtitle="Catat kehadiran siswa hari ini"
                    unreadNotesCount={unreadNotesCount}
                />
            </FloatingHeaderCard>

            {isTableMissing && (
                <div className="bg-amber-50 dark:bg-[#2A2115] border border-amber-200 dark:border-[#4B3C27] p-4 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 mb-2 flex-none">
                    <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
                    <div className="text-xs md:text-sm text-amber-800 dark:text-[#E9D5C3] font-semibold leading-relaxed">
                        <span className="font-extrabold text-amber-900 dark:text-amber-300">Mode Penyimpanan Lokal Aktif:</span> Tabel <code className="bg-amber-100 dark:bg-[#3D2E1C] px-1.5 py-0.5 rounded text-amber-950 dark:text-amber-200 font-mono text-[11px]">attendance</code> belum dibuat di database Supabase Anda. Seluruh data absensi disimpan secara lokal di browser ini.
                    </div>
                </div>
            )}

            {/* Controls Bar */}
            <div className="bg-white dark:bg-[#12231A] p-4 rounded-2xl shadow-sm border border-emerald-100/60 dark:border-[#1E382B] flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Class Selector */}
                    <div className="relative">
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full sm:w-auto appearance-none bg-slate-50 dark:bg-[#0C1A13] border border-slate-200 dark:border-[#1E382B] text-slate-800 dark:text-[#E2EAE5] py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold cursor-pointer transition-colors"
                        >
                            <option value="Semua">Semua Kelas</option>
                            <option value="5B">Kelas 5B</option>
                            <option value="5C">Kelas 5C</option>
                            <option value="5D">Kelas 5D</option>
                            <option value="6C">Kelas 6C</option>
                            <option value="6D">Kelas 6D</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#6B8578] pointer-events-none" size={16} />
                    </div>

                    {/* Teacher Selector */}
                    <div className="relative">
                        <select
                            value={selectedTeacher}
                            onChange={(e) => setSelectedTeacher(e.target.value)}
                            className="w-full sm:w-auto appearance-none bg-slate-50 dark:bg-[#0C1A13] border border-slate-200 dark:border-[#1E382B] text-slate-800 dark:text-[#E2EAE5] py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold cursor-pointer transition-colors"
                        >
                            <option value="Semua">Semua Pengampu</option>
                            <option value="Ustadz Nawfal">Ustadz Nawfal</option>
                            <option value="Ustadzah Ining">Ustadzah Ining</option>
                            <option value="Ustadzah Rahma">Ustadzah Rahma</option>
                        </select>
                        <Users className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#6B8578] pointer-events-none" size={16} />
                    </div>


                    {/* Date Picker */}
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full sm:w-auto bg-slate-50 dark:bg-[#0C1A13] border border-slate-200 dark:border-[#1E382B] text-slate-800 dark:text-[#E2EAE5] py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition-colors cursor-pointer"
                    />
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#6B8578]" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama siswa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0C1A13] border border-slate-200 dark:border-[#1E382B] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 dark:text-[#E2EAE5] placeholder-slate-400 dark:placeholder-[#6B8578] transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* List Header Bar */}
            <div className="bg-white dark:bg-[#12231A] rounded-t-2xl border border-emerald-100/60 dark:border-[#1E382B] border-b-0 p-4 flex justify-between items-center transition-colors">
                <h3 className="font-bold text-slate-800 dark:text-[#E2EAE5] text-base">
                    Daftar Siswa <span className="text-emerald-700 dark:text-emerald-400 font-bold ml-1">({filteredStudents.length})</span>
                </h3>
                <button
                    onClick={markAllPresent}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 transition-all cursor-pointer"
                >
                    Tandai Semua Hadir
                </button>
            </div>

            {/* Attendance List Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide pb-28 pt-0">
                <div className="bg-white dark:bg-[#12231A] rounded-b-2xl border border-emerald-100/60 dark:border-[#1E382B] divide-y divide-slate-100 dark:divide-[#192E23] overflow-hidden shadow-sm transition-colors">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((student, index) => (
                            <div key={student.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-emerald-50/40 dark:hover:bg-[#16291F] transition-colors group">
                                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                                        {index + 1}
                                    </div>
                                    <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#0C1A13] object-cover border border-slate-200 dark:border-[#1E382B]" />
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white text-sm sm:text-base leading-tight">{student.name}</p>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/30">
                                                Kelas {student.class}
                                            </span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getAssignedTeacher(student.name, student.class, index).colorClass}`}>
                                                {getAssignedTeacher(student.name, student.class, index).name}
                                            </span>
                                        </div>
                                    </div>

                                </div>

                                <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-[#0C1A13] p-1.5 rounded-xl border border-slate-200/60 dark:border-[#1A2E24] w-full sm:w-auto justify-center">
                                    <button
                                        onClick={() => handleAttendanceChange(student.id, 'present')}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${attendance[student.id] === 'present'
                                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105 font-extrabold'
                                            : 'text-slate-600 dark:text-[#9FB8AB] hover:bg-slate-200 dark:hover:bg-[#16291F]'
                                            }`}
                                    >
                                        <Check size={14} /> Hadir
                                    </button>
                                    <button
                                        onClick={() => handleAttendanceChange(student.id, 'permission')}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${attendance[student.id] === 'permission'
                                            ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 scale-105 font-extrabold'
                                            : 'text-slate-600 dark:text-[#9FB8AB] hover:bg-slate-200 dark:hover:bg-[#16291F]'
                                            }`}
                                    >
                                        <FileText size={14} /> Izin
                                    </button>
                                    <button
                                        onClick={() => handleAttendanceChange(student.id, 'sick')}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${attendance[student.id] === 'sick'
                                            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 scale-105 font-extrabold'
                                            : 'text-slate-600 dark:text-[#9FB8AB] hover:bg-slate-200 dark:hover:bg-[#16291F]'
                                            }`}
                                    >
                                        <Clock size={14} /> Sakit
                                    </button>
                                    <button
                                        onClick={() => handleAttendanceChange(student.id, 'alpha')}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${attendance[student.id] === 'alpha'
                                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-105 font-extrabold'
                                            : 'text-slate-600 dark:text-[#9FB8AB] hover:bg-slate-200 dark:hover:bg-[#16291F]'
                                            }`}
                                    >
                                        <X size={14} /> Alpha
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-slate-400 dark:text-[#6B8578]">
                            <Users size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium text-sm">Tidak ada siswa ditemukan.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Save Action Button */}
            <div className="fixed bottom-[88px] right-6 sm:bottom-8 sm:right-10 z-40">
                <button
                    onClick={handleSaveAttendance}
                    disabled={isSaving}
                    className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm text-white transition-all duration-300 shadow-xl shadow-emerald-900/30 border border-emerald-400/30 cursor-pointer ${isSaving
                        ? 'bg-emerald-600 scale-105'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:scale-105 active:scale-95'
                        }`}
                >
                    {isSaving ? <CheckCircle2 size={20} className="animate-spin" /> : <Save size={20} />}
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Absensi'}</span>
                </button>
            </div>
        </div>
    );
};

export default AttendancePage;
