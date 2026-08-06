import { supabase } from '../lib/supabase';
import { AcademicYear, MurojaahEntry, Note, Student, Target, Teacher, GharibEntry, AttendanceRecord, PersonalMessage, TartiliEntry } from '../types';


type AppSettingsPayload = {
  academicYear: AcademicYear;
  targets: Target[];
  teachers: Teacher[];
};

const ensureSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY.');
  }

  return supabase;
};

const mapStudentFromRow = (row: any): Student => ({
  id: row.id,
  name: (row.name || '').toUpperCase(),
  class: row.class_name,
  avatar: row.avatar,
  type: row.type ?? undefined,
  currentJuz: row.current_juz ?? undefined,
  currentSurah: row.current_surah,
  jenisSetoran: row.jenis_setoran ?? undefined,
  iqraLevel: row.iqra_level ?? undefined,
  page: row.page ?? undefined,
  totalProgress: row.total_progress,
  lastUpdate: row.last_update,
  lastScore: row.last_score ?? undefined,
  status: row.status,
  notes: row.notes ?? undefined,
  requiresAttention: row.requires_attention ?? false,
});

const mapStudentToRow = (student: Student) => ({
  id: student.id,
  name: (student.name || '').toUpperCase(),
  class_name: student.class,
  avatar: student.avatar,
  type: student.type ?? null,
  current_juz: student.currentJuz ?? null,
  current_surah: student.currentSurah,
  jenis_setoran: student.jenisSetoran ?? null,
  iqra_level: student.iqraLevel ?? null,
  page: student.page ?? null,
  total_progress: student.totalProgress,
  last_update: student.lastUpdate,
  last_score: student.lastScore ?? null,
  status: student.status,
  notes: student.notes ?? null,
  requires_attention: student.requiresAttention ?? false,
  updated_at: new Date().toISOString(),
});

const mapNoteFromRow = (row: any): Note => ({
  id: row.id,
  title: row.title,
  content: row.content,
  category: row.category,
  date: row.note_date,
  color: row.color,
});

const mapNoteToRow = (note: Omit<Note, 'id'> & Partial<Pick<Note, 'id'>>) => ({
  ...(note.id ? { id: note.id } : {}),
  title: note.title,
  content: note.content,
  category: note.category,
  note_date: note.date,
  color: note.color,
  updated_at: new Date().toISOString(),
});

const mapMurojaahFromRow = (row: any): MurojaahEntry => ({
  id: row.id,
  juz: row.juz,
  surah: row.surah,
  status: row.status,
  date: row.entry_date,
  score: row.score ?? undefined,
  type: row.type,
  className: row.class_name ?? undefined,
});

const mapMurojaahToRow = (entry: Omit<MurojaahEntry, 'id'> & Partial<Pick<MurojaahEntry, 'id'>>) => ({
  ...(entry.id ? { id: entry.id } : {}),
  juz: entry.juz,
  surah: entry.surah,
  status: entry.status,
  entry_date: entry.date,
  score: entry.score ?? null,
  type: entry.type,
  class_name: entry.className ?? null,
  updated_at: new Date().toISOString(),
});

export const loadStudents = async (): Promise<Student[]> => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('students')
    .select('*')
    .order('class_name', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapStudentFromRow);
};

export const seedStudents = async (students: Student[]): Promise<void> => {
  const client = ensureSupabase();
  const { error } = await client.from('students').upsert(students.map(mapStudentToRow));

  if (error) {
    throw error;
  }
};

export const saveStudent = async (student: Student): Promise<void> => {
  const client = ensureSupabase();
  const { error } = await client.from('students').upsert(mapStudentToRow(student));

  if (error) {
    throw error;
  }
};

export const deleteStudent = async (studentId: string): Promise<void> => {
  const client = ensureSupabase();
  const { error } = await client.from('students').delete().eq('id', studentId);

  if (error) {
    throw error;
  }
};

export const loadAppSettings = async (): Promise<AppSettingsPayload | null> => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('app_settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    academicYear: data.academic_year,
    targets: data.targets ?? [],
    teachers: data.teachers ?? [],
  };
};

export const saveAppSettings = async (settings: AppSettingsPayload): Promise<void> => {
  const client = ensureSupabase();
  const { error } = await client.from('app_settings').upsert({
    id: 'default',
    academic_year: settings.academicYear,
    targets: settings.targets,
    teachers: settings.teachers,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
};

export const loadNotes = async (): Promise<Note[]> => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('notes')
    .select('*')
    .order('note_date', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapNoteFromRow);
};

export const seedNotes = async (notes: Note[]): Promise<void> => {
  const client = ensureSupabase();
  const { error } = await client.from('notes').upsert(notes.map(mapNoteToRow));

  if (error) {
    throw error;
  }
};

export const saveNote = async (note: Omit<Note, 'id'> & Partial<Pick<Note, 'id'>>): Promise<Note> => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('notes')
    .upsert(mapNoteToRow(note))
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapNoteFromRow(data);
};

export const deleteNote = async (id: number): Promise<void> => {
  const client = ensureSupabase();
  const { error } = await client.from('notes').delete().eq('id', id);

  if (error) {
    throw error;
  }
};

export const loadMurojaahEntries = async (): Promise<MurojaahEntry[]> => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('murojaah_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMurojaahFromRow);
};

export const seedMurojaahEntries = async (entries: MurojaahEntry[]): Promise<void> => {
  const client = ensureSupabase();
  const { error } = await client.from('murojaah_entries').upsert(entries.map(mapMurojaahToRow));

  if (error) {
    throw error;
  }
};

export const createMurojaahEntry = async (entry: Omit<MurojaahEntry, 'id'>): Promise<MurojaahEntry> => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('murojaah_entries')
    .insert(mapMurojaahToRow({ ...entry, id: Date.now() }))
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapMurojaahFromRow(data);
};

export const deleteMurojaahEntry = async (id: string | number): Promise<void> => {
  const client = ensureSupabase();
  const { error } = await client
    .from('murojaah_entries')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};


const mapGharibFromRow = (row: any): GharibEntry => ({
  id: row.id,
  className: row.kelas,
  date: row.tanggal,
  status: row.status_pembelajaran,
  material: row.materi_halaman,
  notes: row.catatan ?? undefined,
});

const mapGharibToRow = (entry: Omit<GharibEntry, 'id'> & Partial<Pick<GharibEntry, 'id'>>) => ({
  ...(entry.id ? { id: entry.id } : {}),
  kelas: entry.className,
  tanggal: entry.date,
  status_pembelajaran: entry.status,
  materi_halaman: entry.material,
  catatan: entry.notes ?? null,
});

export const loadGharibEntries = async (): Promise<GharibEntry[]> => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('jurnal_gharib')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapGharibFromRow);
};

export const createGharibEntry = async (entry: Omit<GharibEntry, 'id'>): Promise<GharibEntry> => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('jurnal_gharib')
    .insert([mapGharibToRow(entry)])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapGharibFromRow(data);
};

export const updateGharibEntry = async (entry: GharibEntry): Promise<GharibEntry> => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('jurnal_gharib')
    .upsert(mapGharibToRow(entry))
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapGharibFromRow(data);
};

export const deleteGharibEntry = async (id: string | number): Promise<void> => {
  const client = ensureSupabase();
  const { error } = await client
    .from('jurnal_gharib')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};

const mapSetoranLogFromRow = (row: any) => ({
  id: row.id,
  studentId: row.student_id,
  studentName: (row.student_name || '').toUpperCase(),
  class: row.class_name,
  type: row.type,
  currentSurah: row.current_surah,
  currentJuz: row.current_juz,
  jenisSetoran: row.jenis_setoran,
  iqraLevel: row.iqra_level,
  page: row.page,
  score: row.score,
  status: row.status,
  notes: row.notes,
  requiresAttention: row.requires_attention ?? false,
  isRead: row.is_read ?? false,
  date: row.created_at,
});

const mapSetoranLogToRow = (log: any) => ({
  student_id: log.studentId,
  student_name: (log.studentName || '').toUpperCase(),
  class_name: log.class,
  type: log.type,
  current_surah: log.currentSurah,
  current_juz: log.currentJuz ?? null,
  jenis_setoran: log.jenisSetoran,
  iqra_level: log.iqraLevel ?? null,
  page: log.page ?? null,
  score: log.score ?? null,
  status: log.status ?? null,
  notes: log.notes ?? null,
  requires_attention: log.requiresAttention ?? false,
  is_read: log.isRead ?? false,
  created_at: log.date || new Date().toISOString(),
});

export const createSetoranLog = async (log: any): Promise<any> => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('setoran')
    .insert([mapSetoranLogToRow(log)])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapSetoranLogFromRow(data);
};

export const updateSetoranLog = async (log: any): Promise<any> => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('setoran')
    .update(mapSetoranLogToRow(log))
    .eq('id', log.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapSetoranLogFromRow(data);
};

export const deleteSetoranLog = async (id: string | number): Promise<void> => {
  const client = ensureSupabase();
  const { error } = await client
    .from('setoran')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};


export const loadSetoranLogs = async (date: string, className: string): Promise<any[]> => {
  const client = ensureSupabase();
  // Construct local start and end times, then convert to UTC ISO strings
  const localStart = new Date(`${date}T00:00:00`);
  const localEnd = new Date(`${date}T23:59:59.999`);
  const start = localStart.toISOString();
  const end = localEnd.toISOString();

  let query = client
    .from('setoran')
    .select('*')
    .gte('created_at', start)
    .lte('created_at', end);

  if (className !== 'Semua') {
     query = query.eq('class_name', className);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapSetoranLogFromRow);
};

export const loadClassSetoranLogs = async (className: string): Promise<any[]> => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('setoran')
    .select('*')
    .eq('class_name', className)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapSetoranLogFromRow);
};

export const loadStudentSetoranLogs = async (studentId: string): Promise<any[]> => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('setoran')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapSetoranLogFromRow);
};

const mapAttendanceFromRow = (row: any): AttendanceRecord => ({
  id: row.id,
  studentId: row.student_id,
  studentName: (row.student_name || '').toUpperCase(),
  class: row.class_name,
  status: row.status,
  date: row.attendance_date,
  createdAt: row.created_at,
});

const mapAttendanceToRow = (record: AttendanceRecord) => ({
  id: record.id,
  student_id: record.studentId,
  student_name: (record.studentName || '').toUpperCase(),
  class_name: record.class,
  status: record.status,
  attendance_date: record.date,
  updated_at: new Date().toISOString(),
});

export const loadAttendanceLogs = async (date: string, className: string): Promise<AttendanceRecord[]> => {
  try {
    const client = ensureSupabase();
    let query = client
      .from('attendance')
      .select('*')
      .eq('attendance_date', date);

    if (className !== 'Semua') {
      query = query.eq('class_name', className);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapAttendanceFromRow);
  } catch (error) {
    console.warn('Failed to load from Supabase, loading from localStorage:', error);
    const localLogs = JSON.parse(localStorage.getItem('tqa_attendance_logs') || '[]');
    return localLogs.filter((log: AttendanceRecord) => 
      log.date === date && (className === 'Semua' || log.class === className)
    );
  }
};

export const saveAttendanceLogs = async (records: AttendanceRecord[]): Promise<void> => {
  // 1. Save to local storage first as a robust fallback/cache
  try {
    const localLogs: AttendanceRecord[] = JSON.parse(localStorage.getItem('tqa_attendance_logs') || '[]');
    const recordIds = new Set(records.map(r => r.id));
    const filteredLocal = localLogs.filter(log => !recordIds.has(log.id));
    filteredLocal.push(...records);
    localStorage.setItem('tqa_attendance_logs', JSON.stringify(filteredLocal));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }

  // 2. Try to save to Supabase
  try {
    const client = ensureSupabase();
    const rows = records.map(mapAttendanceToRow);
    const { error } = await client.from('attendance').upsert(rows);
    if (error) throw error;
  } catch (error: any) {
    console.error('Failed to save to Supabase:', error);
    if (error?.message?.includes('public.attendance') || error?.message?.includes('schema cache')) {
      throw new Error('Peringatan: Tabel "attendance" belum terbuat di database Supabase Anda. Data disimpan secara lokal di browser ini. Silakan jalankan script SQL migrasi yang disediakan di Supabase Anda.');
    } else {
      throw error;
    }
  }
};

export const loadStudentAttendanceLogs = async (studentId: string): Promise<AttendanceRecord[]> => {
  try {
    const client = ensureSupabase();
    const { data, error } = await client
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('attendance_date', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapAttendanceFromRow);
  } catch (error) {
    console.warn('Failed to load from Supabase, loading from localStorage:', error);
    const localLogs = JSON.parse(localStorage.getItem('tqa_attendance_logs') || '[]');
    return localLogs
      .filter((log: AttendanceRecord) => log.studentId === studentId)
      .sort((a: AttendanceRecord, b: AttendanceRecord) => b.date.localeCompare(a.date));
  }
};

export const deleteAttendanceLog = async (id: string): Promise<void> => {
  try {
    const localLogs = JSON.parse(localStorage.getItem('tqa_attendance_logs') || '[]');
    const updated = localLogs.filter((log: any) => log.id !== id);
    localStorage.setItem('tqa_attendance_logs', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete attendance log locally:', e);
  }

  try {
    const client = ensureSupabase();
    const { error } = await client
      .from('attendance')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete attendance log from Supabase:', error);
    throw error;
  }
};

export const markStudentNotesAsRead = async (studentId: string): Promise<void> => {
  // Update locally first
  try {
    const localLogs = JSON.parse(localStorage.getItem('tqa_setoran_logs') || '[]');
    const updated = localLogs.map((log: any) => {
      if (log.studentId === studentId && !log.isRead && log.notes && log.notes.trim() !== '') {
        return { ...log, isRead: true };
      }
      return log;
    });
    localStorage.setItem('tqa_setoran_logs', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update local read logs:', e);
  }

  // Update Supabase
  try {
    const client = ensureSupabase();
    const { error } = await client
      .from('setoran')
      .update({ is_read: true })
      .eq('student_id', studentId)
      .eq('is_read', false);
    if (error) throw error;
  } catch (err) {
    console.warn('Failed to mark read on Supabase:', err);
  }
};

export type TeacherInfo = {
  name: string;
  colorClass: string;
};

export const getAssignedTeacher = (name: string, studentClass: string, studentIndex: number): TeacherInfo => {
  const normalized = name.toUpperCase().replace(/\s+/g, ' ').trim();
  
  if (studentClass === '6C') {
    const nawfalGroup = [
      "ADELINA DIANDRA WIJAYA",
      "AHNAF HAIDAR FAHMI",
      "ALVARO CALYA ZIGGY FAUSTAN",
      "AMARANGGANA KINNARA PRASETYO",
      "AZFAR PUTRA YURI",
      "AZKIYA NAFISA NUGROHO",
      "INA AMINATUS ZAHRO",
      "IRFAN NISMARA SETIAWAN",
      "REVANO NAUVAL PRATAMA",
      "RUBY ALIYA DEWINA MARYAM"
    ];

    const rahmaGroup = [
      "MICHELLA AMAIRA RAHMANI KUSUMA",
      "KEISHA LARASATI RAHARDIYANTO",
      "KEANU ABIDZAR RACHMAN",
      "BELAID MUHAMMAD ABD EL RAOUF",
      "SHAIRA HASNA AZKADINA",
      "TALITA HASNA KHUMAIRA",
      "NUR SYIFA KUSUMA AYU",
      "AKMA SHAKILA KHAIRINA",
      "HAGIA SOPHIA NAIRA RACHMAN",
      "KHANSA AQILA QOTRUNNADA"
    ];

    const iningGroup = [
      "ANOM ANANTA PUTRA",
      "AZZAHRA RAFANDA ZHAFIRAH",
      "BILQIS ZHARUFA HAWIN AFIQAH",
      "DE ATTAR ALFAREZ FERDIAN",
      "FATHAN ARSYANENDRA PURNOMO",
      "KAYLA PRAMUDITA AZALIA",
      "MIKHAEELA ALLESSANDRA SYAHIRA",
      "MUHAMMAD DASTAN AL-KHALEF ANDI MAKMUR",
      "RAFLI HABIBULLAH GHANI PRASOJO",
      "SAFIA PARAMITA MADINA"
    ];

    if (nawfalGroup.includes(normalized)) {
      return {
        name: 'Ustadz Nawfal',
        colorClass: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/10'
      };
    }
    if (iningGroup.includes(normalized)) {
      return {
        name: 'Ustadzah Ining',
        colorClass: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/10'
      };
    }
    if (rahmaGroup.includes(normalized)) {
      return {
        name: 'Ustadzah Rahma',
        colorClass: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/10'
      };
    }
  }

  if (studentClass === '6D') {
    const nawfalGroup = [
      "ABBAS",
      "ARJUNA ALGHIFARY IBRAHIM",
      "DINAR KHOIRUNNISAH",
      "LAVIOLA CANTIQA NAURA QUEEN",
      "RAISA AZKAZAKIYA KUSUMA",
      "RASYA BIMA ALKHALIFI RAMADHAN",
      "REIKI ARSA SAVIAN ALTEZZA",
      "VANESSA ANGEL ANASTASYA",
      "ASHILLA ALMAHYRA SHANUM",
      "HUSEIN FIKRI",
      "GEOVANI ARYA TIASTA"
    ];

    const rahmaGroup = [
      "ASMA KALILA AZ-ZAHRA",
      "MUHAMMAD DONY AL-FATIH",
      "AURORA SHAFIRA BILQIS",
      "NAURA ALYA MAHIRA",
      "QISYA HUMAIRA MARWAH",
      "RIFQY ARKANA SAHITYA",
      "SHAKILLA HANANIA IRAWAN",
      "MUHAMMAD RADEVA ALANO KHALFANI",
      "ZIVANNA VALLERIE JASMINE",
      "DANISH ARAYA",
      "NARARYA ARDI PRADIPTA"
    ];

    const iningGroup = [
      "ALUNA KAYLA KHANZA",
      "ALYA AZ ZAHRA SALEH BAHADJ",
      "FATIMAH ROHIMA HANIFA",
      "JACINDA FATHIYYA BAHIRA PUTRI",
      "JADDA JAYYID ZIDANE",
      "MUHAMMAD AHNAF ALFARIZQY",
      "M. AHNAF ALFARIZQY",
      "SYANALA KANIA AYUNDA",
      "QAISHA AZZAHRA KUMARA",
      "QUEENA AURANISA ANNAFI"
    ];

    if (nawfalGroup.includes(normalized)) {
      return {
        name: 'Ustadz Nawfal',
        colorClass: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/10'
      };
    }
    if (iningGroup.includes(normalized)) {
      return {
        name: 'Ustadzah Ining',
        colorClass: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/10'
      };
    }
    if (rahmaGroup.includes(normalized)) {
      return {
        name: 'Ustadzah Rahma',
        colorClass: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/10'
      };
    }
  }

  if (studentClass === '5B') {
    const nawfalGroup = [
      "ADAM MIRZA ALMAHFUZI",
      "GYTHA INARA TIFFANI",
      "KANAYA ADIFIA SHEZAN",
      "MUHAMMAD RADJENDRA",
      "AFREEN NANDA ELFIRA SETIAWAN",
      "ANINDITA KEYSA AZZAHRA",
      "AMIRA SHAKINA AZALEA",
      "NABILA SHALIHA AZZAHRA",
      "FIGO ALIV EL GIBRAN",
      "AZRIEL AL AZZAM RANGGAWUNI"
    ];

    const rahmaGroup = [
      "SHAFIRA DARMA SETIYO",
      "KRISNATAN RAIS ARKHAM",
      "HAZMI FIKRI",
      "ALKHALIFI ANURADHA SEMESTA",
      "SHAFIA HASNA FAIHANNISA",
      "RIZTYA MALIKA ARSYAH HANIF",
      "MUHAMAD ALANO AMMAR RASYID",
      "ADZHIYYA ALSHAQUEENA AISYA"
    ];

    const iningGroup = [
      "SYAFIQ SATRIA PRAYUDA",
      "SUFYAN",
      "RR. SALSABILA ATSILAH WINNAURA",
      "RENGGANIS MAHYA WIJANARKO",
      "QAILA NAZIFA ZAREENA",
      "FATIH ZAIDAN AL AZZAM",
      "ARINTA INARA ATALYSSA",
      "HUMAISHA KHANZARA ARDANI",
      "UMAR"
    ];

    if (nawfalGroup.includes(normalized)) {
      return {
        name: 'Ustadz Nawfal',
        colorClass: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/10'
      };
    }
    if (iningGroup.includes(normalized)) {
      return {
        name: 'Ustadzah Ining',
        colorClass: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/10'
      };
    }
    if (rahmaGroup.includes(normalized)) {
      return {
        name: 'Ustadzah Rahma',
        colorClass: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/10'
      };
    }
  }

  if (studentClass === '5C') {
    const nawfalGroup = [
      "ALIFYA AZZAHRA KHAIRUNNISA",
      "ALIFYA AZ ZAHRA KHAIRUNNISA",
      "ANDRIANO HAMIZAN PANDYA WARDANA",
      "ARSALAN ZIO SOLHIDAR ASKARI",
      "ARSYAD ZHAFRAN ABQARI",
      "ATHALLA GIBRAN DWIKA PUTRA",
      "MIKHAYLA ADRIEN CLARETTA",
      "PUTRA SADA ALGHIFARI",
      "RAFARDHAN DHAFIR NURWANTO",
      "REVALENA AURELLY PUTRI WARDHANA"
    ];
    
    const rahmaGroup = [
      "AISYAH AQILLA PUTRI",
      "AYSHA AZZAHRA THAMRIN",
      "HASNA AKIKO ISWAHYUNI",
      "KAYSHA AZIZA INDITA",
      "MUHAMMAD RAFFASYA ALFARIZQI PRADIPTA",
      "NABILAH SAFIRA KHAIRUNNISA",
      "NADHIRA NUSAIBAH PUTRI ISPRIONO",
      "NADINE RIZKY DEFRIAN AKHYAR",
      "NAJWA AISYAH PUSPITA",
      "NAUFAL ADLAN RAIHAN ALIYAN"
    ];
    
    const iningGroup = [
      "AFFAN JULIAN ALFARIZI YUSUF",
      "ARKHA FAYYADH SISWANDI",
      "BELLVANIA AZZAHRA NISTRIANTO",
      "BHAGAWANTA ALFARIZQI PRADITA",
      "BONDAN MAHESA ZAFRAN SYAH",
      "KHANSA ARSYILA DARMAWAN",
      "MUHAMMAD MUSA",
      "R. REY ARSY MAHINDRAJAYA",
      "RADITYA SENA NUGRAHA",
      "RR. AIMILIONAMORA ADHITAMA RAYA"
    ];
    
    if (nawfalGroup.includes(normalized)) {
      return {
        name: 'Ustadz Nawfal',
        colorClass: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/10'
      };
    }
    if (iningGroup.includes(normalized)) {
      return {
        name: 'Ustadzah Ining',
        colorClass: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/10'
      };
    }
    if (rahmaGroup.includes(normalized)) {
      return {
        name: 'Ustadzah Rahma',
        colorClass: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/10'
      };
    }
  }

  if (studentClass === '5D') {
    const nawfalGroup = [
      "ADEEVA MYEISHA INARA",
      "AIDAN SYAHM ALKHALIFI",
      "ANINDHITA NEYSA BELLVANIA SAPUTRO",
      "ARJUNA PUTRA WIDJAYA",
      "AYUNDRA ASHA AZZAHRA",
      "ELSA AMALIA MUMTAZAH",
      "HANZAL AL FATIH RACHMAN",
      "NABILAH FAHIRA KHAIRUNNISA",
      "RAFANDA NAZIFA RAHADIAN",
      "TRISTYAN RIANI QANITA AZZAHRA"
    ];

    const rahmaGroup = [
      "RAKHA PRAWIRA DHANANJAYA",
      "QUEENA SHAQILA AAFI",
      "KINANTI YUSKI DIANDRA DEWI",
      "GHANDY BIMO SILALAHI",
      "DZIKRI AHZATIKA ATAULAH",
      "AYSSHA HUMAIRA ZAHRA",
      "AMIRA EMBUN RAMADHAYU",
      "AKAR DANISH IBRAHIMO",
      "AZZAHRA RAHMA ZAHIRA ANINDITA"
    ];

    const iningGroup = [
      "ARSYANENDRA ABHIRAMA SHAKTI",
      "CARRISA ADELIA RACHMANI",
      "DZAKY RIFAI RAFANDRA MUTTAQIN",
      "ERLANGGA KIANNOUZADIRA VELLAGO",
      "ERLANGGA KIANNOZADIRA VELLAGO",
      "FABRIZIO ABRIZAM PANUNTUN",
      "HAFIZHA WANDA BADI NASUTION",
      "MIKAIL KEMI ASSAUQI",
      "MUHAMMAD ALFARO PUTRATAMA",
      "MUHAMMAD FAIZ ABDUL GHANIE",
      "RAFFANDRA ABINAYA ALEXI"
    ];

    if (nawfalGroup.includes(normalized)) {
      return {
        name: 'Ustadz Nawfal',
        colorClass: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/10'
      };
    }
    if (iningGroup.includes(normalized)) {
      return {
        name: 'Ustadzah Ining',
        colorClass: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/10'
      };
    }
    if (rahmaGroup.includes(normalized)) {
      return {
        name: 'Ustadzah Rahma',
        colorClass: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/10'
      };
    }
  }

  // Fallback
  const teacherIndex = studentIndex % 3;
  if (teacherIndex === 0) {
    return {
      name: 'Ustadz Nawfal',
      colorClass: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/10'
    };
  } else if (teacherIndex === 1) {
    return {
      name: 'Ustadzah Ining',
      colorClass: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/10'
    };
  } else {
    return {
      name: 'Ustadzah Rahma',
      colorClass: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/10'
    };
  }
};

export const loadPersonalMessages = async (): Promise<PersonalMessage[]> => {
  try {
    const client = ensureSupabase();
    const { data, error } = await client
      .from('personal_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(row => ({
      id: String(row.id),
      date: row.message_date,
      studentId: row.student_id,
      studentName: row.student_name,
      message: row.message,
      status: row.status,
    }));
  } catch (error) {
    console.warn('Failed to load from Supabase, loading from localStorage:', error);
    return JSON.parse(localStorage.getItem('tqa_personal_messages') || '[]');
  }
};

export const createPersonalMessage = async (msg: Omit<PersonalMessage, 'id'> & { id?: string }): Promise<PersonalMessage> => {
  // Save locally first
  const localId = msg.id || String(Date.now());
  try {
    const localMsgs = JSON.parse(localStorage.getItem('tqa_personal_messages') || '[]');
    const localMsg = { ...msg, id: localId };
    localMsgs.unshift(localMsg);
    localStorage.setItem('tqa_personal_messages', JSON.stringify(localMsgs));
  } catch (e) {
    console.error('Failed to save message locally:', e);
  }

  try {
    const client = ensureSupabase();
    const row = {
      student_id: msg.studentId,
      student_name: msg.studentName,
      message: msg.message,
      status: msg.status,
      message_date: msg.date,
    };
    const { data, error } = await client
      .from('personal_messages')
      .insert([row])
      .select()
      .single();

    if (error) throw error;
    return {
      id: String(data.id),
      date: data.message_date,
      studentId: data.student_id,
      studentName: data.student_name,
      message: data.message,
      status: data.status,
    };
  } catch (error) {
    console.warn('Failed to save to Supabase, returning optimistic message:', error);
    return {
      id: localId,
      date: msg.date,
      studentId: msg.studentId,
      studentName: msg.studentName,
      message: msg.message,
      status: msg.status,
    };
  }
};

export const markPersonalMessagesAsReadInDb = async (studentId: string): Promise<void> => {
  // Update locally first
  try {
    const localMsgs = JSON.parse(localStorage.getItem('tqa_personal_messages') || '[]');
    const updated = localMsgs.map((msg: any) => {
      if (msg.studentId === studentId && msg.status === 'Terkirim') {
        return { ...msg, status: 'Dibaca' };
      }
      return msg;
    });
    localStorage.setItem('tqa_personal_messages', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to mark local messages as read:', e);
  }

  try {
    const client = ensureSupabase();
    const { error } = await client
      .from('personal_messages')
      .update({ status: 'Dibaca' })
      .eq('student_id', studentId)
      .eq('status', 'Terkirim');
    if (error) throw error;
  } catch (err) {
    console.warn('Failed to update read status on Supabase:', err);
  }
};

export const loadTartiliEntries = async (): Promise<TartiliEntry[]> => {
  try {
    const client = ensureSupabase();
    const { data, error } = await client
      .from('jurnal_tartili')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(row => ({
      id: row.id,
      className: row.class_name,
      date: row.entry_date,
      status: row.status,
      jilid: row.jilid,
      startPage: row.start_page,
      endPage: row.end_page,
      notes: row.notes ?? undefined,
    }));
  } catch (error) {
    console.warn('Failed to load from Supabase, loading from localStorage:', error);
    return JSON.parse(localStorage.getItem('tqa_tartili_classical_history') || '[]');
  }
};

export const createTartiliEntry = async (entry: Omit<TartiliEntry, 'id'>): Promise<TartiliEntry> => {
  // Save locally first
  const tempId = Date.now();
  try {
    const localHistory = JSON.parse(localStorage.getItem('tqa_tartili_classical_history') || '[]');
    localHistory.unshift({ ...entry, id: tempId });
    localStorage.setItem('tqa_tartili_classical_history', JSON.stringify(localHistory));
  } catch (e) {
    console.error('Failed to save Tartili locally:', e);
  }

  try {
    const client = ensureSupabase();
    const row = {
      class_name: entry.className,
      entry_date: entry.date,
      status: entry.status,
      jilid: entry.jilid,
      start_page: Number(entry.startPage),
      end_page: Number(entry.endPage),
      notes: entry.notes || null,
    };
    const { data, error } = await client
      .from('jurnal_tartili')
      .insert([row])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      className: data.class_name,
      date: data.entry_date,
      status: data.status,
      jilid: data.jilid,
      startPage: data.start_page,
      endPage: data.end_page,
      notes: data.notes ?? undefined,
    };
  } catch (error) {
    console.warn('Failed to create Jurnal Tartili in Supabase, returning optimistic:', error);
    return { ...entry, id: tempId };
  }
};

export const updateTartiliEntry = async (entry: TartiliEntry): Promise<TartiliEntry> => {
  // Save locally first
  try {
    const localHistory = JSON.parse(localStorage.getItem('tqa_tartili_classical_history') || '[]');
    const updated = localHistory.map((item: any) => item.id === entry.id ? entry : item);
    localStorage.setItem('tqa_tartili_classical_history', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update Tartili locally:', e);
  }

  try {
    const client = ensureSupabase();
    const row = {
      class_name: entry.className,
      entry_date: entry.date,
      status: entry.status,
      jilid: entry.jilid,
      start_page: Number(entry.startPage),
      end_page: Number(entry.endPage),
      notes: entry.notes || null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await client
      .from('jurnal_tartili')
      .update(row)
      .eq('id', entry.id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      className: data.class_name,
      date: data.entry_date,
      status: data.status,
      jilid: data.jilid,
      startPage: data.start_page,
      endPage: data.end_page,
      notes: data.notes ?? undefined,
    };
  } catch (error) {
    console.warn('Failed to update Jurnal Tartili in Supabase:', error);
    return entry;
  }
};

export const deleteTartiliEntry = async (id: string | number): Promise<void> => {
  // Delete locally first
  try {
    const localHistory = JSON.parse(localStorage.getItem('tqa_tartili_classical_history') || '[]');
    const filtered = localHistory.filter((item: any) => item.id !== id);
    localStorage.setItem('tqa_tartili_classical_history', JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete Tartili locally:', e);
  }

  try {
    const client = ensureSupabase();
    const { error } = await client
      .from('jurnal_tartili')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.warn('Failed to delete Jurnal Tartili from Supabase:', error);
  }
};


