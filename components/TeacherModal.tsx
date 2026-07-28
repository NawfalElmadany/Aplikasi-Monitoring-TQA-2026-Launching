import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, GraduationCap } from 'lucide-react';
import { Teacher } from '../types';

interface TeacherModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (teacher: Omit<Teacher, 'id'> | Teacher) => void;
    teacher?: Teacher | null;
}

const TeacherModal: React.FC<TeacherModalProps> = ({ isOpen, onClose, onSave, teacher }) => {
    const [formData, setFormData] = useState({
        name: '',
        role: 'Teacher',
        class: ''
    });

    useEffect(() => {
        if (teacher) {
            setFormData({
                name: teacher.name,
                role: teacher.role,
                class: teacher.class
            });
        } else {
            setFormData({
                name: '',
                role: 'Teacher',
                class: ''
            });
        }
    }, [teacher, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            ...(teacher ? { id: teacher.id } : {})
        } as Teacher);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121F18] border border-transparent dark:border-[#1A2E24] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#1A2E24]">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-[#E2EAE5]">
                        {teacher ? 'Edit Guru' : 'Tambah Guru Baru'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <User size={16} className="text-emerald-600 dark:text-emerald-400" />
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: Ustadz Abdullah"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Briefcase size={16} className="text-emerald-600 dark:text-emerald-400" />
                                Jabatan / Role
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 outline-none bg-white transition-all"
                            >
                                <option value="Teacher">Teacher</option>
                                <option value="Head Teacher">Head Teacher</option>
                                <option value="Assistant">Assistant</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <GraduationCap size={16} className="text-emerald-600 dark:text-emerald-400" />
                                Wali Kelas (Opsional)
                            </label>
                            <input
                                type="text"
                                value={formData.class}
                                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                placeholder="Contoh: 5C"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
                        >
                            {teacher ? 'Simpan Perubahan' : 'Tambah Guru'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeacherModal;
