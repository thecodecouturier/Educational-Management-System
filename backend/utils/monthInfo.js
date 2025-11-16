// monthInfo.js
// دوال مساعدة لحساب بيانات الشهر الحالي بدقة باستخدام dayjs والمنطقة الزمنية
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const locale = require('dayjs/plugin/localizedFormat');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(locale);

// تحميل متغيرات البيئة
require('dotenv').config();

async function getMonthInfo(year, month, tz = null) {
  // 🌍 نظام موحد ذكي: يحصل على المنطقة الزمنية من النظام الجديد
  let timezone = tz;
  
  if (!timezone) {
    try {
      // استخدام TimezoneManager الجديد
      const TimezoneManager = require('./timezoneManager');
      timezone = await TimezoneManager.getInstitutionTimezone();
    } catch (error) {
      // في حالة الفشل، استخدم متغيرات البيئة أو القيمة الافتراضية
      timezone = process.env.TIMEZONE || 'Africa/Cairo';
    }
  }
  
  console.log(`🌍 monthInfo: استخدام المنطقة الزمنية: ${timezone}`);
  
  // month: رقم الشهر من 0 (يناير) إلى 11 (ديسمبر)
  const start = dayjs.tz(`${year}-${String(month+1).padStart(2, '0')}-01`, timezone);
  const daysInMonth = start.daysInMonth();
  let daysArray = [];
  
  // خريطة تحويل أسماء الأيام من الإنجليزي إلى العربي
  const dayNamesMap = {
    'Sunday': 'الأحد',
    'Monday': 'الاثنين', 
    'Tuesday': 'الثلاثاء',
    'Wednesday': 'الأربعاء',
    'Thursday': 'الخميس',
    'Friday': 'الجمعة',
    'Saturday': 'السبت'
  };
  
  for (let d = 0; d < daysInMonth; d++) {
    const dateObj = start.add(d, 'day');
    const englishDay = dateObj.format('dddd'); // اسم اليوم بالإنجليزية
    daysArray.push({
      day: englishDay, // نحتفظ بالإنجليزية للمقارنة في subscriptionController
      dayArabic: dayNamesMap[englishDay] || englishDay, // الاسم العربي
      date: d + 1, // رقم اليوم في الشهر (1, 2, 3...)
      fullDate: dateObj.toDate()
    });
  }
  
  // تكوين اسم الشهر بالعربية يدوياً
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  
  return {
    monthName: `${monthNames[month]} ${year}`, // اسم الشهر بالعربية
    year,
    month,
    daysInMonth,
    totalDays: daysInMonth,
    daysArray
  };
}

module.exports = { getMonthInfo };
