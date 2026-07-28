import React from 'react';
import { CheckCircle2, Circle, TrendingUp } from 'lucide-react';
import { Student } from '../types';

interface HafalanTargetWidgetProps {
  students: Student[];
}

const HafalanTargetWidget: React.FC<HafalanTargetWidgetProps> = ({ students }) => {
  // Logic: 
  // Target is finishing Juz 30 and Juz 29.
  // - If currentJuz < 29 (e.g. 28, 27), they have likely finished 30 & 29. (Achieved)
  // - If currentJuz == 29, they finished 30, working on 29. (Closest)
  // - If currentJuz == 30, working on 30. (In Progress)

  const achievedCount = students.filter(s => (s.currentJuz || 30) < 29).length;
  const inProgressCount = students.length - achievedCount;

  const percentage = Math.round((achievedCount / students.length) * 100);

  // Get students closest to target (Currently on Juz 29)
  // Sort by totalProgress to simulate who is closest to finishing Juz 29
  const closestStudents = students
    .filter(s => s.currentJuz === 29)
    .sort((a, b) => b.totalProgress - a.totalProgress)
    .slice(0, 4);

  // SVG Chart Config
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-xl font-bold text-gray-800">Pencapaian Target Hafalan</h3>
        <p className="text-sm text-gray-500 mt-1">Target Utama: Juz 30 & Juz 29</p>
      </div>

      <div className="p-6 flex-1 flex flex-col items-center">

        {/* Donut Chart Section */}
        <div className="relative w-48 h-48 mb-6">
          {/* SVG Chart */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background Circle (In Progress - Orange) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="text-orange-100 stroke-current"
              strokeWidth="16"
              fill="transparent"
            />
            {/* Background Segment (In Progress - Visual) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="text-amber-400 stroke-current transition-all duration-1000 ease-out"
              strokeWidth="16"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset="0"
            />

            {/* Foreground Circle (Achieved - Green) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="text-emerald-500 stroke-current transition-all duration-1000 ease-out"
              strokeWidth="16"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-bold text-gray-800">{percentage}%</span>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mencapai Target</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 w-full mb-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-medium text-gray-600">Selesai ({achievedCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <span className="text-xs font-medium text-gray-600">Progres ({inProgressCount})</span>
          </div>
        </div>

        {/* Closest List */}
        <div className="w-full bg-gray-50/80 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-indigo-600" />
            <h4 className="text-sm font-bold text-gray-700">Paling Dekat dengan Target</h4>
          </div>

          <div className="space-y-3">
            {closestStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full border border-gray-200" />
                  <div>
                    <p className="text-xs font-bold text-gray-800 truncate max-w-[120px]">{student.name.split(' ')[0]} {student.name.split(' ')[1]?.charAt(0)}.</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 size={10} /> Juz 30
                      </span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className="flex items-center gap-1 text-amber-600 font-bold">
                        <Circle size={8} className="fill-amber-400 stroke-none" /> Juz 29 ({student.totalProgress}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HafalanTargetWidget;