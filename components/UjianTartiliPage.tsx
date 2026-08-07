import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, User, Search, Award, ClipboardCheck, Clock, Trash2, Edit, CheckCircle, XCircle, Plus, Users, BookOpen } from 'lucide-react';
import { Student, User as UserType, UjianTartiliEntry } from '../types';
import Header from './Header';
import { getAssignedTeacher } from '../services/appData';

interface UjianTartiliPageProps {
    user: UserType | null;
    students: Student[];
    schedule: UjianTartiliEntry[];
    onSaveEntry: (entry: Omit<UjianTartiliEntry, 'id'>) => Promise<void>;
    onUpdateEntry: (entry: UjianTartiliEntry) => Promise<void>;
    onDeleteEntry: (id: string | number) => Promise<void>;
    onMenuClick: () => void;
    notifications?: Student[];
    onDismissNotification?: (studentId: string) => void;
    onSearchClick?: () => void;
    unreadNotesCount?: number;
}

const parsePageNumber = (pageStr: string | undefined): number => {
    if (!pageStr) return 0;
    const numbers = pageStr.match(/\d+/g);
    if (!numbers || numbers.length === 0) return 0;
    return Math.max(...numbers.map(Number));
};

const UjianTartiliPage: React.FC<UjianTartiliPageProps> = ({
    user,
    students,
    schedule,
    onSaveEntry,
    onUpdateEntry,
    onDeleteEntry,
    onMenuClick,
    notifications = [],
    onDismissNotification,
    onSearchClick,
    unreadNotesCount = 0
}) => {
    // Form state
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [hariUjian, setHariUjian] = useState('');
    const [tanggalUjian, setTanggalUjian] = useState(() => new Date().toISOString().split('T')[0]);
    const [jamPelajaran, setJamPelajaran] = useState('');
    const [notes, setNotes] = useState('');
    const [editingEntry, setEditingEntry] = useState<UjianTartiliEntry | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form selection filter states
    const [formClassFilter, setFormClassFilter] = useState('Semua');
    const [formTeacherFilter, setFormTeacherFilter] = useState('Semua');
    const [formSearchQuery, setFormSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [formJilidAsal, setFormJilidAsal] = useState<number>(1);

    // Selected student memo
    const selectedStudent = useMemo(() => {
        return students.find(s => s.id === selectedStudentId) || null;
    }, [students, selectedStudentId]);

    const displaySearchVal = isFocused ? formSearchQuery : (selectedStudent ? selectedStudent.name : formSearchQuery);

    // Auto-update Jilid selection when selectedStudent changes
    useEffect(() => {
        if (selectedStudent) {
            setFormJilidAsal(selectedStudent.iqraLevel || 1);
        }
    }, [selectedStudent]);

    // Filters state
    const [classFilter, setClassFilter] = useState('Semua');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'jadwal' | 'rekomendasi' | 'riwayat'>('jadwal');

    // Get unique list of teachers (Pengampu) dynamically from students
    const availableTeachersForForm = useMemo(() => {
        const teacherSet = new Set<string>();
        students.forEach((s, idx) => {
            const isTartili = s.type === 'Tartili' || 
                              s.currentSurah.toLowerCase().includes('jilid') || 
                              s.currentSurah.toLowerCase().includes('iqra');
            if (isTartili) {
                const teacherInfo = getAssignedTeacher(s.name, s.class, idx);
                if (teacherInfo && teacherInfo.name) {
                    teacherSet.add(teacherInfo.name);
                }
            }
        });
        return Array.from(teacherSet).sort();
    }, [students]);

    // Filter students for the select dropdown
    const filteredStudentsForSelect = useMemo(() => {
        return students
            .map((s, idx) => ({ student: s, index: idx }))
            .filter(({ student, index }) => {
                const matchesClass = formClassFilter === 'Semua' || student.class === formClassFilter;
                
                const teacherInfo = getAssignedTeacher(student.name, student.class, index);
                const matchesTeacher = formTeacherFilter === 'Semua' || (teacherInfo && teacherInfo.name === formTeacherFilter);

                const matchesSearch = formSearchQuery.trim() === '' || 
                                      student.name.toLowerCase().includes(formSearchQuery.toLowerCase());

                return matchesClass && matchesTeacher && matchesSearch;
            })
            .map(({ student }) => student)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [students, formClassFilter, formTeacherFilter, formSearchQuery]);

    // Auto-detect recommended students who are ready for exam
    // Criteria: Student must be in Jilid 1-6 (not Al-Qur'an), program type has Drill/Tartili, setoran is Drill, and reached target pages.
    const recommendedStudents = useMemo(() => {
        return students.filter(student => {
            // 1. Must have iqraLevel defined (1-6) - this automatically excludes Al-Qur'an
            const currentJilid = student.iqraLevel;
            if (!currentJilid || currentJilid < 1 || currentJilid > 6) return false;

            // 2. Must be on Drill Tartili / Drill Munaqosah / Tartili
            const isTartili = student.type === 'Tartili' || 
                              student.type === 'Drill Tartili' || 
                              student.type === 'Drill Munaqosah' ||
                              student.currentSurah.toLowerCase().includes('jilid') || 
                              student.currentSurah.toLowerCase().includes('iqra');
            if (!isTartili) return false;

            // 3. Must be using 'Drill' setoran type
            const isDrill = student.jenisSetoran === 'Drill' || 
                            (student.type && student.type.toLowerCase().includes('drill'));
            if (!isDrill) return false;

            const maxPage = parsePageNumber(student.page);

            // 4. Completion check based on Jilid level (1-5: page 43, 6: page 44)
            let isCompleted = false;
            if (currentJilid >= 1 && currentJilid <= 5) {
                isCompleted = maxPage >= 43;
            } else if (currentJilid === 6) {
                isCompleted = maxPage >= 44;
            }

            // Check if already scheduled and pending
            const isAlreadyScheduled = schedule.some(entry => 
                entry.studentId === student.id && entry.status === 'Terjadwal'
            );

            return isCompleted && !isAlreadyScheduled;
        });
    }, [students, schedule]);

    // JP Options
    const jpList = [
        'JP 1 (07:30 - 08:05)',
        'JP 2 (08:05 - 08:40)',
        'JP 3 (08:40 - 09:15)',
        'JP 4 (09:15 - 09:50)',
        'JP 5 (10:05 - 10:40)',
        'JP 6 (10:40 - 11:15)',
        'JP 7 (11:15 - 11:50)',
        'JP 8 (11:50 - 12:25)',
        'JP 9 (13:10 - 13:45)',
        'JP 10 (13:45 - 14:20)',
        'JP 11 (14:20 - 14:55)'
    ];

    const daysList = ['Senin', 'Selasa', 'Rabu', 'Kamis'];

    // Map student record for easy lookup
    const studentMap = useMemo(() => {
        const map = new Map<string, Student>();
        students.forEach(s => map.set(s.id, s));
        return map;
    }, [students]);

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !hariUjian || !tanggalUjian || !jamPelajaran) {
            alert('Semua kolom wajib diisi.');
            return;
        }

        const studentIndex = students.findIndex(s => s.id === selectedStudentId);
        if (studentIndex === -1) return;

        const student = students[studentIndex];
        const teacherInfo = getAssignedTeacher(student.name, student.class, studentIndex);
        const assignedTeacherName = teacherInfo ? teacherInfo.name : (user?.name || 'Ustadz/ah');

        setIsSaving(true);
        try {
            const currentJilid = formJilidAsal;
            const targetJilidStr = currentJilid === 6 ? "Al-Qur'an" : `Jilid ${currentJilid + 1}`;

            if (editingEntry) {
                await onUpdateEntry({
                    ...editingEntry,
                    studentId: selectedStudentId,
                    studentName: student.name,
                    className: student.class,
                    jilidAsal: currentJilid,
                    targetJilid: targetJilidStr,
                    hariUjian,
                    tanggalUjian,
                    jamPelajaran,
                    penguji: assignedTeacherName,
                    notes: notes.trim() || undefined
                });
                alert('Jadwal ujian berhasil diperbarui.');
            } else {
                await onSaveEntry({
                    studentId: selectedStudentId,
                    studentName: student.name,
                    className: student.class,
                    jilidAsal: currentJilid,
                    targetJilid: targetJilidStr,
                    hariUjian,
                    tanggalUjian,
                    jamPelajaran,
                    penguji: assignedTeacherName,
                    status: 'Terjadwal',
                    notes: notes.trim() || undefined
                });
                alert('Jadwal ujian baru berhasil dibuat.');
            }

            // Reset form
            resetForm();
        } catch (err) {
            console.error(err);
            alert('Gagal menyimpan data ujian.');
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setSelectedStudentId('');
        setHariUjian('');
        setTanggalUjian(new Date().toISOString().split('T')[0]);
        setJamPelajaran('');
        setNotes('');
        setFormSearchQuery('');
        setFormJilidAsal(1);
        setEditingEntry(null);
    };

    // Auto-fill form when clicking "Jadwalkan" from recommended list
    const handleQuickSchedule = (student: Student) => {
        const studentIdx = students.findIndex(s => s.id === student.id);
        if (studentIdx !== -1) {
            const teacherInfo = getAssignedTeacher(student.name, student.class, studentIdx);
            if (teacherInfo && teacherInfo.name) {
                setFormTeacherFilter(teacherInfo.name);
            }
        }
        setFormClassFilter(student.class);
        setSelectedStudentId(student.id);
        setFormSearchQuery(student.name);
        setFormJilidAsal(student.iqraLevel || 1);
        setEditingEntry(null);
        // Auto select date if today is teaching day
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dayName = days[new Date().getDay()];
        if (daysList.includes(dayName)) {
            setHariUjian(dayName);
        } else {
            setHariUjian('Senin');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEdit = (entry: UjianTartiliEntry) => {
        setEditingEntry(entry);
        setFormClassFilter(entry.className);
        
        const studentIdx = students.findIndex(s => s.id === entry.studentId);
        if (studentIdx !== -1) {
            const teacherInfo = getAssignedTeacher(entry.studentName, entry.className, studentIdx);
            if (teacherInfo && teacherInfo.name) {
                setFormTeacherFilter(teacherInfo.name);
            }
        }
        
        setSelectedStudentId(entry.studentId);
        setFormSearchQuery(entry.studentName);
        setFormJilidAsal(entry.jilidAsal);
        setHariUjian(entry.hariUjian);
        setTanggalUjian(entry.tanggalUjian);
        setJamPelajaran(entry.jamPelajaran);
        setNotes(entry.notes || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleComplete = async (entry: UjianTartiliEntry, passed: boolean) => {
        const confirmMsg = passed 
            ? `Selesaikan ujian dan luluskan ${entry.studentName} ke ${entry.targetJilid}?`
            : `Selesaikan ujian untuk ${entry.studentName} dengan status Tidak Lulus?`;
        
        if (!confirm(confirmMsg)) return;

        try {
            await onUpdateEntry({
                ...entry,
                status: 'Selesai',
                notes: passed 
                    ? `Lulus ke ${entry.targetJilid}. ${entry.notes || ''}`.trim() 
                    : `Mengulang jilid ini. ${entry.notes || ''}`.trim()
            });

            alert('Status ujian berhasil diperbarui.');
        } catch (err) {
            console.error(err);
            alert('Gagal memperbarui status ujian.');
        }
    };

    const handleCancel = async (entry: UjianTartiliEntry) => {
        if (!confirm(`Batalkan jadwal ujian untuk ${entry.studentName}?`)) return;

        try {
            await onUpdateEntry({
                ...entry,
                status: 'Batal'
            });
            alert('Ujian berhasil dibatalkan.');
        } catch (err) {
            console.error(err);
            alert('Gagal membatalkan ujian.');
        }
    };

    // Filter schedule entries
    const filteredEntries = useMemo(() => {
        return schedule.filter(entry => {
            const matchesClass = classFilter === 'Semua' || entry.className === classFilter;
            const matchesSearch = entry.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  entry.penguji.toLowerCase().includes(searchQuery.toLowerCase());
            
            const isHistory = entry.status === 'Selesai' || entry.status === 'Batal';
            const matchesTab = activeTab === 'riwayat' ? isHistory : !isHistory;

            return matchesClass && matchesSearch && matchesTab;
        }).sort((a, b) => b.tanggalUjian.localeCompare(a.tanggalUjian));
    }, [schedule, classFilter, searchQuery, activeTab]);

    // Statistics
    const stats = useMemo(() => {
        const terjadwal = schedule.filter(e => e.status === 'Terjadwal').length;
        const selesaiPekanIni = schedule.filter(e => {
            if (e.status !== 'Selesai') return false;
            // check if within last 7 days
            const examDate = new Date(e.tanggalUjian);
            const diffTime = Math.abs(new Date().getTime() - examDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 7;
        }).length;

        return {
            terjadwal,
            rekomendasi: recommendedStudents.length,
            selesaiPekanIni
        };
    }, [schedule, recommendedStudents]);

    return (
        <div className="space-y-6 flex-1 flex flex-col min-h-0">
            {/* Header Section */}
            <div className="fixed top-0 left-0 right-0 w-full z-50 bg-white/90 dark:bg-[#09120E]/90 backdrop-blur-md px-4 py-4 border-b border-slate-100 dark:border-[#1A2E24] md:hidden">
                <Header
                    user={user!}
                    onMenuClick={onMenuClick}
                    notifications={notifications}
                    onDismissNotification={onDismissNotification}
                    onSearchClick={onSearchClick}
                    flat={true}
                    title="Ujian Tartili"
                    subtitle="Kelola penjadwalan ujian kenaikan jilid dan munaqosah Tartili siswa."
                    unreadNotesCount={unreadNotesCount}
                />
            </div>

            <div className="hidden md:block">
                <div className="sticky top-0 z-30 bg-gray-50 dark:bg-[#09120E] pt-4 pb-2 transition-colors duration-300 w-full flex-none no-print">
                    <div className="bg-gradient-to-br from-white to-emerald-50/60 dark:bg-gradient-to-br dark:from-[#12231A] dark:to-[#0C1A13]/90 p-4 sm:p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-emerald-250 dark:border-[#1E382B] flex flex-col gap-3 sm:gap-4 transition-all duration-300 w-full">
                        <Header
                            user={user!}
                            onMenuClick={onMenuClick}
                            notifications={notifications}
                            onDismissNotification={onDismissNotification}
                            onSearchClick={onSearchClick}
                            flat={true}
                            title="Ujian Tartili"
                            subtitle="Kelola penjadwalan ujian kenaikan jilid dan munaqosah Tartili siswa."
                            unreadNotesCount={unreadNotesCount}
                        />
                    </div>
                </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 pt-32 md:pt-6 bg-slate-50 dark:bg-dark-bg -mx-4 sm:-mx-8">
                <div className="flex flex-col gap-6 w-full px-4 md:px-0 lg:px-8">
                    
                    {/* Stats Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Stat 1 */}
                        <div className="bg-white dark:bg-[#16271E] border border-slate-200/80 dark:border-[#1F382B] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                                <ClipboardCheck size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ujian Terjadwal</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats.terjadwal} Sesi</h3>
                            </div>
                        </div>

                        {/* Stat 2 */}
                        <div className="bg-white dark:bg-[#16271E] border border-slate-200/80 dark:border-[#1F382B] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                                <Award size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rekomendasi Siap Ujian</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats.rekomendasi} Siswa</h3>
                            </div>
                        </div>

                        {/* Stat 3 */}
                        <div className="bg-white dark:bg-[#16271E] border border-slate-200/80 dark:border-[#1F382B] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                            <div className="p-3 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl shrink-0">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selesai Pekan Ini</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats.selesaiPekanIni} Ujian</h3>
                            </div>
                        </div>
                    </div>

                    {/* Main Layout Split Screen */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* Left Column: Schedule Form */}
                        <div className="lg:col-span-4 bg-white dark:bg-[#16271E] border border-slate-200/80 dark:border-[#1F382B] rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                                <Calendar size={20} className="text-emerald-600" />
                                {editingEntry ? 'Edit Jadwal Ujian' : 'Jadwalkan Ujian Baru'}
                            </h3>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Filter Kelas & Pengampu untuk Siswa */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Filter Kelas</label>
                                        <select
                                            value={formClassFilter}
                                            onChange={(e) => {
                                                setFormClassFilter(e.target.value);
                                                setSelectedStudentId('');
                                            }}
                                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-850 dark:text-white text-xs rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
                                        >
                                            <option value="Semua">Semua Kelas</option>
                                            {['5B', '5C', '5D', '6C', '6D'].map(cls => (
                                                <option key={cls} value={cls}>Kelas {cls}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Filter Pengampu</label>
                                        <select
                                            value={formTeacherFilter}
                                            onChange={(e) => {
                                                setFormTeacherFilter(e.target.value);
                                                setSelectedStudentId('');
                                            }}
                                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-850 dark:text-white text-xs rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
                                        >
                                            <option value="Semua">Semua Pengampu</option>
                                            {availableTeachersForForm.map(teacher => (
                                                <option key={teacher} value={teacher}>{teacher}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Pilih & Cari Siswa Autocomplete Panel */}
                                <div className="space-y-1.5 relative">
                                    <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Pilih Siswa</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3.5 text-slate-400" size={14} />
                                        <input
                                            type="text"
                                            value={displaySearchVal}
                                            onFocus={() => {
                                                setIsFocused(true);
                                                setIsDropdownOpen(true);
                                            }}
                                            onBlur={() => {
                                                // Delay to allow clicking on option
                                                setTimeout(() => {
                                                    setIsFocused(false);
                                                    setIsDropdownOpen(false);
                                                }, 250);
                                            }}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormSearchQuery(val);
                                                setSelectedStudentId('');
                                                if (val.trim() !== '') {
                                                    setFormClassFilter('Semua');
                                                    setFormTeacherFilter('Semua');
                                                }
                                                setIsDropdownOpen(true);
                                            }}
                                            placeholder="Ketik nama siswa..."
                                            className="w-full px-3 py-3 bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-800 dark:text-white text-xs rounded-xl pl-9 pr-8 outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
                                            required={!selectedStudentId}
                                        />
                                        {selectedStudentId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedStudentId('');
                                                    setFormSearchQuery('');
                                                }}
                                                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Selected student badge info */}
                                    {selectedStudent && (
                                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                                            Terpilih: Kelas {selectedStudent.class} • {selectedStudent.type || 'Hafalan'} • Pengampu: {getAssignedTeacher(selectedStudent.name, selectedStudent.class, students.findIndex(s => s.id === selectedStudent.id))?.name || 'Ustadz/ah'}
                                        </div>
                                    )}

                                    {/* Floating Autocomplete Panel */}
                                    {isDropdownOpen && (
                                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-[#16271E] border border-slate-200 dark:border-[#1F382B] rounded-xl shadow-lg max-h-60 overflow-y-auto scrollbar-hide">
                                            {filteredStudentsForSelect.length === 0 ? (
                                                <div className="p-3 text-xs text-slate-400 dark:text-[#8BA398] text-center font-medium">
                                                    Siswa tidak ditemukan
                                                </div>
                                            ) : (
                                                filteredStudentsForSelect.map(student => {
                                                    const isRec = recommendedStudents.some(r => r.id === student.id);
                                                    const idx = students.findIndex(s => s.id === student.id);
                                                    const teacherInfo = getAssignedTeacher(student.name, student.class, idx);
                                                    const teacherName = teacherInfo ? teacherInfo.name : '';
                                                    const programType = student.type || 'Hafalan';
                                                    
                                                    return (
                                                        <button
                                                            key={student.id}
                                                            type="button"
                                                            onMouseDown={() => {
                                                                setSelectedStudentId(student.id);
                                                                setFormSearchQuery(student.name);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-[#1C3026] text-xs transition-colors flex items-center justify-between border-b border-slate-100/50 dark:border-[#1F382B]/20 last:border-0 cursor-pointer"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800 dark:text-[#E2EAE5]">
                                                                    {student.name}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 mt-0.5">
                                                                    Kelas {student.class} • {programType} {teacherName ? `• Pengampu: ${teacherName}` : ''}
                                                                </span>
                                                            </div>
                                                            {isRec && (
                                                                <span className="text-xs" title="Rekomendasi Siap Ujian">⭐️</span>
                                                            )}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Materi Ujian (Kenaikan Jilid) */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Materi Ujian (Kenaikan Jilid)</label>
                                    <select
                                        value={formJilidAsal}
                                        onChange={(e) => setFormJilidAsal(Number(e.target.value))}
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-800 dark:text-white text-sm rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
                                        required
                                    >
                                        <option value={1}>Jilid 1 ➜ Jilid 2</option>
                                        <option value={2}>Jilid 2 ➜ Jilid 3</option>
                                        <option value={3}>Jilid 3 ➜ Jilid 4</option>
                                        <option value={4}>Jilid 4 ➜ Jilid 5</option>
                                        <option value={5}>Jilid 5 ➜ Jilid 6</option>
                                        <option value={6}>Jilid 6 ➜ Al-Qur'an</option>
                                    </select>
                                </div>

                                {/* Hari & Tanggal */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-455 uppercase tracking-wider">Hari</label>
                                        <select
                                            value={hariUjian}
                                            onChange={(e) => setHariUjian(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-800 dark:text-white text-sm rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
                                            required
                                        >
                                            <option value="" disabled>Pilih Hari</option>
                                            {daysList.map(day => (
                                                <option key={day} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-455 uppercase tracking-wider">Tanggal</label>
                                        <input
                                            type="date"
                                            value={tanggalUjian}
                                            onChange={(e) => setTanggalUjian(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-800 dark:text-white text-sm rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Jam Pelajaran / JP */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Jam Pelajaran (JP)</label>
                                    <select
                                        value={jamPelajaran}
                                        onChange={(e) => setJamPelajaran(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-800 dark:text-white text-sm rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
                                        required
                                    >
                                        <option value="" disabled>Pilih Jam Pelajaran</option>
                                        {jpList.map(jp => (
                                            <option key={jp} value={jp}>{jp}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Catatan */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Catatan Tambahan (Opsional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Catatan kendala khusus atau materi ujian..."
                                        rows={3}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-800 dark:text-white text-sm rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 font-medium resize-none"
                                    />
                                </div>

                                {/* Submit & Cancel Buttons */}
                                <div className="flex gap-2.5 pt-2">
                                    {editingEntry && (
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="flex-1 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-bold transition cursor-pointer"
                                        >
                                            Batal
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <Plus size={16} />
                                        {isSaving ? 'Menyimpan...' : editingEntry ? 'Simpan Edit' : 'Buat Sesi'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Right Column: List & Tabs */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            
                            {/* Tab Selectors & Filter Controls */}
                            <div className="bg-white dark:bg-[#16271E] border border-slate-200/80 dark:border-[#1F382B] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex bg-slate-100 dark:bg-dark-card-hover p-1 rounded-xl w-full md:w-auto">
                                    <button
                                        onClick={() => setActiveTab('jadwal')}
                                        className={`flex-1 md:flex-none px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
                                            activeTab === 'jadwal'
                                                ? 'bg-white dark:bg-emerald-600 text-slate-800 dark:text-white shadow-sm'
                                                : 'text-slate-450 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                                        }`}
                                    >
                                        Jadwal Aktif
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('rekomendasi')}
                                        className={`flex-1 md:flex-none px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                                            activeTab === 'rekomendasi'
                                                ? 'bg-white dark:bg-emerald-600 text-slate-800 dark:text-white shadow-sm'
                                                : 'text-slate-450 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                                        }`}
                                    >
                                        Siap Ujian
                                        {stats.rekomendasi > 0 && (
                                            <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0">
                                                {stats.rekomendasi}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('riwayat')}
                                        className={`flex-1 md:flex-none px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
                                            activeTab === 'riwayat'
                                                ? 'bg-white dark:bg-emerald-600 text-slate-800 dark:text-white shadow-sm'
                                                : 'text-slate-450 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                                        }`}
                                    >
                                        Riwayat
                                    </button>
                                </div>

                                {/* Filters */}
                                {activeTab !== 'rekomendasi' && (
                                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                        {/* Class select */}
                                        <select
                                            value={classFilter}
                                            onChange={(e) => setClassFilter(e.target.value)}
                                            className="bg-slate-50 dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                        >
                                            <option value="Semua">Semua Kelas</option>
                                            {['5B', '5C', '5D', '6C', '6D'].map(cls => (
                                                <option key={cls} value={cls}>Kelas {cls}</option>
                                            ))}
                                        </select>
                                        
                                        {/* Search search */}
                                        <div className="relative flex-1 md:flex-none">
                                            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Cari siswa/penguji..."
                                                className="bg-slate-50 dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Dynamic Content Panels based on Tab */}
                            <div className="bg-white dark:bg-[#16271E] border border-slate-200/80 dark:border-[#1F382B] rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                                
                                {activeTab === 'rekomendasi' ? (
                                    /* Recommendations Panel */
                                    <div className="p-6">
                                        <div className="mb-4">
                                            <h4 className="text-base font-bold text-slate-800 dark:text-[#E2EAE5]">
                                                Rekomendasi Cerdas: Siswa Siap Ujian Tartili
                                            </h4>
                                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                                Daftar berikut otomatis menyaring siswa program Tartili yang telah mencapai halaman akhir jilid (**Halaman 43 untuk Jilid 1-5**, atau **Halaman 44 untuk Jilid 6**) dan belum terdaftar di jadwal ujian aktif.
                                            </p>
                                        </div>

                                        {recommendedStudents.length === 0 ? (
                                            <div className="text-center py-16 text-slate-400 dark:text-[#8BA398] font-medium flex flex-col items-center justify-center gap-2">
                                                <Users size={36} className="opacity-25" />
                                                <p>Belum ada siswa yang memenuhi syarat rekomendasi ujian.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {recommendedStudents.map(student => (
                                                    <div 
                                                        key={student.id}
                                                        className="border border-slate-100 dark:border-white/5 rounded-2xl p-4 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between hover:shadow-md transition duration-300"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <img 
                                                                src={student.avatar} 
                                                                alt={student.name}
                                                                className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-white/10"
                                                            />
                                                            <div className="min-w-0">
                                                                <h5 className="font-bold text-slate-800 dark:text-white text-sm truncate max-w-[140px]" title={student.name}>
                                                                    {student.name}
                                                                </h5>
                                                                <p className="text-xs text-slate-400 mt-0.5">
                                                                    Kelas {student.class} • Jilid {student.iqraLevel} (Hal {student.page})
                                                                </p>
                                                                <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 mt-1 rounded-full border ${
                                                                    student.status === 'Mumtaz'
                                                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/10'
                                                                        : 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/10'
                                                                }`}>
                                                                    Nilai: {student.lastScore} ({student.status})
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        <button
                                                            onClick={() => handleQuickSchedule(student)}
                                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1 cursor-pointer shrink-0"
                                                        >
                                                            <Calendar size={12} />
                                                            Jadwalkan
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Active Schedule / History Table */
                                    <div className="w-full overflow-x-auto select-none [&::-webkit-scrollbar]:hidden">
                                        {filteredEntries.length === 0 ? (
                                            <div className="text-center py-20 text-slate-400 dark:text-[#8BA398] font-medium flex flex-col items-center justify-center gap-2">
                                                <ClipboardCheck size={36} className="opacity-25" />
                                                <p>Tidak ada jadwal ujian untuk kriteria pencarian ini.</p>
                                            </div>
                                        ) : (
                                            <table className="w-full min-w-max text-sm text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 dark:bg-[#1A2E24]/20 border-b border-slate-100 dark:border-[#1A2E24] text-slate-450 dark:text-[#8BA398] font-bold text-xs uppercase tracking-wider">
                                                        <th className="py-4 px-6">Siswa & Kelas</th>
                                                        <th className="py-4 px-4 text-center">Ujian Kenaikan</th>
                                                        <th className="py-4 px-4">Tanggal & JP</th>
                                                        <th className="py-4 px-4">Pengampu</th>
                                                        <th className="py-4 px-4 text-center">Status</th>
                                                        <th className="py-4 px-6 text-right">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-[#1A2E24]">
                                                    {filteredEntries.map(entry => {
                                                        const isScheduled = entry.status === 'Terjadwal';
                                                        const isPassed = entry.notes?.toLowerCase().includes('lulus');
                                                        return (
                                                            <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C3026]/10 transition-colors">
                                                                {/* Student */}
                                                                <td className="py-4 px-6">
                                                                    <div className="font-bold text-slate-800 dark:text-[#E2EAE5]">{entry.studentName}</div>
                                                                    <div className="text-xs text-slate-400 mt-0.5">Kelas {entry.className}</div>
                                                                </td>
                                                                
                                                                {/* Exam Target */}
                                                                <td className="py-4 px-4 text-center">
                                                                    <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-lg border border-amber-200/40 dark:border-amber-900/10">
                                                                        Jilid {entry.jilidAsal} ➜ {entry.targetJilid.replace('Jilid ', '')}
                                                                    </div>
                                                                </td>

                                                                {/* Date & JP */}
                                                                <td className="py-4 px-4">
                                                                    <div className="font-bold text-slate-700 dark:text-white flex items-center gap-1">
                                                                        <Calendar size={12} className="text-slate-400" />
                                                                        {entry.hariUjian}, {new Date(entry.tanggalUjian).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                                                                        <Clock size={10} className="text-slate-400" />
                                                                        {entry.jamPelajaran}
                                                                    </div>
                                                                </td>

                                                                {/* Examiner */}
                                                                <td className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-350">
                                                                    {entry.penguji}
                                                                </td>

                                                                {/* Status */}
                                                                <td className="py-4 px-4 text-center">
                                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                                                        entry.status === 'Terjadwal'
                                                                            ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200/30'
                                                                            : entry.status === 'Selesai'
                                                                                ? isPassed 
                                                                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-250'
                                                                                    : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-250'
                                                                                : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-250'
                                                                    }`}>
                                                                        {entry.status === 'Selesai' ? (isPassed ? 'Lulus' : 'Belum Lulus') : entry.status}
                                                                    </span>
                                                                </td>

                                                                {/* Actions */}
                                                                <td className="py-4 px-6 text-right whitespace-nowrap">
                                                                    {isScheduled ? (
                                                                        <div className="flex justify-end gap-2">
                                                                            {/* Mark Completed (Lulus) */}
                                                                            <button
                                                                                onClick={() => handleComplete(entry, true)}
                                                                                className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                                                                title="Lulus Ujian"
                                                                            >
                                                                                <CheckCircle size={16} />
                                                                            </button>
                                                                            {/* Mark Completed (Tidak Lulus) */}
                                                                            <button
                                                                                onClick={() => handleComplete(entry, false)}
                                                                                className="p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                                                                                title="Belum Lulus / Mengulang"
                                                                            >
                                                                                <XCircle size={16} />
                                                                            </button>
                                                                            {/* Edit */}
                                                                            <button
                                                                                onClick={() => handleEdit(entry)}
                                                                                className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                                                                title="Edit Jadwal"
                                                                            >
                                                                                <Edit size={16} />
                                                                            </button>
                                                                            {/* Cancel */}
                                                                            <button
                                                                                onClick={() => handleCancel(entry)}
                                                                                className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                                                                title="Batalkan Jadwal"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        /* History delete */
                                                                        <button
                                                                            onClick={() => onDeleteEntry(entry.id)}
                                                                            className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                                                                            title="Hapus Catatan Riwayat"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UjianTartiliPage;
