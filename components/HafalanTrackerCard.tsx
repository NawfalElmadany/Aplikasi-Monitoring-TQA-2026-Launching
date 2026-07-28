import React, { useMemo } from 'react';
import { BookOpen, TrendingUp } from 'lucide-react';

interface SurahDef {
  id: number;
  name: string;
  juz: number;
  ayat: number;
}

const MANDATORY_SURAHS: SurahDef[] = [
  // --- JUZ 30 (Urutan Belajar: 114 Mundur ke 78) ---
  { "id": 114, "name": "An-Naas", "juz": 30, "ayat": 6 },
  { "id": 113, "name": "Al-Falaq", "juz": 30, "ayat": 5 },
  { "id": 112, "name": "Al-Ikhlas", "juz": 30, "ayat": 4 },
  { "id": 111, "name": "Al-Lahab", "juz": 30, "ayat": 5 },
  { "id": 110, "name": "An-Nasr", "juz": 30, "ayat": 3 },
  { "id": 109, "name": "Al-Kafirun", "juz": 30, "ayat": 6 },
  { "id": 108, "name": "Al-Kautsar", "juz": 30, "ayat": 3 },
  { "id": 107, "name": "Al-Ma'un", "juz": 30, "ayat": 7 },
  { "id": 106, "name": "Quraisy", "juz": 30, "ayat": 4 },
  { "id": 105, "name": "Al-Fil", "juz": 30, "ayat": 5 },
  { "id": 104, "name": "Al-Humazah", "juz": 30, "ayat": 9 },
  { "id": 103, "name": "Al-'Asr", "juz": 30, "ayat": 3 },
  { "id": 102, "name": "At-Takasur", "juz": 30, "ayat": 8 },
  { "id": 101, "name": "Al-Qari'ah", "juz": 30, "ayat": 11 },
  { "id": 100, "name": "Al-'Adiyat", "juz": 30, "ayat": 11 },
  { "id": 99, "name": "Az-Zalzalah", "juz": 30, "ayat": 8 },
  { "id": 98, "name": "Al-Bayyinah", "juz": 30, "ayat": 8 },
  { "id": 97, "name": "Al-Qadr", "juz": 30, "ayat": 5 },
  { "id": 96, "name": "Al-'Alaq", "juz": 30, "ayat": 19 },
  { "id": 95, "name": "At-Tin", "juz": 30, "ayat": 8 },
  { "id": 94, "name": "Al-Insyirah", "juz": 30, "ayat": 8 },
  { "id": 93, "name": "Ad-Duha", "juz": 30, "ayat": 11 },
  { "id": 92, "name": "Al-Lail", "juz": 30, "ayat": 21 },
  { "id": 91, "name": "Asy-Syams", "juz": 30, "ayat": 15 },
  { "id": 90, "name": "Al-Balad", "juz": 30, "ayat": 20 },
  { "id": 89, "name": "Al-Fajr", "juz": 30, "ayat": 30 },
  { "id": 88, "name": "Al-Ghasyiyah", "juz": 30, "ayat": 26 },
  { "id": 87, "name": "Al-A'la", "juz": 30, "ayat": 19 },
  { "id": 86, "name": "At-Tariq", "juz": 30, "ayat": 17 },
  { "id": 85, "name": "Al-Buruj", "juz": 30, "ayat": 22 },
  { "id": 84, "name": "Al-Insyiqaq", "juz": 30, "ayat": 25 },
  { "id": 83, "name": "Al-Mutaffifin", "juz": 30, "ayat": 36 },
  { "id": 82, "name": "Al-Infitar", "juz": 30, "ayat": 19 },
  { "id": 81, "name": "At-Takwir", "juz": 30, "ayat": 29 },
  { "id": 80, "name": "'Abasa", "juz": 30, "ayat": 42 },
  { "id": 79, "name": "An-Nazi'at", "juz": 30, "ayat": 46 },
  { "id": 78, "name": "An-Naba'", "juz": 30, "ayat": 40 },

  // --- JUZ 29 (Urutan Standar) ---
  { "id": 67, "name": "Al-Mulk", "juz": 29, "ayat": 30 },
  { "id": 68, "name": "Al-Qalam", "juz": 29, "ayat": 52 },
  { "id": 69, "name": "Al-Haqqah", "juz": 29, "ayat": 52 },
  { "id": 70, "name": "Al-Ma'arij", "juz": 29, "ayat": 44 },
  { "id": 71, "name": "Nuh", "juz": 29, "ayat": 28 },
  { "id": 72, "name": "Al-Jinn", "juz": 29, "ayat": 28 },
  { "id": 73, "name": "Al-Muzzammil", "juz": 29, "ayat": 20 },
  { "id": 74, "name": "Al-Muddassir", "juz": 29, "ayat": 56 },
  { "id": 75, "name": "Al-Qiyamah", "juz": 29, "ayat": 40 },
  { "id": 76, "name": "Al-Insan", "juz": 29, "ayat": 31 },
  { "id": 77, "name": "Al-Mursalat", "juz": 29, "ayat": 50 }
];

interface HafalanTrackerCardProps {
  completedSurahIds?: number[];
  // Fallback for demo: if no IDs provided, use currentSurahName to estimate progress
  currentSurahName?: string;
}

const HafalanTrackerCard: React.FC<HafalanTrackerCardProps> = ({
  completedSurahIds = [],
  currentSurahName
}) => {

  // Logic to Calculate Progress
  const progressState = useMemo(() => {
    // 1. Normalize Input: If we only have a name (from old data), simulate the IDs
    let currentIds = [...completedSurahIds];

    if (currentIds.length === 0 && currentSurahName) {
      // Find ID of current surah
      const current = MANDATORY_SURAHS.find(s => currentSurahName.includes(s.name));
      if (current) {
        // Logic to back-fill completed surahs based on the Phase rules

        // If current is in Juz 30 (Phase 1)
        if (current.juz === 30) {
          // Add all surahs from 114 down to (current.id + 1)
          MANDATORY_SURAHS.filter(s => s.juz === 30 && s.id > current.id)
            .forEach(s => currentIds.push(s.id));
        }
        // If current is in Juz 29 (Phase 2)
        else if (current.juz === 29) {
          // Add all Juz 30
          MANDATORY_SURAHS.filter(s => s.juz === 30).forEach(s => currentIds.push(s.id));
          // Add all Juz 29 BEFORE current (standard order: < current.id)
          MANDATORY_SURAHS.filter(s => s.juz === 29 && s.id < current.id).forEach(s => currentIds.push(s.id));
        }
      }
    }

    // 2. Phase 1: Check Juz 30 (Reverse Order 114 -> 78)
    const juz30Surahs = MANDATORY_SURAHS.filter(s => s.juz === 30).sort((a, b) => b.id - a.id);
    const missingJuz30 = juz30Surahs.find(s => !currentIds.includes(s.id));

    if (missingJuz30) {
      return {
        phase: 'Juz 30',
        mainDisplay: `Juz 30`,
        subDisplay: `Sedang menghafal: ${missingJuz30.name}`,
        percent: Math.round(((juz30Surahs.length - (juz30Surahs.indexOf(missingJuz30))) / juz30Surahs.length) * 100) / 2 // Just visual scale
      };
    }

    // 3. Phase 2: Check Juz 29 (Standard Order 67 -> 77)
    // Note: The logic in prompt says standard, but commonly 29 is also reversed or standard. 
    // Implementing Standard (67->77) as per common Tafsir order, or logic provided. 
    // Wait, prompt JSON shows 67-77. Standard reading order is 67, 68... 
    // Let's assume sequential 67 -> 77 for Phase 2.
    const juz29Surahs = MANDATORY_SURAHS.filter(s => s.juz === 29).sort((a, b) => a.id - b.id);
    const missingJuz29 = juz29Surahs.find(s => !currentIds.includes(s.id));

    if (missingJuz29) {
      return {
        phase: 'Juz 29',
        mainDisplay: `Juz 29`,
        subDisplay: `Sedang menghafal: ${missingJuz29.name}`,
        percent: 50 + Math.round(((juz29Surahs.indexOf(missingJuz29)) / juz29Surahs.length) * 50)
      };
    }

    // 4. Phase 3: Flexible (Both mandatory done)
    return {
      phase: 'Flexible',
      mainDisplay: 'Juz 29 & 30 Selesai',
      subDisplay: 'Lanjut ke Juz 28 atau Juz 1',
      percent: 100
    };

  }, [completedSurahIds, currentSurahName]);

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 shadow-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      {/* Decorative Background Circles */}
      <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div className="p-3 bg-white/20 backdrop-blur-md rounded-full shadow-inner">
          <BookOpen className="text-white" size={24} />
        </div>

        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold shadow-sm">
          <TrendingUp size={14} />
          <span>+2.5% vs Last Week</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-indigo-100 font-medium text-sm mb-1 tracking-wide">Hafalan Saya</h3>
        <h2 className="text-3xl font-bold mb-2 tracking-tight drop-shadow-sm">{progressState.mainDisplay}</h2>
        <p className="text-cyan-50 text-sm font-medium opacity-90">{progressState.subDisplay}</p>
      </div>

      {/* Progress Bar Visual (Optional but nice for Tracker) */}
      <div className="relative z-10 mt-6 h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/90 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          style={{ width: `${progressState.percent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default HafalanTrackerCard;
