const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  subscriptionId: { type: String, required: true, ref: 'Subscription' },
  studentId: { type: String, required: true, ref: 'Student' },
  groupId: { type: String, ref: 'Group' }, // إضافة groupId للربط مع المجموعة
  months: [
    {
      month: { type: String, required: true }, // مثال: "سبتمبر 2025"
      status: { type: String, enum: ['مدفوع', 'غير مدفوع'], default: 'غير مدفوع' },
      amount: { type: Number, required: true }, // سعر المجموعة وقت الدفع
      paidDate: { type: Date }, // تاريخ الدفع الكامل (يوم/شهر/سنة)
      paidDay: { type: Number }, // رقم اليوم (1-31)
      paidMonth: { type: Number }, // رقم الشهر (1-12)
      paidYear: { type: Number }, // السنة (مثال: 2025)
      groupPrice: { type: Number }, // سعر المجموعة وقت الدفع (نسخة احتياطية)
      lastModified: { type: Date, default: Date.now } // آخر تعديل
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 🔧 Middleware قبل الحفظ: تحديث updatedAt
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 📝 دالة مساعدة لتحديث بيانات الدفع تلقائيًا
paymentSchema.methods.updateMonthPayment = async function(monthIndex, status, groupPrice) {
  if (monthIndex < 0 || monthIndex >= this.months.length) {
    throw new Error('رقم الشهر غير صحيح');
  }

  const monthData = this.months[monthIndex];
  
  // إذا تم تغيير الحالة إلى "مدفوع"
  if (status === 'مدفوع' && monthData.status !== 'مدفوع') {
    const now = new Date();
    
    // تسجيل تاريخ الدفع الكامل
    monthData.paidDate = now;
    monthData.paidDay = now.getDate();
    monthData.paidMonth = now.getMonth() + 1;
    monthData.paidYear = now.getFullYear();
    
    // تسجيل سعر المجموعة
    if (groupPrice) {
      monthData.amount = groupPrice;
      monthData.groupPrice = groupPrice;
    }
    
    monthData.lastModified = now;
  }
  
  // إذا تم تغيير الحالة إلى "غير مدفوع"
  if (status === 'غير مدفوع' && monthData.status === 'مدفوع') {
    // حذف بيانات الدفع
    monthData.paidDate = null;
    monthData.paidDay = null;
    monthData.paidMonth = null;
    monthData.paidYear = null;
    monthData.lastModified = new Date();
  }
  
  // تحديث الحالة
  monthData.status = status;
  
  return monthData;
};

// 📝 دالة للحصول على المدفوعات في شهر معين
paymentSchema.methods.getPaymentsByMonth = function(month, year) {
  return this.months.filter(m => {
    return m.paidMonth === month && m.paidYear === year && m.status === 'مدفوع';
  });
};

// 📝 دالة للحصول على المدفوعات في يوم معين
paymentSchema.methods.getPaymentsByDate = function(day, month, year) {
  return this.months.filter(m => {
    return m.paidDay === day && m.paidMonth === month && m.paidYear === year && m.status === 'مدفوع';
  });
};

module.exports = mongoose.model('Payment', paymentSchema);

// -------------------------
// Triggers: تشغيل حسابات الداشبورد عند تغيّر بيانات الدفعات
// -------------------------
// ملاحظة: نستخدم عدة هوكات (save, deleteOne, findOneAndDelete) للتغطية في حالات الحفظ والحذف المختلفة
paymentSchema.post('save', function(doc) {
  (async () => {
    try {
      const dashboardModule = require('../controllers/financialAnalytics/dashboardModule');
      if (dashboardModule && typeof dashboardModule.calculateMonthlyExpectedRevenue === 'function') {
        await dashboardModule.calculateMonthlyExpectedRevenue();
      }
      if (dashboardModule && typeof dashboardModule.calculateMonthlyCollectedRevenue === 'function') {
        await dashboardModule.calculateMonthlyCollectedRevenue();
      }
      if (dashboardModule && typeof dashboardModule.calculateCollectionRate === 'function') {
        await dashboardModule.calculateCollectionRate();
      }
      console.log('✅ dashboard calculations triggered after Payment.save');
    } catch (err) {
      console.error('❌ Error running dashboard calculations after Payment.save:', err);
    }
  })();
});

// query middleware for deletion operations that don't issue document middleware
paymentSchema.post('deleteOne', { document: false, query: true }, function() {
  (async () => {
    try {
      const dashboardModule = require('../controllers/financialAnalytics/dashboardModule');
      if (dashboardModule && typeof dashboardModule.calculateMonthlyExpectedRevenue === 'function') {
        await dashboardModule.calculateMonthlyExpectedRevenue();
      }
      if (dashboardModule && typeof dashboardModule.calculateMonthlyCollectedRevenue === 'function') {
        await dashboardModule.calculateMonthlyCollectedRevenue();
      }
      if (dashboardModule && typeof dashboardModule.calculateCollectionRate === 'function') {
        await dashboardModule.calculateCollectionRate();
      }
      console.log('✅ dashboard calculations triggered after Payment.deleteOne');
    } catch (err) {
      console.error('❌ Error running dashboard calculations after Payment.deleteOne:', err);
    }
  })();
});

// post hook for findOneAndDelete
paymentSchema.post('findOneAndDelete', function(doc) {
  (async () => {
    try {
      const dashboardModule = require('../controllers/financialAnalytics/dashboardModule');
      if (dashboardModule && typeof dashboardModule.calculateMonthlyExpectedRevenue === 'function') {
        await dashboardModule.calculateMonthlyExpectedRevenue();
      }
      if (dashboardModule && typeof dashboardModule.calculateMonthlyCollectedRevenue === 'function') {
        await dashboardModule.calculateMonthlyCollectedRevenue();
      }
      if (dashboardModule && typeof dashboardModule.calculateCollectionRate === 'function') {
        await dashboardModule.calculateCollectionRate();
      }
      console.log('✅ dashboard calculations triggered after Payment.findOneAndDelete');
    } catch (err) {
      console.error('❌ Error running dashboard calculations after Payment.findOneAndDelete:', err);
    }
  })();
});
