import React, { useState, useMemo } from 'react';
import { X, Calendar, ChevronDown, Check, FileText, Clock } from 'lucide-react';
import { Student } from '../types';

interface StudentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
}

interface HafalanData {
    surah: string;
    score: number | undefined;
    status: string;
    ayat?: string; // Added specifics
}

interface TartiliData {
    level: string;
    page: string;
    score: number;
    status: string;
}

interface AbsensiData {
    status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';
    notes?: string;
}

interface HistoryItem {
    date: string; // ISO Date string YYYY-MM-DD
    hafalan: HafalanData;
    tartili: TartiliData;
    absensi: AbsensiData;
}

const StudentHistoryModal: React.FC<StudentHistoryModalProps> = ({ isOpen, onClose, student }) => {
    const [activeTab, setActiveTab] = useState<'hafalan' | 'tartili' | 'absensi'>('hafalan');

    // Default to December 2025 for demo purposes to match screenshot
    const [selectedMonth, setSelectedMonth] = useState<string>('2025-12');

    // Generate Mock history data with real dates based on student ID to make it dynamic
    const history: HistoryItem[] = useMemo(() => {
        if (!student) return [];

        // Helper to generate consistent pseudo-random numbers from string
        const hashCode = (s: string) => s.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
        const seed = Math.abs(hashCode(student.name + student.id));

        const baseScores = [90, 85, 88, 75, 95, 80];
        const surahs = ["Ad-Duhaa", "Al-Lail", "Ash-Shams", "Al-Balad", "Al-Fajr"];
        const absensiStatuses: ('Hadir' | 'Izin' | 'Sakit' | 'Alpha')[] = ['Hadir', 'Hadir', 'Hadir', 'Izin', 'Hadir', 'Sakit'];

        // Generate entries for the last 3 months
        const items: HistoryItem[] = [];
        const months = ['2025-12', '2025-11', '2025-10'];

        months.forEach((month, mIdx) => {
            // Generate entries for most days to simulate attendance
            // For Hafalan/Tartili we keep the sparse schedule, but for Absensi we want more coverage
            // However, to keep it simple and aligned, we'll just assume data exists for these specific days for all logs
            const entriesCount = 5 + (seed % 5);

            for (let i = 0; i < entriesCount; i++) {
                const day = 28 - (i * 3) - (seed % 3);
                const date = `${month}-${day.toString().padStart(2, '0')}`;

                const scoreIdx = (seed + i + mIdx) % baseScores.length;
                const score = baseScores[scoreIdx];

                let status = 'Jayyid';
                if (score >= 90) status = 'Mumtaz';
                else if (score >= 80) status = 'Jayyid Jiddan';
                else if (score >= 70) status = 'Jayyid';
                else status = 'Perlu Bimbingan';

                // Reverse logic for progress: Newest (i=0, mIdx=0) should have highest progress
                // Let's assume current progress is Surah Index 0..4 (Ad-Duhaa..Fajr is 93..89).
                // Learning order usually An-Nas (114) -> An-Naba (78).
                // Mock: Just ensure "Page" and "Ayat" numbers decrease as we go back in time.

                // Surah: Just cycle through.
                const surahIdx = (seed + i + mIdx) % surahs.length;
                const absensiIdx = (seed + i + mIdx) % absensiStatuses.length;

                // Bias towards Hadir
                const absensiStatus = Math.random() > 0.3 ? 'Hadir' : absensiStatuses[absensiIdx];

                // Hafalan Progress: Newest = Base - 0. Oldest = Base - BigNumber.
                // Ayat 26-30 (Newest) -> Ayat 1-5 (Oldest)
                const startAyat = Math.max(1, 41 - ((i + (mIdx * 5)) * 5));
                const endAyat = startAyat + 4;

                // Tartili Progress: Newest = Page 30. Oldest = Page 1.
                const pageNum = Math.max(1, 40 - (i + (mIdx * 5)));

                items.push({
                    date: date,
                    hafalan: {
                        surah: surahs[surahIdx],
                        ayat: `Ayat ${startAyat}-${endAyat}`,
                        score: score,
                        status: status
                    },
                    tartili: {
                        level: `Jilid ${student.iqraLevel || 4}`,
                        page: `Hal. ${pageNum}`,
                        score: score - (i % 2),
                        status: status
                    },
                    absensi: {
                        status: absensiStatus,
                        notes: absensiStatus !== 'Hadir' ? 'Keterangan dari wali murid' : undefined
                    }
                });
            }
        });

        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [student]);

    // Filter history based on selected month
    const filteredHistory = useMemo(() => {
        return history.filter(item => item.date.startsWith(selectedMonth));
    }, [history, selectedMonth]);

    // Format date for display (e.g., "MINGGU, 28 Des 2025")
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);

        // Manual formatting to match Indonesian locale if Intl is tricky in some envs, 
        // but Intl is standard.
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' }).toUpperCase();
        const datePart = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

        // Split to get desired format: "MINGGU" (newline) "28 Des 2025"
        return { dayName, datePart };
    };

    // Available months for selector
    const availableMonths = [
        { value: '2025-12', label: 'Desember 2025' },
        { value: '2025-11', label: 'November 2025' },
        { value: '2025-10', label: 'Oktober 2025' },
    ];

    if (!isOpen || !student) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
            <div className="bg-[#F2F2F7] w-full max-w-2xl mx-auto rounded-[30px] overflow-hidden shadow-2xl text-slate-900 flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 dark:border-dark-border p-6 shrink-0">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Riwayat {activeTab === 'absensi' ? 'Kehadiran' : 'Belajar'}</h2>
                            <p className="text-gray-500 mt-1">Catatan perkembangan {student.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-500 dark:text-gray-400 rounded-full p-2.5 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Tabs */}
                        <div className="bg-gray-200/80 p-1 rounded-xl flex text-sm font-bold w-full sm:w-auto overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setActiveTab('hafalan')}
                                className={`px-4 sm:px-6 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'hafalan'
                                    ? 'bg-white dark:bg-dark-card shadow-sm text-indigo-900'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'
                                    }`}
                            >
                                Hafalan
                            </button>
                            <button
                                onClick={() => setActiveTab('tartili')}
                                className={`px-4 sm:px-6 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'tartili'
                                    ? 'bg-white dark:bg-dark-card shadow-sm text-indigo-900'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'
                                    }`}
                            >
                                Tartili
                            </button>
                            <button
                                onClick={() => setActiveTab('absensi')}
                                className={`px-4 sm:px-6 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === 'absensi'
                                    ? 'bg-white dark:bg-dark-card shadow-sm text-indigo-900'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'
                                    }`}
                            >
                                Absensi
                            </button>
                        </div>

                        {/* Month Selector */}
                        <div className="relative w-full sm:w-auto">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full sm:w-auto appearance-none bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-200 py-2.5 pl-10 pr-10 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-sm hover:border-indigo-300 transition-colors"
                            >
                                {availableMonths.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" size={18} />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 overflow-y-auto bg-gray-50 dark:bg-dark-card-hover/50 flex-1">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map((item, idx) => {
                            const isHafalan = activeTab === 'hafalan';
                            const isTartili = activeTab === 'tartili';
                            const isAbsensi = activeTab === 'absensi';

                            let title = '';
                            let subtitle = null;
                            let status = '';
                            let score = 0;
                            let statusColor = '';
                            let icon = null;

                            if (isHafalan) {
                                title = item.hafalan.surah;
                                subtitle = item.hafalan.ayat;
                                status = item.hafalan.status;
                                score = item.hafalan.score || 0;
                                statusColor = status === 'Mumtaz' ? 'bg-green-100 text-green-700' :
                                    status === 'Jayyid Jiddan' ? 'bg-blue-100 text-blue-700' :
                                        status === 'Jayyid' ? 'bg-indigo-50 text-indigo-600' :
                                            'bg-yellow-100 text-yellow-700';
                            } else if (isTartili) {
                                title = item.tartili.level;
                                subtitle = item.tartili.page;
                                status = item.tartili.status;
                                score = item.tartili.score;
                                statusColor = status === 'Mumtaz' ? 'bg-green-100 text-green-700' :
                                    status === 'Jayyid Jiddan' ? 'bg-blue-100 text-blue-700' :
                                        status === 'Jayyid' ? 'bg-indigo-50 text-indigo-600' :
                                            'bg-yellow-100 text-yellow-700';
                            } else {
                                // Absensi Logic
                                title = item.absensi.status;
                                subtitle = item.absensi.notes || (item.absensi.status === 'Hadir' ? 'Tepat Waktu' : '-');
                                status = item.absensi.status;

                                switch (status) {
                                    case 'Hadir':
                                        statusColor = 'bg-emerald-100 text-emerald-700';
                                        icon = <Check size={20} className="text-emerald-600" />;
                                        break;
                                    case 'Izin':
                                        statusColor = 'bg-blue-100 text-blue-700';
                                        icon = <FileText size={20} className="text-blue-600" />;
                                        break;
                                    case 'Sakit':
                                        statusColor = 'bg-amber-100 text-amber-700';
                                        icon = <Clock size={20} className="text-amber-600" />;
                                        break;
                                    case 'Alpha':
                                        statusColor = 'bg-red-100 text-red-700';
                                        icon = <X size={20} className="text-red-600" />;
                                        break;
                                }
                            }

                            const { dayName, datePart } = formatDate(item.date);

                            return (
                                <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-dark-border/50 hover:shadow-md transition-all flex flex-col sm:flex-row items-center gap-6">
                                    {/* Date Column */}
                                    <div className="text-center sm:text-left min-w-[100px] border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-dark-border pb-4 sm:pb-0 sm:pr-6">
                                        <div className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-1">{dayName}</div>
                                        <div className="text-sm text-gray-500">{datePart}</div>
                                    </div>

                                    {/* Content Column */}
                                    <div className="flex-1 text-center sm:text-left">
                                        <div className="flex items-center justify-center sm:justify-start gap-3">
                                            {isAbsensi && icon && (
                                                <div className={`p-2 rounded-full ${statusColor.split(' ')[0]} bg-opacity-50`}>
                                                    {icon}
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{title}</h4>
                                                {subtitle && (
                                                    <span className="inline-block bg-gray-100 dark:bg-dark-card-hover text-gray-600 dark:text-gray-300 text-xs font-bold px-3 py-1 rounded-lg">
                                                        {subtitle}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score & Status Column - Hide score for Absensi */}
                                    <div className="flex items-start gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-gray-100 dark:border-dark-border pt-4 sm:pt-0">
                                        {!isAbsensi && (
                                            <div className="text-center min-w-[40px]">
                                                <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{score}</div>
                                                <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Nilai</div>
                                            </div>
                                        )}

                                        <span className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${statusColor}`}>
                                            {status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="bg-gray-100 p-4 rounded-full mb-4">
                                <Calendar className="text-gray-400" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Tidak ada riwayat</h3>
                            <p className="text-gray-500 max-w-xs mx-auto mt-1">
                                Belum ada catatan {activeTab} untuk bulan {availableMonths.find(m => m.value === selectedMonth)?.label}.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default StudentHistoryModal;
