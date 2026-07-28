import { useState, useEffect } from 'react';

export interface ScheduleItem {
    kelas_id: string;
    waktu_mulai: string; // "HH:MM"
    waktu_selesai: string; // "HH:MM"
    mata_pelajaran?: string;
    kategori?: string;
}

export interface ActiveScheduleResult {
    activeClassId: string | null;
    previousClassId: string | null;
}

export const useActiveSchedule = (jadwalHariIni: ScheduleItem[]): ActiveScheduleResult => {
    const [result, setResult] = useState<ActiveScheduleResult>({
        activeClassId: null,
        previousClassId: null,
    });

    useEffect(() => {
        const checkSchedule = () => {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const timeToMinutes = (timeStr: string): number => {
                const [h, m] = timeStr.split(':').map(Number);
                return h * 60 + m;
            };

            const active = jadwalHariIni.find((schedule) => {
                const startMinutes = timeToMinutes(schedule.waktu_mulai);
                const endMinutes = timeToMinutes(schedule.waktu_selesai);
                return currentMinutes >= (startMinutes - 10) && currentMinutes <= endMinutes;
            });
            const activeClassId = active ? active.kelas_id : null;

            const pastSchedules = jadwalHariIni.filter((schedule) => {
                const endMinutes = timeToMinutes(schedule.waktu_selesai);
                return endMinutes < currentMinutes;
            });

            // Sort descending by endMinutes
            pastSchedules.sort((a, b) => {
                const endA = timeToMinutes(a.waktu_selesai);
                const endB = timeToMinutes(b.waktu_selesai);
                return endB - endA;
            });
            const previousClassId = pastSchedules.length > 0 ? pastSchedules[0].kelas_id : null;

            setResult({ activeClassId, previousClassId });
        };

        // Check immediately
        checkSchedule();

        // Check every minute
        const intervalId = setInterval(checkSchedule, 60000);

        return () => clearInterval(intervalId);
    }, [jadwalHariIni]);

    return result;
};
