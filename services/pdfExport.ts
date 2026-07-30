import { getAssignedTeacher } from './appData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFReportOptions {
  logoUrl: string;
  reportFilterMode: 'month' | 'range';
  reportMonth: string;
  reportStartDate: string;
  reportEndDate: string;
  reportClass: string;
  getDisplayMonthLabel: (month: string) => string;
  reportData: Array<{
    name: string;
    hafalanStart: string;
    hafalanEnd: string;
    drillMunaqosah: string;
    tartiliStart: string;
    tartiliEnd: string;
    drillTartili: string;
    gharib: string;
  }>;
}

export const generateMonthlyReportPDF = ({
  logoUrl,
  reportFilterMode,
  reportMonth,
  reportStartDate,
  reportEndDate,
  reportClass,
  getDisplayMonthLabel,
  reportData
}: PDFReportOptions) => {
  const doc = new jsPDF('landscape');

  // Header with Logo
  const logoHeight = 22;
  const logoWidth = 22 * (1024 / 676); // Aspect ratio: 1.5147
  try {
    doc.addImage(logoUrl, 'PNG', 14, 14, logoWidth, logoHeight);
  } catch {
    // Fallback if image fails to load
  }

  const textX = 14 + logoWidth + 4;
  doc.setFontSize(16);
  doc.setTextColor(16, 185, 129); // Emerald color
  doc.setFont('helvetica', 'bold');
  doc.text("MI AL IRSYAD KOTA MADIUN", textX, 22);

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.setFont('helvetica', 'bold');
  doc.text("Program Tahfidz Al-Qur'an (TQA)", textX, 28);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFont('helvetica', 'normal');
  doc.text("Jl. Diponegoro No. 112B Kota Madiun, Jawa Timur", textX, 34);

  // Line separator
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.8);
  doc.line(14, 38, 283, 38);

  // Report Info
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Laporan Capaian TQA", 283, 20, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  if (reportFilterMode === 'month') {
    doc.text(`Periode: ${getDisplayMonthLabel(reportMonth)}`, 283, 27, { align: 'right' });
  } else {
    const formatDateId = (dateStr: string) => {
      if (!dateStr) return '-';
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    };
    doc.text(`Periode: ${formatDateId(reportStartDate)} s/d ${formatDateId(reportEndDate)}`, 283, 27, { align: 'right' });
  }
  doc.text(`Kelas: ${reportClass}`, 283, 33, { align: 'right' });

  // Table
  const tableColumn = ["No", "Nama Siswa", "Hafalan Awal", "Hafalan Akhir", "Drill Munaqosah", "Tartili Awal", "Tartili Akhir", "Drill Tartili", "Gharib"];
  const tableRows = reportData.map((student, index) => [
    index + 1,
    student.name,
    student.hafalanStart,
    student.hafalanEnd,
    student.drillMunaqosah,
    student.tartiliStart,
    student.tartiliEnd,
    student.drillTartili,
    student.gharib
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 44,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
    headStyles: {
      fillColor: [5, 150, 105], // Emerald-600
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { halign: 'center' },
      3: { halign: 'center', fontStyle: 'bold' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center', fontStyle: 'bold' },
      7: { halign: 'center' },
      8: { halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [240, 253, 244] // Emerald-50
    }
  });


  const fileName = reportFilterMode === 'month'
    ? `Laporan_TQA_${reportClass}_${reportMonth}.pdf`
    : `Laporan_TQA_${reportClass}_Periode.pdf`;

  doc.save(fileName);
};
