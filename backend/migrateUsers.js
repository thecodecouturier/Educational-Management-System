/**
 * سكريبت ترقية قاعدة البيانات
 * إضافة صلاحيات للمستخدمين الموجودين
 */

const mongoose = require('mongoose');
const User = require('./models/User');

async function migrateUsers() {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect('mongodb://localhost:27017/school-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('🔗 تم الاتصال بقاعدة البيانات');
    
    // جلب جميع المستخدمين
    const users = await User.find({});
    console.log(`📊 تم العثور على ${users.length} مستخدم`);
    
    // ترقية كل مستخدم
    for (let user of users) {
      // التحقق من وجود الصلاحيات
      if (!user.permissions || Object.keys(user.permissions).length === 0) {
        console.log(`🔄 ترقية المستخدم: ${user.username} (${user.role})`);
        
        // تعيين الصلاحيات الافتراضية حسب الدور
        user.setDefaultPermissionsByRole();
        await user.save();
        
        console.log(`✅ تم ترقية ${user.username}`);
      } else {
        console.log(`⏭️  المستخدم ${user.username} محدث بالفعل`);
      }
    }
    
    console.log('🎉 تم الانتهاء من ترقية جميع المستخدمين');
    
    // عرض إحصائيات النتائج
    const updatedUsers = await User.find({});
    console.log('\n📈 إحصائيات الصلاحيات:');
    
    updatedUsers.forEach(user => {
      const activePermissions = Object.keys(user.permissions || {}).filter(key => user.permissions[key]);
      console.log(`👤 ${user.username} (${user.role}): ${activePermissions.length} صلاحيات`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في ترقية قاعدة البيانات:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
    process.exit(0);
  }
}

// تشغيل الترقية
migrateUsers();
