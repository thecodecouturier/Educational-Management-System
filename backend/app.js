// Express backend for user management

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const cron = require('node-cron');
const paymentController = require('./controllers/paymentController');
const TimezoneManager = require('./utils/timezoneManager');

// 🔍 First Visit Auto-Detection Middleware
const { firstVisitAutoDetection, logVisitInfo } = require('./middleware/firstVisitDetection');

// تحميل متغيرات البيئة
require('dotenv').config();

// عرض معلومات المناطق الزمنية عند بدء التشغيل (async)
TimezoneManager.logTimezoneInfo().catch(error => {
  console.error('خطأ في عرض معلومات التوقيت:', error);
  console.log('📝 سيتم المتابعة بالإعدادات الافتراضية');
});

// 🌍 نظام جدولة ذكي مع كشف تلقائي للمنطقة الزمنية
cron.schedule('0 6 * * *', async () => {
  try {
    // الحصول على المنطقة الزمنية المكتشفة تلقائياً
    const institutionTimezone = await TimezoneManager.getInstitutionTimezone();
    
    console.log('🕕 تشغيل الجدولة اليومية لتحديث المدفوعات');
    console.log(`📍 المنطقة الزمنية المكتشفة: ${institutionTimezone}`);
    console.log(`🖥️ توقيت السيرفر: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    
    await paymentController.updateAllPaymentsMonths({},{json:()=>{}});
    console.log('✅ تم تحديث الأشهر في جميع المدفوعات تلقائيًا');
  } catch (err) {
    console.error('❌ خطأ في التحديث التلقائي للأشهر:', err);
  }
}, {
  timezone: 'UTC' // استخدام UTC ثم تحويل حسب المنطقة المكتشفة
});

// 📊 نظام جدولة التحليلات المالية الساعي (Dashboard Module)
const dashboardModule = require('./controllers/financialAnalytics/dashboardModule');

// تشغيل الحسابات كل ساعة
cron.schedule('0 * * * *', async () => {
  try {
    const institutionTimezone = await TimezoneManager.getInstitutionTimezone();
    
    console.log('📊 تشغيل الحسابات الساعية للتحليلات المالية');
    console.log(`📍 المنطقة الزمنية: ${institutionTimezone}`);
    
    await dashboardModule.runAllCalculations();
    console.log('✅ تم تشغيل جميع حسابات التحليلات المالية بنجاح');
  } catch (err) {
    console.error('❌ خطأ في تشغيل حسابات التحليلات المالية:', err);
  }
}, {
  timezone: 'UTC'
});

// ========================================
// 🧹 جدولة تفريغ الفواتير المتغيرة شهرياً
// سيتم تشغيلها عند منتصف الليل (00:00) في أول يوم من كل شهر
// باستخدام المنطقة الزمنية المكتشفة من TimezoneManager
// ========================================
(async () => {
  try {
    const institutionTimezone = await TimezoneManager.getInstitutionTimezone();
    // Schedule at 00:00 on the 1st of every month
    cron.schedule('0 0 1 * *', async () => {
      try {
        console.log('🧹 تشغيل مهمة التفريغ الشهري للفواتير المتغيرة...');
        console.log(`📍 المنطقة الزمنية المستخدمة: ${institutionTimezone}`);

        const Budget = require('./models/Budget');
        let budget = await Budget.findOne();
        if (!budget) budget = new Budget();

        // استخدم دالة الموديل الموحدة لمسح الفواتير المتغيرة
        if (typeof budget.clearVariableBills === 'function') {
          await budget.clearVariableBills();
        } else {
          // fallback محافظ - نفس السلوك إن لم توجد الدالة
          budget.variableBills = [];
          await budget.save();
        }
        console.log('✅ تم تفريغ variableBills لبداية الشهر الجديد');
      } catch (err) {
        console.error('❌ فشل تنفيذ مهمة التفريغ الشهري:', err);
      }
    }, {
      timezone: institutionTimezone || 'UTC'
    });

    console.log(`🗓️ مجدول: تفريغ الفواتير المتغيرة كل شهر عند 00:00 (${institutionTimezone || 'UTC'})`);
  } catch (err) {
    console.error('❌ تعذر الحصول على المنطقة الزمنية للمؤسسة، سيتم استخدام UTC للمهمة الشهرية:', err);
    // Fallback: schedule using UTC if timezone detection failed
    cron.schedule('0 0 1 * *', async () => {
      try {
        console.log('🧹 تشغيل (fallback) مهمة التفريغ الشهري للفواتير المتغيرة (UTC)...');
        const Budget = require('./models/Budget');
        let budget = await Budget.findOne();
        if (!budget) budget = new Budget();
        if (typeof budget.clearVariableBills === 'function') {
          await budget.clearVariableBills();
        } else {
          budget.variableBills = [];
          await budget.save();
        }
        console.log('✅ تم تفريغ variableBills (fallback UTC)');
      } catch (err2) {
        console.error('❌ فشل تنفيذ مهمة التفريغ الشهري (fallback):', err2);
      }
    }, { timezone: 'UTC' });
  }
})();

// تحديث الأشهر مرة واحدة عند بدء تشغيل السيرفر
(async () => {
  try {
    await paymentController.updateAllPaymentsMonths({},{json:()=>{}});
    console.log('تم تحديث الأشهر في جميع المدفوعات عند بدء تشغيل السيرفر');
  } catch (err) {
    console.error('خطأ في تحديث الأشهر عند بدء التشغيل:', err);
  }
})();

// 📊 تهيئة نظام التحليلات المالية عند بدء التشغيل
(async () => {
  try {
    await dashboardModule.initializeDashboard();
    console.log('✅ تم تهيئة نظام التحليلات المالية بنجاح');
    
    // تشغيل الحسابات الأولية
    await dashboardModule.runAllCalculations();
    console.log('✅ تم تشغيل الحسابات الأولية للتحليلات المالية');
  } catch (err) {
    console.error('❌ خطأ في تهيئة نظام التحليلات المالية:', err);
  }
})();

// إعدادات CORS محسنة للتطوير
app.use(cors({
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// 🔍 تطبيق middleware للكشف التلقائي عند أول زيارة
app.use('/', firstVisitAutoDetection);
app.use('/', logVisitInfo);

// اتصال بقاعدة بيانات MongoDB
// اتصال بقاعدة بيانات MongoDB باستخدام متغير البيئة
const DB_CONNECTION = process.env.DB_CONNECTION || 'mongodb://localhost:27017/school';
mongoose.connect(DB_CONNECTION);

// تقديم ملفات الفرونت اند
app.use(express.static(path.join(__dirname, '../frontend')));

// ربط روتس المستخدمين
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// ربط روتس المواد
const subjectRoutes = require('./routes/subjectRoutes');
app.use('/api/subjects', subjectRoutes);

// ربط روتس المدرسين
const teacherRoutes = require('./routes/teacherRoutes');
app.use('/api/teachers', teacherRoutes);

// ربط روتس المجموعات
const groupRoutes = require('./routes/groupRoutes');
app.use('/api/groups', groupRoutes);

// ربط روتس الطلاب
const studentRoutes = require('./routes/studentRoutes');
app.use('/api/students', studentRoutes);

// ربط روتس الاشتراكات
const subscriptionRoutes = require('./routes/subscriptionRoutes');
app.use('/api/subscriptions', subscriptionRoutes);

// ربط روتس المدفوعات
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

// ربط روتس الحضور
const attendanceRoutes = require('./routes/attendanceRoutes');
app.use('/api/attendance', attendanceRoutes);

// ربط روتس إعدادات النظام
const systemSettingsRoutes = require('./routes/systemSettingsRoutes');
app.use('/api/system-settings', systemSettingsRoutes);

// ربط روتس المصادقة (Authentication)
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// ربط روتس الداشبورد والتقارير
const dashboardRoutes = require('./routes/dashboardRoutes');
// middleware للتشخيص
app.use('/api/dashboard', (req, res, next) => {
  console.log(`📊 Dashboard API Request: ${req.method} ${req.path}`);
  next();
});
app.use('/api/dashboard', dashboardRoutes);

// ربط روتس التحليلات المالية الموديولية
const financialAnalyticsRoutes = require('./routes/financialAnalyticsRoutes');
app.use('/api/financial-analytics', financialAnalyticsRoutes);
// Archive routes (summary/months)
const archiveRoutes = require('./routes/archiveRoutes');
app.use('/api/archive', archiveRoutes);
const archiveController = require('./controllers/archiveController');
// Financial transactions routes
const financialTransactionsRoutes = require('./routes/financialTransactionsRoutes');
app.use('/api/financial-transactions', financialTransactionsRoutes);
const financialTransactionsController = require('./controllers/financialTransactionsController');
// Reports routes
const reportsRoutes = require('./routes/reportsRoutes');
app.use('/api/reports', reportsRoutes);

// 🎨 مولد الخلفيات الديناميكية
const PatternGenerator = require('./utils/patternGenerator');
const patternGenerator = new PatternGenerator();

// Route لتوليد خلفية SVG عشوائية
app.get('/pattern', (req, res) => {
  try {
    console.log('🎨 طلب خلفية جديدة...');
    const svgPattern = patternGenerator.generatePattern();
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(svgPattern);
    
    console.log('✅ تم إرسال خلفية جديدة');
  } catch (error) {
    console.error('❌ خطأ في توليد الخلفية:', error);
    res.status(500).send('خطأ في توليد الخلفية');
  }
});

// Route لإعادة تحميل الأيقونات
app.post('/pattern/reload', (req, res) => {
  try {
    patternGenerator.reloadIcons();
    res.json({ success: true, message: 'تم إعادة تحميل الأيقونات' });
  } catch (error) {
    console.error('❌ خطأ في إعادة تحميل الأيقونات:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route لعرض إحصائيات المولد
app.get('/pattern/stats', (req, res) => {
  try {
    const stats = patternGenerator.getStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ خطأ في جلب الإحصائيات:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ========================================
// 🗄️ Archive scheduling: build months archive (1st of month) and yearly summaries (Dec 31 22:00)
// Uses institution timezone when available, falls back to UTC
// ========================================
(async () => {
  try {
    const institutionTimezone = await TimezoneManager.getInstitutionTimezone();

    // Build months archive at 00:00 on the 1st of every month
    cron.schedule('0 0 1 * *', async () => {
      try {
        console.log('[Archive] running monthly buildMonthsArchiveJob');
        await archiveController.buildMonthsArchiveJob();
      } catch (err) {
        console.error('[Archive] buildMonthsArchiveJob failed', err);
      }
    }, { timezone: institutionTimezone || 'UTC' });

    // Schedule computeProfits on 28th of every month at 22:00
    cron.schedule('0 22 28 * *', async () => {
      try {
        console.log('[FinancialTransactions] running scheduled computeProfits (28th 22:00)');
        const now = await TimezoneManager.getInstitutionNow();
        const m = now.getMonth() + 1; // 1-12
        const y = now.getFullYear();
        await financialTransactionsController.computeProfits(m, y);
        console.log('[FinancialTransactions] computeProfits scheduled run completed');
      } catch (err) {
        console.error('[FinancialTransactions] scheduled computeProfits failed', err);
      }
    }, { timezone: institutionTimezone || 'UTC' });

    // Schedule budget.scheduledBuild on 28th of every month at 22:00
    cron.schedule('0 22 28 * *', async () => {
      try {
        console.log('[Budget] running scheduledBuild (28th 22:00)');
        const Budget = require('./models/Budget');
        if (typeof Budget.scheduledBuild === 'function') {
          const res = await Budget.scheduledBuild();
          console.log('[Budget] scheduledBuild completed:', res && res.buildResult ? res.buildResult : res);
        } else {
          console.log('[Budget] scheduledBuild not defined on Budget model');
        }
      } catch (err) {
        console.error('[Budget] scheduledBuild failed', err);
      }
    }, { timezone: institutionTimezone || 'UTC' });

    // Note: extractor is intentionally NOT scheduled separately.
    // computeProfits will auto-run extractToArchive internally after computing,
    // so we avoid a separate extractor job and the risk of race conditions.

    // Build year summary at Dec 31 22:00
    cron.schedule('0 22 31 12 *', async () => {
      try {
        console.log('[Archive] running yearly buildYearSummaryJob');
        await archiveController.buildYearSummaryJob();
      } catch (err) {
        console.error('[Archive] buildYearSummaryJob failed', err);
      }
    }, { timezone: institutionTimezone || 'UTC' });

    console.log(`[Archive] Scheduled monthly and yearly archive jobs (tz=${institutionTimezone || 'UTC'})`);
  } catch (err) {
    console.error('[Archive] failed to schedule archive jobs, fallback to UTC scheduling', err);
    // Fallback schedules using UTC
    cron.schedule('0 0 1 * *', async () => {
      try { await archiveController.buildMonthsArchiveJob(); } catch (e) { console.error(e); }
    }, { timezone: 'UTC' });
    cron.schedule('0 22 31 12 *', async () => {
      try { await archiveController.buildYearSummaryJob(); } catch (e) { console.error(e); }
    }, { timezone: 'UTC' });
    // Fallback schedule for Budget.scheduledBuild (UTC)
    cron.schedule('0 22 28 * *', async () => {
      try {
        console.log('[Budget] running scheduledBuild (fallback UTC 28th 22:00)');
        const Budget = require('./models/Budget');
        if (typeof Budget.scheduledBuild === 'function') {
          const res = await Budget.scheduledBuild();
          console.log('[Budget] scheduledBuild (fallback) completed:', res && res.buildResult ? res.buildResult : res);
        } else {
          console.log('[Budget] scheduledBuild not defined on Budget model (fallback)');
        }
      } catch (err) {
        console.error('[Budget] scheduledBuild (fallback) failed', err);
      }
    }, { timezone: 'UTC' });
  }
})();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`App running on http://localhost:${PORT}`);
});
