import { useState, useEffect, useCallback } from 'react';
import { Student, Note, MurojaahEntry, GharibEntry, AcademicYear, Target, Teacher, UjianTartiliEntry } from '../types';
import { DEFAULT_ACADEMIC_YEAR, DEFAULT_TARGETS, DEFAULT_TEACHERS, INITIAL_MUROJAAH_ENTRIES, INITIAL_NOTES, INITIAL_STUDENTS } from '../constants';
import {
  loadStudents, saveStudent, loadNotes, saveNote, deleteNote,
  loadMurojaahEntries, createMurojaahEntry, deleteMurojaahEntry,
  loadGharibEntries, createGharibEntry, updateGharibEntry, deleteGharibEntry,
  loadAppSettings, saveAppSettings, seedStudents, seedNotes, seedMurojaahEntries,
  createSetoranLog, deleteStudent,
  loadUjianTartiliEntries, createUjianTartiliEntry, updateUjianTartiliEntry, deleteUjianTartiliEntry
} from '../services/appData';
import { useToast } from '../context/ToastContext';

export function useTqaData() {
  const { showToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [murojaahEntries, setMurojaahEntries] = useState<MurojaahEntry[]>([]);
  const [gharibEntries, setGharibEntries] = useState<GharibEntry[]>([]);
  const [ujianTartiliEntries, setUjianTartiliEntries] = useState<UjianTartiliEntry[]>([]);
  const [academicYear, setAcademicYear] = useState<AcademicYear>(DEFAULT_ACADEMIC_YEAR);
  const [targets, setTargets] = useState<Target[]>(DEFAULT_TARGETS);
  const [teachers, setTeachers] = useState<Teacher[]>(DEFAULT_TEACHERS);
  
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      try {
        setIsAppLoading(true);
        const [loadedStudents, loadedNotes, loadedMurojaah, loadedGharib, loadedSettings, loadedUjian] = await Promise.all([
          loadStudents(),
          loadNotes(),
          loadMurojaahEntries(),
          loadGharibEntries(),
          loadAppSettings(),
          loadUjianTartiliEntries()
        ]);

        if (!isMounted) return;

        setStudents(loadedStudents);
        setNotes(loadedNotes);
        setMurojaahEntries(loadedMurojaah);
        setGharibEntries(loadedGharib);
        setUjianTartiliEntries(loadedUjian);

        if (loadedSettings) {
          if (loadedSettings.academicYear) setAcademicYear(loadedSettings.academicYear);
          if (loadedSettings.targets) setTargets(loadedSettings.targets);
          if (loadedSettings.teachers) setTeachers(loadedSettings.teachers);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setLoadError(err?.message || 'Gagal memuat data awal');
        showToast('Gagal memuat data dari database', 'error');
      } finally {
        if (isMounted) setIsAppLoading(false);
      }
    }

    initData();
    return () => { isMounted = false; };
  }, [showToast]);

  // Handler Save/Update Student & Setoran
  const handleSaveStudent = useCallback(async (id: string, updatedData: Partial<Student> & { date?: string }) => {
    let updatedStudentObj: Student | undefined;

    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        updatedStudentObj = { ...s, ...updatedData };
        return updatedStudentObj;
      }
      return s;
    }));

    if (!updatedStudentObj) return;

    try {
      await saveStudent(updatedStudentObj);
      showToast(`Setoran ${updatedStudentObj.name} berhasil disimpan`, 'success');
    } catch (err: any) {
      showToast(`Tersimpan lokal. Gagal sinkron Supabase: ${err?.message || err}`, 'warning');
    }

    if (updatedData.type && updatedData.currentSurah) {
      try {
        await createSetoranLog({
          student_id: id,
          student_name: updatedStudentObj.name,
          class_name: updatedStudentObj.class,
          type: updatedData.type,
          current_juz: updatedData.currentJuz,
          current_surah: updatedData.currentSurah,
          jenis_setoran: updatedData.jenisSetoran || 'Lanjut',
          iqra_level: updatedData.iqraLevel,
          page: updatedData.page,
          status: updatedData.status || 'Jayyid',
          last_score: updatedData.lastScore,
          notes: updatedData.notes,
          date: updatedData.date || new Date().toISOString()
        });
      } catch (err: any) {
        console.warn('Setoran log error:', err);
      }
    }
  }, [showToast]);

  // Handler Delete Student
  const handleDeleteStudent = useCallback(async (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    try {
      await deleteStudent(studentId);
      showToast('Siswa berhasil dihapus', 'success');
    } catch (err: any) {
      showToast(`Gagal menghapus dari database: ${err?.message || err}`, 'error');
    }
  }, [showToast]);

  // Handler Save Note
  const handleSaveNote = useCallback(async (note: Omit<Note, 'id'>) => {
    const newId = Date.now();
    const fullNote: Note = { ...note, id: newId };
    setNotes(prev => [fullNote, ...prev]);

    try {
      await saveNote(fullNote);
      showToast('Catatan berhasil disimpan', 'success');
    } catch (err: any) {
      showToast(`Catatan tersimpan lokal: ${err?.message || err}`, 'warning');
    }
  }, [showToast]);

  // Handler Delete Note
  const handleDeleteNote = useCallback(async (noteId: number) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    try {
      await deleteNote(noteId);
      showToast('Catatan dihapus', 'info');
    } catch (err: any) {
      showToast(`Gagal menghapus catatan: ${err?.message || err}`, 'error');
    }
  }, [showToast]);

  // Handler Create Murojaah
  const handleCreateMurojaah = useCallback(async (entry: Omit<MurojaahEntry, 'id'>) => {
    const newEntry: MurojaahEntry = { ...entry, id: Date.now() };
    setMurojaahEntries(prev => [newEntry, ...prev]);

    try {
      await createMurojaahEntry(newEntry);
      showToast('Kegiatan murojaah berhasil ditambahkan', 'success');
    } catch (err: any) {
      showToast(`Murojaah tersimpan lokal: ${err?.message || err}`, 'warning');
    }
  }, [showToast]);

  // Handler Delete Murojaah
  const handleDeleteMurojaah = useCallback(async (id: number) => {
    setMurojaahEntries(prev => prev.filter(m => m.id !== id));
    try {
      await deleteMurojaahEntry(id);
      showToast('Data murojaah dihapus', 'info');
    } catch (err: any) {
      showToast(`Gagal menghapus data murojaah: ${err?.message || err}`, 'error');
    }
  }, [showToast]);

  // Handler Create Gharib
  const handleCreateGharib = useCallback(async (entry: Omit<GharibEntry, 'id'>) => {
    const newEntry: GharibEntry = { ...entry, id: Date.now().toString() };
    setGharibEntries(prev => [newEntry, ...prev]);

    try {
      await createGharibEntry(newEntry);
      showToast('Data Gharib berhasil ditambahkan', 'success');
    } catch (err: any) {
      showToast(`Gharib tersimpan lokal: ${err?.message || err}`, 'warning');
    }
  }, [showToast]);

  // Handler Update Gharib
  const handleUpdateGharib = useCallback(async (id: string, updated: Partial<GharibEntry>) => {
    let updatedObj: GharibEntry | undefined;
    setGharibEntries(prev => prev.map(item => {
      if (item.id === id) {
        updatedObj = { ...item, ...updated };
        return updatedObj;
      }
      return item;
    }));

    try {
      if (updatedObj) {
        await updateGharibEntry(updatedObj);
        showToast('Jurnal Gharib diperbarui', 'success');
      }
    } catch (err: any) {
      showToast(`Perubahan Gharib tersimpan lokal: ${err?.message || err}`, 'warning');
    }
  }, [showToast]);

  // Handler Delete Gharib
  const handleDeleteGharib = useCallback(async (id: string) => {
    setGharibEntries(prev => prev.filter(item => item.id !== id));

    try {
      await deleteGharibEntry(id);
      showToast('Data Gharib dihapus', 'info');
    } catch (err: any) {
      showToast(`Gagal menghapus data Gharib: ${err?.message || err}`, 'error');
    }
  }, [showToast]);

  // Handler Create Ujian Tartili
  const handleCreateUjianTartili = useCallback(async (entry: Omit<UjianTartiliEntry, 'id'>) => {
    const newEntry: UjianTartiliEntry = { ...entry, id: Date.now() };
    setUjianTartiliEntries(prev => [newEntry, ...prev]);

    try {
      await createUjianTartiliEntry(newEntry);
      showToast('Jadwal ujian berhasil ditambahkan', 'success');
    } catch (err: any) {
      showToast(`Jadwal ujian tersimpan lokal: ${err?.message || err}`, 'warning');
    }
  }, [showToast]);

  // Handler Update Ujian Tartili
  const handleUpdateUjianTartili = useCallback(async (entry: UjianTartiliEntry) => {
    setUjianTartiliEntries(prev => prev.map(item => item.id === entry.id ? entry : item));

    try {
      await updateUjianTartiliEntry(entry);
      showToast('Jadwal ujian berhasil diperbarui', 'success');
    } catch (err: any) {
      showToast(`Perubahan ujian tersimpan lokal: ${err?.message || err}`, 'warning');
    }
  }, [showToast]);

  // Handler Delete Ujian Tartili
  const handleDeleteUjianTartili = useCallback(async (id: string | number) => {
    setUjianTartiliEntries(prev => prev.filter(item => item.id !== id));

    try {
      await deleteUjianTartiliEntry(id);
      showToast('Jadwal ujian berhasil dihapus', 'info');
    } catch (err: any) {
      showToast(`Gagal menghapus jadwal ujian: ${err?.message || err}`, 'error');
    }
  }, [showToast]);

  // Handler Save Settings
  const handleSaveSettings = useCallback(async (newYear: AcademicYear, newTargets: Target[], newTeachers: Teacher[]) => {
    setAcademicYear(newYear);
    setTargets(newTargets);
    setTeachers(newTeachers);

    try {
      await saveAppSettings({ academicYear: newYear, targets: newTargets, teachers: newTeachers });
      showToast('Pengaturan aplikasi berhasil disimpan', 'success');
    } catch (err: any) {
      showToast(`Pengaturan tersimpan lokal: ${err?.message || err}`, 'warning');
    }
  }, [showToast]);

  // Handler Reset All Data
  const handleResetAllData = useCallback(async () => {
    const cleanStudents = INITIAL_STUDENTS.map(s => ({
      ...s,
      currentJuz: undefined,
      currentSurah: '-',
      iqraLevel: 1,
      page: '',
      totalProgress: 0,
      lastUpdate: 'Belum ada setoran',
      lastScore: undefined,
      status: 'Perlu Bimbingan' as Student['status'],
      notes: '',
      requiresAttention: false
    }));

    setStudents(cleanStudents);
    setNotes(INITIAL_NOTES);
    setMurojaahEntries(INITIAL_MUROJAAH_ENTRIES);
    setGharibEntries([]);
    setUjianTartiliEntries([]);

    try {
      await seedStudents(cleanStudents);
      await seedNotes(INITIAL_NOTES);
      await seedMurojaahEntries(INITIAL_MUROJAAH_ENTRIES);
      showToast('Seluruh data berhasil di-reset!', 'success');
    } catch (err: any) {
      showToast(`Gagal mereset data: ${err?.message || err}`, 'error');
    }
  }, [showToast]);

  return {
    students,
    notes,
    murojaahEntries,
    gharibEntries,
    ujianTartiliEntries,
    academicYear,
    targets,
    teachers,
    isAppLoading,
    loadError,
    handleSaveStudent,
    handleDeleteStudent,
    handleSaveNote,
    handleDeleteNote,
    handleCreateMurojaah,
    handleDeleteMurojaah,
    handleCreateGharib,
    handleUpdateGharib,
    handleDeleteGharib,
    handleCreateUjianTartili,
    handleUpdateUjianTartili,
    handleDeleteUjianTartili,
    handleSaveSettings,
    handleResetAllData
  };
}
