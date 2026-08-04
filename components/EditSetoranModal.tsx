import React, { useState, useMemo, useEffect } from 'react';
import { Student } from '../types';
import { AlignLeft, Calendar, Save, X, BookOpen, Star } from 'lucide-react';

interface EditSetoranModalProps {
    isOpen: boolean;
    onClose: () => void;
    log: any;
    onSave: (logId: string | number, updatedData: any) => Promise<void>;
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

const EditSetoranModal: React.FC<EditSetoranModalProps> = ({ isOpen, onClose, log, onSave }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [setoranType, setSetoranType] = useState<'Hafalan' | 'Tartili' | 'Drill Munaqosah' | 'Drill Tartili'>('Hafalan');
    const [tartiliMaterial, setTartiliMaterial] = useState<'Jilid' | 'Al-Quran' | 'Gharib'>('Jilid');
    const [jenisSetoran, setJenisSetoran] = useState<'Lanjut' | 'Mengulang' | 'Drill'>('Lanjut');
    const [setoranBerdasarkanAyat, setSetoranBerdasarkanAyat] = useState(false);
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

    const isQuranInput = setoranType === 'Hafalan' || (setoranType === 'Tartili' && tartiliMaterial === 'Al-Quran');
    const isJilidInput = setoranType === 'Tartili' && tartiliMaterial === 'Jilid';
    const isGharibInput = setoranType === 'Tartili' && tartiliMaterial === 'Gharib';

    const iqraLevels = [1, 2, 3, 4, 5, 6];
    const availableSurahs = JUZ_DATA[formData.currentJuz] || [];

    // Parse the log when the modal opens with log values
    useEffect(() => {
        if (isOpen && log) {
            let juz = log.currentJuz || 30;
            let surah = '';
            let vStart = '';
            let vEnd = '';
            let level = log.iqraLevel || 1;
            let pStart = '';
            let pEnd = '';
            let dStartSurah = '';
            let dEndSurah = '';
            let isAyat = false;
            
            const type = log.type || 'Hafalan';
            let material: 'Jilid' | 'Al-Quran' | 'Gharib' = 'Jilid';
            const jSetoran = log.jenisSetoran || 'Lanjut';
            
            const rawSurah = log.currentSurah || '';
            
            // Determine material type
            if (type === 'Tartili') {
                if (rawSurah.toLowerCase().includes('gharib')) {
                    material = 'Gharib';
                } else if (rawSurah.toLowerCase().includes('jilid') || rawSurah.toLowerCase().includes('iqra')) {
                    material = 'Jilid';
                } else {
                    material = 'Al-Quran';
                }
            }
            
            // Parse rawSurah based on type/material
            if (type === 'Hafalan' || (type === 'Tartili' && material === 'Al-Quran')) {
                let cleanSurah = rawSurah;
                if (cleanSurah.startsWith('Drill Munaqosah ')) {
                    cleanSurah = cleanSurah.replace('Drill Munaqosah ', '');
                }
                
                // Check if it's a range of surahs (e.g. "An-Naba - An-Nazi'at")
                if (cleanSurah.includes(' - ') && !cleanSurah.includes(':')) {
                    const parts = cleanSurah.split(' - ');
                    dStartSurah = parts[0].trim();
                    dEndSurah = parts[1].trim();
                    isAyat = false;
                } else {
                    isAyat = true;
                    if (cleanSurah.includes(':')) {
                        const mainParts = cleanSurah.split(':');
                        surah = mainParts[0].trim();
                        const rangeStr = mainParts[1].trim();
                        if (rangeStr.includes('-')) {
                            const rangeParts = rangeStr.split('-');
                            vStart = rangeParts[0].trim();
                            vEnd = rangeParts[1].trim();
                        } else {
                            vStart = rangeStr;
                        }
                    } else {
                        surah = cleanSurah.trim();
                    }
                }
            } else if (type === 'Tartili' && material === 'Jilid') {
                let cleanSurah = rawSurah;
                if (cleanSurah.startsWith('Drill Tartili ')) {
                    cleanSurah = cleanSurah.replace('Drill Tartili ', '');
                }
                
                const jilidMatch = cleanSurah.match(/Jilid\s+(\d+)/i);
                if (jilidMatch) {
                    level = parseInt(jilidMatch[1]);
                }
                
                const halMatch = cleanSurah.match(/Hal\.\s*(\d+)(?:-(\d+))?/i);
                if (halMatch) {
                    pStart = halMatch[1] || '';
                    pEnd = halMatch[2] || '';
                }
            } else if (type === 'Tartili' && material === 'Gharib') {
                let cleanSurah = rawSurah;
                const halMatch = cleanSurah.match(/Hal\.\s*(\d+)(?:-(\d+))?/i);
                if (halMatch) {
                    pStart = halMatch[1] || '';
                    pEnd = halMatch[2] || '';
                }
            }
            
            // Set parsing state
            setSetoranType(type);
            setTartiliMaterial(material);
            setJenisSetoran(jSetoran);
            setSetoranBerdasarkanAyat(isAyat);
            
            if (log.date) {
                try {
                    setInputDate(new Date(log.date).toISOString().slice(0, 10));
                } catch (e) {
                    setInputDate(log.date.slice(0, 10));
                }
            } else {
                setInputDate(new Date().toLocaleDateString('en-CA'));
            }
            
            setFormData({
                currentJuz: juz,
                selectedSurah: surah,
                verseStart: vStart,
                verseEnd: vEnd,
                iqraLevel: level,
                page: pStart,
                pageEnd: pEnd,
                score: String(log.score || log.lastScore || ''),
                status: log.status || 'Jayyid',
                notes: log.notes || '',
                requiresAttention: log.requiresAttention || false,
                drillStartSurah: dStartSurah,
                drillEndSurah: dEndSurah
            });
        }
    }, [isOpen, log]);

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

    const isFormValid = useMemo(() => {
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
    }, [isQuranInput, isJilidInput, isGharibInput, formData, jenisSetoran, setoranBerdasarkanAyat]);

    const handleSave = async () => {
        if (!log || !isFormValid) return;

        let displayString = '';
        let finalPageString = formData.page;

        if ((isJilidInput || isGharibInput) && formData.page && formData.pageEnd) {
            finalPageString = `${formData.page}-${formData.pageEnd}`;
        }

        if (isQuranInput) {
            if (jenisSetoran === 'Drill' && !setoranBerdasarkanAyat) {
                displayString = `Drill Munaqosah ${formData.drillStartSurah} - ${formData.drillEndSurah}`;
                finalPageString = '';
            } else {
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
            setIsSaving(true);
            await onSave(log.id, {
                type: (setoranType === 'Drill Munaqosah' || setoranType === 'Drill Tartili') ? log.type : setoranType,
                currentJuz: isQuranInput ? formData.currentJuz : undefined,
                currentSurah: displayString,
                jenisSetoran: jenisSetoran,
                iqraLevel: isJilidInput ? formData.iqraLevel : undefined,
                page: nextPageVal,
                status: formData.status,
                score: formData.score ? parseInt(formData.score) : undefined,
                lastScore: formData.score ? parseInt(formData.score) : undefined,
                notes: formData.notes,
                requiresAttention: formData.requiresAttention,
                date: new Date(inputDate + 'T12:00:00').toISOString()
            });
            onClose();
        } catch (error) {
            console.error('Failed to save edited setoran log:', error);
            alert('Gagal menyimpan perubahan.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !log) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
            <div className="bg-slate-50 dark:bg-[#121F18] w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-emerald-250 dark:border-white/10 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-white dark:bg-[#1A2E24]/30 border-b border-slate-100 dark:border-white/5 p-5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <BookOpen size={20} />
                        <h2 className="text-lg font-bold">Edit Catatan Setoran</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    
                    {/* Student Info Bar */}
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 flex items-center gap-3">
                        <div className="font-extrabold text-slate-800 dark:text-[#E2EAE5]">
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-widest font-bold">Siswa</p>
                            <p className="text-base mt-0.5">{log.studentName}</p>
                            <p className="text-xs text-slate-400 font-medium">Kelas {log.class}</p>
                        </div>
                    </div>

                    {/* Form Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Type Selection */}
                        <div className="bg-white dark:bg-[#15231A] border border-slate-100 dark:border-white/5 p-4 rounded-2xl shadow-sm">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Program</label>
                            <div className="flex bg-slate-100 dark:bg-dark-card-hover p-1 rounded-xl gap-1">
                                <button
                                    type="button"
                                    onClick={() => setSetoranType('Hafalan')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${setoranType === 'Hafalan' ? 'bg-white dark:bg-emerald-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-450 dark:text-slate-400'}`}
                                >
                                    Hafalan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSetoranType('Tartili')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${setoranType === 'Tartili' ? 'bg-white dark:bg-emerald-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-450 dark:text-slate-400'}`}
                                >
                                    Tartili
                                </button>
                            </div>
                        </div>

                        {/* Status Kemajuan */}
                        <div className="bg-white dark:bg-[#15231A] border border-slate-100 dark:border-white/5 p-4 rounded-2xl shadow-sm">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Status Kemajuan</label>
                            <div className="flex bg-slate-100 dark:bg-dark-card-hover p-1 rounded-xl gap-1">
                                {['Lanjut', 'Mengulang', 'Drill'].map(mode => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setJenisSetoran(mode as any)}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${jenisSetoran === mode ? 'bg-white dark:bg-emerald-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-450 dark:text-slate-400'}`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Date Selector */}
                    <div className="bg-white dark:bg-[#15231A] border border-slate-100 dark:border-white/5 p-4 rounded-2xl shadow-sm">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                            <Calendar size={12} className="text-emerald-500" /> Tanggal Setoran
                        </label>
                        <input
                            type="date"
                            value={inputDate}
                            onChange={(e) => setInputDate(e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#121F18] border border-slate-200 dark:border-white/5 focus:bg-white dark:focus:bg-dark-card focus:border-emerald-400 outline-none font-bold text-slate-700 dark:text-white transition-all cursor-pointer text-sm"
                        />
                    </div>

                    {/* Tartili Material selection if Type is Tartili */}
                    {setoranType === 'Tartili' && (
                        <div className="bg-white dark:bg-[#15231A] border border-slate-100 dark:border-white/5 p-4 rounded-2xl shadow-sm">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Bahan Tartili</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Jilid', 'Al-Quran', 'Gharib'].map((mat) => (
                                    <button
                                        key={mat}
                                        type="button"
                                        onClick={() => setTartiliMaterial(mat as any)}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${tartiliMaterial === mat
                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-white dark:bg-[#15231A] border-slate-250 dark:border-white/5 text-slate-500 dark:text-slate-400'}`}
                                    >
                                        {mat === 'Jilid' ? 'Iqra / Jilid' : mat === 'Al-Quran' ? 'Al-Quran' : 'Gharib'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dynamic Material Details Fields */}
                    <div className="bg-white dark:bg-[#15231A] border border-slate-100 dark:border-white/5 p-4 rounded-2xl shadow-sm space-y-4">
                        {isQuranInput ? (
                            <>
                                {jenisSetoran === 'Drill' && (
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Drill Berdasarkan Ayat?</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={setoranBerdasarkanAyat}
                                                onChange={(e) => setSetoranBerdasarkanAyat(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-emerald-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                        </label>
                                    </div>
                                )}

                                {jenisSetoran === 'Drill' && !setoranBerdasarkanAyat ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Surah Mulai</label>
                                            <select
                                                value={formData.drillStartSurah}
                                                onChange={(e) => setFormData({ ...formData, drillStartSurah: e.target.value })}
                                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#121F18] border border-slate-200 dark:border-white/5 focus:bg-white text-sm font-bold text-slate-700 dark:text-white"
                                            >
                                                <option value="" disabled>Pilih Surah</option>
                                                {surahs30.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Surah Selesai</label>
                                            <select
                                                value={formData.drillEndSurah}
                                                onChange={(e) => setFormData({ ...formData, drillEndSurah: e.target.value })}
                                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#121F18] border border-slate-200 dark:border-white/5 focus:bg-white text-sm font-bold text-slate-700 dark:text-white"
                                            >
                                                <option value="" disabled>Pilih Surah</option>
                                                {surahs30.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-12 gap-3">
                                            <div className="col-span-4">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Juz</label>
                                                <select
                                                    value={formData.currentJuz}
                                                    onChange={(e) => setFormData({ ...formData, currentJuz: parseInt(e.target.value) })}
                                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#121F18] border border-slate-200 dark:border-white/5 focus:bg-white text-sm font-bold text-slate-700 dark:text-white"
                                                >
                                                    {[...Array(30)].map((_, i) => (
                                                        <option key={i + 1} value={i + 1}>Juz {i + 1}</option>
                                                    ))}
                                                    <option value={0}>Lain</option>
                                                </select>
                                            </div>
                                            <div className="col-span-8">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Surah</label>
                                                <select
                                                    value={formData.selectedSurah}
                                                    onChange={(e) => setFormData({ ...formData, selectedSurah: e.target.value })}
                                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#121F18] border border-slate-200 dark:border-white/5 focus:bg-white text-sm font-bold text-slate-700 dark:text-white"
                                                >
                                                    <option value="" disabled>Pilih Surah</option>
                                                    {availableSurahs.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ayat</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    placeholder="Mulai"
                                                    value={formData.verseStart}
                                                    onChange={(e) => setFormData({ ...formData, verseStart: e.target.value })}
                                                    className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-[#121F18] border border-slate-200 dark:border-white/5 focus:bg-white text-center text-sm font-bold text-slate-700 dark:text-white"
                                                />
                                                <span className="text-slate-300 dark:text-white/20">-</span>
                                                <input
                                                    type="number"
                                                    placeholder="Akhir"
                                                    value={formData.verseEnd}
                                                    onChange={(e) => setFormData({ ...formData, verseEnd: e.target.value })}
                                                    className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-[#121F18] border border-slate-200 dark:border-white/5 focus:bg-white text-center text-sm font-bold text-slate-700 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                {isJilidInput && (
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Jilid</label>
                                        <select
                                            value={formData.iqraLevel}
                                            onChange={(e) => setFormData({ ...formData, iqraLevel: parseInt(e.target.value) })}
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#121F18] border border-slate-200 dark:border-white/5 focus:bg-white text-sm font-bold text-slate-700 dark:text-white"
                                        >
                                            {iqraLevels.map(l => <option key={l} value={l}>Jilid {l}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Halaman</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            placeholder="Mulai"
                                            value={formData.page}
                                            onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                                            className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-[#121F18] border border-slate-200 dark:border-white/5 focus:bg-white text-center text-sm font-bold text-slate-700 dark:text-white"
                                        />
                                        <span className="text-slate-300 dark:text-white/20">-</span>
                                        <input
                                            type="number"
                                            placeholder="Akhir"
                                            value={formData.pageEnd}
                                            onChange={(e) => setFormData({ ...formData, pageEnd: e.target.value })}
                                            className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-[#121F18] border border-slate-200 dark:border-white/5 focus:bg-white text-center text-sm font-bold text-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Score & predikat */}
                    <div className="bg-white dark:bg-[#15231A] border border-slate-100 dark:border-white/5 p-4 rounded-2xl shadow-sm grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                                <Star size={12} className="text-amber-500" /> Nilai (0-100)
                            </label>
                            <input
                                type="number"
                                value={formData.score}
                                onChange={handleScoreChange}
                                placeholder="0-100"
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#121F18] border border-slate-200 dark:border-white/5 focus:bg-white text-center font-black text-lg text-emerald-600 dark:text-emerald-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Predikat</label>
                            <div className={`w-full p-3.5 rounded-xl text-center text-sm font-extrabold border ${
                                formData.status === 'Mumtaz' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' :
                                formData.status === 'Jayyid Jiddan' ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-900/30' :
                                formData.status === 'Jayyid' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30' :
                                'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30'
                            }`}>
                                {formData.status}
                            </div>
                        </div>
                    </div>

                    {/* Notes & Attention */}
                    <div className="bg-white dark:bg-[#15231A] border border-slate-100 dark:border-white/5 p-4 rounded-2xl shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <AlignLeft size={12} className="text-emerald-500" /> Catatan Guru
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.requiresAttention}
                                    onChange={(e) => setFormData({ ...formData, requiresAttention: e.target.checked })}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 border-slate-300 dark:border-white/10 dark:bg-slate-900"
                                />
                                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${formData.requiresAttention ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                    Perlu Perhatian / Notif
                                </span>
                            </label>
                        </div>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-[#121F18] border border-slate-200 dark:border-white/5 focus:bg-white dark:focus:bg-dark-card outline-none text-sm min-h-[100px] resize-none text-slate-700 dark:text-white"
                            placeholder="Masukkan catatan perkembangan santri..."
                        ></textarea>
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-white dark:bg-[#1A2E24]/30 border-t border-slate-100 dark:border-white/5 p-5 flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!isFormValid || isSaving}
                        className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2 shadow-sm"
                    >
                        <Save size={16} />
                        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditSetoranModal;
