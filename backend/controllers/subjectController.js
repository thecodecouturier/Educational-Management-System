const Subject = require('../models/Subject');

// إضافة مادة جديدة
exports.addSubject = async (req, res) => {
  try {
    const { name, levels, classes } = req.body;
    // توليد subjectId تلقائيًا
    const lastSubject = await Subject.findOne({}, {}, { sort: { subjectId: -1 } });
    let nextId = 1;
    if (lastSubject && lastSubject.subjectId) {
      const lastNum = parseInt(lastSubject.subjectId.replace('sub', ''));
      if (!isNaN(lastNum)) nextId = lastNum + 1;
    }
    const subjectId = 'sub' + String(nextId).padStart(3, '0');
    const subject = new Subject({ subjectId, name, levels, classes });
    await subject.save();
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// جلب جميع المواد
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// تعديل مادة
exports.updateSubject = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, levels, classes } = req.body;
    const subject = await Subject.findByIdAndUpdate(id, { name, levels, classes }, { new: true });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// حذف مادة
exports.deleteSubject = async (req, res) => {
  try {
    const id = req.params.id;
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
