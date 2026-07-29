import React, { useEffect, useState, lazy, Suspense } from 'react';
import logoUrl from './assets/logo.png';
import { BookOpen, FileText, Calendar, ChevronDown, AlertCircle, Activity, Plus, Download, CheckCircle2, LayoutDashboard, Users, Settings, History, Scroll, RotateCw, PlusCircle, User as UserIcon, Menu, LogOut, MessageSquare } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StudentList from './components/StudentList';
import StatCard from './components/StatCard';
import StudentSelectModal from './components/StudentSelectModal';
import ScheduleModal from './components/ScheduleModal';
import StatsDashboard from './components/StatsDashboard';
import HafalanTrackerCard from './components/HafalanTrackerCard';
import HafalanTargetWidget from './components/HafalanTargetWidget';

import StudentHistoryModal from './components/StudentHistoryModal';
import LoginPage from './components/LoginPage';
import ScoreDetailModal from './components/ScoreDetailModal';
import UnsubmittedListView from './components/UnsubmittedListView';
import SpecialGuidanceListView from './components/SpecialGuidanceListView';
import AverageDetailsView from './components/AverageDetailsView';
import DashboardModern from './components/DashboardModern';
import PageLoader from './components/PageLoader';

// Lazy loaded page components for optimal bundle splitting
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const SetoranPage = lazy(() => import('./components/SetoranPage'));
const HafalanPage = lazy(() => import('./components/HafalanPage'));
const ProfilSiswaPage = lazy(() => import('./components/ProfilSiswaPage'));
const RiwayatPage = lazy(() => import('./components/RiwayatPage'));
const MonitoringPage = lazy(() => import('./components/MonitoringPage'));
const StudentProfilePage = lazy(() => import('./components/StudentProfilePage'));
const CatatanPage = lazy(() => import('./components/CatatanPage'));
const MurojaahPage = lazy(() => import('./components/MurojaahPage'));
const AttendancePage = lazy(() => import('./components/AttendancePage'));
const TartiliPage = lazy(() => import('./components/TartiliPage'));
const GharibPage = lazy(() => import('./components/GharibPage'));

import { AcademicYear, MurojaahEntry, Note, Student, Target, Teacher, User, GharibEntry } from './types';
import { DEFAULT_ACADEMIC_YEAR, DEFAULT_TARGETS, DEFAULT_TEACHERS, INITIAL_MUROJAAH_ENTRIES, INITIAL_NOTES, INITIAL_STUDENTS } from './constants';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { createMurojaahEntry, deleteMurojaahEntry, deleteNote, loadAppSettings, loadMurojaahEntries, loadNotes, loadStudents, saveAppSettings, saveNote, saveStudent, seedMurojaahEntries, seedNotes, seedStudents, loadGharibEntries, createGharibEntry, updateGharibEntry, deleteGharibEntry, createSetoranLog, loadStudentSetoranLogs, markStudentNotesAsRead } from './services/appData';
import { generateMonthlyReportPDF } from './services/pdfExport';
import { useToast } from './context/ToastContext';

function App() {
   const cleanStudents: Student[] = INITIAL_STUDENTS.map(s => ({
      ...s,
      currentJuz: undefined,
      currentSurah: '-',
      iqraLevel: 1,
      page: '',
      totalProgress: 0,
      lastUpdate: 'Belum ada setoran',
      lastScore: undefined,
      status: 'Perlu Bimbingan',
      notes: '',
      requiresAttention: false
   }));

   const [user, setUser] = useState<User | null>(null);
   const [isSidebarOpenState, setIsSidebarOpenState] = useState(false);
   const [activePage, setActivePage] = useState('dashboard');
   const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
   const [showMobileLogoutConfirm, setShowMobileLogoutConfirm] = useState(false);

   const isSidebarOpen = isSidebarOpenState;
   const setIsSidebarOpen = (open: boolean | ((prev: boolean) => boolean)) => {
      const targetOpen = typeof open === 'function' ? open(isSidebarOpenState) : open;
      if (targetOpen && window.innerWidth < 1024) {
         setIsMoreMenuOpen(true);
      } else {
         setIsSidebarOpenState(targetOpen);
      }
   };
   const [isAppLoading, setIsAppLoading] = useState(true);
   const [loadError, setLoadError] = useState<string | null>(null);

   const [darkMode, setDarkMode] = useState(() => {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
   });

   useEffect(() => {
      if (darkMode) {
         document.documentElement.classList.add('dark');
         localStorage.setItem('theme', 'dark');
      } else {
         document.documentElement.classList.remove('dark');
         localStorage.setItem('theme', 'light');
      }
   }, [darkMode]);

   useEffect(() => {
      const syncTheme = () => {
         const isDark = document.documentElement.classList.contains('dark');
         if (isDark !== darkMode) {
            setDarkMode(isDark);
         }
      };
      const observer = new MutationObserver(syncTheme);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
   }, [darkMode]);

   const INITIAL_GHARIB_ENTRIES: GharibEntry[] = [
      { id: 'mock-1', className: '5B', date: '2026-06-25', status: 'Lanjut', material: 'Gharib Hal. 10', notes: 'Alhamdulillah lancar' },
      { id: 'mock-2', className: '5C', date: '2026-06-26', status: 'Lanjut', material: 'Gharib Hal. 12', notes: 'Perlu bimbingan pada makhraj' },
      { id: 'mock-3', className: '5D', date: '2026-06-27', status: 'Mengulang', material: 'Gharib Hal. 12', notes: 'Mengulang karena banyak yang absen' },
   ];

   const [notes, setNotes] = useState<Note[]>(() => {
      const local = localStorage.getItem('tqa_notes');
      const isResetFlag = localStorage.getItem('tqa_is_reset') === 'true';
      return local ? JSON.parse(local) : (isResetFlag ? [] : INITIAL_NOTES);
   });
   const [murojaahEntries, setMurojaahEntries] = useState<MurojaahEntry[]>(() => {
      const local = localStorage.getItem('tqa_murojaah_entries');
      const isResetFlag = localStorage.getItem('tqa_is_reset') === 'true';
      return local ? JSON.parse(local) : (isResetFlag ? [] : INITIAL_MUROJAAH_ENTRIES);
   });
   const [gharibEntries, setGharibEntries] = useState<GharibEntry[]>(() => {
      const local = localStorage.getItem('tqa_gharib_entries');
      const isResetFlag = localStorage.getItem('tqa_is_reset') === 'true';
      return local ? JSON.parse(local) : (isResetFlag ? [] : INITIAL_GHARIB_ENTRIES);
   });

   // Data State
   const [students, setStudents] = useState<Student[]>(() => {
      const local = localStorage.getItem('tqa_students');
      const isResetFlag = localStorage.getItem('tqa_is_reset') === 'true';
      return local ? JSON.parse(local) : (isResetFlag ? cleanStudents : INITIAL_STUDENTS);
   });

   useEffect(() => {
      if (!isSupabaseConfigured) {
         localStorage.setItem('tqa_students', JSON.stringify(students));
      }
   }, [students]);

   useEffect(() => {
      if (!isSupabaseConfigured) {
         localStorage.setItem('tqa_notes', JSON.stringify(notes));
      }
   }, [notes]);

   useEffect(() => {
      if (!isSupabaseConfigured) {
         localStorage.setItem('tqa_murojaah_entries', JSON.stringify(murojaahEntries));
      }
   }, [murojaahEntries]);

   // Modal State
   // const [selectedStudent, setSelectedStudent] = useState<Student | null>(null); // Moved to local state in SetoranPage
   // const [isInputModalOpen, setIsInputModalOpen] = useState(false); // Deprecated

   const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
   const [isScoreDetailModalOpen, setIsScoreDetailModalOpen] = useState(false);
   const [isUnsubmittedModalOpen, setIsUnsubmittedModalOpen] = useState(false);
   const [isSpecialGuidanceModalOpen, setIsSpecialGuidanceModalOpen] = useState(false);
   const [isStudentSelectModalOpen, setIsStudentSelectModalOpen] = useState(false);
   const [isStudentHistoryModalOpen, setIsStudentHistoryModalOpen] = useState(false);
   const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
   const [preSelectedStudent, setPreSelectedStudent] = useState<Student | null>(null);
   const [profileStudent, setProfileStudent] = useState<Student | null>(null);

   // Report State
   const [reportClass, setReportClass] = useState('5C');
   const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
   const [reportFilterMode, setReportFilterMode] = useState<'month' | 'range'>('month');
   const [reportStartDate, setReportStartDate] = useState(() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
   });
   const [reportEndDate, setReportEndDate] = useState(() => {
      const now = new Date();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
   });

   // Notifications
   const notifications = students.filter(s => s.requiresAttention);

    const [unreadNotesCount, setUnreadNotesCount] = useState(0);
 
    // Resolve missing studentId on user session startup (self-healing login session)
    useEffect(() => {
       const isStudent = user?.role === 'student' || user?.role === 'siswa';
       if (isStudent && !user?.studentId && user?.name && students.length > 0) {
          const matched = students.find(s => s.name.toUpperCase() === user.name.toUpperCase());
          if (matched) {
             setUser(prev => prev ? { ...prev, studentId: matched.id } : null);
          }
       }
    }, [user, students]);

    // Sync/load unread notes count for students (both setoran logs and personal messages)
    useEffect(() => {
       const isStudent = user?.role === 'student' || user?.role === 'siswa';
       let studentId = user?.studentId;
       const studentName = user?.name;

       // Fallback to name matching if studentId is missing
       if (isStudent && !studentId && studentName && students.length > 0) {
          const matchedStudent = students.find(s => s.name.toUpperCase() === studentName.toUpperCase());
          if (matchedStudent) {
             studentId = matchedStudent.id;
          }
       }
 
       if (!user || !isStudent || !studentId) {
          setUnreadNotesCount(0);
          return;
       }
 
       let isMounted = true;
       const checkUnreadCount = async () => {
          try {
             // 1. Get setoran logs unread count
             let logs: any[] = [];
             if (isSupabaseConfigured) {
                logs = await loadStudentSetoranLogs(studentId!);
             } else {
                const localLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
                logs = localLogs.filter((l: any) => l.studentId === studentId);
             }
             const unreadSetoran = logs.filter((l: any) => l.notes && l.notes.trim() !== '' && !l.isRead);

             // 2. Get personal messages unread count
             const localMsgs = JSON.parse(localStorage.getItem('tqa_personal_messages') || '[]');
             const unreadMsgs = localMsgs.filter((msg: any) => 
                (msg.studentId === studentId || (studentName && msg.studentName.toUpperCase() === studentName.toUpperCase())) &&
                msg.status === 'Terkirim'
             );

             const totalUnread = unreadSetoran.length + unreadMsgs.length;
             
             if (isMounted) {
                setUnreadNotesCount(totalUnread);
             }
          } catch (e) {
             console.error('Failed to load unread notes count:', e);
             // Fallback
             const localLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
             const unreadSetoran = localLogs.filter((l: any) => l.studentId === studentId && l.notes && l.notes.trim() !== '' && !l.isRead);
             
             const localMsgs = JSON.parse(localStorage.getItem('tqa_personal_messages') || '[]');
             const unreadMsgs = localMsgs.filter((msg: any) => 
                (msg.studentId === studentId || (studentName && msg.studentName.toUpperCase() === studentName.toUpperCase())) &&
                msg.status === 'Terkirim'
             );

             if (isMounted) {
                setUnreadNotesCount(unreadSetoran.length + unreadMsgs.length);
             }
          }
       };
 
       void checkUnreadCount();
 
       // Listen for personal message triggers or storage updates
       const handleUpdates = () => {
          void checkUnreadCount();
       };
       window.addEventListener('tqa_new_personal_message', handleUpdates);
       window.addEventListener('storage', handleUpdates);

       // Poll check every 10 seconds
       const interval = setInterval(checkUnreadCount, 10000);
       return () => {
          isMounted = false;
          clearInterval(interval);
          window.removeEventListener('tqa_new_personal_message', handleUpdates);
          window.removeEventListener('storage', handleUpdates);
       };
    }, [user, activePage, students]);
 
    // Mark student notes as read when opening Catatan page
    useEffect(() => {
       const isStudent = user?.role === 'student' || user?.role === 'siswa';
       let studentId = user?.studentId;

       // Fallback to name matching if studentId is missing
       if (isStudent && !studentId && user?.name && students.length > 0) {
          const matchedStudent = students.find(s => s.name.toUpperCase() === user.name.toUpperCase());
          if (matchedStudent) {
             studentId = matchedStudent.id;
          }
       }
 
       if (isStudent && studentId && activePage === 'catatan') {
          const triggerMarkRead = async () => {
             try {
                await markStudentNotesAsRead(studentId!);
                setUnreadNotesCount(0);
             } catch (e) {
                console.error('Failed to mark student notes as read:', e);
             }
          };
          void triggerMarkRead();
       }
    }, [activePage, user, students]);



   const handleLogin = (userData: User) => {
      setUser(userData);
   };

   const handleLogout = () => {
      setUser(null);
      setActivePage('dashboard');
   };

   const [globalToastShow, setGlobalToastShow] = useState(false);
   const [globalToastMsg, setGlobalToastMsg] = useState('');

   const handleSaveNilai = async (id: string, data: Partial<Student> & { date?: string }) => {
      const existingStudent = students.find((student) => student.id === id);
      if (!existingStudent) {
         return;
      }

      // Prevent Murojaah/Mengulang from downgrading student's highest achievements
      const isMurojaah = data.jenisSetoran === 'Mengulang';
      const updateData = { ...data };
      if (isMurojaah) {
         delete updateData.currentJuz;
         delete updateData.currentSurah;
         delete updateData.iqraLevel;
         delete updateData.page;
      }

      const nextStudent = { ...existingStudent, ...updateData };

      setStudents(prev => prev.map(student => student.id === id ? nextStudent : student));

      // Log setoran entry locally in localStorage for integrated reporting
      const logEntry = {
         id: Date.now(),
         studentId: id,
         studentName: nextStudent.name,
         class: nextStudent.class,
         type: data.type || nextStudent.type || 'Hafalan',
         currentSurah: data.currentSurah || nextStudent.currentSurah,
         currentJuz: data.currentJuz || nextStudent.currentJuz,
         jenisSetoran: data.jenisSetoran || nextStudent.jenisSetoran || 'Lanjut',
         iqraLevel: data.iqraLevel || nextStudent.iqraLevel,
         page: data.page || nextStudent.page,
         score: data.lastScore,
         status: data.status || nextStudent.status,
         notes: data.notes || nextStudent.notes || '',
         requiresAttention: data.requiresAttention ?? nextStudent.requiresAttention ?? false,
         date: data.date || new Date().toISOString()
      };

      try {
         const currentLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
         currentLogs.push(logEntry);
         localStorage.setItem('tqa_setoran_logs', JSON.stringify(currentLogs));
      } catch (e) {
         console.error('Failed to log setoran entry:', e);
      }

      if (isSupabaseConfigured) {
         try {
            await saveStudent(nextStudent);
         } catch (error: any) {
            // Rollback local state if remote write fails
            setStudents(prev => prev.map(student => student.id === id ? existingStudent : student));
            console.error('Failed to save student:', error);
            alert(`Perubahan siswa gagal disimpan ke Supabase: ${error?.message || error}`);
            return;
         }

         try {
            await createSetoranLog(logEntry);
         } catch (error: any) {
            console.error('Failed to save setoran log to Supabase:', error);
            if (error?.message?.includes('public.setoran') || error?.message?.includes('schema cache')) {
               alert('Catatan setoran disimpan secara lokal. Peringatan: tabel "setoran" belum terbuat di database Supabase Anda. Silakan jalankan query SQL yang diberikan di editor SQL Supabase Anda.');
            } else {
               alert(`Gagal menyimpan log riwayat ke Supabase: ${error?.message || error}. Data disimpan secara lokal.`);
            }
         }
      }
   };

   const handleDismissNotification = (id: string) => {
      const existingStudent = students.find((student) => student.id === id);
      if (!existingStudent) {
         return;
      }

      const nextStudent = { ...existingStudent, requiresAttention: false };

      setStudents(prev => prev.map(student => student.id === id ? nextStudent : student));

      if (isSupabaseConfigured) {
         void saveStudent(nextStudent).catch((error) => {
            console.error('Failed to dismiss notification:', error);
         });
      }
   };

   const handleSaveGharibEntry = async (entry: Omit<GharibEntry, 'id'>) => {
      const optimisticEntry: GharibEntry = {
         ...entry,
         id: String(Date.now())
      };

      setGharibEntries(prev => [optimisticEntry, ...prev]);
      localStorage.setItem('tqa_gharib_entries', JSON.stringify([optimisticEntry, ...gharibEntries]));

      if (isSupabaseConfigured) {
         try {
            const saved = await createGharibEntry(entry);
            setGharibEntries(prev => {
               const remaining = prev.filter(e => e.id !== optimisticEntry.id);
               return [saved, ...remaining];
            });
         } catch (error: any) {
            console.error('Failed to save Gharib entry to Supabase:', error);
            alert(`Gharib gagal disimpan ke Supabase (${error?.message || error}). Data disimpan secara lokal.`);
         }
      }
   };

   const handleUpdateGharibEntry = async (entry: GharibEntry) => {
      setGharibEntries(prev => {
         const next = prev.map(e => e.id === entry.id ? entry : e);
         localStorage.setItem('tqa_gharib_entries', JSON.stringify(next));
         return next;
      });

      if (isSupabaseConfigured) {
         try {
            await updateGharibEntry(entry);
         } catch (error: any) {
            console.error('Failed to update Gharib entry in Supabase:', error);
            alert(`Gagal sinkronisasi pembaruan ke Supabase: ${error?.message || error}`);
         }
      }
   };

   const handleDeleteGharibEntry = async (id: string | number) => {
      if (!window.confirm('Apakah Anda yakin ingin menghapus catatan Gharib ini?')) {
         return;
      }

      setGharibEntries(prev => {
         const next = prev.filter(e => e.id !== id);
         localStorage.setItem('tqa_gharib_entries', JSON.stringify(next));
         return next;
      });

      if (isSupabaseConfigured) {
         try {
            await deleteGharibEntry(id);
         } catch (error: any) {
            console.error('Failed to delete Gharib entry from Supabase:', error);
            alert(`Gagal menghapus dari Supabase: ${error?.message || error}`);
         }
      }
   };

   const handleDeleteMurojaahEntry = async (id: string | number) => {
      setMurojaahEntries(prev => {
         const next = prev.filter(e => e.id !== id);
         localStorage.setItem('tqa_murojaah_entries', JSON.stringify(next));
         return next;
      });

      if (isSupabaseConfigured) {
         try {
            await deleteMurojaahEntry(id);
         } catch (error: any) {
            console.error('Failed to delete Murojaah entry from Supabase:', error);
            alert(`Gagal menghapus dari Supabase: ${error?.message || error}`);
         }
      }
   };

   const handleUpdateUser = (data: Partial<User>) => {
      if (user) {
         setUser({ ...user, ...data });
      }
   };

    const handleUpdateStudent = async (studentId: string, updatedData: Partial<Student>) => {
       const existingStudent = students.find((s) => s.id === studentId);
       if (!existingStudent) return;

       const nextStudent = { ...existingStudent, ...updatedData };
       setStudents(prev => prev.map(s => s.id === studentId ? nextStudent : s));

       if (isSupabaseConfigured) {
          try {
             await saveStudent(nextStudent);
          } catch (error: any) {
             // Rollback
             setStudents(prev => prev.map(s => s.id === studentId ? existingStudent : s));
             console.error('Failed to update student:', error);
             alert(`Gagal menyimpan perubahan siswa ke database: ${error?.message || error}`);
          }
       }
    };

   // Lifted State for Settings
   const [academicYear, setAcademicYear] = useState<AcademicYear>(DEFAULT_ACADEMIC_YEAR);
   const [targets, setTargets] = useState<Target[]>(DEFAULT_TARGETS);
   const [teachers, setTeachers] = useState<Teacher[]>(DEFAULT_TEACHERS);

   useEffect(() => {
      const savedUser = localStorage.getItem('tqa_user');
      if (savedUser) {
         try {
            const parsed = JSON.parse(savedUser);
            if (parsed && (parsed.name === 'Ustadz Hanif' || parsed.name === 'Pengampu TQA Kelas 5&6' || parsed.name === 'Pengampu')) {
               parsed.name = 'Ustadz/zah TQA Kelas 5&6';
               localStorage.setItem('tqa_user', JSON.stringify(parsed));
            }
            setUser(parsed);
         } catch (error) {
            console.error('Failed to parse saved user:', error);
         }
      }
   }, []);

   useEffect(() => {
      if (user) {
         localStorage.setItem('tqa_user', JSON.stringify(user));
      } else {
         localStorage.removeItem('tqa_user');
      }
   }, [user]);

   useEffect(() => {
      let isMounted = true;

      const bootstrapApp = async () => {
         if (!isSupabaseConfigured) {
            if (isMounted) {
               setIsAppLoading(false);
            }
            return;
         }

         try {
            const [remoteMurojaahEntries, remoteStudents, remoteSettings, remoteNotes, remoteGharibEntries] = await Promise.all([
               loadMurojaahEntries(),
               loadStudents(),
               loadAppSettings(),
               loadNotes(),
               loadGharibEntries().catch(() => [])
            ]);

            const isResetFlag = localStorage.getItem('tqa_is_reset') === 'true';

            const nextMurojaahEntries = remoteMurojaahEntries.length > 0 
               ? remoteMurojaahEntries 
               : (isResetFlag ? [] : INITIAL_MUROJAAH_ENTRIES);
            const nextStudents = remoteStudents.length > 0 
               ? remoteStudents 
               : (isResetFlag ? cleanStudents : INITIAL_STUDENTS);
            const nextSettings = remoteSettings ?? {
               academicYear: DEFAULT_ACADEMIC_YEAR,
               targets: DEFAULT_TARGETS,
               teachers: DEFAULT_TEACHERS
            };
            const nextNotes = remoteNotes.length > 0 
               ? remoteNotes 
               : (isResetFlag ? [] : INITIAL_NOTES);
            const nextGharibEntries = remoteGharibEntries.length > 0 
               ? remoteGharibEntries 
               : (isResetFlag ? [] : INITIAL_GHARIB_ENTRIES);

            if (remoteMurojaahEntries.length === 0 && !isResetFlag) {
               await seedMurojaahEntries(INITIAL_MUROJAAH_ENTRIES);
            }

            if (remoteStudents.length === 0) {
               await seedStudents(isResetFlag ? cleanStudents : INITIAL_STUDENTS);
            }

            if (!remoteSettings) {
               await saveAppSettings(nextSettings);
            }

            if (remoteNotes.length === 0 && !isResetFlag) {
               await seedNotes(INITIAL_NOTES);
            }

            if (!isMounted) return;

            setStudents(nextStudents);
            setMurojaahEntries(nextMurojaahEntries);
            setAcademicYear(nextSettings.academicYear);
            setTargets(nextSettings.targets);
            setTeachers(nextSettings.teachers);
            setNotes(nextNotes);
            setGharibEntries(nextGharibEntries);
         } catch (error: any) {
            console.error('Failed to bootstrap app data:', error);
            if (isMounted) {
               setLoadError(`Gagal memuat data dari Supabase (${error?.message || error}). Aplikasi memakai data lokal sementara.`);
            }
         } finally {
            if (isMounted) {
               setIsAppLoading(false);
            }
         }
      };

      void bootstrapApp();

      return () => {
         isMounted = false;
      };
   }, []);

   useEffect(() => {
      if (!isSupabaseConfigured || isAppLoading) {
         return;
      }

      const timeoutId = window.setTimeout(() => {
         void saveAppSettings({ academicYear, targets, teachers }).catch((error) => {
            console.error('Failed to save app settings:', error);
         });
      }, 500);

      return () => window.clearTimeout(timeoutId);
   }, [academicYear, targets, teachers, isAppLoading]);

   const handleBackup = () => {
      const backupData = {
         user,
         students,
         academicYear,
         targets,
         teachers,
         notes,
         murojaahEntries,
         timestamp: new Date().toISOString(),
         version: '1.0'
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tqa-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
   };

   const handleRestore = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
         try {
            const data = JSON.parse(e.target?.result as string);
            if (data.user) setUser(data.user);
            if (data.students) setStudents(data.students);
            if (data.academicYear) setAcademicYear(data.academicYear);
            if (data.targets) setTargets(data.targets);
            if (data.teachers) setTeachers(data.teachers);
            if (data.notes) setNotes(data.notes);
            if (data.murojaahEntries) setMurojaahEntries(data.murojaahEntries);

            if (isSupabaseConfigured) {
               if (data.students) {
                  void seedStudents(data.students);
               }

               if (data.academicYear || data.targets || data.teachers) {
                  void saveAppSettings({
                     academicYear: data.academicYear ?? academicYear,
                     targets: data.targets ?? targets,
                     teachers: data.teachers ?? teachers,
                  });
               }

               if (data.notes) {
                  void seedNotes(data.notes);
               }

               if (data.murojaahEntries) {
                  void seedMurojaahEntries(data.murojaahEntries);
               }
            }

            alert('Data berhasil dipulihkan!');
         } catch (error) {
            console.error('Restore failed:', error);
            alert('Gagal memulihkan data. File tidak valid.');
         }
      };
      reader.readAsText(file);
   };

   const handleResetData = async () => {
      if (!window.confirm("Apakah Anda yakin ingin menghapus seluruh data dan memulai dari nol? Tindakan ini akan menghapus semua riwayat setoran, riwayat absensi, catatan guru, riwayat gharib, dan progres siswa.")) {
         return;
      }

      setIsAppLoading(true);
      try {
         // Clean student progress
         const cleanStudents: Student[] = INITIAL_STUDENTS.map(s => ({
            ...s,
            currentJuz: undefined,
            currentSurah: '-',
            iqraLevel: 1,
            page: '',
            totalProgress: 0,
            lastUpdate: 'Belum ada setoran',
            lastScore: undefined,
            status: 'Perlu Bimbingan',
            notes: '',
            requiresAttention: false
         }));

         // Clear local storage by setting them to empty arrays to prevent mock fallback loading
         localStorage.setItem('tqa_setoran_logs', JSON.stringify([]));
         localStorage.setItem('tqa_gharib_entries', JSON.stringify([]));
         localStorage.setItem('tqa_attendance_records', JSON.stringify([]));
         localStorage.setItem('tqa_personal_messages', JSON.stringify([]));
         localStorage.setItem('tqa_students', JSON.stringify(cleanStudents));
         localStorage.setItem('tqa_notes', JSON.stringify([]));
         localStorage.setItem('tqa_murojaah_entries', JSON.stringify([]));
         localStorage.setItem('tqa_tartili_classical_history', JSON.stringify([]));
         localStorage.setItem('tqa_is_reset', 'true');

         if (isSupabaseConfigured && supabase) {
            try {
               // Seed clean students (so progress fields are set to null/empty in database)
               await seedStudents(cleanStudents);

               // Delete records from database tables
               await Promise.all([
                  supabase.from('notes').delete().neq('id', 0),
                  supabase.from('murojaah_entries').delete().neq('id', 0),
                  supabase.from('jurnal_gharib').delete().neq('id', ''),
                  supabase.from('setoran').delete().neq('id', 0),
                  supabase.from('attendance').delete().neq('id', '')
               ]);
            } catch (error) {
               console.error('Failed to sync reset to Supabase:', error);
            }
         }

         setStudents(cleanStudents);
         setMurojaahEntries([]);
         setGharibEntries([]);
         setNotes([]);
         
         alert("Seluruh data berhasil di-reset ke nol! Halaman akan dimuat ulang.");
         window.location.reload();
      } catch (err: any) {
         console.error("Reset failed:", err);
         alert("Gagal melakukan reset data: " + err.message);
      } finally {
         setIsAppLoading(false);
      }
   };
   // Scroll listener to toggle header shadow in Laporan page
   const [isScrolled, setIsScrolled] = useState(false);

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
   }, [activePage]);

   // Determine if Quick Actions (FAB & Search) should be visible
   const showQuickActions = ['dashboard', 'riwayat'].includes(activePage) && user?.role !== 'student';

   const handleSearchClick = () => {
      setIsStudentSelectModalOpen(true);
   };

   const handleStudentSelect = (student: Student) => {
      setIsStudentSelectModalOpen(false);

      if (activePage === 'riwayat') {
         setHistoryStudent(student);
         setIsStudentHistoryModalOpen(true);
      } else {
         // handleInputNilai(student); // Deprecated
         setActivePage('input_setoran');
      }
   };

   // Report Helpers
   const getMonthOptions = () => {
      const options = [];
      const today = new Date();
      for (let i = 0; i < 6; i++) {
         const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
         const value = d.toISOString().slice(0, 7);
         const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
         options.push({ value, label });
      }
      return options;
   };

   const getDisplayMonthLabel = (ym: string) => {
      if (!ym) return '';
      const [y, m] = ym.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1);
      return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
   };

   if (isAppLoading) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-2">
               <div className="w-10 h-10 mx-auto rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
               <p className="text-sm font-medium text-gray-500">Menyiapkan data aplikasi...</p>
            </div>
         </div>
      );
   }

   if (!user) {
      return <LoginPage onLogin={handleLogin} students={students} />;
   }

   // Dashboard Stats
   const totalStudents = students.length;
   const avgScore = Math.round(students.reduce((acc, s) => acc + (s.lastScore || 0), 0) / totalStudents);
   const specialGuidanceStudents = students.filter(s => s.notes && s.notes.trim().length > 0);
   const specialGuidanceCount = specialGuidanceStudents.length;
   const unsubmittedStudents = students.filter(s => s.lastUpdate !== 'Baru saja');
   const unsubmittedCount = unsubmittedStudents.length;
   const submittedCount = totalStudents - unsubmittedCount;

   // Schedule Logic
   const getNextClassInfo = () => {
      const schedule = [
         { className: 'Kelas 5B', start: '07:00', end: '08:30' },
         { className: 'Kelas 5C', start: '08:30', end: '10:00' },
         { className: 'Kelas 5D', start: '10:15', end: '11:45' },
         { className: 'Kelas 6C', start: '13:00', end: '14:30' },
         { className: 'Kelas 6D', start: '14:30', end: '16:00' },
      ];

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      for (const slot of schedule) {
         const [startH, startM] = slot.start.split(':').map(Number);
         const [endH, endM] = slot.end.split(':').map(Number);
         const startTotal = startH * 60 + startM;
         const endTotal = endH * 60 + endM;

         if (currentMinutes >= startTotal && currentMinutes < endTotal) {
            return (
               <div className="flex items-center gap-2 text-emerald-100">
                  <span className="relative flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Sedang Berlangsung: {slot.className}</span>
               </div>
            );
         }

         if (currentMinutes < startTotal) {
            const diff = startTotal - currentMinutes;
            const hours = Math.floor(diff / 60);
            const mins = diff % 60;
            const timeString = hours > 0 ? `${hours} jam ${mins} menit` : `${mins} menit`;

            return (
               <div className="flex items-center gap-1 text-blue-100">
                  <span>Selanjutnya: {slot.className} ({timeString} lagi)</span>
               </div>
            );
         }
      }

      return "Jadwal hari ini selesai";
   };

   const renderContent = () => {
      switch (activePage) {
         case 'dashboard':
            return (
               <DashboardModern
                  user={user}
                  students={students}
                  onNavigate={setActivePage}
                  latestNote={notes[0] ?? null}
                  onMenuClick={() => setIsSidebarOpen(true)}
                  notifications={notifications}
                  onDismissNotification={handleDismissNotification}
                  onSearchClick={showQuickActions ? handleSearchClick : undefined}
                  unreadNotesCount={unreadNotesCount}
                  onResetData={handleResetData}
               />
            );
         case 'input_setoran':
            return (
               <SetoranPage
                  students={students}
                  onSave={handleSaveNilai}
                  preSelectedStudent={preSelectedStudent}
                  user={user}
                  onMenuClick={() => setIsSidebarOpen(true)}
                  notifications={notifications}
                  onDismissNotification={handleDismissNotification}
                  onSearchClick={showQuickActions ? handleSearchClick : undefined}
               />
            );
         case 'santri':
            return (
               <StudentList
                  students={students}
                  onInputNilai={(student) => {
                     setPreSelectedStudent(student);
                     setActivePage('input_setoran');
                  }}
                  onViewHistory={(student) => {
                     setProfileStudent(student);
                     setActivePage('profil_siswa');
                  }}
                  user={user}
                  onMenuClick={() => setIsSidebarOpen(true)}
                  notifications={notifications}
                  onDismissNotification={handleDismissNotification}
                  onSearchClick={showQuickActions ? handleSearchClick : undefined}
               />
            );


         case 'tartili':
            return (
               <TartiliPage
                  user={user}
                  students={students}
                  onMenuClick={() => setIsSidebarOpen(true)}
                  notifications={notifications}
                  onDismissNotification={handleDismissNotification}
                  onSearchClick={showQuickActions ? handleSearchClick : undefined}
                  unreadNotesCount={unreadNotesCount}
               />
            );
         case 'gharib':
            return (
               <GharibPage
                  user={user}
                  students={students}
                  history={gharibEntries}
                  onSaveEntry={handleSaveGharibEntry}
                  onUpdateEntry={handleUpdateGharibEntry}
                  onDeleteEntry={handleDeleteGharibEntry}
                  onMenuClick={() => setIsSidebarOpen(true)}
                  notifications={notifications}
                  onDismissNotification={handleDismissNotification}
                  onSearchClick={showQuickActions ? handleSearchClick : undefined}
               />
            );
          case 'riwayat':
             return (
                <MonitoringPage
                   students={students}
                   onQuickInput={(student) => {
                      setPreSelectedStudent(student);
                      setActivePage('input_setoran');
                   }}
                   user={user}
                   onMenuClick={() => setIsSidebarOpen(true)}
                   notifications={notifications}
                   onDismissNotification={handleDismissNotification}
                   onSearchClick={showQuickActions ? handleSearchClick : undefined}
                />
             );
          case 'hafalan':
             return (
                <HafalanPage
                   user={user}
                   students={students}
                   onMenuClick={() => setIsSidebarOpen(true)}
                   notifications={notifications}
                   onDismissNotification={handleDismissNotification}
                   onSearchClick={showQuickActions ? handleSearchClick : undefined}
                   unreadNotesCount={unreadNotesCount}
                />
             );
          case 'profil':
             return (
                <ProfilSiswaPage
                   user={user}
                   students={students}
                   onUpdateStudent={handleUpdateStudent}
                   onSaveProfile={handleUpdateUser}
                   onMenuClick={() => setIsSidebarOpen(true)}
                   notifications={notifications}
                   onDismissNotification={handleDismissNotification}
                   onSearchClick={showQuickActions ? handleSearchClick : undefined}
                   unreadNotesCount={unreadNotesCount}
                />
             );
          case 'profil_siswa':
              return (
                 <StudentProfilePage
                    student={profileStudent}
                    students={students}
                    user={user!}
                    onMenuClick={() => setIsSidebarOpen(true)}
                    notifications={notifications}
                    onDismissNotification={handleDismissNotification}
                    onSearchClick={showQuickActions ? handleSearchClick : undefined}
                    onBack={() => setActivePage('santri')}
                    onInputSetoran={(student) => {
                       setPreSelectedStudent(student);
                       setActivePage('input_setoran');
                    }}
                    onUpdateStudent={handleUpdateStudent}
                 />
              );
         case 'catatan':
            return (
               <CatatanPage
                  notes={notes}
                  onSaveNote={async (noteData) => {
                     const optimisticNote: Note = {
                        id: noteData.id ?? Date.now(),
                        title: noteData.title!,
                        content: noteData.content!,
                        category: noteData.category!,
                        date: noteData.date!,
                        color: noteData.color!,
                     };

                     setNotes(prev => {
                        const remaining = prev.filter(note => note.id !== optimisticNote.id);
                        return [optimisticNote, ...remaining].sort((a, b) => b.date.localeCompare(a.date));
                     });

                     if (!isSupabaseConfigured) {
                        return;
                     }

                     try {
                        const saved = await saveNote(noteData);
                        setNotes(prev => {
                           const remaining = prev.filter(note => note.id !== optimisticNote.id && note.id !== saved.id);
                           return [saved, ...remaining].sort((a, b) => b.date.localeCompare(a.date));
                        });
                     } catch (error) {
                        console.error('Failed to save note:', error);
                        alert('Catatan gagal disimpan ke Supabase.');
                     }
                  }}
                  onDeleteNote={async (id) => {
                     const previousNotes = notes;
                     setNotes(prev => prev.filter(note => note.id !== id));

                     if (!isSupabaseConfigured) {
                        return;
                     }

                     try {
                        await deleteNote(id);
                     } catch (error) {
                        console.error('Failed to delete note:', error);
                        setNotes(previousNotes);
                        alert('Catatan gagal dihapus dari Supabase.');
                     }
                  }}
                  isSyncing={isSupabaseConfigured}
                  user={user}
                  students={students}
                  onMenuClick={() => setIsSidebarOpen(true)}
                  notifications={notifications}
                  onDismissNotification={handleDismissNotification}
                  onSearchClick={showQuickActions ? handleSearchClick : undefined}
                  unreadNotesCount={unreadNotesCount}
               />
            );
         case 'murojaah':
            return (
               <MurojaahPage
                  user={user}
                  students={students}
                  schedule={murojaahEntries}
                  onSaveEntry={async (entry) => {
                     if (!isSupabaseConfigured) {
                        const localEntry = { ...entry, id: Date.now() };
                        setMurojaahEntries(prev => [localEntry, ...prev]);
                        return;
                     }

                     const saved = await createMurojaahEntry(entry);
                     setMurojaahEntries(prev => [saved, ...prev]);
                  }}
                  onDeleteEntry={handleDeleteMurojaahEntry}
                  onMenuClick={() => setIsSidebarOpen(true)}
                  notifications={notifications}
                  onDismissNotification={handleDismissNotification}
                  onSearchClick={showQuickActions ? handleSearchClick : undefined}
               />
            );
          case 'absensi':
             return (
                <AttendancePage
                   students={students}
                   user={user}
                   onMenuClick={() => setIsSidebarOpen(true)}
                   notifications={notifications}
                   onDismissNotification={handleDismissNotification}
                   onSearchClick={showQuickActions ? handleSearchClick : undefined}
                   unreadNotesCount={unreadNotesCount}
                />
             );
         case 'laporan':
            // Generate Report Data Logic with Start/End Progress
            const studentsInReportClass = students.filter(s => s.class === reportClass);

            // Detailed Surah Lists by Juz for mapping/resolving
            const surahs30 = [
               "An-Naba", "An-Nazi'at", "'Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin",
               "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr",
               "Al-Balad", "Ash-Shams", "Al-Lail", "Ad-Duhaa", "Ash-Sharh", "At-Tin",
               "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah",
               "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraish", "Al-Ma'un",
               "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Lahab", "Al-Ikhlas", "Al-Falaq", "An-Nas"
            ];
            const surahs29 = [
               "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn",
               "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat"
            ];
            const surahs28 = [
               "Al-Mujadila", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah",
               "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim"
            ];

            // Load real setoran logs from localStorage
            const setoranLogs = (() => {
               try {
                  return JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
               } catch (e) {
                  console.error('Failed to parse setoran logs:', e);
                  return [];
               }
            })();

            const reportData = studentsInReportClass.map(student => {
               // Use deterministic seed based on month and student for mock consistency
               const seed = student.name.length + parseInt(reportMonth.replace('-', ''));

               // Filter logs for this student in the selected month/range
               const studentLogs = setoranLogs.filter((log: any) => {
                  if (log.studentId !== student.id || !log.date) return false;
                  if (reportFilterMode === 'month') {
                     return log.date.startsWith(reportMonth);
                  } else {
                     const logDateStr = log.date.slice(0, 10); // YYYY-MM-DD
                     return logDateStr >= reportStartDate && logDateStr <= reportEndDate;
                  }
               }).sort((a: any, b: any) => a.date.localeCompare(b.date));

               let hafalanStartDisplay = "";
               let hafalanEndDisplay = "";
               let tartiliStart = "";
               let tartiliEnd = "";

               // Helper to clean Drill text from displays
               const cleanDrillText = (text: string) => {
                  if (!text) return "";
                  return text.replace(/Drill Munaqosah\s+/gi, "").replace(/Drill Tartili\s+/gi, "");
               };

               // 1. Hafalan Logs Calculation
               const hafalanLogs = studentLogs.filter((log: any) => log.type === 'Hafalan');
               const hafalanLanjutLogs = hafalanLogs.filter((log: any) => log.jenisSetoran === 'Lanjut');

               if (hafalanLanjutLogs.length > 0) {
                  hafalanStartDisplay = cleanDrillText(hafalanLanjutLogs[0].currentSurah);
                  hafalanEndDisplay = cleanDrillText(hafalanLanjutLogs[hafalanLanjutLogs.length - 1].currentSurah);
               } else {
                  // Fallback to database current state (cleaned)
                  let hafalanEndFull = cleanDrillText(student.currentSurah);
                  
                  if (!hafalanEndFull.includes(':')) {
                     // Mock fallback range based on seed if it's a simple name
                     const endVerse = 10 + (seed % 15);
                     hafalanEndFull = `${hafalanEndFull}: 1-${endVerse}`;
                  }

                  const currentSurahName = hafalanEndFull.split(':')[0].trim();
                  let currentIdx = surahs30.indexOf(currentSurahName);
                  if (currentIdx === -1) currentIdx = 5; // Fallback

                  let hafalanStart = "";
                  if (seed % 2 === 0 && currentIdx > 0) {
                     const prevSurah = surahs30[currentIdx - 1];
                     hafalanStart = `${prevSurah}: 15-End`;
                  } else {
                     hafalanStart = `${currentSurahName}: 1-5`;
                  }
                  
                  hafalanStartDisplay = cleanDrillText(hafalanStart);
                  hafalanEndDisplay = cleanDrillText(hafalanEndFull);
               }

               // Helper to resolve raw Juz text to a specific realistic Surah name in that Juz
               const resolveSurahName = (rawName: string, studentSeed: number) => {
                  const cleanName = rawName.trim();
                  if (cleanName.startsWith("Juz")) {
                     const match = cleanName.match(/Juz\s+(\d+)/i);
                     if (match) {
                        const juzNum = parseInt(match[1]);
                        if (juzNum === 30) return surahs30[studentSeed % surahs30.length];
                        if (juzNum === 29) return surahs29[studentSeed % surahs29.length];
                        if (juzNum === 28) return surahs28[studentSeed % surahs28.length];
                     }
                     return "An-Naba"; // default fallback surah
                  }
                  return cleanName;
               };

               // Format Hafalan displays to start and end verses with " : " separator, resolving Juz to Surah names
               if (hafalanStartDisplay.includes(':')) {
                  const [name, range] = hafalanStartDisplay.split(':');
                  let verse = range.trim();
                  if (range.includes('-')) {
                     verse = range.split('-')[0].trim();
                  }
                  const resolvedName = resolveSurahName(name, seed);
                  hafalanStartDisplay = `${resolvedName} : ${verse}`;
               } else {
                  const resolvedName = resolveSurahName(hafalanStartDisplay, seed);
                  const verseNum = 1 + (seed % 10);
                  hafalanStartDisplay = `${resolvedName} : ${verseNum}`;
               }

               if (hafalanEndDisplay.includes(':')) {
                  const [name, range] = hafalanEndDisplay.split(':');
                  let verse = range.trim();
                  if (range.includes('-')) {
                     verse = range.split('-')[1].trim();
                  }
                  const resolvedName = resolveSurahName(name, seed);
                  hafalanEndDisplay = `${resolvedName} : ${verse}`;
               } else {
                  const resolvedName = resolveSurahName(hafalanEndDisplay, seed);
                  const verseNum = 10 + (seed % 15);
                  hafalanEndDisplay = `${resolvedName} : ${verseNum}`;
               }

               // Calculate Drill Munaqosah (last Drill log for Hafalan in this period)
               let drillMunaqosah = "-";
               const hafalanDrillLogs = hafalanLogs.filter((log: any) => log.jenisSetoran === 'Drill');
               if (hafalanDrillLogs.length > 0) {
                  const lastDrillLog = hafalanDrillLogs[hafalanDrillLogs.length - 1];
                  const drillJuz = lastDrillLog.currentJuz || 30;
                  drillMunaqosah = `Drill Juz ${drillJuz}`;
               }

               // 2. Tartili Logs Calculation
               const tartiliLogs = studentLogs.filter((log: any) => log.type === 'Tartili' && (!log.currentSurah || !log.currentSurah.includes('Gharib')));
               const tartiliLanjutLogs = tartiliLogs.filter((log: any) => log.jenisSetoran === 'Lanjut');

               if (tartiliLanjutLogs.length > 0) {
                  const firstLog = tartiliLanjutLogs[0];
                  const lastLog = tartiliLanjutLogs[tartiliLanjutLogs.length - 1];
                  
                  const firstJilid = firstLog.iqraLevel || student.iqraLevel || 1;
                  const lastJilid = lastLog.iqraLevel || student.iqraLevel || 1;
                  const firstPage = firstLog.page || "1";
                  const lastPage = lastLog.page || "1";
                  
                  tartiliStart = `Jilid ${firstJilid} Hal. ${firstPage}`;
                  tartiliEnd = `Jilid ${lastJilid} Hal. ${lastPage}`;
               } else {
                  // Fallback to database current state (cleaned)
                  const currentPage = cleanDrillText(student.page || '10');
                  const startPage = Math.max(1, parseInt(currentPage) - 5 || 1);
                  tartiliStart = `Jilid ${student.iqraLevel || 1} Hal. ${startPage}`;
                  tartiliEnd = `Jilid ${student.iqraLevel || 1} Hal. ${currentPage}`;
               }

               // Calculate Drill Tartili (last Drill log for Tartili in this period)
               let drillTartili = "-";
               const tartiliDrillLogs = tartiliLogs.filter((log: any) => log.jenisSetoran === 'Drill');
               if (tartiliDrillLogs.length > 0) {
                  const lastDrillLog = tartiliDrillLogs[tartiliDrillLogs.length - 1];
                  const lastJilid = lastDrillLog.iqraLevel || student.iqraLevel || 1;
                  drillTartili = `Drill Tartili Jilid ${lastJilid}`;
               }

               // 3. Gharib Logs Calculation
               const studentGharibLogs = studentLogs.filter((log: any) => 
                  log.type === 'Tartili' && 
                  log.currentSurah && 
                  log.currentSurah.includes('Gharib')
               );
               
               let gharib = "-";
               if (studentGharibLogs.length > 0) {
                  const lastGharibLog = studentGharibLogs[studentGharibLogs.length - 1];
                  const cleanGharib = lastGharibLog.currentSurah
                     .replace(/Drill Gharib\s+/gi, "")
                     .replace(/Gharib\s+/gi, "")
                     .trim();
                     
                  let statusLabel = "";
                  if (lastGharibLog.status === 'Mumtaz') statusLabel = "Sangat Baik";
                  else if (lastGharibLog.status === 'Jayyid Jiddan' || lastGharibLog.status === 'Jayyid') statusLabel = "Baik";
                  else if (lastGharibLog.status === 'Perlu Bimbingan') statusLabel = "Cukup";
                  
                  gharib = statusLabel ? `${cleanGharib} - ${statusLabel}` : cleanGharib;
               }

               return {
                  ...student,
                  hafalanStart: cleanDrillText(hafalanStartDisplay),
                  hafalanEnd: cleanDrillText(hafalanEndDisplay),
                  drillMunaqosah: drillMunaqosah,
                  tartiliStart: cleanDrillText(tartiliStart),
                  tartiliEnd: cleanDrillText(tartiliEnd),
                  gharib: gharib,
                  drillTartili: drillTartili
               };
            });

            const downloadPDF = () => {
               generateMonthlyReportPDF({
                  logoUrl,
                  reportFilterMode,
                  reportMonth,
                  reportStartDate,
                  reportEndDate,
                  reportClass,
                  getDisplayMonthLabel,
                  reportData
               });
            };





            return (
               <div className="space-y-6 lg:space-y-0 lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden h-full animate-in fade-in duration-500">
                  {/* Sticky Container Wrapper */}
                  <div className="sticky top-4 z-30 bg-gradient-to-br from-white to-emerald-50/60 dark:from-[#121F18] dark:to-[#1A2E24]/30 p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-emerald-400 dark:border-[#1A2E24] flex justify-between items-center mt-4 sm:mt-6 mb-8 flex-none transition-all duration-300 no-print">
                     <Header
                        user={user}
                        onMenuClick={() => setIsSidebarOpen(true)}
                        notifications={notifications}
                        onDismissNotification={handleDismissNotification}
                        onSearchClick={showQuickActions ? handleSearchClick : undefined}
                        flat={true}
                        title="Laporan Bulanan"
                        subtitle="Pilih periode dan kelas untuk melihat laporan kemajuan hafalan."
                        actionButton={
                           <button
                              onClick={downloadPDF}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap"
                           >
                              <Download size={18} />
                              <span>Unduh PDF</span>
                           </button>
                        }
                     />
                  </div>

                  {/* Report Controls - Hidden on Print */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-4 no-print mb-6">
                     <div className="w-full">
                        <div className="flex flex-wrap items-end gap-4 w-full">
                           {/* Filter Mode Selector */}
                           <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mode Filter</label>
                              <div className="relative">
                                 <select
                                    value={reportFilterMode}
                                    onChange={(e) => setReportFilterMode(e.target.value as 'month' | 'range')}
                                    className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-w-[150px] h-[42px]"
                                 >
                                    <option value="month">Bulanan</option>
                                    <option value="range">Pilih Tanggal</option>
                                 </select>
                                 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                              </div>
                           </div>

                           {/* Rentang Waktu Input */}
                           {reportFilterMode === 'month' ? (
                              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rentang Waktu</label>
                                 <div className="relative h-[42px] min-w-[200px]">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors pointer-events-none w-full h-full justify-between">
                                       <span className="flex items-center gap-2"><Calendar size={16} /> {getDisplayMonthLabel(reportMonth)}</span>
                                       <ChevronDown size={16} />
                                    </div>
                                    <select
                                       value={reportMonth}
                                       onChange={(e) => setReportMonth(e.target.value)}
                                       className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                    >
                                       {getMonthOptions().map(opt => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                       ))}
                                    </select>
                                 </div>
                              </div>
                           ) : (
                              <>
                                 <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal Mulai</label>
                                    <input
                                       type="date"
                                       value={reportStartDate}
                                       onChange={(e) => setReportStartDate(e.target.value)}
                                       className="w-full pl-4 pr-4 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm h-[42px] min-w-[150px]"
                                    />
                                 </div>
                                 <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal Selesai</label>
                                    <input
                                       type="date"
                                       value={reportEndDate}
                                       onChange={(e) => setReportEndDate(e.target.value)}
                                       className="w-full pl-4 pr-4 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm h-[42px] min-w-[150px]"
                                    />
                                 </div>
                              </>
                           )}

                           {/* Class Selector */}
                           <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas</label>
                              <div className="relative">
                                 <select
                                    value={reportClass}
                                    onChange={(e) => setReportClass(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none min-w-[150px] h-[42px]"
                                 >
                                    {['5B', '5C', '5D', '6C', '6D'].map(cls => (
                                       <option key={cls} value={cls}>Kelas {cls}</option>
                                    ))}
                                 </select>
                                 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Wrapper Tabel Scroll Mandiri */}
                  <div className="flex-1 overflow-y-auto scrollbar-hide pb-10 pt-4 px-2 space-y-6">
                     {/* Report Table */}
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                         <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
                            <table className="w-full min-w-max text-sm text-left border-collapse">
                               <thead>
                                  <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-100">
                                     <th className="px-6 py-4 w-16 text-center sticky top-0 z-10 bg-gray-50 shadow-[inset_0_-2px_0_rgba(229,231,235,0.5)]">No</th>
                                     <th className="px-6 py-4 sticky top-0 z-10 bg-gray-50 shadow-[inset_0_-2px_0_rgba(229,231,235,0.5)]">Nama Siswa</th>
                                     <th className="px-6 py-4 text-center sticky top-0 z-10 bg-gray-50 shadow-[inset_0_-2px_0_rgba(229,231,235,0.5)]">Hafalan Awal</th>
                                     <th className="px-6 py-4 text-center sticky top-0 z-10 bg-gray-50 shadow-[inset_0_-2px_0_rgba(229,231,235,0.5)]">Hafalan Akhir</th>
                                     <th className="px-6 py-4 text-center sticky top-0 z-10 bg-gray-50 shadow-[inset_0_-2px_0_rgba(229,231,235,0.5)]">Drill Munaqosah</th>
                                     <th className="px-6 py-4 text-center sticky top-0 z-10 bg-gray-50 shadow-[inset_0_-2px_0_rgba(229,231,235,0.5)]">Tartili Awal</th>
                                     <th className="px-6 py-4 text-center sticky top-0 z-10 bg-gray-50 shadow-[inset_0_-2px_0_rgba(229,231,235,0.5)]">Tartili Akhir</th>
                                     <th className="px-6 py-4 text-center sticky top-0 z-10 bg-gray-50 shadow-[inset_0_-2px_0_rgba(229,231,235,0.5)]">Drill Tartili</th>
                                     <th className="px-6 py-4 text-center sticky top-0 z-10 bg-gray-50 shadow-[inset_0_-2px_0_rgba(229,231,235,0.5)]">Gharib</th>
                                  </tr>
                               </thead>
                                <tbody className="divide-y divide-gray-100">
                                   {reportData.map((student: any, idx) => {
                                      // Determine teacher color based on index
                                      const teacherIndex = idx % 3;
                                      const badgeColor = teacherIndex === 0 ? '#2563eb' : teacherIndex === 1 ? '#16a34a' : '#d97706';

                                      return (
                                         <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                               <div 
                                                  className="inline-flex items-center justify-center rounded-full font-bold text-white shadow-sm mx-auto"
                                                  style={{ 
                                                     width: '24px', 
                                                     height: '24px', 
                                                     fontSize: '11px',
                                                     lineHeight: '24px',
                                                     backgroundColor: badgeColor,
                                                     printColorAdjust: 'exact',
                                                     WebkitPrintColorAdjust: 'exact'
                                                  }}
                                               >
                                                  {idx + 1}
                                               </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                                            <td className="px-6 py-4 text-center text-gray-600">{student.hafalanStart}</td>
                                            <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{student.hafalanEnd}</td>
                                            <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{student.drillMunaqosah}</td>
                                            <td className="px-6 py-4 text-center text-gray-600">{student.tartiliStart}</td>
                                            <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{student.tartiliEnd}</td>
                                            <td className="px-6 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{student.drillTartili}</td>
                                            <td className={`px-6 py-4 text-center ${
                                               student.gharib !== '-' 
                                                  ? 'text-emerald-600 font-semibold' 
                                                  : 'text-gray-400 dark:text-[#8BA398]'
                                            }`}>
                                               {student.gharib}
                                            </td>
                                         </tr>
                                      );
                                   })}
                                </tbody>
                            </table>
                         </div>
                         {reportData.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                               Tidak ada data siswa untuk kelas ini.
                            </div>
                         )}
                      </div>

                      {/* Legend Info */}
                      <div className="mt-6 flex flex-wrap gap-6 items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 no-print">
                         <div className="flex items-center gap-2">
                            <div 
                               className="rounded-full shadow-sm"
                               style={{ 
                                  width: '20px', 
                                  height: '20px', 
                                  backgroundColor: '#2563eb',
                                  printColorAdjust: 'exact',
                                  WebkitPrintColorAdjust: 'exact'
                               }}
                            ></div>
                            <span className="text-sm font-medium text-gray-700">Warna 1: Ustadz Nawfal</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div 
                               className="rounded-full shadow-sm"
                               style={{ 
                                  width: '20px', 
                                  height: '20px', 
                                  backgroundColor: '#16a34a',
                                  printColorAdjust: 'exact',
                                  WebkitPrintColorAdjust: 'exact'
                               }}
                            ></div>
                            <span className="text-sm font-medium text-gray-700">Warna 2: Ustadzah Ining</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div 
                               className="rounded-full shadow-sm"
                               style={{ 
                                  width: '20px', 
                                  height: '20px', 
                                  backgroundColor: '#d97706',
                                  printColorAdjust: 'exact',
                                  WebkitPrintColorAdjust: 'exact'
                               }}
                            ></div>
                            <span className="text-sm font-medium text-gray-700">Warna 3: Ustadzah Rahma</span>
                         </div>
                      </div>
                   </div>
                </div>
            );

         case 'settings':
            return (
               <SettingsPage
                  user={user}
                  onSaveProfile={handleUpdateUser}
                  academicYear={academicYear}
                  setAcademicYear={setAcademicYear}
                  targets={targets}
                  setTargets={setTargets}
                  teachers={teachers}
                  setTeachers={setTeachers}
                  onBackup={handleBackup}
                  onRestore={handleRestore}
                  onResetData={handleResetData}
                  onMenuClick={() => setIsSidebarOpen(true)}
                  notifications={notifications}
                  onDismissNotification={handleDismissNotification}
                  onSearchClick={showQuickActions ? handleSearchClick : undefined}
               />
             );
         default:
            return <div>Halaman tidak ditemukan</div>;
      }
   };

    const getMobileTabs = () => {
       const isStudent = (user?.role as string) === 'student' || (user?.role as string) === 'siswa';
       if (isStudent) {
          return [
             { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
             { id: 'hafalan', label: 'Hafalan', icon: BookOpen },
             { id: 'tartili', label: 'Tartili', icon: Scroll },
             { id: 'catatan', label: 'Catatan', icon: BookOpen, showBadge: true },
             { id: 'absensi', label: 'Absensi', icon: FileText },
             { id: 'profil', label: 'Profil', icon: UserIcon },
             { id: 'logout', label: 'Keluar', icon: LogOut, isLogout: true }
          ];
       } else {
          return [
             { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
             { id: 'input_setoran', label: 'Setor', icon: PlusCircle },
             { id: 'tartili', label: 'Tartili', icon: Scroll },
             { id: 'catatan', label: 'Catatan', icon: BookOpen, showBadge: true },
             { id: 'murojaah', label: 'Murojaah', icon: RotateCw },
             { id: 'gharib', label: 'Gharib', icon: BookOpen },
             { id: 'santri', label: 'Data Siswa', icon: Users },
             { id: 'riwayat', label: 'Monitoring', icon: History },
             { id: 'laporan', label: 'Laporan', icon: FileText },
             { id: 'absensi', label: 'Absensi', icon: FileText },
             { id: 'settings', label: 'Settings', icon: Settings },
             { id: 'logout', label: 'Keluar', icon: LogOut, isLogout: true }
          ];
       }
    };

   return (
      <div className="flex h-screen bg-gray-50 dark:bg-[#09120E] font-sans transition-colors duration-300">
   {loadError && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl shadow-sm text-sm">
               {loadError}
            </div>
         )}
         <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            activePage={activePage}
            onNavigate={(page) => {
               if (page === 'input_setoran') {
                  setPreSelectedStudent(null);
               }
               if (page !== 'catatan') {
                  window.location.hash = '';
               }
               setActivePage(page);
               if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            onLogout={handleLogout}
            user={user}
            unreadNotesCount={unreadNotesCount}
         />

          <div className="flex-1 flex flex-col h-screen overflow-hidden relative pb-20 lg:pb-0">
             <main className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-8 !pt-0 scroll-smooth flex flex-col">
                {!['riwayat', 'santri', 'laporan', 'absensi', 'input_setoran', 'dashboard', 'catatan', 'murojaah', 'settings', 'tartili', 'gharib', 'profil_siswa', 'hafalan', 'profil'].includes(activePage) && (
                   <Header
                      user={user}
                      onMenuClick={() => setIsSidebarOpen(true)}
                      notifications={notifications}
                      onDismissNotification={handleDismissNotification}
                      onSearchClick={showQuickActions ? handleSearchClick : undefined}
                      showGreeting={true}
                   />
                )}
                <div key={activePage} className="animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out w-full flex-1 flex flex-col min-h-0">
                   <Suspense fallback={<PageLoader />}>
                      {renderContent()}
                   </Suspense>
                </div>
             </main>
 
              {/* Bottom Navigation Bar for Mobile */}
              {user && (
                 <div className="lg:hidden fixed bottom-4 left-6 right-6 z-40 bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1E382B] shadow-[0_8px_30px_rgba(0,0,0,0.12)] h-14 rounded-full flex items-center pl-10 pr-6 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden select-none gap-x-6 transition-colors">
                    {getMobileTabs().map((tab) => {
                       const Icon = tab.icon;
                       const isActive = activePage === tab.id;
                       const isLogout = tab.isLogout;
                       
                       return (
                          <button
                             key={tab.id}
                             onClick={() => {
                                if (isLogout) {
                                   setShowMobileLogoutConfirm(true);
                                } else {
                                   if (tab.id === 'input_setoran') {
                                      setPreSelectedStudent(null);
                                   }
                                   if (tab.id !== 'catatan') {
                                      window.location.hash = '';
                                   }
                                   setActivePage(tab.id);
                                }
                             }}
                             className={`flex items-center gap-1.5 flex-shrink-0 pl-4 pr-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 relative select-none cursor-pointer ${
                                isActive 
                                   ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-[#09120E] scale-105 shadow-md shadow-emerald-600/10' 
                                   : isLogout
                                      ? 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300'
                                      : 'text-slate-700 dark:text-[#9FB8AB] hover:text-slate-900 dark:hover:text-white'
                             }`}
                          >
                             <Icon size={15} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-200" />
                             <span className="tracking-tight leading-none">{tab.label}</span>
                             {tab.showBadge && unreadNotesCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-[#121F18] animate-pulse">
                                   {unreadNotesCount > 99 ? '99+' : unreadNotesCount}
                                </span>
                             )}
                          </button>
                       );
                    })}
                 </div>
              )}

            {/* Mobile Logout Confirmation Modal */}
            {showMobileLogoutConfirm && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white dark:bg-[#121F18] border border-transparent dark:border-[#1A2E24] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-content">
                     <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mb-4 border border-red-100 dark:border-red-900/30">
                           <LogOut size={28} className="text-red-500 ml-1" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-[#E2EAE5] mb-2">Konfirmasi Logout</h3>
                        <p className="text-gray-500 dark:text-[#8BA398] text-sm mb-6 leading-relaxed">
                           Apakah Anda yakin ingin keluar dari aplikasi? <br />Anda harus login kembali untuk mengakses data.
                        </p>
                        <div className="flex gap-3 w-full">
                           <button
                              onClick={() => setShowMobileLogoutConfirm(false)}
                              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-[#1A2E24] text-gray-700 dark:text-[#E2EAE5] font-bold hover:bg-gray-50 dark:hover:bg-[#1C3026] transition-colors text-sm cursor-pointer"
                           >
                              Batal
                           </button>
                           <button
                              onClick={() => {
                                 setShowMobileLogoutConfirm(false);
                                 handleLogout();
                              }}
                              className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all transform hover:-translate-y-0.5 text-sm cursor-pointer"
                           >
                              Ya, Keluar
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>

         <StudentSelectModal
            isOpen={isStudentSelectModalOpen}
            onClose={() => setIsStudentSelectModalOpen(false)}
            students={students}
            onSelect={handleStudentSelect}
         />

         <ScheduleModal
            isOpen={isScheduleModalOpen}
            onClose={() => setIsScheduleModalOpen(false)}
         />

         <ScoreDetailModal
            isOpen={isScoreDetailModalOpen}
            onClose={() => setIsScoreDetailModalOpen(false)}
            title="Detail Rata-rata"
            subtitle="Statistik hafalan dan tartili siswa"
         >
            <AverageDetailsView students={students} />
         </ScoreDetailModal>
         <ScoreDetailModal
            isOpen={isUnsubmittedModalOpen}
            onClose={() => setIsUnsubmittedModalOpen(false)}
            students={unsubmittedStudents}
            title="Siswa Belum Setoran"
            subtitle="Daftar siswa yang belum melakukan setoran hari ini"
         >
            <UnsubmittedListView students={unsubmittedStudents} />
         </ScoreDetailModal>
         <ScoreDetailModal
            isOpen={isSpecialGuidanceModalOpen}
            onClose={() => setIsSpecialGuidanceModalOpen(false)}
            students={specialGuidanceStudents}
            title="Siswa Bimbingan Khusus"
            subtitle="Daftar siswa yang memiliki catatan khusus"
         >
            <SpecialGuidanceListView students={specialGuidanceStudents} />
         </ScoreDetailModal>
          <StudentHistoryModal
             isOpen={isStudentHistoryModalOpen}
             onClose={() => setIsStudentHistoryModalOpen(false)}
             student={historyStudent}
          />


          {/* Global Toast Notification */}
          <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all duration-300 ease-in-out transform ${
              globalToastShow ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
          }`}>
              <CheckCircle2 size={20} className="text-white shrink-0" />
              <span className="text-sm font-bold">{globalToastMsg}</span>
          </div>
       </div>
    );
}

export default App;
