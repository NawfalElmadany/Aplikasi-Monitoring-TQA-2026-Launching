import { getAvatarUrl } from './utils/avatar';
import { AcademicYear, MenuItem, MurojaahEntry, Note, Student, Target, Teacher } from './types';
import { LayoutDashboard, Users, BookOpen, FileText, Settings, History, Scroll, RotateCw, PlusCircle, User as UserIcon, ClipboardCheck } from 'lucide-react';

const RAW_STUDENTS = [
  // Kelas 5B
  { name: "ADAM MIRZA ALMAHFUZI", class: "5B" },
  { name: "ADZHIYYA ALSHAQUEENA AISYA", class: "5B" },
  { name: "AFREEN NANDA ELFIRA SETIAWAN", class: "5B" },
  { name: "ALKHALIFI ANURADHA SEMESTA", class: "5B" },
  { name: "AMIRA SHAKINA AZALEA", class: "5B" },
  { name: "ANINDITA KEYSA AZZAHRA", class: "5B" },
  { name: "ARINTA INARA ATALYSSA", class: "5B" },
  { name: "AULIAN AFZAL ARFIANTO", class: "5B" },
  { name: "AZRIEL AL AZZAM RANGGAWUNI", class: "5B" },
  { name: "FATIH ZAIDAN AL AZZAM", class: "5B" },
  { name: "FIGO ALIV EL GIBRAN", class: "5B" },
  { name: "GYTHA INARA TIFFANI", class: "5B" },
  { name: "HAZMI FIKRI", class: "5B" },
  { name: "HUMAISHA KHANZARA ARDANI", class: "5B" },
  { name: "KANAYA ADIFIA SHEZAN", class: "5B" },
  { name: "KRISNATAN RAIS ARKHAM", class: "5B" },
  { name: "MUHAMAD ALANO AMMAR RASYID", class: "5B" },
  { name: "MUHAMMAD RADJENDRA", class: "5B" },
  { name: "NABILA SHALIHA AZZAHRA", class: "5B" },
  { name: "QAILA NAZIFA ZAREENA", class: "5B" },
  { name: "RENGGANIS MAHYA WIJANARKO", class: "5B" },
  { name: "RIZTYA MALIKA ARSYAH HANIF", class: "5B" },
  { name: "RR. SALSABILA ATSILAH WINNAURA", class: "5B" },
  { name: "SHAFIA HASNA FAIHANNISA", class: "5B" },
  { name: "SHAFIRA DARMA SETIYO", class: "5B" },
  { name: "SUFYAN", class: "5B" },
  { name: "SYAFIQ SATRIA PRAYUDA", class: "5B" },
  { name: "UMAR", class: "5B" },

  // Kelas 5C
  { name: "AFFAN JULIAN ALFARIZI YUSUF", class: "5C" },
  { name: "AISYAH AQILLA PUTRI", class: "5C" },
  { name: "ALIFYA AZ ZAHRA KHAIRUNNISA", class: "5C" },
  { name: "ANDRIANO HAMIZAN PANDYA WARDANA", class: "5C" },
  { name: "ARKHA FAYYADH SISWANDI", class: "5C" },
  { name: "ARSALAN ZIO SOLHIDAR ASKARI", class: "5C" },
  { name: "ARSYAD ZHAFRAN ABQARI", class: "5C" },
  { name: "ATHALLA GIBRAN DWIKA PUTRA", class: "5C" },
  { name: "AYSHA AZZAHRA THAMRIN", class: "5C" },
  { name: "BELLVANIA AZZAHRA NISTRIANTO", class: "5C" },
  { name: "BHAGAWANTA ALFARIZQI PRADITA", class: "5C" },
  { name: "BONDAN MAHESA ZAFRAN SYAH", class: "5C" },
  { name: "HASNA AKIKO ISWAHYUNI", class: "5C" },
  { name: "KAYSHA AZIZA INDITA", class: "5C" },
  { name: "KHANSA ARSYILA DARMAWAN", class: "5C" },
  { name: "MIKHAYLA ADRIEN CLARETTA", class: "5C" },
  { name: "MUHAMMAD MUSA", class: "5C" },
  { name: "MUHAMMAD RAFFASYA ALFARIZQI PRADIPTA", class: "5C" },
  { name: "NABILAH SAFIRA KHAIRUNNISA", class: "5C" },
  { name: "NADHIRA NUSAIBAH PUTRI ISPRIONO", class: "5C" },
  { name: "NADINE RIZKY DEFRIAN AKHYAR", class: "5C" },
  { name: "NAJWA AISYAH PUSPITA", class: "5C" },
  { name: "NAUFAL ADLAN RAIHAN ALIYAN", class: "5C" },
  { name: "PUTRA SADA ALGHIFARI", class: "5C" },
  { name: "R. REY ARSY MAHINDRAJAYA", class: "5C" },
  { name: "RADITYA SENA NUGRAHA", class: "5C" },
  { name: "RAFARDHAN DHAFIR NURWANTO", class: "5C" },
  { name: "REVALENA AURELLY PUTRI WARDHANA", class: "5C" },
  { name: "RR. AIMILIONAMORA ADHITAMA RAYA", class: "5C" },

  // Kelas 5D
  { name: "ADEEVA MYEISHA INARA", class: "5D" },
  { name: "AIDAN SYAHM ALKHALIFI", class: "5D" },
  { name: "AKAR DANISH IBRAHIMO", class: "5D" },
  { name: "AMIRA EMBUN RAMADHAYU", class: "5D" },
  { name: "ANINDHITA NEYSA BELLVANIA SAPUTRO", class: "5D" },
  { name: "ARJUNA PUTRA WIDJAYA", class: "5D" },
  { name: "ARSYANENDRA ABHIRAMA SHAKTI", class: "5D" },
  { name: "AYSSHA HUMAIRA ZAHRA", class: "5D" },
  { name: "AYUNDRA ASHA AZZAHRA", class: "5D" },
  { name: "AZZAHRA RAHMA ZAHIRA ANINDITA", class: "5D" },
  { name: "CARRISA ADELIA RACHMANI", class: "5D" },
  { name: "CLARISHA BILQIS AZZAHRA", class: "5D" },
  { name: "DZAKY RIFAI RAFANDRA MUTTAQIN", class: "5D" },
  { name: "DZIKRI AHZATIKA ATAULAH", class: "5D" },
  { name: "ELSA AMALIA MUMTAZAH", class: "5D" },
  { name: "ERLANGGA KIANNOUZADIRA VELLAGO", class: "5D" },
  { name: "FABRIZIO ABRIZAM PANUNTUN", class: "5D" },
  { name: "GHANDY BIMO SILALAHI", class: "5D" },
  { name: "HAFIZHA WANDA BADI NASUTION", class: "5D" },
  { name: "HANZAL AL FATIH RACHMAN", class: "5D" },
  { name: "KINANTI YUSKI DIANDRA DEWI", class: "5D" },
  { name: "MIKAIL KEMI ASSAUQI", class: "5D" },
  { name: "MUHAMMAD ALFARO PUTRATAMA", class: "5D" },
  { name: "MUHAMMAD FAIZ ABDUL GHANIE", class: "5D" },
  { name: "NABILAH FAHIRA KHAIRUNNISA", class: "5D" },
  { name: "QUEENA SHAQILA AAFI", class: "5D" },
  { name: "RAFANDA NAZIFA RAHADIAN", class: "5D" },
  { name: "RAFFANDRA ABINAYA ALEXI", class: "5D" },
  { name: "RAKHA PRAWIRA DHANANJAYA", class: "5D" },
  { name: "TRISTYAN RIANI QANITA AZZAHRA", class: "5D" },

  // Kelas 6C
  { name: "Adelina Diandra Wijaya", class: "6C" },
  { name: "Ahnaf Haidar Fahmi", class: "6C" },
  { name: "Akma Shakila Khairina", class: "6C" },
  { name: "Alvaro Calya Ziggy Faustan", class: "6C" },
  { name: "Amalia Putri Anjani", class: "6C" },
  { name: "Amaranggana Kinnara Prasetyo", class: "6C" },
  { name: "Anom Ananta Putra", class: "6C" },
  { name: "Azfar Putra Yuri", class: "6C" },
  { name: "Azkiya Nafisa Nugroho", class: "6C" },
  { name: "Azzahra Rafanda Zhafirah", class: "6C" },
  { name: "Belaid Muhammad Abd El Raouf", class: "6C" },
  { name: "Bilqis Zharufa Hawin Afiqah", class: "6C" },
  { name: "De Attar Alfarez Ferdian", class: "6C" },
  { name: "Fathan Arsyanendra Purnomo", class: "6C" },
  { name: "Hagia Sophia Naira Rachman", class: "6C" },
  { name: "Ina Aminatus Zahro", class: "6C" },
  { name: "Irfan Nismara Setiawan", class: "6C" },
  { name: "Kayla Pramudita Azalia", class: "6C" },
  { name: "Keanu Abidzar Rachman", class: "6C" },
  { name: "Keisha Larasati Rahardiyanto", class: "6C" },
  { name: "Khansa Aqila Qotrunnada", class: "6C" },
  { name: "Michella Amaira Rahmani Kusuma", class: "6C" },
  { name: "Mikhaeela Allessandra Syahira", class: "6C" },
  { name: "Muhammad Dastan Al-Khalef Andi M", class: "6C" },
  { name: "Nur Syifa Kusuma Ayu", class: "6C" },
  { name: "Rafli Habibullah Ghani Prasojo", class: "6C" },
  { name: "Revano Nauval Pratama", class: "6C" },
  { name: "Ruby Aliya Dewina Maryam", class: "6C" },
  { name: "Safia Paramita Madina", class: "6C" },
  { name: "Shaira Hasna Azkadina", class: "6C" },
  { name: "Talita Hasna Khumaira", class: "6C" },

  // Kelas 6D
  { name: "Abbas", class: "6D" },
  { name: "Aluna Kayla Khanza", class: "6D" },
  { name: "Alya Az Zahra Saleh Bahadj", class: "6D" },
  { name: "Arjuna Alghifari Ibrahim", class: "6D" },
  { name: "Ashilla Almahyra Shanum", class: "6D" },
  { name: "Asma Kalila Az Zahra", class: "6D" },
  { name: "Aurora Shafira Bilqis", class: "6D" },
  { name: "Danish Araya", class: "6D" },
  { name: "Dinar Khoirunnisah", class: "6D" },
  { name: "Fatimah Rohima Hanifa", class: "6D" },
  { name: "Geovani Arya Tiasta", class: "6D" },
  { name: "Husein Fikri", class: "6D" },
  { name: "Jacinda Fathiyya Bahira Putri", class: "6D" },
  { name: "Jadda Jayyid Zidane", class: "6D" },
  { name: "Laviola Cantiqa Naura Queen", class: "6D" },
  { name: "M. Ahnaf Alfarizqy", class: "6D" },
  { name: "M. Dony Al-Fatiih", class: "6D" },
  { name: "M. Radeva Alano khalfani", class: "6D" },
  { name: "Nararya ardi Pradipta", class: "6D" },
  { name: "Naura Alya Mahira", class: "6D" },
  { name: "Qaisha Azzahra Kumara", class: "6D" },
  { name: "Qisya Humaira Marwah", class: "6D" },
  { name: "Raisa Azkazakiya Kusuma", class: "6D" },
  { name: "Rasya Bima Alkhalifi Ramadhan", class: "6D" },
  { name: "Reiki Arsa Savian Altezza", class: "6D" },
  { name: "Rifqy Arkana Sahitya", class: "6D" },
  { name: "Shakilla Hanania Irawan", class: "6D" },
  { name: "Syanala Kania Ayunda", class: "6D" },
  { name: "Tivania Kayla Ramadhani", class: "6D" },
  { name: "Vanessa Angel Anastasya", class: "6D" },
  { name: "Zivanna Vallerie Jasmine", class: "6D" }
];

export const SURAHS_JUZ_30 = [
  "An-Naba", "An-Nazi'at", "'Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin",
  "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr",
  "Al-Balad", "Ash-Shams", "Al-Lail", "Ad-Duhaa", "Ash-Sharh", "At-Tin",
  "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah",
  "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraish", "Al-Ma'un",
  "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Lahab", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

export const SURAHS_JUZ_29 = [
  "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil",
  "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat"
];

export const SURAHS_JUZ_28 = ["Al-Mujadila", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim"];

export const INITIAL_STUDENTS: Student[] = RAW_STUDENTS.map((s, idx) => {
  // Generate comprehensive random data to show variety
  const juzOptions = [28, 29, 30];
  const currentJuz = juzOptions[Math.floor(Math.random() * juzOptions.length)];

  // Expanded list of Surahs to ensure "All Surahs" view is populated


  let availableSurahs = SURAHS_JUZ_30;
  if (currentJuz === 29) availableSurahs = SURAHS_JUZ_29;
  if (currentJuz === 28) availableSurahs = SURAHS_JUZ_28;

  const currentSurah = availableSurahs[Math.floor(Math.random() * availableSurahs.length)];

  const score = 70 + Math.floor(Math.random() * 30);
  let status: Student['status'] = 'Jayyid';
  if (score >= 90) status = 'Mumtaz';
  else if (score >= 80) status = 'Jayyid Jiddan';
  else if (score >= 75) status = 'Jayyid';
  else status = 'Perlu Bimbingan';

  // DiceBear Avatars for better visual
  const avatar = getAvatarUrl(s.name);

  return {
    id: (idx + 1).toString(),
    name: s.name.toUpperCase(),
    class: s.class,
    avatar: avatar,
    currentJuz: currentJuz,
    currentSurah: currentSurah,
    iqraLevel: Math.floor(Math.random() * 6) + 1, // Mock Iqra Level 1-6
    page: (Math.floor(Math.random() * 100) + 1).toString(), // Mock Verse/Page Number
    totalProgress: 30 + Math.floor(Math.random() * 60),
    lastUpdate: `${Math.floor(Math.random() * 5) + 1} hari lalu`,
    lastScore: score,
    status: status,
    notes: status === 'Perlu Bimbingan' ? 'Mohon diperlancar lagi makhraj hurufnya.' : 'Hafalan lancar, lanjutkan.',
    requiresAttention: status === 'Perlu Bimbingan'
  };
});

export const DEFAULT_ACADEMIC_YEAR: AcademicYear = {
  year: '2025/2026',
  semester: 'Ganjil',
  startDate: '2025-07-15',
  endDate: '2025-12-20'
};

export const DEFAULT_TARGETS: Target[] = [
  { id: 1, level: 'Jilid 1', target: 'Hafal Surat An-Nas s.d. Al-Lahab' },
  { id: 2, level: 'Jilid 2', target: 'Hafal Surat An-Nasr s.d. Al-Quraisy' },
  { id: 3, level: 'Jilid 3', target: 'Hafal Surat Al-Fil s.d. At-Takatsur' },
  { id: 4, level: 'Jilid 4', target: 'Hafal Surat Al-Qari\'ah s.d. Al-Bayyinah' },
];

export const DEFAULT_TEACHERS: Teacher[] = [
  { id: 1, name: 'Ustadz Abdullah', role: 'Head Teacher', class: '' },
  { id: 2, name: 'Ustadz/zah TQA Kelas 5&6', role: 'Teacher', class: '6C' },
  { id: 3, name: 'Ustadzah Aisyah', role: 'Teacher', class: '4A' },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 1,
    title: 'Evaluasi Hafalan Santri Kelas 6C',
    content: 'Perlu pendekatan khusus untuk Ananda Fathan dalam makhraj huruf R. Jadwalkan sesi tambahan hari Rabu.',
    category: 'Teaching',
    date: '2025-12-20',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 2,
    title: 'Rapat Koordinasi Guru TQA',
    content: 'Membahas target hafalan semester genap dan persiapan ujian tahfidz. Jangan lupa bawa laporan bulanan.',
    category: 'Meeting',
    date: '2025-12-18',
    color: 'bg-purple-100 text-purple-800'
  }
];

export const INITIAL_MUROJAAH_ENTRIES: MurojaahEntry[] = [
  { id: 1, juz: 30, surah: 'An-Naba s.d. Al-Inshiqaq', status: 'completed', date: '2025-12-20', score: 95, type: 'individual' },
  { id: 2, juz: 30, surah: 'Al-Buruj s.d. Al-Balad', status: 'completed', date: '2025-12-19', score: 88, type: 'individual' },
  { id: 3, juz: 30, surah: 'Ash-Shams s.d. Al-Bayyinah', status: 'pending', date: 'Hari Ini', type: 'classical', className: '6C' },
  { id: 4, juz: 30, surah: 'Az-Zalzalah s.d. An-Nas', status: 'upcoming', date: 'Besok', type: 'individual' },
];

export const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'hafalan', label: 'Hafalan', icon: BookOpen },
  { id: 'tartili', label: 'Tartili / Al-Qur\'an', icon: Scroll },
  { id: 'catatan', label: 'Catatan', icon: BookOpen },
  { id: 'absensi', label: 'Absensi', icon: FileText },
  { id: 'profil', label: 'Profil', icon: UserIcon },
  // Guru-only menus
  { id: 'input_setoran', label: 'Input Setoran', icon: PlusCircle },
  { id: 'murojaah', label: 'Murojaah', icon: RotateCw },
  { id: 'gharib', label: 'Gharib', icon: BookOpen },
  { id: 'santri', label: 'Data Siswa', icon: Users },
  { id: 'riwayat', label: 'Monitoring Harian', icon: History },
  { id: 'ujian_tartili', label: 'Ujian Tartili', icon: ClipboardCheck },
  { id: 'laporan', label: 'Laporan', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];
