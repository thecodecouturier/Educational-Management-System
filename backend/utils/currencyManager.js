// currencyManager.js
// إدارة ذكية للعملات حسب المنطقة الزمنية والدولة

class CurrencyManager {
  
  // خريطة المناطق الزمنية والعملات
  static TIMEZONE_CURRENCY_MAP = {
    // مصر
    'Africa/Cairo': { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري', country: 'مصر' },
    
    // السعودية
    'Asia/Riyadh': { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي', country: 'السعودية' },
    'Asia/Kuwait': { code: 'KWD', symbol: 'د.ك', name: 'دينار كويتي', country: 'الكويت' },
    'Asia/Qatar': { code: 'QAR', symbol: 'ر.ق', name: 'ريال قطري', country: 'قطر' },
    'Asia/Dubai': { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي', country: 'الإمارات' },
    'Asia/Bahrain': { code: 'BHD', symbol: 'د.ب', name: 'دينار بحريني', country: 'البحرين' },
    'Asia/Baghdad': { code: 'IQD', symbol: 'د.ع', name: 'دينار عراقي', country: 'العراق' },
    'Asia/Amman': { code: 'JOD', symbol: 'د.أ', name: 'دينار أردني', country: 'الأردن' },
    'Asia/Damascus': { code: 'SYP', symbol: 'ل.س', name: 'ليرة سورية', country: 'سوريا' },
    'Asia/Beirut': { code: 'LBP', symbol: 'ل.ل', name: 'ليرة لبنانية', country: 'لبنان' },
    
    // شمال أفريقيا
    'Africa/Tunis': { code: 'TND', symbol: 'د.ت', name: 'دينار تونسي', country: 'تونس' },
    'Africa/Algiers': { code: 'DZD', symbol: 'د.ج', name: 'دينار جزائري', country: 'الجزائر' },
    'Africa/Casablanca': { code: 'MAD', symbol: 'د.م', name: 'درهم مغربي', country: 'المغرب' },
    'Africa/Tripoli': { code: 'LYD', symbol: 'د.ل', name: 'دينار ليبي', country: 'ليبيا' },
    'Africa/Khartoum': { code: 'SDG', symbol: 'ج.س', name: 'جنيه سوداني', country: 'السودان' },
    
    // أوروبا (للأنظمة العالمية)
    'Europe/London': { code: 'GBP', symbol: '£', name: 'جنيه استرليني', country: 'بريطانيا' },
    'Europe/Berlin': { code: 'EUR', symbol: '€', name: 'يورو', country: 'ألمانيا' },
    'Europe/Paris': { code: 'EUR', symbol: '€', name: 'يورو', country: 'فرنسا' },
    
    // أمريكا
    'America/New_York': { code: 'USD', symbol: '$', name: 'دولار أمريكي', country: 'أمريكا' },
    'America/Toronto': { code: 'CAD', symbol: 'C$', name: 'دولار كندي', country: 'كندا' },
    
    // آسيا
    'Asia/Tokyo': { code: 'JPY', symbol: '¥', name: 'ين ياباني', country: 'اليابان' },
    'Asia/Shanghai': { code: 'CNY', symbol: '¥', name: 'يوان صيني', country: 'الصين' },
    'Asia/Kolkata': { code: 'INR', symbol: '₹', name: 'روبية هندية', country: 'الهند' },
    
    // العملة الافتراضية
    'default': { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري', country: 'مصر' }
  };
  
  // 💱 الحصول على معلومات العملة حسب المنطقة الزمنية
  static getCurrencyByTimezone(timezone) {
    // البحث المباشر
    if (this.TIMEZONE_CURRENCY_MAP[timezone]) {
      return this.TIMEZONE_CURRENCY_MAP[timezone];
    }
    
    // البحث الذكي - إذا لم توجد، ابحث بالنمط
    for (const [tz, currency] of Object.entries(this.TIMEZONE_CURRENCY_MAP)) {
      if (timezone.includes(tz.split('/')[1])) {
        return currency;
      }
    }
    
    // العملة الافتراضية
    return this.TIMEZONE_CURRENCY_MAP['default'];
  }
  
  // 🌍 الحصول على العملة الحالية للنظام
  static async getCurrentCurrency() {
    try {
      const TimezoneManager = require('./timezoneManager');
      const timezone = await TimezoneManager.getInstitutionTimezone();
      
      const currency = this.getCurrencyByTimezone(timezone);
      
      console.log(`💱 العملة المُكتشفة: ${currency.name} (${currency.symbol}) للمنطقة ${timezone}`);
      
      return currency;
    } catch (error) {
      console.error('خطأ في كشف العملة:', error.message);
      return this.TIMEZONE_CURRENCY_MAP['default'];
    }
  }
  
  // 💾 حفظ إعدادات العملة في قاعدة البيانات
  static async saveCurrencySettings(currencyInfo) {
    try {
      const SystemSettings = require('../models/SystemSettings');
      
      const settings = await SystemSettings.findOneAndUpdate(
        {},
        {
          currency: currencyInfo,
          currencyUpdatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      
      console.log(`💾 تم حفظ إعدادات العملة: ${currencyInfo.name}`);
      return settings;
    } catch (error) {
      console.error('خطأ في حفظ إعدادات العملة:', error.message);
      return null;
    }
  }
  
  // 📋 الحصول على العملة المحفوظة
  static async getSavedCurrency() {
    try {
      const SystemSettings = require('../models/SystemSettings');
      const settings = await SystemSettings.findOne();
      
      if (settings && settings.currency) {
        console.log(`📋 العملة المحفوظة: ${settings.currency.name}`);
        return settings.currency;
      }
    } catch (error) {
      console.error('خطأ في جلب العملة المحفوظة:', error.message);
    }
    
    return null;
  }
  
  // 🔄 تحديث العملة تلقائياً عند تغيير المنطقة الزمنية
  static async updateCurrencyFromTimezone() {
    try {
      // الحصول على العملة الحالية
      const currentCurrency = await this.getCurrentCurrency();
      
      // حفظها في قاعدة البيانات
      await this.saveCurrencySettings(currentCurrency);
      
      return currentCurrency;
    } catch (error) {
      console.error('خطأ في تحديث العملة:', error.message);
      return this.TIMEZONE_CURRENCY_MAP['default'];
    }
  }
  
  // 🎯 تهيئة العملة للنظام
  static async initializeCurrency() {
    // 1. تحقق من وجود عملة محفوظة
    const savedCurrency = await this.getSavedCurrency();
    if (savedCurrency) {
      return savedCurrency;
    }
    
    // 2. كشف تلقائي من المنطقة الزمنية
    console.log('🔍 لا توجد عملة محددة - كشف تلقائي من المنطقة الزمنية...');
    const detectedCurrency = await this.updateCurrencyFromTimezone();
    
    return detectedCurrency;
  }
  
  // 📊 تنسيق السعر حسب العملة
  static formatPrice(price, currency = null) {
    if (!currency) {
      currency = this.TIMEZONE_CURRENCY_MAP['default'];
    }
    
    if (!price || price === 0) {
      return 'غير محدد';
    }
    
    // تنسيق الرقم
    const formattedPrice = Number(price).toLocaleString('ar-EG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    return `${formattedPrice} ${currency.symbol}`;
  }
  
  // 📝 الحصول على قائمة العملات المدعومة
  static getSupportedCurrencies() {
    const currencies = [];
    const seen = new Set();
    
    for (const [timezone, currency] of Object.entries(this.TIMEZONE_CURRENCY_MAP)) {
      if (timezone === 'default') continue;
      
      const key = currency.code;
      if (!seen.has(key)) {
        seen.add(key);
        currencies.push({
          ...currency,
          timezone
        });
      }
    }
    
    return currencies.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }
  
  // 🔍 معلومات تشخيصية للعملة
  static async getCurrencyInfo() {
    try {
      const current = await this.getCurrentCurrency();
      const TimezoneManager = require('./timezoneManager');
      const timezone = await TimezoneManager.getInstitutionTimezone();
      
      return {
        current: current,
        timezone: timezone,
        formatted: this.formatPrice(100, current),
        supported: this.getSupportedCurrencies().length
      };
    } catch (error) {
      console.error('خطأ في معلومات العملة:', error);
      return {
        current: this.TIMEZONE_CURRENCY_MAP['default'],
        timezone: 'Africa/Cairo',
        formatted: this.formatPrice(100),
        supported: this.getSupportedCurrencies().length
      };
    }
  }
  
  // 📊 طباعة معلومات العملة
  static async logCurrencyInfo() {
    try {
      const info = await this.getCurrencyInfo();
      
      console.log('='.repeat(60));
      console.log('💱 معلومات العملة الذكية');
      console.log('='.repeat(60));
      
      console.log('💰 العملة الحالية:');
      console.log(`   📍 الرمز: ${info.current.code}`);
      console.log(`   💲 الرمز المرئي: ${info.current.symbol}`);
      console.log(`   📝 الاسم: ${info.current.name}`);
      console.log(`   🌍 الدولة: ${info.current.country}`);
      console.log(`   ⏰ المنطقة الزمنية: ${info.timezone}`);
      
      console.log('📋 مثال التنسيق:');
      console.log(`   💵 ${info.formatted}`);
      
      console.log(`🌐 العملات المدعومة: ${info.supported} عملة`);
      
      console.log('='.repeat(60));
    } catch (error) {
      console.error('خطأ في عرض معلومات العملة:', error);
    }
  }
}

module.exports = CurrencyManager;
