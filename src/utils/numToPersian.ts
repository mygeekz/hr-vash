// src/utils/numToPersian.ts
// تبدیل عدد (تا 15 رقم) به حروف فارسی – بدون وابستگی خارجی
const yekan = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const dahgan = ["", "ده", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const sadgan = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
const dahTayi = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
const groups = ["", "هزار", "میلیون", "میلیارد", "تریلیون", "کوادریلیون"];

function threeDigitsToWord(num: number): string {
  let out = "";
  const s = Math.floor(num / 100);
  const d = Math.floor((num % 100) / 10);
  const y = num % 10;

  if (s) out += sadgan[s];
  const and = (s && (d || y)) ? " و " : "";

  if (d === 1) {
    return out + and + dahTayi[y];
  } else {
    const dPart = d ? dahgan[d] : "";
    const yPart = y ? yekan[y] : "";
    const joiner = (d && y) ? " و " : "";
    return out + and + dPart + joiner + yPart;
  }
}

export const numToPersian = (input: number | string): string => {
  let n = typeof input === "string" ? Number(input.replace(/,/g, "")) : input;
  if (!isFinite(n) || n < 0) return "";
  if (n === 0) return "صفر";

  let chunkIndex = 0;
  const words: string[] = [];

  while (n > 0 && chunkIndex < groups.length) {
    const chunk = n % 1000;
    if (chunk) {
      const w = threeDigitsToWord(chunk);
      const g = groups[chunkIndex];
      words.unshift(w + (g ? ` ${g}` : ""));
    }
    n = Math.floor(n / 1000);
    chunkIndex++;
  }

  return words.join(" و ");
};
