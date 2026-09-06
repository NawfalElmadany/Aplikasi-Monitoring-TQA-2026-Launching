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
  ImageRun,
  VerticalAlign,
  PageBreak
} from 'docx';

export interface WordReportOptions {
  logoUrl?: string;
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

export interface AllClassesWordReportOptions {
  logoUrl?: string;
  reportFilterMode: 'month' | 'range';
  reportMonth: string;
  reportStartDate: string;
  reportEndDate: string;
  getDisplayMonthLabel: (month: string) => string;
  allClassesData: Array<{
    className: string;
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
  }>;
}

const createClassReportElements = (
  logoImageRun: ImageRun | null,
  reportFilterMode: 'month' | 'range',
  reportMonth: string,
  reportStartDate: string,
  reportEndDate: string,
  reportClass: string,
  getDisplayMonthLabel: (month: string) => string,
  reportData: WordReportOptions['reportData']
) => {
  const formatDateId = (dateStr: string) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const periodeLabel = reportFilterMode === 'month'
    ? getDisplayMonthLabel(reportMonth)
    : `${formatDateId(reportStartDate)} s/d ${formatDateId(reportEndDate)}`;

  const noBorder = {
    style: BorderStyle.NONE,
    size: 0,
    color: 'FFFFFF',
  };

  const borderless = {
    top: noBorder,
    bottom: noBorder,
    left: noBorder,
    right: noBorder,
  };

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

  // Top Header Table
  const topHeaderTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderless,
    rows: [
      new TableRow({
        children: [
          // Logo Cell
          new TableCell({
            width: { size: logoImageRun ? 12 : 0, type: WidthType.PERCENTAGE },
            borders: borderless,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 0, bottom: 0, left: 0, right: 100 },
            children: logoImageRun
              ? [new Paragraph({ children: [logoImageRun], alignment: AlignmentType.LEFT, spacing: { before: 0, after: 0 } })]
              : [],
          }),
          // Agency Info Cell
          new TableCell({
            width: { size: logoImageRun ? 53 : 65, type: WidthType.PERCENTAGE },
            borders: borderless,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 0, bottom: 0, left: 0, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 20, line: 240 },
                children: [
                  new TextRun({
                    text: 'MI AL IRSYAD KOTA MADIUN',
                    bold: true,
                    size: 26, // 13pt
                    color: '059669', // Emerald-600
                    font: 'Calibri'
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 20, line: 240 },
                children: [
                  new TextRun({
                    text: "Program Tahfidz Al-Qur'an (TQA)",
                    bold: true,
                    size: 20, // 10pt
                    color: '1E293B',
                    font: 'Calibri'
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 0, line: 240 },
                children: [
                  new TextRun({
                    text: 'Jl. Diponegoro No. 112B Kota Madiun, Jawa Timur',
                    size: 16, // 8pt
                    color: '64748B',
                    font: 'Calibri'
                  })
                ]
              }),
            ],
          }),
          // Report Metadata Cell
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: borderless,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 20, line: 240 },
                children: [
                  new TextRun({
                    text: 'Laporan Capaian TQA',
                    bold: true,
                    size: 24, // 12pt
                    color: '0F172A',
                    font: 'Calibri'
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 20, line: 240 },
                children: [
                  new TextRun({
                    text: `Periode: ${periodeLabel}`,
                    size: 16, // 8pt
                    color: '475569',
                    font: 'Calibri'
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 0, line: 240 },
                children: [
                  new TextRun({
                    text: `Kelas: ${reportClass}`,
                    size: 16, // 8pt
                    color: '475569',
                    font: 'Calibri'
                  })
                ]
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Solid green separator line below header
  const headerDivider = new Paragraph({
    spacing: { before: 100, after: 200 },
    border: {
      bottom: {
        color: '059669',
        space: 1,
        style: BorderStyle.SINGLE,
        size: 14, // 1.75pt solid emerald green line
      },
    },
  });

  // Main Data Table Headers
  const headers = [
    { text: 'No', width: 4, align: AlignmentType.CENTER },
    { text: 'Nama Siswa', width: 24, align: AlignmentType.LEFT },
    { text: 'Hafalan Awal', width: 10.2, align: AlignmentType.CENTER },
    { text: 'Hafalan Akhir', width: 10.2, align: AlignmentType.CENTER },
    { text: 'Drill Munaqosah', width: 10.2, align: AlignmentType.CENTER },
    { text: 'Tartili Awal', width: 10.2, align: AlignmentType.CENTER },
    { text: 'Tartili Akhir', width: 10.2, align: AlignmentType.CENTER },
    { text: 'Drill Tartili', width: 10.2, align: AlignmentType.CENTER },
    { text: 'Gharib', width: 10.4, align: AlignmentType.CENTER }
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(h => new TableCell({
      width: { size: h.width, type: WidthType.PERCENTAGE },
      shading: { fill: '059669' }, // Emerald-600
      borders: headerBorders,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 100, bottom: 100, left: 80, right: 80 },
      children: [
        new Paragraph({
          alignment: h.align,
          spacing: { before: 0, after: 0, line: 220 },
          children: [
            new TextRun({
              text: h.text,
              bold: true,
              color: 'FFFFFF',
              size: 17, // ~8.5pt
              font: 'Calibri'
            })
          ]
        })
      ]
    }))
  });

  const dataRows = reportData.map((student, index) => {
    const isOdd = index % 2 === 1;
    const bgFill = isOdd ? 'F0FDF4' : 'FFFFFF';

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
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: cell.align,
            spacing: { before: 0, after: 0, line: 220 },
            children: [
              new TextRun({
                text: cell.text,
                bold: cell.bold,
                color: '1E293B',
                size: 16, // 8pt
                font: 'Calibri'
              })
            ]
          })
        ]
      }))
    });
  });

  const mainTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows]
  });

  const footerParagraph = new Paragraph({
    spacing: { before: 200, after: 0 },
    alignment: AlignmentType.RIGHT,
    children: [
      new TextRun({
        text: `Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        italics: true,
        size: 15,
        color: '94A3B8',
        font: 'Calibri'
      })
    ]
  });

  return [topHeaderTable, headerDivider, mainTable, footerParagraph];
};

const loadLogoImageRun = async (logoUrl?: string): Promise<ImageRun | null> => {
  if (!logoUrl) return null;
  try {
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return new ImageRun({
      data: arrayBuffer,
      transformation: {
        width: 82,
        height: 54,
      },
      type: 'png',
    });
  } catch (e) {
    console.warn('Could not load logo for DOCX report:', e);
    return null;
  }
};

export const generateMonthlyReportDocx = async ({
  logoUrl,
  reportFilterMode,
  reportMonth,
  reportStartDate,
  reportEndDate,
  reportClass,
  getDisplayMonthLabel,
  reportData
}: WordReportOptions) => {
  const logoImageRun = await loadLogoImageRun(logoUrl);
  const elements = createClassReportElements(
    logoImageRun,
    reportFilterMode,
    reportMonth,
    reportStartDate,
    reportEndDate,
    reportClass,
    getDisplayMonthLabel,
    reportData
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE
            },
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720
            }
          }
        },
        children: elements
      }
    ]
  });

  const fileName = reportFilterMode === 'month'
    ? `Laporan_TQA_${reportClass}_${reportMonth}.docx`
    : `Laporan_TQA_${reportClass}_Periode.docx`;

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateAllClassesMonthlyReportDocx = async ({
  logoUrl,
  reportFilterMode,
  reportMonth,
  reportStartDate,
  reportEndDate,
  getDisplayMonthLabel,
  allClassesData
}: AllClassesWordReportOptions) => {
  const logoImageRun = await loadLogoImageRun(logoUrl);
  const sectionChildren: any[] = [];

  allClassesData.forEach((classSection, classIdx) => {
    if (classIdx > 0) {
      sectionChildren.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }
    const classElements = createClassReportElements(
      logoImageRun,
      reportFilterMode,
      reportMonth,
      reportStartDate,
      reportEndDate,
      classSection.className,
      getDisplayMonthLabel,
      classSection.reportData
    );
    sectionChildren.push(...classElements);
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE
            },
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720
            }
          }
        },
        children: sectionChildren
      }
    ]
  });

  const fileName = reportFilterMode === 'month'
    ? `Laporan_TQA_Semua_Kelas_${reportMonth}.docx`
    : `Laporan_TQA_Semua_Kelas_Periode.docx`;

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
