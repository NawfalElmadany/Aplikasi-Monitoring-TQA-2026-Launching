import React from 'react';
import { X, Clock, CheckCircle2, MessageSquare, Trophy, AlertCircle, FileText } from 'lucide-react';

interface ActivityLogModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const activityGroups = [
        {
            date: 'Hari Ini',
            activities: [
                {
                    id: 1,
                    type: 'achievement',
                    user: 'Ahmad (Kelas 5A)',
                    action: 'baru saja menyelesaikan',
                    target: 'Juz 29',
                    time: '2 menit yang lalu',
                    icon: Trophy,
                    color: 'text-yellow-600',
                    bg: 'bg-yellow-100'
                },
                {
                    id: 2,
                    type: 'message',
                    user: 'Wali Murid Budi',
                    action: 'mengirim pesan',
                    target: '',
                    time: '15 menit yang lalu',
                    icon: MessageSquare,
                    color: 'text-blue-600',
                    bg: 'bg-blue-100'
                },
                {
                    id: 3,
                    type: 'setoran',
                    user: 'Siti Aminah (Kelas 6C)',
                    action: 'menyetorkan',
                    target: 'Surah An-Naba',
                    time: '32 menit yang lalu',
                    icon: CheckCircle2,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-100'
                },
                {
                    id: 4,
                    type: 'system',
                    user: 'Sistem',
                    action: 'Laporan Bulanan',
                    target: 'siap diunduh',
                    time: '1 jam yang lalu',
                    icon: FileText,
                    color: 'text-indigo-600',
                    bg: 'bg-indigo-100'
                }
            ]
        },
        {
            date: 'Kemarin',
            activities: [
                {
                    id: 5,
                    type: 'alert',
                    user: 'Fathan (Kelas 5C)',
                    action: 'tidak hadir',
                    target: '3 hari berturut-turut',
                    time: 'Kemarin, 14:00',
                    icon: AlertCircle,
                    color: 'text-red-600',
                    bg: 'bg-red-100'
                },
                {
                    id: 6,
                    type: 'setoran',
                    user: 'Rina (Kelas 6D)',
                    action: 'menyetorkan',
                    target: 'Surah Al-Mulk',
                    time: 'Kemarin, 10:30',
                    icon: CheckCircle2,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-100'
                }
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-dark-border flex items-center justify-between bg-white dark:bg-dark-card shrink-0">
                    <div className="flex items-center gap-2">
                        <Clock className="text-indigo-600" size={20} />
                        <h3 className="font-bold text-lg text-gray-800">Aktivitas Terkini</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:bg-dark-card-hover rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-6 flex-1 bg-gray-50">
                    <div className="space-y-8">
                        {activityGroups.map((group, idx) => (
                            <div key={idx}>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 ml-2">{group.date}</h4>
                                <div className="space-y-4">
                                    {group.activities.map((activity) => (
                                        <div key={activity.id} className="bg-white p-4 rounded-xl border border-gray-100 dark:border-dark-border shadow-sm flex gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.bg} ${activity.color}`}>
                                                <activity.icon size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-800 dark:text-white leading-snug">
                                                    <span className="font-bold">{activity.user}</span> {activity.action} <span className="font-bold text-indigo-600">{activity.target}</span>
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1 font-medium">{activity.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogModal;
