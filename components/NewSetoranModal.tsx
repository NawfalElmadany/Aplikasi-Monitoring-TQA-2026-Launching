import React, { useState, useMemo, useEffect } from 'react';
import { Student } from '../types';
import { ChevronRight, Bell, AlignLeft, Search } from 'lucide-react';

interface NewSetoranModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: Student[];
    onSave: (id: string, data: Partial<Student>) => void;
}

// Data Surah Mapping
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

const NewSetoranModal: React.FC<NewSetoranModalProps> = ({ isOpen, onClose, students, onSave }) => {
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isStudentListOpen, setIsStudentListOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [setoranType, setSetoranType] = useState<'Hafalan' | 'Tartili' | 'Drill Munaqosah' | 'Drill Tartili'>('Hafalan');
    const [tartiliMaterial, setTartiliMaterial] = useState<'Jilid' | 'Al-Quran'>('Jilid');
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

    // Derived State
    const isQuranInput = setoranType === 'Hafalan' || (setoranType === 'Tartili' && tartiliMaterial === 'Al-Quran');
    const isJilidInput = (setoranType === 'Tartili' && tartiliMaterial === 'Jilid') || setoranType === 'Drill Tartili';
    const isDrillTartili = setoranType === 'Drill Tartili';
    const classes = ['5B', '5C', '5D', '6C', '6D'];
    const iqraLevels = [1, 2, 3, 4, 5, 6];
    const availableSurahs = JUZ_DATA[formData.currentJuz] || [];

    const filteredStudents = useMemo(() => {
        if (!selectedClass) return [];
        let filtered = students.filter(s => s.class === selectedClass);

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(s => s.name.toLowerCase().includes(lowerQuery));
        }

        return filtered;
    }, [students, selectedClass, searchQuery]);

    // Initialize form when student is selected
    useEffect(() => {
        if (selectedStudent) {
            const isTartili = selectedStudent.type === 'Tartili' || selectedStudent.currentSurah.toLowerCase().includes('iqra') || selectedStudent.currentSurah.toLowerCase().includes('jilid');
            const detectedSetoranType = isTartili ? 'Tartili' : 'Hafalan';
            setSetoranType(detectedSetoranType);

            let isAlQuranMaterial = false;
            if (detectedSetoranType === 'Tartili') {
                const surahLower = selectedStudent.currentSurah.toLowerCase();
                if (!surahLower.includes('iqra') && !surahLower.includes('jilid')) {
                    isAlQuranMaterial = true;
                }
            }
            setTartiliMaterial(isAlQuranMaterial ? 'Al-Quran' : 'Jilid');

            let namePart = '';
            let rangePart = ['', ''];

            if (detectedSetoranType === 'Hafalan' || isAlQuranMaterial) {
                const surahParts = selectedStudent.currentSurah.split(':');
                namePart = surahParts[0] || '';
                rangePart = surahParts[1] ? surahParts[1].trim().split('-') : ['', ''];
            }

            let pageStart = selectedStudent.page || '';
            let pageEnd = '';
            if (pageStart.includes('-')) {
                const parts = pageStart.split('-');
                pageStart = parts[0].trim();
                pageEnd = parts[1].trim();
            }

            setFormData({
                currentJuz: selectedStudent.currentJuz || 30,
                selectedSurah: namePart,
                verseStart: rangePart[0] || '',
                verseEnd: rangePart[1] || '',
                iqraLevel: selectedStudent.iqraLevel || 1,
                page: pageStart,
                pageEnd: pageEnd,
                score: '', // Reset score for new entry
                status: 'Jayyid', // Default status
                notes: '',
                requiresAttention: false,
                drillStartSurah: '',
                drillEndSurah: ''
            });
        }
    }, [selectedStudent]);

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

    const handleSave = () => {
        if (!selectedStudent) return;

        // Construct display strings
        let displayString = '';
        let finalPageString = formData.page;
        if (isJilidInput && formData.page && formData.pageEnd) {
            finalPageString = `${formData.page}-${formData.pageEnd}`;
        }

        if (setoranType === 'Drill Munaqosah') {
            displayString = `Drill Munaqosah Juz ${formData.currentJuz}: ${formData.drillStartSurah} - ${formData.drillEndSurah}`;
            finalPageString = '';
        } else if (isDrillTartili) {
            displayString = `Drill Tartili Jilid ${formData.iqraLevel}`;
        } else if (isQuranInput) {
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
        } else if (isJilidInput) {
            displayString = `Jilid ${formData.iqraLevel} Hal. ${finalPageString}`;
        }

        onSave(selectedStudent.id, {
            type: (setoranType === 'Drill Munaqosah' || setoranType === 'Drill Tartili') ? selectedStudent.type : setoranType,
            jenisSetoran: (setoranType === 'Drill Munaqosah' || setoranType === 'Drill Tartili') ? 'Drill' : 'Lanjut',
            currentJuz: (isQuranInput || setoranType === 'Drill Munaqosah') ? formData.currentJuz : undefined,
            currentSurah: displayString,
            iqraLevel: isJilidInput ? formData.iqraLevel : undefined,
            page: (isJilidInput || isQuranInput) ? finalPageString : undefined,
            status: formData.status,
            lastScore: formData.score ? parseInt(formData.score) : undefined,
            lastUpdate: 'Baru saja',
            notes: formData.notes,
            requiresAttention: formData.requiresAttention
        });
        onClose();
    };

    const isFormValid = useMemo(() => {
        if (!selectedStudent) return false;
        if (setoranType === 'Drill Munaqosah') {
            if (!formData.drillStartSurah || !formData.drillEndSurah) return false;
        } else if (isQuranInput) {
            if (!formData.selectedSurah || !formData.verseStart) return false;
        } else if (isJilidInput) {
            if (!formData.page) return false;
        }
        if (!formData.score) return false;
        return true;
    }, [selectedStudent, setoranType, isQuranInput, isJilidInput, isDrillTartili, formData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
            <div className="bg-slate-100 dark:bg-dark-card-hover w-full max-w-md mx-auto rounded-[30px] overflow-hidden shadow-2xl text-slate-900 relative h-[85vh] flex flex-col">

                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-300 p-4 flex justify-between items-center sticky top-0 z-20 shrink-0">
                    <button
                        onClick={onClose}
                        className="text-[var(--primary-color, rgb(5 150 105))] text-[17px] hover:opacity-70 transition"
                    >
                        Batal
                    </button>
                    <h1 className="text-[17px] font-semibold text-black">Setoran Baru</h1>
                    <button
                        onClick={handleSave}
                        className="text-[var(--primary-color, rgb(5 150 105))] text-[17px] font-semibold hover:opacity-70 transition disabled:text-gray-300 disabled:cursor-not-allowed"
                        disabled={!isFormValid}
                    >
                        Simpan
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-8 overflow-y-auto flex-1">

                    {/* Class Selection */}
                    <div>
                        <h3 className="text-[13px] text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-3 mb-2 font-medium">Pilih Kelas</h3>

                        <div className="grid grid-cols-4 gap-3">
                            {classes.map((cls) => (
                                <button
                                    key={cls}
                                    onClick={() => {
                                        setSelectedClass(cls);
                                        setSelectedStudent(null);
                                        setIsStudentListOpen(false);
                                        setSearchQuery('');
                                    }}
                                    className={`p-3 rounded-xl shadow-sm flex flex-col items-center justify-center transition active:scale-95 ${selectedClass === cls
                                        ? 'bg-white dark:bg-dark-card border-2 border-[var(--primary-color, rgb(5 150 105))]'
                                        : 'bg-white dark:bg-dark-card border border-transparent hover:bg-gray-50 dark:bg-dark-card-hover'
                                        }`}
                                >
                                    <span className={`${selectedClass === cls ? 'text-[var(--primary-color, rgb(5 150 105))] font-bold' : 'text-gray-900 dark:text-white font-medium'} text-lg`}>
                                        {cls}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Student Data */}
                    <div>
                        <h3 className="text-[13px] text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-3 mb-2 font-medium">Data Siswa</h3>

                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <button
                                onClick={() => selectedClass && setIsStudentListOpen(true)}
                                className={`w-full flex justify-between items-center p-4 transition text-left group ${selectedClass ? 'hover:bg-gray-50 dark:bg-dark-card-hover active:bg-gray-100 dark:bg-dark-card-hover' : 'cursor-not-allowed opacity-60'
                                    }`}
                                disabled={!selectedClass}
                            >
                                <div className="flex items-center gap-3">
                                    {selectedStudent && (
                                        <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-8 h-8 rounded-full object-cover" />
                                    )}
                                    <span className={`text-[17px] ${selectedStudent ? 'text-black font-medium' : 'text-black'}`}>
                                        {selectedStudent ? selectedStudent.name : 'Siswa'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`text-[17px] ${selectedStudent ? 'text-[var(--primary-color, rgb(5 150 105))]' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400'}`}>
                                        {selectedStudent ? 'Ganti' : 'Pilih Nama'}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                </div>
                            </button>
                        </div>
                        <p className="text-[13px] text-gray-400 mt-2 ml-3">
                            {selectedClass ? 'Pilih siswa dari daftar.' : 'Pilih kelas terlebih dahulu untuk memuat daftar siswa.'}
                        </p>
                    </div>

                    {/* Form or Placeholder */}
                    {!selectedStudent ? (
                        <div className="flex justify-center mt-10 opacity-30">
                            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                            </svg>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                            {/* Type Selection */}
                            <div className="bg-white p-1 rounded-xl shadow-sm flex gap-1">
                                <button
                                    onClick={() => setSetoranType('Hafalan')}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${setoranType === 'Hafalan' ? 'bg-slate-100 dark:bg-dark-card-hover text-black shadow-sm' : 'text-gray-400'}`}
                                >
                                    Hafalan
                                </button>
                                <button
                                    onClick={() => setSetoranType('Tartili')}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${setoranType === 'Tartili' ? 'bg-slate-100 dark:bg-dark-card-hover text-black shadow-sm' : 'text-gray-400'}`}
                                >
                                    Tartili
                                </button>
                                <button
                                    onClick={() => setSetoranType('Drill Munaqosah')}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${setoranType === 'Drill Munaqosah' ? 'bg-slate-100 dark:bg-dark-card-hover text-black shadow-sm' : 'text-gray-400'}`}
                                >
                                    Drill Munaqosah
                                </button>
                                <button
                                    onClick={() => {
                                        setSetoranType('Drill Tartili');
                                        if (selectedStudent) {
                                            setFormData(prev => ({ ...prev, iqraLevel: selectedStudent.iqraLevel || 1 }));
                                        }
                                    }}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${setoranType === 'Drill Tartili' ? 'bg-slate-100 dark:bg-dark-card-hover text-black shadow-sm' : 'text-gray-400'}`}
                                >
                                    Drill Tartili
                                </button>
                            </div>

                            {/* Tartili Material */}
                            {setoranType === 'Tartili' && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setTartiliMaterial('Jilid')}
                                        className={`flex-1 p-3 rounded-xl border transition-all ${tartiliMaterial === 'Jilid' ? 'border-[var(--primary-color, rgb(5 150 105))] bg-emerald-50 text-[var(--primary-color, rgb(5 150 105))]' : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300'}`}
                                    >
                                        <span className="text-sm font-bold">Jilid / Iqra</span>
                                    </button>
                                    <button
                                        onClick={() => setTartiliMaterial('Al-Quran')}
                                        className={`flex-1 p-3 rounded-xl border transition-all ${tartiliMaterial === 'Al-Quran' ? 'border-[var(--primary-color, rgb(5 150 105))] bg-emerald-50 text-[var(--primary-color, rgb(5 150 105))]' : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300'}`}
                                    >
                                        <span className="text-sm font-bold">Al-Qur'an</span>
                                    </button>
                                </div>
                            )}

                            {/* Drill Tartili Auto-Detected Jilid */}
                            {setoranType === 'Drill Tartili' && selectedStudent && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Jilid Terdeteksi Otomatis</span>
                                    <p className="text-base font-black text-amber-700 mt-0.5">Jilid {selectedStudent.iqraLevel || 1}</p>
                                </div>
                            )}

                            {/* Input Fields */}
                            <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
                                {setoranType === 'Drill Munaqosah' ? (
                                    <>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Juz Drill</label>
                                            <select
                                                value={formData.currentJuz}
                                                onChange={(e) => setFormData({ ...formData, currentJuz: parseInt(e.target.value) })}
                                                className="w-full p-2 rounded-lg bg-gray-50 dark:bg-dark-card-hover border-transparent focus:bg-white dark:bg-dark-card focus:border-[var(--primary-color, rgb(5 150 105))] outline-none text-sm font-medium"
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
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Surat Awal & Surat Akhir</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <select
                                                    value={formData.drillStartSurah}
                                                    onChange={(e) => setFormData({ ...formData, drillStartSurah: e.target.value })}
                                                    className="p-2 rounded-lg bg-gray-50 dark:bg-dark-card-hover border-transparent focus:bg-white dark:bg-dark-card focus:border-[var(--primary-color, rgb(5 150 105))] outline-none text-sm font-medium w-full"
                                                >
                                                    <option value="" disabled>Pilih Surat Awal</option>
                                                    {availableSurahs.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <select
                                                    value={formData.drillEndSurah}
                                                    onChange={(e) => setFormData({ ...formData, drillEndSurah: e.target.value })}
                                                    className="p-2 rounded-lg bg-gray-50 dark:bg-dark-card-hover border-transparent focus:bg-white dark:bg-dark-card focus:border-[var(--primary-color, rgb(5 150 105))] outline-none text-sm font-medium w-full"
                                                >
                                                    <option value="" disabled>Pilih Surat Akhir</option>
                                                    {availableSurahs.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                ) : isQuranInput ? (
                                    <>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Juz & Surah</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <select
                                                    value={formData.currentJuz}
                                                    onChange={(e) => setFormData({ ...formData, currentJuz: parseInt(e.target.value) })}
                                                    className="col-span-1 p-2 rounded-lg bg-gray-50 dark:bg-dark-card-hover border-transparent focus:bg-white dark:bg-dark-card focus:border-[var(--primary-color, rgb(5 150 105))] outline-none text-sm font-medium"
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
                                                    <option value={0}>Lain</option>
                                                </select>
                                                <select
                                                    value={formData.selectedSurah}
                                                    onChange={(e) => setFormData({ ...formData, selectedSurah: e.target.value })}
                                                    className="col-span-2 p-2 rounded-lg bg-gray-50 dark:bg-dark-card-hover border-transparent focus:bg-white dark:bg-dark-card focus:border-[var(--primary-color, rgb(5 150 105))] outline-none text-sm font-medium"
                                                >
                                                    <option value="" disabled>Pilih Surah</option>
                                                    {availableSurahs.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Ayat</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    placeholder="Mulai"
                                                    value={formData.verseStart}
                                                    onChange={(e) => setFormData({ ...formData, verseStart: e.target.value })}
                                                    className="flex-1 p-2 rounded-lg bg-gray-50 dark:bg-dark-card-hover border-transparent focus:bg-white dark:bg-dark-card focus:border-[var(--primary-color, rgb(5 150 105))] outline-none text-center text-sm font-medium"
                                                />
                                                <span className="text-gray-300">-</span>
                                                <input
                                                    type="number"
                                                    placeholder="Akhir"
                                                    value={formData.verseEnd}
                                                    onChange={(e) => setFormData({ ...formData, verseEnd: e.target.value })}
                                                    className="flex-1 p-2 rounded-lg bg-gray-50 dark:bg-dark-card-hover border-transparent focus:bg-white dark:bg-dark-card focus:border-[var(--primary-color, rgb(5 150 105))] outline-none text-center text-sm font-medium"
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {!isDrillTartili && (
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Jilid</label>
                                            <select
                                                value={formData.iqraLevel}
                                                onChange={(e) => setFormData({ ...formData, iqraLevel: parseInt(e.target.value) })}
                                                className="w-full p-2 rounded-lg bg-gray-50 dark:bg-dark-card-hover border-transparent focus:bg-white dark:bg-dark-card focus:border-[var(--primary-color, rgb(5 150 105))] outline-none text-sm font-medium"
                                            >
                                                {iqraLevels.map(l => <option key={l} value={l}>Jilid {l}</option>)}
                                            </select>
                                        </div>
                                        )}
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Halaman</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    placeholder="Mulai"
                                                    value={formData.page}
                                                    onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                                                    className="flex-1 p-2 rounded-lg bg-gray-50 dark:bg-dark-card-hover border-transparent focus:bg-white dark:bg-dark-card focus:border-[var(--primary-color, rgb(5 150 105))] outline-none text-center text-sm font-medium"
                                                />
                                                <span className="text-gray-300">-</span>
                                                <input
                                                    type="number"
                                                    placeholder="Akhir"
                                                    value={formData.pageEnd}
                                                    onChange={(e) => setFormData({ ...formData, pageEnd: e.target.value })}
                                                    className="flex-1 p-2 rounded-lg bg-gray-50 dark:bg-dark-card-hover border-transparent focus:bg-white dark:bg-dark-card focus:border-[var(--primary-color, rgb(5 150 105))] outline-none text-center text-sm font-medium"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Score & Status */}
                            <div className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Nilai</label>
                                    <input
                                        type="number"
                                        value={formData.score}
                                        onChange={handleScoreChange}
                                        placeholder="0-100"
                                        className="w-full p-2 rounded-lg bg-gray-50 dark:bg-dark-card-hover border-transparent focus:bg-white dark:bg-dark-card focus:border-[var(--primary-color, rgb(5 150 105))] outline-none text-center font-bold text-lg text-[var(--primary-color, rgb(5 150 105))]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Predikat</label>
                                    <div className={`w-full p-2.5 rounded-lg text-center text-sm font-bold border ${formData.status === 'Mumtaz' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        formData.status === 'Perlu Bimbingan' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                            'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                        {formData.status}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                                        <AlignLeft size={12} /> Catatan
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.requiresAttention}
                                            onChange={(e) => setFormData({ ...formData, requiresAttention: e.target.checked })}
                                            className="rounded text-[var(--primary-color, rgb(5 150 105))] focus:ring-[var(--primary-color, rgb(5 150 105))] w-4 h-4"
                                        />
                                        <span className={`text-[10px] font-bold flex items-center gap-1 ${formData.requiresAttention ? 'text-[var(--primary-color, rgb(5 150 105))]' : 'text-gray-400'}`}>
                                            <Bell size={10} /> Notifikasi
                                        </span>
                                    </label>
                                </div>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full p-3 rounded-lg bg-gray-50 dark:bg-dark-card-hover border-transparent focus:bg-white dark:bg-dark-card focus:border-[var(--primary-color, rgb(5 150 105))] outline-none text-sm min-h-[80px] resize-none"
                                    placeholder="Tulis catatan..."
                                ></textarea>
                            </div>

                        </div>
                    )}

                </div>

                {/* Student Selection Sheet/Modal Overlay */}
                {isStudentListOpen && (
                    <div className="absolute inset-0 z-30 bg-slate-100 dark:bg-dark-card-hover flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="bg-white/80 backdrop-blur-md border-b border-gray-300 p-4 flex items-center gap-3 sticky top-0 z-20 shrink-0">
                            <button
                                onClick={() => setIsStudentListOpen(false)}
                                className="text-[var(--primary-color, rgb(5 150 105))] flex items-center gap-1 hover:opacity-70 transition"
                            >
                                <svg width="12" height="20" viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-180">
                                    <path d="M2 2L10 10L2 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="text-[17px]">Kembali</span>
                            </button>
                            <h1 className="text-[17px] font-semibold text-black flex-1 text-center pr-16">Pilih Siswa</h1>
                        </div>

                        {/* Search Bar */}
                        <div className="px-4 py-2 bg-white dark:bg-dark-card/50 backdrop-blur-sm sticky top-[60px] z-10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Cari nama siswa..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-200/50 rounded-lg text-sm focus:bg-white dark:bg-dark-card focus:ring-2 focus:ring-[var(--primary-color, rgb(5 150 105))]/20 outline-none transition-all"
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1">
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
                                {filteredStudents.map(student => (
                                    <button
                                        key={student.id}
                                        onClick={() => {
                                            setSelectedStudent(student);
                                            setIsStudentListOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className="w-full p-4 text-left hover:bg-gray-50 dark:bg-dark-card-hover flex items-center gap-3 transition"
                                    >
                                        <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                                        <div>
                                            <p className="font-semibold text-gray-900">{student.name}</p>
                                            <p className="text-xs text-gray-500">{student.currentSurah}</p>
                                        </div>
                                    </button>
                                ))}
                                {filteredStudents.length === 0 && (
                                    <div className="p-8 text-center text-gray-400">
                                        Tidak ada siswa di kelas ini.
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

export default NewSetoranModal;
