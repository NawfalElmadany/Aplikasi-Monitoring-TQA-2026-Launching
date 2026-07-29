import React, { useState, useEffect } from 'react';
import { RotateCw, CheckCircle2, ChevronRight, Plus, Users, Save, X, BookOpen, StickyNote, Calendar, Pencil, Trash2 } from 'lucide-react';
import { GharibEntry, Student, User } from '../types';
import Header from './Header';
import FloatingHeaderCard from './FloatingHeaderCard';

interface GharibPageProps {
    students?: Student[];
    user: User | null;
    history: GharibEntry[];
    onSaveEntry: (entry: Omit<GharibEntry, 'id'>) => Promise<void>;
    onUpdateEntry?: (entry: GharibEntry) => Promise<void>;
    onDeleteEntry?: (id: string | number) => Promise<void>;
    onMenuClick: () => void;
    notifications?: Student[];
    onDismissNotification?: (studentId: string) => void;
    onSearchClick?: () => void;
}

const GharibPage: React.FC<GharibPageProps> = ({ 
    user, 
    students, 
    history, 
    onSaveEntry,
    onUpdateEntry,
    onDeleteEntry,
    onMenuClick,
    notifications = [],
    onDismissNotification,
    onSearchClick
}) => {
    const [showInput, setShowInput] = useState(false);
    const [selectedClass, setSelectedClass] = useState('');
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [status, setStatus] = useState<'Lanjut' | 'Mengulang'>('Lanjut');
    const [material, setMaterial] = useState('');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [viewingClass, setViewingClass] = useState<string | null>(null);

    // Filtering states (detail view)
    const [filterMonth, setFilterMonth] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Edit states (Edit Modal)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedJurnal, setSelectedJurnal] = useState<GharibEntry | null>(null);
    const [editDate, setEditDate] = useState('');
    const [editClass, setEditClass] = useState('');
    const [editStatus, setEditStatus] = useState<'Lanjut' | 'Mengulang'>('Lanjut');
    const [editMaterial, setEditMaterial] = useState('');
    const [editNotes, setEditNotes] = useState('');

    // Local copy of entries for immediate UI updates
    const [localEntries, setLocalEntries] = useState<GharibEntry[]>(history);

    useEffect(() => {
        setLocalEntries(history);
    }, [history]);

    // Auto-fill logic when "Mengulang" is selected (Add Form)
    useEffect(() => {
        if (status === 'Mengulang' && selectedClass) {
            const classEntries = localEntries
                .filter(entry => entry.className === selectedClass)
                .sort((a, b) => b.date.localeCompare(a.date));

            if (classEntries.length > 0) {
                setMaterial(classEntries[0].material);
            }
        }
    }, [status, selectedClass, localEntries]);

    // Auto-fill logic when "Mengulang" is selected (Edit Form)
    useEffect(() => {
        if (editStatus === 'Mengulang' && editClass) {
            const classEntries = localEntries
                .filter(entry => entry.className === editClass && (!selectedJurnal || entry.id !== selectedJurnal.id))
                .sort((a, b) => b.date.localeCompare(a.date));

            if (classEntries.length > 0) {
                setEditMaterial(classEntries[0].material);
            }
        }
    }, [editStatus, editClass, localEntries, selectedJurnal]);

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

    const handleSave = async () => {
        if (!selectedClass || !material) {
            alert('Kelas dan materi pembelajaran harus diisi.');
            return;
        }

        try {
            setIsSaving(true);
            playSuccessSound();

            await onSaveEntry({
                className: selectedClass,
                date,
                status,
                material,
                notes: notes.trim() || undefined
            });

            setShowInput(false);
            setSelectedClass('');
            setDate(new Date().toISOString().slice(0, 10));
            setStatus('Lanjut');
            setMaterial('');
            setNotes('');
        } catch (error) {
            console.error('Failed to save Gharib entry:', error);
            alert('Data Gharib gagal disimpan. Silakan coba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (entry: GharibEntry) => {
        setSelectedJurnal(entry);
        setEditDate(entry.date);
        setEditClass(entry.className);
        setEditStatus(entry.status);
        setEditMaterial(entry.material);
        setEditNotes(entry.notes || '');
        setIsEditModalOpen(true);
    };

    const handleSaveJurnal = async () => {
        if (!selectedJurnal) return;
        if (!editClass || !editMaterial) {
            alert('Kelas dan materi pembelajaran harus diisi.');
            return;
        }

        try {
            setIsSaving(true);
            playSuccessSound();

            if (onUpdateEntry) {
                await onUpdateEntry({
                    id: selectedJurnal.id,
                    className: editClass,
                    date: editDate,
                    status: editStatus,
                    material: editMaterial,
                    notes: editNotes.trim() || undefined
                });
            }

            setIsEditModalOpen(false);
            setSelectedJurnal(null);
        } catch (error) {
            console.error('Failed to update Gharib entry:', error);
            alert('Data Gharib gagal diperbarui. Silakan coba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = async (id: string | number) => {
        if (onDeleteEntry) {
            await onDeleteEntry(id);
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
                const classEntries = localEntries.filter(j => j.className === viewingClass);
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
                        {/* Class Detail Navigation */}
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
                                <span>← Kembali ke Dasbor Gharib</span>
                            </button>
                            {user?.role === 'teacher' && (
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
                            )}
                        </div>

                        {/* Input form inside Class Detail View */}
                        {showInput && (
                            <div className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] p-6 rounded-2xl shadow-lg animate-in slide-in-from-top-4">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <Users size={20} className="text-emerald-600 dark:text-emerald-400" />
                                        Jurnal Pembelajaran Gharib (Klasikal) - Kelas {viewingClass}
                                    </h3>
                                    <button onClick={() => setShowInput(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                                        <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Materi / Halaman</label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: Hal. 21 atau Bab Tashil"
                                            value={material}
                                            onChange={(e) => setMaterial(e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#09120E] border border-slate-200 dark:border-[#1A2E24] text-slate-700 dark:text-[#E2EAE5] rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Status Pembelajaran</label>
                                        <div className="flex gap-4 items-center h-[38px]">
                                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-[#E2EAE5] text-sm">
                                                <input
                                                    type="radio"
                                                    name="gharib-status"
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
                                                    name="gharib-status"
                                                    value="Mengulang"
                                                    checked={status === 'Mengulang'}
                                                    onChange={() => setStatus('Mengulang')}
                                                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                                />
                                                <span>Mengulang</span>
                                            </label>
                                        </div>
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

                        {/* Banner Card */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 to-emerald-600 dark:bg-none dark:bg-[#09120E] text-white p-8 rounded-2xl w-full shadow-md flex items-center gap-6 dark:border dark:border-[#1A2E24]">
                            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl pointer-events-none"></div>
                            <div className="w-16 h-16 rounded-2xl bg-emerald-800 dark:bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-amber-300 dark:text-emerald-400 shrink-0">
                                <Users size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-wide uppercase text-white">
                                    GHARIB KLASIKAL - KELAS {viewingClass}
                                </h2>
                                <div className="mt-2 inline-block px-3 py-1 bg-emerald-800 dark:bg-emerald-500/20 border border-emerald-500/30 text-amber-400 dark:text-emerald-400 text-xs font-black rounded-full">
                                    Program Pembelajaran Gharib
                                </div>
                            </div>
                        </div>

                        {/* Stat Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            <div className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] rounded-xl p-5 shadow-sm flex items-center gap-4 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Total Pertemuan</p>
                                    <p className="text-2xl font-black text-slate-800 dark:text-[#E2EAE5] mt-0.5">
                                        {filteredJurnal.length} Kali
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
                                        {latestEntryForClass?.material || 'Belum ada'}
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
                                        {latestEntryForClass?.notes || 'Tidak ada catatan.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Chronological Logs */}
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
                                            <th className="pb-3 text-left w-1/2">MATERI GHARIB</th>
                                            <th className="pb-3 text-center w-1/4">STATUS/CATATAN</th>
                                            {user?.role === 'teacher' && <th className="pb-3 text-center w-24">AKSI</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-[#1A2E24] text-sm">
                                        {filteredJurnal.map((row, idx) => (
                                            <tr key={row.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-[#1C3026]/30 transition-colors group">
                                                <td className="py-4 text-center font-medium text-slate-400 dark:text-[#8BA398] w-12">{idx + 1}</td>
                                                <td className="py-4 pl-1 font-semibold text-slate-500 dark:text-[#8BA398] text-xs">{formatIndonesianDate(row.date)}</td>
                                                <td className="py-4 text-slate-800 dark:text-[#E2EAE5] font-bold text-left">{row.material}</td>
                                                <td className="py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        row.status === 'Lanjut'
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                                                            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                                                    }`}>
                                                        {row.status}
                                                    </span>
                                                    {row.notes && (
                                                        <div className="text-xs text-slate-400 dark:text-[#8BA398] font-normal italic mt-0.5">
                                                            "{row.notes}"
                                                        </div>
                                                    )}
                                                </td>
                                                {user?.role === 'teacher' && (
                                                    <td className="py-4 text-center w-24">
                                                        <div className="flex justify-center items-center gap-3">
                                                            <button 
                                                                onClick={() => handleEditClick(row)}
                                                                className="text-slate-400 dark:text-[#8BA398] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                                                                title="Edit Jurnal"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteClick(row.id)}
                                                                className="text-slate-400 dark:text-[#8BA398] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
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
                    {/* Header */}
                    <FloatingHeaderCard className="no-print">
                        <Header
                            user={user!}
                            onMenuClick={onMenuClick}
                            notifications={notifications}
                            onDismissNotification={onDismissNotification}
                            onSearchClick={onSearchClick}
                            flat={true}
                            title="Gharib Klasikal"
                            subtitle="Catatan progres dan ketuntasan materi Gharib klasikal"
                            actionButton={
                                user?.role === 'teacher' && (
                                    <button
                                        onClick={() => setShowInput(true)}
                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-900/20 hover:scale-105 cursor-pointer text-sm"
                                    >
                                        <Plus size={18} />
                                        <span>Catat Gharib</span>
                                    </button>
                                )
                            }
                        />
                    </FloatingHeaderCard>

                    {/* Inline Input Form */}
                    {showInput && (
                        <div className="bg-white dark:bg-[#12231A] border border-emerald-100 dark:border-[#1E382B] p-6 rounded-3xl shadow-lg animate-in slide-in-from-top-4 my-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-2 text-base sm:text-lg">
                                    <Users size={20} className="text-emerald-600 dark:text-emerald-400" />
                                    Jurnal Pembelajaran Gharib (Klasikal)
                                </h3>
                                <button onClick={() => setShowInput(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#16291F]">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-400 dark:text-[#6B8578] uppercase tracking-wider mb-1">Pilih Kelas</label>
                                    <select
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-[#0C1A13] border border-slate-200 dark:border-[#1E382B] text-slate-800 dark:text-[#E2EAE5] rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition-colors cursor-pointer"
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
                                    <label className="block text-xs font-bold text-slate-400 dark:text-[#6B8578] uppercase tracking-wider mb-1">Tanggal</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-[#0C1A13] border border-slate-200 dark:border-[#1E382B] text-slate-800 dark:text-[#E2EAE5] rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition-colors cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-400 dark:text-[#6B8578] uppercase tracking-wider mb-1">Status Pembelajaran</label>
                                    <div className="flex gap-4 items-center h-[42px]">
                                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-[#E2EAE5] text-sm">
                                            <input
                                                type="radio"
                                                name="gharib-status"
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
                                                name="gharib-status"
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-400 dark:text-[#6B8578] uppercase tracking-wider mb-1">Materi / Halaman</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Hal. 21 atau Bab Tashil"
                                        value={material}
                                        onChange={(e) => setMaterial(e.target.value)}
                                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-[#0C1A13] border border-slate-200 dark:border-[#1E382B] text-slate-800 dark:text-[#E2EAE5] rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition-colors"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-400 dark:text-[#6B8578] uppercase tracking-wider mb-1">Catatan Tambahan</label>
                                    <textarea
                                        placeholder="Catat kendala siswa, atau info pertemuan klasikal berikutnya..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={1}
                                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-[#0C1A13] border border-slate-200 dark:border-[#1E382B] text-slate-800 dark:text-[#E2EAE5] rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-900/20 transition-all cursor-pointer hover:scale-105"
                                >
                                    <Save size={16} />
                                    <span>Simpan Jurnal</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {user?.role === 'teacher' ? (
                        <>
                            {/* Class Cards Grid - Cohesive Emerald Glassmorphism */}
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-6 mt-4">
                                {['5B', '5C', '5D', '6C', '6D'].map((className) => {
                                    const count = localEntries.filter(s => s.className === className).length;
                                    return (
                                        <button
                                            key={className}
                                            onClick={() => setViewingClass(className)}
                                            className="w-full bg-white dark:bg-[#12231A] border border-emerald-100 dark:border-[#1E382B] rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700/60 text-left relative overflow-hidden group shadow-sm"
                                        >
                                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                                                    <Users size={20} />
                                                </div>
                                                <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                    Lihat Data
                                                </span>
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mb-1">Kelas {className}</h3>
                                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full inline-block border border-emerald-200/50 dark:border-emerald-800/30">
                                                {count} Jurnal Gharib
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Split Bottom Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                                
                                {/* Left Side: Logs Table */}
                                <div className="lg:col-span-2 bg-white dark:bg-[#12231A] border border-emerald-100/60 dark:border-[#1E382B] rounded-3xl p-5 sm:p-6 shadow-sm transition-colors duration-300 animate-in fade-in">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 dark:text-[#E2EAE5]">
                                                Log Jurnal Gharib Kelas
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-[#8BA398] mt-0.5">Ringkasan progres materi terbaru.</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 rounded-full shrink-0 shadow-sm">
                                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Live</span>
                                        </div>
                                    </div>

                                    {/* Baris Data sebagai Kartu UI */}
                                    <div className="space-y-3.5">
                                        {localEntries.slice(0, 10).map((row, idx) => (
                                            <div key={row.id || idx} className="bg-slate-50/70 dark:bg-[#0C1A13] border border-slate-200/60 dark:border-[#1E382B] rounded-2xl p-4 sm:p-5 flex gap-4 sm:gap-6 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-[#152B20] transition-all">
                                                {/* Kolom Kiri: Blok Tanggal */}
                                                <div className="flex flex-col items-center justify-center border-r border-slate-200/60 dark:border-[#1E382B] pr-4 sm:pr-6 min-w-[75px] sm:min-w-[85px] text-center">
                                                    {(() => {
                                                        const [year, month, day] = row.date.split('-');
                                                        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                                                        const monthName = months[parseInt(month) - 1] || '';
                                                        return (
                                                            <>
                                                                <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 leading-none">
                                                                    {parseInt(day)}
                                                                </span>
                                                                <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-[#8BA398] mt-1">
                                                                    {monthName}
                                                                </span>
                                                                <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 dark:text-[#6B8578] mt-0.5">
                                                                    {year}
                                                                </span>
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Kolom Tengah: Info Materi & Kelas */}
                                                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                    <div>
                                                        <h4 className="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-tight">
                                                            {row.material.replace(/\s*-\s*/g, '-')}
                                                        </h4>
                                                        {row.notes && (
                                                            <p className="text-xs text-slate-500 dark:text-[#8BA398] mt-1 font-medium truncate max-w-[240px]" title={row.notes}>
                                                                Catatan: {row.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                    
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#12231A] text-slate-600 dark:text-[#9FB8AB] text-xs font-bold rounded-lg border border-slate-200/60 dark:border-[#1E382B] w-fit mt-3 shadow-sm">
                                                        <Users size={12} className="text-emerald-600 dark:text-emerald-400" />
                                                        Kelas {row.className}
                                                    </span>
                                                </div>

                                                {/* Kolom Kanan: Status & Aksi */}
                                                <div className="flex flex-col justify-between items-end min-w-[100px] sm:min-w-[140px] shrink-0">
                                                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-extrabold border whitespace-nowrap shadow-sm ${
                                                        row.status === 'Lanjut' 
                                                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40' 
                                                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                                                    }`}>
                                                        {row.status}
                                                    </span>

                                                    <div className="flex items-center gap-2 mt-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                        <button 
                                                            onClick={() => handleEditClick(row)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-[#1E382B] text-slate-600 dark:text-[#9FB8AB] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-[#16291F] rounded-lg text-xs font-bold transition-all bg-white dark:bg-[#12231A] cursor-pointer shadow-sm"
                                                            title="Edit Jurnal"
                                                        >
                                                            <Pencil size={12} />
                                                            <span>Edit</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteClick(row.id)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-bold transition-all bg-white dark:bg-[#12231A] cursor-pointer shadow-sm"
                                                            title="Hapus Jurnal"
                                                        >
                                                            <Trash2 size={12} />
                                                            <span>Hapus</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {localEntries.length === 0 && (
                                            <div className="text-center py-16 bg-slate-50 dark:bg-[#0C1A13] rounded-2xl border border-slate-200/60 dark:border-[#1E382B] text-slate-400 dark:text-[#6B8578] font-medium">
                                                Belum ada jurnal Gharib yang dicatat.
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
                                            className="w-full py-3.5 mt-4 border-2 border-dashed border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-[#0C1A13]/50 text-emerald-700 dark:text-emerald-400 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-100/60 dark:hover:bg-[#152B20] hover:border-emerald-400 transition-all cursor-pointer text-sm shadow-sm"
                                        >
                                            <Plus size={18} />
                                            <span>Tambah Jurnal Gharib</span>
                                        </button>
                                    )}
                                </div>

                                {/* Right Side: Status Sidebar */}
                                <div className="bg-white dark:bg-[#12231A] border border-emerald-100/60 dark:border-[#1E382B] rounded-3xl p-6 shadow-sm space-y-4">
                                    <div>
                                        <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">Status Gharib Hari Ini</h3>
                                        <p className="text-slate-500 dark:text-[#8BA398] text-xs mt-1 font-medium">Status dan jadwal pembelajaran Gharib aktif</p>
                                    </div>
                                    
                                    <div className="flex flex-col gap-3.5 pt-2">
                                        <div className="bg-slate-50 dark:bg-[#0C1A13] border border-slate-200/60 dark:border-[#1E382B] p-4 rounded-2xl flex items-center gap-4 hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all">
                                            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/40">
                                                <CheckCircle2 size={22} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-[#6B8578] uppercase tracking-wider">KELAS TERCATAT HARI INI</p>
                                                <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">
                                                    {(() => {
                                                        const todayStr = new Date().toISOString().slice(0, 10);
                                                        const todayEntries = localEntries.filter(e => e.date === todayStr);
                                                        const uniqueClasses = new Set(todayEntries.map(e => e.className));
                                                        return `${uniqueClasses.size} dari 5 Kelas`;
                                                    })()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-[#0C1A13] border border-slate-200/60 dark:border-[#1E382B] p-4 rounded-2xl flex items-center gap-4 hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all">
                                            <div className="w-11 h-11 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-800/40">
                                                <BookOpen size={22} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-[#6B8578] uppercase tracking-wider">LOG TERAKHIR DIUPDATE</p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5 truncate">
                                                    {localEntries.length > 0 ? `${localEntries[0].className}: ${localEntries[0].material}` : 'Belum ada data'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-[#09120E] border border-slate-100 dark:border-[#1A2E24] p-4 shadow-sm flex items-center gap-4 hover:border-emerald-200 transition-all rounded-xl">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">TOTAL PERTEMUAN</p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-[#E2EAE5] mt-0.5">{localEntries.length} Jurnal</p>
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
                        /* Students View (Catatan Gharib Hari Ini) */
                        <div className="space-y-6 animate-in fade-in">
                            {(() => {
                                const currentStudent = students?.find(s => s.name === user?.name || s.id === user?.studentId);
                                const studentClass = currentStudent?.class;
                                // get today's entry (or the latest entry) for student's class
                                const classGharib = localEntries
                                    .filter(s => s.className === studentClass)
                                    .sort((a, b) => b.date.localeCompare(a.date));

                                return (
                                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                                    <StickyNote size={24} className="text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold">Catatan Gharib Hari Ini</h3>
                                                    <p className="text-emerald-100 text-sm opacity-90">
                                                        {studentClass ? `Kelas ${studentClass}` : 'Kelas Tidak Terdaftar'}
                                                    </p>
                                                </div>
                                            </div>

                                            {classGharib.length > 0 ? (
                                                <div className="space-y-4">
                                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-white/20 text-white flex items-center gap-1">
                                                                Belajar Klasikal
                                                            </span>
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${
                                                                classGharib[0].status === 'Lanjut' ? 'bg-emerald-500/80' : 'bg-amber-500/80'
                                                            }`}>
                                                                {classGharib[0].status}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-2xl font-bold mb-1">{classGharib[0].material}</h4>
                                                        <p className="text-emerald-100/85 text-xs">Diperbarui: {formatIndonesianDate(classGharib[0].date)}</p>
                                                        {classGharib[0].notes && (
                                                            <div className="mt-3 pt-3 border-t border-white/10 text-sm text-emerald-50">
                                                                <strong>Catatan:</strong> {classGharib[0].notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
                                                    <p className="font-medium">Belum ada jurnal materi Gharib tercatat untuk kelas Anda.</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-900/20 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4" />
                                    </div>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider mb-2">
                                        Status Pembelajaran
                                    </label>
                                    <div className="flex gap-4 items-center h-[42px]">
                                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-[#E2EAE5] text-sm">
                                            <input
                                                type="radio"
                                                name="gharib-edit-status"
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
                                                name="gharib-edit-status"
                                                value="Mengulang"
                                                checked={editStatus === 'Mengulang'}
                                                onChange={() => setEditStatus('Mengulang')}
                                                className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                            />
                                            <span>Mengulang</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider mb-2">
                                        Materi Hari Ini
                                    </label>
                                    <input
                                        type="text"
                                        value={editMaterial}
                                        onChange={(e) => setEditMaterial(e.target.value)}
                                        placeholder="Contoh: Hal. 21 atau Bab Tashil"
                                        className="w-full px-4 py-2 border border-slate-200 dark:border-[#1A2E24] dark:bg-[#09120E] dark:text-[#E2EAE5] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg outline-none transition-all font-semibold text-sm"
                                    />
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

export default GharibPage;
