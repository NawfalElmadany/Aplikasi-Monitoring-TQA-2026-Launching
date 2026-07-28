import React, { useState, useEffect } from 'react';
import { RotateCw, CheckCircle2, ChevronRight, Plus, Users, Save, X, BookOpen, StickyNote, Calendar, Pencil, Trash2 } from 'lucide-react';
import { MurojaahEntry, Student, User } from '../types';
import { SURAHS_JUZ_29, SURAHS_JUZ_30 } from '../constants';
import Header from './Header';
import FloatingHeaderCard from './FloatingHeaderCard';

interface MurojaahPageProps {
    students?: Student[];
    user: User | null;
    schedule: MurojaahEntry[];
    onSaveEntry: (entry: Omit<MurojaahEntry, 'id'>) => Promise<void>;
    onDeleteEntry: (id: string | number) => Promise<void>;
    onMenuClick: () => void;
    notifications?: Student[];
    onDismissNotification?: (studentId: string) => void;
    onSearchClick?: () => void;
}

const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

const parseIndonesianDateToYYYYMMDD = (indoDateStr: string) => {
    if (!indoDateStr) return '';
    const parts = indoDateStr.split(' ');
    if (parts.length !== 3) return '';
    const [day, monthName, year] = parts;
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthIdx = months.indexOf(monthName);
    if (monthIdx === -1) return '';
    const monthStr = String(monthIdx + 1).padStart(2, '0');
    const dayStr = String(parseInt(day)).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
};

const MurojaahPage: React.FC<MurojaahPageProps> = ({ 
    user, 
    students, 
    schedule, 
    onSaveEntry,
    onDeleteEntry,
    onMenuClick,
    notifications = [],
    onDismissNotification,
    onSearchClick
}) => {
    const [showInput, setShowInput] = useState(false);
    const [startSurah, setStartSurah] = useState('');
    const [endSurah, setEndSurah] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [viewingClass, setViewingClass] = useState<string | null>(null);
    const [murojaahDate, setMurojaahDate] = useState(() => getTodayDateString());

    const isReset = localStorage.getItem('tqa_murojaah_entries') !== null;
    const staticBase = isReset ? [] : [
        { id: "mock-j1", date: "30 Juni 2026", class: "5B", material: "Surah An-Naba (Ayat 1 - 40)" },
        { id: "mock-j2", date: "30 Juni 2026", class: "5C", material: "Surah An-Nazi'at (Ayat 1 - 46)" },
        { id: "mock-j3", date: "29 Juni 2026", class: "5D", material: "Surah 'Abasa (Ayat 1 - 42)" },
        { id: "mock-j4", date: "29 Juni 2026", class: "6C", material: "Surah At-Takwir (Ayat 1 - 29)" },
        { id: "mock-j5", date: "28 Juni 2026", class: "6D", material: "Surah Al-Infitar (Ayat 1 - 19)" },
    ];

    const [jurnalData, setJurnalData] = useState<{ id?: string | number; date: string; class: string; material: string }[]>(staticBase);

    const [deletedJurnalIds, setDeletedJurnalIds] = useState<string[]>(() => {
        const saved = localStorage.getItem('tqa_deleted_mock_murojaah_ids');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        const dbJurnal = schedule
            .filter(item => item.type === 'classical')
            .map(item => {
                let formattedDate = item.date;
                let isoDate = item.date;
                if (item.date === 'Hari Ini') {
                    const todayStr = getTodayDateString();
                    formattedDate = formatIndonesianDate(todayStr);
                    isoDate = todayStr;
                } else if (item.date === 'Besok') {
                    formattedDate = 'Besok';
                    isoDate = '2099-12-31';
                } else if (item.date.includes('-')) {
                    formattedDate = formatIndonesianDate(item.date);
                }
                
                let material = item.surah;
                if (!material.startsWith('Surah ')) {
                    material = `Surah ${material}`;
                }
                
                return {
                    id: item.id,
                    date: formattedDate,
                    isoDate: isoDate,
                    class: item.className || '',
                    material: material
                };
            });

        const staticBaseWithIso = staticBase.map(s => ({
            ...s,
            isoDate: parseIndonesianDateToYYYYMMDD(s.date)
        }));

        const allEntries = [...dbJurnal, ...staticBaseWithIso].filter(entry => {
            return !deletedJurnalIds.includes(String(entry.id));
        });

        // Filter unique entries: only keep the last (most recent) entry per class
        const latestByClass = allEntries.reduce((acc, entry) => {
            const cls = entry.class;
            if (!acc[cls] || entry.isoDate > acc[cls].isoDate) {
                acc[cls] = entry;
            }
            return acc;
        }, {} as Record<string, typeof allEntries[0]>);

        // Sort unique entries from latest to oldest date
        const sortedUnique = Object.values(latestByClass).sort((a, b) => b.isoDate.localeCompare(a.isoDate));

        setJurnalData(sortedUnique);
    }, [schedule, deletedJurnalIds]);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedJurnal, setSelectedJurnal] = useState<{ index: number; class: string; material: string } | null>(null);
    const [editDate, setEditDate] = useState('');
    const [editMaterial, setEditMaterial] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');



    const handleEditClick = (idx: number, row: { date: string; class: string; material: string }) => {
        setSelectedJurnal({ index: idx, class: row.class, material: row.material });
        setEditDate(getTodayDateString());
        setEditMaterial(row.material);
        setIsEditModalOpen(true);
    };

    const handleSaveJurnal = () => {
        if (!selectedJurnal) return;
        const updatedData = [...jurnalData];
        updatedData[selectedJurnal.index] = {
            date: formatIndonesianDate(editDate),
            class: selectedJurnal.class,
            material: editMaterial
        };
        setJurnalData(updatedData);
        setIsEditModalOpen(false);
        setSelectedJurnal(null);
    };

    const handleDeleteJurnal = async (id: string | number | undefined, date: string, className: string, material: string) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus jurnal murojaah ini?')) {
            return;
        }

        if (id) {
            const idStr = String(id);
            if (idStr.startsWith('mock-')) {
                const nextDeleted = [...deletedJurnalIds, idStr];
                setDeletedJurnalIds(nextDeleted);
                localStorage.setItem('tqa_deleted_mock_murojaah_ids', JSON.stringify(nextDeleted));
            } else {
                try {
                    await onDeleteEntry(id);
                } catch (error) {
                    console.error(error);
                }
            }
        } else {
            // Fallback match for static mock entries
            const match = staticBase.find(j => j.date === date && j.class === className && j.material === material);
            if (match) {
                const nextDeleted = [...deletedJurnalIds, match.id];
                setDeletedJurnalIds(nextDeleted);
                localStorage.setItem('tqa_deleted_mock_murojaah_ids', JSON.stringify(nextDeleted));
            }
        }

        // Immediately filter from local state for instant feedback
        setJurnalData(prev => prev.filter(j => {
            if (id && j.id && j.id === id) return false;
            return !(j.date === date && j.class === className && j.material === material);
        }));
    };

    useEffect(() => {
        if (viewingClass) {
            document.body.classList.add('class-detail-open');
        } else {
            document.body.classList.remove('class-detail-open');
        }
        return () => {
            document.body.classList.remove('class-detail-open');
        };
    }, [viewingClass]);

    const playSuccessSound = () => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1174.66, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    };

    const handleAddTarget = async () => {
        if (!startSurah || !endSurah || !selectedClass) return;

        try {
            setIsSaving(true);
            playSuccessSound();

            const newMaterial = `${startSurah} s.d. ${endSurah}`;
            const newRow = {
                date: formatIndonesianDate(murojaahDate),
                class: selectedClass,
                material: `Surah ${newMaterial}`
            };
            setJurnalData(prev => [newRow, ...prev]);

            await onSaveEntry({
                juz: 30,
                surah: newMaterial,
                status: 'upcoming',
                date: murojaahDate,
                type: 'classical',
                className: selectedClass
            });

            setShowInput(false);
            setStartSurah('');
            setEndSurah('');
            setSelectedClass('');
            setMurojaahDate(getTodayDateString());
        } catch (error) {
            console.error('Failed to save murojaah entry:', error);
            alert('Data murojaah gagal disimpan. Silakan coba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <style>{`
                .class-detail-open .sticky {
                    display: none !important;
                }
            `}</style>

            {viewingClass ? (() => {
                const currentClassJurnal = jurnalData.filter(j => j.class === viewingClass);
                const filteredJurnal = currentClassJurnal.filter(j => {
                    if (filterMonth && !j.date.includes(filterMonth)) {
                        return false;
                    }
                    const isoDate = parseIndonesianDateToYYYYMMDD(j.date);
                    if (isoDate) {
                        if (startDate && isoDate < startDate) {
                            return false;
                        }
                        if (endDate && isoDate > endDate) {
                            return false;
                        }
                    }
                    return true;
                });

                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => {
                                    setViewingClass(null);
                                    setShowInput(false);
                                    setFilterMonth('');
                                    setStartDate('');
                                    setEndDate('');
                                }}
                                className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-bold cursor-pointer text-sm"
                            >
                                <span>← Kembali ke Dasbor Murojaah</span>
                            </button>
                            {user?.role === 'teacher' && (
                                <button
                                    onClick={() => {
                                        setSelectedClass(viewingClass);
                                        setShowInput(true);
                                    }}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm text-sm"
                                >
                                    <Plus size={18} />
                                    <span>Input Jurnal Baru</span>
                                </button>
                            )}
                        </div>

                        {showInput && (
                            <div className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] p-6 rounded-2xl shadow-lg border border-indigo-100 animate-in slide-in-from-top-4">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                                        Target Murojaah Bersama (Klasikal) - Kelas {viewingClass}
                                    </h3>
                                    <button onClick={() => setShowInput(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Mulai Surat</label>
                                        <div className="relative">
                                            <select
                                                value={startSurah}
                                                onChange={(e) => setStartSurah(e.target.value)}
                                                className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none appearance-none bg-white dark:bg-dark-card font-medium text-gray-700"
                                            >
                                                <option value="">Pilih Surat</option>
                                                <optgroup label="Juz 30">
                                                    {SURAHS_JUZ_30.map(s => <option key={s} value={s}>{s}</option>)}
                                                </optgroup>
                                                <optgroup label="Juz 29">
                                                    {SURAHS_JUZ_29.map(s => <option key={s} value={s}>{s}</option>)}
                                                </optgroup>
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Sampai Surat</label>
                                        <div className="relative">
                                            <select
                                                value={endSurah}
                                                onChange={(e) => setEndSurah(e.target.value)}
                                                className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none appearance-none bg-white dark:bg-dark-card font-medium text-gray-700"
                                            >
                                                <option value="">Pilih Surat</option>
                                                <optgroup label="Juz 30">
                                                    {SURAHS_JUZ_30.map(s => <option key={s} value={s}>{s}</option>)}
                                                </optgroup>
                                                <optgroup label="Juz 29">
                                                    {SURAHS_JUZ_29.map(s => <option key={s} value={s}>{s}</option>)}
                                                </optgroup>
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={async () => {
                                            if (!startSurah || !endSurah) return;
                                            try {
                                                setIsSaving(true);
                                                playSuccessSound();
                                                const newMaterial = `${startSurah} s.d. ${endSurah}`;
                                                
                                                const newRow = {
                                                    date: formatIndonesianDate(getTodayDateString()),
                                                    class: viewingClass,
                                                    material: `Surah ${newMaterial}`
                                                };
                                                setJurnalData([newRow, ...jurnalData]);

                                                await onSaveEntry({
                                                    juz: 30,
                                                    surah: newMaterial,
                                                    status: 'upcoming',
                                                    date: 'Hari Ini',
                                                    type: 'classical',
                                                    className: viewingClass
                                                });

                                                setShowInput(false);
                                                setStartSurah('');
                                                setEndSurah('');
                                            } catch (error) {
                                                console.error(error);
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }}
                                        disabled={isSaving}
                                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all duration-300 ${isSaving
                                            ? 'bg-emerald-500 text-white scale-105'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            }`}
                                    >
                                        {isSaving ? <CheckCircle2 size={18} className="animate-in zoom-in spin-in-90" /> : <Save size={18} />}
                                        {isSaving ? 'Tersimpan!' : 'Simpan Murojaah'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 to-emerald-600 dark:bg-none dark:bg-[#09120E] text-white p-8 rounded-2xl w-full shadow-md flex items-center gap-6 dark:border dark:border-[#1A2E24]">
                            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl pointer-events-none"></div>
                            <div className="w-16 h-16 rounded-2xl bg-emerald-800 dark:bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-amber-300 dark:text-emerald-400 shrink-0">
                                <Users size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-wide uppercase text-white">
                                    MUROJAAH KLASIKAL - KELAS {viewingClass}
                                </h2>
                                <div className="mt-2 inline-block px-3 py-1 bg-emerald-800 dark:bg-emerald-500/20 border border-emerald-500/30 text-amber-400 dark:text-emerald-400 text-xs font-black rounded-full">
                                    Program Tahfidz Reguler
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            <div className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] rounded-xl p-5 shadow-sm flex items-center gap-4 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Total Pertemuan</p>
                                    <p className="text-2xl font-black text-slate-800 dark:text-[#E2EAE5] mt-0.5">
                                        {filteredJurnal.length + 40} Kali
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] rounded-xl p-5 shadow-sm flex items-center gap-4 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <BookOpen size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Target Saat Ini</p>
                                    <p className="text-lg font-extrabold text-slate-800 dark:text-[#E2EAE5] mt-0.5 truncate max-w-[200px]">
                                        {filteredJurnal[0]?.material || 'Juz 30'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] rounded-xl p-5 shadow-sm flex items-center gap-4 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <StickyNote size={24} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Catatan Terakhir</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-[#E2EAE5] mt-0.5 truncate">
                                        {filteredJurnal[0]?.material || 'Murojaah berjalan lancar.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] rounded-xl p-6 mt-6 shadow-sm transition-colors">
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
                                                className="text-xs text-rose-500 hover:text-rose-600 font-bold px-2 py-1 transition-colors cursor-pointer"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-[#1A2E24] text-slate-400 dark:text-[#8BA398] text-[11px] font-bold uppercase tracking-wider">
                                            <th className="pb-3 w-12 text-center">NO.</th>
                                            <th className="pb-3 pl-1 w-1/4">TANGGAL</th>
                                            <th className="pb-3 text-left w-1/2">MATERI MUROJAAH</th>
                                            <th className="pb-3 text-center w-1/4">STATUS/CATATAN</th>
                                            {user?.role === 'teacher' && <th className="pb-3 text-center w-24">AKSI</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-[#1A2E24] text-sm">
                                        {filteredJurnal.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#1C3026]/30 transition-colors group">
                                                <td className="py-4 text-center font-medium text-slate-400 dark:text-[#8BA398] w-12">{idx + 1}</td>
                                                <td className="py-4 pl-1 font-semibold text-slate-500 dark:text-[#8BA398] text-xs">{row.date}</td>
                                                <td className="py-4 text-slate-800 dark:text-[#E2EAE5] font-bold text-left">{row.material}</td>
                                                <td className="py-4 text-center">
                                                    <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold animate-in fade-in">
                                                        Selesai
                                                    </span>
                                                </td>
                                                {user?.role === 'teacher' && (
                                                    <td className="py-4 text-center w-24">
                                                        <div className="flex justify-center gap-3">
                                                            <button 
                                                                onClick={() => {
                                                                    const origIdx = jurnalData.findIndex(j => j.class === row.class && j.date === row.date && j.material === row.material);
                                                                    handleEditClick(origIdx, row);
                                                                }}
                                                                className="text-slate-400 dark:text-[#8BA398] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                                                                title="Edit Jurnal"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    handleDeleteJurnal(row.id, row.date, row.class, row.material);
                                                                }}
                                                                className="text-slate-400 dark:text-[#8BA398] hover:text-rose-600 transition-colors cursor-pointer"
                                                                title="Hapus Jurnal"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {filteredJurnal.length === 0 && (
                                            <tr>
                                                <td colSpan={user?.role === 'teacher' ? 5 : 4} className="py-8 text-center text-slate-400">
                                                    Belum ada riwayat jurnal untuk filter ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            })() : (
                <>
                    <FloatingHeaderCard>
                        <Header
                            user={user!}
                            onMenuClick={onMenuClick}
                            notifications={notifications}
                            onDismissNotification={onDismissNotification}
                            onSearchClick={onSearchClick}
                            flat={true}
                            title="Murojaah"
                            subtitle="Jadwal dan riwayat pengulangan hafalan"
                            actionButton={
                                user?.role === 'teacher' && (
                                    <button
                                        onClick={() => setShowInput(true)}
                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer text-sm"
                                    >
                                        <Plus size={20} />
                                        <span>Catat Murojaah</span>
                                    </button>
                                )
                            }
                        />
                    </FloatingHeaderCard>

                    {showInput && (
                        <div className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] p-6 rounded-2xl shadow-lg border border-indigo-100 animate-in slide-in-from-top-4">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                                    Target Murojaah Bersama (Klasikal)
                                </h3>
                                <button onClick={() => setShowInput(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Pilih Kelas</label>
                                    <div className="relative">
                                        <select
                                            value={selectedClass}
                                            onChange={(e) => setSelectedClass(e.target.value)}
                                            className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none appearance-none bg-white dark:bg-dark-card font-medium text-gray-700"
                                        >
                                            <option value="">Pilih Kelas</option>
                                            <option value="5B">5B</option>
                                            <option value="5C">5C</option>
                                            <option value="5D">5D</option>
                                            <option value="6C">6C</option>
                                            <option value="6D">6D</option>
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Tanggal</label>
                                    <input
                                        type="date"
                                        value={murojaahDate}
                                        onChange={(e) => setMurojaahDate(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white dark:bg-dark-card font-medium text-gray-700"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Mulai Surat</label>
                                    <div className="relative">
                                        <select
                                            value={startSurah}
                                            onChange={(e) => setStartSurah(e.target.value)}
                                            className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none appearance-none bg-white dark:bg-dark-card font-medium text-gray-700"
                                        >
                                            <option value="">Pilih Surat</option>
                                            <optgroup label="Juz 30">
                                                {SURAHS_JUZ_30.map(s => <option key={s} value={s}>{s}</option>)}
                                            </optgroup>
                                            <optgroup label="Juz 29">
                                                {SURAHS_JUZ_29.map(s => <option key={s} value={s}>{s}</option>)}
                                            </optgroup>
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Sampai Surat</label>
                                    <div className="relative">
                                        <select
                                            value={endSurah}
                                            onChange={(e) => setEndSurah(e.target.value)}
                                            className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none appearance-none bg-white dark:bg-dark-card font-medium text-gray-700"
                                        >
                                            <option value="">Pilih Surat</option>
                                            <optgroup label="Juz 30">
                                                {SURAHS_JUZ_30.map(s => <option key={s} value={s}>{s}</option>)}
                                            </optgroup>
                                            <optgroup label="Juz 29">
                                                {SURAHS_JUZ_29.map(s => <option key={s} value={s}>{s}</option>)}
                                            </optgroup>
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleAddTarget}
                                    disabled={isSaving}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all duration-300 ${isSaving
                                        ? 'bg-emerald-500 text-white scale-105'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }`}
                                >
                                    {isSaving ? <CheckCircle2 size={18} className="animate-in zoom-in spin-in-90" /> : <Save size={18} />}
                                    {isSaving ? 'Tersimpan!' : 'Simpan Murojaah'}
                                </button>
                            </div>
                        </div>
                    )}

                    {user?.role === 'teacher' ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-6">
                                {(() => {
                                    const cardThemes = [
                                        "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300",
                                        "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/50 text-teal-700 dark:text-teal-300",
                                        "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/50 text-cyan-700 dark:text-cyan-300",
                                        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-300",
                                        "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300"
                                    ];
                                    
                                    return [
                                        { class: '5B' },
                                        { class: '5C' },
                                        { class: '5D' },
                                        { class: '6C' },
                                        { class: '6D' }
                                    ].map((item, idx) => {
                                        const count = schedule.filter(s => s.type === 'classical' && s.className === item.class).length;
                                        const themeClass = cardThemes[idx % 5];
                                        return (
                                            <button
                                                key={item.class}
                                                onClick={() => setViewingClass(item.class)}
                                                className={`w-full border rounded-xl p-3.5 sm:p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md text-left relative overflow-hidden group ${themeClass}`}
                                            >
                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between mb-2.5 sm:mb-4">
                                                        <div className="p-1.5 sm:p-2 rounded-lg bg-white/40 dark:bg-black/10 text-current">
                                                            <Users size={16} className="sm:w-6 sm:h-6" />
                                                        </div>
                                                        <div className="bg-white/50 dark:bg-black/20 font-extrabold text-[9px] sm:text-xs rounded-md px-2 py-0.5 sm:px-3 sm:py-1 text-current">
                                                            Lihat Data
                                                        </div>
                                                    </div>
                                                    <h3 className="text-sm sm:text-2xl font-black text-current mb-0.5 sm:mb-1 truncate">Kelas {item.class}</h3>
                                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-sm font-semibold truncate">{count} Murojaah Tercatat</p>
                                                </div>
                                            </button>
                                        );
                                    });
                                })()}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                                <div className="lg:col-span-2 bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] rounded-xl shadow-sm p-6 transition-colors duration-300 animate-in fade-in">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-[#E2EAE5] text-lg">Log Jurnal Murojaah Kelas</h3>
                                            <p className="text-slate-500 dark:text-[#8BA398] text-xs mt-1">Ringkasan progres materi murojaah terkini untuk setiap kelas.</p>
                                        </div>
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full">Real-time</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 dark:border-[#1A2E24] text-slate-400 dark:text-[#8BA398] text-[11px] font-bold uppercase tracking-wider">
                                                    <th className="pb-3 pl-1 w-1/4">TANGGAL</th>
                                                    <th className="pb-3 text-center w-1/4">KELAS</th>
                                                    <th className="pb-3 text-left w-1/2">MATERI HARI INI</th>
                                                    <th className="pb-3 text-center w-16">AKSI</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-[#1A2E24] text-sm">
                                                {jurnalData.map((row, idx) => (
                                                    <tr 
                                                        key={idx} 
                                                        onClick={() => setViewingClass(row.class)}
                                                        className="hover:bg-slate-50/50 dark:hover:bg-[#1C3026]/30 transition-colors group cursor-pointer"
                                                    >
                                                        <td className="py-4 pl-1 font-semibold text-slate-500 dark:text-[#8BA398] text-xs w-1/4">{row.date}</td>
                                                        <td className="py-4 text-center font-semibold text-slate-700 w-1/4">
                                                            <span className="bg-slate-100 dark:bg-emerald-950/20 text-slate-700 dark:text-[#E2EAE5] px-2.5 py-1 rounded-full text-xs font-bold">{row.class}</span>
                                                        </td>
                                                        <td className="py-4 text-slate-800 dark:text-[#E2EAE5] font-bold text-left w-1/2">{row.material}</td>
                                                        <td className="py-4 text-center w-16" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex justify-center">
                                                                <button 
                                                                    onClick={() => setViewingClass(row.class)}
                                                                    className="text-slate-400 dark:text-[#8BA398] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col gap-4 dark:bg-[#121F18] dark:border-[#1A2E24]">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-[#E2EAE5] text-lg">Status Murojaah Hari Ini</h3>
                                        <p className="text-slate-500 dark:text-[#8BA398] text-xs mt-1">Status dan jadwal murojaah klasikal aktif</p>
                                    </div>
                                    
                                    <div className="flex flex-col gap-4 mt-2">
                                        <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-[#1A2E24] p-4 shadow-sm flex items-center gap-4 hover:border-emerald-200 transition-all">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">KELAS TERSELESAIKAN</p>
                                                <p className="text-xl font-black text-slate-800 dark:text-[#E2EAE5] mt-0.5">3 dari 5 Kelas</p>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-[#1A2E24] p-4 shadow-sm flex items-center gap-4 hover:border-emerald-200 transition-all">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">JADWAL BERIKUTNYA</p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-[#E2EAE5] mt-0.5">Kelas 6D - Pukul 14.30</p>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-[#1A2E24] p-4 shadow-sm flex items-center gap-4 hover:border-emerald-200 transition-all">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                                <BookOpen size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">MATERI AKTIF HARI INI</p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-[#E2EAE5] mt-0.5">Juz 30 (Lancar)</p>
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
                        <div className="space-y-6 animate-in fade-in">
                            {(() => {
                                const currentStudent = students?.find(s => s.name === user?.name || s.id === user?.studentId);
                                const studentClass = currentStudent?.class;
                                const classMurojaah = schedule.filter(s => s.type === 'classical' && s.className === studentClass && s.date === 'Hari Ini');

                                return (
                                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-8 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-2 bg-white dark:bg-dark-card/20 rounded-lg backdrop-blur-sm">
                                                    <StickyNote size={24} className="text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold">Catatan Murojaah Hari Ini</h3>
                                                    <p className="text-indigo-100 text-sm opacity-90">
                                                        {studentClass ? `Kelas ${studentClass}` : 'Kelas Tidak Ditemukan'}
                                                    </p>
                                                </div>
                                            </div>

                                            {classMurojaah.length > 0 ? (
                                                <div className="space-y-4">
                                                    {classMurojaah.map((item, idx) => (
                                                        <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-white dark:bg-dark-card/20 text-white flex items-center gap-1">
                                                                    <Users size={10} />
                                                                    Murojaah Bersama
                                                                </span>
                                                                <span className="text-xs font-medium bg-emerald-500/80 px-2 py-0.5 rounded text-white">Target</span>
                                                            </div>
                                                            <h4 className="text-2xl font-bold mb-1">{item.surah}</h4>
                                                            <p className="text-indigo-100/80 text-sm">Juz {item.juz}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
                                                    <p className="font-medium">Tidak ada target murojaah bersama hari ini.</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white dark:bg-dark-card/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-900/20 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4" />
                                    </div>
                                );
                            })()}

                            <div className="bg-white rounded-2xl p-6 border border-gray-100 dark:border-dark-border shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">Riwayat Individu</h4>
                                        <p className="text-sm text-gray-500">Total {schedule.filter(s => s.type === 'individual').length} sesi tercatat</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {isEditModalOpen && selectedJurnal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#121F18] dark:border dark:border-[#1A2E24] rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-[#1A2E24]">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-[#E2EAE5]">
                                Perbarui Jurnal Kelas {selectedJurnal.class}
                            </h3>
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider mb-2">
                                    Tanggal Jurnal
                                </label>
                                <input
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-[#1A2E24] dark:bg-[#09120E] dark:text-[#E2EAE5] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg outline-none transition-all font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider mb-2">
                                    Materi Hari Ini
                                </label>
                                <textarea
                                    value={editMaterial}
                                    onChange={(e) => setEditMaterial(e.target.value)}
                                    rows={3}
                                    placeholder="Contoh: Surah An-Naba (Ayat 1 - 40)"
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-[#1A2E24] dark:bg-[#09120E] dark:text-[#E2EAE5] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg outline-none transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-slate-600 dark:text-[#8BA398] hover:bg-slate-100 dark:hover:bg-[#1C3026] rounded-lg transition-colors text-sm font-bold"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveJurnal}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
                            >
                                Simpan Jurnal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MurojaahPage;
