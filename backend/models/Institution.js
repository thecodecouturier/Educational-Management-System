// ===============================
// 🏢 Institution Model - Multi-Tenant
// ===============================
const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  // 🏫 معلومات المؤسسة الأساسية
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // 🔑 معرف فريد للمؤسسة (للـ URL والوصول)
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  // 🌍 معلومات المنطقة الزمنية
  timezone: {
    type: String,
    required: true,
    default: 'Africa/Cairo'
  },
  
  // 📍 معلومات الموقع
  location: {
    country: String,
    city: String,
    address: String,
    latitude: Number,
    longitude: Number
  },
  
  // 🔍 معلومات الكشف التلقائي
  autoDetection: {
    source: {
      type: String,
      enum: ['manual', 'ip-detection', 'worldtimeapi', 'env-variable', 'default'],
      default: 'default'
    },
    detectedFrom: String, // IP address
    detectedAt: Date,
    detectionMetadata: {
      country: String,
      countryCode: String,
      region: String,
      city: String,
      timezone: String,
      isp: String
    }
  },
  
  // ⚙️ إعدادات النظام للمؤسسة
  settings: {
    language: {
      type: String,
      default: 'ar'
    },
    currency: {
      type: String,
      default: 'EGP'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    },
    workingDays: [{
      type: String,
      enum: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }],
    defaultWorkingDays: {
      type: [String],
      default: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    }
  },
  
  // 👤 معلومات المدير/المالك
  owner: {
    name: String,
    email: String,
    phone: String
  },
  
  // 📊 حالة المؤسسة
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // 📅 معلومات التسجيل
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 📌 Index للبحث السريع
institutionSchema.index({ slug: 1 });
institutionSchema.index({ status: 1 });
institutionSchema.index({ 'location.country': 1 });

// 🔧 Middleware لتحديث updatedAt
institutionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 🎯 دالة لإنشاء slug من الاسم
institutionSchema.methods.generateSlug = function() {
  return this.name
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ي]/g, 'ى')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

module.exports = mongoose.model('Institution', institutionSchema);
