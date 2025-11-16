// SystemSettings.js
// نموذج لحفظ إعدادات النظام بما في ذلك المنطقة الزمنية المُكتشفة

const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // المنطقة الزمنية للمؤسسة
  institutionTimezone: {
    type: String,
    required: true,
    default: 'Africa/Cairo'
  },
  
  // مصدر كشف المنطقة الزمنية
  timezoneSource: {
    type: String,
    enum: ['manual', 'ip-detection', 'worldtimeapi', 'env-variable', 'default', 'server-timezone', 'fallback'],
    default: 'default'
  },
  
  // تاريخ كشف المنطقة الزمنية
  detectedAt: {
    type: Date,
    default: Date.now
  },
  
  // معلومات إضافية من الكشف
  detectedCountry: String,
  detectedCity: String,
  
  // إعدادات العملة الذكية
  currency: {
    code: { type: String, default: 'EGP' },
    symbol: { type: String, default: 'ج.م' },
    name: { type: String, default: 'جنيه مصري' },
    country: { type: String, default: 'مصر' }
  },
  
  // تاريخ تحديث العملة
  currencyUpdatedAt: {
    type: Date,
    default: Date.now
  },
  
  // إعدادات إضافية للنظام
  systemName: {
    type: String,
    default: 'نظام إدارة '
  },
  
  // إعدادات المؤسسة
  institutionName: String,
  institutionPhone: String,
  
  // إعدادات التشغيل
  autoBackup: {
    type: Boolean,
    default: true
  },
  
  // إعدادات الإشعارات
  notificationsEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
