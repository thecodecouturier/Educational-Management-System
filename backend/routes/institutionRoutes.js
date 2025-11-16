// ===============================
// 🏢 Institution Routes - Multi-Tenant
// ===============================
const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');

// 🏢 إنشاء مؤسسة جديدة
router.post('/', institutionController.createInstitution);

// 📋 الحصول على جميع المؤسسات
router.get('/', institutionController.getAllInstitutions);

// 📊 إحصائيات المؤسسات
router.get('/stats', institutionController.getInstitutionsStats);

// 🔍 الحصول على مؤسسة واحدة
router.get('/:slug', institutionController.getInstitution);

// ✏️ تحديث مؤسسة
router.put('/:slug', institutionController.updateInstitution);

// 🔍 كشف تلقائي للمنطقة الزمنية
router.post('/:slug/auto-detect-timezone', institutionController.autoDetectTimezone);

module.exports = router;
