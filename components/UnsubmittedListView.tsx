import React from 'react';
import { Clock } from 'lucide-react';
import { Student } from '../types';

interface UnsubmittedListViewProps {
    students: Student[];
}

const UnsubmittedListView: React.FC<UnsubmittedListViewProps> = ({ students }) => {
    const [selectedClass, setSelectedClass] = React.useState<string>('Semua');

    // Get unique classes
    const classes = ['Semua', ...Array.from(new Set(students.map(s => s.class || 'Lainnya'))).sort()];

    // Group students by class
    const groupedStudents = students.reduce((acc, student) => {
        const className = student.class || 'Lainnya';
        if (selectedClass === 'Semua' || selectedClass === className) {
            if (!acc[className]) {
                acc[className] = [];
            }
            acc[className].push(student);
        }
        return acc;
    }, {} as Record<string, Student[]>);

    // Sort classes
    const sortedClasses = Object.keys(groupedStudents).sort();

    return (
        <div className="space-y-6">
            {/* Filter Toolbar */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
                {classes.map((className) => (
                    <button
                        key={className}
                        onClick={() => setSelectedClass(className)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedClass === className
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {className}
                    </button>
                ))}
            </div>

            <div className="space-y-8">
                {sortedClasses.map((className) => (
                    <div key={className} className="space-y-3">
                        <div className="flex items-center gap-3">
                            <h4 className="text-lg font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                                Kelas {className}
                            </h4>
                            <span className="text-sm font-medium text-gray-500">
                                {groupedStudents[className].length} Siswa
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupedStudents[className].map((student) => (
                                <div
                                    key={student.id}
                                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                                >
                                    <img
                                        src={student.avatar}
                                        alt={student.name}
                                        className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                    />
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-800 text-sm truncate">{student.name}</p>
                                        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                                            <Clock size={10} />
                                            {student.lastUpdate}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {sortedClasses.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        Tidak ada siswa yang belum setoran di kelas ini.
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnsubmittedListView;
