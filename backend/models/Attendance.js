const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  attendanceId: { type: String, required: true, unique: true },
  subscriptionId: { type: String, required: true, ref: 'Subscription' },
  studentId: { type: String, required: true, ref: 'Student' },
  months: [
    {
      month: { type: String, required: true }, // مثال: "سبتمبر 2025"
      weeks: [
        {
          weekNumber: { type: Number, required: true }, // ديناميكي حسب الشهر
          days: [
            {
              day: { type: String, required: true }, // مثال: "الأحد"
              date: { type: String, required: true }, // تاريخ اليوم بصيغة YYYY-MM-DD
              status: { type: String, enum: ['حاضر', 'غائب'], default: 'غائب' }
            }
          ]
        }
      ]
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
