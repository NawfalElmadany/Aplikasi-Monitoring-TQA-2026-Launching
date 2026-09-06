import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  PageOrientation,
  Header,
  Footer
} from 'docx';

export interface WordReportOptions {
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

export const generateMonthlyReportDocx = ({
  reportFilterMode,
  reportMonth,
  reportStartDate,
  reportEndDate,
  reportClass,
  getDisplayMonthLabel,
  reportData
}: WordReportOptions) => {
  const formatDateId = (dateStr: string) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const periodeLabel = reportFilterMode === 'month'
    ? getDisplayMonthLabel(reportMonth)
    : `${formatDateId(reportStartDate)} s/d ${formatDateId(reportEndDate)}`;

  const headerBorders = {
    top: { style: BorderStyle.SINGLE, size: 6, color: '059669' },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: '059669' },
    left: { style: BorderStyle.SINGLE, size: 6, color: '059669' },
    right: { style: BorderStyle.SINGLE, size: 6, color: '059669' },
  };

  const cellBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
  };

  const headers = [
    { text: 'No', width: 5, align: AlignmentType.CENTER },
    { text: 'Nama Siswa', width: 23, align: AlignmentType.LEFT },
    { text: 'Hafalan Awal', width: 10, align: AlignmentType.CENTER },
    { text: 'Hafalan Akhir', width: 10, align: AlignmentType.CENTER },
    { text: 'Drill Munaqosah', width: 13, align: AlignmentType.CENTER },
    { text: 'Tartili Awal', width: 9, align: AlignmentType.CENTER },
    { text: 'Tartili Akhir', width: 9, align: AlignmentType.CENTER },
    { text: 'Drill Tartili', width: 10, align: AlignmentType.CENTER },
    { text: 'Gharib', width: 11, align: AlignmentType.CENTER }
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(h => new TableCell({
      width: { size: h.width, type: WidthType.PERCENTAGE },
      shading: { fill: '059669' }, // Emerald-600
      borders: headerBorders,
      margins: { top: 120, bottom: 120, left: 100, right: 100 },
      children: [
        new Paragraph({
          alignment: h.align,
          children: [
            new TextRun({
              text: h.text,
              bold: true,
              color: 'FFFFFF',
              size: 18, // 9pt
              font: 'Calibri'
            })
          ]
        })
      ]
    }))
  });

  const dataRows = reportData.map((student, index) => {
    const isOdd = index % 2 === 1;
    const bgFill = isOdd ? 'F0FDF4' : 'FFFFFF'; // Alternate light green background

    const cellsData = [
      { text: (index + 1).toString(), align: AlignmentType.CENTER, bold: false },
      { text: student.name, align: AlignmentType.LEFT, bold: true },
      { text: student.hafalanStart || '-', align: AlignmentType.CENTER, bold: false },
      { text: student.hafalanEnd || '-', align: AlignmentType.CENTER, bold: true },
      { text: student.drillMunaqosah || '-', align: AlignmentType.CENTER, bold: false },
      { text: student.tartiliStart || '-', align: AlignmentType.CENTER, bold: false },
      { text: student.tartiliEnd || '-', align: AlignmentType.CENTER, bold: true },
      { text: student.drillTartili || '-', align: AlignmentType.CENTER, bold: false },
      { text: student.gharib || '-', align: AlignmentType.CENTER, bold: false },
    ];

    return new TableRow({
      children: cellsData.map((cell, cIdx) => new TableCell({
        width: { size: headers[cIdx].width, type: WidthType.PERCENTAGE },
        shading: { fill: bgFill },
        borders: cellBorders,
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        children: [
          new Paragraph({
            alignment: cell.align,
            children: [
              new TextRun({
                text: cell.text,
                bold: cell.bold,
                color: '1E293B', // Slate-800
                size: 18, // 9pt
                font: 'Calibri'
              })
            ]
          })
        ]
      }))
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE
            },
            margin: {
              top: 720,   // 0.5 in
              right: 720,
              bottom: 720,
              left: 720
            }
          }
        },
        children: [
          // Header Agency Info
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: 'MI AL IRSYAD KOTA MADIUN',
                bold: true,
                size: 28, // 14pt
                color: '059669', // Emerald-600
                font: 'Calibri'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: "Program Tahfidz Al-Qur'an (TQA)",
                bold: true,
                size: 22, // 11pt
                color: '1E293B',
                font: 'Calibri'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Jl. Diponegoro No. 112B Kota Madiun, Jawa Timur',
                size: 18, // 9pt
                color: '64748B',
                font: 'Calibri'
              })
            ]
          }),

          // Title & Info Box
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'LAPORAN CAPAIAN TQA',
                bold: true,
                size: 24, // 12pt
                color: '0F172A',
                font: 'Calibri'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `Periode: ${periodeLabel}`,
                size: 18,
                color: '475569',
                font: 'Calibri'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `Kelas: ${reportClass}`,
                bold: true,
                size: 18,
                color: '475569',
                font: 'Calibri'
              })
            ]
          }),

          // Main Data Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows]
          }),

          // Footer info
          new Paragraph({
            spacing: { before: 300 },
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                italics: true,
                size: 16,
                color: '94A3B8',
                font: 'Calibri'
              })
            ]
          })
        ]
      }
    ]
  });

  const fileName = reportFilterMode === 'month'
    ? `Laporan_TQA_${reportClass}_${reportMonth}.docx`
    : `Laporan_TQA_${reportClass}_Periode.docx`;

  Packer.toBlob(doc).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
};
