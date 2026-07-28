import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Student } from '../types';
import { SURAHS_JUZ_30, SURAHS_JUZ_29, SURAHS_JUZ_28 } from '../constants';

interface StatsDashboardProps {
    students: Student[];
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ students }) => {
    const [activeTab, setActiveTab] = useState<'hafalan' | 'tartili'>('hafalan');

    // --- Helper: Hafalan Score ---
    // Higher score = More progress (Lower Juz number, Earlier Surah in Juz)
    const getHafalanScore = (s: Student) => {
        // 1. Juz Score (Inverse: Juz 1 > Juz 30)
        // Base: (31 - Juz) * 10000
        const juz = s.currentJuz || 30;
        const baseScore = (31 - juz) * 10000;

        // 2. Surah Score (Inverse Index in Juz)
        // We need to know which Surah list to use
        let surahList: string[] = [];
        if (juz === 30) surahList = SURAHS_JUZ_30;
        else if (juz === 29) surahList = SURAHS_JUZ_29;
        else if (juz === 28) surahList = SURAHS_JUZ_28;
        // ... add more if needed

        // Find index. If not found, default to 0.
        const surahIndex = surahList.indexOf(s.currentSurah);
        const surahScore = surahIndex !== -1 ? (100 - surahIndex) : 0; // 100 is just detailed filler

        return baseScore + surahScore;
    };

    // --- Helper: Tartili Score ---
    // Jilid 1 < Jilid 6 < Al-Qur'an
    const getTartiliScore = (s: Student) => {
        const level = s.iqraLevel || 0;
        const page = parseInt(s.page || '0');

        // Score = Level * 1000 + Page
        return level * 1000 + page;
    };

    // --- Computed Lists ---

    // 1. Hafalan List (Sorted Descending)
    const hafalanSorted = [...students]
        .filter(s => s.lastScore !== undefined) // Ensure they are active
        .sort((a, b) => getHafalanScore(b) - getHafalanScore(a));

    const hafalanHighest = hafalanSorted.slice(0, 3);
    const hafalanLowest = [...hafalanSorted].reverse().slice(0, 3);

    // 2. Tartili List (Sorted Descending)
    const tartiliSorted = [...students]
        .sort((a, b) => getTartiliScore(b) - getTartiliScore(a));

    const tartiliHighest = tartiliSorted.slice(0, 3);
    const tartiliLowest = [...tartiliSorted].reverse().slice(0, 3);

    const renderStudentRow = (s: Student, rank: number, type: 'hafalan' | 'tartili') => {
        // Styling for rank 1, 2, 3
        let rankIcon = <span className="text-gray-500 font-bold w-6 text-center">{rank}</span>;
        let bgClass = "bg-white border-gray-100 hover:border-indigo-200";

        if (rank === 1) {
            rankIcon = <span className="text-xl font-black text-yellow-500 italic">#1</span>;
            bgClass = "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200";
        } else if (rank === 2) {
            rankIcon = <span className="text-xl font-black text-slate-400 italic">#2</span>;
            bgClass = "bg-gradient-to-r from-slate-50 to-gray-50 border-gray-200";
        } else if (rank === 3) {
            rankIcon = <span className="text-xl font-black text-amber-700 italic">#3</span>;
            bgClass = "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200";
        }

        const detailText = type === 'hafalan'
            ? `Juz ${s.currentJuz || 30} • ${s.currentSurah} • Ayat ${s.page}`
            : `Jilid ${s.iqraLevel || '?'} • Hal. ${s.page}`;

        return (
            <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border ${bgClass} transition-all mb-2`}>
                <div className="flex-shrink-0 flex justify-center w-8">
                    {rankIcon}
                </div>
                <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-full border border-white shadow-sm" />
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 text-sm truncate">{s.name}</h4>
                    <p className="text-xs text-gray-500">{s.class}</p>
                </div>
                <div className="text-right flex flex-col items-end justify-center">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full whitespace-nowrap mb-1">
                        {detailText}
                    </span>
                    {s.lastScore !== undefined && (
                        <span className="text-[10px] font-bold text-gray-500">
                            Nilai: <span className="text-emerald-600 ml-0.5">{s.lastScore}</span>
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 overflow-hidden flex flex-col h-full">
            {/* Header Tabs */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('hafalan')}
                    className={`flex-1 py-4 text-sm font-bold transition-colors relative ${activeTab === 'hafalan' ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    Hafalan
                    {activeTab === 'hafalan' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
                </button>
                <button
                    onClick={() => setActiveTab('tartili')}
                    className={`flex-1 py-4 text-sm font-bold transition-colors relative ${activeTab === 'tartili' ? 'text-purple-600 bg-purple-50/50' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    Tartili
                    {activeTab === 'tartili' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600" />}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">

                {/* HAFALAN TAB */}
                {activeTab === 'hafalan' && (
                    <div className="space-y-6">
                        {/* Highest */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-green-100 text-green-600 rounded-lg">
                                    <TrendingUp size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-gray-700">Hafalan Terbanyak</h3>
                            </div>
                            {hafalanHighest.map((s, i) => renderStudentRow(s, i + 1, 'hafalan'))}
                        </div>

                        {/* Lowest */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                                    <TrendingDown size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-gray-700">Perlu Ditingkatkan</h3>
                            </div>
                            {hafalanLowest.map((s, i) => renderStudentRow(s, students.length - 3 + i + 1, 'hafalan'))}
                        </div>
                    </div>
                )}

                {/* TARTILI TAB */}
                {activeTab === 'tartili' && (
                    <div className="space-y-6">
                        {/* Highest */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                                    <TrendingUp size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-gray-700">Tartili Tertinggi</h3>
                            </div>
                            {tartiliHighest.map((s, i) => renderStudentRow(s, i + 1, 'tartili'))}
                        </div>

                        {/* Lowest */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                                    <TrendingDown size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-gray-700">Perlu Ditingkatkan</h3>
                            </div>
                            {tartiliLowest.map((s, i) => renderStudentRow(s, students.length - 3 + i + 1, 'tartili'))}
                        </div>
                    </div>
                )}

            </div>
            <div className="p-3 bg-white border-t border-gray-100 text-center text-[10px] text-gray-400">
                Diperbarui secara otomatis
            </div>
        </div>
    );
};

export default StatsDashboard;
