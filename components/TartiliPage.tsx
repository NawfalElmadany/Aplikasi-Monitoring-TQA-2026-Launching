import React, { useState, useEffect, useMemo } from 'react';
import { 
    Scroll, CheckCircle2, ChevronRight, ChevronLeft, Plus, Users, Save, X, BookOpen, StickyNote, Calendar, Pencil, Trash2,
    TrendingUp, Star, CalendarCheck, MessageSquare, Award
} from 'lucide-react';
import { Student, User } from '../types';
import Header from './Header';
import FloatingHeaderCard from './FloatingHeaderCard';
import { loadStudentSetoranLogs, loadStudentAttendanceLogs, getAssignedTeacher } from '../services/appData';
import { isSupabaseConfigured } from '../lib/supabase';

interface TartiliPageProps {
    students?: Student[];
    user: User | null;
    onMenuClick: () => void;
    notifications?: Student[];
    onDismissNotification?: (studentId: string) => void;
    onSearchClick?: () => void;
    unreadNotesCount?: number;
}

interface TartiliEntry {
    id: string | number;
    className: string;
    date: string;
    status: 'Lanjut' | 'Mengulang';
    jilid: string;
    startPage: string | number;
    endPage: string | number;
    notes?: string;
}

const INITIAL_SCHEDULE: TartiliEntry[] = [
    { id: 1, className: '5B', date: '2026-06-30', status: 'Lanjut', jilid: 'Jilid 4', startPage: 20, endPage: 25, notes: 'Lancar' },
    { id: 2, className: '5C', date: '2026-06-29', status: 'Lanjut', jilid: 'Jilid 3', startPage: 10, endPage: 15, notes: 'Lancar' },
    { id: 3, className: '5D', date: '2026-06-28', status: 'Mengulang', jilid: 'Jilid 5', startPage: 1, endPage: 5, notes: 'Beberapa santri kurang lancar' },
    { id: 4, className: '6C', date: '2026-06-27', status: 'Lanjut', jilid: 'Al-Qur\'an', startPage: 10, endPage: 12, notes: 'Lancar' },
];

const TartiliPage: React.FC<TartiliPageProps> = ({ 
    user, 
    students,
    onMenuClick,
    notifications = [],
    onDismissNotification,
    onSearchClick,
    unreadNotesCount = 0
}) => {
    const [schedule, setSchedule] = useState<TartiliEntry[]>(() => {
        const saved = localStorage.getItem('tqa_tartili_classical_history');
        return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
    });

    // Student states and memos for personalized view
    const [studentLogs, setStudentLogs] = useState<any[]>([]);
    const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);

    const currentStudent = useMemo(() => {
        if (!students || !user) return null;
        return students.find(s => s.name === user.name || s.id === user.studentId);
    }, [students, user]);

    useEffect(() => {
        if (user?.role !== 'student' || !currentStudent) return;
        let isMounted = true;
        const loadLogs = async () => {
            try {
                if (isSupabaseConfigured) {
                    const remoteLogs = await loadStudentSetoranLogs(currentStudent.id);
                    if (isMounted) setStudentLogs(remoteLogs);
                } else {
                    const localLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
                    if (isMounted) setStudentLogs(localLogs);
                }
            } catch (e) {
                console.error(e);
                const localLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
                if (isMounted) setStudentLogs(localLogs);
            }
        };
        const loadAttendance = async () => {
            try {
                const remoteAtt = await loadStudentAttendanceLogs(currentStudent.id);
                if (isMounted) setAttendanceLogs(remoteAtt);
            } catch (e) {
                console.error(e);
            }
        };
        loadLogs();
        loadAttendance();
        return () => {
            isMounted = false;
        };
    }, [currentStudent, user]);

    const tartiliLogs = useMemo(() => {
        if (!currentStudent) return [];
        return studentLogs
            .filter((log: any) => 
                (log.studentId === currentStudent.id) && 
                (log.type === 'Tartili' || log.type === 'Drill Tartili')
            )
            .sort((a: any, b: any) => b.date.localeCompare(a.date));
    }, [currentStudent, studentLogs]);

    const stats = useMemo(() => {
        if (tartiliLogs.length === 0) {
            return {
                total: 0,
                average: 0,
                lastNote: 'Belum ada catatan setoran.'
            };
        }

        const scoredLogs = tartiliLogs.filter((log: any) => typeof log.score === 'number' && !isNaN(log.score));
        const totalScore = scoredLogs.reduce((acc: number, log: any) => acc + log.score, 0);
        const average = scoredLogs.length > 0 ? Math.round(totalScore / scoredLogs.length) : 0;
        
        // Find last note
        const lastLogWithNote = tartiliLogs.find((log: any) => log.notes && log.notes.trim().length > 0);
        const lastNote = lastLogWithNote ? lastLogWithNote.notes : 'Tidak ada catatan khusus pada setoran terakhir.';

        return {
            total: tartiliLogs.length,
            average,
            lastNote
        };
    }, [tartiliLogs]);

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
        const percentage = Math.round((present / attendanceLogs.length) * 100);

        return {
            total: attendanceLogs.length,
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

    const [showInput, setShowInput] = useState(false);
    const [selectedClass, setSelectedClass] = useState('');
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [status, setStatus] = useState<'Lanjut' | 'Mengulang'>('Lanjut');
    const [selectedJilid, setSelectedJilid] = useState('');
    const [startPage, setStartPage] = useState('');
    const [endPage, setEndPage] = useState('');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [viewingClass, setViewingClass] = useState<string | null>(null);

    // Filtering states (detail view)
    const [filterMonth, setFilterMonth] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Edit states (Edit Modal)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedJurnal, setSelectedJurnal] = useState<TartiliEntry | null>(null);
    const [editDate, setEditDate] = useState('');
    const [editClass, setEditClass] = useState('');
    const [editStatus, setEditStatus] = useState<'Lanjut' | 'Mengulang'>('Lanjut');
    const [editJilid, setEditJilid] = useState('');
    const [editStartPage, setEditStartPage] = useState('');
    const [editEndPage, setEditEndPage] = useState('');
    const [editNotes, setEditNotes] = useState('');

    // Save schedule to local storage
    useEffect(() => {
        localStorage.setItem('tqa_tartili_classical_history', JSON.stringify(schedule));
    }, [schedule]);

    // Auto-fill logic when "Mengulang" is selected (Add Form)
    useEffect(() => {
        if (status === 'Mengulang' && selectedClass) {
            const classEntries = schedule
                .filter(entry => entry.className === selectedClass)
                .sort((a, b) => b.date.localeCompare(a.date));

            if (classEntries.length > 0) {
                setSelectedJilid(classEntries[0].jilid);
                setStartPage(String(classEntries[0].startPage));
                setEndPage(String(classEntries[0].endPage));
            }
        }
    }, [status, selectedClass, schedule]);

    // Auto-fill logic when "Mengulang" is selected (Edit Form)
    useEffect(() => {
        if (editStatus === 'Mengulang' && editClass) {
            const classEntries = schedule
                .filter(entry => entry.className === editClass && (!selectedJurnal || entry.id !== selectedJurnal.id))
                .sort((a, b) => b.date.localeCompare(a.date));

            if (classEntries.length > 0) {
                setEditJilid(classEntries[0].jilid);
                setEditStartPage(String(classEntries[0].startPage));
                setEditEndPage(String(classEntries[0].endPage));
            }
        }
    }, [editStatus, editClass, schedule, selectedJurnal]);

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

    const handleSave = () => {
        if (!selectedClass || !selectedJilid || !startPage || !endPage) {
            alert('Semua pilihan kelas, jilid, dan halaman harus diisi.');
            return;
        }

        setIsSaving(true);
        playSuccessSound();

        setTimeout(() => {
            const newEntry: TartiliEntry = {
                id: Date.now(),
                className: selectedClass,
                date,
                status,
                jilid: selectedJilid,
                startPage: parseInt(startPage),
                endPage: parseInt(endPage),
                notes: notes.trim() || undefined
            };

            setSchedule([newEntry, ...schedule]);
            setShowInput(false);
            setSelectedClass('');
            setSelectedJilid('');
            setStartPage('');
            setEndPage('');
            setNotes('');
            setDate(new Date().toISOString().slice(0, 10));
            setStatus('Lanjut');
            setIsSaving(false);
        }, 600);
    };

    const handleEditClick = (entry: TartiliEntry) => {
        setSelectedJurnal(entry);
        setEditDate(entry.date);
        setEditClass(entry.className);
        setEditStatus(entry.status);
        setEditJilid(entry.jilid);
        setEditStartPage(String(entry.startPage));
        setEditEndPage(String(entry.endPage));
        setEditNotes(entry.notes || '');
        setIsEditModalOpen(true);
    };

    const handleSaveJurnal = () => {
        if (!selectedJurnal) return;
        if (!editClass || !editJilid || !editStartPage || !editEndPage) {
            alert('Semua pilihan kelas, jilid, dan halaman harus diisi.');
            return;
        }

        setIsSaving(true);
        playSuccessSound();

        setTimeout(() => {
            const updated = schedule.map(entry => {
                if (entry.id === selectedJurnal.id) {
                    return {
                        ...entry,
                        className: editClass,
                        date: editDate,
                        status: editStatus,
                        jilid: editJilid,
                        startPage: parseInt(editStartPage),
                        endPage: parseInt(editEndPage),
                        notes: editNotes.trim() || undefined
                    };
                }
                return entry;
            });

            setSchedule(updated);
            setIsEditModalOpen(false);
            setSelectedJurnal(null);
            setIsSaving(false);
        }, 500);
    };

    const handleDeleteClick = (id: string | number) => {
        if (confirm('Apakah Anda yakin ingin menghapus data jurnal Tartili ini?')) {
            setSchedule(schedule.filter(entry => entry.id !== id));
        }
    };

    const formatIndonesianDate = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const [year, month, day] = parts;
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
    };

    const formatIndonesianDateShort = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const [, month, day] = parts;
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Juni',
            'Juli', 'Agt', 'Sept', 'Okt', 'Nov', 'Des'
        ];
        return `${parseInt(day)} ${months[parseInt(month) - 1]}`;
    };




    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            {viewingClass ? (() => {
                const classEntries = schedule.filter(j => j.className === viewingClass);
                const filteredJurnal = classEntries.filter(j => {
                    if (filterMonth && !formatIndonesianDate(j.date).includes(filterMonth)) {
                        return false;
                    }
                    if (startDate && j.date < startDate) {
                        return false;
                    }
                    if (endDate && j.date > endDate) {
                        return false;
                    }
                    return true;
                }).sort((a, b) => b.date.localeCompare(a.date));

                const latestEntryForClass = classEntries.sort((a, b) => b.date.localeCompare(a.date))[0];

                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Header Section */}
                        <FloatingHeaderCard className="no-print">
                            <Header
                                user={user!}
                                onMenuClick={onMenuClick}
                                notifications={notifications}
                                onDismissNotification={onDismissNotification}
                                onSearchClick={onSearchClick}
                                flat={true}
                                title={`Tartili Klasikal - Kelas ${viewingClass}`}
                                subtitle="Program Pembelajaran Tartili"
                                unreadNotesCount={unreadNotesCount}
                                backButton={
                                    <button
                                        onClick={() => {
                                            setViewingClass(null);
                                            setShowInput(false);
                                            setFilterMonth('');
                                            setStartDate('');
                                            setEndDate('');
                                        }}
                                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 dark:text-[#8BA398] dark:hover:text-emerald-400 transition-colors cursor-pointer mb-1.5"
                                    >
                                        <ChevronLeft size={16} />
                                        <span>Kembali ke Dasbor Tartili</span>
                                    </button>
                                }
                                actionButton={
                                    user?.role === 'teacher' && (
                                        <button
                                            onClick={() => {
                                                setSelectedClass(viewingClass);
                                                setShowInput(true);
                                            }}
                                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm text-sm cursor-pointer"
                                        >
                                            <Plus size={18} />
                                            <span>Input Jurnal Baru</span>
                                        </button>
                                    )
                                }
                            />
                        </FloatingHeaderCard>

                        {/* Input form inside Class Detail View */}
                        {showInput && (
                            <div className="bg-white dark:bg-[#15231A] border border-slate-200 dark:border-white/15 p-6 rounded-2xl shadow-xl shadow-black/40 animate-in slide-in-from-top-4">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <Users size={20} className="text-emerald-600 dark:text-emerald-400" />
                                        Jurnal Pembelajaran Tartili (Klasikal) - Kelas {viewingClass}
                                    </h3>
                                    <button onClick={() => setShowInput(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Tanggal</label>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Jilid / Tingkat</label>
                                        <select
                                            value={selectedJilid}
                                            onChange={(e) => setSelectedJilid(e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer"
                                        >
                                            <option value="">Pilih Jilid</option>
                                            <option value="Jilid 1">Jilid 1</option>
                                            <option value="Jilid 2">Jilid 2</option>
                                            <option value="Jilid 3">Jilid 3</option>
                                            <option value="Jilid 4">Jilid 4</option>
                                            <option value="Jilid 5">Jilid 5</option>
                                            <option value="Jilid 6">Jilid 6</option>
                                            <option value="Al-Qur'an">Al-Qur'an</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Status Pembelajaran</label>
                                        <div className="flex gap-4 items-center h-[38px]">
                                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-[#E2EAE5] text-sm">
                                                <input
                                                    type="radio"
                                                    name="tartili-status"
                                                    value="Lanjut"
                                                    checked={status === 'Lanjut'}
                                                    onChange={() => setStatus('Lanjut')}
                                                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                                />
                                                <span>Lanjut</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-[#E2EAE5] text-sm">
                                                <input
                                                    type="radio"
                                                    name="tartili-status"
                                                    value="Mengulang"
                                                    checked={status === 'Mengulang'}
                                                    onChange={() => setStatus('Mengulang')}
                                                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                                />
                                                <span>Mengulang</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Halaman Mulai</label>
                                        <input
                                            type="number"
                                            value={startPage}
                                            onChange={e => setStartPage(e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                                            placeholder="Contoh: 1"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Halaman Selesai</label>
                                        <input
                                            type="number"
                                            value={endPage}
                                            onChange={e => setEndPage(e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                                            placeholder="Contoh: 5"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Catatan Tambahan</label>
                                        <textarea
                                            placeholder="Catat kendala siswa, atau info pertemuan klasikal berikutnya..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer"
                                    >
                                        <Save size={16} />
                                        <span>Simpan Jurnal</span>
                                    </button>
                                </div>
                            </div>
                        )}


                        {/* Stat Cards */}
                        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white dark:bg-[#111D16] border border-slate-200 dark:border-white/15 border-l-4 border-l-emerald-500 dark:border-l-emerald-500/50 shadow-lg shadow-black/[0.03] dark:shadow-black/20 rounded-xl p-5 flex items-center gap-4 transition-all hover:shadow-xl duration-300">
                                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pertemuan</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                                        {filteredJurnal.length} Kali
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#111D16] border border-slate-200 dark:border-white/15 border-l-4 border-l-emerald-500 dark:border-l-emerald-500/50 shadow-lg shadow-black/[0.03] dark:shadow-black/20 rounded-xl p-5 flex items-center gap-4 transition-all hover:shadow-xl duration-300">
                                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <BookOpen size={24} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Saat Ini</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white mt-1 truncate max-w-[200px]" title={latestEntryForClass ? `${latestEntryForClass.jilid} (Hal. ${latestEntryForClass.startPage}-${latestEntryForClass.endPage})` : 'Belum ada'}>
                                        {latestEntryForClass ? `${latestEntryForClass.jilid} (Hal. ${latestEntryForClass.startPage}-${latestEntryForClass.endPage})` : 'Belum ada'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#111D16] border border-slate-200 dark:border-white/15 border-l-4 border-l-emerald-500 dark:border-l-emerald-500/50 shadow-lg shadow-black/[0.03] dark:shadow-black/20 rounded-xl p-5 flex items-center gap-4 transition-all hover:shadow-xl duration-300">
                                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <StickyNote size={24} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Catatan Terakhir</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white mt-1 truncate" title={latestEntryForClass?.notes || 'Tidak ada catatan.'}>
                                        {latestEntryForClass?.notes || 'Tidak ada catatan.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Chronological Logs */}
                        <div className="bg-white dark:bg-[#15231A] border border-slate-200 dark:border-white/15 rounded-xl p-6 mt-6 shadow-lg shadow-black/30 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-[#E2EAE5]">
                                        Riwayat Jurnal Kronologis
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-slate-400 dark:text-[#8BA398]">Bulan:</span>
                                            <select
                                                value={filterMonth}
                                                onChange={(e) => setFilterMonth(e.target.value)}
                                                className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                            >
                                                <option value="">Semua Bulan</option>
                                                <option value="Januari">Januari</option>
                                                <option value="Februari">Februari</option>
                                                <option value="Maret">Maret</option>
                                                <option value="April">April</option>
                                                <option value="Mei">Mei</option>
                                                <option value="Juni">Juni</option>
                                                <option value="Juli">Juli</option>
                                                <option value="Agustus">Agustus</option>
                                                <option value="September">September</option>
                                                <option value="Oktober">Oktober</option>
                                                <option value="November">November</option>
                                                <option value="Desember">Desember</option>
                                            </select>
                                        </div>
                                        
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-slate-400 dark:text-[#8BA398]">Rentang:</span>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                            />
                                            <span className="text-xs text-slate-400 dark:text-[#8BA398] font-bold">s.d.</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                            />
                                        </div>

                                        {(filterMonth || startDate || endDate) && (
                                            <button
                                                onClick={() => {
                                                    setFilterMonth('');
                                                    setStartDate('');
                                                    setEndDate('');
                                                }}
                                                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                                            >
                                                Reset Filter
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-[#1A2E24] text-slate-400 dark:text-[#8BA398] font-bold text-xs uppercase tracking-wider">
                                            <th className="py-3 px-4">Tanggal</th>
                                            <th className="py-3 px-4">Jilid / Materi</th>
                                            <th className="py-3 px-4 text-center">Status</th>
                                            <th className="py-3 px-4">Catatan</th>
                                            {user?.role === 'teacher' && <th className="py-3 px-4 text-right">Aksi</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-[#1A2E24]">
                                        {filteredJurnal.map((jurnal) => (
                                            <tr key={jurnal.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C3026]/10 transition-colors">
                                                <td className="py-4 px-4 font-bold text-slate-700 dark:text-[#E2EAE5] whitespace-nowrap">
                                                    {formatIndonesianDate(jurnal.date)}
                                                </td>
                                                <td className="py-4 px-4 font-black text-slate-800 dark:text-[#E2EAE5]">
                                                    {jurnal.jilid} (Hal. {jurnal.startPage}-{jurnal.endPage})
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                                                        jurnal.status === 'Lanjut' 
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                                                            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                                                    }`}>
                                                        {jurnal.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-slate-600 dark:text-[#8BA398] max-w-xs truncate">
                                                    {jurnal.notes || '-'}
                                                </td>
                                                {user?.role === 'teacher' && (
                                                    <td className="py-4 px-4 text-right whitespace-nowrap">
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                                onClick={() => handleEditClick(jurnal)}
                                                                className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteClick(jurnal.id)}
                                                                className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredJurnal.length === 0 && (
                                <div className="text-center py-12 text-slate-400 dark:text-[#8BA398]">
                                    Tidak ada data jurnal Tartili untuk periode ini.
                                </div>
                            )}
                        </div>
                    </div>
                );
            })() : (
                <>
                    {/* Header */}
                    <FloatingHeaderCard className="animate-in fade-in">
                        <Header
                            user={user!}
                            onMenuClick={onMenuClick}
                            notifications={notifications}
                            onDismissNotification={onDismissNotification}
                            onSearchClick={onSearchClick}
                            flat={true}
                            title={user?.role === 'teacher' ? "Tartili Klasikal" : "Pencapaian Tartili / Al-Qur'an Saya"}
                            subtitle={user?.role === 'teacher' ? "Jadwal dan riwayat pembelajaran bacaan" : "Catatan perkembangan bacaan Tartili dan Al-Qur'an Anda"}
                            unreadNotesCount={unreadNotesCount}
                            actionButton={
                                user?.role === 'teacher' && (
                                    <button
                                        onClick={() => setShowInput(true)}
                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
                                    >
                                        <Plus size={20} />
                                        <span>Catat Tartili</span>
                                    </button>
                                )
                            }
                        />
                    </FloatingHeaderCard>

                    {/* Dasbor Utama */}
                    {user?.role === 'teacher' ? (
                        <>
                            {/* Input form dashboard toggle */}
                            {showInput && (
                                <div className="bg-white dark:bg-[#15231A] border border-slate-200 dark:border-white/15 p-6 rounded-2xl shadow-xl shadow-black/40 animate-in slide-in-from-top-4 mb-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                            <Users size={20} className="text-emerald-600 dark:text-emerald-400" />
                                            Jurnal Pembelajaran Tartili Bersama (Klasikal)
                                        </h3>
                                        <button onClick={() => setShowInput(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="space-y-1">
                                            <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Pilih Kelas</label>
                                            <select
                                                value={selectedClass}
                                                onChange={(e) => setSelectedClass(e.target.value)}
                                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer"
                                            >
                                                <option value="">Pilih Kelas</option>
                                                <option value="5B">5B</option>
                                                <option value="5C">5C</option>
                                                <option value="5D">5D</option>
                                                <option value="6C">6C</option>
                                                <option value="6D">6D</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Tanggal</label>
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Jilid / Tingkat</label>
                                            <select
                                                value={selectedJilid}
                                                onChange={(e) => setSelectedJilid(e.target.value)}
                                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer"
                                            >
                                                <option value="">Pilih Jilid</option>
                                                <option value="Jilid 1">Jilid 1</option>
                                                <option value="Jilid 2">Jilid 2</option>
                                                <option value="Jilid 3">Jilid 3</option>
                                                <option value="Jilid 4">Jilid 4</option>
                                                <option value="Jilid 5">Jilid 5</option>
                                                <option value="Jilid 6">Jilid 6</option>
                                                <option value="Al-Qur'an">Al-Qur'an</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="space-y-1">
                                            <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Halaman Mulai</label>
                                            <input
                                                type="number"
                                                value={startPage}
                                                onChange={e => setStartPage(e.target.value)}
                                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                                                placeholder="Contoh: 1"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Halaman Selesai</label>
                                            <input
                                                type="number"
                                                value={endPage}
                                                onChange={e => setEndPage(e.target.value)}
                                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                                                placeholder="Contoh: 5"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Status Pembelajaran</label>
                                            <div className="flex gap-4 items-center h-[38px]">
                                                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-[#E2EAE5] text-sm">
                                                    <input
                                                        type="radio"
                                                        name="tartili-status-dash"
                                                        value="Lanjut"
                                                        checked={status === 'Lanjut'}
                                                        onChange={() => setStatus('Lanjut')}
                                                        className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                                    />
                                                    <span>Lanjut</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-[#E2EAE5] text-sm">
                                                    <input
                                                        type="radio"
                                                        name="tartili-status-dash"
                                                        value="Mengulang"
                                                        checked={status === 'Mengulang'}
                                                        onChange={() => setStatus('Mengulang')}
                                                        className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                                    />
                                                    <span>Mengulang</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4 space-y-1">
                                        <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Catatan Tambahan (Opsional)</label>
                                        <textarea
                                            placeholder="Catat kendala siswa, atau info pertemuan klasikal berikutnya..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer"
                                        >
                                            <Save size={16} />
                                            <span>Simpan Jurnal</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                             {/* Class Cards Grid */}
                             <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-6">
                                 {(() => {
                                     return ['5B', '5C', '5D', '6C', '6D'].map((className, idx) => {
                                         const count = schedule.filter(s => s.className === className).length;
                                         const hasData = count > 0;
                                         
                                         // Light mode themes
                                         const lightTheme = hasData 
                                             ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400/60"
                                             : "bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400/60";
 
                                         // Dark mode themes
                                         const darkTheme = hasData
                                             ? "dark:bg-[#15231A] dark:border-white/15 dark:text-emerald-400 dark:hover:border-emerald-500/40 dark:hover:shadow-emerald-500/10"
                                             : "dark:bg-[#15231A] dark:border-white/15 dark:text-amber-400 dark:hover:border-amber-500/40 dark:hover:shadow-amber-500/10";
                                             
                                         const badgeClass = hasData
                                             ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                             : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400";
                                             
                                         const iconContainerClass = hasData
                                             ? "bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                             : "bg-amber-100/50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400";
 
                                         return (
                                             <button
                                                 key={className}
                                                 onClick={() => setViewingClass(className)}
                                                 className={`w-full border rounded-xl p-3.5 sm:p-5 cursor-pointer shadow-sm dark:shadow-lg dark:shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md text-left relative overflow-hidden group ${lightTheme} ${darkTheme}`}
                                             >
                                                 <div className="relative z-10">
                                                     <div className="flex items-center justify-between mb-2.5 sm:mb-4">
                                                         <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${iconContainerClass}`}>
                                                             <Users size={16} className="sm:w-6 sm:h-6" />
                                                         </div>
                                                         <div className={`font-extrabold text-[9px] sm:text-xs rounded-md px-2 py-0.5 sm:px-3 sm:py-1 ${badgeClass}`}>
                                                             Lihat Data
                                                         </div>
                                                     </div>
                                                     <h3 className="text-sm sm:text-2xl font-black mb-0.5 sm:mb-1 text-slate-800 dark:text-white truncate">Kelas {className}</h3>
                                                     <p className={`text-[10px] sm:text-sm font-semibold truncate ${hasData ? 'text-slate-500 dark:text-emerald-400/80' : 'text-slate-500 dark:text-amber-400/80'}`}>
                                                         {count} Jurnal Tartili
                                                     </p>
                                                 </div>
                                             </button>
                                         );
                                     });
                                 })()}
                             </div>

                            {/* Tata Letak Dua Kolom */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                {/* Kolom Kiri: Tabel Log Jurnal Terbaru */}
                                <div className="lg:col-span-2 bg-[#F8FAFC]/60 dark:bg-[#111D16]/40 border border-slate-200/50 dark:border-white/5 rounded-3xl p-5 sm:p-6 shadow-sm transition-colors">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 mb-2 uppercase tracking-wide border border-emerald-200/30 dark:border-emerald-900/20">
                                                Rekomendasi Layout
                                            </span>
                                            <h3 className="text-lg font-black text-slate-800 dark:text-[#E2EAE5]">
                                                Log Jurnal Tartili Kelas
                                            </h3>
                                            <p className="text-xs text-slate-400 dark:text-[#8BA398] mt-0.5">Ringkasan progres materi terbaru.</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#15231A] border border-slate-200 dark:border-white/10 rounded-full shrink-0 shadow-sm">
                                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live</span>
                                        </div>
                                    </div>

                                    {/* Baris Data sebagai Kartu UI */}
                                    <div className="space-y-4">
                                        {schedule.slice(0, 10).map((jurnal) => (
                                            <div key={jurnal.id} className="bg-white dark:bg-[#15231A] border border-slate-100 dark:border-white/10 rounded-2xl p-4 sm:p-5 flex gap-4 sm:gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all">
                                                {/* Kolom Kiri: Blok Tanggal */}
                                                <div className="flex flex-col items-center justify-center border-r border-slate-100 dark:border-[#1A2E24] pr-4 sm:pr-6 min-w-[70px] sm:min-w-[85px] text-center">
                                                    {(() => {
                                                        const [year, month, day] = jurnal.date.split('-');
                                                        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                                                        const monthName = months[parseInt(month) - 1] || '';
                                                        return (
                                                            <>
                                                                <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white leading-none">
                                                                    {parseInt(day)}
                                                                </span>
                                                                <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-[#8BA398] mt-1">
                                                                    {monthName}
                                                                </span>
                                                                <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                                    {year}
                                                                </span>
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Kolom Tengah: Info Jilid/Materi & Kelas */}
                                                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                    <div>
                                                        <h4 className="text-base sm:text-lg font-black text-slate-800 dark:text-[#E2EAE5] leading-tight">
                                                            {jurnal.jilid}
                                                        </h4>
                                                        <p className="text-xs sm:text-sm text-slate-400 dark:text-[#8BA398] mt-1 font-semibold">
                                                            Hal. {jurnal.startPage} – {jurnal.endPage}
                                                        </p>
                                                    </div>
                                                    
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-[#09120E] text-slate-500 dark:text-[#8BA398] text-[10px] sm:text-xs font-bold rounded-lg border border-slate-200/50 dark:border-white/5 w-fit mt-3 shadow-sm">
                                                        <Users size={12} className="text-slate-400" />
                                                        Kelas {jurnal.className}
                                                    </span>
                                                </div>

                                                {/* Kolom Kanan: Status & Aksi */}
                                                <div className="flex flex-col justify-between items-end min-w-[100px] sm:min-w-[145px] shrink-0">
                                                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-extrabold border whitespace-nowrap shadow-sm ${
                                                        jurnal.status === 'Lanjut' 
                                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/40 dark:border-emerald-500/10' 
                                                            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/40 dark:border-amber-500/10'
                                                    }`}>
                                                        {jurnal.status}
                                                    </span>

                                                    <div className="flex items-center gap-2 mt-4 shrink-0">
                                                        <button 
                                                            onClick={() => handleEditClick(jurnal)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-[#8BA398] hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-600 rounded-lg text-[10px] sm:text-xs font-bold transition-all bg-white dark:bg-[#111D16] cursor-pointer shadow-sm"
                                                        >
                                                            <Pencil size={12} />
                                                            <span>Edit</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteClick(jurnal.id)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-rose-100 dark:border-rose-950/20 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-[10px] sm:text-xs font-bold transition-all bg-white dark:bg-[#111D16] cursor-pointer shadow-sm"
                                                        >
                                                            <Trash2 size={12} />
                                                            <span>Hapus</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {schedule.length === 0 && (
                                            <div className="text-center py-16 bg-white dark:bg-[#15231A] rounded-2xl border border-slate-100 dark:border-white/10 text-slate-400 dark:text-[#8BA398] font-medium">
                                                Belum ada jurnal Tartili yang dicatat.
                                            </div>
                                        )}
                                    </div>

                                    {/* Tombol Tambah Jurnal di Bawah */}
                                    {user?.role === 'teacher' && (
                                        <button
                                            onClick={() => {
                                                setSelectedClass(viewingClass || '5B');
                                                setShowInput(true);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="w-full py-3.5 mt-4 border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-[#15231A]/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer text-sm shadow-sm"
                                        >
                                            <Plus size={16} />
                                            <span>Tambah Jurnal Tartili</span>
                                        </button>
                                    )}
                                </div>

                                {/* Kolom Kanan: Widget Status / Informasi */}
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-[#15231A] border border-slate-200 dark:border-white/15 rounded-xl p-6 shadow-lg shadow-black/30 transition-colors space-y-4">
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-[#E2EAE5] border-b border-slate-100 dark:border-white/15 pb-3">
                                            Status Tartili Hari Ini
                                        </h3>

                                        <div className="bg-white dark:bg-[#111D16] border border-slate-100 dark:border-white/15 p-4 shadow-md dark:shadow-black/20 flex items-center gap-4 hover:border-emerald-500/30 transition-all rounded-xl">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Kelas Tercatat Hari Ini</p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                                                    {schedule.filter(s => s.date === new Date().toISOString().slice(0, 10)).map(s => s.className).filter((v, i, a) => a.indexOf(v) === i).length} dari 5 Kelas
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-[#111D16] border border-slate-100 dark:border-white/15 p-4 shadow-md dark:shadow-black/20 flex items-center gap-4 hover:border-emerald-500/30 transition-all rounded-xl">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                                <BookOpen size={20} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">LOG TERAKHIR DIUPDATE</p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5 truncate" title={schedule.length > 0 ? `${schedule[0].className}: ${schedule[0].jilid} (Hal. ${schedule[0].startPage}-${schedule[0].endPage})` : 'Belum ada data'}>
                                                    {schedule.length > 0 ? `${schedule[0].className}: ${schedule[0].jilid} (Hal. ${schedule[0].startPage}-${schedule[0].endPage})` : 'Belum ada data'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-[#111D16] border border-slate-100 dark:border-white/15 p-4 shadow-md dark:shadow-black/20 flex items-center gap-4 hover:border-emerald-500/30 transition-all rounded-xl">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">TOTAL PERTEMUAN</p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{schedule.length} Jurnal</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-2 bg-emerald-600 text-white rounded-xl p-4 shadow-sm relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h4 className="font-bold text-sm">Pengingat Jurnal</h4>
                                            <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
                                                Pastikan Ustadz memperbarui target esok hari di kolom catatan setelah selesai klasikal.
                                            </p>
                                        </div>
                                        <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-500 rounded-full blur-xl opacity-50" />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Students View (Catatan Tartili Hari Ini) */
                        <div className="w-full flex flex-col gap-8 animate-in fade-in">
                            {(() => {
                                if (!currentStudent) {
                                    return (
                                        <div className="p-8 text-center text-gray-500 bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] rounded-2xl">
                                            Data siswa tidak ditemukan.
                                        </div>
                                    );
                                }
                                
                                return (
                                    <>
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
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
                                                        Riwayat Tartili
                                                    </span>
                                                </div>
                                                <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs px-3 py-1 rounded-full font-bold border border-amber-200 dark:border-amber-900/30 self-start sm:self-auto">
                                                    {tartiliLogs.length} Entri Tartili
                                                </span>
                                            </div>

                                            <div className="overflow-x-auto">
                                                {tartiliLogs.length === 0 ? (
                                                    <div className="text-center py-16 text-slate-400 dark:text-[#8BA398] font-medium space-y-2">
                                                        <p>Anda belum memiliki riwayat setoran tartili.</p>
                                                        <p className="text-xs text-slate-300 dark:text-[#5F756B]">Entri baru yang dimasukkan akan langsung terdaftar di sini.</p>
                                                    </div>
                                                ) : (
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
                                                            {tartiliLogs.map((log: any) => {
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
                                                                            {(() => {
                                                                                try {
                                                                                    return new Date(log.date).toLocaleDateString('id-ID', {
                                                                                        day: 'numeric',
                                                                                        month: 'short',
                                                                                        year: 'numeric'
                                                                                    });
                                                                                } catch (e) {
                                                                                    return log.date.slice(0, 10);
                                                                                }
                                                                            })()}
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
                                                )}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </>
            )}

            {/* EDIT ENTRY MODAL */}
            {isEditModalOpen && selectedJurnal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#121F18] dark:border dark:border-[#1A2E24] rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-[#1A2E24]">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-[#E2EAE5]">
                                Perbarui Jurnal Kelas {editClass}
                            </h3>
                            <button 
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setSelectedJurnal(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider mb-2">
                                        Pilih Kelas
                                    </label>
                                    <select
                                        value={editClass}
                                        onChange={(e) => setEditClass(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 dark:border-[#1A2E24] dark:bg-[#09120E] dark:text-[#E2EAE5] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg outline-none transition-all font-semibold text-sm"
                                    >
                                        <option value="5B">5B</option>
                                        <option value="5C">5C</option>
                                        <option value="5D">5D</option>
                                        <option value="6C">6C</option>
                                        <option value="6D">6D</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider mb-2">
                                        Tanggal Jurnal
                                    </label>
                                    <input
                                        type="date"
                                        value={editDate}
                                        onChange={(e) => setEditDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 dark:border-[#1A2E24] dark:bg-[#09120E] dark:text-[#E2EAE5] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg outline-none transition-all font-semibold text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider mb-2">
                                        Jilid / Tingkat
                                    </label>
                                    <select
                                        value={editJilid}
                                        onChange={(e) => setEditJilid(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 dark:border-[#1A2E24] dark:bg-[#09120E] dark:text-[#E2EAE5] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg outline-none transition-all font-semibold text-sm"
                                    >
                                        <option value="Jilid 1">Jilid 1</option>
                                        <option value="Jilid 2">Jilid 2</option>
                                        <option value="Jilid 3">Jilid 3</option>
                                        <option value="Jilid 4">Jilid 4</option>
                                        <option value="Jilid 5">Jilid 5</option>
                                        <option value="Jilid 6">Jilid 6</option>
                                        <option value="Al-Qur'an">Al-Qur'an</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider mb-2">
                                        Halaman Mulai
                                    </label>
                                    <input
                                        type="number"
                                        value={editStartPage}
                                        onChange={(e) => setEditStartPage(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 dark:border-[#1A2E24] dark:bg-[#09120E] dark:text-[#E2EAE5] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg outline-none transition-all font-semibold text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider mb-2">
                                        Halaman Selesai
                                    </label>
                                    <input
                                        type="number"
                                        value={editEndPage}
                                        onChange={(e) => setEditEndPage(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 dark:border-[#1A2E24] dark:bg-[#09120E] dark:text-[#E2EAE5] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg outline-none transition-all font-semibold text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider mb-2">
                                        Status
                                    </label>
                                    <div className="flex gap-4 items-center h-[38px]">
                                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-[#E2EAE5] text-sm">
                                            <input
                                                type="radio"
                                                name="tartili-edit-status"
                                                value="Lanjut"
                                                checked={editStatus === 'Lanjut'}
                                                onChange={() => setEditStatus('Lanjut')}
                                                className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                            />
                                            <span>Lanjut</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-[#E2EAE5] text-sm">
                                            <input
                                                type="radio"
                                                name="tartili-edit-status"
                                                value="Mengulang"
                                                checked={editStatus === 'Mengulang'}
                                                onChange={() => setEditStatus('Mengulang')}
                                                className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                            />
                                            <span>Mengulang</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider mb-2">
                                    Catatan Tambahan
                                </label>
                                <textarea
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Catat kendala siswa, atau rencana berikutnya..."
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-[#1A2E24] dark:bg-[#09120E] dark:text-[#E2EAE5] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg outline-none transition-all font-medium text-sm"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setSelectedJurnal(null);
                                }}
                                className="px-4 py-2 text-slate-600 dark:text-[#8BA398] hover:bg-slate-100 dark:hover:bg-[#1C3026] rounded-lg transition-colors text-sm font-bold cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveJurnal}
                                disabled={isSaving}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium rounded-lg shadow-sm transition-colors text-sm cursor-pointer"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TartiliPage;
