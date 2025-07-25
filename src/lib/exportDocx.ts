// src/lib/exportDocx.ts

// This is a NAMED export. The word "default" is NOT here.
export async function exportHtmlToDocx(html: string, fileName: string) {
  const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/export-docx?fileName=${encodeURIComponent(fileName)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: html,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'DOCX export failed' }));
    throw new Error(errorBody.error || 'DOCX export failed');
  }

  const blob = await res.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(downloadUrl);
}