import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { Student } from '../types';
import StudentList from './StudentList';

interface ScoreDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    students?: Student[]; // Made optional
    title?: string;
    subtitle?: string;
    children?: React.ReactNode;
}

const ScoreDetailModal: React.FC<ScoreDetailModalProps> = ({
    isOpen,
    onClose,
    students = [], // Default value
    title = "Detail Nilai Siswa",
    subtitle = "Daftar lengkap capaian dan nilai siswa",
    children
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-emerald-600 p-5 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/50 rounded-lg backdrop-blur-sm">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl leading-tight">{title}</h3>
                            <p className="text-xs text-emerald-100">{subtitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:bg-emerald-700 p-2 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {children ? children : (
                        <StudentList
                            students={students}
                            onInputNilai={() => { }} // No-op since readOnly is true
                            readOnly={true}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScoreDetailModal;
