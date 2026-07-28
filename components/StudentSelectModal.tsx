import React, { useState, useMemo } from 'react';
import { X, Search, ChevronRight } from 'lucide-react';
import { Student } from '../types';

interface StudentSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: Student[];
    onSelect: (student: Student) => void;
}

const StudentSelectModal: React.FC<StudentSelectModalProps> = ({ isOpen, onClose, students, onSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return students;
        const lowerQuery = searchQuery.toLowerCase();
        return students.filter(s =>
            s.name.toLowerCase().includes(lowerQuery) ||
            s.class.toLowerCase().includes(lowerQuery)
        );
    }, [students, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-dark-border flex items-center justify-between bg-white dark:bg-dark-card shrink-0">
                    <h3 className="font-bold text-lg text-gray-800">Pilih Siswa</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:bg-dark-card-hover rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 bg-gray-50 dark:bg-dark-card-hover border-b border-gray-100 dark:border-dark-border shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama atau kelas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-2 flex-1">
                    {filteredStudents.length > 0 ? (
                        <div className="space-y-1">
                            {filteredStudents.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => {
                                        onSelect(student);
                                        onClose();
                                        setSearchQuery(''); // Reset search
                                    }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-xl transition-colors group text-left"
                                >
                                    <img
                                        src={student.avatar}
                                        alt={student.name}
                                        className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-dark-border group-hover:border-indigo-300 transition-colors"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-800 dark:text-white truncate group-hover:text-indigo-700">{student.name}</p>
                                        <p className="text-xs text-gray-500">Kelas {student.class}</p>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-400" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <p>Tidak ada siswa ditemukan</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentSelectModal;
