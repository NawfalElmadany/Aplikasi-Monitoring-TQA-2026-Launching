import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Video, MoreHorizontal, ChevronRight, ChevronDown, User as UserIcon, X, UserX, BookOpen, Bookmark, XCircle, Calendar, Award, Star, Book, Loader2, Bell } from 'lucide-react';
import { Note, User, Student } from '../types';
import Header from './Header';
import FloatingHeaderCard from './FloatingHeaderCard';
import { supabase } from '../lib/supabase';
import { useActiveSchedule } from '../hooks/useActiveSchedule';
import { loadStudentSetoranLogs, loadStudentAttendanceLogs } from '../services/appData';

interface DashboardModernProps {
    user: User;
    students: Student[];
    onNavigate: (page: string) => void;
    latestNote: Note | null;
    onMenuClick: () => void;
    notifications?: Student[];
    onDismissNotification?: (studentId: string) => void;
    onSearchClick?: () => void;
    unreadNotesCount?: number;
    onResetData?: () => void;
}

const DashboardModern: React.FC<DashboardModernProps> = ({ 
    user, 
    students, 
    onNavigate, 
    latestNote,
    onMenuClick,
    notifications = [],
    onDismissNotification,
    onSearchClick,
    unreadNotesCount = 0,
    onResetData
}) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isStudent = user.role === 'student' || user.role === 'siswa';

    // Student specific states
    const [logs, setLogs] = useState<any[]>([]);
    const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
    const [loadingStudentData, setLoadingStudentData] = useState(isStudent);

    // Find current student record
    const currentStudent = useMemo(() => {
        return students.find(s => 
            (user.studentId && s.id === user.studentId) || 
            s.name.toUpperCase() === user.name.toUpperCase()
        );
    }, [students, user]);

    useEffect(() => {
        if (!isStudent || !currentStudent) return;

        let isMounted = true;
        const fetchStudentData = async () => {
            setLoadingStudentData(true);
            try {
                const [setoranData, attData] = await Promise.all([
                    loadStudentSetoranLogs(currentStudent.id).catch(() => []),
                    loadStudentAttendanceLogs(currentStudent.id).catch(() => [])
                ]);

                if (isMounted) {
                    setLogs(setoranData);
                    setAttendanceLogs(attData);
                }
            } catch (err) {
                console.error("Failed to load student dashboard data:", err);
            } finally {
                if (isMounted) setLoadingStudentData(false);
            }
        };

        void fetchStudentData();
        return () => {
            isMounted = false;
        };
    }, [isStudent, currentStudent]);

    // Student stats
    const studentStats = useMemo(() => {
        if (!currentStudent) return null;

        const totalSetoran = logs.length;
        const scores = logs.filter(l => typeof l.score === 'number').map(l => l.score);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : (currentStudent.lastScore || 0);

        const totalAtt = attendanceLogs.length;
        const presentAtt = attendanceLogs.filter(l => l.status === 'present').length;
        const attRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

        return {
            totalSetoran,
            avgScore,
            attRate
        };
    }, [currentStudent, logs, attendanceLogs]);

    // Active Schedule Engine
    // 1. Define complete teaching schedule
    // Active Schedule Engine
    // 1. Define complete teaching schedule
    const jadwalMengajar = useMemo(() => ({
        'Senin': [
            { label: 'JP 1,2', className: 'Kelas 5C', time: 'TQA / 07:30 - 08:40', start: '07:30', end: '08:40' },
            { label: 'JP 3,4', className: 'Kelas 6D', time: 'TQA / 08:40 - 09:50', start: '08:40', end: '09:50' },
            { label: 'JP 5,6', className: 'Kelas 6C', time: 'TQA / 10:05 - 11:15', start: '10:05', end: '11:15' },
            { label: 'JP 7,8', className: 'Kelas 5D', time: 'TQA / 11:15 - 12:25', start: '11:15', end: '12:25' },
            { label: 'JP 9', className: 'Kelas 5B', time: 'TQA / 13:10 - 13:45', start: '13:10', end: '13:45' }
        ],
        'Selasa': [
            { label: 'JP 1,2', className: 'Kelas 6C', time: 'TQA / 07:30 - 08:40', start: '07:30', end: '08:40' },
            { label: 'JP 3,4', className: 'Kelas 5B', time: 'TQA / 08:40 - 09:50', start: '08:40', end: '09:50' },
            { label: 'JP 5,6', className: 'Kelas 5C', time: 'TQA / 10:05 - 11:15', start: '10:05', end: '11:15' },
            { label: 'JP 9', className: 'Kelas 6D', time: 'TQA / 13:10 - 13:45', start: '13:10', end: '13:45' },
            { label: 'JP 10,11', className: 'Kelas 5D', time: 'TQA / 13:45 - 14:55', start: '13:45', end: '14:55' }
        ],
        'Rabu': [
            { label: 'JP 1,2', className: 'Kelas 5B', time: 'TQA / 07:30 - 08:40', start: '07:30', end: '08:40' },
            { label: 'JP 5,6', className: 'Kelas 5C', time: 'TQA / 10:05 - 11:15', start: '10:05', end: '11:15' },
            { label: 'JP 7,8', className: 'Kelas 6D', time: 'TQA / 11:15 - 12:25', start: '11:15', end: '12:25' },
            { label: 'JP 9', className: 'Kelas 6C', time: 'TQA / 13:10 - 13:45', start: '13:10', end: '13:45' },
            { label: 'JP 10,11', className: 'Kelas 5D', time: 'TQA / 13:45 - 14:55', start: '13:45', end: '14:55' }
        ],
        'Kamis': [
            { label: 'JP 3,4', className: 'Kelas 5B', time: 'TQA / 08:40 - 09:50', start: '08:40', end: '09:50' },
            { label: 'JP 5,6', className: 'Kelas 6C', time: 'TQA / 10:05 - 11:15', start: '10:05', end: '11:15' },
            { label: 'JP 7,8', className: 'Kelas 6D', time: 'TQA / 11:15 - 12:25', start: '11:15', end: '12:25' },
            { label: 'JP 9', className: 'Kelas 5C', time: 'TQA / 13:10 - 13:45', start: '13:10', end: '13:45' },
            { label: 'JP 11', className: 'Kelas 5D', time: 'TQA / 14:20 - 14:55', start: '14:20', end: '14:55' }
        ],
        'Jumat': []
    }), []);

    // 2. Active Day detection
    const currentDayOfWeek = useMemo(() => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dayName = days[new Date().getDay()];
        return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].includes(dayName) ? dayName : 'Senin';
    }, []);

    const [hariAktif, setHariAktif] = useState<string | null>(currentDayOfWeek);

    // Fetch and track active classical murojaah materials for each class
    const [classMaterials, setClassMaterials] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchClassMaterials = async () => {
            let materialsMap: Record<string, string> = {
                '5B': "Surah An-Naba (1-40)",
                '5C': "Surah An-Nazi'at (1-46)",
                '5D': "Surah 'Abasa (1-42)",
                '6C': "Surah At-Takwir (1-29)",
                '6D': "Surah Al-Infitar (1-19)"
            };

            try {
                const localLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
                localLogs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                localLogs.forEach((log: any) => {
                    if (log.class && log.currentSurah && !materialsMap[log.class]) {
                        materialsMap[log.class] = log.currentSurah;
                    }
                });
            } catch (e) {
                console.error(e);
            }

            if (supabase) {
                try {
                    const { data, error } = await supabase
                        .from('murojaah_entries')
                        .select('class_name, surah')
                        .eq('type', 'classical')
                        .order('entry_date', { ascending: false });
                    
                    if (!error && data) {
                        data.forEach((row: any) => {
                            const className = row.class_name;
                            if (className && !materialsMap[className]) {
                                materialsMap[className] = row.surah.startsWith('Surah ') ? row.surah : `Surah ${row.surah}`;
                            }
                        });
                    }
                } catch (e) {
                    console.error('Failed to query murojaah materials:', e);
                }
            }

            setClassMaterials(materialsMap);
        };

        void fetchClassMaterials();
    }, [supabase]);

    const getMaterialForClass = (className: string) => {
        const cleanName = className.replace('Kelas ', '');
        if (cleanName === '6D') {
            try {
                const localGharib = JSON.parse(localStorage.getItem('tqa_gharib_entries') || '[]');
                const entry = localGharib.find((e: any) => e.className === cleanName || e.class_name === cleanName);
                if (entry) {
                    const page = entry.nomor_halaman || entry.materi_halaman || '';
                    const mat = entry.nama_materi || entry.material || '';
                    return page ? `Gharib Hal. ${page} - ${mat}` : mat || 'Materi Gharib';
                }
            } catch (e) {
                console.error(e);
            }
            return 'Gharib Hal. 21-28';
        }
        return classMaterials[cleanName] || 'Surah Al-Mulk (1-10)';
    };

    // 3. Active Schedule Engine
    const jadwalHariIni = useMemo(() => {
        const targetDay = currentDayOfWeek as keyof typeof jadwalMengajar;
        const currentMengajar = jadwalMengajar[targetDay] || jadwalMengajar['Senin'];
        return currentMengajar.map(item => ({
            kelas_id: item.className.replace('Kelas ', ''),
            waktu_mulai: item.start,
            waktu_selesai: item.end,
            mata_pelajaran: item.className === 'Kelas 6D' ? 'Gharib' : 'Tahfidz',
            kategori: item.className === 'Kelas 6D' ? 'Gharib' : undefined
        }));
    }, [currentDayOfWeek, jadwalMengajar]);

    const { activeClassId, previousClassId } = useActiveSchedule(jadwalHariIni);
    const targetClassId = activeClassId ? activeClassId : previousClassId;
    const isPastClass = !activeClassId && !!previousClassId;

    // Dynamic teaching schedule banner text based on time and day
    const bannerText = useMemo(() => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const actualDay = days[new Date().getDay()];
        
        // If it's Saturday or Sunday (not a scheduled teaching day)
        if (!['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].includes(actualDay)) {
            return `Hari ini (${actualDay}) tidak ada jadwal mengajar resmi. Selamat beristirahat dan tetap semangat muraja'ah! :)`;
        }

        const currentMengajar = jadwalMengajar[actualDay as keyof typeof jadwalMengajar] || [];
        if (currentMengajar.length === 0) {
            return "Hari ini tidak ada jadwal mengajar resmi. Selamat beristirahat! :)";
        }

        const timeToMinutes = (timeStr: string): number => {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        };

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // 1. If currently teaching an active class
        if (activeClassId) {
            const activeItem = currentMengajar.find(item => item.className.replace('Kelas ', '') === activeClassId);
            if (activeItem) {
                const timeOnly = activeItem.time.split(' / ')[1] || activeItem.time;
                return `Saat ini kamu sedang jadwal mengajar di ${activeItem.className} (${timeOnly}). Semangat membimbing para santri! :)`;
            }
        }

        // 2. If all classes for the day have finished
        const lastClass = currentMengajar[currentMengajar.length - 1];
        const lastClassEndMinutes = lastClass ? timeToMinutes(lastClass.end) : 0;
        if (currentMinutes > lastClassEndMinutes) {
            return `Alhamdulillah, seluruh jadwal mengajar hari ini (${actualDay}) telah selesai. Terima kasih atas dedikasi Anda hari ini! :)`;
        }

        // 3. If classes haven't started yet today
        const firstClass = currentMengajar[0];
        const firstClassStartMinutes = firstClass ? timeToMinutes(firstClass.start) : 0;
        if (currentMinutes < firstClassStartMinutes) {
            return `Hari ini kamu ada jadwal mengajar di ${firstClass.className} untuk jam pertama pukul ${firstClass.start}. Jangan sampai telat ya! Bawa perlengkapan mengajar. Semangat! :)`;
        }

        // 4. Upcoming classes (in transition/breaks)
        const upcomingClass = currentMengajar.find(item => timeToMinutes(item.start) > currentMinutes);
        if (upcomingClass) {
            return `Setelah ini kamu ada jadwal mengajar berikutnya di ${upcomingClass.className} pukul ${upcomingClass.start}. Jangan lupa bersiap-siap ya! Semangat! :)`;
        }

        return "Hari ini kamu memiliki jadwal mengajar. Bersiaplah untuk sesi kelas berikutnya. Semangat! :)";
    }, [activeClassId, jadwalMengajar]);

    const [lastMurojaah, setLastMurojaah] = useState<{ class: string; surah: string } | null>(null);

    // Gharib Daily Highlight State
    const [jadwalGharibHariIni, setJadwalGharibHariIni] = useState<any | null>(null);
    const [dataGharibTerakhir, setDataGharibTerakhir] = useState<any | null>(null);

    // Scan daily schedule for Gharib on mount
    useEffect(() => {
        const sesiGharib = jadwalHariIni.find(j => j.mata_pelajaran === 'Gharib' || j.kategori === 'Gharib');
        if (sesiGharib) {
            setJadwalGharibHariIni(sesiGharib);
        } else {
            setJadwalGharibHariIni(null);
        }
    }, [jadwalHariIni]);

    // Fetch Murojaah from Supabase or localStorage fallback
    useEffect(() => {
        if (!targetClassId) {
            setLastMurojaah(null);
            return;
        }

        const fetchData = async () => {
            if (supabase) {
                // Fetch classical murojaah from murojaah_entries table
                try {
                    const { data, error } = await supabase
                        .from('murojaah_entries')
                        .select('*')
                        .eq('class_name', targetClassId)
                        .eq('type', 'classical')
                        .order('entry_date', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (!error && data) {
                        setLastMurojaah({
                            class: data.class_name,
                            surah: data.surah.startsWith('Surah ') ? data.surah : `Surah ${data.surah}`
                        });
                        return;
                    }
                } catch (e) {
                    console.error('Failed to query murojaah_entries:', e);
                }
            }

            // Fallback to localStorage mock data or local logs if supabase is offline/empty
            setLastMurojaah(prev => {
                if (prev) return prev;
                try {
                    const deletedIds = JSON.parse(localStorage.getItem('tqa_deleted_mock_murojaah_ids') || '[]');
                    const staticBase = [
                        { id: "mock-j1", date: "30 Juni 2026", class: "5B", material: "Surah An-Naba (Ayat 1 - 40)" },
                        { id: "mock-j2", date: "30 Juni 2026", class: "5C", material: "Surah An-Nazi'at (Ayat 1 - 46)" },
                        { id: "mock-j3", date: "29 Juni 2026", class: "5D", material: "Surah 'Abasa (Ayat 1 - 42)" },
                        { id: "mock-j4", date: "29 Juni 2026", class: "6C", material: "Surah At-Takwir (Ayat 1 - 29)" },
                        { id: "mock-j5", date: "28 Juni 2026", class: "6D", material: "Surah Al-Infitar (Ayat 1 - 19)" },
                    ].filter(item => item.class === targetClassId && !deletedIds.includes(item.id));

                    if (staticBase.length > 0) {
                        return {
                            class: staticBase[0].class,
                            surah: staticBase[0].material
                        };
                    }
                } catch (e) {
                    console.error(e);
                }
                return null;
            });
        };

        void fetchData();
    }, [targetClassId]);

    // Fetch Gharib dynamic daily highlight
    useEffect(() => {
        if (!jadwalGharibHariIni) {
            setDataGharibTerakhir(null);
            return;
        }

        const kelasId = jadwalGharibHariIni.kelas_id;

        const fetchGharib = async () => {
            let dbData = null;

            if (supabase) {
                try {
                    const { data, error } = await supabase
                        .from('jurnal_gharib')
                        .select('*')
                        .eq('kelas', kelasId)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (!error && data) {
                        dbData = data;
                    }
                } catch (e) {
                    console.error('Failed to query jurnal_gharib from Supabase:', e);
                }
            }

            // Fallback to local storage logs
            if (!dbData) {
                try {
                    const logs = JSON.parse(localStorage.getItem('tqa_gharib_entries') || '[]');
                    const classLogs = logs.filter((l: any) => (l.className === kelasId || l.class_name === kelasId));
                    const lastGharibLog = classLogs[0]; // Assuming pre-sorted desc
                    if (lastGharibLog) {
                        dbData = lastGharibLog;
                    }
                } catch (e) {
                    console.error(e);
                }
            }

            setDataGharibTerakhir(dbData);
        };

        void fetchGharib();
    }, [jadwalGharibHariIni]);

    useEffect(() => {
        const mainContainer = document.querySelector('main');
        const handleScroll = () => {
            if (mainContainer) {
                setIsScrolled(mainContainer.scrollTop > 10);
            }
        };

        if (mainContainer) {
            mainContainer.addEventListener('scroll', handleScroll);
            handleScroll();
        }

        return () => {
            if (mainContainer) {
                mainContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    const metrics = useMemo(() => {
        // 1. Bimbingan Khusus
        const bimbinganCount = students.filter(s => s.requiresAttention).length;
        
        // 2. Murojaah Terakhir
        let murojaahClass = "-";
        let murojaahSurah = "Belum ada murojaah";
        try {
            const logs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
            const lastHafalan = logs
                .filter((l: any) => l.type === 'Hafalan')
                .sort((a: any, b: any) => b.date.localeCompare(a.date))[0];
            if (lastHafalan) {
                murojaahClass = `Kelas ${lastHafalan.class}`;
                murojaahSurah = lastHafalan.currentSurah;
            }
        } catch (e) {
            console.error(e);
        }

        // 3. Gharib Terakhir
        let gharibClass = "-";
        let gharibMaterial = "Belum ada materi";
        try {
            const gharibEntries = JSON.parse(localStorage.getItem('tqa_gharib_entries') || '[]');
            const lastGharib = gharibEntries[0];
            if (lastGharib) {
                gharibClass = `Kelas ${lastGharib.className || lastGharib.class_name}`;
                gharibMaterial = lastGharib.material;
            }
        } catch (e) {
            console.error(e);
        }

        // 4. Belum Setor Kemarin (H-1)
        let belumSetorCount = students.length;
        try {
            const logs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayDateString = yesterday.toLocaleDateString('en-CA'); // "YYYY-MM-DD" local time

            const yesterdaySetoranStudentIds = new Set(
                logs
                    .filter((l: any) => {
                        if (!l.date) return false;
                        const localDateStr = new Date(l.date).toLocaleDateString('en-CA');
                        return localDateStr === yesterdayDateString;
                    })
                    .map((l: any) => l.studentId)
            );
            
            belumSetorCount = Math.max(0, students.length - yesterdaySetoranStudentIds.size);
        } catch (e) {
            console.error(e);
        }

        return {
            bimbingan: `${bimbinganCount} Siswa`,
            murojaahClass,
            murojaahSurah,
            gharibClass,
            gharibMaterial,
            belumSetor: belumSetorCount === 0 ? "Semua Sudah Setor" : `${belumSetorCount} Siswa`
        };
    }, [students]);

    // Checklist state for "Pengingat Hari Ini"
    const [checklist, setChecklist] = useState<any[]>(() => {
        const saved = localStorage.getItem('tqa_dashboard_checklist');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error(e);
            }
        }
        return [
            { id: 1, text: 'Jangan lupa input setoran harian', subtitle: 'Minimal sebelum jam 20.00', checked: true },
            { id: 2, text: 'Pantau siswa yang belum setor H-1', subtitle: '0 siswa perlu follow-up', checked: true, isBelumSetorLink: true },
            { id: 3, text: 'Cek catatan murojaah kelas 5B', subtitle: 'Surah Al-Qadr s.d. Az-Zalzalah', checked: false }
        ];
    });

    // Update the checklist subtitle dynamically with latest metrics
    useEffect(() => {
        setChecklist(prev => prev.map(item => {
            if (item.isBelumSetorLink) {
                const countText = metrics.belumSetor === "Semua Sudah Setor" ? "0" : metrics.belumSetor.replace(' Siswa', '');
                return { ...item, subtitle: `${countText} siswa perlu follow-up` };
            }
            return item;
        }));
    }, [metrics.belumSetor]);

    const handleToggleChecklist = (id: number) => {
        const nextList = checklist.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
        setChecklist(nextList);
        localStorage.setItem('tqa_dashboard_checklist', JSON.stringify(nextList));
    };



    const getGharibDetailText = () => {
        if (!dataGharibTerakhir) return "Belum ada catatan hari ini";
        
        if (dataGharibTerakhir.nomor_halaman) {
            const page = dataGharibTerakhir.nomor_halaman;
            const mat = dataGharibTerakhir.nama_materi || dataGharibTerakhir.keterangan || dataGharibTerakhir.material || "";
            return `Hal ${page} - ${mat}`;
        }
        
        const mat = dataGharibTerakhir.material || dataGharibTerakhir.materi_halaman || "";
        const note = dataGharibTerakhir.notes || dataGharibTerakhir.catatan || "";
        
        return note ? `${mat} (${note})` : mat || "Materi belum dicatat";
    };

    if (isStudent) {
        return (
            <div className="space-y-6 flex-1 flex flex-col min-h-0">
                {/* Header Section (Floating Card Style on Desktop, Fixed Top Bar on Mobile) */}
                <div className="fixed top-0 left-0 right-0 w-full z-50 bg-white/90 dark:bg-[#09120E]/90 backdrop-blur-md px-4 py-4 border-b border-slate-100 dark:border-[#1A2E24] md:hidden">
                    <Header
                        user={user}
                        onMenuClick={onMenuClick}
                        notifications={notifications}
                        onDismissNotification={onDismissNotification}
                        onSearchClick={undefined} // No search for student
                        flat={true}
                        title="Dashboard Siswa"
                        subtitle="Pantau perkembangan hafalan dan target belajar pribadi Anda."
                        showGreeting={true}
                        unreadNotesCount={unreadNotesCount}
                    />
                </div>
                
                <div className="hidden md:block">
                    <FloatingHeaderCard className="w-full lg:max-w-none lg:mx-0">
                        <Header
                            user={user}
                            onMenuClick={onMenuClick}
                            notifications={notifications}
                            onDismissNotification={onDismissNotification}
                            onSearchClick={undefined} // No search for student
                            flat={true}
                            title="Dashboard Siswa"
                            subtitle="Pantau perkembangan hafalan dan target belajar pribadi Anda."
                            showGreeting={true}
                            unreadNotesCount={unreadNotesCount}
                        />
                    </FloatingHeaderCard>
                </div>

                {/* Area Konten Scroll Mandiri */}
                <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 pt-32 md:pt-6 -mx-4 sm:-mx-8 bg-slate-50 dark:bg-dark-bg">
                    <div className="flex flex-col gap-6 w-full px-4 md:px-0 lg:px-8">
                        
                        {/* ===== WELCOME BANNER FOR STUDENT ===== */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 to-teal-500 rounded-3xl p-5 md:p-8 shadow-md w-full">
                            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl z-0 pointer-events-none"></div>
                            <div className="absolute -bottom-10 right-24 w-48 h-48 rounded-full border-4 border-white opacity-10 z-0 pointer-events-none"></div>
                            <div className="relative z-10">
                                <h1 className="text-2xl font-bold text-white mb-2">
                                    Assalamualaikum, <span className="text-amber-400">{currentStudent?.name || user.name}</span>!
                                </h1>
                                <p className="text-emerald-50 text-xs md:text-sm max-w-xl leading-relaxed line-clamp-2">
                                    Tetap semangat menghafal Al-Qur'an hari ini ya! Semoga dimudahkan dalam murojaah dan menambah setoran hafalanmu.
                                </p>
                            </div>
                        </div>

                        {/* Student Metrics Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
                            {/* Card 1: Hafalan Terakhir */}
                            <div className="bg-white dark:bg-[#16271E] border border-gray-200 dark:border-[#1F382B] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
                                <div className="flex justify-between items-center w-full gap-2">
                                    <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Hafalan Terakhir</span>
                                    <div className="text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-1.5 sm:p-2 rounded-lg shrink-0">
                                        <Book size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </div>
                                </div>
                                <div className="mt-2 sm:mt-4">
                                    <h4 className="text-base sm:text-xl font-black text-slate-800 dark:text-white truncate">
                                        {currentStudent?.currentSurah || '-'}
                                    </h4>
                                    <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 mt-1 sm:mt-2 font-bold truncate">
                                        {currentStudent?.currentJuz ? `Juz ${currentStudent.currentJuz}` : 'Tahfidz Program'}
                                    </p>
                                </div>
                            </div>

                            {/* Card 2: Perkembangan Tartili */}
                            <div className="bg-white dark:bg-[#16271E] border border-gray-200 dark:border-[#1F382B] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
                                <div className="flex justify-between items-center w-full gap-2">
                                    <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Perkembangan Tartili</span>
                                    <div className="text-teal-600 dark:text-teal-500 bg-teal-50 dark:bg-teal-500/10 p-1.5 sm:p-2 rounded-lg shrink-0">
                                        <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </div>
                                </div>
                                <div className="mt-2 sm:mt-4">
                                    <h4 className="text-base sm:text-xl font-black text-slate-800 dark:text-white truncate">
                                        {currentStudent?.iqraLevel ? `Jilid ${currentStudent.iqraLevel}` : 'Al-Qur\'an'}
                                    </h4>
                                    <p className="text-[10px] sm:text-xs text-teal-600 dark:text-teal-400 mt-1 sm:mt-2 font-bold truncate">
                                        {currentStudent?.page ? `Halaman ${currentStudent.page}` : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Card 3: Kehadiran */}
                            <div className="bg-white dark:bg-[#16271E] border border-gray-200 dark:border-[#1F382B] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
                                <div className="flex justify-between items-center w-full gap-2">
                                    <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Kehadiran</span>
                                    <div className="text-indigo-600 dark:text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 p-1.5 sm:p-2 rounded-lg shrink-0">
                                        <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </div>
                                </div>
                                <div className="mt-2 sm:mt-4">
                                    <h4 className="text-lg sm:text-3xl font-black text-slate-800 dark:text-white">
                                        {studentStats?.attRate}%
                                    </h4>
                                    <p className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 mt-1 sm:mt-2 font-bold truncate">
                                        Rekap kehadiran semester
                                    </p>
                                </div>
                            </div>

                            {/* Card 4: Rata-rata Nilai */}
                            <div className="bg-white dark:bg-[#16271E] border border-gray-200 dark:border-[#1F382B] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
                                <div className="flex justify-between items-center w-full gap-2">
                                    <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Rata-rata Nilai</span>
                                    <div className="text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 p-1.5 sm:p-2 rounded-lg shrink-0">
                                        <Award size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </div>
                                </div>
                                <div className="mt-2 sm:mt-4">
                                    <h4 className="text-lg sm:text-3xl font-black text-slate-800 dark:text-white">
                                        {studentStats?.avgScore}
                                    </h4>
                                    <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 mt-1 sm:mt-2 font-bold uppercase tracking-wider truncate">
                                        {currentStudent?.status || 'Jayyid'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Setoran Logs Table */}
                        <div className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] rounded-3xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Riwayat Setoran Terbaru</h3>
                            {loadingStudentData ? (
                                <div className="py-12 text-center text-slate-400">
                                    <Loader2 className="animate-spin mx-auto mb-2 text-emerald-600" size={24} />
                                    <span>Memuat riwayat setoran...</span>
                                </div>
                            ) : logs.length > 0 ? (
                                 <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
                                     <table className="w-full min-w-max text-sm text-left border-collapse">
                                         <thead>
                                             <tr className="border-b border-slate-100 dark:border-[#1A2E24] text-slate-400 dark:text-[#8BA398] font-bold text-xs uppercase tracking-wider">
                                                 <th className="pb-3 pr-4 whitespace-nowrap">Tanggal</th>
                                                 <th className="pb-3 pr-4 whitespace-nowrap">Tipe</th>
                                                 <th className="pb-3 pr-4 whitespace-nowrap">Materi</th>
                                                 <th className="pb-3 px-4 text-center whitespace-nowrap">Nilai</th>
                                                 <th className="pb-3 pl-4 whitespace-nowrap">Catatan Ustadz</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-slate-100 dark:divide-[#1A2E24]">
                                             {logs.slice(0, 5).map((log) => {
                                                 const formattedDate = new Date(log.date).toLocaleDateString('id-ID', {
                                                     day: 'numeric',
                                                     month: 'short',
                                                     year: 'numeric'
                                                 });
                                                 return (
                                                     <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C3026]/10 transition-colors">
                                                         <td className="py-3.5 pr-4 font-bold text-slate-700 dark:text-[#E2EAE5] whitespace-nowrap">
                                                             {formattedDate}
                                                         </td>
                                                         <td className="py-3.5 pr-4 whitespace-nowrap">
                                                             <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                                 log.type === 'Hafalan' 
                                                                     ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                                                                     : 'bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400'
                                                             }`}>
                                                                 {log.type}
                                                             </span>
                                                         </td>
                                                         <td className="py-3.5 pr-4 font-bold text-slate-800 dark:text-white">
                                                             {log.type === 'Hafalan' 
                                                                 ? `${log.currentSurah}${log.currentJuz ? ` (Juz ${log.currentJuz})` : ''}` 
                                                                 : (log.currentSurah || `Jilid ${log.iqraLevel || '-'} Hal. ${log.page || '-'}`)}
                                                         </td>
                                                         <td className="py-3.5 px-4 text-center font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                             {log.score}
                                                         </td>
                                                         <td className="py-3.5 pl-4 text-slate-500 dark:text-[#8BA398] text-xs max-w-xs truncate" title={log.notes}>
                                                             {log.notes || '-'}
                                                         </td>
                                                     </tr>
                                                 );
                                             })}
                                         </tbody>
                                     </table>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400">
                                    <BookOpen className="mx-auto mb-2 text-slate-300" size={32} />
                                    <span>Belum ada riwayat setoran tercatat.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 flex-1 flex flex-col min-h-0">
            {/* Header Section (Floating Card Style on Desktop, Fixed Top Bar on Mobile) */}
            <div className="fixed top-0 left-0 right-0 w-full z-50 bg-white/90 dark:bg-[#09120E]/90 backdrop-blur-md px-4 py-4 border-b border-slate-100 dark:border-[#1A2E24] md:hidden">
                <Header
                    user={user}
                    onMenuClick={onMenuClick}
                    notifications={notifications}
                    onDismissNotification={onDismissNotification}
                    onSearchClick={onSearchClick}
                    flat={true}
                    title="Dashboard"
                    subtitle="Pantau aktivitas hafalan dan jadwal Anda di sini."
                    showGreeting={true}
                />
            </div>
            
            <div className="hidden md:block">
                <FloatingHeaderCard className="w-full lg:max-w-none lg:mx-0">
                    <Header
                        user={user}
                        onMenuClick={onMenuClick}
                        notifications={notifications}
                        onDismissNotification={onDismissNotification}
                        onSearchClick={onSearchClick}
                        flat={true}
                        title="Dashboard"
                        subtitle="Pantau aktivitas hafalan dan jadwal Anda di sini."
                        showGreeting={true}
                    />
                </FloatingHeaderCard>
            </div>

            {/* Area Konten Scroll Mandiri */}
            <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 pt-32 md:pt-6 -mx-4 sm:-mx-8 bg-slate-50 dark:bg-dark-bg">
                <div className="flex flex-col gap-4 w-full px-4 md:px-0 lg:px-8">
                    {/* ===== BANNER & REMINDER ROW ===== */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
                        {/* ===== AREA BANNER ZAMRUD ===== */}
                        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 rounded-3xl p-6 md:p-8 shadow-md w-full min-h-[220px] flex flex-col justify-between">
                            
                            {/* Islamic Geometric Pattern Background Overlay */}
                            <div 
                                className="absolute inset-0 opacity-[0.06] pointer-events-none z-0"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='1'%3E%3Cpath d='M40 0 L52 28 L80 40 L52 52 L40 80 L28 52 L0 40 L28 28 Z'/%3E%3Cpath d='M0 0 L28 28 M80 0 L52 28 M80 80 L52 52 M0 80 L28 52'/%3E%3Ccircle cx='40' cy='40' r='12'/%3E%3Ccircle cx='40' cy='40' r='28'/%3E%3Cpolygon points='40,12 59,20 68,40 59,60 40,68 21,60 12,40 21,20'/%3E%3C/g%3E%3C/svg%3E")`,
                                    backgroundSize: '80px 80px',
                                    backgroundRepeat: 'repeat'
                                }}
                            ></div>
                            
                            {/* Content Container */}
                            <div className="relative z-10 flex-1 flex flex-col gap-4 text-white w-full">
                                <div>
                                    <span className="text-[11px] md:text-xs font-semibold tracking-wider uppercase opacity-85 block mb-1">Selamat Datang Kembali,</span>
                                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                                        {user.name.split(' ')[0].toLowerCase().startsWith('ustadz') && user.name.split(' ').length > 1
                                            ? `${user.name.split(' ')[0]} ${user.name.split(' ')[1]}`
                                            : 'Ustadz/zah TQA'}
                                    </h1>
                                </div>
                                
                                <p className="text-emerald-100 text-xs md:text-sm max-w-xl md:max-w-2xl leading-relaxed font-medium">
                                    {bannerText}
                                </p>

                                {/* Buttons row */}
                                <div className="flex flex-wrap items-center gap-3 mt-1">
                                    <button
                                        onClick={() => onNavigate('input_setoran')}
                                        className="flex items-center gap-2.5 px-6 py-3 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 transition-all rounded-2xl text-xs md:text-sm font-extrabold shadow-sm cursor-pointer"
                                    >
                                        <div className="w-4 h-4 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-[11px]">+</div>
                                        <span>Input Setoran</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => setIsScheduleModalOpen(true)}
                                        className="flex items-center gap-2.5 px-6 py-3 bg-transparent border border-white/25 hover:border-white/60 hover:bg-white/5 active:scale-95 transition-all rounded-2xl text-xs md:text-sm font-extrabold text-white cursor-pointer"
                                    >
                                        <Calendar size={14} className="opacity-95" />
                                        <span>Lihat Jadwal</span>
                                    </button>
                                </div>

                                {/* Calligraphy Quote Box */}
                                <div className="mt-2 p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-2xl shadow-inner backdrop-blur-xs w-full">
                                    <p className="font-serif text-sm md:text-base text-emerald-50 tracking-wide leading-relaxed italic text-center md:text-left">
                                        “Sebaik-baik kalian adalah yang belajar Al-Qur'an dan mengajarkannya.”
                                        <span className="not-italic text-xs md:text-sm text-emerald-300 ml-2 font-sans font-semibold opacity-90">— HR. Bukhari</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pengingat Hari Ini Section (Beside the Welcome Card on Desktop) */}
                        <div className="bg-white dark:bg-[#121F18] border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-5 w-full">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Pengingat Hari Ini</h3>
                                <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                    <Bell size={18} />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                {checklist.map((item) => (
                                    <div 
                                        key={item.id}
                                        onClick={() => handleToggleChecklist(item.id)}
                                        className="flex items-start gap-4 cursor-pointer select-none group"
                                    >
                                        {/* Custom Checkbox */}
                                        <div className={`mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                            item.checked 
                                                ? 'bg-emerald-600 border-emerald-600 text-white' 
                                                : 'border-slate-200 dark:border-white/10 bg-transparent group-hover:border-slate-350 dark:group-hover:border-white/20'
                                        }`}>
                                            {item.checked && (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Text Content */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-sm font-semibold transition-all ${
                                                item.checked 
                                                    ? 'text-slate-450 dark:text-slate-500 line-through' 
                                                    : 'text-slate-700 dark:text-slate-200'
                                            }`}>
                                                {item.text}
                                            </h4>
                                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">
                                                {item.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                {/* Grid Metrik Operasional Utama */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
                    {/* Kartu 1: Bimbingan Khusus */}
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="text-left w-full bg-white dark:bg-[#16271E] border border-slate-100 dark:border-[#1F382B] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                    >
                        <div className="flex justify-between items-center w-full gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Bimbingan Khusus</span>
                            <div className="text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 p-1.5 sm:p-2 rounded-lg shrink-0">
                                <UserX size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-4">
                            <h4 className="text-lg sm:text-3xl font-black text-slate-800 dark:text-white truncate">{metrics.bimbingan}</h4>
                            <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400/80 mt-1 sm:mt-2 truncate">Perlu pantauan pekan ini</p>
                        </div>
                    </button>

                    {/* Kartu 2: Murojaah Terakhir */}
                    <div className="bg-white dark:bg-[#16271E] border border-slate-100 dark:border-[#1F382B] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="flex justify-between items-center w-full gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Murojaah Terakhir</span>
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                {isPastClass && (
                                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold shadow-sm">
                                        Selesai
                                    </span>
                                )}
                                <div className="text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-500/10 p-1.5 sm:p-2 rounded-lg">
                                    <BookOpen size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-4 min-w-0">
                            {targetClassId ? (
                                <>
                                    <h4 className={`text-lg sm:text-2xl font-black truncate ${
                                        isPastClass 
                                            ? 'text-slate-500 dark:text-slate-400' 
                                            : 'text-slate-800 dark:text-white'
                                    }`}>
                                        Kelas {targetClassId}
                                    </h4>
                                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1 sm:mt-2 truncate font-semibold" title={lastMurojaah?.surah || "Belum ada setoran"}>
                                        {lastMurojaah?.surah || "Belum ada setoran"}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h4 className="text-sm sm:text-xl font-bold text-slate-400 dark:text-slate-500 truncate">Menunggu Jadwal</h4>
                                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 mt-1 sm:mt-2 truncate">-</p>
                                
                                </>
                            )}
                        </div>
                    </div>

                    {/* Kartu 3: Gharib Terakhir */}
                    <div className="bg-white dark:bg-[#16271E] border border-slate-100 dark:border-[#1F382B] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="flex justify-between items-center w-full gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Gharib Terakhir</span>
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                {jadwalGharibHariIni && (
                                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold shadow-sm">
                                        Hari Ini
                                    </span>
                                )}
                                <div className="text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-1.5 sm:p-2 rounded-lg">
                                    <Bookmark size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-4 min-w-0">
                            {jadwalGharibHariIni ? (
                                <>
                                    <h4 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white truncate">
                                        Kelas {jadwalGharibHariIni.kelas_id}
                                    </h4>
                                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1 sm:mt-2 truncate font-semibold" title={getGharibDetailText()}>
                                        {getGharibDetailText()}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h4 className="text-sm sm:text-xl font-bold text-slate-400 dark:text-slate-500 truncate">Tidak ada jadwal</h4>
                                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1 sm:mt-2 truncate">-</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Kartu 4: Belum Setor Kemarin */}
                    <div className="bg-white dark:bg-[#16271E] border border-slate-100 dark:border-[#1F382B] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="flex justify-between items-center w-full gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate">Belum Setor (H-1)</span>
                            <div className="text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-1.5 sm:p-2 rounded-lg shrink-0">
                                <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-4">
                            <h4 className="text-lg sm:text-3xl font-black text-slate-800 dark:text-white truncate">{metrics.belumSetor}</h4>
                            <p className="text-[10px] sm:text-xs text-red-500 dark:text-red-400 mt-1 sm:mt-2 truncate">Butuh *follow-up* hari ini</p>
                        </div>
                    </div>
                </div>

                {/* Schedule Section (Jadwal Mengajar) */}
                <div className="w-full bg-white dark:bg-[#121F18] border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Jadwal Mengajar</h3>
                        
                        {/* Day Tabs */}
                        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
                            {(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const).map((hari) => {
                                const isActive = hariAktif === hari;
                                return (
                                    <button
                                        key={hari}
                                        onClick={() => setHariAktif(hari)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer focus:outline-none whitespace-nowrap ${
                                            isActive
                                                ? 'bg-gradient-to-r from-emerald-800 to-emerald-600 text-white shadow-sm'
                                                : 'text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 bg-transparent'
                                        }`}
                                    >
                                        {hari}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Schedules List with Timeline */}
                    {hariAktif && (
                        <div className="flex flex-col gap-4">
                            {(() => {
                                const schedules = jadwalMengajar[hariAktif as keyof typeof jadwalMengajar] || [];
                                const total = schedules.length;
                                
                                return total > 0 ? (
                                    schedules.map((schedule, idx) => {
                                        const isActive = currentDayOfWeek === hariAktif && schedule.className.replace('Kelas ', '') === activeClassId;
                                        const timePart = schedule.time.split(' / ')[1] || schedule.time;
                                        const timeParts = timePart.split(' - ');
                                        const startTime = timeParts[0]?.trim().replace(':', '.') || '';
                                        const endTime = timeParts[1]?.trim().replace(':', '.') || '';

                                        return (
                                            <div 
                                                key={schedule.className}
                                                className="flex items-stretch gap-0"
                                            >
                                                {/* Left Side: Time Card Cell */}
                                                <div className={`w-20 shrink-0 flex flex-col items-center justify-center bg-white dark:bg-[#16271E]/40 border-slate-100 dark:border-[#1F382B]/35 ${
                                                    idx === 0 ? 'border-t border-l border-r rounded-t-2xl' : 'border-l border-r'
                                                } ${
                                                    idx === total - 1 ? 'border-b border-l border-r rounded-b-2xl' : ''
                                                } ${
                                                    total === 1 ? 'border-t border-b rounded-2xl' : ''
                                                } py-3`}>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-none">{startTime}</span>
                                                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1.5 leading-none">{endTime}</span>
                                                </div>

                                                {/* Middle Column: Timeline Connector */}
                                                <div className="w-10 shrink-0 flex items-center justify-center relative">
                                                    {/* Horizontal connector line */}
                                                    <div className="absolute left-0 right-0 h-px bg-slate-100 dark:bg-[#1A2E24]"></div>
                                                    
                                                    {/* Vertical timeline line */}
                                                    {total > 1 && (
                                                        <div className={`absolute w-px bg-slate-100 dark:bg-[#1A2E24] ${
                                                            idx === 0 ? 'top-1/2 bottom-0' : idx === total - 1 ? 'top-0 bottom-1/2' : 'top-0 bottom-0'
                                                        }`}></div>
                                                    )}

                                                    {/* Timeline Circle Dot */}
                                                    <div className={`w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-[#121F18] z-10 shrink-0 ${
                                                        isActive 
                                                            ? 'border-emerald-600 dark:border-emerald-500 animate-pulse ring-4 ring-emerald-500/10' 
                                                            : 'border-emerald-600 dark:border-emerald-500/60'
                                                    }`}></div>
                                                </div>

                                                {/* Right Side: Class Card Box */}
                                                <div 
                                                    onClick={() => setIsScheduleModalOpen(true)}
                                                    className={`flex-1 flex justify-between items-center p-4 rounded-2xl border transition-all cursor-pointer ${
                                                        isActive 
                                                            ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-500/60 dark:border-emerald-500/40 ring-1 ring-emerald-500/10' 
                                                            : 'bg-[#F8FAFC]/50 dark:bg-[#16271E]/30 border-slate-100 dark:border-[#1F382B]/30 hover:bg-[#F8FAFC] dark:hover:bg-[#16271E]/50'
                                                    }`}
                                                >
                                                    <div className="min-w-0 pr-2">
                                                        <h4 className="font-bold text-slate-800 dark:text-[#E2EAE5] text-sm leading-tight">{schedule.className}</h4>
                                                        <p className="text-[11px] text-slate-400 dark:text-[#8BA398] mt-1.5 truncate font-semibold">
                                                            {getMaterialForClass(schedule.className)}
                                                        </p>
                                                    </div>

                                                    {/* Badges */}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/10">
                                                            {schedule.className}
                                                        </span>
                                                        {schedule.label && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                                                                {schedule.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                                        Tidak ada jadwal mengajar pada hari {hariAktif}.
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Centered Button at the bottom */}
                    <div className="flex justify-center border-t border-slate-100 dark:border-[#1A2E24] pt-4">
                        <button
                            onClick={() => setIsScheduleModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-[#16271E] border border-slate-200 dark:border-[#1F382B] text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-[#16271E]/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                        >
                            <Calendar size={14} className="text-slate-400" />
                            <span>Lihat Jadwal Lengkap</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>


            {/* Modal Detail Jadwal */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-dark-card rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-slate-100 dark:border-dark-border animate-in fade-in zoom-in-95 duration-200">
                        {/* Header Close button */}
                        <button
                            onClick={() => setIsScheduleModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-dark-card-hover transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                            Jadwal Mengajar - {hariAktif || 'Senin'}
                        </h3>

                        {/* UI Timeline Jadwal Vertikal */}
                        <div className="flex flex-col gap-3">
                            {(jadwalMengajar[hariAktif as keyof typeof jadwalMengajar] || jadwalMengajar['Senin']).map((schedule, index) => {
                                const timeOnly = schedule.time.split(' / ')[1] || schedule.time;
                                const isScheduleActive = currentDayOfWeek === (hariAktif || 'Senin') && schedule.className.replace('Kelas ', '') === activeClassId;
                                const scheduleNum = String(index + 1).padStart(2, '0');
                                return (
                                    <div 
                                        key={schedule.className} 
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            isScheduleActive 
                                                ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-500/30' 
                                                : 'bg-white dark:bg-dark-card border-slate-100 dark:border-dark-border hover:bg-slate-50/50 dark:hover:bg-dark-card-hover'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Clock Icon or number indicator */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                isScheduleActive 
                                                    ? 'bg-emerald-500 text-white' 
                                                    : 'bg-slate-100 dark:bg-dark-card-hover text-slate-500 dark:text-slate-400'
                                            }`}>
                                                {scheduleNum}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold ${
                                                    isScheduleActive ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'
                                                }`}>
                                                    {schedule.className}
                                                </p>
                                                <p className="text-xs text-slate-400">{timeOnly}</p>
                                            </div>
                                        </div>

                                        {isScheduleActive ? (
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Sekarang
                                            </span>
                                        ) : schedule.label ? (
                                            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 dark:bg-dark-card-hover px-2 py-0.5 rounded-full">
                                                {schedule.label}
                                            </span>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detail Bimbingan Khusus */}
            {isModalOpen && (
                <div 
                    onClick={() => setIsModalOpen(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity p-4 animate-in fade-in duration-200"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-[#16271E] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 border border-slate-100 dark:border-[#1F382B] animate-in zoom-in-95 duration-200"
                    >
                        {/* Header Modal & Tombol Tutup */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-emerald-900/30 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                Rincian Bimbingan Khusus
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-[#1C3026] focus:outline-none"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Area Konten (Body) */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
                            <div className="divide-y divide-slate-100 dark:divide-emerald-900/10">
                                {(() => {
                                    const bimbinganStudents = students.filter(s => s.requiresAttention);
                                    if (bimbinganStudents.length > 0) {
                                        return bimbinganStudents.map((student) => (
                                            <div key={student.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 gap-4">
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={student.avatar} 
                                                        alt={student.name} 
                                                        className="w-10 h-10 rounded-full border border-slate-200 dark:border-[#1F382B] object-cover" 
                                                    />
                                                    <div>
                                                        <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">{student.name}</h5>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{student.notes || 'Perlu bimbingan khusus'}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 shrink-0">
                                                    Kelas {student.class}
                                                </span>
                                            </div>
                                        ));
                                    } else {
                                        return (
                                            <>
                                                <div className="py-3 flex items-center justify-between first:pt-0 gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-emerald-950 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-emerald-400 shrink-0">AH</div>
                                                        <div>
                                                            <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">Ahmad Hanafi</h5>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Perlu bimbingan tajwid mad</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 shrink-0">Kelas 5B</span>
                                                </div>
                                                <div className="py-3 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-emerald-950 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-emerald-400 shrink-0">ZF</div>
                                                        <div>
                                                            <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">Zaidan Fathur</h5>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mengulang halaman 12</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 shrink-0">Kelas 5C</span>
                                                </div>
                                                <div className="py-3 flex items-center justify-between last:pb-0 gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-emerald-950 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-emerald-400 shrink-0">HM</div>
                                                        <div>
                                                            <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">Humaira Mufida</h5>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lancar, butuh penguatan hafalan</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 shrink-0">Kelas 5D</span>
                                                </div>
                                            </>
                                        );
                                    }
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardModern;
