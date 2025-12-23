/**
 * ArchivX Professional ID Engine - 2025
 */

/**
 * توليد UUID v7 مرتب زمنياً لضمان كفاءة الفهرسة (Indexing)
 */
export const generateUUIDv7 = (): string => {
  const timestamp = Date.now();
  const hexTimestamp = timestamp.toString(16).padStart(12, '0');
  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${hexTimestamp.slice(0, 8)}-${hexTimestamp.slice(8, 12)}-7${randomPart.slice(0, 3)}-${(parseInt(randomPart.slice(3, 4), 16) & 0x3 | 0x8).toString(16)}${randomPart.slice(4, 7)}-${randomPart.slice(7, 19)}`;
};

/**
 * توليد باركود أعمال فريد يجمع بين التاريخ، النوع، وجزء من UUID
 */
export const generateBusinessBarcode = (type: 'IN' | 'OUT'): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // نقتطع أول 8 أحرف من UUIDv7 لضمان التفرد مع الحفاظ على قصر الكود للطباعة
  const uniqueSegment = generateUUIDv7().split('-')[0].toUpperCase();
  
  return `${type}${year}${month}${day}-${uniqueSegment}`;
};

/**
 * تحويل البيانات إلى CSV للتصدير الاحترافي
 */
export const exportToCSV = (data: any[], fileName: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => `"${val}"`).join(',')
  ).join('\n');
  
  const csvContent = "\uFEFF" + headers + '\n' + rows; // UTF-8 BOM for Arabic support in Excel
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
