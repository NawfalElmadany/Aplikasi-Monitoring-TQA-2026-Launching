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
  ImageRun
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
  const formatDateId = (dateStr: string) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const periodeLabel = reportFilterMode === 'month'
    ? getDisplayMonthLabel(reportMonth)
    : `${formatDateId(reportStartDate)} s/d ${formatDateId(reportEndDate)}`;

  // Fetch logo image data as ArrayBuffer if logoUrl is provided
  let logoImageRun: ImageRun | null = null;
  if (logoUrl) {
    try {
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      logoImageRun = new ImageRun({
        data: arrayBuffer,
        transformation: {
          width: 85,
          height: 85,
        },
        type: 'png',
      });
    } catch (e) {
      console.warn('Could not load logo for DOCX report:', e);
    }
  }

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

  // Top Header Table (Logo + School info + Report info)
  const topHeaderTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderless,
    rows: [
      new TableRow({
        children: [
          // Logo Cell
          new TableCell({
            width: { size: logoImageRun ? 13 : 0, type: WidthType.PERCENTAGE },
            borders: borderless,
            margins: { top: 0, bottom: 0, left: 0, right: 100 },
            children: logoImageRun
              ? [new Paragraph({ children: [logoImageRun], alignment: AlignmentType.LEFT })]
              : [],
          }),
          // Agency Info Cell
          new TableCell({
            width: { size: logoImageRun ? 52 : 65, type: WidthType.PERCENTAGE },
            borders: borderless,
            margins: { top: 0, bottom: 0, left: 0, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: 'MI AL IRSYAD KOTA MADIUN',
                    bold: true,
                    size: 28, // 14pt
                    color: '059669', // Emerald-600
                    font: 'Times New Roman'
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
                    font: 'Times New Roman'
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: 'Jl. Diponegoro No. 112B Kota Madiun, Jawa Timur',
                    size: 18, // 9pt
                    color: '64748B',
                    font: 'Times New Roman'
                  })
                ]
              }),
            ],
          }),
          // Report Metadata Cell
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: borderless,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'LAPORAN CAPAIAN TQA',
                    bold: true,
                    size: 26, // 13pt
                    color: '0F172A',
                    font: 'Times New Roman'
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
                    font: 'Times New Roman'
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Kelas: ${reportClass}`,
                    bold: true,
                    size: 18,
                    color: '475569',
                    font: 'Times New Roman'
                  })
                ]
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Green separator line below header
  const headerDivider = new Paragraph({
    spacing: { before: 100, after: 250 },
    border: {
      bottom: {
        color: '059669',
        space: 1,
        style: BorderStyle.SINGLE,
        size: 12, // 1.5pt solid emerald green line
      },
    },
  });

  // Main Data Table Headers
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
              font: 'Times New Roman'
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
                font: 'Times New Roman'
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
    spacing: { before: 300 },
    alignment: AlignmentType.RIGHT,
    children: [
      new TextRun({
        text: `Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        italics: true,
        size: 16,
        color: '94A3B8',
        font: 'Times New Roman'
      })
    ]
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
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
              top: 720,   // 0.5 in
              right: 720,
              bottom: 720,
              left: 720
            }
          }
        },
        children: [
          topHeaderTable,
          headerDivider,
          mainTable,
          footerParagraph
        ]
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
