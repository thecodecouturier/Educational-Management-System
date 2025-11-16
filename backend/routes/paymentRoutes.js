const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// إضافة مدفوعات جديدة
router.post('/', paymentController.addPayment);
// عرض جميع المدفوعات
router.get('/', paymentController.getPayments);
// تحديث الأشهر لكل المدفوعات
router.put('/updateMonths', paymentController.updateAllPaymentsMonths);
// تعديل حالة الدفع لشهر معين
router.put('/status', paymentController.updatePaymentStatus);
// إنشاء تقرير الدفعات
router.get('/report', paymentController.getPaymentReport);
// حذف مدفوعات
router.delete('/:paymentId', paymentController.deletePayment);

module.exports = router;
