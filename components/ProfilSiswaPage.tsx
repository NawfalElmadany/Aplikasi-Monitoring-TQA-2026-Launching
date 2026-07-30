import { getAvatarUrl } from '../utils/avatar';
import React, { useState, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { User as UserIcon, Upload, CheckCircle2, Loader2, AlertCircle, Shield, Award, GraduationCap } from 'lucide-react';
import { Student, User } from '../types';
import Header from './Header';
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

interface ProfilSiswaPageProps {
    user: User;
    students: Student[];
    onUpdateStudent: (studentId: string, data: Partial<Student>) => Promise<void>;
    onSaveProfile: (data: Partial<User>) => void;
    onMenuClick: () => void;
    notifications?: Student[];
    onDismissNotification?: (studentId: string) => void;
    onSearchClick?: () => void;
    unreadNotesCount?: number;
}

const ProfilSiswaPage: React.FC<ProfilSiswaPageProps> = ({
    user,
    students,
    onUpdateStudent,
    onSaveProfile,
    onMenuClick,
    notifications = [],
    onDismissNotification,
    onSearchClick,
    unreadNotesCount = 0
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // react-easy-crop state hooks
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCroppingOpen, setIsCroppingOpen] = useState(false);
    const [originalFileName, setOriginalFileName] = useState('');

    // Find the student record associated with this user
    const currentStudent = students.find(s => 
        (user.studentId && s.id === user.studentId) || 
        s.name.toUpperCase() === user.name.toUpperCase()
    );

    const studentId = currentStudent?.id || user.studentId || '1';
    const studentName = currentStudent?.name || user.name;
    const studentClass = currentStudent?.class || '5B';
    const nis = `2600${studentId.padStart(3, '0')}`;
    const avatarUrl = currentStudent?.avatar || user.avatar || getAvatarUrl(studentName);

    const handleUploadClick = () => {
        if (user.role !== 'teacher') return;
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (user.role !== 'teacher') return;
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
        setShowSuccess(false);
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
                const fileName = `${studentId}-${Date.now()}.${fileExt}`;
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
            await onUpdateStudent(studentId, { avatar: finalUrl });
            onSaveProfile({ avatar: finalUrl });

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 4000);
        } catch (error: any) {
            console.error('Failed to crop/upload image:', error);
            setUploadError(error.message || 'Gagal mengunggah foto profil.');
        } finally {
            setIsUploading(false);
            setImageSrc(null);
            setCroppedAreaPixels(null);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleCropCancel = () => {
        setIsCroppingOpen(false);
        setImageSrc(null);
        setCroppedAreaPixels(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6 lg:space-y-0 lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden h-full animate-in fade-in duration-500 font-sans">
            {/* Header */}
            <div className="sticky top-4 z-30 bg-gradient-to-br from-white to-emerald-50/60 dark:bg-[#15231A] dark:bg-none p-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-lg dark:shadow-black/30 border border-emerald-400 dark:border-white/15 flex justify-between items-center mt-4 sm:mt-6 mb-8 flex-none transition-all duration-300 no-print">
                <Header
                    user={user}
                    onMenuClick={onMenuClick}
                    notifications={notifications}
                    onDismissNotification={onDismissNotification}
                    onSearchClick={onSearchClick}
                    flat={true}
                    title="Profil Saya"
                    subtitle="Kelola foto profil dan lihat informasi identitas Anda"
                    unreadNotesCount={unreadNotesCount}
                />
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto scrollbar-hide pb-16 px-1">
                <div className="w-full max-w-3xl flex flex-col gap-6">
                    {/* Alerts */}
                    {uploadError && (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-4 rounded-2xl flex items-start gap-3 shadow-sm text-red-800 dark:text-red-300 text-sm">
                            <AlertCircle className="shrink-0 mt-0.5" size={18} />
                            <span>{uploadError}</span>
                        </div>
                    )}

                    {showSuccess && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-4 rounded-2xl flex items-start gap-3 shadow-sm text-emerald-800 dark:text-emerald-300 text-sm">
                            <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-500" size={18} />
                            <span>Foto profil berhasil diperbarui!</span>
                        </div>
                    )}

                    {/* Main Profil Card */}
                    <div className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 transition-colors duration-300">
                        {/* Avatar Upload Component */}
                        <div className="relative group shrink-0">
                            <div 
                                onClick={user.role === 'teacher' ? handleUploadClick : undefined}
                                className={`w-36 h-36 rounded-full overflow-hidden border-4 border-emerald-50 dark:border-[#1A2E24] shadow-md relative bg-slate-100 dark:bg-[#09120E] flex items-center justify-center ${user.role === 'teacher' ? 'cursor-pointer' : ''}`}
                            >
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={studentName} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon size={64} className="text-slate-400" />
                                ) }

                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                                        <Loader2 className="animate-spin" size={28} />
                                    </div>
                                )}
                            </div>

                            {user.role === 'teacher' && (
                                <button
                                    onClick={handleUploadClick}
                                    disabled={isUploading}
                                    className="absolute -bottom-2 right-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-full shadow-lg border-2 border-white dark:border-[#121F18] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Ubah Foto Profil"
                                >
                                    <Upload size={16} />
                                </button>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        {/* Student Main Info Panel */}
                        <div className="flex-1 text-center md:text-left space-y-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200/50 dark:border-emerald-900/30">
                                <GraduationCap size={14} />
                                Status: Aktif
                            </span>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{studentName}</h3>
                            <p className="text-slate-500 dark:text-[#8BA398] text-sm font-semibold">
                                Murid MI Al Irsyad Kota Madiun
                            </p>
                        </div>
                    </div>

                    {/* Identity Details Card */}
                    <div className="bg-white dark:bg-[#121F18] border border-slate-200 dark:border-[#1A2E24] rounded-3xl p-8 shadow-sm space-y-6 transition-colors duration-300">
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#1A2E24] pb-4">
                            <Shield className="text-emerald-600 dark:text-emerald-400" size={20} />
                            <h4 className="font-extrabold text-slate-800 dark:text-[#E2EAE5]">Identitas Terkunci</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* NIS (Locked) */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Nomor Induk Siswa (NIS)</label>
                                <div className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#1A2E24] bg-slate-50 dark:bg-[#09120E]/50 text-slate-500 dark:text-[#8BA398] font-bold select-none cursor-not-allowed">
                                    {nis}
                                </div>
                            </div>

                            {/* Class (Locked) */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Kelas</label>
                                <div className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#1A2E24] bg-slate-50 dark:bg-[#09120E]/50 text-slate-500 dark:text-[#8BA398] font-bold select-none cursor-not-allowed">
                                    Kelas {studentClass}
                                </div>
                            </div>

                            {/* Full Name (Locked) */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-slate-400 dark:text-[#8BA398] uppercase tracking-wider">Nama Lengkap</label>
                                <div className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#1A2E24] bg-slate-50 dark:bg-[#09120E]/50 text-slate-500 dark:text-[#8BA398] font-bold select-none cursor-not-allowed">
                                    {studentName}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-[#09120E]/55 p-4 rounded-xl border border-slate-200 dark:border-[#1A2E24]">
                            <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-slate-500 dark:text-[#8BA398] leading-relaxed">
                                Data identitas (NIS, Nama Lengkap, Kelas) di atas dikunci secara sistem untuk alasan keamanan. Jika terdapat kesalahan pencatatan, silakan hubungi bagian Administrasi Madrasah atau Ustadz Pembimbing Anda untuk melakukan pembaruan data.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

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
        </div>
    );
};

export default ProfilSiswaPage;
