export const isFemaleName = (name: string): boolean => {
    const femaleKeywords = [
        'putri', 'nur', 'siti', 'ayu', 'lail', 'indah', 'fitri', 'zahra', 'aisyah', 'rahma', 
        'nabilah', 'annisa', 'humaira', 'khansa', 'naura', 'qisya', 'raisa', 'shakilla', 
        'vanessa', 'zivanna', 'gytha', 'kanaya', 'qaila', 'salsabila', 'shafia', 'shafira', 
        'alifya', 'aysha', 'bellvania', 'hasna', 'kaysha', 'mikhayla', 'nadhira', 'nadine', 
        'najwa', 'adzhiyya', 'afreen', 'anindita', 'arinta', 'chayra', 'amira', 'rr.', 'ning',
        'aliyya', 'atsilah', 'winnaura', 'faihannisa', 'darma', 'salsabila', 'malika', 'arsyah',
        'alshaqueena', 'aisya', 'elfira', 'semesta', 'azalea', 'atalyssa', 'tanya', 'kayla',
        'nanda', 'rengganis', 'mahya', 'wijanarko', 'riztya', 'akiko', 'iswahyuni', 'aziza',
        'indita', 'arsyila', 'darmawan', 'adrien', 'claretta', 'safira', 'nusaibah', 'ispriono',
        'rizky', 'defrian', 'akhyar', 'puspita', 'sada', 'humaiha', 'khanzara', 'ardani',
        'adifia', 'shezan', 'calista', 'anastaja', 'kirana', 'cantika', 'shafa', 'salma',
        'tsabita', 'wardah', 'zahira', 'farah', 'sabrina', 'nadia', 'nayla', 'keysha'
    ];
    
    const nameLower = name.toLowerCase();
    return femaleKeywords.some(keyword => {
        const regex = new RegExp('\\b' + keyword + '\\b|' + keyword, 'i');
        return regex.test(nameLower);
    });
};

export const getAvatarUrl = (name: string): string => {
  const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#E2EDE7" />
  <circle cx="50" cy="40" r="16" fill="#8BA398" />
  <path d="M 18 90 C 18 68, 30 58, 50 58 C 70 58, 82 68, 82 90 Z" fill="#8BA398" />
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
};
