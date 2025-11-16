const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectId: { type: String, required: true, unique: true }, // معرف فريد بصيغة sub+رقم
  name: { type: String, required: true },
  levels: [{ type: String, required: true }],
  classes: [{ type: String, required: true }]
});

module.exports = mongoose.model('Subject', subjectSchema);
