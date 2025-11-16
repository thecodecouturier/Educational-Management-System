const mongoose = require('mongoose');

// نموذج إدارة الميزانية
const BillSchema = new mongoose.Schema({
  id: { type: String },
  billType: { type: String, enum: ['recurring','variable'], required: true },
  category: { type: String },
  name: { type: String },
  quantity: { type: Number, default: 1 },
  // month: { type: String }, // optional e.g. '2025-10' for variable bills
  amount: { type: Number, default: 0 },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

// Invoice schema to be used inside each month of the financialBook
const InvoiceSchema = new mongoose.Schema({
  // نوع الفاتورة (مثلاً 'expense' أو 'revenue')
  billType: { type: String, enum: ['recurring','variable'], required: true },
  category: { type: String },
  name: { type: String },
  quantity: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

// كل شهر يحتوي على اسم الشهر، السنة، ومصفوفة الفواتير (invoices)
const MonthSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. 'October'
  year: { type: String, required: true }, // e.g. '2025'
  invoices: { type: [InvoiceSchema], default: [] },
}, { _id: false });

// كل سنة تحتوي على اسم السنة ومصفوفة من 12 شهرًا
const YearSchema = new mongoose.Schema({
  year: { type: String, required: true }, // e.g. '2025'
  months: { type: [MonthSchema], default: [] }
}, { _id: false });

const Archive = require('./Archive');

const BudgetSchema = new mongoose.Schema({
  // 1 - الفواتير الدورية
  recurringBills: { type: [BillSchema], default: [] },

  // 2 - الفواتير المتغيرة
  variableBills: { type: [BillSchema], default: [] },

  // 3 - الدفتر المالي (أربع سنوات، كل سنة بها 12 شهر)
  financialBook: { type: [YearSchema], default: [] },

}, { timestamps: true });

// دالة لمسح الفواتير المتغيرة (تستخدم شهرياً)
BudgetSchema.methods.clearVariableBills = async function() {
  this.variableBills = [];
  await this.save();
  return this;
};

// دالة لإضافة فاتورة (تتعرف أين تُخزن بناء على billType أو حقول مساعدة)
BudgetSchema.methods.addBill = async function(bill) {
  const b = {
    id: bill.id || `bill_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
    billType: bill.billType || (bill.frequency ? 'recurring' : 'variable'),
    category: bill.category || bill.expenseCategory || '',
    name: bill.name || bill.title || '',
    amount: Number(bill.amount || 0),
    notes: bill.notes || ''
  };

  if (b.billType === 'recurring') {
    this.recurringBills.push(b);
  } else {
    this.variableBills.push(b);
  }

  await this.save();
  return b;
};

// بناء هيكل الدفتر المالي لأربع سنوات بناءً على التوقيت
BudgetSchema.statics.buildFinancialBook = async function() {
  // New behavior: do NOT accept external payload.
  // Instead, read recurringBills and variableBills from the Budget document
  // and copy them into the current month's invoices inside financialBook.
  const Model = this; // Budget model
  const dayjs = require('dayjs');

  // Resolve current year/month based on server now
  const now = dayjs();
  const targetYear = String(now.year());
  const monthNames = [
    'January','February','March','April','May','June','July','August','September','October','November','December'
  ];
  const targetMonthName = monthNames[now.month()];

  // Ensure a Budget doc exists
  let budget = await Model.findOne();
  if (!budget) budget = new Model();

  if (!Array.isArray(budget.financialBook)) budget.financialBook = [];

  // Ensure financialBook contains at most 4 years: if more, remove the oldest year(s)
  try {
    while (budget.financialBook.length > 4) {
      let minIdx = 0;
      let minYear = parseInt(budget.financialBook[0].year || '0', 10);
      for (let i = 1; i < budget.financialBook.length; i++) {
        const y = parseInt(budget.financialBook[i].year || '0', 10);
        if (y < minYear) { minYear = y; minIdx = i; }
      }
      budget.financialBook.splice(minIdx, 1);
    }
  } catch (e) {
    // ignore trimming errors; pre-save hook enforces limits as well
  }

  // Find or create the target year
  let yearObj = budget.financialBook.find(y => String(y.year) === targetYear);
  if (!yearObj) {
    yearObj = { year: targetYear, months: [] };
    budget.financialBook.push(yearObj);
  }

  if (!Array.isArray(yearObj.months)) yearObj.months = [];

  // Find or create the target month inside the year
  let monthObj = yearObj.months.find(m => m.name === targetMonthName && String(m.year) === targetYear);
  if (!monthObj) {
    monthObj = { name: targetMonthName, year: targetYear, invoices: [] };
    yearObj.months.push(monthObj);
  }

  // Build invoices list from recurringBills and variableBills stored in budget
  const invoicesToAdd = [];
  try {
    if (Array.isArray(budget.recurringBills)) {
      budget.recurringBills.forEach(b => {
        invoicesToAdd.push(Object.assign({}, {
          billType: b.billType || 'recurring',
          category: b.category || '',
          name: b.name || b.title || 'بدون اسم',
          quantity: b.quantity || 1,
          price: Number(b.amount || b.price || 0),
          notes: b.notes || '',
          createdAt: b.createdAt || new Date()
        }));
      });
    }
    if (Array.isArray(budget.variableBills)) {
      budget.variableBills.forEach(b => {
        invoicesToAdd.push(Object.assign({}, {
          billType: b.billType || 'variable',
          category: b.category || '',
          name: b.name || b.title || 'بدون اسم',
          quantity: b.quantity || 1,
          price: Number(b.amount || b.price || 0),
          notes: b.notes || '',
          createdAt: b.createdAt || b.addedAt || new Date()
        }));
      });
    }
  } catch (e) {
    // if something goes wrong building invoicesToAdd, continue gracefully
    console.warn('[Budget.buildFinancialBook] failed to build invoicesToAdd', e);
  }

  // Append normalized invoices into monthObj.invoices, avoiding duplicates
  let addedCount = 0;
  if (invoicesToAdd.length > 0) {
    const normalized = invoicesToAdd.map(inv => {
      const out = Object.assign({}, inv);
      if (out.amount !== undefined && out.price === undefined) out.price = Number(out.amount || 0);
      if (out.quantity === undefined) out.quantity = Number(out.quantity) || 1;
      if (out.price === undefined) out.price = Number(out.price) || 0;
      out.createdAt = out.createdAt ? new Date(out.createdAt) : new Date();
      return out;
    });

    // Build a set of existing keys to prevent duplicates: billType|name|price|quantity
    const existingKeys = new Set(((monthObj.invoices || [])).map(inv => `${inv.billType}|${inv.name}|${inv.price}|${inv.quantity}`));

    for (const inv of normalized) {
      const key = `${inv.billType}|${inv.name}|${inv.price}|${inv.quantity}`;
      if (!existingKeys.has(key)) {
        monthObj.invoices.push(inv);
        existingKeys.add(key);
        addedCount++;
      }
    }
  }

  // debug logs
  try {
    console.log('[Budget.buildFinancialBook] targetYear=%s targetMonth=%s invoicesBuilt=%d yearMonths=%d monthInvoices=%d',
      targetYear, targetMonthName, addedCount, (yearObj.months || []).length, (monthObj.invoices || []).length);
  } catch (e) {}

  await budget.save();
  return { budgetId: budget._id, year: targetYear, month: targetMonthName, added: addedCount };
};

// دالة البناء المجدولة: تقوم بجميع خطوات التجهيز للتقرير الشهري (بدون عرض الواجهة)
// 1) تقرأ recurringBills و variableBills من وثيقة الـ Budget
// 2) توحد التنسيق الشهري/الفاتورة
// 3) تدمج الثابت والمتغير
// 4) تجمعهم حسب الفئة
// 5) تحسب الاجمالي والنسب
// 6) تستدعى buildFinancialBook() لنسخ الفواتير إلى financialBook
// 7) تحدث archive.currentMonth.expenses بالقيمة الاجمالية وتحتفظ بالتغييرات
BudgetSchema.statics.scheduledBuild = async function() {
  const Model = this;
  const dayjs = require('dayjs');

  const now = dayjs();
  const targetYear = String(now.year());
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const targetMonthName = monthNames[now.month()];

  // load budget
  let budget = await Model.findOne();
  if (!budget) budget = new Model();

  // 1-5: Previously this function built invoices and computed totalExpenses from Budget
  // Those responsibilities relate to planned/recurring bills (expenses). Per request we remove
  // expense-related work from scheduledBuild so it only handles revenues/profit-related tasks.
  // Therefore we will NOT build invoices, will NOT compute totalExpenses here, and will NOT
  // call buildFinancialBook() or update Archive.currentMonth.expenses.

  const report = {
    month: targetMonthName,
    year: targetYear,
    // expenses are intentionally omitted here — scheduledBuild no longer computes them
    categories: []
  };

  // Note: callers that relied on buildFinancialBook() should call it explicitly if needed.
  return { ok: true, report };
};

  // Re-export model to ensure statics added after initial export are available
  module.exports = mongoose.model('Budget', BudgetSchema);
