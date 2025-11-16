const Student = require('../models/Student');

// إضافة طالب جديد
exports.addStudent = async (req, res) => {
  try {
    const { firstName, middleName, lastName, level, grade, phones, guardianPhones } = req.body;
    // توليد studentId تلقائيًا
    const lastStudent = await Student.findOne({}, {}, { sort: { studentId: -1 } });
    let nextId = 1;
    if (lastStudent && lastStudent.studentId) {
      const lastNum = parseInt(lastStudent.studentId.replace('std', ''));
      if (!isNaN(lastNum)) nextId = lastNum + 1;
    }
    const studentId = 'std' + String(nextId).padStart(3, '0');
    const student = new Student({
      studentId,
      firstName,
      middleName,
      lastName,
      level,
      grade,
      phones,
      guardianPhones
    });
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// عرض جميع الطلاب
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// تحديث بيانات طالب
exports.updateStudent = async (req, res) => {
  try {
    const { firstName, middleName, lastName, level, grade, phones, guardianPhones } = req.body;
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'الطالب غير موجود' });
    }
    
    // تحديث البيانات
    if (firstName) student.firstName = firstName;
    if (middleName !== undefined) student.middleName = middleName;
    if (lastName) student.lastName = lastName;
    if (level) student.level = level;
    if (grade) student.grade = grade;
    if (phones) student.phones = phones;
    if (guardianPhones) student.guardianPhones = guardianPhones;
    
    await student.save();
    
    res.json({ success: true, message: 'تم تحديث بيانات الطالب بنجاح', student });
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ error: err.message });
  }
};

// حذف طالب
exports.deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
