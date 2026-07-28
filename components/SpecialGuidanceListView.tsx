import React, { useState } from 'react';
import { Student } from '../types';
import { FileText, Clock, AlertCircle } from 'lucide-react';

interface SpecialGuidanceListViewProps {
    students: Student[];
}

const SpecialGuidanceListView: React.FC<SpecialGuidanceListViewProps> = ({ students }) => {
    const [selectedClass, setSelectedClass] = useState<string>('Semua');

    // Get unique classes from students
    const classes = ['Semua', ...Array.from(new Set(students.map(s => s.class))).sort()];

    const filteredStudents = selectedClass === 'Semua'
        ? students
        : students.filter(s => s.class === selectedClass);

    return (
        <div className="space-y-6">
            {/* Class Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {classes.map((cls) => (
                    <button
                        key={cls}
                        onClick={() => setSelectedClass(cls)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${selectedClass === cls
                            ? 'bg-gray-800 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {cls}
                    </button>
                ))}
            </div>

            {/* Student List */}
            <div className="space-y-1">
                {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                        <div
                            key={student.id}
                            className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                            <img
                                src={student.avatar}
                                alt={student.name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-gray-800 text-sm">{student.name}</h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                        {student.class}
                                    </span>
                                </div>

                                <div className="flex items-start gap-2 mt-1">
                                    <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {student.notes}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400 font-medium">
                                    <Clock size={10} />
                                    <span>Updated: {student.lastUpdate}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText className="text-gray-300" size={24} />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Tidak ada siswa di kelas ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpecialGuidanceListView;
