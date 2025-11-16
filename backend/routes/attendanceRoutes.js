const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// إضافة سجل حضور جديد
router.post('/', attendanceController.addAttendance);
// عرض جميع سجلات الحضور
router.get('/', attendanceController.getAttendances);
// تعديل حالة حضور ليوم معين
router.put('/status', attendanceController.updateAttendanceStatus);

// إضافة شهر جديد لسجل الحضور
router.post('/add-month', attendanceController.addMonthToAttendance);
// حذف سجل حضور
router.delete('/:attendanceId', attendanceController.deleteAttendance);
// اختبار إضافة شهر جديد وطباعة مصفوفة الأشهر
router.post('/test-add-month', attendanceController.testAddMonthToAttendance);
// 🚨 دالة الطوارئ: تحديث الأيام المستقبلية للشهر الحالي
router.post('/emergency-update', attendanceController.emergencyUpdateCurrentMonth);

module.exports = router;
