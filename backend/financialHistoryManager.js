const mongoose = require('mongoose');
const FinancialHistory = require('./models/FinancialHistory');
const FinancialSettings = require('./models/FinancialSettings');
const DashboardController = require('./controllers/dashboardController');

/**
 * 📊 مدير التقارير المالية التاريخية
 * 
 * هذا الملف مسؤول عن إنشاء وإدارة التقارير المالية التاريخية
 * لاستخدامها في الرسوم البيانية والتحليلات المالية
 */
class FinancialHistoryManager {

  /**
   * 📅 إنشاء تقرير شهري
   */
  static async createMonthlyReport(year, month) {
    try {
      console.log(`📊 إنشاء التقرير المالي الشهري لـ ${month}/${year}...`);
      
      const periodId = `${year}-${month.toString().padStart(2, '0')}`;
      
      // التحقق من وجود التقرير مسبقاً
      const existingReport = await FinancialHistory.findOne({ periodId });
      if (existingReport) {
        console.log('⚠️ التقرير موجود مسبقاً، سيتم تحديثه...');
      }

      // الحصول على البيانات المالية للشهر
      const expectedRevenue = await DashboardController.calculateExpectedRevenue();
      
      // حساب الإيراد المحصل للشهر
      const { getMonthInfo } = require('./utils/monthInfo');
      const TimezoneManager = require('./utils/timezoneManager');
      const timezone = await TimezoneManager.getInstitutionTimezone();
      const monthInfo = await getMonthInfo(year, month - 1, timezone); // month-1 because JS months are 0-based
      
      const collectedRevenue = await DashboardController.getMonthlyCollectedRevenue(monthInfo.monthName);
      
      // حساب إحصائيات الطلاب والمجموعات
      const Student = require('./models/Student');
      const Teacher = require('./models/Teacher');
      const Group = require('./models/Group');
      
      const [totalStudents, totalTeachers, totalGroups] = await Promise.all([
        Student.countDocuments(),
        Teacher.countDocuments(),
        Group.countDocuments()
      ]);
      
      const revenueBreakdown = await DashboardController.getRevenueBreakdownByGroup();
      
      // إنشاء/تحديث التقرير
      const reportData = {
        periodId,
        periodType: 'monthly',
        year: year,
        month: month,
        financial: {
          expectedRevenue: expectedRevenue,
          collectedRevenue: collectedRevenue,
          collectionRate: expectedRevenue > 0 ? (collectedRevenue / expectedRevenue * 100) : 0,
          deficit: Math.max(0, expectedRevenue - collectedRevenue),
          expenses: 0, // يمكن إضافتها لاحقاً
          netProfit: collectedRevenue - 0 // الإيراد - المصروفات
        },
        statistics: {
          totalStudents: totalStudents,
          paidStudents: Math.floor(collectedRevenue / (expectedRevenue / totalStudents || 1)),
          activeGroups: totalGroups,
          totalTeachers: totalTeachers
        },
        groupBreakdown: revenueBreakdown || [],
        status: 'finalized',
        finalizedAt: new Date()
      };

      const report = existingReport 
        ? await FinancialHistory.findOneAndUpdate({ periodId }, reportData, { new: true })
        : await FinancialHistory.create(reportData);

      console.log('✅ تم إنشاء/تحديث التقرير الشهري بنجاح');
      return report;

    } catch (error) {
      console.error('❌ خطأ في إنشاء التقرير الشهري:', error);
      throw error;
    }
  }

  /**
   * 📅 إنشاء تقرير سنوي
   */
  static async createYearlyReport(year) {
    try {
      console.log(`📊 إنشاء التقرير المالي السنوي لـ ${year}...`);
      
      const periodId = year.toString();
      
      // جمع البيانات من التقارير الشهرية للسنة
      const monthlyReports = await FinancialHistory.find({
        periodType: 'monthly',
        year: year
      });

      let totalExpected = 0;
      let totalCollected = 0;
      let totalExpenses = 0;
      let avgStudents = 0;
      let avgGroups = 0;
      let avgTeachers = 0;

      if (monthlyReports.length > 0) {
        totalExpected = monthlyReports.reduce((sum, report) => 
          sum + (report.financial.expectedRevenue || 0), 0);
        totalCollected = monthlyReports.reduce((sum, report) => 
          sum + (report.financial.collectedRevenue || 0), 0);
        totalExpenses = monthlyReports.reduce((sum, report) => 
          sum + (report.financial.expenses || 0), 0);
        
        avgStudents = Math.round(monthlyReports.reduce((sum, report) => 
          sum + (report.statistics.totalStudents || 0), 0) / monthlyReports.length);
        avgGroups = Math.round(monthlyReports.reduce((sum, report) => 
          sum + (report.statistics.activeGroups || 0), 0) / monthlyReports.length);
        avgTeachers = Math.round(monthlyReports.reduce((sum, report) => 
          sum + (report.statistics.totalTeachers || 0), 0) / monthlyReports.length);
      }

      const reportData = {
        periodId,
        periodType: 'yearly',
        year: year,
        financial: {
          expectedRevenue: totalExpected,
          collectedRevenue: totalCollected,
          collectionRate: totalExpected > 0 ? (totalCollected / totalExpected * 100) : 0,
          deficit: Math.max(0, totalExpected - totalCollected),
          expenses: totalExpenses,
          netProfit: totalCollected - totalExpenses
        },
        statistics: {
          totalStudents: avgStudents,
          paidStudents: Math.floor(totalCollected / (totalExpected / avgStudents || 1)),
          activeGroups: avgGroups,
          totalTeachers: avgTeachers
        },
        status: 'finalized',
        finalizedAt: new Date()
      };

      const existingReport = await FinancialHistory.findOne({ periodId });
      const report = existingReport 
        ? await FinancialHistory.findOneAndUpdate({ periodId }, reportData, { new: true })
        : await FinancialHistory.create(reportData);

      console.log('✅ تم إنشاء/تحديث التقرير السنوي بنجاح');
      return report;

    } catch (error) {
      console.error('❌ خطأ في إنشاء التقرير السنوي:', error);
      throw error;
    }
  }

  /**
   * 🔄 تحديث جميع التقارير للفترات السابقة
   */
  static async updateHistoricalReports(months = 12) {
    try {
      console.log(`🔄 تحديث التقارير التاريخية للـ ${months} شهر الماضية...`);
      
      const now = new Date();
      const reports = [];

      // إنشاء تقارير شهرية
      for (let i = 0; i < months; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // +1 because JS months are 0-based
        
        try {
          const report = await this.createMonthlyReport(year, month);
          reports.push(report);
        } catch (error) {
          console.warn(`⚠️ فشل في إنشاء تقرير ${month}/${year}:`, error.message);
        }
      }

      // إنشاء تقارير سنوية للسنوات الموجودة
      const years = [...new Set(reports.map(r => r.year))];
      for (const year of years) {
        try {
          await this.createYearlyReport(year);
        } catch (error) {
          console.warn(`⚠️ فشل في إنشاء التقرير السنوي لـ ${year}:`, error.message);
        }
      }

      console.log(`✅ تم تحديث ${reports.length} تقرير شهري و ${years.length} تقرير سنوي`);
      return reports;

    } catch (error) {
      console.error('❌ خطأ في تحديث التقارير التاريخية:', error);
      throw error;
    }
  }

  /**
   * 📊 الحصول على البيانات للرسوم البيانية
   */
  static async getChartsData() {
    try {
      console.log('📊 جلب بيانات الرسوم البيانية من التقارير التاريخية...');

      // البيانات الشهرية (آخر 12 شهر)
      const monthlyReports = await FinancialHistory.getLastNMonths(12);
      
      // البيانات السنوية (آخر 3 سنوات)
      const currentYear = new Date().getFullYear();
      const yearlyReports = await FinancialHistory.find({
        periodType: 'yearly',
        year: { $in: [currentYear - 2, currentYear - 1, currentYear] }
      }).sort({ year: 1 });

      // تحويل البيانات لصيغة مناسبة للرسوم البيانية
      const monthlyData = monthlyReports.reverse().map(report => ({
        month: `${report.month}/${report.year}`,
        fullMonth: this.getArabicMonthName(report.month, report.year),
        expected: report.financial.expectedRevenue,
        collected: report.financial.collectedRevenue,
        collectionRate: parseFloat(report.financial.collectionRate.toFixed(1)),
        deficit: report.financial.deficit,
        year: report.year
      }));

      const yearlyData = yearlyReports.map(report => ({
        year: report.year,
        expected: report.financial.expectedRevenue,
        collected: report.financial.collectedRevenue,
        collectionRate: parseFloat(report.financial.collectionRate.toFixed(1)),
        deficit: report.financial.deficit
      }));

      return {
        monthly: monthlyData,
        yearly: yearlyData,
        timestamp: new Date().toLocaleString('ar-EG')
      };

    } catch (error) {
      console.error('❌ خطأ في جلب بيانات الرسوم البيانية:', error);
      throw error;
    }
  }

  /**
   * 📅 الحصول على اسم الشهر بالعربية
   */
  static getArabicMonthName(month, year) {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${months[month - 1]} ${year}`;
  }

  /**
   * ⚙️ إنشاء الإعدادات الافتراضية للنظام المالي
   */
  static async createDefaultSettings() {
    try {
      const existingSettings = await FinancialSettings.findOne({ settingsId: 'main' });
      if (existingSettings) {
        console.log('⚠️ الإعدادات موجودة مسبقاً');
        return existingSettings;
      }

      const defaultSettings = await FinancialSettings.create({
        settingsId: 'main',
        currency: {
          code: 'EGP',
          name: 'جنيه مصري',
          symbol: 'ج.م',
          position: 'after'
        },
        payments: {
          acceptedPaymentMethods: [
            { method: 'cash', isActive: true, displayName: 'نقداً' },
            { method: 'bank_transfer', isActive: true, displayName: 'تحويل بنكي' }
          ]
        },
        targets: {
          collectionRateTarget: 85,
          monthlyRevenueTarget: 10000
        }
      });

      console.log('✅ تم إنشاء الإعدادات الافتراضية');
      return defaultSettings;

    } catch (error) {
      console.error('❌ خطأ في إنشاء الإعدادات الافتراضية:', error);
      throw error;
    }
  }
}

module.exports = FinancialHistoryManager;

// 🚀 تشغيل السكريبت مباشرة إذا تم استدعاؤه
if (require.main === module) {
  mongoose.connect('mongodb://localhost:27017/schoolDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(async () => {
    console.log('🔗 تم الاتصال بقاعدة البيانات');
    
    try {
      // إنشاء الإعدادات الافتراضية
      await FinancialHistoryManager.createDefaultSettings();
      
      // تحديث التقارير التاريخية
      await FinancialHistoryManager.updateHistoricalReports(12);
      
      console.log('🎉 تم الانتهاء من إعداد النظام المالي!');
      
    } catch (error) {
      console.error('❌ خطأ في إعداد النظام المالي:', error);
    } finally {
      mongoose.disconnect();
    }
  }).catch(error => {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
  });
}