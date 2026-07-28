import React, { useState } from 'react';
import { Student } from '../types';
import { BookOpen, Book, Users } from 'lucide-react';


interface AverageDetailsViewProps {
    students: Student[];
}

const AverageDetailsView: React.FC<AverageDetailsViewProps> = ({ students }) => {
    const [activeTab, setActiveTab] = useState<'Hafalan' | 'Tartili'>('Hafalan');
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

    // Filter Students
    const hafalanStudents = students.filter(s => s.type === 'Hafalan');
    const tartiliStudents = students.filter(s => s.type === 'Tartili');

    // Calculate Averages


    const tartiliAvgJilid = tartiliStudents.length > 0
        ? (tartiliStudents.reduce((acc, s) => acc + (s.iqraLevel || 0), 0) / tartiliStudents.length).toFixed(1)
        : '0';

    // Grouping Logic
    const groupStudents = (list: Student[], keyFn: (s: Student) => string) => {
        const groups: Record<string, Student[]> = {};
        list.forEach(student => {
            const key = keyFn(student);
            if (!groups[key]) groups[key] = [];
            groups[key].push(student);
        });
        return groups;
    };

    const hafalanGroups = groupStudents(hafalanStudents, s => s.currentSurah.split(':')[0].trim());
    const tartiliGroups = groupStudents(tartiliStudents, s => `Jilid ${s.iqraLevel}`);

    // Get current groups based on active tab
    const currentGroups = activeTab === 'Hafalan' ? hafalanGroups : tartiliGroups;

    // Sort groups by count (descending)
    const sortedGroupKeys = Object.keys(currentGroups).sort((a, b) => currentGroups[b].length - currentGroups[a].length);

    // Set default selected group if none selected or if switching tabs
    React.useEffect(() => {
        if (sortedGroupKeys.length > 0) {
            setSelectedGroup(sortedGroupKeys[0]);
        } else {
            setSelectedGroup(null);
        }
    }, [activeTab, students]); // Re-run when tab changes or data updates

    return (
        <div className="space-y-6 h-[600px] flex flex-col">
            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-xl shrink-0">
                <button
                    onClick={() => setActiveTab('Hafalan')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'Hafalan' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Hafalan Qur'an
                </button>
                <button
                    onClick={() => setActiveTab('Tartili')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'Tartili' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Tartili / Jilid
                </button>
            </div>

            {/* Summary Card */}
            <div className="shrink-0">
                {activeTab === 'Hafalan' ? (
                    <div
                        onClick={() => sortedGroupKeys.length > 0 && setSelectedGroup(sortedGroupKeys[0])}
                        className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white text-center cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all"
                    >
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                            <BookOpen size={24} />
                        </div>
                        <h3 className="text-3xl font-bold mb-1">{sortedGroupKeys[0] || '-'}</h3>
                        <p className="text-indigo-100 text-sm font-medium">Surat Terbanyak</p>
                        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs">
                            <Users size={12} />
                            {hafalanStudents.length} Siswa Hafalan
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                            <Book size={24} />
                        </div>
                        <h3 className="text-3xl font-bold mb-1">Jilid {tartiliAvgJilid}</h3>
                        <p className="text-emerald-100 text-sm font-medium">Rata-rata Tingkat Jilid</p>
                        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs">
                            <Users size={12} />
                            {tartiliStudents.length} Siswa Tartili
                        </div>
                    </div>
                )}
            </div>

            {/* Master-Detail Layout */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Left Column: Group List */}
                <div className="overflow-y-auto pr-2 space-y-2">
                    <h4 className="font-bold text-gray-800 mb-2 sticky top-0 bg-white py-2 z-10 flex items-center gap-2">
                        {activeTab === 'Hafalan' ? <Book size={18} className="text-indigo-600" /> : <BookOpen size={18} className="text-emerald-600" />}
                        {activeTab === 'Hafalan' ? 'Sebaran Surah' : 'Sebaran Jilid'}
                    </h4>
                    {sortedGroupKeys.map(groupName => (
                        <button
                            key={groupName}
                            onClick={() => setSelectedGroup(groupName)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${selectedGroup === groupName
                                ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-200'
                                : 'bg-white border border-gray-100 hover:bg-gray-50'
                                }`}
                        >
                            <span className={`font-bold ${selectedGroup === groupName ? 'text-indigo-700' : 'text-gray-700'}`}>
                                {groupName}
                            </span>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedGroup === groupName ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {currentGroups[groupName].length}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Right Column: Student Details */}
                <div className="md:col-span-2 bg-gray-50 rounded-2xl p-4 overflow-y-auto border border-gray-100">
                    {selectedGroup ? (
                        <div>
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
                                <Users size={18} className="text-gray-500" />
                                Siswa di {selectedGroup}
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {currentGroups[selectedGroup].map(student => (
                                    <div key={student.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                                        <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full border border-gray-100" />
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-800">{student.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">{student.class}</span>
                                                <span>•</span>
                                                <span>Nilai: <span className="font-medium text-gray-700">{student.lastScore || '-'}</span></span>
                                            </div>
                                        </div>
                                        <div className="text-right min-w-[80px]">
                                            <p className="text-xs text-gray-400 uppercase font-bold mb-0.5">Ayat</p>
                                            <p className="text-lg font-bold text-indigo-600">{student.page || '-'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <BookOpen size={48} className="mb-4 opacity-20" />
                            <p>Pilih kelompok untuk melihat detail siswa</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AverageDetailsView;
