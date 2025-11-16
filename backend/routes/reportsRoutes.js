const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

// ═══════════════════════════════════════════════════════
// 📊 مسارات نظام التقارير المالية
// ═══════════════════════════════════════════════════════

// الحصول على ملخص التقارير المتاحة
router.get('/summary', reportsController.getReportsSummary);

// تقرير شهري محدد
router.get('/month', reportsController.getMonthReport);

// تقرير سنوي كامل
router.get('/year', reportsController.getYearReport);

// تقرير مقارن بين فترتين
router.get('/comparison', reportsController.getComparisonReport);

// الحصول على فاتورة محددة
router.get('/invoice', reportsController.getInvoice);

// طباعة تقرير
router.get('/print', reportsController.printReport);

// تصدير تقرير
router.get('/export', reportsController.exportReport);

module.exports = router;
