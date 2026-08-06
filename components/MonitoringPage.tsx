import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Users, CheckCircle, AlertCircle, PlusCircle, Filter, ChevronDown, User as UserIcon } from 'lucide-react';
import { Student, User } from '../types';
import { loadSetoranLogs, getAssignedTeacher } from '../services/appData';
import { isSupabaseConfigured } from '../lib/supabase';
import Header from './Header';

interface MonitoringPageProps {
    students: Student[];
    onQuickInput: (student: Student) => void;
    onViewProfile?: (student: Student) => void;
    user: User;
    onMenuClick: () => void;
    notifications?: Student[];
    onDismissNotification?: (studentId: string) => void;
    onSearchClick?: () => void;
}

const getActiveClassAtTime = (): string | null => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = days[now.getDay()];
    
    const schedules: Record<string, Array<{ className: string; start: string; end: string }>> = {
        'Senin': [
            { className: '5C', start: '07:30', end: '08:40' },
            { className: '6D', start: '08:40', end: '09:50' },
            { className: '6C', start: '10:05', end: '11:15' },
            { className: '5D', start: '11:15', end: '12:25' },
            { className: '5B', start: '13:10', end: '13:45' }
        ],
        'Selasa': [
            { className: '6C', start: '07:30', end: '08:40' },
            { className: '5B', start: '08:40', end: '09:50' },
            { className: '5C', start: '10:05', end: '11:15' },
            { className: '6D', start: '13:10', end: '13:45' },
            { className: '5D', start: '13:45', end: '14:55' }
        ],
        'Rabu': [
            { className: '5B', start: '07:30', end: '08:40' },
            { className: '5C', start: '10:05', end: '11:15' },
            { className: '6D', start: '11:15', end: '12:25' },
            { className: '6C', start: '13:10', end: '13:45' },
            { className: '5D', start: '13:45', end: '14:55' }
        ],
        'Kamis': [
            { className: '5B', start: '08:40', end: '09:50' },
            { className: '6C', start: '10:05', end: '11:15' },
            { className: '6D', start: '11:15', end: '12:25' },
            { className: '5C', start: '13:10', end: '13:45' },
            { className: '5D', start: '14:20', end: '14:55' }
        ]
    };

    const daySchedules = schedules[dayName];
    if (!daySchedules) return null;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const active = daySchedules.find((schedule) => {
        const [startH, startM] = schedule.start.split(':').map(Number);
        const [endH, endM] = schedule.end.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        return currentMinutes >= (startMinutes - 10) && currentMinutes <= endMinutes;
    });

    return active ? active.className : null;
};

const MonitoringPage: React.FC<MonitoringPageProps> = ({ 
    students, 
    onQuickInput,
    onViewProfile,
    user,
    onMenuClick,
    notifications = [],
    onDismissNotification,
    onSearchClick
}) => {
    const [hasManuallySelected, setHasManuallySelected] = useState(false);

    const [selectedClass, setSelectedClass] = useState<string>(() => {
        const active = getActiveClassAtTime();
        if (active) return active;
        return localStorage.getItem('tqa_monitoring_selected_class') || 'Semua';
    });
    const [selectedTeacher, setSelectedTeacher] = useState<string>(() => {
        return localStorage.getItem('tqa_monitoring_selected_teacher') || 'Semua';
    });
    const [activeTeacher, setActiveTeacher] = useState<string>(() => {
        return localStorage.getItem('tqa_monitoring_selected_teacher') || 'Semua';
    });
    const [selectedDate, setSelectedDate] = useState(() => {
        const storedDate = localStorage.getItem('tqa_monitoring_selected_date');
        if (storedDate) return storedDate;
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().slice(0, 10);
    });

    // Active filters used for rendering the list (to prevent instant switches before fade transitions)
    const [activeClass, setActiveClass] = useState<string>(() => {
        const active = getActiveClassAtTime();
        if (active) return active;
        return localStorage.getItem('tqa_monitoring_selected_class') || 'Semua';
    });
    const [activeDate, setActiveDate] = useState<string>(() => {
        const storedDate = localStorage.getItem('tqa_monitoring_selected_date');
        if (storedDate) return storedDate;
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().slice(0, 10);
    });

    useEffect(() => {
        localStorage.setItem('tqa_monitoring_selected_class', selectedClass);
    }, [selectedClass]);

    useEffect(() => {
        localStorage.setItem('tqa_monitoring_selected_teacher', selectedTeacher);
    }, [selectedTeacher]);

    useEffect(() => {
        localStorage.setItem('tqa_monitoring_selected_date', selectedDate);
    }, [selectedDate]);

    const handleClassSelect = (cls: string) => {
        setHasManuallySelected(true);
        setSelectedClass(cls);
    };

    const handleDateChange = (dateVal: string) => {
        setHasManuallySelected(false);
        setSelectedDate(dateVal);
    };

    // Auto-select active class based on schedule
    useEffect(() => {
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        const todayStr = localDate.toISOString().slice(0, 10);

        const checkActiveClass = () => {
            if (selectedDate === todayStr && !hasManuallySelected) {
                const active = getActiveClassAtTime();
                if (active && selectedClass !== active) {
                    setSelectedClass(active);
                    setActiveClass(active);
                }
            }
        };

        checkActiveClass();
        const intervalId = setInterval(checkActiveClass, 30000); // Check every 30s
        return () => clearInterval(intervalId);
    }, [selectedDate, hasManuallySelected, selectedClass]);

    const [logs, setLogs] = useState<any[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Initial mount loading
    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            try {
                if (isSupabaseConfigured) {
                    const remoteLogs = await loadSetoranLogs(selectedDate, selectedClass);
                    if (isMounted) {
                        setLogs(remoteLogs);
                        setActiveClass(selectedClass);
                        setActiveDate(selectedDate);
                        setActiveTeacher(selectedTeacher);
                    }
                } else {
                    const currentLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
                    if (isMounted) {
                        setLogs(currentLogs);
                        setActiveClass(selectedClass);
                        setActiveDate(selectedDate);
                    setActiveTeacher(selectedTeacher);
                    }
                }
            } catch (e) {
                console.error('Failed to load initial setoran logs:', e);
                const currentLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
                if (isMounted) {
                    setLogs(currentLogs);
                    setActiveClass(selectedClass);
                    setActiveDate(selectedDate);
                    setActiveTeacher(selectedTeacher);
                }
            } finally {
                if (isMounted) {
                    setIsInitialLoading(false);
                }
            }
        };

        const timer = setTimeout(loadInitialData, 800); // 800ms initial mount skeleton simulation
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    // Filter change loading (asynchronous fetching emulation with dimming transition)
    useEffect(() => {
        if (isInitialLoading) return;

        let isMounted = true;
        const fetchLogs = async () => {
            setIsFetching(true);
            try {
                if (isSupabaseConfigured) {
                    const remoteLogs = await loadSetoranLogs(selectedDate, selectedClass);
                    if (isMounted) {
                        setLogs(remoteLogs);
                        setActiveClass(selectedClass);
                        setActiveDate(selectedDate);
                        setActiveTeacher(selectedTeacher);
                    }
                } else {
                    const currentLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
                    if (isMounted) {
                        setLogs(currentLogs);
                        setActiveClass(selectedClass);
                        setActiveDate(selectedDate);
                        setActiveTeacher(selectedTeacher);
                    }
                }
            } catch (e) {
                console.error('Failed to update logs on filter change:', e);
                const currentLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
                if (isMounted) {
                    setLogs(currentLogs);
                    setActiveClass(selectedClass);
                    setActiveDate(selectedDate);
                    setActiveTeacher(selectedTeacher);
                }
            } finally {
                if (isMounted) {
                    setIsFetching(false);
                }
            }
        };

        const timer = setTimeout(fetchLogs, 500); // 500ms dimming effect to simulate remote database fetch
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [selectedDate, selectedClass, selectedTeacher, isInitialLoading]);

    // Live update listener when tab or window focuses
    useEffect(() => {
        let isMounted = true;
        const handleFocus = async () => {
            try {
                if (isSupabaseConfigured) {
                    const remoteLogs = await loadSetoranLogs(selectedDate, selectedClass);
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
                console.error('Failed to reload logs on focus:', e);
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => {
            isMounted = false;
            window.removeEventListener('focus', handleFocus);
        };
    }, [selectedDate, selectedClass]);

    // Scroll listener to toggle header shadow
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

    const classes = ['Semua', '5B', '5C', '5D', '6C', '6D'];

    const { sudahSetor, belumSetor } = useMemo(() => {
        let studentsInClass = students.filter(s => activeClass === 'Semua' || s.class === activeClass);
        if (activeTeacher !== 'Semua') {
            studentsInClass = studentsInClass.filter(s => {
                const classStudents = students
                    .filter(cs => cs.class === s.class)
                    .sort((a, b) => a.name.localeCompare(b.name));
                const idx = classStudents.findIndex(cs => cs.id === s.id);
                if (idx === -1) return false;
                const teacherInfo = getAssignedTeacher(s.name, s.class, idx);
                return teacherInfo.name === activeTeacher;
            });
        }
        
        // Match only the date part in the client's local timezone (YYYY-MM-DD)
        const dayLogs = logs.filter((log: any) => {
            if (!log.date) return false;
            try {
                const logLocalDate = new Date(log.date);
                const offset = logLocalDate.getTimezoneOffset();
                const adjustedDate = new Date(logLocalDate.getTime() - (offset * 60 * 1000));
                const logDateStr = adjustedDate.toISOString().slice(0, 10);
                return logDateStr === activeDate;
            } catch (e) {
                return log.date.slice(0, 10) === activeDate;
            }
        });

        const sudah: { student: Student; log: any }[] = [];
        const belum: Student[] = [];

        studentsInClass.forEach(student => {
            const studentDayLogs = dayLogs.filter((log: any) => log.studentId === student.id);
            if (studentDayLogs.length > 0) {
                // Get the latest log of the day
                const latestLog = [...studentDayLogs].sort((a: any, b: any) => b.date.localeCompare(a.date))[0];
                sudah.push({ student, log: latestLog });
            } else {
                belum.push(student);
            }
        });

        return { sudahSetor: sudah, belumSetor: belum };
    }, [students, activeClass, activeDate, activeTeacher, logs]);

    const renderSkeleton = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column 1 Skeleton: Sudah Setor */}
            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl pt-3 pb-5 px-5 flex flex-col gap-4">
                <div className="flex items-center justify-center bg-emerald-600 w-full py-3 px-4 rounded-xl shadow-sm mb-4">
                    <div className="h-6 w-36 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 w-full">
                                <div className="w-11 h-11 bg-slate-200 rounded-full animate-pulse shrink-0"></div>
                                <div className="space-y-2 w-full">
                                    <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                                    <div className="h-3 bg-slate-100 rounded w-1/3 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Column 2 Skeleton: Belum Setor */}
            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl pt-3 pb-5 px-5 flex flex-col gap-4">
                <div className="flex items-center justify-center bg-rose-600 w-full py-3 px-4 rounded-xl shadow-sm mb-4">
                    <div className="h-6 w-36 bg-rose-500 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 w-full">
                                <div className="w-11 h-11 bg-slate-200 rounded-full animate-pulse shrink-0"></div>
                                <div className="space-y-2 w-full">
                                    <div className="h-4 bg-slate-200 rounded w-2/5 animate-pulse"></div>
                                    <div className="h-3 bg-slate-100 rounded w-1/4 animate-pulse"></div>
                                </div>
                            </div>
                            <div className="w-28 h-9 bg-slate-200 rounded-xl animate-pulse shrink-0"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 lg:space-y-0 lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden animate-in fade-in duration-500 font-sans pb-10 lg:pb-0 h-full">
            {/* Sticky Container Wrapper */}
            <div className="sticky top-4 z-30 bg-gradient-to-br from-white to-emerald-50/60 dark:bg-[#15231A] dark:bg-none p-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-lg dark:shadow-black/30 border border-emerald-400 dark:border-white/15 flex justify-between items-center mt-4 sm:mt-6 mb-8 flex-none">
                <Header
                    user={user}
                    onMenuClick={onMenuClick}
                    notifications={notifications}
                    onDismissNotification={onDismissNotification}
                    onSearchClick={onSearchClick}
                    flat={true}
                    title="Monitoring Harian"
                    subtitle="Pantau setoran siswa secara operasional setiap hari"
                />
            </div>

            {/* Filter Controls Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="font-bold text-slate-800">Filter Pencarian</h3>
                        <p className="text-slate-500 text-xs mt-0.5">Tentukan tanggal untuk dipantau</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                        {/* Teacher Selector */}
                        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block ml-1">Pilih Pengampu</label>
                            <div className="relative min-w-[180px]">
                                <select
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2.5 rounded-2xl border border-slate-200 font-bold text-slate-700 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-sm h-[48px] shadow-sm transition-all appearance-none"
                                >
                                    <option value="Semua">Semua Pengampu</option>
                                    <option value="Ustadz Nawfal">Ustadz Nawfal</option>
                                    <option value="Ustadzah Ining">Ustadzah Ining</option>
                                    <option value="Ustadzah Rahma">Ustadzah Rahma</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Date Picker */}
                        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block ml-1">Pilih Tanggal</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="w-full pl-4 pr-4 py-2.5 rounded-2xl border border-slate-200 font-bold text-slate-700 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-sm h-[48px] shadow-sm transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider line */}
                <div className="h-px bg-slate-100"></div>

                {/* Class filter toolbar */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex items-center gap-2 pr-3 border-r border-slate-200 mr-2 text-slate-400">
                        <Filter size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Kelas:</span>
                    </div>
                    {classes.map((cls) => (
                        <button
                            key={cls}
                            onClick={() => handleClassSelect(cls)}
                            className={`
                                px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
                                ${selectedClass === cls
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                }
                            `}
                        >
                            {cls === 'Semua' ? 'Semua Kelas' : `Kelas ${cls}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Content Area */}
            <div className="flex-1 flex flex-col mt-8 lg:overflow-hidden">
                {/* Content Switch: Skeleton or Restructured Grid */}
                {isInitialLoading ? (
                    renderSkeleton()
                ) : (
                    <div className={`grid grid-cols-1 gap-6 lg:flex lg:flex-1 lg:gap-8 transition-opacity duration-300 lg:overflow-hidden ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        {/* Column 1: Sudah Setor */}
                        <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl pt-3 pb-5 px-5 flex flex-col gap-4 lg:h-full lg:w-full lg:overflow-hidden">
                            <div className="flex-none flex items-center justify-center bg-emerald-600 w-full py-3 px-4 rounded-xl shadow-sm mb-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-300"></span>
                                    Sudah Setor
                                    <span className="bg-emerald-500 text-white border border-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold ml-1">
                                        {sudahSetor.length} Siswa
                                    </span>
                                </h3>
                            </div>

                            <div className="space-y-3 lg:flex-1 lg:overflow-y-auto scrollbar-hide lg:pb-12 lg:pr-1">
                            {sudahSetor.length > 0 ? (
                                sudahSetor.map(({ student, log }) => (
                                    <div
                                        key={student.id}
                                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-emerald-200 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <img src={student.avatar} alt={student.name} className="w-11 h-11 rounded-full object-cover border border-slate-100" />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <h4 
                                                        onClick={() => onViewProfile && onViewProfile(student)}
                                                        className="font-bold text-slate-800 text-sm truncate hover:text-emerald-600 hover:underline cursor-pointer transition-all"
                                                        title="Lihat Detail Informasi Siswa"
                                                    >
                                                        {student.name}
                                                    </h4>
                                                    {onViewProfile && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onViewProfile(student);
                                                            }}
                                                            className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-0.5 rounded-lg transition-colors cursor-pointer shrink-0"
                                                            title="Lihat Detail Informasi Siswa"
                                                        >
                                                            <UserIcon size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 font-semibold">
                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">{student.class}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-emerald-600 font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                                                        {log.type === 'Hafalan' ? 'Hafalan' : 'Tartili'}
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="truncate max-w-[150px]">{log.currentSurah}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end justify-center shrink-0 min-w-[70px] text-right">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">NILAI</span>
                                            <span className="font-black text-slate-800 text-base mt-1.5 leading-none">{log.score || log.lastScore || '-'}</span>
                                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold mt-2 whitespace-nowrap border ${
                                                log.status === 'Mumtaz' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                log.status === 'Perlu Bimbingan' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {log.status === 'Mumtaz' ? <CheckCircle size={8} /> : <AlertCircle size={8} />}
                                                {log.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 font-medium">Belum ada siswa yang menyetorkan hafalan/tartili hari ini.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column 2: Belum Setor */}
                    <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl pt-3 pb-5 px-5 flex flex-col gap-4 lg:h-full lg:w-full lg:overflow-hidden">
                        <div className="flex-none flex items-center justify-center bg-rose-600 w-full py-3 px-4 rounded-xl shadow-sm mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-200"></span>
                                </span>
                                Belum Setor
                                <span className="bg-rose-500 text-white border border-rose-400 text-xs px-2.5 py-0.5 rounded-full font-bold ml-1">
                                    {belumSetor.length} Siswa
                                </span>
                            </h3>
                        </div>

                        <div className="space-y-3 lg:flex-1 lg:overflow-y-auto scrollbar-hide lg:pb-12 lg:pr-1">
                            {belumSetor.length > 0 ? (
                                belumSetor.map((student) => (
                                    <div
                                        key={student.id}
                                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-emerald-200 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <img src={student.avatar} alt={student.name} className="w-11 h-11 rounded-full object-cover border border-slate-100" />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <h4 
                                                        onClick={() => onViewProfile && onViewProfile(student)}
                                                        className="font-bold text-slate-800 text-sm truncate hover:text-emerald-600 hover:underline cursor-pointer transition-all"
                                                        title="Lihat Detail Informasi Siswa"
                                                    >
                                                        {student.name}
                                                    </h4>
                                                    {onViewProfile && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onViewProfile(student);
                                                            }}
                                                            className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-0.5 rounded-lg transition-colors cursor-pointer shrink-0"
                                                            title="Lihat Detail Informasi Siswa"
                                                        >
                                                            <UserIcon size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-semibold">
                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">{student.class}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span>Belum ada setoran masuk</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => onQuickInput(student)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 font-extrabold text-xs transition-all duration-200 hover:bg-emerald-100 hover:text-emerald-700 hover:scale-105 active:scale-95 cursor-pointer shadow-sm shrink-0"
                                        >
                                            <PlusCircle size={14} />
                                            <span>Input Setoran</span>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 font-medium">Semua siswa kelas ini sudah menyetorkan hafalannya!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default MonitoringPage;
