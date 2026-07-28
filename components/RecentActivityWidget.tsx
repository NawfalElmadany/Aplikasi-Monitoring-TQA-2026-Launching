import React, { useState } from 'react';
import { Clock, CheckCircle2, MessageSquare, UserPlus, Trophy } from 'lucide-react';
import ActivityLogModal from './ActivityLogModal';

const RecentActivityWidget = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const activities = [
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
            icon: Clock,
            color: 'text-indigo-600',
            bg: 'bg-indigo-100'
        }
    ];

    return (
        <>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-border h-full">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Aktivitas Terkini</h3>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
                    >
                        Lihat Semua
                    </button>
                </div>

                <div className="space-y-6 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-100"></div>

                    {activities.map((activity) => (
                        <div key={activity.id} className="relative flex gap-4 group">
                            {/* Icon */}
                            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${activity.bg} ${activity.color}`}>
                                <activity.icon size={18} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-1">
                                <p className="text-sm text-gray-800 dark:text-white leading-snug">
                                    <span className="font-bold">{activity.user}</span> {activity.action} <span className="font-bold text-indigo-600">{activity.target}</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1 font-medium">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ActivityLogModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};

export default RecentActivityWidget;
