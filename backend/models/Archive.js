const mongoose = require('mongoose');

// Teacher revenue entry used in month and year aggregations
const TeacherRevenueSchema = new mongoose.Schema({
  teacherId: { type: String },
  teacherName: { type: String },
  revenue: { type: Number, default: 0 },
  teacherShare: { type: Number, default: 0 },
  centerShare: { type: Number, default: 0 }
}, { _id: false });

// Month schema
const MonthSchema = new mongoose.Schema({
  monthName: { type: String },
  yearName: { type: String },
  revenue: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  netProfit: { type: Number, default: 0 },
  teachers: { type: [TeacherRevenueSchema], default: [] }
}, { _id: false });

// Year schema (keeps summary and top 5 teachers)
const TopTeacherSchema = new mongoose.Schema({
  teacherId: { type: String },
  teacherName: { type: String },
  subscriptionType: { type: String },
  totalRevenue: { type: Number, default: 0 },
  totalTeacherShare: { type: Number, default: 0 },
  totalCenterShare: { type: Number, default: 0 }
}, { _id: false });

const YearSchema = new mongoose.Schema({
  yearName: { type: String, required: true },
  revenue: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  netProfit: { type: Number, default: 0 },
  topTeachers: { type: [TopTeacherSchema], default: [] }
}, { _id: false });

// Archive document
const ArchiveSchema = new mongoose.Schema({
  // keep last N years summary
  years: { type: [YearSchema], default: [] },

  // current month snapshot (single month object)
  currentMonth: { type: MonthSchema, default: null },

  // months archive per year: array of { yearName, months: [MonthSchema] }
  monthsArchive: { type: [{ yearName: String, months: { type: [MonthSchema], default: [] } }], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Archive', ArchiveSchema);
