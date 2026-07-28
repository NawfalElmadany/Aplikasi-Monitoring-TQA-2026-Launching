import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Calendar, BookOpen, Users, Save, Plus, Trash2, Edit2, Eye, EyeOff, Loader2, CheckCircle2, Shield, Download, Upload, AlertTriangle } from 'lucide-react';
import { User, AcademicYear, Target, Teacher } from '../types';
import TeacherModal from './TeacherModal';
import Header from './Header';
import { Student } from '../types';

interface SettingsPageProps {
    user: User | null;
    onSaveProfile: (data: Partial<User>) => void;
    academicYear: AcademicYear;
    setAcademicYear: (data: AcademicYear) => void;
    targets: Target[];
    setTargets: (data: Target[]) => void;
    teachers: Teacher[];
    setTeachers: (data: Teacher[]) => void;
    onBackup: () => void;
    onRestore: (file: File) => void;
    onResetData?: () => void;
    onMenuClick: () => void;
    notifications?: Student[];
    onDismissNotification?: (studentId: string) => void;
    onSearchClick?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
    user,
    onSaveProfile,
    academicYear,
    setAcademicYear,
    targets,
    setTargets,
    teachers,
    setTeachers,
    onBackup,
    onRestore,
    onResetData,
    onMenuClick,
    notifications = [],
    onDismissNotification,
    onSearchClick
}) => {
    const [activeTab, setActiveTab] = useState('profile');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Teacher Modal State
    const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

    // Mock Data & State
    const [profile, setProfile] = useState({
        name: 'Ustadz Abdullah, S.Pd.I',
        password: 'password123',
        role: 'Head Teacher',
        email: 'abdullah@tqa-madiun.sch.id'
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

    useEffect(() => {
        if (user) {
            setProfile(prev => ({
                ...prev,
                name: user.name,
                role: user.role === 'teacher' ? 'Head Teacher' : 'Student'
            }));
        }
    }, [user]);

    const handleSaveProfile = () => {
        setIsLoading(true);
        setSaveStatus('idle');

        // Simulate API call
        setTimeout(() => {
            onSaveProfile({ name: profile.name });
            setIsLoading(false);
            setSaveStatus('success');

            // Reset success message after 3 seconds
            setTimeout(() => {
                setSaveStatus('idle');
            }, 3000);
        }, 1500);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (window.confirm('Apakah Anda yakin ingin memulihkan data? Data saat ini akan ditimpa.')) {
                onRestore(file);
            }
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleResetAllData = () => {
        if (onResetData) {
            onResetData();
        }
    };

    // Teacher Management Handlers
    const handleAddTeacher = () => {
        setSelectedTeacher(null);
        setIsTeacherModalOpen(true);
    };

    const handleEditTeacher = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setIsTeacherModalOpen(true);
    };

    const handleDeleteTeacher = (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus guru ini?')) {
            setTeachers(teachers.filter(t => t.id !== id));
        }
    };

    const handleSaveTeacher = (teacherData: Omit<Teacher, 'id'> | Teacher) => {
        if ('id' in teacherData) {
            // Edit existing
            setTeachers(teachers.map(t => t.id === teacherData.id ? teacherData as Teacher : t));
        } else {
            // Add new
            const newId = Math.max(...teachers.map(t => t.id), 0) + 1;
            setTeachers([...teachers, { ...teacherData, id: newId } as Teacher]);
        }
        setIsTeacherModalOpen(false);
    };

    const tabs = [
        { id: 'profile', label: 'Profil Pengguna', icon: UserIcon },
        { id: 'academic', label: 'Tahun Ajaran', icon: Calendar },
        { id: 'targets', label: 'Target Hafalan', icon: BookOpen },
        { id: 'teachers', label: 'Manajemen Guru', icon: Users },
        { id: 'data', label: 'Data & Keamanan', icon: Shield },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Card Container */}
            <div className="sticky top-4 z-30 bg-gradient-to-br from-white to-emerald-50/60 dark:bg-[#15231A] dark:bg-none p-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-lg dark:shadow-black/30 border border-emerald-400 dark:border-white/15 flex justify-between items-center mt-4 sm:mt-6 mb-8 flex-none">
                <Header
                    user={user!}
                    onMenuClick={onMenuClick}
                    notifications={notifications}
                    onDismissNotification={onDismissNotification}
                    onSearchClick={onSearchClick}
                    flat={true}
                    title="Pengaturan"
                    subtitle="Kelola preferensi aplikasi dan data master"
                />
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Tabs */}
                <div className="w-full lg:w-64 flex flex-col gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left ${activeTab === tab.id
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {/* Profile Section */}
                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">Edit Profil Pengguna</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={profile.password}
                                            onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 outline-none pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Role</label>
                                    <input
                                        type="text"
                                        value={profile.role}
                                        disabled
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isLoading}
                                    className={`flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl transition-all shadow-sm ${saveStatus === 'success'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        } ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : saveStatus === 'success' ? (
                                        <>
                                            <CheckCircle2 size={18} />
                                            Berhasil Disimpan
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Simpan Perubahan
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Academic Year Section */}
                    {activeTab === 'academic' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">Manajemen Tahun Ajaran</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Tahun Ajaran Aktif</label>
                                    <select
                                        value={academicYear.year}
                                        onChange={(e) => setAcademicYear({ ...academicYear, year: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 outline-none bg-white"
                                    >
                                        <option>2025/2026</option>
                                        <option>2024/2025</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Semester</label>
                                    <select
                                        value={academicYear.semester}
                                        onChange={(e) => setAcademicYear({ ...academicYear, semester: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 outline-none bg-white"
                                    >
                                        <option>Ganjil</option>
                                        <option>Genap</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Tanggal Mulai</label>
                                    <input
                                        type="date"
                                        value={academicYear.startDate}
                                        onChange={(e) => setAcademicYear({ ...academicYear, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Tanggal Selesai</label>
                                    <input
                                        type="date"
                                        value={academicYear.endDate}
                                        onChange={(e) => setAcademicYear({ ...academicYear, endDate: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-200 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                                    <Save size={18} />
                                    Simpan Pengaturan
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Targets Section */}
                    {activeTab === 'targets' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                <h3 className="text-lg font-bold text-gray-800">Target Hafalan Global</h3>
                                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm">
                                    <Plus size={16} />
                                    Tambah Target
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-700 font-bold">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Level / Jilid</th>
                                            <th className="px-4 py-3">Target Kurikulum</th>
                                            <th className="px-4 py-3 rounded-r-lg text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {targets.map((target) => (
                                            <tr key={target.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">{target.level}</td>
                                                <td className="px-4 py-3 text-gray-600">{target.target}</td>
                                                <td className="px-4 py-3 flex justify-center gap-2">
                                                    <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Teachers Section */}
                    {activeTab === 'teachers' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                <h3 className="text-lg font-bold text-gray-800">Manajemen Akun Guru</h3>
                                <button
                                    onClick={handleAddTeacher}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors text-sm shadow-sm"
                                >
                                    <Plus size={16} />
                                    Tambah Guru
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {teachers.map((teacher) => (
                                    <div key={teacher.id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-emerald-500 hover:shadow-md transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                                                {teacher.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{teacher.name}</h4>
                                                <p className="text-xs text-gray-500">{teacher.role} • {teacher.class ? `Wali Kelas ${teacher.class}` : 'Tidak ada kelas'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditTeacher(teacher)}
                                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTeacher(teacher.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <TeacherModal
                        isOpen={isTeacherModalOpen}
                        onClose={() => setIsTeacherModalOpen(false)}
                        onSave={handleSaveTeacher}
                        teacher={selectedTeacher}
                    />
                    {/* Data & Security Section */}
                    {activeTab === 'data' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">Backup & Restore Data</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Backup Card */}
                                <div className="border border-gray-200 rounded-xl p-6 space-y-4 hover:border-emerald-500 transition-colors">
                                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                                        <Download size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">Backup Data</h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Unduh salinan lengkap data aplikasi (Siswa, Guru, Pengaturan) ke dalam format JSON.
                                        </p>
                                    </div>
                                    <button
                                        onClick={onBackup}
                                        className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <Download size={18} />
                                        Download Backup
                                    </button>
                                </div>

                                {/* Restore Card */}
                                <div className="border border-gray-200 rounded-xl p-6 space-y-4 hover:border-orange-200 transition-colors">
                                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 mb-2">
                                        <Upload size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">Restore Data</h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Pulihkan data dari file backup sebelumnya.
                                        </p>
                                        <div className="flex items-start gap-2 mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded-lg">
                                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                            <span>Peringatan: Tindakan ini akan menimpa seluruh data yang ada saat ini.</span>
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".json"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-2.5 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Upload size={18} />
                                        Pilih File Backup
                                    </button>
                                </div>
                            </div>

                            {/* Danger Zone: Reset Data */}
                            <div className="h-px bg-slate-100 dark:bg-dark-border my-6"></div>
                            <div className="border border-red-200 dark:border-red-950/30 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-150 rounded-full flex items-center justify-center text-red-650">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-red-800 dark:text-red-400">Zona Bahaya: Reset Seluruh Data</h4>
                                        <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">Mulai ulang penginputan data santri dan logs dari nol</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Tindakan ini akan **menghapus seluruh riwayat setoran, riwayat absensi, catatan guru, riwayat gharib, dan menyetel ulang progres hafalan seluruh siswa ke kondisi awal (kosong)**. Tindakan ini tidak dapat dibatalkan.
                                </p>
                                <button
                                    onClick={handleResetAllData}
                                    className="px-6 py-2.5 bg-red-600 hover:bg-red-750 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    Reset Data dari Nol
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
