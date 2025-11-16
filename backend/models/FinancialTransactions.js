const mongoose = require('mongoose');

const TeacherSubscriptionSchema = new mongoose.Schema({
  teacherId: { type: String, required: true },
  teacherName: { type: String },
  subscriptionType: { type: String, default: 'standard' },
  teacherSharePercent: { type: Number, default: 60 }, // teacher percent by default
  centerSharePercent: { type: Number, default: 40 },
  notes: { type: String }
}, { _id: false });

const DistributionGroupSchema = new mongoose.Schema({
  groupId: { type: String },
  subject: { type: String },
  studentCount: { type: Number, default: 0 },
  groupPrice: { type: Number, default: 0 },
  // expected revenue for the group (studentCount * groupPrice)
  totalRevenue: { type: Number, default: 0 },
  // actual collected amount from payments for the month/year
  totalCollected: { type: Number, default: 0 }
}, { _id: false });

const DistributionSchema = new mongoose.Schema({
  distributionId: { type: String, required: true, unique: true },
  teacherId: { type: String, required: true },
  teacherName: { type: String },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  totalRevenue: { type: Number, default: 0 },
  teacherShare: { type: Number, default: 0 },
  centerShare: { type: Number, default: 0 },
  groups: { type: [DistributionGroupSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

const FinancialTransactionsSchema = new mongoose.Schema({
  teacherSubscriptions: { type: [TeacherSubscriptionSchema], default: [] },
  distributions: { type: [DistributionSchema], default: [] }
}, { timestamps: true });

// helper to generate distributionId using ObjectId for uniqueness and DB-compatibility
FinancialTransactionsSchema.methods.generateDistributionId = function() {
  return (new mongoose.Types.ObjectId()).toString();
};

module.exports = mongoose.model('FinancialTransactions', FinancialTransactionsSchema);
