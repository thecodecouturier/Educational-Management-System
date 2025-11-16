const express = require('express');
const router = express.Router();
const controller = require('../controllers/financialTransactionsController');

// Manual trigger to compute profits for a month/year
router.post('/compute', controller.computeProfitsHandler);

// Manual trigger to extract computed distributions into Archive
router.post('/extract', controller.extractToArchiveHandler);

// Get current financial transactions document
router.get('/', controller.getFinancialTransactions);

// Accept teacher subscription form data
router.post('/teacher-subscription', controller.addTeacherSubscriptionHandler);
// one-time migration endpoint (protected should be added in prod)
router.post('/migrate-teacher-ids', controller.migrateTeacherIdsHandler);

module.exports = router;
