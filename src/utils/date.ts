import jalaali from 'jalaali-js';

/**
 * Convert a Gregorian date to Jalali display format
 * @param dateISO - ISO date string or Date object
 * @returns Jalali date in format "۱۴۰۴/۰۴/۲۳"
 */
export function toJalaliDisplay(dateISO: string | Date): string {
  if (!dateISO) return '';
  
  const date = typeof dateISO === 'string' ? new Date(dateISO) : dateISO;
  if (isNaN(date.getTime())) return '';
  
  const jalali = jalaali.toJalaali(date);
  
  // Convert to Persian digits
  const persianDay = jalali.jd.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  const persianMonth = jalali.jm.toString().padStart(2, '0').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  const persianYear = jalali.jy.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  
  return `${persianYear}/${persianMonth}/${persianDay}`;
}

/**
 * Convert Jalali date string to Gregorian ISO string
 * @param dateJalali - Jalali date in format "1404/04/23" or "۱۴۰۴/۰۴/۲۳"
 * @returns ISO date string
 */
export function jalaliToGregorian(dateJalali: string): string {
  if (!dateJalali) return '';
  
  // Convert Persian digits to English
  const englishDate = dateJalali.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
  
  const parts = englishDate.split('/');
  if (parts.length !== 3) return '';
  
  const jy = parseInt(parts[0]);
  const jm = parseInt(parts[1]);
  const jd = parseInt(parts[2]);
  
  if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return '';
  
  try {
    const gregorian = jalaali.toGregorian(jy, jm, jd);
    return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd).toISOString();
  } catch (error) {
    console.error('Error converting Jalali to Gregorian:', error);
    return '';
  }
}

/**
 * Convert Gregorian date to Jalali object for date picker
 * @param dateISO - ISO date string or Date object
 * @returns Jalali date object {year, month, day}
 */
export function toJalaliObject(dateISO: string | Date): { year: number; month: number; day: number } | null {
  if (!dateISO) return null;
  
  const date = typeof dateISO === 'string' ? new Date(dateISO) : dateISO;
  if (isNaN(date.getTime())) return null;
  
  const jalali = jalaali.toJalaali(date);
  return {
    year: jalali.jy,
    month: jalali.jm,
    day: jalali.jd
  };
}

/**
 * Convert Jalali object to Gregorian ISO string
 * @param jalaliDate - Jalali date object {year, month, day}
 * @returns ISO date string
 */
export function jalaliObjectToGregorian(jalaliDate: { year: number; month: number; day: number }): string {
  if (!jalaliDate || !jalaliDate.year || !jalaliDate.month || !jalaliDate.day) return '';
  
  try {
    const gregorian = jalaali.toGregorian(jalaliDate.year, jalaliDate.month, jalaliDate.day);
    return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd).toISOString();
  } catch (error) {
    console.error('Error converting Jalali object to Gregorian:', error);
    return '';
  }
}

/**
 * Get current Jalali date
 * @returns Current date in Jalali format "۱۴۰۴/۰۴/۲۳"
 */
export function getCurrentJalali(): string {
  return toJalaliDisplay(new Date());
}

/**
 * Get Jalali month names
 */
export const jalaliMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

/**
 * Get Jalali weekday names
 */
export const jalaliWeekdays = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
];