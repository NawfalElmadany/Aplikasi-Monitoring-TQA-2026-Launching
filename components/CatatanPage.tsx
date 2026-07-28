import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Calendar, X, Save, Trash2, Edit2, ChevronDown, GraduationCap, BookOpen, AlertCircle, LayoutGrid, Users, CheckCircle2, AlertTriangle, Info, Send, MessageSquare } from 'lucide-react';
import { Note, User, Student } from '../types';
import Header from './Header';
import FloatingHeaderCard from './FloatingHeaderCard';
import { loadStudentSetoranLogs } from '../services/appData';

const CATEGORIES = [
    { name: 'Libur', color: 'bg-red-50 text-red-700 border border-red-200' },
    { name: 'Pengingat', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
];

interface CatatanPageProps {
    notes: Note[];
    onSaveNote: (note: Omit<Note, 'id'> & Partial<Pick<Note, 'id'>>) => Promise<void>;
    onDeleteNote: (id: number) => Promise<void>;
    isSyncing?: boolean;
    user: User | null;
    students?: Student[];
    onMenuClick: () => void;
    notifications?: Student[];
    onDismissNotification?: (studentId: string) => void;
    onSearchClick?: () => void;
    unreadNotesCount?: number;
    initialTab?: 'akademik' | 'personal';
    onOpenMessageDrawer?: () => void;
}

const CatatanPage: React.FC<CatatanPageProps> = ({ 
    notes, 
    onSaveNote, 
    onDeleteNote, 
    isSyncing = false,
    user,
    students = [],
    onMenuClick,
    notifications = [],
    onDismissNotification,
    onSearchClick,
    unreadNotesCount = 0,
    initialTab,
    onOpenMessageDrawer
}) => {
    const isStudent = user?.role === 'student' || user?.role === 'siswa';
    const currentStudent = students.find(s => 
        (user?.studentId && s.id === user?.studentId) || 
        s.name.toUpperCase() === user?.name?.toUpperCase()
    );
    const studentClass = currentStudent?.class;

    const [setoranLogs, setSetoranLogs] = useState<any[]>([]);
    const [loadingSetoran, setLoadingSetoran] = useState(isStudent);

    useEffect(() => {
        if (!isStudent || !currentStudent) return;
        
        let isMounted = true;
        const fetchSetoranLogs = async () => {
            setLoadingSetoran(true);
            try {
                let data: any[] = [];
                if (isSyncing) {
                    data = await loadStudentSetoranLogs(currentStudent.id);
                } else {
                    const localLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
                    data = localLogs.filter((l: any) => l.studentId === currentStudent.id);
                }
                
                // Filter where notes (catatan_guru) is not empty
                const filtered = data.filter((l: any) => l.notes && l.notes.trim() !== '');
                if (isMounted) {
                    setSetoranLogs(filtered);
                }
            } catch (err) {
                console.error("Failed to load setoran logs for notes:", err);
                // Fallback to local storage
                const localLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
                const filtered = localLogs.filter((l: any) => l.studentId === currentStudent.id && l.notes && l.notes.trim() !== '');
                if (isMounted) {
                    setSetoranLogs(filtered);
                }
            } finally {
                if (isMounted) setLoadingSetoran(false);
            }
        };

        void fetchSetoranLogs();
        return () => {
            isMounted = false;
        };
    }, [isStudent, currentStudent, isSyncing]);

    const [searchQuery, setSearchQuery] = useState('');
    const [studentSelectedMonth, setStudentSelectedMonth] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentNote, setCurrentNote] = useState<Partial<Note>>({});
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [viewingClassDetail, setViewingClassDetail] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'terbaru' | 'terlama'>('terbaru');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Teacher View Tabs State
    const [activeTab, setActiveTab] = useState<'akademik' | 'personal'>(initialTab || 'akademik');

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    // Personal Message States
    interface PersonalMessage {
        id: string;
        date: string;
        studentId: string;
        studentName: string;
        message: string;
        status: 'Terkirim' | 'Dibaca';
    }
    const [personalMessages, setPersonalMessages] = useState<PersonalMessage[]>([]);
    const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [personalMessageText, setPersonalMessageText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const filteredStudents = (students || []).filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (isPersonalModalOpen) {
            setSearchTerm('');
            setSelectedStudentId('');
        }
    }, [isPersonalModalOpen]);

    const studentMessages = React.useMemo(() => {
        if (!isStudent || !currentStudent) return [];
        return personalMessages.filter(msg => 
            msg.studentId === currentStudent.id || 
            msg.studentName.toUpperCase() === currentStudent.name.toUpperCase()
        );
    }, [isStudent, currentStudent, personalMessages]);

    // Mark student messages as read when viewing the page
    useEffect(() => {
        if (isStudent && currentStudent) {
            const stored = localStorage.getItem('tqa_personal_messages');
            if (stored) {
                const currentMsgs = JSON.parse(stored);
                let changed = false;
                const updated = currentMsgs.map((msg: any) => {
                    if (
                        (msg.studentId === currentStudent.id || msg.studentName.toUpperCase() === currentStudent.name.toUpperCase()) &&
                        msg.status === 'Terkirim'
                    ) {
                        msg.status = 'Dibaca';
                        changed = true;
                    }
                    return msg;
                });
                if (changed) {
                    localStorage.setItem('tqa_personal_messages', JSON.stringify(updated));
                    setPersonalMessages(updated);
                    window.dispatchEvent(new Event('tqa_new_personal_message'));
                }
            }
        }
    }, [isStudent, currentStudent]);

    // Load personal messages
    useEffect(() => {
        const loadMessages = () => {
            const stored = localStorage.getItem('tqa_personal_messages');
            if (stored) {
                setPersonalMessages(JSON.parse(stored));
            } else {
                const sampleMessages: PersonalMessage[] = [
                    {
                        id: '1',
                        date: '2026-07-03',
                        studentId: 'std-1',
                        studentName: 'Ahmad Fauzi',
                        message: 'Semangat murojaah jilid 4 ya nak, Ustadz perhatikan pelafalan huruf shod-nya masih sering tertukar.',
                        status: 'Dibaca'
                    },
                    {
                        id: '2',
                        date: '2026-07-04',
                        studentId: 'std-2',
                        studentName: 'Aisyah Humaira',
                        message: 'Alhamdulillah hafalan Surah An-Naba sudah lancar sekali. Pertahankan tajwidnya ya nak.',
                        status: 'Terkirim'
                    }
                ];
                localStorage.setItem('tqa_personal_messages', JSON.stringify(sampleMessages));
                setPersonalMessages(sampleMessages);
            }
        };

        loadMessages();
        window.addEventListener('tqa_new_personal_message', loadMessages);
        return () => {
            window.removeEventListener('tqa_new_personal_message', loadMessages);
        };
    }, []);

    const handleSendPersonalMessage = () => {
        if (!selectedStudentId) {
            alert('Mohon pilih siswa terlebih dahulu');
            return;
        }
        if (!personalMessageText.trim()) {
            alert('Mohon isi pesan yang ingin dikirim');
            return;
        }

        const student = students.find(s => s.id === selectedStudentId);
        if (!student) return;

        const newMessage: PersonalMessage = {
            id: Date.now().toString(),
            date: new Date().toISOString().slice(0, 10),
            studentId: selectedStudentId,
            studentName: student.name,
            message: personalMessageText,
            status: 'Terkirim'
        };

        const updated = [newMessage, ...personalMessages];
        localStorage.setItem('tqa_personal_messages', JSON.stringify(updated));
        setPersonalMessages(updated);
        
        setSelectedStudentId('');
        setSearchTerm('');
        setPersonalMessageText('');
        setIsPersonalModalOpen(false);

        setToastMessage(`Berhasil mengirim pesan ke ${student.name}!`);
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
        }, 3000);
    };



    // Modal Form States
    const [noteDate, setNoteDate] = useState('');
    const [noteCategory, setNoteCategory] = useState('Personal');
    const [noteContent, setNoteContent] = useState('');
    const [noteTitle, setNoteTitle] = useState('');
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

    const classes = ['5B', '5C', '5D', '6C', '6D'];

    // Hash-based router listener
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            const match = hash.match(/#\/catatan\/kelas\/([56][bcd])/i);
            if (match) {
                setViewingClassDetail(match[1].toUpperCase());
            } else {
                setViewingClassDetail(null);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Init on mount

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const navigateToClass = (cls: string) => {
        window.location.hash = `#/catatan/kelas/${cls.toLowerCase()}`;
    };

    const navigateBack = () => {
        window.location.hash = '';
    };

    // Handlers
    const handleAddNote = () => {
        setCurrentNote({});
        setNoteDate(new Date().toISOString().slice(0, 10));
        setNoteCategory('Libur');
        setNoteContent('');
        setNoteTitle('');
        setSelectedClasses(viewingClassDetail ? [viewingClassDetail] : []);
        setIsModalOpen(true);
        setActiveMenuId(null);
    };

    const handleEditNote = (note: Note) => {
        setCurrentNote(note);
        setNoteDate(note.date);
        setNoteCategory(note.category);
        setNoteContent(note.content);
        setNoteTitle(note.title);
        setIsModalOpen(true);
        setActiveMenuId(null);
    };

    const handleDeleteNote = (id: number) => {
        if (confirm('Apakah anda yakin ingin menghapus catatan ini?')) {
            void onDeleteNote(id);
        }
        setActiveMenuId(null);
    };

    const generateTitle = (category: string, cls: string) => {
        if (category === 'Libur') {
            return `Libur Kelas ${cls}`;
        }
        if (category === 'Pengingat') {
            return `Pengingat Kelas ${cls}`;
        }
        return `Catatan ${category} Kelas ${cls}`;
    };

    const handleSaveNote = async () => {
        if (!noteContent) {
            alert('Mohon isi konten catatan');
            return;
        }

        setIsSaving(true);

        try {
            if (currentNote.id) {
                // Editing existing note
                if (!noteTitle) {
                    alert('Mohon isi judul catatan');
                    setIsSaving(false);
                    return;
                }
                await onSaveNote({
                    id: currentNote.id,
                    title: noteTitle,
                    content: noteContent,
                    category: noteCategory,
                    date: noteDate,
                    color: CATEGORIES.find(c => c.name === noteCategory)?.color || 'bg-slate-50 text-slate-700'
                });
            } else {
                // Creating new notes (Bulk option)
                if (selectedClasses.length === 0) {
                    alert('Mohon centang setidaknya satu target kelas');
                    setIsSaving(false);
                    return;
                }
                
                // Save for each checked class
                for (const cls of selectedClasses) {
                    const generatedTitle = generateTitle(noteCategory, cls);
                    await onSaveNote({
                        title: generatedTitle,
                        content: noteContent,
                        category: noteCategory,
                        date: noteDate,
                        color: CATEGORIES.find(c => c.name === noteCategory)?.color || 'bg-slate-50 text-slate-700'
                    });
                }
            }
            setIsModalOpen(false);
            
            // Trigger toast notification
            if (currentNote.id) {
                setToastMessage("Berhasil! Catatan telah diperbarui.");
            } else {
                if (selectedClasses.length === 1) {
                    setToastMessage(`Berhasil! Catatan disimpan untuk Kelas ${selectedClasses[0]}.`);
                } else {
                    setToastMessage(`Berhasil! Catatan ditambahkan ke ${selectedClasses.length} kelas.`);
                }
            }
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
            }, 3000);
        } finally {
            setIsSaving(false);
        }
    };

    // Close options menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setActiveMenuId(null);
            setIsDropdownOpen(false);
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Helper counts for class navigation cards
    const getClassNoteCount = (cls: string) => {
        return notes.filter(n => n.title.includes(cls) || n.content.includes(cls)).length;
    };

    const filteredStudentLogs = React.useMemo(() => {
        if (!isStudent) return [];
        return setoranLogs.filter(log => {
            const matchesSearch = !searchQuery || 
                (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (log.currentSurah && log.currentSurah.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (log.status && log.status.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesMonth = !studentSelectedMonth || 
                (log.date && log.date.slice(0, 7) === studentSelectedMonth);

            return matchesSearch && matchesMonth;
        });
    }, [isStudent, setoranLogs, searchQuery, studentSelectedMonth]);

    const filteredStudentMessages = React.useMemo(() => {
        if (!isStudent || !currentStudent) return [];
        return personalMessages.filter(msg => {
            const matchesSearch = !searchQuery || msg.message.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesMonth = !studentSelectedMonth || msg.date.slice(0, 7) === studentSelectedMonth;
            const matchesStudent = msg.studentId === currentStudent.id || msg.studentName.toUpperCase() === currentStudent.name.toUpperCase();
            return matchesStudent && matchesSearch && matchesMonth;
        });
    }, [isStudent, currentStudent, personalMessages, searchQuery, studentSelectedMonth]);

    const combinedStudentTimeline = React.useMemo(() => {
        const logsMapped = filteredStudentLogs.map(log => ({
            id: log.id,
            date: log.date,
            isMessage: false,
            currentSurah: log.currentSurah,
            status: log.status,
            notes: log.notes,
            requiresAttention: log.requiresAttention,
            type: log.type
        }));

        const msgsMapped = filteredStudentMessages.map(msg => ({
            id: msg.id,
            date: msg.date,
            isMessage: true,
            currentSurah: 'Pesan Khusus',
            status: 'Pesan',
            notes: msg.message,
            requiresAttention: false,
            type: 'Pesan'
        }));

        const combined = [...logsMapped, ...msgsMapped];

        return combined.sort((a, b) => {
            const dateA = a.date || '';
            const dateB = b.date || '';
            return sortOrder === 'terbaru' 
                ? dateB.localeCompare(dateA) 
                : dateA.localeCompare(dateB);
        });
    }, [filteredStudentLogs, filteredStudentMessages, sortOrder]);

    // Filter notes dynamically (Scoped either by class or global)
    const filteredNotes = notes.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              n.content.toLowerCase().includes(searchQuery.toLowerCase());
        
        // If viewing class detail, restrict list to that class. If student, only show their class's notes
        const matchesClass = isStudent
            ? (studentClass ? (n.title.includes(studentClass) || n.content.includes(studentClass)) : false)
            : (!viewingClassDetail || n.title.includes(viewingClassDetail) || n.content.includes(viewingClassDetail));
        
        let matchesDate = true;
        if (startDate && n.date < startDate) {
            matchesDate = false;
        }
        if (endDate && n.date > endDate) {
            matchesDate = false;
        }
        
        return matchesSearch && matchesClass && matchesDate;
    });

    // 1. Get all notes sorted descending (newest first)
    const newestNotes = [...filteredNotes].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    
    // 2. Dashboard notes (always the 5 absolute newest notes)
    const dashboardNotes = newestNotes.slice(0, 5);
    
    // 3. Render according to sortOrder (sorting direction)
    const notesToRender = isStudent
        ? (sortOrder === 'terbaru' 
            ? newestNotes 
            : [...newestNotes].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id))
        : (viewingClassDetail
            ? (sortOrder === 'terbaru' 
                ? newestNotes 
                : [...newestNotes].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id))
            : (sortOrder === 'terbaru'
                ? dashboardNotes
                : [...dashboardNotes].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)));

    // Metric Calculations
    const currentNotesSet = viewingClassDetail 
        ? notes.filter(n => n.title.includes(viewingClassDetail) || n.content.includes(viewingClassDetail)) 
        : notes;

    const thisMonthCount = currentNotesSet.filter(n => {
        return n.date.includes('2025-12') || n.date.includes('2026-06') || n.date.includes('2026-07');
    }).length;

    const categoriesCount: { [key: string]: number } = {};
    currentNotesSet.forEach(n => {
        categoriesCount[n.category] = (categoriesCount[n.category] || 0) + 1;
    });
    let dominantCategory = 'Libur';
    let maxCount = 0;
    Object.entries(categoriesCount).forEach(([cat, count]) => {
        if (count > maxCount) {
            maxCount = count;
            dominantCategory = cat;
        }
    });

    const getCategoryStyle = (category: string) => {
        switch(category) {
            case 'Libur':
                return 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            case 'Pengingat':
                return 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
            case 'Teaching':
                return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'Meeting':
                return 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
            case 'Priority':
                return 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';
            case 'Libur/Event':
                return 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400';
            case 'Personal':
            default:
                return 'bg-slate-50 text-slate-600 dark:bg-[#09120E] dark:text-[#8BA398] border border-slate-200 dark:border-[#1A2E24]';
        }
    };

    const getStudentMonthOptions = () => {
        const months = new Set<string>();
        setoranLogs.forEach(l => {
            if (l.date) {
                months.add(l.date.slice(0, 7)); // YYYY-MM
            }
        });
        return Array.from(months).sort().reverse();
    };

    return (
        <div className="space-y-6 lg:space-y-0 lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden h-auto lg:h-full">
            {/* Sticky Header & Tab Switcher Container */}
            <div className="sticky top-0 z-30 bg-slate-50 dark:bg-[#09120E] pt-4 pb-2 w-full flex-none no-print transition-colors duration-300">
                {/* Header Section (Floating Card Style) */}
                <div className="bg-gradient-to-br from-[#E6F3EE] to-[#F2F9F6]/80 dark:bg-gradient-to-br dark:from-[#12231A] dark:to-[#0C1A13]/90 p-4 sm:p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-emerald-200/60 dark:border-[#1E382B] flex flex-col gap-3 sm:gap-4 transition-all duration-300">
                    <Header
                        user={user!}
                        onMenuClick={onMenuClick}
                        notifications={notifications}
                        onDismissNotification={onDismissNotification}
                        onSearchClick={onSearchClick}
                        flat={true}
                        title="Catatan Saya"
                        subtitle={`Kelola catatan harian dan evaluasi pembelajaran${isSyncing ? ' - sinkronisasi Supabase aktif' : ''}`}
                        unreadNotesCount={unreadNotesCount}
                        actionButton={
                            !isStudent && activeTab === 'akademik' ? (
                                <button
                                    onClick={handleAddNote}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm cursor-pointer text-sm"
                                >
                                    <Plus size={20} />
                                    <span>Buat Catatan</span>
                                </button>
                            ) : !isStudent && activeTab === 'personal' ? (
                                <button
                                    onClick={onOpenMessageDrawer || (() => setIsPersonalModalOpen(true))}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm cursor-pointer text-sm"
                                >
                                    <Plus size={20} />
                                    <span>Tulis Pesan</span>
                                </button>
                            ) : undefined
                        }
                    />
                </div>

                {/* Tab Switcher for Teacher */}
                {!isStudent && (
                    <div className="flex gap-6 border-b dark:border-white/10 mt-5 mb-2 px-2 shrink-0">
                        <button
                            onClick={() => setActiveTab('akademik')}
                            className={activeTab === 'akademik'
                                ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 pb-3 text-sm font-medium transition-all cursor-pointer"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pb-3 text-sm font-medium transition-all cursor-pointer"
                            }
                        >
                            Evaluasi Akademik
                        </button>
                        <button
                            onClick={() => setActiveTab('personal')}
                            className={activeTab === 'personal'
                                ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 pb-3 text-sm font-medium transition-all cursor-pointer"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pb-3 text-sm font-medium transition-all cursor-pointer"
                            }
                        >
                            Pesan Personal
                        </button>
                    </div>
                )}
            </div>

            {/* Area Konten (Fixed Viewport) */}
            <div className="flex-1 flex flex-col overflow-hidden pt-3 pb-6 pr-1 -mx-4 sm:-mx-8 px-4 sm:px-8 bg-slate-50 dark:bg-[#09120E] transition-colors duration-300">

                {isStudent ? (
                    <>
                        <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white dark:bg-none dark:bg-[#121F18] dark:border dark:border-[#1A2E24] rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-emerald-800 text-amber-400 dark:bg-[#1A2E24] dark:text-[#E2EAE5]">
                                    <GraduationCap size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold uppercase tracking-wide">EVALUASI PERKEMBANGAN BELAJAR</h3>
                                    <p className="text-emerald-100 dark:text-[#8BA398] text-xs mt-1">
                                        Berikut adalah catatan evaluasi, tajwid, dan saran perbaikan dari Ustadz/Guru Anda.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Tata Letak Dua Kolom (Bottom Section) */}
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 overflow-hidden min-h-0">
                            
                            {/* LEFT COLUMN: Panel Opsi & Ringkasan */}
                            <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-hidden p-1.5 pb-4">
                                <div className="bg-white dark:bg-[#111D16] border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4 transition-colors">
                                    <h4 className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Kendali Catatan</h4>
                                    <div className="relative w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Cari evaluasi..."
                                            className="w-full bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] rounded-lg pl-9 pr-3 py-2 text-slate-700 dark:text-[#E2EAE5] focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors text-xs font-semibold"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-slate-400 dark:text-[#8BA398]">Pilih Bulan</span>
                                        <div className="relative">
                                            <select
                                                value={studentSelectedMonth}
                                                onChange={(e) => setStudentSelectedMonth(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] rounded-lg pl-3 pr-8 py-2 text-slate-700 dark:text-[#E2EAE5] focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors text-xs font-bold appearance-none cursor-pointer"
                                            >
                                                <option value="">Semua Bulan</option>
                                                {getStudentMonthOptions().map(mon => {
                                                    const [year, month] = mon.split('-');
                                                    const monthNames = [
                                                        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                                                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                                                    ];
                                                    const indMonthName = monthNames[parseInt(month) - 1] || month;
                                                    return (
                                                        <option key={mon} value={mon}>
                                                            {indMonthName} {year}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl p-6 gap-4 dark:bg-[#111D16] dark:border-white/5 shadow-lg shadow-black/20 transition-colors overflow-hidden min-h-0">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-[#E2EAE5] text-lg">Ringkasan Evaluasi</h3>
                                        <p className="text-slate-500 dark:text-[#8BA398] text-xs mt-1">Metrik catatan bimbingan Anda</p>
                                    </div>
                                    <div className="flex flex-col gap-4 mt-2 flex-1 justify-center">
                                        <div className="bg-white dark:bg-emerald-900/10 border border-slate-100 dark:border-emerald-500/20 p-4 rounded-xl shadow-sm flex items-center gap-4 hover:border-emerald-200 dark:hover:border-emerald-500/40 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">TOTAL EVALUASI</p>
                                                <p className="text-xl font-black text-slate-800 dark:text-[#E2EAE5] mt-0.5">{combinedStudentTimeline.length} Catatan</p>
                                            </div>
                                        </div>
                                        <div className={`p-4 rounded-xl shadow-sm flex items-center gap-4 border transition-colors ${
                                            combinedStudentTimeline.filter(l => l.requiresAttention).length > 0
                                                ? 'bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-500/35 hover:border-red-300 dark:hover:border-red-500/50 text-slate-800 dark:text-[#E2EAE5]'
                                                : 'bg-white dark:bg-red-900/10 border-slate-100 dark:border-red-500/20 hover:border-red-200 dark:hover:border-red-500/40 text-slate-800 dark:text-[#E2EAE5]'
                                        }`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                                combinedStudentTimeline.filter(l => l.requiresAttention).length > 0
                                                    ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                                                    : 'bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400'
                                            }`}>
                                                <AlertTriangle size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">PERLU PERHATIAN</p>
                                                <p className={`text-xl font-black mt-0.5 ${
                                                    combinedStudentTimeline.filter(l => l.requiresAttention).length > 0
                                                        ? 'text-red-600 dark:text-red-400 font-extrabold'
                                                        : 'text-slate-800 dark:text-[#E2EAE5]'
                                                }`}>
                                                    {combinedStudentTimeline.filter(l => l.requiresAttention).length} Catatan
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Table Area */}
                            <div className="lg:col-span-2 bg-white dark:bg-[#15231A] border border-slate-200 dark:border-white/15 rounded-xl shadow-lg shadow-black/30 p-6 overflow-hidden transition-colors duration-300 animate-in fade-in">
                                <div className="flex justify-between items-start mb-6 gap-4">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-[#E2EAE5] text-lg">Riwayat Evaluasi Hafalan</h3>
                                        <p className="text-slate-500 dark:text-[#8BA398] text-xs mt-1">
                                            Menampilkan catatan evaluasi dan perbaikan hafalan dari Ustadz/Guru.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <select
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value as 'terbaru' | 'terlama')}
                                            className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] text-xs text-slate-700 dark:text-[#E2EAE5] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer shadow-sm transition-colors font-semibold"
                                        >
                                            <option value="terbaru">Terbaru</option>
                                            <option value="terlama">Terlama</option>
                                        </select>
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-full">Real-time</span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 mt-4">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-[#1A2E24] text-slate-400 dark:text-[#8BA398] text-[11px] font-bold uppercase tracking-wider">
                                                <th className="pb-3 pl-1 w-1/5">TANGGAL</th>
                                                <th className="pb-3 text-left w-1/4">MATERI / SURAH</th>
                                                <th className="pb-3 text-left w-1/6">PREDIKAT</th>
                                                <th className="pb-3 text-left w-2/5">CATATAN GURU</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-[#1A2E24] text-sm">
                                            {loadingSetoran ? (
                                                <tr>
                                                    <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-[#8BA398] font-bold text-sm">
                                                        Memuat catatan evaluasi...
                                                    </td>
                                                </tr>
                                            ) : combinedStudentTimeline.map((item) => {
                                                const formattedDate = item.date 
                                                    ? new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                                    : '-';
                                                
                                                if (item.isMessage) {
                                                    return (
                                                        <tr 
                                                            key={item.id} 
                                                            className="hover:bg-slate-50/50 dark:hover:bg-[#1C3026]/30 transition-colors border-b border-slate-100 dark:border-[#1A2E24] last:border-0 group bg-emerald-50/15 dark:bg-emerald-950/10"
                                                        >
                                                            <td className="py-4 pl-1 font-semibold text-slate-500 dark:text-[#8BA398] text-xs">
                                                                <div className="flex flex-col gap-1">
                                                                    <span>{formattedDate}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 text-emerald-600 dark:text-emerald-400 font-bold">
                                                                <div className="flex items-center gap-1.5">
                                                                    <MessageSquare size={14} className="text-emerald-500 shrink-0" />
                                                                    <span className="truncate">{item.currentSurah}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4">
                                                                <span className="text-xs font-semibold px-2.5 py-1 rounded-md w-max block bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                                                    Pribadi
                                                                </span>
                                                            </td>
                                                            <td className="py-4 text-slate-800 dark:text-[#E2EAE5] text-left leading-relaxed whitespace-pre-wrap font-semibold">
                                                                {item.notes}
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return (
                                                    <tr 
                                                        key={item.id} 
                                                        className={`transition-colors border-b border-slate-100 dark:border-[#1A2E24] last:border-0 group ${
                                                            item.requiresAttention 
                                                                ? 'bg-rose-50/40 dark:bg-rose-950/10 border-l-4 border-l-rose-500' 
                                                                : 'hover:bg-slate-50/50 dark:hover:bg-[#1C3026]/30'
                                                        }`}
                                                    >
                                                        <td className="py-4 pl-1 font-semibold text-slate-500 dark:text-[#8BA398] text-xs">
                                                            <div className="flex flex-col gap-1">
                                                                <span>{formattedDate}</span>
                                                                {item.requiresAttention && (
                                                                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                                                                        <AlertTriangle size={10} /> Perlu Perhatian
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 text-slate-800 dark:text-[#E2EAE5] font-bold">
                                                            <div className="flex items-center gap-1.5">
                                                                <BookOpen size={14} className="text-emerald-500 shrink-0" />
                                                                <span className="truncate">{item.currentSurah}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4">
                                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md w-max block ${
                                                                item.status === 'Mumtaz' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                                                                item.status === 'Perlu Bimbingan' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' :
                                                                'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                                                            }`}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-slate-800 dark:text-[#E2EAE5] text-left leading-relaxed whitespace-pre-wrap font-medium">
                                                            {item.notes}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {combinedStudentTimeline.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-[#8BA398] font-bold text-sm">
                                                        Belum ada evaluasi hafalan atau pesan khusus dicatat.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                ) : activeTab === 'personal' ? (
                    // ==========================================
                    // TEACHER TAB: PESAN PERSONAL
                    // ==========================================
                    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
                                    <MessageSquare className="text-emerald-600 dark:text-emerald-400 shrink-0" size={24} />
                                    Komunikasi Pesan Personal
                                </h3>
                                <p className="text-slate-500 dark:text-[#8BA398] text-xs mt-1">
                                    Kirim pesan bimbingan khusus, nasehat pribadi, atau apresiasi langsung ke dashboard siswa.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    if (onOpenMessageDrawer) {
                                        onOpenMessageDrawer();
                                    } else {
                                        if (students.length > 0) {
                                            setSelectedStudentId(students[0].id);
                                        }
                                        setIsPersonalModalOpen(true);
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm cursor-pointer text-sm"
                            >
                                <Plus size={18} />
                                <span>Tulis Pesan Baru</span>
                            </button>
                        </div>

                        {/* Table Riwayat Pesan */}
                        <div className="flex-1 bg-white dark:bg-[#15231A] border dark:border-white/10 shadow-lg shadow-black/30 rounded-xl p-5 flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                                <h4 className="font-bold text-slate-800 dark:text-[#E2EAE5] text-sm">Riwayat Pesan Terkirim</h4>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full">
                                    Real-time
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-white/5 text-slate-400 dark:text-[#8BA398] text-[11px] font-bold uppercase tracking-wider">
                                            <th className="pb-3 pl-1 w-1/4">TANGGAL</th>
                                            <th className="pb-3 text-left w-1/4">NAMA SISWA</th>
                                            <th className="pb-3 text-left w-2/5">CUPLIKAN PESAN</th>
                                            <th className="pb-3 text-center w-28">STATUS BACA</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                                        {personalMessages.map((msg) => {
                                            const formattedDate = new Date(msg.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                                            return (
                                                <tr key={msg.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C3026]/30 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0 group">
                                                    <td className="py-4 pl-1 font-semibold text-slate-500 dark:text-[#8BA398] text-xs">{formattedDate}</td>
                                                    <td className="py-4 font-bold text-slate-800 dark:text-[#E2EAE5]">{msg.studentName}</td>
                                                    <td className="py-4 text-slate-655 dark:text-[#8BA398] text-left pr-4 leading-relaxed font-medium">
                                                        <p className="truncate max-w-[320px] md:max-w-[450px]" title={msg.message}>
                                                            {msg.message}
                                                        </p>
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                                            msg.status === 'Dibaca'
                                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                                : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-[#8BA398] border-slate-200 dark:border-white/10'
                                                        }`}>
                                                            {msg.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {personalMessages.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-[#8BA398] font-bold text-sm">
                                                    Belum ada riwayat pesan personal yang dikirim.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    // ==========================================
                    // TEACHER TAB: EVALUASI AKADEMIK
                    // ==========================================
                    <>
                        {viewingClassDetail ? (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <button
                                    onClick={navigateBack}
                                    className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-bold cursor-pointer text-sm"
                                >
                                    <span>← Kembali ke Dasbor Catatan</span>
                                </button>

                                <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white dark:bg-none dark:bg-[#121F18] dark:border dark:border-[#1A2E24] rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-lg bg-emerald-800 text-amber-400 dark:bg-[#1A2E24] dark:text-[#E2EAE5]">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold uppercase tracking-wide">LOG CATATAN - KELAS {viewingClassDetail}</h3>
                                            <p className="text-emerald-100 dark:text-[#8BA398] text-xs mt-1">
                                                Menampilkan seluruh arsip catatan evaluasi khusus untuk Kelas {viewingClassDetail}.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Otherwise render the top Class Cards grid (Without Semua Kelas)
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-6">
                                {classes.map(cls => (
                                    <div 
                                        key={cls}
                                        onClick={() => navigateToClass(cls)}
                                        className="bg-white dark:bg-[#15231A] border border-slate-200 dark:border-white/15 rounded-xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
                                    >
                                        <div className="flex justify-between items-center w-full gap-2">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                <Users size={16} className="sm:w-5 sm:h-5" />
                                            </div>
                                            <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                Lihat Data
                                            </span>
                                        </div>
                                        <div className="mt-2.5 sm:mt-4 min-w-0">
                                            <h4 className="font-black text-slate-800 dark:text-[#E2EAE5] text-sm sm:text-lg truncate">Kelas {cls}</h4>
                                            <p className="text-slate-500 dark:text-[#8BA398] text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-semibold truncate">{getClassNoteCount(cls)} Catatan Tercatat</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 2. Tata Letak Dua Kolom (Bottom Section) */}
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 overflow-hidden min-h-0">
                            
                            {/* LEFT COLUMN: Panel Opsi & Ringkasan */}
                            <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-hidden p-1.5 pb-4">
                                <div className="bg-white dark:bg-[#111D16] border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-lg shadow-black/20 space-y-4 transition-colors">
                                    <h4 className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Kendali Catatan</h4>
                                    <div className="relative w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Cari catatan..."
                                            className="w-full bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] rounded-lg pl-9 pr-3 py-2 text-slate-700 dark:text-[#E2EAE5] focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors text-xs font-semibold"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-slate-400 dark:text-[#8BA398]">Rentang Waktu</span>
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] rounded-lg px-2.5 py-1.5 text-xs transition-colors">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="bg-transparent text-slate-700 dark:text-[#E2EAE5] outline-none font-bold cursor-pointer w-full"
                                            />
                                            <span className="text-slate-400 dark:text-[#8BA398] font-bold">s.d.</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="bg-transparent text-slate-700 dark:text-[#E2EAE5] outline-none font-bold cursor-pointer w-full"
                                            />
                                        </div>
                                        {(startDate || endDate) && (
                                            <button
                                                onClick={() => {
                                                    setStartDate('');
                                                    setEndDate('');
                                                }}
                                                className="text-[10px] text-rose-500 hover:text-rose-600 font-bold transition-colors cursor-pointer block mt-1"
                                            >
                                                Reset Rentang Waktu
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl p-6 gap-4 dark:bg-[#111D16] dark:border-white/5 shadow-lg shadow-black/20 transition-colors overflow-hidden min-h-0">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-[#E2EAE5] text-lg">Status Catatan Hari Ini</h3>
                                        <p className="text-slate-500 dark:text-[#8BA398] text-xs mt-1">Status dan rekapitulasi evaluasi aktif</p>
                                    </div>
                                    <div className="flex flex-col gap-4 mt-2 flex-1 justify-center">
                                        <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-[#1A2E24] p-4 shadow-sm flex items-center gap-4 hover:border-emerald-200 transition-all">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">TOTAL BULAN INI</p>
                                                <p className="text-xl font-black text-slate-800 dark:text-[#E2EAE5] mt-0.5">{thisMonthCount} Catatan</p>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-[#1A2E24] p-4 shadow-sm flex items-center gap-4 hover:border-emerald-200 transition-all">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600 dark:indigo-400 shrink-0">
                                                <BookOpen size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">KATEGORI DOMINAN</p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-[#E2EAE5] mt-0.5">{dominantCategory}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Table Area */}
                            <div className="lg:col-span-2 bg-white dark:bg-[#15231A] border border-slate-200 dark:border-white/15 rounded-xl shadow-lg shadow-black/30 p-6 overflow-hidden transition-colors duration-300 animate-in fade-in">
                                <div className="flex justify-between items-start mb-6 gap-4">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-[#E2EAE5] text-lg">
                                            {viewingClassDetail 
                                                ? (sortOrder === 'terbaru' ? `Catatan Terbaru Kelas ${viewingClassDetail}` : `Catatan Terlama Kelas ${viewingClassDetail}`)
                                                : "5 Catatan Terbaru"}
                                        </h3>
                                        <p className="text-slate-500 dark:text-[#8BA398] text-xs mt-1">
                                            {viewingClassDetail 
                                                ? `Menampilkan catatan ${sortOrder === 'terbaru' ? 'terbaru' : 'terlama'} khusus untuk Kelas ${viewingClassDetail}.`
                                                : "5 ringkasan catatan terbaru yang diinput dari keseluruhan kelas."}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <select
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value as 'terbaru' | 'terlama')}
                                            className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] text-xs text-slate-700 dark:text-[#E2EAE5] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer shadow-sm transition-colors font-semibold"
                                        >
                                            <option value="terbaru">Terbaru</option>
                                            <option value="terlama">Terlama</option>
                                        </select>
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-full">Real-time</span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 mt-4">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-[#1A2E24] text-slate-400 dark:text-[#8BA398] text-[11px] font-bold uppercase tracking-wider">
                                                <th className="pb-3 pl-1 w-1/4">TANGGAL</th>
                                                <th className="pb-3 text-left w-1/4">KATEGORI</th>
                                                <th className="pb-3 text-left w-1/2">ISI CATATAN</th>
                                                <th className="pb-3 text-center w-16">AKSI</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-[#1A2E24] text-sm">
                                            {notesToRender.map((note) => (
                                                <tr key={note.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C3026]/30 transition-colors border-b border-slate-100 dark:border-[#1A2E24] last:border-0 group">
                                                    <td className="py-4 pl-1 font-semibold text-slate-500 dark:text-[#8BA398] text-xs w-1/4">{note.date}</td>
                                                    <td className="py-4 w-1/4">
                                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md w-max block ${getCategoryStyle(note.category)}`}>
                                                            {note.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-slate-800 dark:text-[#E2EAE5] text-left w-1/2">
                                                        <div className="font-bold text-slate-800 dark:text-[#E2EAE5]">{note.title}</div>
                                                        <div className="text-xs text-slate-500 dark:text-[#8BA398] mt-1 leading-relaxed whitespace-pre-wrap">{note.content}</div>
                                                    </td>
                                                    <td className="py-4 text-center w-16" onClick={(e) => e.stopPropagation()}>
                                                        <div className="relative inline-block">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveMenuId(activeMenuId === note.id ? null : note.id);
                                                                }}
                                                                className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer p-1 rounded-full hover:bg-slate-50 dark:hover:bg-[#1C3026] transition-colors"
                                                            >
                                                                <MoreVertical size={16} />
                                                            </button>
                                                            {activeMenuId === note.id && (
                                                                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-[#121F18] rounded-xl shadow-xl border border-slate-100 dark:border-[#1A2E24] py-1 z-10 animate-in fade-in zoom-in duration-200">
                                                                    <button
                                                                        onClick={() => handleEditNote(note)}
                                                                        className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-[#8BA398] hover:bg-slate-50 dark:hover:bg-[#1C3026] hover:text-emerald-600 flex items-center gap-2 cursor-pointer"
                                                                    >
                                                                        <Edit2 size={14} /> Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteNote(note.id)}
                                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 cursor-pointer"
                                                                    >
                                                                        <Trash2 size={14} /> Hapus
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {notesToRender.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-[#8BA398] font-bold text-sm">
                                                        Belum ada catatan ditemukan pada rentang waktu yang dipilih.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}

            </div>

            {/* Note Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] rounded-2xl shadow-xl w-full max-w-2xl p-6 overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-[#1A2E24]">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-[#E2EAE5]">
                                {currentNote.id ? 'Edit Catatan' : 'Buat Catatan Baru'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-50 dark:hover:bg-[#1C3026]"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-1 py-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Date Input */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-[#8BA398] mb-1.5 uppercase">Tanggal</label>
                                    <input
                                        type="date"
                                        value={noteDate}
                                        onChange={(e) => setNoteDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-[#E2EAE5] focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer font-medium"
                                    />
                                </div>

                                {/* Category Dropdown */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-[#8BA398] mb-1.5 uppercase">Kategori</label>
                                    <select
                                        value={noteCategory}
                                        onChange={(e) => setNoteCategory(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-[#E2EAE5] focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer font-semibold"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.name} value={cat.name} className="dark:bg-[#121F18]">
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Title (Only shown when Editing) */}
                            {currentNote.id && (
                                <div className="animate-in fade-in duration-200">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-[#8BA398] mb-1.5 uppercase">Judul</label>
                                    <input
                                        type="text"
                                        value={noteTitle}
                                        onChange={(e) => setNoteTitle(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-[#E2EAE5] focus:ring-1 focus:ring-emerald-500 outline-none font-bold"
                                        placeholder="Judul catatan..."
                                    />
                                </div>
                            )}

                            {/* Batch Class Selector (Only shown when Creating) */}
                            {!currentNote.id && (
                                <div className="space-y-2 border-t border-slate-100 dark:border-[#1A2E24] pt-4 mt-2 animate-in fade-in duration-200">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-[#8BA398] uppercase">Target Kelas</label>
                                    
                                    <div className="flex flex-col gap-2 mt-1">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={selectedClasses.length === classes.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedClasses(classes);
                                                    } else {
                                                        setSelectedClasses([]);
                                                    }
                                                }}
                                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-[#1D3026] dark:bg-[#09120E]"
                                            />
                                            <span className="text-sm font-bold text-slate-800 dark:text-[#E2EAE5]">Pilih Semua Kelas</span>
                                        </label>
                                        
                                        <div className="flex flex-wrap gap-4 mt-1 pl-1">
                                            {classes.map(cls => (
                                                <label key={cls} className="flex items-center gap-2 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedClasses.includes(cls)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedClasses([...selectedClasses, cls]);
                                                            } else {
                                                                setSelectedClasses(selectedClasses.filter(c => c !== cls));
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-[#1D3026] dark:bg-[#09120E]"
                                                    />
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-[#8BA398]">{cls}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Content Textarea */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-[#8BA398] mb-1.5 uppercase">Isi Catatan</label>
                                <textarea
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-[#8BA398] outline-none min-h-[120px] resize-none leading-relaxed"
                                    placeholder="Tulis catatan anda disini..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-[#1A2E24]">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1A2E24] rounded-lg transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveNote}
                                disabled={isSaving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer text-sm flex items-center gap-1.5"
                            >
                                <Save size={16} />
                                {isSaving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* New Personal Message Modal */}
            {isPersonalModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] rounded-2xl shadow-xl w-full max-w-lg p-6 overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-[#1A2E24]">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-[#E2EAE5]">
                                Kirim Pesan Personal Baru
                            </h2>
                            <button
                                onClick={() => setIsPersonalModalOpen(false)}
                                className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-50 dark:hover:bg-[#1C3026]"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-1 py-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
                            {/* Student Selector (Searchable Select Autocomplete) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-[#8BA398] mb-1.5 uppercase">Pilih Siswa</label>
                                <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                        type="text" 
                                        placeholder="Ketik nama siswa..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setIsDropdownOpen(true);
                                            if (!e.target.value) {
                                                setSelectedStudentId('');
                                            }
                                        }}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        className="w-full bg-[#15231A] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm font-semibold"
                                    />
                                    
                                    {isDropdownOpen && (
                                        <div className="absolute z-50 w-full mt-1 bg-[#15231A] border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
                                            {filteredStudents.length > 0 ? (
                                                filteredStudents.map(student => (
                                                    <div
                                                        key={student.id}
                                                        onClick={() => {
                                                            setSelectedStudentId(student.id);
                                                            setSearchTerm(student.name);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className="px-4 py-2 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 cursor-pointer transition-colors flex items-center justify-between text-xs font-bold"
                                                    >
                                                        <span>{student.name}</span>
                                                        <span className="text-[10px] bg-[#09120E] text-slate-400 border border-white/5 px-2 py-0.5 rounded">Kelas {student.class}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 text-center text-slate-500 text-sm font-medium">
                                                    Siswa tidak ditemukan
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Message Textarea */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-[#8BA398] mb-1.5 uppercase">Isi Pesan</label>
                                <textarea
                                    value={personalMessageText}
                                    onChange={(e) => setPersonalMessageText(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-[#8BA398] outline-none min-h-[140px] resize-none leading-relaxed"
                                    placeholder="Tulis pesan personal bimbingan atau motivasi..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-[#1A2E24]">
                            <button
                                onClick={() => setIsPersonalModalOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1A2E24] rounded-lg transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSendPersonalMessage}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer text-sm flex items-center gap-1.5"
                            >
                                <Send size={16} />
                                <span>Kirim Pesan</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {/* Toast Notification */}
            <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all duration-300 ease-in-out transform ${
                showToast ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
            }`}>
                <CheckCircle2 size={20} className="text-white shrink-0" />
                <span className="text-sm font-bold">{toastMessage}</span>
            </div>
        </div>
    );
};

export default CatatanPage;
