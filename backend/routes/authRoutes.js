const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /auth/login - تسجيل الدخول
router.post('/login', authController.login);

// POST /auth/logout - تسجيل الخروج  
router.post('/logout', authController.logout);

// GET /auth/verify - التحقق من الجلسة
router.get('/verify', authController.verifySession);

// POST /auth/user - الحصول على المستخدم الحالي
router.post('/user', authController.getCurrentUser);

module.exports = router;
