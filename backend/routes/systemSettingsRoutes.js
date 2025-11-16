// systemSettingsRoutes.js
// مسارات إدارة إعدادات النظام

const express = require('express');
const router = express.Router();
const systemSettingsController = require('../controllers/systemSettingsController');

// الحصول على إعدادات النظام
router.get('/', systemSettingsController.getSystemSettings);

// تحديث إعدادات النظام
router.put('/', systemSettingsController.updateSystemSettings);

// كشف تلقائي للمنطقة الزمنية
router.post('/auto-detect-timezone', systemSettingsController.autoDetectTimezone);

// مسارات العملة
router.get('/currency', systemSettingsController.getCurrentCurrency);
router.put('/currency', systemSettingsController.updateCurrency);
router.post('/currency/auto-update', systemSettingsController.updateCurrencyFromTimezone);
router.get('/currencies', systemSettingsController.getSupportedCurrencies);

module.exports = router;
