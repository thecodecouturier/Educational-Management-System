const Payment = require('../models/Payment');

// إضافة مدفوعات جديدة
exports.addPayment = async (req, res) => {
  try {
    const { paymentId, subscriptionId, studentId, groupId, months } = req.body;
    
    // إنشاء الدفعة
    const payment = new Payment({ 
      paymentId, 
      subscriptionId, 
      studentId,
      groupId: groupId || null,
      months: months || []
    });
    
    // إذا كان هناك أشهر مدفوعة، نحدّث بياناتها
    if (months && months.length > 0) {
      const Group = require('../models/Group');
      const Subscription = require('../models/Subscription');
      
      // محاولة الحصول على سعر المجموعة
      let groupPrice = 0;
      let group = null;
      
      if (groupId) {
        group = await Group.findOne({ groupId });
      } else if (subscriptionId) {
        const subscription = await Subscription.findOne({ subscriptionId });
        if (subscription && subscription.groupId) {
          group = await Group.findOne({ groupId: subscription.groupId });
          payment.groupId = subscription.groupId; // حفظ groupId في Payment
        }
      }
      
      if (group && group.price) {
        groupPrice = group.price;
      }
      
      // تحديث كل شهر مدفوع
      for (let i = 0; i < payment.months.length; i++) {
        if (payment.months[i].status === 'مدفوع') {
          await payment.updateMonthPayment(i, 'مدفوع', groupPrice);
        }
      }
    }
    
    await payment.save();
    
    console.log(`✅ تم إضافة دفعة جديدة: ${paymentId}`);
    res.status(201).json({
      success: true,
      message: 'تم إضافة الدفعة بنجاح',
      payment: payment
    });
    
  } catch (err) {
    console.error('❌ خطأ في إضافة الدفعة:', err);
    res.status(400).json({ error: err.message });
  }
};

// عرض جميع المدفوعات
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// تعديل حالة الدفع لشهر معين
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId, monthIndex, status } = req.body;
    
    // البحث عن المدفوعات
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ error: 'لم يتم العثور على المدفوعات' });
    }
    
    // الحصول على سعر المجموعة
    let groupPrice = payment.months[monthIndex]?.amount || 0;
    
    // إذا كان هناك groupId أو subscriptionId، نجلب سعر المجموعة الحالي
    if (status === 'مدفوع') {
      try {
        const Group = require('../models/Group');
        const Subscription = require('../models/Subscription');
        
        let group = null;
        
        // محاولة الحصول على المجموعة من groupId مباشرة
        if (payment.groupId) {
          group = await Group.findOne({ groupId: payment.groupId });
        }
        
        // إذا لم يوجد، نحاول من خلال الاشتراك
        if (!group && payment.subscriptionId) {
          const subscription = await Subscription.findOne({ subscriptionId: payment.subscriptionId });
          if (subscription && subscription.groupId) {
            group = await Group.findOne({ groupId: subscription.groupId });
          }
        }
        
        // إذا وجدنا المجموعة، نأخذ سعرها
        if (group && group.price) {
          groupPrice = group.price;
          console.log(`✅ تم الحصول على سعر المجموعة: ${groupPrice} جنيه`);
        } else {
          console.warn('⚠️ لم يتم العثور على سعر المجموعة، سيتم استخدام القيمة الافتراضية');
        }
      } catch (err) {
        console.error('❌ خطأ في جلب سعر المجموعة:', err);
      }
    }
    
    // استخدام الدالة المساعدة لتحديث بيانات الدفع
    await payment.updateMonthPayment(monthIndex, status, groupPrice);
    
    // حفظ التغييرات
    await payment.save();
    
    console.log(`📝 تم تحديث حالة الدفع للشهر ${monthIndex} إلى "${status}"`);
    if (status === 'مدفوع') {
      const monthData = payment.months[monthIndex];
      console.log(`📅 تاريخ الدفع: ${monthData.paidDay}/${monthData.paidMonth}/${monthData.paidYear}`);
      console.log(`💰 المبلغ: ${monthData.amount} جنيه`);
    }
    
    // بعد تحديث حالة الدفع إلى مدفوع، نحاول تشغيل حسابات الداشبورد فورًا
    if (status === 'مدفوع') {
      try {
        // تحميل وحدة لوحة البيانات عند الطلب لتجنب دورية الاستيراد
        const dashboardModule = require('./financialAnalytics/dashboardModule');
        // إعادة حساب الإيراد اليومي والتراكمي ومعدل التحصيل
        await dashboardModule.calculateDailyRevenue();
        await dashboardModule.calculateCumulativeRevenue();
        // حساب معدل التحصيل اختياري لكنه مفيد لتزامن الواجهة
        if (typeof dashboardModule.calculateCollectionRate === 'function') {
          await dashboardModule.calculateCollectionRate();
        }
        console.log('✅ تم تشغيل حسابات الداشبورد بعد تحديث حالة الدفع');
      } catch (calcErr) {
        // لا نريد أن يفشل endpoint الدفعات إذا فشلت الحسابات
        console.error('❌ خطأ أثناء تشغيل حسابات الداشبورد بعد تحديث الدفع:', calcErr);
      }
    }

    res.json({
      success: true,
      message: 'تم تحديث حالة الدفع بنجاح',
      payment: payment,
      monthData: payment.months[monthIndex]
    });
    
  } catch (err) {
    console.error('❌ خطأ في تحديث حالة الدفع:', err);
    res.status(400).json({ error: err.message });
  }
};

// حذف مدفوعات
exports.deletePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    await Payment.deleteOne({ paymentId });
    res.json({ message: 'تم حذف المدفوعات بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// تحديث الأشهر لكل المدفوعات لتكون الشهر الحالي والشهرين السابقين
exports.updateAllPaymentsMonths = async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const { getMonthInfo } = require('../utils/monthInfo');
    const TimezoneManager = require('../utils/timezoneManager');
    
    // 🌍 استخدام النظام الموحد الجديد للتواريخ
    const dayjs = require('dayjs');
    const utc = require('dayjs/plugin/utc');
    const timezone = require('dayjs/plugin/timezone');
    
    dayjs.extend(utc);
    dayjs.extend(timezone);
    
    const payments = await Payment.find();
    
    // الحصول على المنطقة الزمنية من النظام الجديد
    const tz = await TimezoneManager.getInstitutionTimezone();
    const now = await TimezoneManager.getInstitutionNow();
    const newMonths = [];
    
    console.log(`🌍 إنشاء أشهر الدفع بالنظام الموحد:`);
    console.log(`📅 التاريخ: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`🌎 المنطقة الزمنية: ${tz}`);
    
    // إنشاء الأشهر الجديدة
    for (let i = 2; i >= 0; i--) {
      const targetDate = now.subtract(i, 'month');
      const monthData = await getMonthInfo(targetDate.year(), targetDate.month(), tz);
      newMonths.push({ month: monthData.monthName, status: 'غير مدفوع', amount: 0 });
    }
    
    for (const payment of payments) {
      // احتفظ بالحالة القديمة إن وجدت لنفس الشهر
      payment.months = newMonths.map(m => {
        const old = payment.months.find(oldM => oldM.month === m.month);
        return old ? old : m;
      });
      await payment.save();
    }
    res.json({ success: true, updated: payments.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// إنشاء تقرير الدفعات مع المرشحات
exports.getPaymentReport = async (req, res) => {
  try {
    console.log('=== بدء تشغيل تقرير الدفعات ===');
    const { level, class: className, subject, teacher, group } = req.query;
    
    // استيراد النماذج المطلوبة
    const Student = require('../models/Student');
    const Subscription = require('../models/Subscription');
    const Group = require('../models/Group');
    
    console.log('تشغيل تقرير الدفعات مع المرشحات:', { level, className, subject, teacher, group });
    
    // الخطوة 1: المرور على جميع ملفات الدفع
    const allPayments = await Payment.find();
    console.log(`تم العثور على ${allPayments.length} ملف دفع`);
    
    if (allPayments.length === 0) {
      console.log('لا توجد ملفات دفع في قاعدة البيانات');
      return res.json([]);
    }
    
    const reportResults = [];
    
    // الخطوة 2: فحص كل ملف دفع للبحث عن الأشهر غير المدفوعة
    for (const payment of allPayments) {
      // فحص إذا كان هناك أشهر غير مدفوعة في هذا الملف
      const unpaidMonths = payment.months.filter(month => month.status === 'غير مدفوع');
      
      if (unpaidMonths.length > 0) {
        try {
          // الحصول على بيانات الاشتراك
          const subscription = await Subscription.findOne({ subscriptionId: payment.subscriptionId });
          if (!subscription) {
            console.log(`لم يتم العثور على اشتراك بالـ ID: ${payment.subscriptionId}`);
            continue;
          }
          
          // الحصول على بيانات الطالب
          const student = await Student.findOne({ studentId: subscription.studentId });
          if (!student) {
            console.log(`لم يتم العثور على طالب بالـ ID: ${subscription.studentId}`);
            continue;
          }
          
          // تطبيق المرشحات إذا تم اختيارها
          let shouldInclude = true;
          
          // فلترة المستوى
          if (level && student.level !== level) {
            shouldInclude = false;
            console.log(`تم استبعاد الطالب ${student.firstName} - المستوى لا يطابق`);
          }
          
          // فلترة الصف  
          if (className && student.grade !== className) {
            shouldInclude = false;
            console.log(`تم استبعاد الطالب ${student.firstName} - الصف لا يطابق`);
          }
          
          // فلترة حسب المادة أو الأستاذ أو المجموعة (من بيانات الاشتراك)
          if (subject || teacher || group) {
            let matchFound = true;
            
            // الحصول على بيانات المادة والأستاذ والمجموعة من الاشتراك
            let subscriptionSubject = 'غير محدد';
            let subscriptionTeacher = 'غير محدد';
            let subscriptionGroup = 'غير محدد';
            
            // جلب اسم المادة
            if (subscription.subjectId) {
              const Subject = require('../models/Subject');
              const subjectData = await Subject.findOne({ subjectId: subscription.subjectId });
              if (subjectData) subscriptionSubject = subjectData.name;
            }
            
            // جلب اسم الأستاذ
            if (subscription.teacherId) {
              const Teacher = require('../models/Teacher');
              const teacherData = await Teacher.findOne({ teacherId: subscription.teacherId });
              if (teacherData) subscriptionTeacher = teacherData.firstName + ' ' + teacherData.lastName;
            }
            
            // جلب معرف المجموعة
            if (subscription.groupId) {
              subscriptionGroup = subscription.groupId;
            }
            
            // التحقق من المطابقة
            if (subject && subscriptionSubject !== subject) {
              matchFound = false;
              console.log(`تم استبعاد الطالب ${student.firstName} - المادة لا تطابق: ${subscriptionSubject} != ${subject}`);
            }
            
            if (teacher && subscriptionTeacher !== teacher) {
              matchFound = false;
              console.log(`تم استبعاد الطالب ${student.firstName} - الأستاذ لا يطابق: ${subscriptionTeacher} != ${teacher}`);
            }
            
            if (group && subscriptionGroup !== group) {
              matchFound = false;
              console.log(`تم استبعاد الطالب ${student.firstName} - المجموعة لا تطابق: ${subscriptionGroup} != ${group}`);
            }
            
            if (!matchFound) {
              shouldInclude = false;
            }
          }
          
          if (shouldInclude) {
            // الحصول على البيانات الصحيحة من جدول الطلاب
            
            // تكوين الاسم الكامل من firstName + middleName + lastName
            let fullName = student.firstName;
            if (student.middleName) fullName += ' ' + student.middleName;
            if (student.lastName) fullName += ' ' + student.lastName;
            
            // الحصول على أرقام هواتف الطالب
            let studentPhones = [];
            if (student.phones && student.phones.length > 0) {
              studentPhones = student.phones;
            }
            
            // الحصول على أرقام هواتف أولياء الأمور
            let parentPhones = [];
            if (student.guardianPhones && student.guardianPhones.length > 0) {
              parentPhones = student.guardianPhones;
            }
            
            // الحصول على تفاصيل الاشتراك (المادة، المدرس، المجموعة)
            let subjectName = 'غير محدد';
            let teacherName = 'غير محدد'; 
            let groupName = 'غير محدد';
            
            try {
              // جلب بيانات المادة من جدول Subjects
              if (subscription.subjectId) {
                const Subject = require('../models/Subject');
                const subject = await Subject.findOne({ subjectId: subscription.subjectId });
                if (subject) {
                  subjectName = subject.name;
                  console.log('تم العثور على المادة:', subject.name);
                }
              }
              
              // جلب بيانات المدرس من جدول Teachers
              if (subscription.teacherId) {
                const Teacher = require('../models/Teacher');
                const teacher = await Teacher.findOne({ teacherId: subscription.teacherId });
                if (teacher) {
                  teacherName = teacher.firstName + ' ' + teacher.lastName;
                  console.log('تم العثور على المدرس:', teacherName);
                }
              }
              
              // جلب بيانات المجموعة من جدول Groups  
              if (subscription.groupId) {
                const group = await Group.findOne({ groupId: subscription.groupId });
                if (group) {
                  groupName = group.groupId; // أو يمكن استخدام اسم آخر إذا كان موجود
                  console.log('تم العثور على المجموعة:', groupName);
                }
              }
            } catch (detailsError) {
              console.error('خطأ في جلب تفاصيل الاشتراك:', detailsError);
            }
            
            // تحضير مصفوفة حالة الدفع للأشهر الثلاثة
            const monthsStatus = payment.months.map(month => ({
              month: month.month,
              status: month.status,
              amount: month.amount || 0,
              paidDate: month.paidDate || null
            }));
            
            reportResults.push({
              studentId: student.studentId,
              studentCode: student.studentId,
              name: fullName,
              details: {
                subject: subjectName,
                teacher: teacherName,
                group: groupName
              },
              monthsStatus: monthsStatus,
              unpaidMonthsCount: unpaidMonths.length,
              studentPhones: studentPhones,
              parentPhones: parentPhones,
              level: student.level,
              class: student.grade,
              paymentId: payment.paymentId,
              subscriptionId: subscription._id
            });
          }
        } catch (error) {
          console.error('خطأ في معالجة دفعة:', payment._id, error);
          continue;
        }
      }
    }
    
    console.log(`تم العثور على ${reportResults.length} طالب لديه أشهر غير مدفوعة`);
    
    // ترتيب النتائج حسب اسم الطالب
    reportResults.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    
    res.json(reportResults);
    
  } catch (err) {
    console.error('خطأ في إنشاء تقرير الدفعات:', err);
    res.status(500).json({ error: err.message });
  }
};
