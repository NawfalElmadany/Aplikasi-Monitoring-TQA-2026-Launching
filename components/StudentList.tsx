import React, { useState, useEffect, useMemo } from 'react';
import { Edit3, Search, Filter, CheckCircle2, Clock, BookOpen, User as UserIcon } from 'lucide-react';
import { Student, User } from '../types';
import Header from './Header';
import { getAssignedTeacher } from '../services/appData';

interface StudentListProps {
  students: Student[];
  onInputNilai: (student: Student) => void;
  onViewHistory?: (student: Student) => void;
  readOnly?: boolean;
  initialClass?: string;
  user?: User;
  onMenuClick?: () => void;
  notifications?: Student[];
  onDismissNotification?: (studentId: string) => void;
  onSearchClick?: () => void;
}

const StudentList: React.FC<StudentListProps> = ({ 
  students, 
  onInputNilai, 
  onViewHistory, 
  readOnly = false, 
  initialClass = 'Semua',
  user = { name: 'Pengguna', role: 'teacher' },
  onMenuClick = () => {},
  notifications = [],
  onDismissNotification,
  onSearchClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [selectedTeacher, setSelectedTeacher] = useState('Semua');
  const [isScrolled, setIsScrolled] = useState(false);

  // Update selected class if initialClass prop changes (e.g. from parent notification click)
  useEffect(() => {
    setSelectedClass(initialClass);
  }, [initialClass]);

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

  const classes = ['Semua', '5B', '5C', '5D', '6C', '6D'];

  const studentsWithTeacher = useMemo(() => {
    // Group students by class
    const studentsByClass: Record<string, Student[]> = {};
    students.forEach(s => {
      if (!studentsByClass[s.class]) {
        studentsByClass[s.class] = [];
      }
      studentsByClass[s.class].push(s);
    });

    // Sort students by name in each class
    Object.keys(studentsByClass).forEach(cls => {
      studentsByClass[cls].sort((a, b) => a.name.localeCompare(b.name));
    });

    // Map each student to their assigned teacher
    return students.map(s => {
      const classList = studentsByClass[s.class] || [];
      const idx = classList.findIndex(item => item.id === s.id);
      const teacherInfo = getAssignedTeacher(s.name, s.class, idx);
      return {
        ...s,
        teacherName: teacherInfo.name
      };
    });
  }, [students]);

  const filteredStudents = useMemo(() => {
    return studentsWithTeacher.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.currentSurah.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = selectedClass === 'Semua' || student.class === selectedClass;
      const matchesTeacher = selectedTeacher === 'Semua' || student.teacherName === selectedTeacher;

      return matchesSearch && matchesClass && matchesTeacher;
    });
  }, [studentsWithTeacher, searchTerm, selectedClass, selectedTeacher]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Mumtaz': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Jayyid Jiddan': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Jayyid': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default: return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col min-h-0">
      {/* Sticky Container Wrapper */}
      <div className="sticky top-4 z-30 bg-gradient-to-br from-white to-emerald-50/60 dark:bg-[#15231A] dark:bg-none p-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-lg dark:shadow-black/30 border border-emerald-400 dark:border-white/15 flex justify-between items-center mt-4 sm:mt-6 mb-8 flex-none">
        <Header
            user={user}
            onMenuClick={onMenuClick}
            notifications={notifications}
            onDismissNotification={onDismissNotification}
            onSearchClick={onSearchClick}
            flat={true}
            title="Daftar Siswa"
            subtitle="Kelola data dan perkembangan hafalan siswa"
        />
      </div>

      {/* Filter & Search Controls Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <h3 className="font-bold text-slate-800">Filter Pencarian</h3>
              <p className="text-slate-500 text-xs mt-0.5">Cari nama siswa atau saring berdasarkan kelas dan pengampu</p>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Cari siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none w-full sm:w-64 transition-all text-slate-700"
            />
          </div>
        </div>

        {/* Divider line */}
        <div className="h-px bg-slate-100 dark:bg-dark-border"></div>

        {/* Class Filter Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-dark-border mr-2 text-slate-500 min-w-[100px]">
            <Filter size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">KELAS:</span>
          </div>
          {classes.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${selectedClass === cls
                  ? 'bg-gradient-to-r from-emerald-800 to-emerald-600 text-white shadow-sm font-bold'
                  : 'bg-white dark:bg-dark-card text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:bg-dark-card-hover hover:border-emerald-200'
                }
              `}
            >
              {cls}
            </button>
          ))}
        </div>

        {/* Teacher Filter Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-dark-border mr-2 text-slate-500 min-w-[100px]">
            <UserIcon size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">PENGAMPU:</span>
          </div>
          {['Semua', 'Ustadz Nawfal', 'Ustadzah Rahma', 'Ustadzah Ining'].map((teacher) => (
            <button
              key={teacher}
              onClick={() => setSelectedTeacher(teacher)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${selectedTeacher === teacher
                  ? 'bg-gradient-to-r from-emerald-800 to-emerald-600 text-white shadow-sm font-bold'
                  : 'bg-white dark:bg-dark-card text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:bg-dark-card-hover hover:border-emerald-200'
                }
              `}
            >
              {teacher}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 pt-4 space-y-4 pr-1">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="group bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm border border-slate-100 dark:border-dark-border hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 ease-in-out"
            >
              <div className="grid grid-cols-12 gap-4 items-center">

                {/* 1. Profile (Col Span 4) */}
                <div className="col-span-12 md:col-span-4 flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-50 group-hover:border-emerald-100 transition-colors"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 
                      onClick={() => onViewHistory && onViewHistory(student)} 
                      className="font-bold text-slate-800 dark:text-white text-sm md:text-base hover:text-emerald-600 hover:underline cursor-pointer transition-all truncate"
                      title="Lihat Profil Detail Siswa"
                    >
                      {student.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-dark-card-hover text-slate-600 dark:text-gray-300 border border-slate-200">
                        {student.class}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 dark:bg-[#1C3026] text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-900/50">
                        {student.teacherName}
                      </span>
                      {onViewHistory && (
                        <button onClick={() => onViewHistory(student)} className="text-[10px] font-semibold text-emerald-600 hover:underline cursor-pointer">
                          Profil Detail &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Waktu (Col Span 2) */}
                <div className="col-span-6 md:col-span-2 pl-2 border-l border-slate-100 dark:border-dark-border md:border-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">WAKTU</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <Clock size={12} className="text-slate-400" />
                    {student.lastUpdate}
                  </div>
                </div>

                {/* 3. Materi (Col Span 3) */}
                <div className="col-span-6 md:col-span-3 pl-2 border-l border-slate-100 dark:border-dark-border md:border-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">MATERI</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <BookOpen size={12} className="text-slate-400" />
                    <span className="truncate">{student.currentSurah}</span>
                  </div>
                </div>

                {/* 4. Nilai (Col Span 1) */}
                <div className="col-span-6 md:col-span-1 pl-2 border-l border-slate-100 dark:border-dark-border md:border-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">NILAI</span>
                  <div className="text-sm font-extrabold text-slate-800">
                    {student.lastScore || '-'}
                  </div>
                </div>

                {/* 5. Status (Col Span 2) */}
                <div className="col-span-6 md:col-span-2 pl-2 border-l border-slate-100 dark:border-dark-border md:border-none flex flex-col items-center md:items-start gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">STATUS</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit whitespace-nowrap ${getStatusBadge(student.status)}`}>
                    {student.status === 'Mumtaz' && <CheckCircle2 size={10} />}
                    {student.status}
                  </span>
                  {!readOnly && (
                    <button
                      onClick={() => onInputNilai(student)}
                      className="mt-2 w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-[10px] hover:bg-emerald-100 transition-colors"
                    >
                      <Edit3 size={10} />
                      Input Nilai
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white dark:bg-dark-card rounded-xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-50 dark:bg-dark-card-hover rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-500 font-medium">Tidak ada siswa ditemukan.</p>
            <p className="text-gray-400 text-xs mt-1">Coba ubah filter atau kata kunci pencarian.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;