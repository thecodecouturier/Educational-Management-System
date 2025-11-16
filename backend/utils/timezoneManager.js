// timezoneManager.js
// إدارة ذكية للمناطق الزمنية في الأنظمة الموزعة عالمياً

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

class TimezoneManager {
  
    // � الحصول على المنطقة الزمنية للمؤسسة مع الكشف التلقائي
  static async getInstitutionTimezone() {
    try {
      // محاولة الكشف التلقائي من قاعدة البيانات
      const SystemSettings = require('../models/SystemSettings');
      const autoDetector = require('./autoTimezoneDetector');
      
      // البحث عن الإعدادات في قاعدة البيانات
      let settings = await SystemSettings.findOne();
      
      // إذا لم توجد إعدادات، حاول الكشف التلقائي
      if (!settings || !settings.institutionTimezone) {
        console.log('🔍 محاولة الكشف التلقائي للمنطقة الزمنية...');
        
        try {
          // محاولة كشف تلقائي
          const detectedTimezone = await autoDetector.initializeTimezone();
          
          if (detectedTimezone) {
            console.log(`✅ تم كشف المنطقة الزمنية تلقائياً: ${detectedTimezone}`);
            return detectedTimezone;
          }
        } catch (detectError) {
          console.log('⚠️ فشل الكشف التلقائي، استخدام القيم الافتراضية');
        }
      }
      
      // إرجاع المنطقة الزمنية من الإعدادات أو متغيرات البيئة أو القيمة الافتراضية
      const timezone = settings?.institutionTimezone || 
                      process.env.INSTITUTION_TIMEZONE || 
                      process.env.TIMEZONE || 
                      'Africa/Cairo';
      
      return timezone;
      
    } catch (error) {
      console.error('خطأ في الحصول على المنطقة الزمنية:', error.message);
      // إرجاع القيمة الافتراضية في حالة الخطأ
      return process.env.INSTITUTION_TIMEZONE || process.env.TIMEZONE || 'Africa/Cairo';
    }
  }
  
  // � الحصول على التاريخ الحالي بتوقيت المؤسسة
  static async getInstitutionNow(timezone = null) {
    // استخدام المنطقة الزمنية المُمررة أو محاولة الحصول عليها
    let tz = timezone;
    if (!tz) {
      try {
        tz = await this.getInstitutionTimezone();
      } catch (error) {
        console.error('خطأ في الحصول على المنطقة الزمنية:', error);
        tz = 'Africa/Cairo'; // قيمة افتراضية
      }
    }
    return dayjs().tz(tz);
  }
  // 🖥️ الحصول على المنطقة الزمنية للسيرفر
  static getServerTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  // 🖥️ الحصول على التاريخ الحالي بتوقيت السيرفر
  static getServerNow() {
    const serverTz = this.getServerTimezone();
    return dayjs.tz(new Date(), serverTz);
  }
  
  // 🌍 تحويل وقت للمنطقة الزمنية المحددة
  static convertToTimezone(date, targetTimezone) {
    return dayjs(date).tz(targetTimezone);
  }
  
  // ℹ️ معلومات مفصلة عن التوقيت
  static async getTimezoneInfo() {
    try {
      const institutionTz = await this.getInstitutionTimezone();
      const serverTz = this.getServerTimezone();
      const institutionNow = await this.getInstitutionNow();
      const serverNow = this.getServerNow();
      
      return {
        institution: {
          timezone: institutionTz,
          time: institutionNow.format('YYYY-MM-DD HH:mm:ss'),
          offset: institutionNow.format('Z')
        },
        server: {
          timezone: serverTz,
          time: serverNow.format('YYYY-MM-DD HH:mm:ss'),
          offset: serverNow.format('Z')
        },
        difference: {
          hours: institutionNow.diff(serverNow, 'hour'),
          minutes: institutionNow.diff(serverNow, 'minute') % 60
        }
      };
    } catch (error) {
      console.error('خطأ في getTimezoneInfo:', error);
      // إرجاع معلومات أساسية في حالة الخطأ
      const serverNow = this.getServerNow();
      return {
        institution: {
          timezone: 'Africa/Cairo',
          time: serverNow.format('YYYY-MM-DD HH:mm:ss'),
          offset: '+02:00'
        },
        server: {
          timezone: this.getServerTimezone(),
          time: serverNow.format('YYYY-MM-DD HH:mm:ss'),
          offset: serverNow.format('Z')
        },
        difference: {
          hours: 0,
          minutes: 0
        }
      };
    }
  }
  
  // 🔍 طباعة معلومات التوقيت للتشخيص
  static async logTimezoneInfo() {
    try {
      const info = await this.getTimezoneInfo();
      
      console.log('='.repeat(60));
      console.log('🌍 معلومات المناطق الزمنية للنظام');
      console.log('='.repeat(60));
      
      console.log('🏫 المؤسسة:');
      console.log(`   📍 المنطقة الزمنية: ${info.institution.timezone}`);
      console.log(`   ⏰ الوقت الحالي: ${info.institution.time}`);
      console.log(`   ↔️ الإزاحة: UTC${info.institution.offset}`);
      
      console.log('🖥️ السيرفر:');
      console.log(`   📍 المنطقة الزمنية: ${info.server.timezone}`);
      console.log(`   ⏰ الوقت الحالي: ${info.server.time}`);
      console.log(`   ↔️ الإزاحة: UTC${info.server.offset}`);
      
      const diffSign = info.difference.hours >= 0 ? '+' : '';
      console.log('🔄 الفرق:');
      console.log(`   ⏱️ ${diffSign}${info.difference.hours} ساعة و ${Math.abs(info.difference.minutes)} دقيقة`);
      
      if (info.institution.timezone === info.server.timezone) {
        console.log('✅ المؤسسة والسيرفر في نفس المنطقة الزمنية');
      } else {
        console.log('⚠️ المؤسسة والسيرفر في مناطق زمنية مختلفة');
        console.log('   💡 هذا طبيعي في الأنظمة السحابية');
      }
      
      console.log('='.repeat(60));
    } catch (error) {
      console.error('خطأ في عرض معلومات التوقيت:', error);
      console.log('📝 سيتم استخدام الإعدادات الافتراضية');
    }
  }
  
  // 🎯 توصيات للنشر
  static async getDeploymentRecommendations() {
    try {
      const info = await this.getTimezoneInfo();
      const recommendations = [];
      
      if (info.institution.timezone !== info.server.timezone) {
        recommendations.push({
          type: 'info',
          message: 'السيرفر والمؤسسة في مناطق زمنية مختلفة - هذا طبيعي'
        });
        
        recommendations.push({
          type: 'action',
          message: `تأكد من ضبط INSTITUTION_TIMEZONE=${info.institution.timezone} في .env`
        });
      }
      
      if (Math.abs(info.difference.hours) > 12) {
        recommendations.push({
          type: 'warning',
          message: 'فرق كبير في التوقيت - تأكد من صحة INSTITUTION_TIMEZONE'
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('خطأ في getDeploymentRecommendations:', error);
      return [{
        type: 'error',
        message: 'خطأ في تحليل التوصيات - يرجى التحقق من إعدادات النظام'
      }];
    }
  }
}

module.exports = TimezoneManager;
