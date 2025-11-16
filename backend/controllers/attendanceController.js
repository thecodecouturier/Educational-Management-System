const Attendance = require('../models/Attendance');
const Group = require('../models/Group');
const Subscription = require('../models/Subscription');

// إضافة سجل حضور جديد
exports.addAttendance = async (req, res) => {
  try {
    const { attendanceId, subscriptionId, studentId, months } = req.body;
    const attendance = new Attendance({ attendanceId, subscriptionId, studentId, months });
    await attendance.save();
    res.status(201).json(attendance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// عرض جميع سجلات الحضور
exports.getAttendances = async (req, res) => {
  try {
    const attendances = await Attendance.find();
    res.json(attendances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// تعديل حالة حضور ليوم معين
exports.updateAttendanceStatus = async (req, res) => {
  try {
    const { attendanceId, monthIndex, weekIndex, dayIndex, status } = req.body;
    const attendance = await Attendance.findOne({ attendanceId });
    if (!attendance) return res.status(404).json({ error: 'لم يتم العثور على سجل الحضور' });
    attendance.months[monthIndex].weeks[weekIndex].days[dayIndex].status = status;
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// حذف سجل حضور
exports.deleteAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    await Attendance.deleteOne({ attendanceId });
    res.json({ message: 'تم حذف سجل الحضور بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// إضافة شهر جديد لسجل الحضور مع الاحتفاظ بآخر 3 أشهر فقط
exports.addMonthToAttendance = async (req, res) => {
  try {
    const { attendanceId, newMonth } = req.body; // newMonth: كائن الشهر الجديد
    const attendance = await Attendance.findOne({ attendanceId });
    if (!attendance) return res.status(404).json({ error: 'لم يتم العثور على سجل الحضور' });
    attendance.months.push(newMonth);
    // إذا تجاوز عدد الأشهر 3، احذف الأقدم
    if (attendance.months.length > 3) {
      attendance.months = attendance.months.slice(-3);
    }
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// دالة اختبار: إضافة شهر جديد وطباعة مصفوفة الأشهر
exports.testAddMonthToAttendance = async (req, res) => {
  try {
    const { attendanceId, newMonth } = req.body;
    const attendance = await Attendance.findOne({ attendanceId });
    if (!attendance) return res.status(404).json({ error: 'لم يتم العثور على سجل الحضور' });
    attendance.months.push(newMonth);
    if (attendance.months.length > 3) {
      attendance.months = attendance.months.slice(-3);
    }
    await attendance.save();
    res.json({ months: attendance.months });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 🚨 دالة الطوارئ: تحديث الأيام المستقبلية للشهر الحالي
exports.emergencyUpdateCurrentMonth = async (req, res) => {
  try {
    const { groupId, startFrom } = req.body;
    
    // التحقق من صحة وقت البداية
    const validStartOptions = ['today', 'tomorrow'];
    if (!validStartOptions.includes(startFrom)) {
      return res.status(400).json({ error: 'وقت البداية غير صحيح' });
    }
    
    console.log(`🚨 تحديث طارئ - المجموعة: ${groupId} - من: ${startFrom}`);
    
    const result = await performEmergencyUpdate(groupId, startFrom);
    
    res.json({
      success: true,
      message: 'تم التحديث الطارئ بنجاح',
      ...result
    });
    
  } catch (error) {
    console.error('خطأ في التحديث الطارئ:', error);
    res.status(500).json({ error: error.message });
  }
};

// دالة تنفيذ التحديث الطارئ
async function performEmergencyUpdate(groupId, startFrom) {
  try {
    // 1. جلب بيانات المجموعة الجديدة
    const group = await Group.findOne({ groupId });
    if (!group) {
      throw new Error('المجموعة غير موجودة');
    }
    
    console.log(`📋 أيام المجموعة الحالية: ${group.days.join(', ')}`);
    
    // 2. تحديد تاريخ البداية باستخدام النظام الموحد الجديد
    let getMonthInfo, TimezoneManager, dayjs, utc, timezone;
    
    try {
      const monthInfoModule = require('../utils/monthInfo');
      getMonthInfo = monthInfoModule.getMonthInfo;
      TimezoneManager = require('../utils/timezoneManager');
      dayjs = require('dayjs');
      utc = require('dayjs/plugin/utc');
      timezone = require('dayjs/plugin/timezone');
      
      dayjs.extend(utc);
      dayjs.extend(timezone);
    } catch (requireError) {
      console.error('❌ خطأ في تحميل المتطلبات:', requireError.message);
      throw new Error('فشل تحميل الأدوات المطلوبة: ' + requireError.message);
    }
    
    // الحصول على المنطقة الزمنية من النظام الجديد
    let tz, now;
    
    try {
      tz = await TimezoneManager.getInstitutionTimezone();
      now = await TimezoneManager.getInstitutionNow();
    } catch (tzError) {
      console.error('❌ خطأ في الحصول على المنطقة الزمنية:', tzError.message);
      // استخدام القيم الافتراضية
      tz = 'Africa/Cairo';
      now = dayjs().tz(tz);
    }
    
    console.log(`🗓️ التاريخ الحالي (النظام الجديد + ${tz}): ${now.format('YYYY-MM-DD dddd')}`);
    console.log(`🌍 المنطقة الزمنية المُكتشفة: ${tz}`);
    
    let cutoffDate, monthData, currentMonth;
    
    try {
      if (startFrom === 'today') {
        cutoffDate = now.format('YYYY-MM-DD'); // استخدام dayjs للتنسيق
        console.log(`🔥 اختيار المدير: من اليوم (${cutoffDate})`);
      } else if (startFrom === 'tomorrow') {
        const tomorrow = now.add(1, 'day'); // استخدام dayjs لإضافة يوم
        cutoffDate = tomorrow.format('YYYY-MM-DD');
        console.log(`⏭️ اختيار المدير: من غداً (${cutoffDate})`);
      }
      
      monthData = await getMonthInfo(now.year(), now.month(), tz);
      currentMonth = monthData.monthName; // "سبتمبر 2025"
    } catch (dateError) {
      console.error('❌ خطأ في معالجة التواريخ:', dateError.message);
      throw new Error('فشل معالجة التواريخ: ' + dateError.message);
    }
    
    console.log(`📅 تحديد الأيام من ${cutoffDate} فما بعد`);
    console.log(`📅 الشهر المستهدف: ${currentMonth}`);
    
    // 3. جلب طلاب المجموعة
    const subscriptions = await Subscription.find({ groupId });
    console.log(`👥 عدد الطلاب في المجموعة: ${subscriptions.length}`);
    
    let updatedRecords = 0;
    let preservedPastDays = 0;
    let rebuiltFutureDays = 0;
    
    // 4. تحديث سجل كل طالب
    for (const subscription of subscriptions) {
      const attendance = await Attendance.findOne({ 
        subscriptionId: subscription.subscriptionId 
      });
      
      if (attendance) {
        const result = await updateFutureOnlyForStudent(
          attendance, 
          group.days, 
          monthData, 
          currentMonth, 
          cutoffDate
        );
        
        updatedRecords++;
        preservedPastDays += result.preservedDays;
        rebuiltFutureDays += result.rebuiltDays;
      }
    }
    
    // 5. النتائج
    console.log(`✅ تم تحديث ${updatedRecords} سجل`);
    console.log(`💾 تم الحفاظ على ${preservedPastDays} يوم من الماضي`);
    console.log(`🔄 تم إعادة بناء ${rebuiltFutureDays} يوم مستقبلي`);
    
    return {
      updatedRecords,
      preservedPastDays,
      rebuiltFutureDays,
      groupDays: group.days,
      targetMonth: currentMonth,
      startDate: cutoffDate,
      preservedUntil: cutoffDate,
      updatedFrom: cutoffDate,
      timestamp: now.toDate() // استخدام التوقيت من النظام الجديد
    };
    
  } catch (error) {
    throw error;
  }
}

// دالة تحديث سجل طالب واحد باستخدام منطق البناء الأصلي
async function updateFutureOnlyForStudent(attendance, newDays, monthData, currentMonth, cutoffDate) {
  const monthIndex = attendance.months.findIndex(m => m.month === currentMonth);
  
  if (monthIndex === -1) {
    console.log(`⚠️ الشهر ${currentMonth} غير موجود للطالب`);
    return { preservedDays: 0, rebuiltDays: 0 };
  }
  
  const existingMonth = attendance.months[monthIndex];
  let preservedDays = 0;
  let rebuiltDays = 0;
  
  console.log(`📅 معالجة الطالب - تاريخ القطع: ${cutoffDate}`);
  
  // تحويل تاريخ القطع إلى رقم يوم في الشهر للمقارنة
  const cutoffDay = parseInt(cutoffDate.split('-')[2]); // من "2025-09-24" نأخذ 24
  
  console.log(`📅 تاريخ القطع كرقم يوم: ${cutoffDay}`);
  console.log(`🔍 المنطق: الأيام < ${cutoffDay} محفوظة، الأيام >= ${cutoffDay} مُعاد بناؤها`);
  
  // 1. حفظ الأيام الماضية (قبل cutoffDay)
  const preservedDays_list = [];
  existingMonth.weeks.forEach(week => {
    week.days.forEach(day => {
      // استخراج رقم اليوم من التاريخ المحفوظ
      let dayNumber;
      if (typeof day.date === 'string' && day.date.includes('-')) {
        dayNumber = parseInt(day.date.split('-')[2]);
      } else {
        dayNumber = parseInt(day.date);
      }
      
      if (dayNumber < cutoffDay) {
        preservedDays_list.push({
          day: day.day,
          date: day.date,
          status: day.status,
          dayNumber: dayNumber
        });
        preservedDays++;
      }
    });
  });
  
  console.log(`💾 الأيام المحفوظة: ${preservedDays}`);
  
  // 2. استخدام منطق البناء الأصلي (من createNewMonth.js) للأيام الجديدة
  const arabicDaysMap = {
    'Monday': 'الاثنين',
    'Tuesday': 'الثلاثاء', 
    'Wednesday': 'الأربعاء',
    'Thursday': 'الخميس',
    'Friday': 'الجمعة',
    'Saturday': 'السبت',
    'Sunday': 'الأحد'
  };
  
  // بناء الأيام الجديدة من نقطة القطع فما بعد - نفس منطق createNewMonth.js
  let newWeeks = [];
  let currentWeek = { weekNumber: 1, days: [] };
  
  for (let i = 0; i < monthData.daysArray.length; i++) {
    const dayObj = monthData.daysArray[i];
    const dayAr = arabicDaysMap[dayObj.day];
    const dayNumber = dayObj.date; // رقم اليوم (1, 2, 3, ...)
    
    // إذا كان اليوم قبل نقطة القطع، نضيف الأيام المحفوظة
    if (dayNumber < cutoffDay) {
      const preservedDay = preservedDays_list.find(pd => pd.dayNumber === dayNumber);
      if (preservedDay) {
        currentWeek.days.push({
          day: preservedDay.day,
          date: preservedDay.date,
          status: preservedDay.status
        });
      }
    } else {
      // إذا كان اليوم من نقطة القطع فما بعد وهو من الأيام الجديدة
      if (newDays.includes(dayAr)) {
        currentWeek.days.push({
          day: dayAr,
          date: dayObj.date, // نفس بنية createNewMonth.js - رقم اليوم
          status: 'غائب'
        });
        rebuiltDays++;
      }
    }
    
    // إذا اليوم هو الجمعة أو آخر يوم في الشهر، أنشئ أسبوع جديد - نفس منطق createNewMonth.js
    if (dayObj.day === 'Friday' || i === monthData.daysArray.length - 1) {
      if (currentWeek.days.length > 0) {
        newWeeks.push(currentWeek);
      }
      if (i !== monthData.daysArray.length - 1) {
        currentWeek = { weekNumber: newWeeks.length + 1, days: [] };
      }
    }
  }
  
  console.log(`🆕 الأيام المبنية حديثاً: ${rebuiltDays}`);
  console.log(`📊 إجمالي الأسابيع: ${newWeeks.length}`);
  
  // 3. حفظ الشهر المحدث
  attendance.months[monthIndex] = {
    month: currentMonth,
    weeks: newWeeks
  };
  
  await attendance.save();
  
  console.log(`✅ طالب: حُفظ ${preservedDays} يوم ماضي، أُعيد بناء ${rebuiltDays} يوم مستقبلي`);
  
  return { preservedDays, rebuiltDays };
}
