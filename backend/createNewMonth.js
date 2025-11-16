const mongoose = require('mongoose');
const cron = require('node-cron');
const Attendance = require('./models/Attendance');

// تحميل متغيرات البيئة
require('dotenv').config();

// دالة تضيف شهر جديد لكل سجل حضور وتحتفظ فقط بآخر 3 أشهر
async function addNewMonthForAllAttendances() {
  try {
    const DB_CONNECTION = process.env.DB_CONNECTION || 'mongodb://localhost:27017/school';
    await mongoose.connect(DB_CONNECTION);
    
    const attendances = await Attendance.find();
    const Group = require('./models/Group');
    const { getMonthInfo } = require('./utils/monthInfo');
    const TimezoneManager = require('./utils/timezoneManager');
    
    // 🌍 استخدام النظام الموحد الجديد للتواريخ
    // النظام الذكي الذي يكتشف المنطقة الزمنية تلقائياً
    const dayjs = require('dayjs');
    const utc = require('dayjs/plugin/utc');
    const timezone = require('dayjs/plugin/timezone');
    
    dayjs.extend(utc);
    dayjs.extend(timezone);
    
    // الحصول على المنطقة الزمنية من النظام الجديد
    const tz = await TimezoneManager.getInstitutionTimezone();
    const now = await TimezoneManager.getInstitutionNow();
    const year = now.year();
    const month = now.month(); // dayjs يستخدم 0-11 مثل Date()
    
    console.log(`🌍 إنشاء شهر جديد بالنظام الموحد الجديد:`);
    console.log(`📅 التاريخ: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`🌎 المنطقة الزمنية: ${tz}`);
    
    const monthData = await getMonthInfo(year, month, tz);
    const monthName = monthData.monthName;
    
    for (const attendance of attendances) {
      // جلب بيانات المجموعة لهذا الطالب
      const groupId = attendance.subscriptionId ? (await mongoose.model('Subscription').findOne({ subscriptionId: attendance.subscriptionId }))?.groupId : null;
      const group = groupId ? await Group.findOne({ groupId }) : null;
      const groupDays = group && Array.isArray(group.days) ? group.days : [];
      
      // خريطة تحويل أيام الأسبوع من الإنجليزي إلى العربي
      const arabicDaysMap = {
        'Monday': 'الاثنين',
        'Tuesday': 'الثلاثاء',
        'Wednesday': 'الأربعاء',
        'Thursday': 'الخميس',
        'Friday': 'الجمعة',
        'Saturday': 'السبت',
        'Sunday': 'الأحد'
      };
      
      let weeks = [];
      let currentWeek = { weekNumber: 1, days: [] };
      
      for (let i = 0; i < monthData.daysArray.length; i++) {
        const dayObj = monthData.daysArray[i];
        const dayAr = arabicDaysMap[dayObj.day];
        if (groupDays.includes(dayAr)) {
          currentWeek.days.push({
            day: dayAr,
            date: dayObj.date,
            status: 'غائب'
          });
        }
        // إذا اليوم هو الجمعة أو آخر يوم في الشهر، أنشئ أسبوع جديد
        if (dayObj.day === 'Friday' || i === monthData.daysArray.length - 1) {
          if (currentWeek.days.length > 0) {
            weeks.push(currentWeek);
          }
          if (i !== monthData.daysArray.length - 1) {
            currentWeek = { weekNumber: weeks.length + 1, days: [] };
          }
        }
      }
      const newMonth = { month: currentMonthName, weeks };
      attendance.months.push(newMonth);
      if (attendance.months.length > 3) {
        attendance.months = attendance.months.slice(-3);
      }
      await attendance.save();
    }
    console.log('تم إضافة شهر جديد لكل سجلات الحضور بنجاح');
    mongoose.disconnect();
  } catch (err) {
    console.error('خطأ أثناء إضافة شهر جديد:', err);
  }
}

// تحديث طريقة تحديد الشهر الحالي لتكون موحدة مع باقي النظام
async function checkAndAddMonthOnStartup() {
  const DB_CONNECTION = process.env.DB_CONNECTION || 'mongodb://localhost:27017/school';
  await mongoose.connect(DB_CONNECTION);
  
  // 🌍 استخدام النظام الموحد للتاريخ والوقت
  const dayjs = require('dayjs');
  const utc = require('dayjs/plugin/utc');
  const timezone = require('dayjs/plugin/timezone');
  const TimezoneManager = require('./utils/timezoneManager');
  
  dayjs.extend(utc);
  dayjs.extend(timezone);
  
  // الحصول على المنطقة الزمنية من النظام الجديد
  const tz = await TimezoneManager.getInstitutionTimezone();
  const now = await TimezoneManager.getInstitutionNow();
  const { getMonthInfo } = require('./utils/monthInfo');
  const monthData = await getMonthInfo(now.year(), now.month(), tz);
  const currentMonthName = monthData.monthName;
  
  console.log(`🌍 فحص الحاجة لشهر جديد بالنظام الموحد الجديد:`);
  console.log(`📅 التاريخ الحالي: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
  console.log(`🌎 المنطقة الزمنية المُكتشفة: ${tz}`);
  console.log(`📋 الشهر الحالي: ${currentMonthName}`);
  
  const Attendance = require('./models/Attendance');
  const attendances = await Attendance.find();
  let needToAdd = false;
  
  for (const attendance of attendances) {
    const lastMonth = attendance.months?.[attendance.months.length - 1]?.month;
    if (lastMonth !== currentMonthName) {
      needToAdd = true;
      break;
    }
  }
  
  mongoose.disconnect();
  
  // التحقق من أنه أول يوم في الشهر باستخدام dayjs
  if (needToAdd && now.date() === 1) {
    console.log('🔄 إضافة شهر جديد مطلوبة وهو أول يوم في الشهر');
    await addNewMonthForAllAttendances();
  }
}

checkAndAddMonthOnStartup();

// 🌍 جدولة موحدة: تعمل في أول يوم من كل شهر الساعة 2 صباحاً بالمنطقة الزمنية الموحدة
// المنطقة الزمنية تُحدد من متغير البيئة TIMEZONE أو تستخدم Africa/Cairo كافتراضي
cron.schedule('0 2 1 * *', async () => {
  console.log('🕐 تشغيل الجدولة التلقائية لإضافة شهر جديد');
  
  try {
    const TimezoneManager = require('./utils/timezoneManager');
    const tz = await TimezoneManager.getInstitutionTimezone();
    console.log(`🌎 المنطقة الزمنية المُكتشفة: ${tz}`);
    
    await addNewMonthForAllAttendances();
  } catch (error) {
    console.error('❌ خطأ في الجدولة التلقائية:', error);
  }
}, {
  // استخدام UTC ثم التحويل داخلياً للمنطقة المُكتشفة
  timezone: 'UTC'
});
