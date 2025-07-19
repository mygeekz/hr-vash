// Persian number to text conversion utility

const ones = [
  '', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه',
  'ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'
];

const tens = [
  '', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'
];

const hundreds = [
  '', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'
];

const scales = [
  '', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'
];

function convertThreeDigits(num: number): string {
  if (num === 0) return '';
  
  let result = '';
  
  // Hundreds
  const hundredsDigit = Math.floor(num / 100);
  if (hundredsDigit > 0) {
    result += hundreds[hundredsDigit];
  }
  
  // Tens and ones
  const remainder = num % 100;
  if (remainder > 0) {
    if (result) result += ' و ';
    
    if (remainder < 20) {
      result += ones[remainder];
    } else {
      const tensDigit = Math.floor(remainder / 10);
      const onesDigit = remainder % 10;
      
      result += tens[tensDigit];
      if (onesDigit > 0) {
        result += ' و ' + ones[onesDigit];
      }
    }
  }
  
  return result;
}

export function numberToPersianText(num: number): string {
  if (num === 0) return 'صفر';
  if (num < 0) return 'منفی ' + numberToPersianText(Math.abs(num));
  
  const groups = [];
  let tempNum = num;
  
  // Split number into groups of 3 digits
  while (tempNum > 0) {
    groups.unshift(tempNum % 1000);
    tempNum = Math.floor(tempNum / 1000);
  }
  
  const result = [];
  
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const scaleIndex = groups.length - i - 1;
    
    if (group > 0) {
      const groupText = convertThreeDigits(group);
      if (scaleIndex > 0) {
        result.push(groupText + ' ' + scales[scaleIndex]);
      } else {
        result.push(groupText);
      }
    }
  }
  
  return result.join(' و ');
}

export function formatCurrency(amount: number, currency: string = 'تومان'): string {
  const text = numberToPersianText(amount);
  return `${text} ${currency}`;
}

// Convert Persian digits to English digits
export function persianToEnglishDigits(str: string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const englishDigits = '0123456789';
  
  return str.replace(/[۰-۹]/g, (match) => {
    return englishDigits[persianDigits.indexOf(match)];
  });
}

// Convert English digits to Persian digits
export function englishToPersianDigits(str: string): string {
  const englishDigits = '0123456789';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  
  return str.replace(/[0-9]/g, (match) => {
    return persianDigits[englishDigits.indexOf(match)];
  });
}

// Format number with thousands separator
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}