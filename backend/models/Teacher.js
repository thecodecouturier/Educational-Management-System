const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  teacherId: { type: String, required: true, unique: true }, // معرف فريد بصيغة tch+رقم
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  subject: { type: String, required: true },
  levels: [{ type: String, required: true }],
  classes: [{ type: String, required: true }],
  notes: { type: String }
});

module.exports = mongoose.model('Teacher', teacherSchema);
