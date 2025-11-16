// autoTimezoneDetector.js
// كشف تلقائي للمنطقة الزمنية من IP المستخدم

const axios = require('axios');

class AutoTimezoneDetector {
  
  // 🌍 كشف المنطقة الزمنية من IP المستخدم الأول
  static async detectTimezoneFromFirstUser(req) {
    try {
      // الحصول على IP المستخدم
      const userIP = req.ip || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    (req.connection.socket ? req.connection.socket.remoteAddress : null);
      
      console.log(`🔍 كشف IP المستخدم: ${userIP}`);
      
      // إذا كان IP محلي، استخدم خدمة خارجية
      if (userIP === '::1' || userIP === '127.0.0.1' || userIP.includes('192.168')) {
        console.log('📍 IP محلي - استخدام خدمة خارجية لكشف المنطقة');
        return await this.detectFromExternalService();
      }
      
      // استخدام خدمة مجانية لكشف المنطقة من IP
      const response = await axios.get(`http://ip-api.com/json/${userIP}`);
      
      if (response.data.status === 'success') {
        const timezone = response.data.timezone;
        const country = response.data.country;
        const city = response.data.city;
        
        console.log(`✅ تم كشف المنطقة الزمنية تلقائياً:`);
        console.log(`   🌍 المنطقة: ${timezone}`);
        console.log(`   🇪🇬 الدولة: ${country}`);
        console.log(`   🏙️ المدينة: ${city}`);
        
        return {
          timezone,
          country,
          city,
          source: 'ip-detection'
        };
      }
      
    } catch (error) {
      console.log('❌ فشل الكشف من IP:', error.message);
    }
    
    return null;
  }
  
  // 🌐 كشف من خدمة خارجية (للـ IPs المحلية)
  static async detectFromExternalService() {
    try {
      // خدمة مجانية تكشف منطقتك الزمنية
      const response = await axios.get('http://worldtimeapi.org/api/ip');
      
      if (response.data.timezone) {
        console.log(`✅ تم كشف المنطقة من خدمة خارجية: ${response.data.timezone}`);
        return {
          timezone: response.data.timezone,
          source: 'worldtimeapi'
        };
      }
    } catch (error) {
      console.log('❌ فشل الكشف من الخدمة الخارجية:', error.message);
    }
    
    return null;
  }
  
  // 💾 حفظ المنطقة الزمنية المُكتشفة في قاعدة البيانات
  static async saveDetectedTimezone(timezoneInfo) {
    try {
      // إنشاء مجموعة إعدادات النظام
      const SystemSettings = require('../models/SystemSettings');
      
      const settings = await SystemSettings.findOneAndUpdate(
        {}, // العثور على أي إعداد
        {
          institutionTimezone: timezoneInfo.timezone,
          timezoneSource: timezoneInfo.source,
          detectedAt: new Date(),
          detectedCountry: timezoneInfo.country,
          detectedCity: timezoneInfo.city
        },
        { upsert: true, new: true } // إنشاء إذا لم يوجد
      );
      
      console.log(`💾 تم حفظ المنطقة الزمنية: ${timezoneInfo.timezone}`);
      return settings;
      
    } catch (error) {
      console.log('❌ فشل حفظ المنطقة الزمنية:', error.message);
    }
    
    return null;
  }
  
  // 📋 الحصول على المنطقة الزمنية المحفوظة
  static async getSavedTimezone() {
    try {
      const SystemSettings = require('../models/SystemSettings');
      const settings = await SystemSettings.findOne();
      
      if (settings && settings.institutionTimezone) {
        console.log(`📋 المنطقة الزمنية المحفوظة: ${settings.institutionTimezone}`);
        return settings.institutionTimezone;
      }
    } catch (error) {
      console.log('❌ فشل جلب المنطقة المحفوظة:', error.message);
    }
    
    return null;
  }
  
  // 🚀 تشغيل الكشف التلقائي عند أول استخدام
  static async initializeTimezone(req) {
    // 1. تحقق من وجود منطقة محفوظة
    const savedTimezone = await this.getSavedTimezone();
    if (savedTimezone) {
      return savedTimezone;
    }
    
    // 2. تحقق من متغير البيئة
    const envTimezone = process.env.INSTITUTION_TIMEZONE || process.env.TIMEZONE;
    if (envTimezone) {
      console.log(`⚙️ استخدام المنطقة من .env: ${envTimezone}`);
      return envTimezone;
    }
    
    // 3. كشف تلقائي من المستخدم الأول
    console.log('🔍 لا توجد منطقة زمنية محددة - كشف تلقائي...');
    const detectedInfo = await this.detectTimezoneFromFirstUser(req);
    
    if (detectedInfo) {
      await this.saveDetectedTimezone(detectedInfo);
      return detectedInfo.timezone;
    }
    
    // 4. افتراضي كملاذ أخير
    console.log('⚠️ فشل الكشف التلقائي - استخدام Africa/Cairo كافتراضي');
    return 'Africa/Cairo';
  }
}

module.exports = AutoTimezoneDetector;
