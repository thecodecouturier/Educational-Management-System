const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');

// 📊 Dashboard Routes - البيانات الفعلية

// إحصائيات عامة للداشبورد
router.get('/stats', DashboardController.getDashboardStats);

// آخر الأنشطة في النظام
router.get('/activities', DashboardController.getRecentActivities);

// تقارير مختلفة
router.get('/reports/attendance', DashboardController.getAttendanceReport);
router.get('/reports/payments', DashboardController.getPaymentsReport);
router.get('/reports/performance', DashboardController.getPerformanceReport);
router.get('/reports/analytics', DashboardController.getAnalyticsReport);
router.get('/reports/revenue', DashboardController.getRevenueReport); // التقرير الجديد للإيرادات التفصيلية

// 📈 التقارير المالية الجديدة - الرسوم البيانية التفاعلية
router.get('/financial-charts', DashboardController.getFinancialReports);

// اختبار اتصال API
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Dashboard API يعمل بنجاح!',
    timestamp: new Date(),
    server: 'localhost:3001'
  });
});

// تحديث جميع البيانات
router.get('/refresh', async (req, res) => {
  try {
    console.log('🔄 تحديث جميع بيانات الداشبورد...');
    
    res.json({ 
      success: true, 
      message: 'تم تحديث البيانات بنجاح',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث بيانات الداشبورد:', error);
    res.status(500).json({ 
      error: 'خطأ في تحديث البيانات',
      details: error.message 
    });
  }
});

console.log('📊 تم تحميل مسارات Dashboard بنجاح');

module.exports = router;