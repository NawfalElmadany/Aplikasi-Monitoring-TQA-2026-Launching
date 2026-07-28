import React from 'react';

export interface User {
  name: string;
  role: 'teacher' | 'student';
  avatar?: string;
  studentId?: string; // Optional: Link to a specific student ID if role is student
}

export interface Student {
  id: string;
  name: string;
  class: string;
  avatar: string;

  // Progress Data
  type?: 'Hafalan' | 'Tartili'; // Renamed Iqra to Tartili
  currentJuz?: number;
  currentSurah: string; // Used for Surah Name OR "Iqra Jilid X" display string
  jenisSetoran?: 'Lanjut' | 'Mengulang' | 'Drill'; // New field for setoran type

  // Iqra/Tartili Specific
  iqraLevel?: number; // 1-6
  page?: string; // Halaman

  totalProgress: number; // Percentage 0-100
  lastUpdate: string;
  lastScore?: number;
  status: 'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Perlu Bimbingan';
  notes?: string; // Catatan evaluation
  requiresAttention?: boolean; // Flag to show in dashboard notifications
}

export interface StatItem {
  title: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  trend?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

export interface AcademicYear {
  year: string;
  semester: string;
  startDate: string;
  endDate: string;
}

export interface Target {
  id: number;
  level: string;
  target: string;
}

export interface Teacher {
  id: number;
  name: string;
  role: string;
  class: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  category: string;
  date: string;
  color: string;
}

export interface MurojaahEntry {
  id: number;
  juz: number;
  surah: string;
  status: 'completed' | 'pending' | 'upcoming';
  date: string;
  score?: number;
  type: 'individual' | 'classical';
  className?: string;
}

export interface GharibEntry {
  id: string;
  className: string;
  date: string;
  status: 'Lanjut' | 'Mengulang';
  material: string;
  notes?: string;
  createdAt?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  date: string;
  status: 'present' | 'permission' | 'sick' | 'alpha';
  createdAt?: string;
}


