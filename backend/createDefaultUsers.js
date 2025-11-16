/**
 * سكريبت إنشاء مستخدم افتراضي للاختبار
 */

const mongoose = require('mongoose');
const User = require('./models/User');

async function createDefaultUser() {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect('mongodb://localhost:27017/school', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('🔗 تم الاتصال بقاعدة البيانات');
    
    // التحقق من وجود مستخدمين
    const userCount = await User.countDocuments();
    console.log(`📊 عدد المستخدمين الموجودين: ${userCount}`);
    
    // إنشاء مستخدم admin افتراضي إذا لم يوجد أي مستخدم
    if (userCount === 0) {
      console.log('👤 إنشاء مستخدم افتراضي...');
      
      const defaultUser = new User({
        firstName: 'المدير',
        lastName: 'العام',
        username: 'admin',
        password: '123456',
        role: 'admin'
      });
      
      // تعيين جميع الصلاحيات للمدير
      defaultUser.setDefaultPermissionsByRole();
      
      await defaultUser.save();
      
      console.log('✅ تم إنشاء المستخدم الافتراضي:');
      console.log('   اسم المستخدم: admin');
      console.log('   كلمة المرور: 123456');
      console.log('   الدور: مدير النظام');
      console.log('   الصلاحيات: جميع الصلاحيات');
    }
    
    // إنشاء مستخدمين إضافيين للاختبار
    const existingReceptionist = await User.findOne({ username: 'reception' });
    if (!existingReceptionist) {
      const receptionUser = new User({
        firstName: 'سارة',
        lastName: 'أحمد',
        username: 'reception',
        password: '123456',
        role: 'receptionist'
      });
      
      receptionUser.setDefaultPermissionsByRole();
      await receptionUser.save();
      
      console.log('✅ تم إنشاء مستخدم الاستقبال:');
      console.log('   اسم المستخدم: reception');
      console.log('   كلمة المرور: 123456');
    }
    
    const existingFollowUp = await User.findOne({ username: 'followup' });
    if (!existingFollowUp) {
      const followUpUser = new User({
        firstName: 'محمد',
        lastName: 'علي',
        username: 'followup',
        password: '123456',
        role: 'follow_up_staff'
      });
      
      followUpUser.setDefaultPermissionsByRole();
      await followUpUser.save();
      
      console.log('✅ تم إنشاء مستخدم المتابعة:');
      console.log('   اسم المستخدم: followup');
      console.log('   كلمة المرور: 123456');
    }
    
    // عرض جميع المستخدمين
    const allUsers = await User.find({}, 'firstName lastName username role');
    console.log('\n👥 جميع المستخدمين في النظام:');
    allUsers.forEach(user => {
      console.log(`   ${user.firstName} ${user.lastName} (${user.username}) - ${user.role}`);
    });
    
    console.log('\n🎉 جاهز للاستخدام!');
    console.log('📝 يمكنك الآن تسجيل الدخول بأي من الحسابات أعلاه');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدمين:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
    process.exit(0);
  }
}

// تشغيل الإنشاء
createDefaultUser();
