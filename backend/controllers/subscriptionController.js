const Subscription = require('../models/Subscription');

// إضافة اشتراك جديد
exports.addSubscription = async (req, res) => {
  try {
    const { studentId, subjectId, teacherId, groupId } = req.body;
    // جلب بيانات الطالب
    const Student = require('../models/Student');
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(400).json({ error: 'الطالب غير موجود' });
    // توليد subscriptionId تلقائيًا
    const lastSub = await Subscription.findOne({}, {}, { sort: { subscriptionId: -1 } });
    let nextId = 1;
    if (lastSub && lastSub.subscriptionId) {
      const lastNum = parseInt(lastSub.subscriptionId.replace('sus', ''));
      if (!isNaN(lastNum)) nextId = lastNum + 1;
    }
    const subscriptionId = 'sus' + String(nextId).padStart(3, '0');
    const subscription = new Subscription({
      subscriptionId,
      studentId,
      subjectId,
      teacherId,
      groupId,
      level: student.level,
      grade: student.grade
    });
    await subscription.save();

    // إنشاء صف مدفوعات تلقائيًا لهذا الاشتراك
    const Payment = require('../models/Payment');
    // توليد paymentId تلقائي
    const paymentId = 'pay' + Math.floor(Math.random() * 1000000);
    
    // 🌍 استخدام النظام الموحد العالمي للتواريخ
    const { getMonthInfo } = require('../utils/monthInfo');
    const dayjs = require('dayjs');
    const utc = require('dayjs/plugin/utc');
    const timezone = require('dayjs/plugin/timezone');
    
    dayjs.extend(utc);
    dayjs.extend(timezone);
    
    const months = [];
    
    // الحصول على المنطقة الزمنية من النظام الجديد
    const TimezoneManager = require('../utils/timezoneManager');
    const tz = await TimezoneManager.getInstitutionTimezone();
    const now = await TimezoneManager.getInstitutionNow();
    
    console.log(`🌍 إنشاء اشتراك بالنظام الموحد: ${now.format('YYYY-MM-DD HH:mm:ss')} (${tz})`);
    
    // إنشاء المدفوعات
    for (let i = 2; i >= 0; i--) {
      const targetDate = now.subtract(i, 'month');
      const monthData = await getMonthInfo(targetDate.year(), targetDate.month(), tz);
      months.push({ month: monthData.monthName, status: 'غير مدفوع', amount: 0 });
    }
    const payment = new Payment({ paymentId, subscriptionId, studentId, months });
    await payment.save();

    // بعد إنشاء صف المدفوعات، نشغّل حسابات الداشبورد فورًا لضمان تحديث الإيراد المستحق
    try {
      const dashboardModule = require('./financialAnalytics/dashboardModule');
      if (dashboardModule && typeof dashboardModule.calculateMonthlyExpectedRevenue === 'function') {
        await dashboardModule.calculateMonthlyExpectedRevenue();
      }
      if (dashboardModule && typeof dashboardModule.calculateCollectionRate === 'function') {
        await dashboardModule.calculateCollectionRate();
      }
      console.log('✅ triggered dashboard calculations after subscription add');
    } catch (err) {
      console.error('❌ Error triggering dashboard calculations after subscription add:', err);
    }

    // إنشاء ملف الحضور
    const Attendance = require('../models/Attendance');
    const Group = require('../models/Group');
    const attendanceId = 'att' + Math.floor(Math.random() * 1000000);
    
    const year = now.year();
    const month = now.month();
    const monthData = await getMonthInfo(year, month, tz);
    const monthName = monthData.monthName;
    
    // جلب أيام المجموعة
    const group = await Group.findOne({ groupId });
    console.log('🔍 بيانات المجموعة:', { groupId, group: group ? { name: group.name, days: group.days } : 'غير موجودة' });
    
    const groupDays = group && Array.isArray(group.days) ? group.days : [];
    console.log('📅 أيام المجموعة:', groupDays);
    
    let weeks = [];
    let currentWeek = { weekNumber: 1, days: [] };
    
    const arabicDaysMap = {
      'Monday': 'الاثنين',
      'Tuesday': 'الثلاثاء',
      'Wednesday': 'الأربعاء',
      'Thursday': 'الخميس',
      'Friday': 'الجمعة',
      'Saturday': 'السبت',
      'Sunday': 'الأحد'
    };
    
    for (let i = 0; i < monthData.daysArray.length; i++) {
      const dayObj = monthData.daysArray[i];
      const dayArabic = arabicDaysMap[dayObj.day];
      
      // إذا اليوم يطابق أيام المجموعة أضفه
      if (groupDays.includes(dayArabic)) {
        currentWeek.days.push({
          day: dayArabic,
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
    
    // بعد الانتهاء من البناء، إنشاء ملف الحضور
    
    // إذا لم يتم إنشاء أي أسابيع، أنشئ أسبوع واحد فارغ كبديل
    if (weeks.length === 0) {
      console.log('⚠️ لم يتم العثور على أيام مطابقة لأيام المجموعة، إنشاء أسبوع افتراضي');
      weeks = [{
        weekNumber: 1,
        days: [{
          day: 'افتراضي',
          date: 1,
          status: 'غائب'
        }]
      }];
    }
    
    const attendanceMonths = [{ month: monthName, weeks }];
    console.log('📋 بيانات الحضور المُنشأة:', { 
      attendanceId, 
      subscriptionId, 
      studentId, 
      monthName,
      weeksCount: weeks.length,
      totalDays: weeks.reduce((sum, week) => sum + week.days.length, 0)
    });
    
    try {
      const attendance = new Attendance({ attendanceId, subscriptionId, studentId, months: attendanceMonths });
      await attendance.save();
      console.log('✅ تم إنشاء ملف الحضور بنجاح');
    } catch (attendanceError) {
      console.error('❌ خطأ في إنشاء ملف الحضور:', attendanceError);
      console.error('📊 تفاصيل الخطأ:', attendanceError.message);
      // لا نوقف العملية، فقط نسجل الخطأ
    }

    try {
      res.status(201).json({ 
        subscription,
        message: 'تم الاشتراك بنجاح'
      });
    } catch (responseError) {
      console.error('❌ خطأ في إرسال الاستجابة:', responseError);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// عرض جميع الاشتراكات
exports.getSubscriptions = async (req, res) => {
  try {
    const Student = require('../models/Student');
    const Subject = require('../models/Subject');
    const Teacher = require('../models/Teacher');
    const Group = require('../models/Group');
    
    const subscriptions = await Subscription.find();
    console.log(`🔍 معالجة ${subscriptions.length} اشتراك...`);
    
    // إضافة الأسماء لكل اشتراك
    const enrichedSubscriptions = await Promise.all(subscriptions.map(async (sub) => {
      const subObj = sub.toObject();
      
      console.log(`\n📋 اشتراك ${sub.subscriptionId}:`);
      console.log(`   studentId: ${sub.studentId}`);
      console.log(`   subjectId: ${sub.subjectId}`);
      console.log(`   teacherId: ${sub.teacherId}`);
      console.log(`   groupId: ${sub.groupId}`);
      
      // جلب اسم الطالب
      const student = await Student.findOne({ studentId: sub.studentId });
      if (student) {
        subObj.studentName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim();
        console.log(`   ✅ طالب: ${subObj.studentName}`);
      }
      
      // جلب اسم المادة - البحث بكل من subjectId و _id
      let subject = await Subject.findOne({ subjectId: sub.subjectId });
      if (!subject && sub.subjectId) {
        // محاولة البحث بـ ObjectId
        try {
          subject = await Subject.findById(sub.subjectId);
          console.log(`   🔄 وجدت المادة بـ ObjectId`);
        } catch (e) {}
      }
      if (subject) {
        subObj.subjectName = subject.name;
        console.log(`   ✅ مادة: ${subObj.subjectName}`);
      } else {
        console.log(`   ❌ لم يتم العثور على مادة`);
      }
      
      // جلب اسم المعلم - البحث بكل من teacherId و _id
      let teacher = await Teacher.findOne({ teacherId: sub.teacherId });
      if (!teacher && sub.teacherId) {
        // محاولة البحث بـ ObjectId
        try {
          teacher = await Teacher.findById(sub.teacherId);
          console.log(`   🔄 وجدت المعلم بـ ObjectId`);
        } catch (e) {}
      }
      if (teacher) {
        subObj.teacherName = `${teacher.firstName} ${teacher.lastName}`.trim();
        console.log(`   ✅ معلم: ${subObj.teacherName}`);
      } else {
        console.log(`   ❌ لم يتم العثور على معلم`);
      }
      
      // جلب معلومات المجموعة - البحث بكل من groupId و _id
      if (sub.groupId) {
        let group = await Group.findOne({ groupId: sub.groupId });
        if (!group) {
          // محاولة البحث بـ ObjectId
          try {
            group = await Group.findById(sub.groupId);
            console.log(`   🔄 وجدت المجموعة بـ ObjectId`);
          } catch (e) {}
        }
        
        if (group) {
          // استخدام اسم المجموعة الجديد إذا كان موجوداً
          if (group.name) {
            subObj.groupName = group.name;
            console.log(`   ✅ مجموعة: ${subObj.groupName}`);
          } else {
            // fallback: بناء الاسم يدوياً إذا لم يكن موجوداً
            let groupSubject = await Subject.findOne({ subjectId: group.subject });
            if (!groupSubject) {
              try {
                groupSubject = await Subject.findById(group.subject);
              } catch (e) {}
            }
            
            let groupTeacher = await Teacher.findOne({ teacherId: group.teacher });
            if (!groupTeacher) {
              try {
                groupTeacher = await Teacher.findById(group.teacher);
              } catch (e) {}
            }
            
            let groupDisplay = group.groupId || sub.groupId;
            if (groupSubject) groupDisplay = groupSubject.name;
            if (groupTeacher) groupDisplay += ` - ${groupTeacher.firstName} ${groupTeacher.lastName}`;
            if (group.days && group.days.length > 0) {
              groupDisplay += ` (${group.days.join('، ')})`;
            }
            
            subObj.groupName = groupDisplay;
            console.log(`   ✅ مجموعة (fallback): ${subObj.groupName}`);
          }
        } else {
          console.log(`   ❌ لم يتم العثور على مجموعة`);
        }
      }
      
      return subObj;
    }));
    
    console.log(`\n📊 تم إرسال ${enrichedSubscriptions.length} اشتراك مع البيانات الكاملة`);
    res.json(enrichedSubscriptions);
  } catch (err) {
    console.error('❌ Error in getSubscriptions:', err);
    res.status(500).json({ error: err.message });
  }
};

// تحديث اشتراك
exports.updateSubscription = async (req, res) => {
  try {
    const mongoId = req.params.id;
    const { subjectId, teacherId, groupId } = req.body;
    
    const subscription = await Subscription.findById(mongoId);
    if (!subscription) {
      return res.status(404).json({ error: 'الاشتراك غير موجود' });
    }
    
    // تحديث البيانات
    if (subjectId) subscription.subjectId = subjectId;
    if (teacherId) subscription.teacherId = teacherId;
    if (groupId !== undefined) subscription.groupId = groupId;
    
    await subscription.save();
    
    res.json({ success: true, message: 'تم تحديث الاشتراك بنجاح', subscription });
  } catch (err) {
    console.error('Error updating subscription:', err);
    res.status(500).json({ error: err.message });
  }
};

// حذف اشتراك مع حذف المدفوعات المرتبطة به فقط
exports.deleteSubscription = async (req, res) => {
  try {
    const Subscription = require('../models/Subscription');
    const Payment = require('../models/Payment');
    const mongoId = req.params.id; // MongoDB _id
    
    // جلب الاشتراك للحصول على subscriptionId
    const subscription = await Subscription.findById(mongoId);
    if (!subscription) {
      return res.status(404).json({ error: 'الاشتراك غير موجود' });
    }
    
    const subscriptionId = subscription.subscriptionId;
    
    // حذف المدفوعات المرتبطة بهذا الاشتراك فقط
    await Payment.deleteMany({ subscriptionId });
    
    // بعد حذف المدفوعات بالجملة، نشغّل حسابات الداشبورد لتحديث الإيراد المستحق
    try {
      const dashboardModule = require('./financialAnalytics/dashboardModule');
      if (dashboardModule && typeof dashboardModule.calculateMonthlyExpectedRevenue === 'function') {
        await dashboardModule.calculateMonthlyExpectedRevenue();
      }
      if (dashboardModule && typeof dashboardModule.calculateMonthlyCollectedRevenue === 'function') {
        await dashboardModule.calculateMonthlyCollectedRevenue();
      }
      if (dashboardModule && typeof dashboardModule.calculateCollectionRate === 'function') {
        await dashboardModule.calculateCollectionRate();
      }
      console.log('✅ triggered dashboard calculations after subscription delete');
    } catch (err) {
      console.error('❌ Error triggering dashboard calculations after subscription delete:', err);
    }
    
    // حذف صف الحضور المرتبط بهذا الاشتراك فقط
    const Attendance = require('../models/Attendance');
    await Attendance.deleteOne({ subscriptionId });
    
    // حذف الاشتراك نفسه
    await Subscription.findByIdAndDelete(mongoId);
    
    res.json({ success: true, message: 'تم حذف الاشتراك بنجاح' });
  } catch (err) {
    console.error('Error deleting subscription:', err);
    res.status(500).json({ error: err.message });
  }
};
