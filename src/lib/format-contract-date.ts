// src/lib/format-contract-date.ts
export const formatContractDate = (raw?: string) => {
  if (!raw) return '';

  // اگر قبلا شمسی/متن آزاد است، همون رو بده
  if (/^1[34]\d{2}[\/\-]/.test(raw)) return raw; // 1403/04/12 ...

  // اگر ISO هست (2025-07-02T20:30:00.000Z)
  if (/T\d{2}:\d{2}/.test(raw)) {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(raw));
    } catch {
      return raw.split('T')[0].replace(/-/g, '/');
    }
  }

  return raw;
};
