const mongoose = require('mongoose');

// 📊 نموذج تحليلات لوحة المؤشرات المتقدمة
const dashboardAnalyticsSchema = new mongoose.Schema({
  
  // 🆔 معرف فريد
  analyticsId: {
    type: String,
    required: true,
    unique: true,
    default: () => `ANALYTICS_${Date.now()}`
  },
  
  // 📈 بيانات السنوات (4 سنوات)
  // لاحظ: لم نعد نخزن الأشهر والسنوات كمصفوفات منفصلة — نحن نركّز على أيام الشهر
  
  // 📆 بيانات الأيام (ديناميكي حسب أيام الشهر الحالي)
  days: [{
    id: {
      type: String,
      required: true
    }, // مثال: "20" أو "2025-10-20"
    dayNumber: {
      type: Number,
      required: true
    }, // رقم اليوم في الشهر (1-31)
    monthName: {
      type: String,
      required: true
    }, // اسم الشهر (أكتوبر)
    monthNumber: {
      type: Number,
      required: true
    }, // رقم الشهر (10)
    yearName: {
      type: String,
      required: true
    }, // اسم السنة (2025)
    yearNumber: {
      type: Number,
      required: true
    }, // رقم السنة (2025)
    fullDate: {
      type: Date,
      required: true
    }, // التاريخ الكامل
    dayName: {
      type: String
    }, // اسم اليوم (السبت، الأحد، إلخ)
    dailyRevenue: {
      type: Number,
      default: 0
    }, // الإيراد المحصل اليومي
    cumulativeRevenue: {
      type: Number,
      default: 0
    }, // الإيراد المحصل التراكمي
    collectionRate: {
      type: Number,
      default: 0
    }, // نسبة التحصيل
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 📊 معلومات إضافية
  metadata: {
    currentMonth: {
      type: String
    },
    currentYear: {
      type: String
    },
    // قيم ملخّصة للشهر الحالي (حفظها هنا بدلاً من مصفوفة months)
    currentMonthExpected: {
      type: Number,
      default: 0
    },
    currentMonthCollected: {
      type: Number,
      default: 0
    },
    lastFullUpdate: {
      type: Date,
      default: Date.now
    },
    lastDailyUpdate: {
      type: Date,
      default: Date.now
    },
    lastMonthlyUpdate: {
      type: Date,
      default: Date.now
    },
    timezone: {
      type: String,
      default: 'Africa/Cairo'
    }
  },
  
  // 📅 تواريخ الإنشاء والتحديث
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

// 🔍 Indexes للبحث السريع
dashboardAnalyticsSchema.index({ analyticsId: 1 });
dashboardAnalyticsSchema.index({ 'days.fullDate': -1 });
dashboardAnalyticsSchema.index({ 'months.monthNumber': 1, 'months.yearNumber': 1 });
dashboardAnalyticsSchema.index({ 'years.id': 1 });

// 🛠️ دوال مساعدة

// الحصول على اليوم الحالي من المصفوفة
dashboardAnalyticsSchema.methods.getCurrentDay = function(dayNumber, monthNumber, yearNumber) {
  return this.days.find(day => 
    day.dayNumber === dayNumber && 
    day.monthNumber === monthNumber && 
    day.yearNumber === yearNumber
  );
};

// الحصول على الشهر الحالي من المصفوفة
// الحصول على معلومات الشهر الحالي (بناءً من metadata)
dashboardAnalyticsSchema.methods.getCurrentMonth = function(monthNumber, yearNumber) {
  return {
    monthNumber: monthNumber,
    yearNumber: yearNumber,
    expectedRevenue: this.metadata?.currentMonthExpected || 0,
    collectedRevenue: this.metadata?.currentMonthCollected || 0
  };
};

// لا نحتفظ بمصفوفة سنوات منفصلة بعد الآن؛ هذه دالة توافقية إذا طُلبت
dashboardAnalyticsSchema.methods.getCurrentYear = function(yearNumber) {
  return { id: String(yearNumber), annualRevenue: 0 };
};

// تحديث اليوم الحالي
dashboardAnalyticsSchema.methods.updateDay = function(dayNumber, monthNumber, yearNumber, updates) {
  const dayIndex = this.days.findIndex(day => 
    day.dayNumber === dayNumber && 
    day.monthNumber === monthNumber && 
    day.yearNumber === yearNumber
  );
  
  if (dayIndex !== -1) {
    Object.assign(this.days[dayIndex], updates, { lastUpdated: new Date() });
    return true;
  }
  return false;
};
// تحديث بيانات الشهر الحالي (نخزن هذه القيم في metadata لأننا نحتفظ بالأيام فقط)
dashboardAnalyticsSchema.methods.updateMonth = function(monthNumber, yearNumber, updates) {
  try {
    if (typeof updates.expectedRevenue !== 'undefined') this.metadata.currentMonthExpected = updates.expectedRevenue;
    if (typeof updates.collectedRevenue !== 'undefined') this.metadata.currentMonthCollected = updates.collectedRevenue;
    this.metadata.lastMonthlyUpdate = new Date();
    return true;
  } catch (e) {
    return false;
  }
};

// تحديث السنة (توافقية بسيطة)
dashboardAnalyticsSchema.methods.updateYear = function(yearNumber, updates) {
  // لا توجد سنة منفصلة مخزّنة؛ نحتفظ بتوافقية ولا نعيّن قيماً فعلية
  return false;
};

// 🔧 Middleware قبل الحفظ
dashboardAnalyticsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('DashboardAnalytics', dashboardAnalyticsSchema);
