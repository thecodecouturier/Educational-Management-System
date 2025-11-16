const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  subscriptionId: {
    type: String,
    unique: true,
    required: true
  },
  studentId: {
    type: String,
    required: true,
    ref: 'Student'
  },
  level: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  subjectId: {
    type: String,
    required: true,
    ref: 'Subject'
  },
  teacherId: {
    type: String,
    required: true,
    ref: 'Teacher'
  },
  groupId: {
    type: String,
    required: true,
    ref: 'Group'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
