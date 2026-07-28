import React from 'react';
import { X, Calendar, CheckCircle2, Clock } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCHEDULE_DATA = [
  {
    day: 'Senin',
    classes: [
      { time: '07.30 - 08.40', class: 'Kelas 5B' },
      { time: '08.40 - 09.50', class: 'Kelas 5C' },
      { time: '10.05 - 11.15', class: 'Kelas 5D' },
      { time: '13.10 - 13.45', class: 'Kelas 6C' },
      { time: '13.45 - 14.20', class: 'Kelas 6D' },
    ]
  },
  {
    day: 'Selasa',
    classes: [
      { time: '07.30 - 08.40', class: 'Kelas 6C' },
      { time: '08.40 - 09.50', class: 'Kelas 6D' },
      { time: '10.05 - 11.15', class: 'Kelas 5B' },
      { time: '13.10 - 13.45', class: 'Kelas 5C' },
      { time: '13.45 - 14.20', class: 'Kelas 5D' },
    ]
  },
  {
    day: 'Rabu',
    classes: [
      { time: '07.30 - 08.40', class: 'Kelas 5C' },
      { time: '08.40 - 09.50', class: 'Kelas 5D' },
      { time: '10.05 - 11.15', class: 'Kelas 6C' },
      { time: '13.10 - 13.45', class: 'Kelas 6D' },
      { time: '13.45 - 14.20', class: 'Kelas 5B' },
    ]
  },
  {
    day: 'Kamis',
    classes: [
      { time: '07.30 - 08.40', class: 'Kelas 5D' },
      { time: '08.40 - 09.50', class: 'Kelas 5B' },
      { time: '10.05 - 11.15', class: 'Kelas 5C' },
      { time: '13.10 - 13.45', class: 'Kelas 6C' },
      { time: '13.45 - 14.20', class: 'Kelas 6D' },
    ]
  },
];

// Color configuration for each day to make it vibrant
const DAY_THEMES: Record<string, { header: string; bg: string; badge: string; border: string; text: string }> = {
  'Senin': {
    header: 'bg-gradient-to-r from-blue-500 to-blue-600',
    bg: 'bg-blue-50/50',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    border: 'border-blue-200',
    text: 'text-blue-900'
  },
  'Selasa': {
    header: 'bg-gradient-to-r from-violet-500 to-purple-600',
    bg: 'bg-purple-50/50',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    border: 'border-purple-200',
    text: 'text-purple-900'
  },
  'Rabu': {
    header: 'bg-gradient-to-r from-pink-500 to-rose-600',
    bg: 'bg-pink-50/50',
    badge: 'bg-pink-100 text-pink-700 border-pink-200',
    border: 'border-pink-200',
    text: 'text-pink-900'
  },
  'Kamis': {
    header: 'bg-gradient-to-r from-amber-400 to-orange-500',
    bg: 'bg-orange-50/50',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    border: 'border-orange-200',
    text: 'text-orange-900'
  }
};

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const currentDay = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">

        {/* Main Header */}
        <div className="bg-white p-6 flex justify-between items-center shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm transform -rotate-3">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl text-gray-800 leading-none">Jadwal Mengajar</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">Tahun Ajaran 2024/2025</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SCHEDULE_DATA.map((schedule) => {
              const isToday = schedule.day === currentDay;
              const theme = DAY_THEMES[schedule.day] || DAY_THEMES['Senin'];

              return (
                <div
                  key={schedule.day}
                  className={`
                    rounded-2xl overflow-hidden transition-all duration-300 flex flex-col
                    ${isToday
                      ? `ring-4 ring-offset-2 ring-emerald-400 shadow-xl transform scale-[1.01] z-10`
                      : 'shadow-md hover:shadow-lg hover:-translate-y-1'
                    }
                  `}
                >
                  {/* Colored Header */}
                  <div className={`${theme.header} p-4 flex justify-between items-center text-white`}>
                    <h4 className="font-bold text-xl tracking-wide">
                      {schedule.day}
                    </h4>
                    {isToday && (
                      <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-white/10">
                        <CheckCircle2 size={12} className="text-white" />
                        HARI INI
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className={`flex-1 bg-white divide-y divide-gray-50 border-x border-b ${isToday ? 'border-emerald-100' : 'border-gray-100'} rounded-b-2xl`}>
                    {schedule.classes.map((item, idx) => (
                      <div key={idx} className="p-4 flex items-center gap-6 hover:bg-gray-50 transition-colors group">

                        {/* Time Badge - Fixed Width for Perfect Alignment */}
                        <div className={`
                          w-[160px] py-2 rounded-xl text-sm font-bold tracking-wide border whitespace-nowrap text-center flex items-center justify-center gap-2 flex-shrink-0
                          ${theme.badge}
                        `}>
                          <Clock size={14} className="opacity-70" />
                          {item.time}
                        </div>

                        {/* Class Name */}
                        <div className={`
                           text-lg font-bold flex items-center gap-3
                           ${theme.text}
                         `}>
                          <span className={`w-2.5 h-2.5 rounded-full ${theme.header.replace('bg-gradient-to-r', 'bg')}`}></span>
                          {item.class}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white text-center text-xs text-gray-400 font-medium shrink-0">
          * Jadwal dapat berubah sewaktu-waktu mengikuti agenda sekolah
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;