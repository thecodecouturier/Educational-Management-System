// systemSettingsController.js
// تحكم في إعدادات النظام بما في ذلك المنطقة الزمنية

const SystemSettings = require('../models/SystemSettings');
const AutoTimezoneDetector = require('../utils/autoTimezoneDetector');
const CurrencyManager = require('../utils/currencyManager');

// الحصول على إعدادات النظام
exports.getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    
    // إذا لم توجد إعدادات، أنشئ افتراضية
    if (!settings) {
      console.log('🆕 إنشاء إعدادات افتراضية للنظام');
      
      // محاولة كشف المنطقة الزمنية تلقائياً
      const detectedInfo = await AutoTimezoneDetector.detectTimezoneFromFirstUser(req);
      
      const timezone = detectedInfo?.timezone || 'Africa/Cairo';
      
      // الحصول على العملة المناسبة للمنطقة الزمنية
      const currency = CurrencyManager.getCurrencyByTimezone(timezone);
      
      settings = new SystemSettings({
        institutionTimezone: timezone,
        timezoneSource: detectedInfo ? detectedInfo.source : 'default',
        detectedCountry: detectedInfo?.country,
        detectedCity: detectedInfo?.city,
        currency: currency,
        currencyUpdatedAt: new Date()
      });
      
      await settings.save();
      console.log(`✅ تم إنشاء إعدادات افتراضية - المنطقة: ${settings.institutionTimezone}`);
      console.log(`💱 تم تعيين العملة: ${currency.name} (${currency.symbol})`);
    }
    
    res.json({
      success: true,
      settings,
      availableTimezones: [
        { value: 'Africa/Cairo', label: '🇪🇬 مصر - القاهرة', region: 'أفريقيا' },
        { value: 'Asia/Dubai', label: '🇦🇪 الإمارات - دبي', region: 'آسيا' },
        { value: 'Asia/Riyadh', label: '🇸🇦 السعودية - الرياض', region: 'آسيا' },
        { value: 'Asia/Kuwait', label: '🇰🇼 الكويت', region: 'آسيا' },
        { value: 'Asia/Qatar', label: '🇶🇦 قطر - الدوحة', region: 'آسيا' },
        { value: 'Asia/Bahrain', label: '🇧🇭 البحرين - المنامة', region: 'آسيا' },
        { value: 'Africa/Tunis', label: '🇹🇳 تونس', region: 'أفريقيا' },
        { value: 'Africa/Casablanca', label: '🇲🇦 المغرب - كازابلانكا', region: 'أفريقيا' },
        { value: 'Asia/Baghdad', label: '🇮🇶 العراق - بغداد', region: 'آسيا' },
        { value: 'Asia/Damascus', label: '🇸🇾 سوريا - دمشق', region: 'آسيا' },
        { value: 'Asia/Beirut', label: '🇱🇧 لبنان - بيروت', region: 'آسيا' },
        { value: 'Asia/Amman', label: '🇯🇴 الأردن - عمان', region: 'آسيا' },
        { value: 'Europe/Paris', label: '🇫🇷 فرنسا - باريس', region: 'أوروبا' },
        { value: 'Europe/London', label: '🇬🇧 بريطانيا - لندن', region: 'أوروبا' },
        { value: 'America/New_York', label: '🇺🇸 أمريكا - نيويورك', region: 'أمريكا' },
        { value: 'America/Los_Angeles', label: '🇺🇸 أمريكا - لوس أنجلوس', region: 'أمريكا' },
        { value: 'Asia/Tokyo', label: '🇯🇵 اليابان - طوكيو', region: 'آسيا' },
        { value: 'Australia/Sydney', label: '🇦🇺 أستراليا - سيدني', region: 'أوقيانوسيا' }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// تحديث إعدادات النظام
exports.updateSystemSettings = async (req, res) => {
  try {
    const updates = req.body;
    
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings();
    }
    
    // تحديث الإعدادات
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        settings[key] = updates[key];
      }
    });
    
    // إذا تم تحديث المنطقة الزمنية، حدث المصدر والعملة تلقائياً
    if (updates.institutionTimezone) {
      settings.timezoneSource = 'manual';
      settings.detectedAt = new Date();
      console.log(`⚙️ تم تحديث المنطقة الزمنية يدوياً إلى: ${updates.institutionTimezone}`);
      
      // تحديث العملة تلقائياً بناءً على المنطقة الزمنية
      const newCurrency = CurrencyManager.getCurrencyByTimezone(updates.institutionTimezone);
      settings.currency = newCurrency;
      settings.currencyUpdatedAt = new Date();
      console.log(`💱 تم تحديث العملة تلقائياً إلى: ${newCurrency.name} (${newCurrency.symbol})`);
    }
    
    await settings.save();
    
    res.json({
      success: true,
      message: 'تم تحديث الإعدادات بنجاح',
      settings,
      currency: settings.currency // إرسال العملة المحدثة
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// كشف تلقائي للمنطقة الزمنية
exports.autoDetectTimezone = async (req, res) => {
  try {
    console.log('🔍 بدء الكشف التلقائي للمنطقة الزمنية...');
    
    // الحصول على IP المستخدم
    const clientIP = req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         'unknown';
    
    console.log(`🔍 كشف IP المستخدم: ${clientIP}`);
    
    let detectedInfo = null;
    
    // للـ localhost أو IP محلي، استخدم المنطقة الزمنية للسيرفر
    if (clientIP === '::1' || clientIP === '127.0.0.1' || clientIP === 'unknown' || clientIP.startsWith('192.168.') || clientIP.startsWith('10.')) {
      console.log('📍 IP محلي - استخدام المنطقة الزمنية للسيرفر');
      
      const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      detectedInfo = {
        timezone: serverTimezone,
        country: 'Local Development',
        city: 'Local Server',
        source: 'server-timezone'
      };
      
      console.log(`✅ تم استخدام المنطقة الزمنية للسيرفر: ${serverTimezone}`);
    } else {
      // للـ IP الحقيقي، جرب الكشف من الخدمات الخارجية
      try {
        detectedInfo = await AutoTimezoneDetector.detectTimezoneFromFirstUser(req);
      } catch (detectError) {
        console.log('⚠️ فشل الكشف من الخدمات الخارجية، استخدام المنطقة الافتراضية');
        detectedInfo = {
          timezone: 'Africa/Cairo',
          country: 'Egypt',
          city: 'Cairo',
          source: 'fallback'
        };
      }
    }
    
    if (detectedInfo && detectedInfo.timezone) {
      // حفظ المنطقة المُكتشفة
      let settings = await SystemSettings.findOne();
      if (!settings) {
        settings = new SystemSettings();
      }
      
      settings.institutionTimezone = detectedInfo.timezone;
      settings.timezoneSource = detectedInfo.source;
      settings.detectedAt = new Date();
      settings.detectedCountry = detectedInfo.country;
      settings.detectedCity = detectedInfo.city;
      
      // تحديث العملة تلقائياً بناءً على المنطقة الزمنية المكتشفة
      const detectedCurrency = CurrencyManager.getCurrencyByTimezone(detectedInfo.timezone);
      settings.currency = detectedCurrency;
      settings.currencyUpdatedAt = new Date();
      
      await settings.save();
      
      console.log(`✅ تم حفظ المنطقة الزمنية: ${detectedInfo.timezone}`);
      console.log(`💱 تم تحديث العملة تلقائياً: ${detectedCurrency.name} (${detectedCurrency.symbol})`);
      
      res.json({
        success: true,
        message: 'تم كشف المنطقة الزمنية والعملة تلقائياً',
        detected: {
          timezone: detectedInfo.timezone,
          country: detectedInfo.country,
          city: detectedInfo.city,
          source: detectedInfo.source
        },
        currency: detectedCurrency
      });
      
    } else {
      console.log('❌ فشل الكشف التلقائي تماماً');
      res.json({
        success: false,
        message: 'فشل الكشف التلقائي - يرجى اختيار المنطقة يدوياً'
      });
    }
    
  } catch (error) {
    console.error('خطأ في الكشف التلقائي:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'خطأ في النظام'
    });
  }
};

// الحصول على معلومات العملة الحالية
exports.getCurrentCurrency = async (req, res) => {
  try {
    // محاولة الحصول على العملة من قاعدة البيانات أولاً
    const savedCurrency = await CurrencyManager.getSavedCurrency();
    
    if (savedCurrency) {
      return res.json({
        success: true,
        currency: savedCurrency,
        source: 'database'
      });
    }
    
    // إذا لم توجد، كشف تلقائي من المنطقة الزمنية
    const detectedCurrency = await CurrencyManager.getCurrentCurrency();
    
    // حفظ العملة المُكتشفة
    await CurrencyManager.saveCurrencySettings(detectedCurrency);
    
    res.json({
      success: true,
      currency: detectedCurrency,
      source: 'auto-detected'
    });
    
  } catch (error) {
    console.error('خطأ في الحصول على العملة:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// تحديث العملة تلقائياً من المنطقة الزمنية
exports.updateCurrencyFromTimezone = async (req, res) => {
  try {
    console.log('🔄 تحديث العملة تلقائياً من المنطقة الزمنية...');
    
    const updatedCurrency = await CurrencyManager.updateCurrencyFromTimezone();
    
    res.json({
      success: true,
      message: 'تم تحديث العملة تلقائياً من المنطقة الزمنية',
      currency: updatedCurrency
    });
    
  } catch (error) {
    console.error('خطأ في تحديث العملة:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// الحصول على العملات المدعومة
exports.getSupportedCurrencies = async (req, res) => {
  try {
    const currencies = CurrencyManager.getSupportedCurrencies();
    
    res.json({
      success: true,
      currencies: currencies
    });
    
  } catch (error) {
    console.error('خطأ في جلب العملات المدعومة:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// تحديث العملة يدوياً
exports.updateCurrency = async (req, res) => {
  try {
    const { code, symbol, name, country } = req.body;
    
    if (!code || !symbol || !name) {
      return res.status(400).json({
        success: false,
        message: 'بيانات العملة غير مكتملة'
      });
    }
    
    const currencyInfo = { code, symbol, name, country };
    
    await CurrencyManager.saveCurrencySettings(currencyInfo);
    
    res.json({
      success: true,
      message: 'تم تحديث العملة بنجاح',
      currency: currencyInfo
    });
    
  } catch (error) {
    console.error('خطأ في تحديث العملة:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
