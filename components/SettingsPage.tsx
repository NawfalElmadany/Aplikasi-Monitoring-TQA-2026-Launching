import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Calendar, BookOpen, Users, Save, Plus, Trash2, Edit2, Eye, EyeOff, Loader2, CheckCircle2, Shield, Download, Upload, AlertTriangle, AlertCircle, RotateCw } from 'lucide-react';
import { User, AcademicYear, Target, Teacher } from '../types';
import TeacherModal from './TeacherModal';
import Header from './Header';
import { Student } from '../types';
import Cropper from 'react-easy-crop';
import { supabase } from '../lib/supabase';

const getCroppedImg = (
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('No 2d context'));
                return;
            }
            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;
            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/jpeg');
        };
        image.onerror = (err) => reject(err);
    });
};


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
    onCheckForUpdates?: () => void;
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
    onSearchClick,
    onCheckForUpdates
}) => {
    const [activeTab, setActiveTab] = useState('profile');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarFileInputRef = useRef<HTMLInputElement>(null);

    // Teacher Modal State
    const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

    // Profile photo upload/cropper states
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCroppingOpen, setIsCroppingOpen] = useState(false);
    const [originalFileName, setOriginalFileName] = useState('');

    // Mock Data & State
    const [profile, setProfile] = useState({
        name: 'Ustadz Abdullah, S.Pd.I',
        password: 'password123',
        role: 'Head Teacher',
        email: 'abdullah@tqa-madiun.sch.id',
        avatar: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

    useEffect(() => {
        if (user) {
            setProfile(prev => ({
                ...prev,
                name: user.name,
                role: user.role === 'teacher' ? 'Head Teacher' : 'Student',
                avatar: user.avatar || ''
            }));
        }
    }, [user]);

    const handleUploadClick = () => {
        if (avatarFileInputRef.current) {
            avatarFileInputRef.current.click();
        }
    };

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            setUploadError('Tolong pilih file gambar saja (JPG, PNG, WebP).');
            return;
        }

        // Limit 2MB
        if (file.size > 2 * 1024 * 1024) {
            setUploadError('Ukuran gambar maksimal adalah 2MB.');
            return;
        }

        setOriginalFileName(file.name);
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImageSrc(reader.result as string);
            setIsCroppingOpen(true);
        });
        reader.readAsDataURL(file);
    };

    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropAndUpload = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsUploading(true);
        setUploadError(null);
        setIsCroppingOpen(false);

        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            // Convert Blob to File
            const croppedFile = new File([croppedBlob], originalFileName, {
                type: 'image/jpeg',
                lastModified: Date.now()
            });

            let finalUrl = '';

            if (supabase) {
                // Try uploading to Supabase Storage bucket: avatars
                const fileExt = originalFileName.split('.').pop() || 'jpg';
                const fileName = `teacher-${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, croppedFile, { cacheControl: '3600', upsert: true });

                if (!uploadError) {
                    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
                    finalUrl = data?.publicUrl || '';
                } else {
                    console.warn('Supabase storage upload error, falling back to local base64:', uploadError);
                }
            }

            // Fallback to local Base64 string if Supabase is offline or fails
            if (!finalUrl) {
                finalUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(croppedFile);
                });
            }

            // Save updates
            onSaveProfile({ avatar: finalUrl });
            setProfile(prev => ({ ...prev, avatar: finalUrl }));

            // Reset success message after 3 seconds
            setSaveStatus('success');
            setTimeout(() => {
                setSaveStatus('idle');
            }, 3000);

        } catch (error: any) {
            console.error('Failed to crop/upload image:', error);
            setUploadError(error.message || 'Gagal mengunggah foto profil.');
        } finally {
            setIsUploading(false);
            setImageSrc(null);
            setCroppedAreaPixels(null);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
            if (avatarFileInputRef.current) {
                avatarFileInputRef.current.value = '';
            }
        }
    };

    const handleCropCancel = () => {
        setIsCroppingOpen(false);
        setImageSrc(null);
        setCroppedAreaPixels(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        if (avatarFileInputRef.current) {
            avatarFileInputRef.current.value = '';
        }
    };

    const handleSaveProfile = () => {
        setIsLoading(true);
        setSaveStatus('idle');

        // Simulate API call
        setTimeout(() => {
            onSaveProfile({ name: profile.name, avatar: profile.avatar });
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

                            {/* Alerts */}
                            {uploadError && (
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-4 rounded-2xl flex items-start gap-3 shadow-sm text-red-800 dark:text-red-300 text-sm">
                                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                                    <span>{uploadError}</span>
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* Left Side: Avatar Upload */}
                                <div className="flex flex-col items-center gap-3 shrink-0 mx-auto md:mx-0">
                                    <div className="relative group">
                                        <div
                                            onClick={handleUploadClick}
                                            className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-50 dark:border-[#1A2E24] shadow-md relative bg-slate-100 dark:bg-[#09120E] flex items-center justify-center cursor-pointer"
                                        >
                                            {profile.avatar ? (
                                                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon size={56} className="text-slate-400" />
                                            )}

                                            {isUploading && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                                                    <Loader2 className="animate-spin" size={24} />
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleUploadClick}
                                            disabled={isUploading}
                                            className="absolute -bottom-1 -right-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-[#121F18] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Ubah Foto Profil"
                                        >
                                            <Upload size={14} />
                                        </button>
                                    </div>
                                    <span className="text-xs font-semibold text-gray-500">Klik untuk mengubah foto</span>
                                    <input
                                        type="file"
                                        ref={avatarFileInputRef}
                                        onChange={handleAvatarFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>

                                {/* Right Side: Profile Details */}
                                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    {/* Image Cropper Modal */}
                    {isCroppingOpen && imageSrc && (
                        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                    <h3 className="text-lg font-bold text-white">
                                        Sesuaikan Foto Profil
                                    </h3>
                                </div>

                                {/* Cropper Container */}
                                <div className="relative w-full h-72 bg-slate-950 rounded-2xl overflow-hidden border border-white/5">
                                    <Cropper
                                        image={imageSrc}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={1}
                                        cropShape="round"
                                        showGrid={false}
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                    />
                                </div>

                                {/* Slider control */}
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perbesar / Perkecil</label>
                                        <span className="text-xs text-slate-500 font-semibold">{Math.round(zoom * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={1}
                                        max={3}
                                        step={0.05}
                                        value={zoom}
                                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                </div>

                                {/* Action buttons */}
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={handleCropCancel}
                                        className="px-4 py-2 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer border border-white/10"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleCropAndUpload}
                                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                    >
                                        Terapkan Profil
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Data & Security Section */}
                    {activeTab === 'data' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-4">Pengelolaan & Keamanan Aplikasi</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                        className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
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
                                        className="w-full py-2.5 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Upload size={18} />
                                        Pilih File Backup
                                    </button>
                                </div>

                                {/* App Update Card */}
                                <div className="border border-gray-200 rounded-xl p-6 space-y-4 hover:border-teal-500 transition-colors">
                                    <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/20 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 mb-2">
                                        <RotateCw size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">Pembaruan Aplikasi</h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Periksa apakah ada versi aplikasi terbaru yang dirilis oleh pengembang.
                                        </p>
                                    </div>
                                    <button
                                        onClick={onCheckForUpdates}
                                        className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <RotateCw size={18} />
                                        Periksa Pembaruan
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
