const Archive = require('../models/Archive');
const Budget = require('../models/Budget');
const mongoose = require('mongoose');
const timezoneManager = require('../utils/timezoneManager');

// Helper: ensure archive doc exists (singleton)
async function getArchiveDoc() {
  let doc = await Archive.findOne();
  if (!doc) {
    doc = new Archive();
    await doc.save();
  }
  return doc;
}

// Helper: keep only last N years (by yearName lexicographic which is numeric string)
function trimYears(yearsArr, keep = 4) {
  if (!Array.isArray(yearsArr)) return [];
  // sort descending by yearName
  const sorted = yearsArr.slice().sort((a, b) => Number(b.yearName) - Number(a.yearName));
  return sorted.slice(0, keep);
}

// Compute top teachers across months for a given yearName
function computeTopTeachersForYear(months, topN = 5) {
  const map = new Map();
  months.forEach(month => {
    (month.teachers || []).forEach(t => {
      const key = t.teacherId || `${t.teacherName}`;
      const existing = map.get(key) || { teacherId: t.teacherId, teacherName: t.teacherName, subscriptionType: t.subscriptionType, totalRevenue: 0, totalTeacherShare: 0, totalCenterShare: 0 };
      existing.totalRevenue += Number(t.revenue || 0);
      existing.totalTeacherShare += Number(t.teacherShare || 0);
      existing.totalCenterShare += Number(t.centerShare || 0);
      map.set(key, existing);
    });
  });
  const arr = Array.from(map.values());
  arr.sort((a, b) => b.totalRevenue - a.totalRevenue);
  return arr.slice(0, topN);
}

// Build months archive: runs at 00:00 on the 1st of each month
async function buildMonthsArchiveJob(req, res) {
  // allow manual trigger via HTTP for testing; when triggered by scheduler, req/res may be undefined
  try {
    const archive = await getArchiveDoc();

    // ensure monthsArchive keeps only last 4 years
    archive.monthsArchive = trimYears(archive.monthsArchive || [], 4);

    // create new year entry if not exists for current year
  const now = await timezoneManager.getInstitutionNow();
  // now is a dayjs instance provided by timezoneManager
  const yearName = String(now.year());
    let yearEntry = archive.monthsArchive.find(y => y.yearName === yearName);
    if (!yearEntry) {
      yearEntry = { yearName, months: [] };
      archive.monthsArchive.unshift(yearEntry);
    }

    // take currentMonth snapshot and push into yearEntry.months
    if (archive.currentMonth) {
      // ensure the snapshot has correct month/year names for the month that just finished
      try {
        const prev = now.subtract(1, 'month');
        const prevMonthName = String(prev.format('MMMM')).toLowerCase();
        const prevYearName = String(prev.year());

        // BEFORE we push the snapshot, try to sync Budget.financialBook from DB
        try {
          // Budget.buildFinancialBook now reads recurringBills and variableBills directly from DB
          await Budget.buildFinancialBook();
          console.log('[Archive] syncBudget -> invoked Budget.buildFinancialBook() (DB-driven)');
        } catch (syncErr) {
          console.warn('[Archive] warning: failed to sync Budget.financialBook before snapshot:', syncErr);
        }

        // compute total expenses for the month from Budget.financialBook (if available) and fallback to archive.currentMonth
        let totalExpenses = 0;
        try {
          // reload budget and look for the invoice totals of the previous month
          const freshBudget = await Budget.findOne();
          if (freshBudget && Array.isArray(freshBudget.financialBook)) {
            const yr = String(prev.year());
            const monthName = prev.format('MMMM');
            const yearObj = freshBudget.financialBook.find(y => String(y.year) === yr || String(y.year) === String(y.year));
            if (yearObj && Array.isArray(yearObj.months)) {
              const monthObj = yearObj.months.find(m => m.name === monthName && String(m.year) === yr);
              if (monthObj && Array.isArray(monthObj.invoices)) {
                totalExpenses = monthObj.invoices.reduce((s, inv) => s + (Number(inv.price || inv.amount || 0) * (Number(inv.quantity || 1) || 1)), 0);
              }
            }
          }
        } catch (calcErr) {
          console.warn('[Archive] warning: failed to compute totalExpenses from budget.financialBook:', calcErr);
        }

        // fallback: if nothing found, try to aggregate from archive.currentMonth data
        if (!totalExpenses || totalExpenses === 0) {
          try {
            totalExpenses = Number(archive.currentMonth.expenses || 0) || 0;
            // if archive.currentMonth has detailed invoices/entries, sum them
            if (archive.currentMonth.invoices && Array.isArray(archive.currentMonth.invoices)) {
              totalExpenses = archive.currentMonth.invoices.reduce((s, inv) => s + (Number(inv.price || inv.amount || 0) * (Number(inv.quantity || 1) || 1)), 0);
            }
          } catch (e) {
            // ignore
          }
        }

        // prepare snapshot and set computed expenses
        const snapshot = Object.assign({}, archive.currentMonth, { monthName: archive.currentMonth.monthName || prevMonthName, yearName: archive.currentMonth.yearName || prevYearName });
        snapshot.expenses = totalExpenses;

        yearEntry.months.push(snapshot);
      } catch (e) {
        // fallback: push as-is
        yearEntry.months.push(archive.currentMonth);
      }
    }

    // trim months array to 12 (keep last 12 months if needed)
    if (yearEntry.months.length > 12) {
      yearEntry.months = yearEntry.months.slice(-12);
    }

    // reset currentMonth to an empty month template for the new month (use current month name/year)
    try {
      const currentMonthName = String(now.format('MMMM')).toLowerCase();
      archive.currentMonth = { monthName: currentMonthName, yearName: yearName, revenue: 0, expenses: 0, netProfit: 0, teachers: [] };
    } catch (e) {
      archive.currentMonth = { monthName: '', yearName: yearName, revenue: 0, expenses: 0, netProfit: 0, teachers: [] };
    }

    await archive.save();

    if (res) return res.json({ ok: true, message: 'months archive built' });
    return { ok: true };
  } catch (err) {
    if (res) return res.status(500).json({ ok: false, message: err.message });
    throw err;
  }
}

// Build year summary: runs at 22:00 on last day of year
async function buildYearSummaryJob(req, res) {
  try {
    const archive = await getArchiveDoc();
    archive.years = trimYears(archive.years || [], 4);

  const now = await timezoneManager.getInstitutionNow();
  const currentYearName = String(now.year());

    // create summary for current year
    const monthsForYear = [];
    (archive.monthsArchive || []).forEach(y => {
      if (y.yearName === currentYearName) {
        monthsForYear.push(...(y.months || []));
      }
    });

    // compute aggregates
    const revenue = monthsForYear.reduce((s, m) => s + Number(m.revenue || 0), 0);
    const expenses = monthsForYear.reduce((s, m) => s + Number(m.expenses || 0), 0);
    const netProfit = monthsForYear.reduce((s, m) => s + Number(m.netProfit || 0), 0);
    const topTeachers = computeTopTeachersForYear(monthsForYear, 5);

    const yearSummary = { yearName: currentYearName, revenue, expenses, netProfit, topTeachers };

    // add to archive.years at beginning
    archive.years.unshift(yearSummary);
    archive.years = trimYears(archive.years, 4);

    await archive.save();

    if (res) return res.json({ ok: true, message: 'year summary built' });
    return { ok: true };
  } catch (err) {
    if (res) return res.status(500).json({ ok: false, message: err.message });
    throw err;
  }
}

// Utility: return archive doc (read-only)
async function getArchive(req, res) {
  const archive = await getArchiveDoc();
  return res.json({ ok: true, archive });
}

module.exports = {
  buildMonthsArchiveJob,
  buildYearSummaryJob,
  getArchive
};
// export the new endpoint as well
module.exports.updateCurrentMonthFromReport = updateCurrentMonthFromReport;

// Update currentMonth expenses from a front-end generated report
async function updateCurrentMonthFromReport(req, res) {
  try {
    const { month, totalExpenses, date } = req.body || {};
    const targetDate = date || (month ? `${month}-01` : null);

    // 1) Call Budget.buildFinancialBook to sync budget data into financialBook (DB-driven)
    try {
      await Budget.buildFinancialBook();
    } catch (syncErr) {
      console.warn('[Archive] updateFromReport: failed to sync Budget.financialBook', syncErr);
    }

    // 2) Update Archive.currentMonth.expenses with provided totalExpenses
    const archive = await getArchiveDoc();
    if (!archive.currentMonth) {
      // create basic currentMonth if missing
      const dayjs = require('dayjs');
      const now = targetDate ? dayjs(targetDate) : await timezoneManager.getInstitutionNow();
      const monthName = String(now.format ? now.format('MMMM') : new Date().toLocaleString('en-US', { month: 'long' }));
      const yearName = String(now.year ? now.year() : new Date().getFullYear());
      archive.currentMonth = { monthName: monthName.toLowerCase(), yearName, revenue: 0, expenses: Number(totalExpenses || 0), netProfit: 0, teachers: [] };
    } else {
      archive.currentMonth.expenses = Number(totalExpenses || 0);
    }

    await archive.save();

    return res.json({ ok: true, message: 'updated archive currentMonth expenses', totalExpenses: archive.currentMonth.expenses });
  } catch (err) {
    console.error('[Archive] updateCurrentMonthFromReport failed', err);
    return res.status(500).json({ ok: false, message: err.message });
  }
}
