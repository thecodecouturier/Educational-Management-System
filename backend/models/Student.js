const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({

  
  studentId: {
    type: String,
    required: true
  },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  level: { type: String, required: true }, // ابتدائى/اعدادى/ثانوى
  grade: { type: String, required: true }, // الصف
  phones: [{ type: String }],
  guardianPhones: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

// 🔍 Index لضمان فريد studentId
studentSchema.index({ studentId: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
