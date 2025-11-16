const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// إضافة طالب جديد
router.post('/', studentController.addStudent);
// عرض جميع الطلاب
router.get('/', studentController.getStudents);
// تحديث بيانات طالب
router.put('/:id', studentController.updateStudent);
// حذف طالب
router.delete('/:id', studentController.deleteStudent);

module.exports = router;
