const Teacher = require('../models/Teacher');

// إضافة مدرس جديد
exports.addTeacher = async (req, res) => {
  try {
    const { firstName, lastName, subject, levels, classes, notes } = req.body;
    // توليد teacherId تلقائيًا
    const lastTeacher = await Teacher.findOne({}, {}, { sort: { teacherId: -1 } });
    let nextId = 1;
    if (lastTeacher && lastTeacher.teacherId) {
      const lastNum = parseInt(lastTeacher.teacherId.replace('tch', ''));
      if (!isNaN(lastNum)) nextId = lastNum + 1;
    }
    const teacherId = 'tch' + String(nextId).padStart(3, '0');
    const teacher = new Teacher({ teacherId, firstName, lastName, subject, levels, classes, notes });
    await teacher.save();
    res.status(201).json(teacher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// جلب جميع المدرسين
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// تعديل مدرس
exports.updateTeacher = async (req, res) => {
  try {
    const id = req.params.id;
    const teacher = await Teacher.findByIdAndUpdate(id, req.body, { new: true });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// حذف مدرس
exports.deleteTeacher = async (req, res) => {
  try {
    const id = req.params.id;
    const teacher = await Teacher.findByIdAndDelete(id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
