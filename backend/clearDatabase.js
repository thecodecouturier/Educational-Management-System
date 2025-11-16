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

async function clearDatabase() {
  try {
    console.log('بدء مسح قاعدة البيانات...');

    // مسح جميع البيانات
    await Student.deleteMany({});
    console.log('تم مسح الطلاب');

    await Subject.deleteMany({});
    console.log('تم مسح المواد');

    await Teacher.deleteMany({});
    console.log('تم مسح المعلمين');

    await Group.deleteMany({});
    console.log('تم مسح المجموعات');

    await Subscription.deleteMany({});
    console.log('تم مسح الاشتراكات');

    await Payment.deleteMany({});
    console.log('تم مسح المدفوعات');

    console.log('✅ تم مسح قاعدة البيانات بنجاح!');
    process.exit(0);

  } catch (error) {
    console.error('❌ خطأ في مسح قاعدة البيانات:', error);
    process.exit(1);
  }
}

clearDatabase();
