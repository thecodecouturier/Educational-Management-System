const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

// إضافة اشتراك جديد
router.post('/', subscriptionController.addSubscription);
// عرض جميع الاشتراكات
router.get('/', subscriptionController.getSubscriptions);
// تحديث اشتراك
router.put('/:id', subscriptionController.updateSubscription);
// حذف اشتراك
router.delete('/:id', subscriptionController.deleteSubscription);

module.exports = router;
