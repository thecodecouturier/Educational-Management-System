const DashboardAnalytics = require('../../models/DashboardAnalytics');
const Payment = require('../../models/Payment');
const Subscription = require('../../models/Subscription');
const Group = require('../../models/Group');
const TimezoneManager = require('../../utils/timezoneManager');
const { getMonthInfo } = require('../../utils/monthInfo');

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// 📊 وحدة لوحة المؤشرات المالية
class DashboardModule {
  
  // 🎯 تهيئة النظام وإنشاء البيانات الأساسية
  async initializeDashboard() {
    try {
      console.log('🚀 تهيئة نظام لوحة المؤشرات...');
      
      // التحقق من وجود سجل تحليلات
      let analytics = await DashboardAnalytics.findOne();
      
      if (!analytics) {
        console.log('📝 إنشاء سجل تحليلات جديد...');
        analytics = await this.createNewAnalytics();
      }
      
      // التحقق من تحديث الأيام للشهر الحالي
      await this.ensureCurrentMonthDays(analytics);
      
      console.log('✅ تم تهيئة النظام بنجاح');
      return analytics;
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة النظام:', error);
      throw error;
    }
  }
  
  // 📝 إنشاء سجل تحليلات جديد
  async createNewAnalytics() {
    try {
      const tz = await TimezoneManager.getInstitutionTimezone();
      const now = await TimezoneManager.getInstitutionNow();
      
      const currentYear = now.year();
      const currentMonth = now.month() + 1;
      
      // إنشاء 4 سنوات
      // لا نحتاج إلى مصفوفات سنوات/شهور منفصلة بعد الآن — نركز على أيام الشهر وملخّصات الشهر في metadata
      const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      
      // إنشاء أيام الشهر الحالي
      const days = await this.generateCurrentMonthDays(tz);
      
      const analytics = new DashboardAnalytics({
        analyticsId: `ANALYTICS_${Date.now()}`,
        days,
        metadata: {
          currentMonth: monthNames[currentMonth - 1],
          currentYear: currentYear.toString(),
          currentMonthExpected: 0,
          currentMonthCollected: 0,
          lastFullUpdate: new Date(),
          timezone: tz
        }
      });
      
      await analytics.save();
      console.log('✅ تم إنشاء سجل التحليلات بنجاح');
      
      return analytics;
      
    } catch (error) {
      console.error('❌ خطأ في إنشاء سجل التحليلات:', error);
      throw error;
    }
  }
  
  // 📅 توليد أيام الشهر الحالي
  async generateCurrentMonthDays(tz) {
    try {
      const now = await TimezoneManager.getInstitutionNow();
      const year = now.year();
      const month = now.month(); // 0-indexed
      
      const monthInfo = await getMonthInfo(year, month, tz);
      const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      
      const arabicDaysMap = {
        'Sunday': 'الأحد',
        'Monday': 'الاثنين',
        'Tuesday': 'الثلاثاء',
        'Wednesday': 'الأربعاء',
        'Thursday': 'الخميس',
        'Friday': 'الجمعة',
        'Saturday': 'السبت'
      };
      
      const days = [];
      
      for (let dayNum = 1; dayNum <= monthInfo.daysInMonth; dayNum++) {
        const dayDate = dayjs.tz(`${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`, tz);
        const dayNameEn = dayDate.format('dddd');
        
        days.push({
          id: dayNum.toString(),
          dayNumber: dayNum,
          monthName: monthNames[month],
          monthNumber: month + 1,
          yearName: year.toString(),
          yearNumber: year,
          fullDate: dayDate.toDate(),
          dayName: arabicDaysMap[dayNameEn] || dayNameEn,
          dailyRevenue: 0,
          cumulativeRevenue: 0,
          collectionRate: 0,
          lastUpdated: new Date()
        });
      }
      
      console.log(`📅 تم توليد ${days.length} يوم للشهر الحالي`);
      return days;
      
    } catch (error) {
      console.error('❌ خطأ في توليد أيام الشهر:', error);
      throw error;
    }
  }
  
  // ✅ التأكد من تحديث أيام الشهر الحالي
  async ensureCurrentMonthDays(analytics) {
    try {
      const now = await TimezoneManager.getInstitutionNow();
      const currentMonth = now.month() + 1;
      const currentYear = now.year();
      
      // التحقق من وجود أيام للشهر الحالي
      const hasCurrentMonthDays = analytics.days.some(day => 
        day.monthNumber === currentMonth && day.yearNumber === currentYear
      );
      
      if (!hasCurrentMonthDays) {
        console.log('📅 إنشاء أيام الشهر الحالي...');
        const tz = await TimezoneManager.getInstitutionTimezone();
        const newDays = await this.generateCurrentMonthDays(tz);
        
        // استبدال الأيام القديمة بالأيام الجديدة
        analytics.days = newDays;
        await analytics.save();
        
        console.log('✅ تم تحديث أيام الشهر الحالي');
      }
      
    } catch (error) {
      console.error('❌ خطأ في التأكد من أيام الشهر:', error);
      throw error;
    }
  }
  
  // 💰 حساب الإيراد المحصل اليومي
  async calculateDailyRevenue() {
    try {
      console.log('💰 حساب الإيراد المحصل اليومي...');
      
      const now = await TimezoneManager.getInstitutionNow();
      const currentDay = now.date();
      const currentMonth = now.month() + 1;
      const currentYear = now.year();
      
      // جلب سجل التحليلات
      let analytics = await DashboardAnalytics.findOne();
      if (!analytics) {
        analytics = await this.initializeDashboard();
      }
      
      // جلب المدفوعات لليوم الحالي فقط
      const payments = await Payment.find({
        'months': {
          $elemMatch: {
            status: 'مدفوع',
            paidDay: currentDay,
            paidMonth: currentMonth,
            paidYear: currentYear
          }
        }
      });
      
      // حساب مجموع الإيرادات
      let dailyTotal = 0;
      payments.forEach(payment => {
        payment.months.forEach(monthData => {
          if (monthData.status === 'مدفوع' &&
              monthData.paidDay === currentDay &&
              monthData.paidMonth === currentMonth &&
              monthData.paidYear === currentYear) {
            dailyTotal += monthData.amount || 0;
          }
        });
      });
      
      // تحديث اليوم في السجل
      const updated = analytics.updateDay(currentDay, currentMonth, currentYear, {
        dailyRevenue: dailyTotal
      });
      
      if (updated) {
        analytics.metadata.lastDailyUpdate = new Date();
        await analytics.save();
        console.log(`✅ تم تحديث الإيراد اليومي: ${dailyTotal} جنيه`);
      }
      
      return dailyTotal;
      
    } catch (error) {
      console.error('❌ خطأ في حساب الإيراد اليومي:', error);
      throw error;
    }
  }
  
  // 📈 حساب الإيراد المحصل التراكمي
  async calculateCumulativeRevenue() {
    try {
      console.log('📈 حساب الإيراد المحصل التراكمي...');
      
      const now = await TimezoneManager.getInstitutionNow();
      const currentDay = now.date();
      const currentMonth = now.month() + 1;
      const currentYear = now.year();
      
      // جلب سجل التحليلات
      let analytics = await DashboardAnalytics.findOne();
      if (!analytics) {
        analytics = await this.initializeDashboard();
      }
      
      // جلب المدفوعات من أول يوم في الشهر حتى اليوم الحالي
      const payments = await Payment.find({
        'months': {
          $elemMatch: {
            status: 'مدفوع',
            paidMonth: currentMonth,
            paidYear: currentYear,
            paidDay: { $lte: currentDay }
          }
        }
      });
      
      // حساب مجموع الإيرادات التراكمية
      let cumulativeTotal = 0;
      payments.forEach(payment => {
        payment.months.forEach(monthData => {
          if (monthData.status === 'مدفوع' &&
              monthData.paidMonth === currentMonth &&
              monthData.paidYear === currentYear &&
              monthData.paidDay <= currentDay) {
            cumulativeTotal += monthData.amount || 0;
          }
        });
      });
      
      // تحديث اليوم في السجل
      const updated = analytics.updateDay(currentDay, currentMonth, currentYear, {
        cumulativeRevenue: cumulativeTotal
      });
      
      if (updated) {
        analytics.metadata.lastDailyUpdate = new Date();
        await analytics.save();
        console.log(`✅ تم تحديث الإيراد التراكمي: ${cumulativeTotal} جنيه`);
      }
      
      return cumulativeTotal;
      
    } catch (error) {
      console.error('❌ خطأ في حساب الإيراد التراكمي:', error);
      throw error;
    }
  }
  
  // 📊 حساب نسبة التحصيل
  async calculateCollectionRate() {
    try {
      console.log('📊 حساب نسبة التحصيل...');
      
      const now = await TimezoneManager.getInstitutionNow();
      const currentDay = now.date();
      const currentMonth = now.month() + 1;
      const currentYear = now.year();
      
      // جلب سجل التحليلات
      let analytics = await DashboardAnalytics.findOne();
      if (!analytics) {
        analytics = await this.initializeDashboard();
      }
      
  // جلب الإيراد التراكمي من اليوم الحالي
  const currentDayData = analytics.getCurrentDay(currentDay, currentMonth, currentYear);
  const cumulativeRevenue = currentDayData?.cumulativeRevenue || 0;

  // جلب الإيراد المستحق من metadata (لا نحتفظ بمصفوفة months)
  const expectedRevenue = analytics.metadata?.currentMonthExpected || 0;
      
      // حساب نسبة التحصيل
      let collectionRate = 0;
      if (expectedRevenue > 0) {
        collectionRate = (cumulativeRevenue / expectedRevenue) * 100;
      }
      
      // تحديث اليوم في السجل
      const updated = analytics.updateDay(currentDay, currentMonth, currentYear, { collectionRate: collectionRate });
      
      if (updated) {
        analytics.metadata.lastDailyUpdate = new Date();
        await analytics.save();
        console.log(`✅ تم تحديث نسبة التحصيل: ${collectionRate.toFixed(2)}%`);
      }
      
      return collectionRate;
      
    } catch (error) {
      console.error('❌ خطأ في حساب نسبة التحصيل:', error);
      throw error;
    }
  }
  
  // 💵 حساب الإيراد المستحق الشهري
  async calculateMonthlyExpectedRevenue() {
    try {
      console.log('💵 حساب الإيراد المستحق الشهري...');
      
      const now = await TimezoneManager.getInstitutionNow();
      const currentMonth = now.month() + 1;
      const currentYear = now.year();
      
      // جلب سجل التحليلات
      let analytics = await DashboardAnalytics.findOne();
      if (!analytics) {
        analytics = await this.initializeDashboard();
      }
      
      // جلب جميع المجموعات
      const groups = await Group.find();
      
      let totalExpected = 0;
      
      // حساب الإيراد المتوقع لكل مجموعة
      for (const group of groups) {
        // عد الطلاب المشتركين في هذه المجموعة
        const subscriptionsCount = await Subscription.countDocuments({
          groupId: group.groupId
        });
        
        const groupPrice = group.price || 0;
        const groupExpected = subscriptionsCount * groupPrice;
        
        totalExpected += groupExpected;
        
        console.log(`📋 مجموعة ${group.subject}: ${subscriptionsCount} طالب × ${groupPrice} = ${groupExpected} جنيه`);
      }
      
      // خزّن الملخّص في metadata بدلاً من مصفوفة months
      const updated = analytics.updateMonth(currentMonth, currentYear, { expectedRevenue: totalExpected });
      if (updated) {
        await analytics.save();
        console.log(`✅ تم تحديث الإيراد المستحق الشهري (metadata): ${totalExpected} جنيه`);
      }
      
      return totalExpected;
      
    } catch (error) {
      console.error('❌ خطأ في حساب الإيراد المستحق الشهري:', error);
      throw error;
    }
  }
  
  // 💰 حساب الإيراد المحصل الشهري (في آخر يوم فقط)
  async calculateMonthlyCollectedRevenue() {
    try {
      console.log('💰 حساب الإيراد المحصل الشهري...');
      
      const now = await TimezoneManager.getInstitutionNow();
      const currentDay = now.date();
      const currentMonth = now.month() + 1;
      const currentYear = now.year();
      
      // التحقق: هل اليوم هو آخر يوم في الشهر؟
      const daysInMonth = now.daysInMonth();
      
      if (currentDay !== daysInMonth) {
        console.log(`⏭️ ليس آخر يوم في الشهر (اليوم ${currentDay}/${daysInMonth})`);
        return null;
      }
      
      console.log(`✅ اليوم هو آخر يوم في الشهر (${currentDay}/${daysInMonth})`);
      
      // جلب سجل التحليلات
      let analytics = await DashboardAnalytics.findOne();
      if (!analytics) {
        analytics = await this.initializeDashboard();
      }

      // جلب الإيراد التراكمي من آخر يوم
      const lastDayData = analytics.getCurrentDay(currentDay, currentMonth, currentYear);
      const monthlyCollected = lastDayData?.cumulativeRevenue || 0;

      // حفظ النتيجة في metadata.currentMonthCollected
      const updated = analytics.updateMonth(currentMonth, currentYear, { collectedRevenue: monthlyCollected });

      if (updated) {
        await analytics.save();
        console.log(`✅ تم تحديث الإيراد المحصل الشهري (metadata): ${monthlyCollected} جنيه`);
      }
      
      return monthlyCollected;
      
    } catch (error) {
      console.error('❌ خطأ في حساب الإيراد المحصل الشهري:', error);
      throw error;
    }
  }
  
  // 🔄 تشغيل جميع الحسابات (Tracker الشامل)
  async runAllCalculations() {
    try {
      console.log('🔄 تشغيل جميع الحسابات...');
      
      // الحسابات اليومية (تعمل دائماً)
      await this.calculateDailyRevenue();
      await this.calculateCumulativeRevenue();
      await this.calculateMonthlyExpectedRevenue();
      await this.calculateCollectionRate();
      
      // الحسابات الشهرية (تعمل في آخر يوم فقط)
      await this.calculateMonthlyCollectedRevenue();
      
      console.log('✅ تم إكمال جميع الحسابات بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تشغيل الحسابات:', error);
      throw error;
    }
  }
  
  // 📊 الحصول على بيانات لوحة المؤشرات
  async getDashboardData(req, res) {
    try {
      console.log('📊 جلب بيانات لوحة المؤشرات...');
      
      // جلب أو إنشاء سجل التحليلات
      let analytics = await DashboardAnalytics.findOne();
      if (!analytics) {
        analytics = await this.initializeDashboard();
      }
      
      const now = await TimezoneManager.getInstitutionNow();
      const currentDay = now.date();
      const currentMonth = now.month() + 1;
      const currentYear = now.year();
      
      // جلب البيانات الحالية (نُرجع فقط الأيام وملخّص الشهر من metadata)
      const currentDayData = analytics.getCurrentDay(currentDay, currentMonth, currentYear);
      const currentMonthData = analytics.getCurrentMonth(currentMonth, currentYear);

      res.json({
        success: true,
        data: {
          current: {
            day: currentDayData,
            month: currentMonthData,
            year: { id: String(currentYear) }
          },
          all: {
            days: analytics.days
          },
          metadata: analytics.metadata
        }
      });
      
    } catch (error) {
      console.error('❌ خطأ في جلب بيانات لوحة المؤشرات:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // 📈 الحصول على بيانات المجموعات الأكثر ربحية لشهر/سنة محددين
  async getGroupsProfit(req, res) {
    try {
      const monthParam = parseInt(req.query.month, 10);
      const yearParam = parseInt(req.query.year, 10);

      const now = await TimezoneManager.getInstitutionNow();
      const month = Number.isInteger(monthParam) && monthParam > 0 ? monthParam : (now.month() + 1);
      const year = Number.isInteger(yearParam) && yearParam > 0 ? yearParam : now.year();

      // جلب كل المجموعات
      const groups = await Group.find();

      // جلب الاشتراكات المرتبطة بالمجموعات (id -> groupId)
      const groupIds = groups.map(g => g.groupId).filter(Boolean);
      const subscriptions = await Subscription.find({ groupId: { $in: groupIds } }, { subscriptionId: 1, groupId: 1 });
      const subscriptionToGroup = {};
      subscriptions.forEach(s => { subscriptionToGroup[s.subscriptionId] = s.groupId; });

      // عد الاشتراكات لكل مجموعة
      const subsCountAgg = await Subscription.aggregate([
        { $match: { groupId: { $in: groupIds } } },
        { $group: { _id: '$groupId', count: { $sum: 1 } } }
      ]);
      const subsCountMap = {};
      subsCountAgg.forEach(r => { subsCountMap[r._id] = r.count; });

      // جمع المدفوعات المخصّصة للشهر/السنة المطلوبة (تجميع حسب subscriptionId)
      const paymentsAgg = await Payment.aggregate([
        { $unwind: '$months' },
        { $match: {
          'months.status': 'مدفوع',
          'months.paidMonth': month,
          'months.paidYear': year
        } },
        { $group: { _id: '$subscriptionId', collected: { $sum: { $ifNull: ['$months.amount', 0] } } } }
      ]);

      const collectedBySubscription = {};
      paymentsAgg.forEach(p => { collectedBySubscription[p._id] = p.collected; });

      // جمع القيم لكل مجموعة
      const collectedByGroup = {};
      Object.entries(collectedBySubscription).forEach(([subscriptionId, collected]) => {
        const groupId = subscriptionToGroup[subscriptionId];
        if (!groupId) return;
        collectedByGroup[groupId] = (collectedByGroup[groupId] || 0) + (collected || 0);
      });

      // بناء النتيجة
      const result = groups.map(g => {
        const studentCount = subsCountMap[g.groupId] || 0;
        const price = Number(g.price || g.monthlyFee || 0) || 0;
        const expectedRevenue = studentCount * price;
        const collectedRevenue = Number(collectedByGroup[g.groupId] || 0) || 0;
        const collectionRate = expectedRevenue > 0 ? (collectedRevenue / expectedRevenue) * 100 : 0;

        return {
          groupId: g.groupId || g._id,
          subject: g.subject || '',
          teacher: g.teacher || '',
          studentCount,
          expectedRevenue,
          collectedRevenue,
          collectionRate
        };
      });

      // ترتيب حسب الإيراد المحصل نزولاً ثم نسبة التحصيل
      result.sort((a, b) => {
        if (b.collectedRevenue !== a.collectedRevenue) return b.collectedRevenue - a.collectedRevenue;
        return b.collectionRate - a.collectionRate;
      });

      res.json({ success: true, month, year, groups: result });
    } catch (error) {
      console.error('❌ Error in getGroupsProfit:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
}

module.exports = new DashboardModule();
