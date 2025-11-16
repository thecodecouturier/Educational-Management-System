const Budget = require('../models/Budget');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

// استقبل فاتورة من الفرونت وفرزها حسب النوع
exports.receiveBill = async (req, res) => {
  try {
    const payload = req.body;

    // نستخدم وثيقة Budget واحدة متعددة المؤسسات؟ سنبقيها بسيطة: وثيقة واحدة
    let budget = await Budget.findOne();
    if (!budget) {
      budget = new Budget();
    }

    const added = await budget.addBill(payload);
    res.json({ success: true, bill: added });
  } catch (error) {
    console.error('receiveBill error', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// بناء هيكل الدفتر المالي (يُعاد إنشاء الهيكل ويُحفظ في الـ Budget doc)
exports.buildBook = async (req, res) => {
  try {
    const tz = req.query.tz || 'UTC';
    const now = dayjs().tz(tz);

    const years = await Budget.buildFinancialBook(now);
    let budget = await Budget.findOne();
    if (!budget) budget = new Budget();
    budget.financialBook = years;
    await budget.save();

    res.json({ success: true, financialBook: budget.financialBook });
  } catch (error) {
    console.error('buildBook error', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// NOTE: clearVariableBills endpoint removed - monthly clearing is handled by a scheduled job

// دالة مساعدة لاسترجاع الوثيقة الكاملة
exports.getBudget = async (req, res) => {
  try {
    let budget = await Budget.findOne();
    if (!budget) budget = new Budget();
    // Ensure every bill has a stable `id` so frontend can reliably address them
    let modified = false;
    const genId = () => `bill_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
    ['recurringBills', 'variableBills'].forEach(arrName => {
      if (Array.isArray(budget[arrName])) {
        budget[arrName].forEach(b => {
          if (!b.id) {
            b.id = genId();
            modified = true;
          }
        });
      }
    });

    if (modified) {
      try { await budget.save(); } catch (e) { console.warn('Could not persist generated bill ids', e); }
    }

    res.json({ success: true, budget });
  } catch (error) {
    console.error('getBudget error', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// استرجاع الفواتير المتغيرة بشكل مبسط (شبيه بواجهة /expenses/fixed)
exports.getVariableExpenses = async (req, res) => {
  try {
    let budget = await Budget.findOne();
    if (!budget) budget = new Budget();

    // Get month filter from query params if provided
    const filterMonth = req.query.month; // Expected format: YYYY-MM
    
    let variableBills = Array.isArray(budget.variableBills) ? budget.variableBills : [];
    
    // Filter by month if specified
    if (filterMonth) {
      variableBills = variableBills.filter(bill => {
        // Try to extract YYYY-MM from different date fields
        const billMonth = bill.month || 
                         (bill.createdAt ? dayjs(bill.createdAt).format('YYYY-MM') : null) ||
                         (bill.date ? dayjs(bill.date).format('YYYY-MM') : null);
        return billMonth === filterMonth;
      });
    }

    // Map to consistent format
    const formattedBills = variableBills.map(bill => ({
      id: bill._id || bill.id || ('var_' + Date.now()),
      name: bill.name || bill.title || 'بدون اسم',
      category: bill.category || 'other',
      amount: Number(bill.amount || 0),
      month: bill.month || (bill.createdAt ? dayjs(bill.createdAt).format('YYYY-MM') : null),
      notes: bill.notes || '',
      type: 'variable'
    }));

    res.json({ 
      success: true, 
      expenses: formattedBills,
      count: formattedBills.length,
      filterMonth
    });
  } catch (error) {
    console.error('getVariableExpenses error', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// تحديث فاتورة (ثابتة أو متغيرة) حسب الـ id
exports.updateBill = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    console.log(`updateBill called id=${id} payload=${JSON.stringify(payload)}`);
    let budget = await Budget.findOne();
    if (!budget) budget = new Budget();

    // helper: search by id or _id (stringified)
    const updateInArray = (arr) => {
      if (!Array.isArray(arr)) return false;
      const idx = arr.findIndex(b => {
        const bid = b && (b.id || (b._id ? String(b._id) : null));
        return bid && String(bid) === String(id);
      });
      if (idx === -1) return false;
      arr[idx] = { ...arr[idx].toObject ? arr[idx].toObject() : arr[idx], ...payload };
      return true;
    };

    console.log(`budget.recurringBills.length=${(budget.recurringBills||[]).length} budget.variableBills.length=${(budget.variableBills||[]).length}`);

    let changed = false;
    if (Array.isArray(budget.recurringBills)) {
      changed = updateInArray(budget.recurringBills) || changed;
    }
    if (Array.isArray(budget.variableBills)) {
      changed = updateInArray(budget.variableBills) || changed;
    }

    if (changed) {
      await budget.save();
      return res.json({ success: true });
    }

    // If not found, log present ids for debugging
    try {
      const recIds = (budget.recurringBills || []).map(b => b.id || (b._id ? String(b._id) : null));
      const varIds = (budget.variableBills || []).map(b => b.id || (b._id ? String(b._id) : null));
      console.warn('updateBill: bill not found. existing recurring ids:', recIds.slice(0,50));
      console.warn('updateBill: bill not found. existing variable ids:', varIds.slice(0,50));
    } catch (e) { console.warn('updateBill: failed to list ids', e); }

    res.status(404).json({ success: false, error: 'bill not found' });
  } catch (error) {
    console.error('updateBill error', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// حذف فاتورة حسب id
exports.deleteBill = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`deleteBill called id=${id}`);
    let budget = await Budget.findOne();
    if (!budget) budget = new Budget();

    const removeFromArray = (arr) => {
      if (!Array.isArray(arr)) return { arr: [], removed: 0 };
      const before = arr.length;
      const filtered = arr.filter(b => {
        const bid = b && (b.id || (b._id ? String(b._id) : null));
        return !(bid && String(bid) === String(id));
      });
      return { arr: filtered, removed: before - filtered.length };
    };

    let result = removeFromArray(budget.recurringBills || []);
    budget.recurringBills = result.arr;
    let resultVar = removeFromArray(budget.variableBills || []);
    budget.variableBills = resultVar.arr;

    console.log(`deleteBill removed recurring=${result.removed} variable=${resultVar.removed}`);

    if (result.removed + resultVar.removed > 0) {
      await budget.save();
      return res.json({ success: true });
    }

    try {
      const recIds = (budget.recurringBills || []).map(b => b.id || (b._id ? String(b._id) : null));
      const varIds = (budget.variableBills || []).map(b => b.id || (b._id ? String(b._id) : null));
      console.warn('deleteBill: bill not found. existing recurring ids:', recIds.slice(0,50));
      console.warn('deleteBill: bill not found. existing variable ids:', varIds.slice(0,50));
    } catch (e) { console.warn('deleteBill: failed to list ids', e); }

    res.status(404).json({ success: false, error: 'bill not found' });
  } catch (error) {
    console.error('deleteBill error', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
