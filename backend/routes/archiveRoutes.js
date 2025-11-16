const express = require('express');
const router = express.Router();
const archiveCtrl = require('../controllers/archiveController');

// Public endpoints for testing (should be protected in production)
router.post('/build-months', archiveCtrl.buildMonthsArchiveJob);
router.post('/build-year', archiveCtrl.buildYearSummaryJob);
// Accept report sync calls from frontend: sync Budget.financialBook and update archive.currentMonth.expenses
router.post('/update-from-report', archiveCtrl.updateCurrentMonthFromReport);
router.get('/', archiveCtrl.getArchive);

module.exports = router;
