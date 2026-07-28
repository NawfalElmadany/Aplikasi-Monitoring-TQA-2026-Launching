import React, { useState, useMemo, useEffect } from 'react';
import { Student, User as UserType } from '../types';
import Header from './Header';
import { Search, ChevronRight, ChevronLeft, Save, AlignLeft, BookOpen, User, Calendar, CheckCircle } from 'lucide-react';
import { getAssignedTeacher } from '../services/appData';

interface SetoranPageProps {
    students: Student[];
    onSave: (id: string, data: Partial<Student> & { date?: string }) => Promise<void>;
    preSelectedStudent?: Student | null;
    user: UserType;
    onMenuClick: () => void;
    notifications?: Student[];
    onDismissNotification?: (studentId: string) => void;
    onSearchClick?: () => void;
}

// Data Surah Mapping (Reused from NewSetoranModal)
const JUZ_DATA: Record<number, string[]> = {
    1: ["Al-Fatihah", "Al-Baqarah"],
    2: ["Al-Baqarah"],
    3: ["Al-Baqarah", "Ali 'Imran"],
    4: ["Ali 'Imran", "An-Nisa'"],
    5: ["An-Nisa'"],
    6: ["An-Nisa'", "Al-Ma'idah"],
    7: ["Al-Ma'idah", "Al-An'am"],
    26: ["Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adh-Dhariyat"],
    27: ["Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid"],
    28: [
        "Al-Mujadila", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah",
        "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim"
    ],
    29: [
        "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn",
        "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat"
    ],
    30: [
        "An-Naba", "An-Nazi'at", "'Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin",
        "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr",
        "Al-Balad", "Ash-Shams", "Al-Lail", "Ad-Duhaa", "Ash-Sharh", "At-Tin",
        "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah",
        "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraish", "Al-Ma'un",
        "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Lahab", "Al-Ikhlas", "Al-Falaq", "An-Nas"
    ]
};

const surahs30 = JUZ_DATA[30];

const SetoranPage: React.FC<SetoranPageProps> = ({ 
    students, 
    onSave, 
    preSelectedStudent,
    user,
    onMenuClick,
    notifications = [],
    onDismissNotification,
    onSearchClick
}) => {
    const defaultTeacher = useMemo(() => {
        if (user && user.role === 'teacher') {
            const nameLower = user.name.toLowerCase();
            if (nameLower.includes('nawfal')) return 'Ustadz Nawfal';
            if (nameLower.includes('ining')) return 'Ustadzah Ining';
            if (nameLower.includes('rahma')) return 'Ustadzah Rahma';
        }
        return 'Semua';
    }, [user]);

    const [selectedClass, setSelectedClass] = useState<string>(preSelectedStudent?.class || 'Semua');
    const [selectedTeacher, setSelectedTeacher] = useState<string>(defaultTeacher);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(preSelectedStudent || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [jenisSetoran, setJenisSetoran] = useState<'Lanjut' | 'Mengulang' | 'Drill'>('Lanjut');
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

    useEffect(() => {
        if (preSelectedStudent) {
            setSelectedStudent(preSelectedStudent);
            setSelectedClass(preSelectedStudent.class);
        }
    }, [preSelectedStudent]);
    const [setoranBerdasarkanAyat, setSetoranBerdasarkanAyat] = useState(false);

    // Form State
    const [setoranType, setSetoranType] = useState<'Hafalan' | 'Tartili' | 'Drill Munaqosah' | 'Drill Tartili'>('Hafalan');
    const [tartiliMaterial, setTartiliMaterial] = useState<'Jilid' | 'Al-Quran' | 'Gharib'>('Jilid');
    const [inputDate, setInputDate] = useState(() => new Date().toLocaleDateString('en-CA'));
    const [formData, setFormData] = useState({
        currentJuz: 30,
        selectedSurah: '',
        verseStart: '',
        verseEnd: '',
        iqraLevel: 1,
        page: '',
        pageEnd: '',
        score: '',
        status: 'Jayyid' as Student['status'],
        notes: '',
        requiresAttention: false,
        drillStartSurah: '',
        drillEndSurah: ''
    });

    const autoFillLastProgress = () => {
        if (!selectedStudent) return;

        const isTartili = selectedStudent.type === 'Tartili' ||
            selectedStudent.currentSurah.toLowerCase().includes('iqra') ||
            selectedStudent.currentSurah.toLowerCase().includes('jilid');

        let namePart = '';
        let rangePart = ['', ''];
        
        if (setoranType === 'Hafalan' || (setoranType === 'Tartili' && tartiliMaterial === 'Al-Quran')) {
            const surahParts = selectedStudent.currentSurah.split(':');
            namePart = surahParts[0] || '';
            rangePart = surahParts[1] ? surahParts[1].trim().split('-') : ['', ''];
            
            setFormData(prev => ({
                ...prev,
                currentJuz: selectedStudent.currentJuz || 30,
                selectedSurah: namePart,
                verseStart: rangePart[0] || '',
                verseEnd: rangePart[1] || ''
            }));
        } else if (setoranType === 'Tartili' && tartiliMaterial === 'Jilid') {
            let pageStart = selectedStudent.page || '';
            let pageEnd = '';
            if (pageStart.includes('-')) {
                const parts = pageStart.split('-');
                pageStart = parts[0].trim();
                pageEnd = parts[1].trim();
            }

            setFormData(prev => ({
                ...prev,
                iqraLevel: selectedStudent.iqraLevel || 1,
                page: pageStart,
                pageEnd: pageEnd
            }));
        }
    };

    // Auto-fill trigger when Mengulang is selected
    useEffect(() => {
        if (jenisSetoran === 'Mengulang' && selectedStudent) {
            autoFillLastProgress();
        }
    }, [jenisSetoran, setoranType, tartiliMaterial, selectedStudent]);
    
    // Toast Notification State
    const [showToast, setShowToast] = useState(false);
    const [toastStudentName, setToastStudentName] = useState('');

    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    const classes = ['Semua', '5B', '5C', '5D', '6C', '6D'];
    const iqraLevels = [1, 2, 3, 4, 5, 6];
    const availableSurahs = JUZ_DATA[formData.currentJuz] || [];

    // Filter Students
    const filteredStudents = useMemo(() => {
        let filtered = students;
        if (selectedClass !== 'Semua') {
            filtered = filtered.filter(s => s.class === selectedClass);
        }
        if (selectedTeacher !== 'Semua') {
            filtered = filtered.filter(s => {
                const classStudents = students
                    .filter(cs => cs.class === s.class)
                    .sort((a, b) => a.name.localeCompare(b.name));
                const idx = classStudents.findIndex(cs => cs.id === s.id);
                if (idx === -1) return false;
                const teacherInfo = getAssignedTeacher(s.name, s.class, idx);
                return teacherInfo.name === selectedTeacher;
            });
        }
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(s => s.name.toLowerCase().includes(lowerQuery));
        }
        return filtered;
    }, [students, selectedClass, selectedTeacher, searchQuery]);

    // Initialize Form on Student Select
    useEffect(() => {
        if (selectedStudent) {
            const isTartili = selectedStudent.type === 'Tartili' ||
                selectedStudent.currentSurah.toLowerCase().includes('iqra') ||
                selectedStudent.currentSurah.toLowerCase().includes('jilid');

            const detectedSetoranType = isTartili ? 'Tartili' : 'Hafalan';
            setSetoranType(detectedSetoranType);

            let detectedMaterial: 'Jilid' | 'Al-Quran' | 'Gharib' = 'Jilid';
            if (detectedSetoranType === 'Tartili') {
                const surahLower = selectedStudent.currentSurah.toLowerCase();
                if (surahLower.includes('gharib')) {
                    detectedMaterial = 'Gharib';
                } else if (!surahLower.includes('iqra') && !surahLower.includes('jilid')) {
                    detectedMaterial = 'Al-Quran';
                }
            }
            setTartiliMaterial(detectedMaterial);

            setFormData({
                currentJuz: selectedStudent.currentJuz || 30,
                selectedSurah: '',
                verseStart: '',
                verseEnd: '',
                iqraLevel: selectedStudent.iqraLevel || 1,
                page: '',
                pageEnd: '',
                score: '',
                status: 'Jayyid',
                notes: '',
                requiresAttention: false,
                drillStartSurah: '',
                drillEndSurah: ''
            });
            setJenisSetoran('Lanjut');
            setSetoranBerdasarkanAyat(false);
        }
    }, [selectedStudent]);

    const isQuranInput = setoranType === 'Hafalan' || (setoranType === 'Tartili' && tartiliMaterial === 'Al-Quran');
    const isJilidInput = setoranType === 'Tartili' && tartiliMaterial === 'Jilid';
    const isGharibInput = setoranType === 'Tartili' && tartiliMaterial === 'Gharib';
    const isDrillTartili = false;

    const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const scoreNum = parseInt(val);
        let newStatus = formData.status;
        if (!isNaN(scoreNum)) {
            if (scoreNum >= 92) newStatus = 'Mumtaz';
            else if (scoreNum >= 83) newStatus = 'Jayyid Jiddan';
            else if (scoreNum >= 80) newStatus = 'Jayyid';
            else newStatus = 'Perlu Bimbingan';
        }
        setFormData({ ...formData, score: val, status: newStatus });
    };

    const handleSave = async () => {
        if (!selectedStudent) return;

        // Construct display strings logic
        let displayString = '';
        let finalPageString = formData.page;

        if ((isJilidInput || isGharibInput) && formData.page && formData.pageEnd) {
            finalPageString = `${formData.page}-${formData.pageEnd}`;
        }

        if (isQuranInput) {
            if (jenisSetoran === 'Drill' && !setoranBerdasarkanAyat) {
                // Mode Surat Pendek (Toggle OFF)
                displayString = `Drill Munaqosah ${formData.drillStartSurah} - ${formData.drillEndSurah}`;
                finalPageString = '';
            } else {
                // Mode Surat Panjang (Toggle ON) or normal Ziyadah/Murojaah
                if (formData.verseStart && formData.verseEnd) {
                    displayString = `${formData.selectedSurah}: ${formData.verseStart}-${formData.verseEnd}`;
                    finalPageString = `${formData.verseStart}-${formData.verseEnd}`;
                } else if (formData.verseStart) {
                    displayString = `${formData.selectedSurah}: ${formData.verseStart}`;
                    finalPageString = formData.verseStart;
                } else {
                    displayString = formData.selectedSurah;
                    finalPageString = '';
                }

                if (jenisSetoran === 'Drill') {
                    displayString = `Drill Munaqosah ${displayString}`;
                }
            }
        } else if (isJilidInput) {
            if (jenisSetoran === 'Drill') {
                displayString = `Drill Tartili Jilid ${formData.iqraLevel}`;
            } else {
                displayString = `Jilid ${formData.iqraLevel} Hal. ${finalPageString}`;
            }
        } else if (isGharibInput) {
            if (jenisSetoran === 'Drill') {
                displayString = `Drill Gharib Hal. ${finalPageString}`;
            } else {
                displayString = `Gharib Hal. ${finalPageString}`;
            }
        }

        let nextPageVal: string | undefined = undefined;
        if (isJilidInput || isQuranInput || isGharibInput) {
            nextPageVal = finalPageString;
        }

        try {
            setIsSubmitting(true);
            const studentName = selectedStudent.name;
            await onSave(selectedStudent.id, {
                type: setoranType,
                currentJuz: isQuranInput ? formData.currentJuz : undefined,
                currentSurah: displayString,
                jenisSetoran: jenisSetoran,
                iqraLevel: isJilidInput ? formData.iqraLevel : undefined,
                page: nextPageVal,
                status: formData.status,
                lastScore: formData.score ? parseInt(formData.score) : undefined,
                lastUpdate: 'Baru saja',
                notes: formData.notes,
                requiresAttention: formData.requiresAttention,
                date: new Date(inputDate + 'T12:00:00').toISOString()
            });

            // Reset form states completely
            setFormData({
                currentJuz: 30,
                selectedSurah: '',
                verseStart: '',
                verseEnd: '',
                iqraLevel: 1,
                page: '',
                pageEnd: '',
                score: '',
                status: 'Jayyid',
                notes: '',
                requiresAttention: false,
                drillStartSurah: '',
                drillEndSurah: ''
            });
            setJenisSetoran('Lanjut');
            setSetoranBerdasarkanAyat(false);
            setInputDate(new Date().toLocaleDateString('en-CA'));
            setSelectedStudent(null);

            // Show Toast Notification
            setToastStudentName(studentName);
            setShowToast(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = useMemo(() => {
        if (!selectedStudent) return false;
        if (isQuranInput) {
            if (jenisSetoran === 'Drill' && !setoranBerdasarkanAyat) {
                if (!formData.drillStartSurah || !formData.drillEndSurah) return false;
            } else {
                if (!formData.selectedSurah || !formData.verseStart) return false;
            }
        }
        if ((isJilidInput || isGharibInput) && !formData.page) return false;
        if (!formData.score) return false;
        return true;
    }, [selectedStudent, isQuranInput, isJilidInput, formData, jenisSetoran, setoranBerdasarkanAyat]);

    return (
        <div className="space-y-6 lg:space-y-0 lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden h-full">
            {/* Sticky Container Wrapper */}
            <div className={`sticky top-4 z-30 bg-gradient-to-br from-white to-emerald-50 dark:from-[#121F18] dark:to-[#1A2E24]/30 p-6 rounded-2xl shadow-sm border border-emerald-400 dark:border-[#1A2E24] flex justify-between items-center my-4 flex-none transition-all duration-300 ${selectedStudent || showToast ? 'hidden lg:flex' : 'flex'}`}>
                <Header
                    user={user}
                    onMenuClick={onMenuClick}
                    notifications={notifications}
                    onDismissNotification={onDismissNotification}
                    onSearchClick={onSearchClick}
                    flat={true}
                    title="Input Setoran"
                    subtitle="Pilih siswa dan catat perkembangan hafalan harian mereka."
                />
            </div>

            {/* Split-Pane Wrapper */}
            <div className="w-full overflow-x-hidden flex flex-col lg:flex-row gap-6 mt-0 lg:mt-4 h-full px-4 sm:px-5">
                {/* LEFT COLUMN: Student List */}
                <div className={`w-full lg:w-1/3 flex-col gap-4 overflow-hidden h-full flex-none ${selectedStudent || showToast ? 'hidden lg:flex' : 'flex'}`}>
                    {/* Controls (Filters & Search) - flex-none */}
                    <div className="flex-none flex flex-col gap-4">
                        {/* Class Filters */}
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex gap-1 overflow-x-auto">
                            {classes.map(cls => (
                                <button
                                    key={cls}
                                    onClick={() => setSelectedClass(cls)}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                                        ${selectedClass === cls
                                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-250'
                                            : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:bg-dark-card-hover'}`}
                                >
                                    {cls === 'Semua' ? 'Semua Kelas' : `Kelas ${cls}`}
                                </button>
                            ))}
                        </div>

                        {/* Pengampu Filters */}
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex gap-1 overflow-x-auto">
                            {['Semua', 'Ustadz Nawfal', 'Ustadzah Ining', 'Ustadzah Rahma'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setSelectedTeacher(t)}
                                    className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap
                                        ${selectedTeacher === t
                                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-250'
                                            : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:bg-dark-card-hover'}`}
                                >
                                    {t === 'Semua' ? 'Semua Guru' : t.replace('Ustadz ', 'Ust. ').replace('Ustadzah ', 'Ustd. ')}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari Siswa..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-dark-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none shadow-sm transition-all text-slate-700"
                            />
                        </div>
                    </div>

                    {/* List - flex-1 scrollable */}
                    <div className="flex-1 bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden flex flex-col h-full">
                        <div className="p-4 border-b border-gray-50 bg-gray-50 dark:bg-dark-card-hover/50 flex-none">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">
                                Daftar Siswa ({filteredStudents.length})
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide pb-24 pr-1">
                            {filteredStudents.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => setSelectedStudent(student)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left
                                        ${selectedStudent?.id === student.id
                                            ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200'
                                            : 'hover:bg-slate-50 dark:bg-dark-card-hover border border-transparent'}`}
                                >
                                    <img
                                        src={student.avatar}
                                        alt={student.name}
                                        className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm truncate ${selectedStudent?.id === student.id ? 'text-emerald-900' : 'text-slate-800 dark:text-white'}`}>
                                            {student.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                                            <BookOpen size={10} />
                                            {student.currentSurah}
                                        </p>
                                    </div>
                                    <ChevronRight size={16} className={`transition-colors ${selectedStudent?.id === student.id ? 'text-emerald-500' : 'text-slate-300'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Input Form */}
                <div className={`flex-1 flex-col h-full overflow-hidden ${!selectedStudent && !showToast ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border h-full flex flex-col overflow-hidden relative">
                        {!selectedStudent ? (
                            showToast ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
                                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-100/50 dark:shadow-none">
                                        <CheckCircle size={44} className="stroke-[2.5]" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Berhasil Tersimpan!</h3>
                                    <p className="max-w-md text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Data setoran untuk <strong className="font-semibold text-slate-700 dark:text-slate-300">{toastStudentName}</strong> telah berhasil disimpan.
                                    </p>
                                    <button
                                        onClick={() => setShowToast(false)}
                                        className="mt-6 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer"
                                    >
                                        Kembali ke Daftar Siswa
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center animate-in zoom-in-95 duration-300">
                                    <div className="w-24 h-24 bg-gray-50 dark:bg-dark-card-hover rounded-full flex items-center justify-center mb-6">
                                        <User size={48} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">Belum ada siswa dipilih</h3>
                                    <p className="max-w-xs text-sm">Pilih siswa dari daftar di sebelah kiri untuk mulai menginput setoran hafalan atau tartili.</p>
                                </div>
                            )
                        ) : (
                            <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
                                {/* Header Form */}
                                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 lg:p-8 text-white shrink-0 relative overflow-hidden flex-none">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>
                                    
                                    {/* Back Button on Mobile */}
                                    <button
                                        onClick={() => setSelectedStudent(null)}
                                        className="lg:hidden mb-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/5 text-white text-xs font-bold transition-all relative z-20 cursor-pointer"
                                    >
                                        <ChevronLeft size={14} />
                                        <span>Kembali</span>
                                    </button>

                                    <div className="relative z-10 flex items-center gap-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-emerald-400 rounded-full blur opacity-20"></div>
                                            <img
                                                src={selectedStudent.avatar}
                                                alt={selectedStudent.name}
                                                className="w-20 h-20 rounded-full border-4 border-white/10 shadow-xl object-cover bg-slate-800 relative z-10"
                                            />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold tracking-tight text-white">{selectedStudent.name}</h2>
                                            <div className="flex items-center gap-4 mt-2 text-slate-300 text-sm font-medium">
                                                <span className="bg-white/10 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm shadow-sm">{selectedClass}</span>
                                                <span className="flex items-center gap-1.5 opacity-90">
                                                    <Calendar size={14} className="text-emerald-400" />
                                                    Terakhir: {selectedStudent.lastUpdate}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Content */}
                                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 scrollbar-hide bg-slate-50">
                                    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-10">
                                        {/* Type Toggle */}
                                        <div className="bg-slate-200/60 dark:bg-[#124233]/40 p-1.5 rounded-full flex shadow-inner max-w-xs mx-auto relative border border-transparent dark:border-white/5">
                                            <button
                                                onClick={() => setSetoranType('Hafalan')}
                                                className={`flex-1 py-2.5 text-xs font-bold rounded-full transition-all duration-300 relative z-10 ${setoranType === 'Hafalan'
                                                    ? 'bg-white dark:bg-[#20C997] text-slate-800 dark:text-[#0B1D17] shadow-md dark:shadow-emerald-950/20'
                                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
                                            >
                                                Hafalan
                                            </button>
                                            <button
                                                onClick={() => setSetoranType('Tartili')}
                                                className={`flex-1 py-2.5 text-xs font-bold rounded-full transition-all duration-300 relative z-10 ${setoranType === 'Tartili'
                                                    ? 'bg-white dark:bg-[#20C997] text-slate-800 dark:text-[#0B1D17] shadow-md dark:shadow-emerald-950/20'
                                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
                                            >
                                                Tartili
                                            </button>
                                        </div>

                                        {/* Dynamic Form Material Selector */}
                                        <div className="space-y-6">
                                            {setoranType === 'Tartili' && (
                                                <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-full">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 block">Bahan Tartili</label>
                                                    <div className="w-full grid grid-cols-3 gap-2 sm:gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setTartiliMaterial('Jilid')}
                                                            className={`py-2.5 sm:py-3 px-1 sm:px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold border-2 transition-all text-center whitespace-nowrap truncate ${tartiliMaterial === 'Jilid'
                                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-100/50'
                                                                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                                        >
                                                            Iqra / Jilid
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setTartiliMaterial('Al-Quran')}
                                                            className={`py-2.5 sm:py-3 px-1 sm:px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold border-2 transition-all text-center whitespace-nowrap truncate ${tartiliMaterial === 'Al-Quran'
                                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-100/50'
                                                                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                                        >
                                                            Al-Quran
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setTartiliMaterial('Gharib')}
                                                            className={`py-2.5 sm:py-3 px-1 sm:px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold border-2 transition-all text-center whitespace-nowrap truncate ${tartiliMaterial === 'Gharib'
                                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-100/50'
                                                                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                                        >
                                                            Gharib
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Status Input: Lanjut/Mengulang/Drill */}
                                            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-full">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 block">Status Kemajuan</label>
                                                <div className="flex gap-2 sm:gap-4">
                                                    {['Lanjut', 'Mengulang', 'Drill'].map(mode => (
                                                        <button
                                                            key={mode}
                                                            onClick={() => setJenisSetoran(mode as any)}
                                                            className={`flex-1 py-2.5 sm:py-3 px-1 sm:px-6 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-bold border-2 transition-all truncate ${jenisSetoran === mode
                                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                                                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                                        >
                                                            {mode}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Date Input */}
                                            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-full">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Tanggal Setoran</label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={inputDate}
                                                        onChange={(e) => setInputDate(e.target.value)}
                                                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white dark:bg-dark-card focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none font-bold text-slate-700 shadow-inner transition-all cursor-pointer"
                                                    />
                                                </div>
                                            </div>

                                            {/* Form Fields Wrapper */}
                                            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 space-y-4 sm:space-y-6">
                                                {isQuranInput ? (
                                                    <>
                                                        {jenisSetoran === 'Drill' ? (
                                                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                                                <span className="text-sm font-bold text-slate-700">Drill Berdasarkan Ayat?</span>
                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={setoranBerdasarkanAyat}
                                                                        onChange={(e) => setSetoranBerdasarkanAyat(e.target.checked)}
                                                                        className="sr-only peer"
                                                                    />
                                                                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                                                                </label>
                                                            </div>
                                                        ) : null}

                                                        {jenisSetoran === 'Drill' && !setoranBerdasarkanAyat ? (
                                                            <div className="grid grid-cols-2 gap-6">
                                                                <div>
                                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block ml-1">Surah Mulai</label>
                                                                    <div className="relative">
                                                                        <select
                                                                            value={formData.drillStartSurah}
                                                                            onChange={(e) => setFormData({ ...formData, drillStartSurah: e.target.value })}
                                                                            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white dark:bg-dark-card focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all font-bold text-slate-700 appearance-none shadow-sm hover:border-slate-300"
                                                                        >
                                                                            <option value="" disabled>Pilih Surah</option>
                                                                            {surahs30.map(s => <option key={s} value={s}>{s}</option>)}
                                                                        </select>
                                                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={18} />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block ml-1">Surah Selesai</label>
                                                                    <div className="relative">
                                                                        <select
                                                                            value={formData.drillEndSurah}
                                                                            onChange={(e) => setFormData({ ...formData, drillEndSurah: e.target.value })}
                                                                            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white dark:bg-dark-card focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all font-bold text-slate-700 appearance-none shadow-sm hover:border-slate-300"
                                                                        >
                                                                            <option value="" disabled>Pilih Surah</option>
                                                                            {surahs30.map(s => <option key={s} value={s}>{s}</option>)}
                                                                        </select>
                                                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={18} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="grid grid-cols-12 gap-3 sm:gap-6">
                                                                    <div className="col-span-4">
                                                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block ml-1">Juz</label>
                                                                        <div className="relative">
                                                                            <select
                                                                                value={formData.currentJuz}
                                                                                onChange={(e) => setFormData({ ...formData, currentJuz: parseInt(e.target.value) })}
                                                                                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white dark:bg-dark-card focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none font-bold text-slate-700 appearance-none shadow-sm transition-all"
                                                                            >
                                                                                <option value={30}>Juz 30</option>
                                                                                <option value={29}>Juz 29</option>
                                                                                <option value={28}>Juz 28</option>
                                                                                <option value={27}>Juz 27</option>
                                                                                <option value={26}>Juz 26</option>
                                                                                <option value={7}>Juz 7</option>
                                                                                <option value={6}>Juz 6</option>
                                                                                <option value={5}>Juz 5</option>
                                                                                <option value={4}>Juz 4</option>
                                                                                <option value={3}>Juz 3</option>
                                                                                <option value={2}>Juz 2</option>
                                                                                <option value={1}>Juz 1</option>
                                                                            </select>
                                                                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={18} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-span-8">
                                                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block ml-1">Surah</label>
                                                                        <div className="relative">
                                                                            <select
                                                                                value={formData.selectedSurah}
                                                                                onChange={(e) => setFormData({ ...formData, selectedSurah: e.target.value })}
                                                                                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white dark:bg-dark-card focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all font-bold text-slate-700 appearance-none shadow-sm hover:border-slate-300"
                                                                            >
                                                                                <option value="" disabled>Pilih Surah</option>
                                                                                {availableSurahs.map(s => <option key={s} value={s}>{s}</option>)}
                                                                            </select>
                                                                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={18} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block ml-1">Ayat</label>
                                                                    <div className="grid grid-cols-2 gap-4 w-full">
                                                                        <input
                                                                            type="number"
                                                                            placeholder="Mulai"
                                                                            value={formData.verseStart}
                                                                            onChange={(e) => setFormData({ ...formData, verseStart: e.target.value })}
                                                                            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white dark:bg-dark-card focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none text-center font-bold text-slate-700 shadow-inner transition-all placeholder:text-slate-300"
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            placeholder="Akhir"
                                                                            value={formData.verseEnd}
                                                                            onChange={(e) => setFormData({ ...formData, verseEnd: e.target.value })}
                                                                            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white dark:bg-dark-card focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none text-center font-bold text-slate-700 shadow-inner transition-all placeholder:text-slate-300"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        {!isGharibInput && (
                                                            <div>
                                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block ml-1">
                                                                    {jenisSetoran === 'Drill' ? 'Jilid Drill' : 'Jilid'}
                                                                </label>
                                                                <div className="relative">
                                                                    <select
                                                                        value={formData.iqraLevel}
                                                                        onChange={(e) => setFormData({ ...formData, iqraLevel: parseInt(e.target.value) })}
                                                                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white dark:bg-dark-card focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none font-bold text-slate-700 appearance-none shadow-sm transition-all"
                                                                    >
                                                                        {iqraLevels.map(l => <option key={l} value={l}>Jilid {l}</option>)}
                                                                    </select>
                                                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={18} />
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block ml-1">Halaman</label>
                                                            <div className="grid grid-cols-2 gap-4 w-full">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Mulai"
                                                                    value={formData.page}
                                                                    onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                                                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white dark:bg-dark-card focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none text-center font-bold text-slate-700 shadow-inner transition-all placeholder:text-slate-300"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Akhir"
                                                                    value={formData.pageEnd}
                                                                    onChange={(e) => setFormData({ ...formData, pageEnd: e.target.value })}
                                                                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white dark:bg-dark-card focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none text-center font-bold text-slate-700 shadow-inner transition-all placeholder:text-slate-300"
                                                                />
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Score Section */}
                                            <div className="grid grid-cols-2 gap-3 sm:gap-8 w-full">
                                                <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Nilai</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={formData.score}
                                                            onChange={handleScoreChange}
                                                            placeholder="0"
                                                            className="w-full p-2 bg-transparent border-none focus:ring-0 outline-none text-4xl sm:text-5xl font-black text-slate-800 placeholder-slate-200 tracking-tight"
                                                        />
                                                        <span className="absolute top-2 right-0 text-[10px] sm:text-sm font-bold text-slate-400 bg-slate-100 px-2 py-0.5 sm:py-1 rounded-lg">PTS</span>
                                                    </div>
                                                </div>
                                                <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col w-full">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Predikat</label>
                                                    <div className={`flex-1 w-full flex items-center justify-center rounded-2xl text-sm sm:text-lg font-bold border-2 transition-all duration-300
                                                        ${formData.status === 'Mumtaz' ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-[0_4px_15px_-3px_rgba(52,211,153,0.3)]' :
                                                            formData.status === 'Perlu Bimbingan' ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-[0_4px_15px_-3px_rgba(251,113,133,0.3)]' :
                                                                'bg-amber-50 border-amber-400 text-amber-700 shadow-[0_4px_15px_-3px_rgba(245,158,11,0.3)]'
                                                        }`}>
                                                        {formData.status}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-full">
                                                <div className="flex items-center justify-between mb-4">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <AlignLeft size={14} /> Catatan Guru
                                                    </label>
                                                    <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                                        <span className={`text-xs font-bold transition-colors ${formData.requiresAttention ? 'text-rose-500' : 'text-slate-400 group-hover:text-slate-500'}`}>
                                                            Perlu Perhatian?
                                                        </span>
                                                        <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${formData.requiresAttention ? 'bg-rose-500' : 'bg-slate-200'}`}>
                                                            <div className={`w-4 h-4 bg-white dark:bg-dark-card rounded-full shadow-sm transform transition-transform duration-300 ${formData.requiresAttention ? 'translate-x-4' : 'translate-x-0'}`} />
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.requiresAttention}
                                                            onChange={(e) => setFormData({ ...formData, requiresAttention: e.target.checked })}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                                <textarea
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                    className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white dark:bg-dark-card focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none text-sm min-h-[120px] resize-none transition-all placeholder-slate-400/70 text-slate-700 leading-relaxed"
                                                    placeholder="Tuliskan catatan perkembangan hafalan siswa..."
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer / Actions */}
                                <div className="p-4 border-t border-slate-100 bg-white dark:bg-dark-card shrink-0 z-20 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.05)] flex-none w-full max-w-full flex justify-end items-center gap-4 px-4">
                                    <button
                                        onClick={() => setSelectedStudent(null)}
                                        disabled={isSubmitting}
                                        className="px-5 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={!isFormValid || isSubmitting}
                                        className="px-6 py-3 sm:px-10 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base bg-emerald-600 text-white font-bold hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center gap-2.5 sm:gap-3 transform active:scale-95 shadow-sm"
                                    >
                                        <Save size={18} className="sm:w-5 sm:h-5" />
                                        {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetoranPage;
