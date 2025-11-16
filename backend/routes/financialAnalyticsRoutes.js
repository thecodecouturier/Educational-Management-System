const express = require('express');
const router = express.Router();

// استيراد الموديولات
const dashboardModule = require('../controllers/financialAnalytics/dashboardModule');
const budgetController = require('../controllers/budgetController');

// ========================================
// 📊 مسارات لوحة المؤشرات (Dashboard)
// ========================================

// GET /api/financial-analytics/dashboard - جلب بيانات لوحة المؤشرات
router.get('/dashboard', (req, res) => dashboardModule.getDashboardData(req, res));

// POST /api/financial-analytics/dashboard/initialize - تهيئة النظام
router.post('/dashboard/initialize', async (req, res) => {
  try {
    const analytics = await dashboardModule.initializeDashboard();
    res.json({
      success: true,
      message: 'تم تهيئة النظام بنجاح',
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/financial-analytics/dashboard/calculate - تشغيل جميع الحسابات
router.post('/dashboard/calculate', async (req, res) => {
  try {
    await dashboardModule.runAllCalculations();
    res.json({
      success: true,
      message: 'تم تشغيل جميع الحسابات بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/financial-analytics/dashboard/daily-revenue - حساب الإيراد اليومي
router.get('/dashboard/daily-revenue', async (req, res) => {
  try {
    const revenue = await dashboardModule.calculateDailyRevenue();
    res.json({
      success: true,
      dailyRevenue: revenue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/financial-analytics/dashboard/cumulative-revenue - حساب الإيراد التراكمي
router.get('/dashboard/cumulative-revenue', async (req, res) => {
  try {
    const revenue = await dashboardModule.calculateCumulativeRevenue();
    res.json({
      success: true,
      cumulativeRevenue: revenue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/financial-analytics/dashboard/collection-rate - حساب نسبة التحصيل
router.get('/dashboard/collection-rate', async (req, res) => {
  try {
    const rate = await dashboardModule.calculateCollectionRate();
    res.json({
      success: true,
      collectionRate: rate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/financial-analytics/dashboard/top-groups - جلب بيانات المجموعات الأكثر ربحية
router.get('/dashboard/top-groups', async (req, res) => {
  return dashboardModule.getGroupsProfit(req, res);
});

// GET /api/financial-analytics/dashboard/monthly-expected - حساب الإيراد المستحق الشهري
router.get('/dashboard/monthly-expected', async (req, res) => {
  try {
    const revenue = await dashboardModule.calculateMonthlyExpectedRevenue();
    res.json({
      success: true,
      monthlyExpectedRevenue: revenue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/financial-analytics/dashboard/monthly-collected - حساب الإيراد المحصل الشهري
router.get('/dashboard/monthly-collected', async (req, res) => {
  try {
    const revenue = await dashboardModule.calculateMonthlyCollectedRevenue();
    res.json({
      success: true,
      monthlyCollectedRevenue: revenue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// 📋 مسارات التقارير المالية (Reports)
// ========================================
// TODO: سيتم إضافتها لاحقاً

// ========================================
// 🎯 مسارات إدارة الميزانية (Budget)
// ========================================
// POST /api/financial-analytics/budget/receive - استقبال فاتورة واحدة من الفرونت
router.post('/budget/receive', async (req, res) => budgetController.receiveBill(req, res));

// POST /api/financial-analytics/budget/build-book - بناء أو تجديد دفتر المالي
router.post('/budget/build-book', async (req, res) => budgetController.buildBook(req, res));

// NOTE: POST /budget/clear-variable removed - monthly clearing handled by server scheduler

// GET /api/financial-analytics/budget - استرجاع وثيقة الميزانية الحالية
router.get('/budget', async (req, res) => budgetController.getBudget(req, res));

// GET /api/financial-analytics/expenses/variable - استرجاع الفواتير المتغيرة (واجهة مشابهة للفواتير الثابتة)
router.get('/expenses/variable', async (req, res) => budgetController.getVariableExpenses(req, res));

// PUT /api/financial-analytics/budget/bill/:id - تحديث فاتورة
router.put('/budget/bill/:id', async (req, res) => budgetController.updateBill(req, res));

// DELETE /api/financial-analytics/budget/bill/:id - حذف فاتورة
router.delete('/budget/bill/:id', async (req, res) => budgetController.deleteBill(req, res));

// ========================================
// 💳 مسارات المعاملات المالية (Transactions)
// ========================================
// TODO: سيتم إضافتها لاحقاً

module.exports = router;
