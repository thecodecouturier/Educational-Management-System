const mongoose = require('mongoose');

// الاتصال بقاعدة البيانات
mongoose.connect('mongodb://localhost:27017/schoolDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// استيراد النماذج
const Student = require('./models/Student');
const Subject = require('./models/Subject');
const Teacher = require('./models/Teacher');
const Group = require('./models/Group');
const Subscription = require('./models/Subscription');
const Payment = require('./models/Payment');

async function addSampleData() {
  try {
    console.log('بدء إضافة البيانات التجريبية...');

    // إضافة طالب تجريبي 1
    const student1 = new Student({
      studentId: 'ST001',
      firstName: 'أحمد',
      middleName: 'محمد',
      lastName: 'علي',
      level: 'ابتدائى',
      grade: 'الأول الابتدائى',
      phones: ['01234567890'],
      guardianPhones: ['01234567891']
    });
    await student1.save();
    console.log('تم إضافة الطالب:', student1.firstName + ' ' + student1.lastName);
    
    // إضافة طالب تجريبي 2
    const student2 = new Student({
      studentId: 'ST002',
      firstName: 'فاطمة',
      middleName: 'أحمد',
      lastName: 'حسن',
      level: 'ابتدائى',
      grade: 'الأول الابتدائى',
      phones: ['01234567893'],
      guardianPhones: ['01234567894']
    });
    await student2.save();
    console.log('تم إضافة الطالب:', student2.firstName + ' ' + student2.lastName);

    // إضافة مادة تجريبية
    const subject = new Subject({
      subjectId: 'sub001',
      name: 'فرنسي',
      levels: ['ابتدائى'],
      classes: ['الأول الابتدائى']
    });
    await subject.save();
    console.log('تم إضافة المادة:', subject.name);

    // إضافة معلم تجريبي
    const teacher = new Teacher({
      teacherId: 'tch001',
      firstName: 'أستاذ',
      lastName: 'محمود',
      subject: subject.name,
      levels: ['ابتدائى'],
      classes: ['الأول الابتدائى']
    });
    await teacher.save();
    console.log('تم إضافة المعلم:', teacher.firstName + ' ' + teacher.lastName);

    // إضافة مجموعة تجريبية
    const group = new Group({
      groupId: 'grp002',
      subject: subject.name,
      teacher: teacher.firstName + ' ' + teacher.lastName,
      levels: ['ابتدائى'],
      classes: ['الأول الابتدائى'],
      days: ['الأحد', 'الثلاثاء', 'الخميس'],
      startTime: '17:00',
      endTime: '19:00',
      price: 200
    });
    await group.save();
    console.log('تم إضافة المجموعة:', group.groupId);

    // إضافة اشتراك تجريبي 1
    const subscription1 = new Subscription({
      subscriptionId: 'SUB001',
      studentId: student1.studentId,
      level: student1.level,
      grade: student1.grade,
      subjectId: subject.subjectId,
      teacherId: teacher.teacherId,
      groupId: group.groupId
    });
    await subscription1.save();
    console.log('تم إضافة الاشتراك:', subscription1.subscriptionId);

    // إضافة اشتراك تجريبي 2
    const subscription2 = new Subscription({
      subscriptionId: 'SUB002',
      studentId: student2.studentId,
      level: student2.level,
      grade: student2.grade,
      subjectId: subject.subjectId,
      teacherId: teacher.teacherId,
      groupId: group.groupId
    });
    await subscription2.save();
    console.log('تم إضافة الاشتراك:', subscription2.subscriptionId);

    // إضافة دفعة تجريبية 1 مع أشهر مدفوعة
    const payment1 = new Payment({
      paymentId: 'PAY001',
      subscriptionId: subscription1.subscriptionId,
      studentId: student1.studentId,
      months: [
        {
          month: 'أغسطس 2025',
          status: 'مدفوع',
          amount: 200,
          paidDate: new Date('2025-08-01')
        },
        {
          month: 'سبتمبر 2025',
          status: 'مدفوع',
          amount: 200,
          paidDate: new Date('2025-09-01')
        },
        {
          month: 'أكتوبر 2025',
          status: 'مدفوع',
          amount: 200,
          paidDate: new Date('2025-10-01')
        }
      ]
    });
    await payment1.save();
    console.log('تم إضافة المدفوعات للطالب:', student1.firstName);

    // إضافة دفعة تجريبية 2 (غير مدفوعة)
    const payment2 = new Payment({
      paymentId: 'PAY002',
      subscriptionId: subscription2.subscriptionId,
      studentId: student2.studentId,
      months: [
        {
          month: 'أغسطس 2025',
          status: 'غير مدفوع',
          amount: 200
        },
        {
          month: 'سبتمبر 2025',
          status: 'غير مدفوع',
          amount: 200
        },
        {
          month: 'أكتوبر 2025',
          status: 'غير مدفوع',
          amount: 200
        }
      ]
    });
    await payment2.save();
    console.log('تم إضافة المدفوعات للطالب:', student2.firstName);

    console.log('تم إضافة جميع البيانات التجريبية بنجاح!');
    process.exit(0);

  } catch (error) {
    console.error('خطأ في إضافة البيانات:', error);
    process.exit(1);
  }
}

addSampleData();
