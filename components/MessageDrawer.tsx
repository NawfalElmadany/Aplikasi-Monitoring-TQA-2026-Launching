import React, { useState, useEffect } from 'react';
import { X, Send, ChevronDown, MessageSquare } from 'lucide-react';
import { Student } from '../types';

interface MessageDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    students: Student[];
    onSendMessage: (studentId: string, category: string, message: string) => void;
}

const MessageDrawer: React.FC<MessageDrawerProps> = ({ isOpen, onClose, students, onSendMessage }) => {
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [messageCategory, setMessageCategory] = useState('Motivasi');
    const [messageText, setMessageText] = useState('');

    // Pre-populate with first student on open if none selected
    useEffect(() => {
        if (isOpen && students.length > 0 && !selectedStudentId) {
            setSelectedStudentId(students[0].id);
        }
    }, [isOpen, students, selectedStudentId]);

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    const handleSend = () => {
        if (!selectedStudentId) {
            alert('Mohon pilih siswa terlebih dahulu');
            return;
        }
        if (!messageText.trim()) {
            alert('Mohon isi pesan yang ingin dikirim');
            return;
        }
        onSendMessage(selectedStudentId, messageCategory, messageText);
        // Clear message input only (keep student selection for potential back-to-back messaging)
        setMessageText('');
        onClose();
    };

    return (
        <>
            {/* Overlay Background */}
            <div
                onClick={onClose}
                className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            />

            {/* Drawer Panel */}
            <div
                className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#111D16] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                } flex flex-col h-full overflow-hidden`}
            >
                {/* Header Drawer */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="text-emerald-500" size={24} />
                        <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                            Tulis Pesan Personal
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Isian (Isi Drawer) */}
                <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto scrollbar-hide">
                    {/* Pilih Siswa */}
                    <div>
                        <label className="block text-xs font-bold text-[#8BA398] mb-1.5 uppercase tracking-wider">
                            Pilih Siswa
                        </label>
                        <div className="relative">
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="w-full bg-[#15231A] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#E2EAE5] focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer font-semibold appearance-none"
                            >
                                <option value="" disabled className="bg-[#111D16] text-[#8BA398]">Pilih penerima...</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id} className="bg-[#111D16] text-[#E2EAE5]">
                                        {s.name} (Kelas {s.class})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>
                        
                        {/* Profil Kecil Siswa Terpilih */}
                        {selectedStudent && (
                            <div className="mt-3 flex items-center gap-3 p-3 bg-[#15231A] border border-white/5 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                                <img
                                    src={selectedStudent.avatar}
                                    alt={selectedStudent.name}
                                    className="w-8 h-8 rounded-full bg-emerald-950/20 border border-white/10 shrink-0 object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                    <h5 className="text-xs font-bold text-white leading-none truncate">{selectedStudent.name}</h5>
                                    <p className="text-[10px] text-[#8BA398] mt-1 truncate">
                                        Kelas {selectedStudent.class} • Juz {selectedStudent.currentJuz} ({selectedStudent.currentSurah})
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Kategori Pesan */}
                    <div>
                        <label className="block text-xs font-bold text-[#8BA398] mb-1.5 uppercase tracking-wider">
                            Kategori Pesan
                        </label>
                        <div className="relative">
                            <select
                                value={messageCategory}
                                onChange={(e) => setMessageCategory(e.target.value)}
                                className="w-full bg-[#15231A] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#E2EAE5] focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer font-semibold appearance-none"
                            >
                                <option value="Motivasi" className="bg-[#111D16]">Motivasi</option>
                                <option value="Nasihat" className="bg-[#111D16]">Nasihat</option>
                                <option value="Peringatan" className="bg-[#111D16]">Peringatan</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>
                    </div>

                    {/* Tulis Pesan */}
                    <div className="flex-1 flex flex-col min-h-[160px]">
                        <label className="block text-xs font-bold text-[#8BA398] mb-1.5 uppercase tracking-wider">
                            Tulis Pesan
                        </label>
                        <textarea
                            rows={5}
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            className="w-full flex-1 bg-[#15231A] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#E2EAE5] focus:ring-1 focus:ring-emerald-500 outline-none resize-none leading-relaxed"
                            placeholder="Ketik kalimat penyemangat, nasehat, atau peringatan disini..."
                        />
                    </div>
                </div>

                {/* Tombol Aksi (Sticky Footer) */}
                <div className="p-6 border-t border-white/10 bg-[#111D16] shrink-0">
                    <button
                        onClick={handleSend}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-emerald-950/20"
                    >
                        <Send size={16} />
                        <span>Kirim Pesan</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 mt-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        Batal
                    </button>
                </div>
            </div>
        </>
    );
};

export default MessageDrawer;
