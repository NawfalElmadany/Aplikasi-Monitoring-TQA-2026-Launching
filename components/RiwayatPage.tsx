import React, { useState } from 'react';
import { Student } from '../types';
import { Calendar, BookOpen, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import StudentHistoryModal from './StudentHistoryModal';

interface RiwayatPageProps {
    students: Student[];
}

const RiwayatPage: React.FC<RiwayatPageProps> = ({ students }) => {
    const [selectedClass, setSelectedClass] = useState<string>('Semua');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // Get unique classes
    const classes = ['Semua', ...Array.from(new Set(students.map(s => s.class || 'Lainnya'))).sort()];

    // Filter students based on class and ensure they have some activity (lastUpdate is not "Belum ada")
    // For "Riwayat", we might want to show all students or just those who have submitted. 
    // Assuming "Riwayat" implies history of submissions, we prioritize those with recent updates.
    const filteredStudents = students.filter(student => {
        const matchesClass = selectedClass === 'Semua' || student.class === selectedClass;
        // Optional: Filter out students who haven't submitted anything if desired, 
        // but showing all gives a complete picture. Let's show all for now, 
        // maybe sorting by lastUpdate (most recent first) would be good.
        return matchesClass;
    }).sort((a, b) => {
        // Simple sort: "Baru saja" first, then others. 
        // Since we don't have real timestamps, we can't do a perfect time sort.
        if (a.lastUpdate === 'Baru saja' && b.lastUpdate !== 'Baru saja') return -1;
        if (a.lastUpdate !== 'Baru saja' && b.lastUpdate === 'Baru saja') return 1;
        return 0;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-dark-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Clock className="text-emerald-600" />
                        Riwayat Setoran
                    </h2>
                    <p className="text-slate-500">Pantau hasil setoran hafalan dan tartili siswa</p>
                </div>

                {/* Class Filter Toolbar */}
                <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
                    {classes.map((className) => (
                        <button
                            key={className}
                            onClick={() => setSelectedClass(className)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedClass === className
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                : 'bg-slate-100 dark:bg-dark-card-hover text-slate-600 dark:text-gray-300 hover:bg-slate-200'
                                }`}
                        >
                            {className}
                        </button>
                    ))}
                </div>
            </div>

            {/* History List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                        <div
                            key={student.id}
                            onClick={() => setSelectedStudent(student)}
                            className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 dark:border-dark-border hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer group"
                        >
                            <div className="grid grid-cols-12 gap-4 items-center">
                                {/* 1. Profile (Col Span 4) */}
                                <div className="col-span-12 md:col-span-4 flex items-center gap-4">
                                    <div className="relative flex-shrink-0">
                                        <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-50 group-hover:border-emerald-100 transition-colors" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 transition-colors text-sm md:text-base truncate">{student.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-dark-card-hover px-1.5 py-0.5 rounded border border-slate-200">{student.class}</span>
                                            <span className="text-[10px] font-medium text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Lihat Riwayat &rarr;
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Waktu (Col Span 2) */}
                                <div className="col-span-6 md:col-span-2 pl-2 border-l border-slate-100 dark:border-dark-border md:border-none">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">WAKTU</p>
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300 font-bold text-xs">
                                        <Calendar size={12} className="text-slate-400" />
                                        {student.lastUpdate}
                                    </div>
                                </div>

                                {/* 3. Materi (Col Span 3) */}
                                <div className="col-span-6 md:col-span-3 pl-2 border-l border-slate-100 dark:border-dark-border md:border-none">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">MATERI</p>
                                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-gray-200 font-bold text-xs">
                                        <BookOpen size={12} className="text-slate-400" />
                                        <span className="truncate" title={student.currentSurah}>{student.currentSurah}</span>
                                    </div>
                                </div>

                                {/* 4. Nilai (Col Span 1) */}
                                <div className="col-span-6 md:col-span-1 pl-2 border-l border-slate-100 dark:border-dark-border md:border-none">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">NILAI</p>
                                    <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                                        {student.lastScore || '-'}
                                    </div>
                                </div>

                                {/* 5. Status (Col Span 2) */}
                                <div className="col-span-6 md:col-span-2 pl-2 border-l border-slate-100 dark:border-dark-border md:border-none">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">STATUS</p>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit whitespace-nowrap ${student.status === 'Mumtaz' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                        student.status === 'Perlu Bimbingan' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                            'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>
                                        {student.status === 'Mumtaz' ? <CheckCircle size={10} /> :
                                            student.status === 'Perlu Bimbingan' ? <AlertCircle size={10} /> :
                                                <CheckCircle size={10} />}
                                        {student.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-dark-card rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-400">Tidak ada data riwayat untuk kelas ini.</p>
                    </div>
                )}
            </div>

            {/* Student History Modal */}
            <StudentHistoryModal
                isOpen={!!selectedStudent}
                onClose={() => setSelectedStudent(null)}
                student={selectedStudent}
            />
        </div>
    );
};

export default RiwayatPage;
