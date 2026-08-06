import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, ArrowRight, GraduationCap, School, ChevronDown, Users } from 'lucide-react';
import { Student, User as UserType } from '../types';
import logoUrl from '../assets/logo.png';

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  disabled?: boolean;
  icon: React.ReactNode;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full pl-11 pr-10 py-3 rounded-xl border text-left flex items-center justify-between outline-none transition-all ${
          disabled
            ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 text-gray-400 cursor-not-allowed'
            : isOpen
            ? 'border-emerald-500 ring-1 ring-emerald-500 bg-white dark:bg-[#0B140F] dark:border-emerald-500 text-gray-800 dark:text-white'
            : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#0B140F] text-gray-750 dark:text-gray-200'
        }`}
      >
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <span className="truncate font-medium text-sm">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          size={20}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-[250] mt-2 w-full bg-white dark:bg-[#111D16] border border-gray-150 dark:border-white/5 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-[#1A2E24] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-[#2A4736]">
          <ul className="p-1.5 space-y-0.5">
            {options.length === 0 ? (
              <li className="px-4 py-2.5 text-sm text-gray-400 text-center font-medium">Tidak ada data</li>
            ) : (
              options.map(opt => {
                const isSelected = opt.value === value;
                return (
                  <li
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300'
                    }`}
                  >
                    {opt.label}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

interface LoginPageProps {
  onLogin: (user: UserType) => void;
  students: Student[];
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, students }) => {
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Student Login State
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  // Derive unique classes and filtered students
  const availableClasses = Array.from(new Set(students.map(student => student.class))).sort();
  const filteredStudents = students.filter(s => s.class === selectedClass);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API delay
    setTimeout(() => {
      let mockUser: UserType;

      if (role === 'teacher') {
        if (username !== 'TQA56' || password !== 'TQAJAYA') {
          setError('Username atau Password salah!');
          setIsLoading(false);
          return;
        }

        const savedTeacherAvatar = localStorage.getItem('tqa_teacher_avatar');
        mockUser = {
          name: 'Ustadz/zah TQA Kelas 5&6',
          role: 'teacher',
          avatar: savedTeacherAvatar || 'https://picsum.photos/seed/ustadz/100/100'
        };
      } else {
        // Find selected student details
        const studentData = students.find(s => s.id === selectedStudentId);

        mockUser = {
          name: studentData ? studentData.name : 'Siswa TQA',
          role: 'student',
          avatar: studentData ? studentData.avatar : 'https://picsum.photos/seed/student/200/200',
          studentId: selectedStudentId || '1'
        };
      }

      onLogin(mockUser);
      setIsLoading(false);
    }, 1000);
  };

  const isFormValid = () => {
    if (role === 'teacher') return username.trim() !== '' && password.trim() !== '';
    return selectedClass !== '' && selectedStudentId !== '';
  };

  return (
    <div className="min-h-screen flex justify-center items-start lg:items-center bg-gray-50 dark:bg-[#070C09] p-4 lg:p-0 py-8 lg:py-0 overflow-y-auto">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row mx-4 lg:mx-auto rounded-3xl overflow-hidden bg-white dark:bg-[#111D16] dark:border dark:border-white/5 shadow-2xl dark:shadow-black/50 h-auto lg:h-[600px] animate-in fade-in duration-500">

        {/* Left Side - Visual & Welcome */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-emerald-700 to-[#16271E] relative flex flex-col justify-between p-8 lg:p-12 text-white overflow-hidden">
          {/* Decorative Circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-64 h-64 bg-emerald-600/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

          {/* Islamic Geometric Ornament Pattern Overlay */}
          <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.07] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] bg-repeat"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6 lg:mb-8">
              <div className="w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center shrink-0 overflow-hidden -mt-1 lg:-mt-2">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-xl lg:text-2xl font-bold tracking-wide block leading-none">SiTQA</span>
                <span className="text-[10px] lg:text-sm text-emerald-100/80 block font-light mt-1">Sistem Informasi Tahfidz Qur'an Al Irsyad</span>
              </div>
            </div>

            <h1 className="text-2xl lg:text-4xl font-bold leading-tight mb-3 lg:mb-4">
              Ahlan Wa Sahlan,<br />
              Selamat Datang.
            </h1>
            <p className="text-emerald-100/90 text-sm lg:text-lg font-light leading-relaxed">
              Platform monitoring hafalan Al-Qur'an terintegrasi untuk mencetak generasi Qur'ani yang unggul dan berakhlak mulia.
            </p>
          </div>

          <div className="relative z-10 mt-6 lg:mt-0">
            <blockquote className="border-l-4 border-emerald-400 pl-4 italic text-emerald-100/90">
              "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya."
              <br />
              <span className="text-sm font-semibold not-italic mt-2 block opacity-75">- HR. Bukhari</span>
            </blockquote>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-12 flex flex-col justify-center bg-white dark:bg-[#111D16]">
          <div className="mb-6 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Login ke Akun Anda</h2>
            <p className="text-gray-500 text-sm">Silahkan pilih peran dan masukkan kredensial Anda.</p>
          </div>

          {/* Role Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-[#0B140F] p-1 rounded-xl mb-6 lg:mb-8 border border-gray-250 dark:border-white/5">
            <button
              onClick={() => {
                setRole('teacher');
                setError('');
              }}
              className={`w-1/2 py-2 flex items-center justify-center gap-2 text-sm font-semibold rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ease-in-out ${
                role === 'teacher'
                  ? 'bg-white dark:bg-[#111D16] border border-gray-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'bg-transparent border border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <School size={18} />
              Guru / Ustadz
            </button>
            <button
              onClick={() => {
                setRole('student');
                setError('');
              }}
              className={`w-1/2 py-2 flex items-center justify-center gap-2 text-sm font-semibold rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ease-in-out ${
                role === 'student'
                  ? 'bg-white dark:bg-[#111D16] border border-gray-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'bg-transparent border border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <GraduationCap size={18} />
              Siswa
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 lg:space-y-5">
            {role === 'teacher' ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-200 ml-1">Username / NIP</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Masukkan username"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0B140F] focus:border-emerald-500 focus:dark:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-200 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="********"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0B140F] focus:border-emerald-500 focus:dark:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-200 ml-1">Kelas</label>
                  <CustomDropdown
                    value={selectedClass}
                    onChange={(val) => {
                      setSelectedClass(val);
                      setSelectedStudentId('');
                    }}
                    options={availableClasses.map(cls => ({ label: cls, value: cls }))}
                    placeholder="Pilih Kelas"
                    icon={<School size={20} />}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-200 ml-1">Nama Siswa</label>
                  <CustomDropdown
                    value={selectedStudentId}
                    onChange={setSelectedStudentId}
                    disabled={!selectedClass}
                    options={filteredStudents.map(student => ({ label: student.name, value: student.id }))}
                    placeholder="-- Pilih Nama --"
                    icon={<Users size={20} />}
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 text-sm rounded-xl font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className={`
                w-full h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 mt-6 lg:mt-8 transition-all duration-300
                ${isFormValid()
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                  : 'bg-gray-300 cursor-not-allowed text-gray-500'
                }
              `}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Masuk Sekarang
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

