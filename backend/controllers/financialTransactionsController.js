const FinancialTransactions = require('../models/FinancialTransactions');
const Teacher = require('../models/Teacher');
const Payment = require('../models/Payment');
const Group = require('../models/Group');
const Archive = require('../models/Archive');
const Subscription = require('../models/Subscription');
const TimezoneManager = require('../utils/timezoneManager');

// Helper: format teacher name
function fullName(t) {
  if (!t) return '';
  return `${t.firstName || ''} ${t.lastName || ''}`.trim();
}

// Compute profits for a given month/year and populate FinancialTransactions.distributions
// options: { autoExtract: boolean }
async function computeProfits(month, year, options = {}) {
  // month: 1-12
  month = Number(month);
  year = Number(year);

  // load or create the singleton document
  let doc = await FinancialTransactions.findOne();
  if (!doc) {
    doc = new FinancialTransactions();
  }

  // Clear distributions to start fresh for this computation
  doc.distributions = [];

  // We'll compute only for teachers present in teacherSubscriptions
  const teacherSubs = doc.teacherSubscriptions || [];
  if (!teacherSubs.length) {
    // nothing to compute
    await doc.save();
    return [];
  }

  // load all groups (we'll filter per teacher) and pre-aggregate subscriptions & payments
  const groups = await Group.find();

  // get subscription counts per groupId (student counts)
  const subsAgg = await Subscription.aggregate([
    { $group: { _id: '$groupId', count: { $sum: 1 } } }
  ]);
  const subsCountByGroup = new Map(subsAgg.map(s => [String(s._id), s.count]));

  // get payments aggregated by groupId for the specified month/year (collected amounts)
  // Aggregate collected payments by groupId by joining payments -> subscriptions
  const paymentsAgg = await Payment.aggregate([
    { $unwind: '$months' },
    { $match: { 'months.paidMonth': month, 'months.paidYear': year, 'months.status': 'مدفوع' } },
    // join to subscriptions to get groupId
    { $lookup: { from: 'subscriptions', localField: 'subscriptionId', foreignField: 'subscriptionId', as: 'sub' } },
    { $unwind: { path: '$sub', preserveNullAndEmptyArrays: false } },
    { $group: { _id: '$sub.groupId', totalCollected: { $sum: { $ifNull: ['$months.groupPrice', '$months.amount'] } } } }
  ]);
  const paymentsByGroup = new Map(paymentsAgg.map(p => [String(p._id), p.totalCollected]));

  // Build a lookup of groups by the teacher field for quick filtering
  const groupsByTeacher = new Map();
  for (const g of groups) {
    const tId = g.teacher || g.teacherId || null;
    if (!tId) continue;
    const key = String(tId);
    const arr = groupsByTeacher.get(key) || [];
    arr.push(g);
    groupsByTeacher.set(key, arr);
  }

  // Process each subscription entry (each subscribed teacher) once
  for (const subEntry of teacherSubs) {
    const teacherId = String(subEntry.teacherId || '');
    let teacherName = subEntry.teacherName || '';

    // attempt to resolve teacherName if missing
    if (!teacherName) {
      try {
        const tdoc = await Teacher.findOne({ $or: [{ teacherId }, { _id: teacherId.match && teacherId.match(/^[0-9a-fA-F]{24}$/) ? teacherId : null }] });
        if (tdoc) teacherName = `${tdoc.firstName || ''} ${tdoc.lastName || ''}`.trim();
      } catch (err) {
        // ignore
      }
    }

    // attempt to find the teacher document (to support stored teacherId vs _id)
    let teacherDoc = null;
    try {
      const orQs = [];
      if (teacherId && teacherId.match && teacherId.match(/^[0-9a-fA-F]{24}$/)) orQs.push({ _id: teacherId });
      orQs.push({ teacherId: teacherId });
      teacherDoc = await Teacher.findOne({ $or: orQs });
    } catch (err) {
      teacherDoc = null;
    }

  const teacherDocId = teacherDoc ? String(teacherDoc._id) : null;
  const teacherRegId = teacherDoc && teacherDoc.teacherId ? String(teacherDoc.teacherId) : String(teacherId);
  const teacherRealName = teacherDoc ? `${teacherDoc.firstName || ''} ${teacherDoc.lastName || ''}`.trim() : '';

    // find groups where group.teacher equals either the teacher's _id or the registered teacherId,
    // or group.teacherId equals the registered teacherId
    const teacherGroups = groups.filter(g => {
      const gTeacher = String(g.teacher || '');
      const gTeacherIdField = String(g.teacherId || '');
      // match by stored teacher name, stored teacher id field, or teacher _id
      return (teacherDocId && gTeacher === teacherDocId) || gTeacher === teacherRegId || gTeacherIdField === teacherRegId || (teacherRealName && gTeacher === teacherRealName);
    });

    // de-duplicate by groupId
    const seenG = new Set();
    const uniqueTeacherGroups = [];
    for (const g of teacherGroups) {
      const gid = String(g.groupId || g._id || '');
      if (!seenG.has(gid)) {
        seenG.add(gid);
        uniqueTeacherGroups.push(g);
      }
    }

    let teacherTotal = 0;
    const distributionGroups = [];

    for (const g of uniqueTeacherGroups) {
      const groupId = g.groupId;
      const studentCount = subsCountByGroup.get(String(groupId)) || 0;
      const expectedRevenue = (g.price || 0) * studentCount;
      const collectedRevenue = paymentsByGroup.get(String(groupId)) || 0;

      teacherTotal += expectedRevenue;
      distributionGroups.push({
        groupId: g.groupId,
        subject: g.subject,
        studentCount,
        groupPrice: g.price || 0,
        totalRevenue: expectedRevenue,
        totalCollected: collectedRevenue
      });
    }

    const teacherPercent = Number(subEntry.teacherSharePercent ?? 60);
    const centerPercent = Number(subEntry.centerSharePercent ?? 40);

    const teacherShare = Math.round((teacherTotal * teacherPercent) / 100);
    const centerShare = Math.round((teacherTotal * centerPercent) / 100);

    const distributionId = doc.generateDistributionId();

    doc.distributions.push({
      distributionId,
      teacherId,
      teacherName,
      month,
      year,
      totalRevenue: teacherTotal,
      teacherShare,
      centerShare,
      groups: distributionGroups
    });
  }

  await doc.save();
  // Always attempt extraction after computing profits. This matches the spec: the extractor
  // is a monitoring function that begins preparing as soon as computeProfits starts and
  // finishes after the computation completes. We run it here and swallow errors so the
  // computation result is still returned even if extraction fails.
  try {
    await extractToArchive(month, year);
    console.log(`✅ Auto-extraction completed for ${month}/${year}`);
  } catch (err) {
    console.error('Auto extraction failed, but computation completed', err);
  }

  return doc.distributions.filter(d => d.month === month && d.year === year);
}

// Extract distributions for a given month/year and aggregate into Archive.currentMonth
async function extractToArchive(month, year) {
  month = Number(month);
  year = Number(year);

  const doc = await FinancialTransactions.findOne();
  if (!doc) {
    throw new Error('No financial transactions document found');
  }

  const distributions = doc.distributions.filter(d => d.month === month && d.year === year);
  if (!distributions.length) {
    throw new Error('No distributions for the specified month/year');
  }

  // Build teacher revenue entries
  const teacherEntries = distributions.map(d => ({
    teacherId: d.teacherId,
    teacherName: d.teacherName,
    revenue: d.totalRevenue || 0,
    teacherShare: d.teacherShare || 0,
    centerShare: d.centerShare || 0
  }));

  // Aggregate totals
  const totalRevenue = teacherEntries.reduce((s, e) => s + (e.revenue || 0), 0);
  // total center share = sum of centerShare from distributions
  const totalCenterShare = distributions.reduce((s, d) => s + (d.centerShare || 0), 0);
  // Do NOT default expenses to 0 here. Expenses come from other systems (budget/transactions).
  // Preserve any existing archive.currentMonth.expenses if present, otherwise attempt to compute
  // from archive.currentMonth.invoices if available. Leave undefined if unknown.
  let totalExpenses;
  // netProfit per spec = sum of center share across all teachers
  const netProfit = totalCenterShare;

  // Find or create Archive doc
  let archive = await Archive.findOne();
  if (!archive) archive = new Archive();

  // set/merge currentMonth - preserve existing expenses where possible
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
  // preserve existing expenses if any
  if (archive.currentMonth && typeof archive.currentMonth.expenses === 'number') {
    totalExpenses = archive.currentMonth.expenses;
  } else if (archive.currentMonth && Array.isArray(archive.currentMonth.invoices)) {
    totalExpenses = archive.currentMonth.invoices.reduce((s, inv) => s + ((Number(inv.price || inv.amount || 0) * (Number(inv.quantity || 1) || 1)) || 0), 0);
  }

  archive.currentMonth = Object.assign({}, archive.currentMonth || {}, {
    monthName,
    yearName: String(year),
    revenue: totalRevenue,
    netProfit,
    teachers: teacherEntries
  });

  if (typeof totalExpenses === 'number') {
    archive.currentMonth.expenses = totalExpenses;
  }
  // <<< monthsArchive modification REMOVED on purpose >>>

  await archive.save();
  return archive.currentMonth;
}

// Express route handlers
async function computeProfitsHandler(req, res) {
  try {
    const { month, year, autoExtract } = req.body;
    if (!month || !year) return res.status(400).json({ success: false, message: 'month and year required' });
    const result = await computeProfits(month, year, { autoExtract: !!autoExtract });
    res.json({ success: true, distributions: result });
  } catch (err) {
    console.error('computeProfitsHandler error', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function extractToArchiveHandler(req, res) {
  try {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ success: false, message: 'month and year required' });
    const result = await extractToArchive(month, year);
    res.json({ success: true, currentMonth: result });
  } catch (err) {
    console.error('extractToArchiveHandler error', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getFinancialTransactions(req, res) {
  try {
    let doc = await FinancialTransactions.findOne();
    if (!doc) doc = new FinancialTransactions();
    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('getFinancialTransactions error', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  computeProfits,
  extractToArchive,
  computeProfitsHandler,
  extractToArchiveHandler,
  getFinancialTransactions,
  // handler to accept a teacher subscription form and store it in teacherSubscriptions
  async addTeacherSubscriptionHandler(req, res) {
    try {
      const payload = req.body;
      // basic validation: require teacherId
      if (!payload || (!payload.teacherId && !payload.teacherId === 0)) {
        return res.status(400).json({ success: false, message: 'teacherId is required' });
      }

      // load or create singleton doc
      let doc = await FinancialTransactions.findOne();
      if (!doc) doc = new FinancialTransactions();

      // normalize incoming subscription entry
      const entry = {
        teacherId: String(payload.teacherId),
        teacherName: payload.teacherName || payload.name || '',
        subscriptionType: payload.subscriptionType || payload.type || 'standard',
        teacherSharePercent: Number(payload.teacherSharePercent ?? 60),
        centerSharePercent: Number(payload.centerSharePercent ?? 40),
        notes: payload.notes || ''
      };

      // If teacherName wasn't provided, try to resolve it from the Teacher collection
      if (!entry.teacherName || !entry.teacherId) {
        try {
          // try to find by ObjectId _id first, then by teacherId
          // avoid casting errors: only query _id when the value looks like an ObjectId
          const orQueries = [];
          const possibleId = entry.teacherId;
          if (possibleId && possibleId.match && possibleId.match(/^[0-9a-fA-F]{24}$/)) {
            orQueries.push({ _id: possibleId });
          }
          orQueries.push({ teacherId: possibleId });
          const teacherDoc = await Teacher.findOne({ $or: orQueries });
          if (teacherDoc) {
            // prefer the registered business teacherId when available (e.g. 'tch001')
            if (teacherDoc.teacherId) {
              entry.teacherId = String(teacherDoc.teacherId);
            } else {
              entry.teacherId = String(teacherDoc._id);
            }
            // fill name if missing
            if (!entry.teacherName) {
              entry.teacherName = `${teacherDoc.firstName || ''} ${teacherDoc.lastName || ''}`.trim();
            }
          }
        } catch (lookupErr) {
          console.warn('Could not lookup teacher record for subscription entry', lookupErr);
        }
      }

      // upsert: replace existing entry for teacherId if exists
      const existingIndex = doc.teacherSubscriptions.findIndex(s => s.teacherId === entry.teacherId);
      if (existingIndex >= 0) {
        doc.teacherSubscriptions[existingIndex] = entry;
      } else {
        doc.teacherSubscriptions.push(entry);
      }

      await doc.save();
      res.json({ success: true, subscription: entry });
    } catch (err) {
      console.error('addTeacherSubscriptionHandler error', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
  ,
  // One-time migration: convert stored teacherSubscriptions.teacherId from Mongo _id to teacher.teacherId when available
  async migrateTeacherIdsHandler(req, res) {
    try {
      const doc = await FinancialTransactions.findOne();
      if (!doc) return res.json({ success: true, migrated: 0, message: 'no financial transactions doc' });

      let migrated = 0;
      for (let i = 0; i < doc.teacherSubscriptions.length; i++) {
        const s = doc.teacherSubscriptions[i];
        if (!s || !s.teacherId) continue;
        // attempt to find teacher by stored value (could be _id or teacherId)
        const orQueries = [];
        if (s.teacherId && s.teacherId.match && s.teacherId.match(/^[0-9a-fA-F]{24}$/)) {
          orQueries.push({ _id: s.teacherId });
        }
        orQueries.push({ teacherId: s.teacherId });
        const teacherDoc = await Teacher.findOne({ $or: orQueries });
        if (teacherDoc && teacherDoc.teacherId && s.teacherId !== String(teacherDoc.teacherId)) {
          s.teacherId = String(teacherDoc.teacherId);
          if (!s.teacherName) s.teacherName = `${teacherDoc.firstName || ''} ${teacherDoc.lastName || ''}`.trim();
          migrated++;
        }
      }

      if (migrated > 0) await doc.save();
      res.json({ success: true, migrated });
    } catch (err) {
      console.error('migrateTeacherIdsHandler error', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
