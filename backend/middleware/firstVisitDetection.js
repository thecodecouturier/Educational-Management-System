// ===============================
// 🔍 First Visit Auto-Detection Middleware  
// للكشف التلقائي عند أول زيارة للنظام
// ===============================

const AutoTimezoneDetector = require('../utils/autoTimezoneDetector');
const SystemSettings = require('../models/SystemSettings');

// 🔍 Middleware للكشف التلقائي عند أول زيارة
async function firstVisitAutoDetection(req, res, next) {
  try {
    // التحقق من وجود إعدادات مسبقة
    const existingSettings = await SystemSettings.findOne();
    
    // إذا كانت الإعدادات موجودة، تخطي الكشف
    if (existingSettings && existingSettings.institutionTimezone) {
      return next();
    }
    
    // إذا لم توجد إعدادات، قم بالكشف التلقائي
    console.log('🔍 أول زيارة للنظام - بدء الكشف التلقائي للمنطقة الزمنية...');
    
    const clientIP = getClientIP(req);
    console.log(`📍 IP الزائر: ${clientIP}`);
    
    try {
      // محاولة الكشف التلقائي
      const detectionResult = await AutoTimezoneDetector.detectTimezoneFromIP(clientIP);
      
      if (detectionResult && detectionResult.timezone) {
        // إنشاء إعدادات جديدة مع المنطقة المكتشفة
        const newSettings = new SystemSettings({
          institutionName: 'النظام التعليمي',
          institutionTimezone: detectionResult.timezone,
          timezoneSource: 'ip-detection',
          detectedAt: new Date(),
          detectedCountry: detectionResult.country,
          detectedCity: detectionResult.city,
          detectionMetadata: detectionResult
        });
        
        await newSettings.save();
        
        console.log('✅ تم الكشف التلقائي وحفظ الإعدادات:');
        console.log(`   🌍 المنطقة الزمنية: ${detectionResult.timezone}`);
        console.log(`   🏛️ الدولة: ${detectionResult.country || 'غير محدد'}`);
        console.log(`   🏙️ المدينة: ${detectionResult.city || 'غير محدد'}`);
        
        // إضافة المعلومات للـ request
        req.detectedTimezone = detectionResult.timezone;
        req.isFirstVisit = true;
        
      } else {
        console.log('⚠️ فشل الكشف التلقائي - استخدام القيم الافتراضية');
        
        // إنشاء إعدادات افتراضية
        const defaultSettings = new SystemSettings({
          institutionName: 'النظام التعليمي',
          institutionTimezone: 'Africa/Cairo',
          timezoneSource: 'default',
          detectedAt: new Date()
        });
        
        await defaultSettings.save();
        console.log('📝 تم إنشاء إعدادات افتراضية: Africa/Cairo');
      }
      
    } catch (detectionError) {
      console.error('❌ خطأ في الكشف التلقائي:', detectionError.message);
      
      // إنشاء إعدادات افتراضية عند الخطأ
      const fallbackSettings = new SystemSettings({
        institutionName: 'النظام التعليمي',
        institutionTimezone: 'Africa/Cairo',
        timezoneSource: 'default',
        detectedAt: new Date()
      });
      
      await fallbackSettings.save();
      console.log('📝 تم إنشاء إعدادات افتراضية بسبب الخطأ');
    }
    
    next();
    
  } catch (error) {
    console.error('خطأ في middleware الكشف التلقائي:', error);
    // متابعة العمل حتى لو فشل الكشف
    next();
  }
}

// 🔍 استخراج IP العميل
function getClientIP(req) {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         'unknown';
}

// 📊 Middleware لعرض معلومات الزيارة
async function logVisitInfo(req, res, next) {
  const clientIP = getClientIP(req);
  const userAgent = req.get('User-Agent');
  
  // استخدام النظام الجديد للحصول على التوقيت
  try {
    const TimezoneManager = require('../utils/timezoneManager');
    const currentTime = await TimezoneManager.getInstitutionNow();
    const timestamp = currentTime.format('DD‏/MM‏/YYYY، h:mm:ss A');
    
    console.log(`👤 زيارة جديدة: ${timestamp}`);
  } catch (error) {
    // في حالة الفشل، استخدم التوقيت العادي
    const timestamp = new Date().toLocaleString('ar-EG');
    console.log(`👤 زيارة جديدة: ${timestamp}`);
  }
  
  console.log(`   📍 IP: ${clientIP}`);
  console.log(`   🌐 User-Agent: ${userAgent?.substring(0, 50)}...`);
  
  if (req.isFirstVisit) {
    console.log(`   🎉 هذه أول زيارة للنظام!`);
    console.log(`   ✅ تم كشف المنطقة الزمنية: ${req.detectedTimezone}`);
  }
  
  next();
}

module.exports = {
  firstVisitAutoDetection,
  logVisitInfo,
  getClientIP
};
