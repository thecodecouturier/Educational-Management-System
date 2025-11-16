const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupId: { type: String, required: true, unique: true }, // معرف فريد بصيغة grp+رقم
  name: { type: String }, // اسم المجموعة (يتم توليده تلقائياً)
  subject: { type: String, required: true },
  teacher: { type: String, required: true },
  levels: [{ type: String, required: true }],
  classes: [{ type: String, required: true }],
  days: [{ type: String, required: true }],
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  price: { type: Number, default: 0 }
});

// دالة لتحويل أسماء الأيام إلى اختصارات
function getDayAbbreviation(day) {
  const abbreviations = {
    // عربي
    'السبت': 'سبت',
    'الأحد': 'أحد',
    'الاثنين': 'اثنين',
    'الثلاثاء': 'ثلاثاء',
    'الأربعاء': 'أربعاء',
    'الخميس': 'خميس',
    'الجمعة': 'جمعة',
    // إنجليزي
    'Saturday': 'Sat',
    'Sunday': 'Sun',
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri'
  };
  
  return abbreviations[day] || day;
}

// دالة لتوليد اسم المجموعة
groupSchema.methods.generateName = function() {
  if (!this.days || this.days.length === 0 || !this.startTime) {
    return 'مجموعة';
  }
  
  // تحويل الأيام إلى اختصارات
  const dayAbbr = this.days.map(day => getDayAbbreviation(day)).join('-');
  
  // استخراج الساعة من startTime (مثل "10:00 AM" -> "10AM")
  const timeSimplified = this.startTime.replace(/\s+/g, '').replace(':00', '');
  
  // تكوين الاسم: أيام - الساعة
  return `${dayAbbr} - ${timeSimplified}`;
};

// Hook قبل الحفظ لتوليد الاسم تلقائياً
groupSchema.pre('save', function(next) {
  if (!this.name || this.isModified('days') || this.isModified('startTime')) {
    this.name = this.generateName();
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);
