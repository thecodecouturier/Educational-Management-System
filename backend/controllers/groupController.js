const Group = require('../models/Group');

// إضافة مجموعة جديدة
exports.addGroup = async (req, res) => {
  try {
    const { subject, teacher, levels, classes, days, startTime, endTime, price } = req.body;
    // توليد groupId تلقائيًا
    const lastGroup = await Group.findOne({}, {}, { sort: { groupId: -1 } });
    let nextId = 1;
    if (lastGroup && lastGroup.groupId) {
      const lastNum = parseInt(lastGroup.groupId.replace('grp', ''));
      if (!isNaN(lastNum)) nextId = lastNum + 1;
    }
    const groupId = 'grp' + String(nextId).padStart(3, '0');
    const group = new Group({ groupId, subject, teacher, levels, classes, days, startTime, endTime, price });
    
    // سيتم توليد الاسم تلقائياً بواسطة pre-save hook
    await group.save();
    
    console.log(`✅ تم إنشاء مجموعة جديدة: ${group.groupId}`);
    console.log(`   📛 اسم المجموعة: ${group.name}`);
    console.log(`   📅 الأيام: ${days.join(', ')}`);
    console.log(`   ⏰ الوقت: ${startTime}`);
    
    res.status(201).json(group);
  } catch (err) {
    console.error('❌ خطأ في إنشاء المجموعة:', err);
    res.status(500).json({ error: err.message });
  }
};

// جلب جميع المجموعات
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// تعديل مجموعة
exports.updateGroup = async (req, res) => {
  try {
    const id = req.params.id;
    const group = await Group.findByIdAndUpdate(id, req.body, { new: true });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// حذف مجموعة
exports.deleteGroup = async (req, res) => {
  try {
    const id = req.params.id;
    const group = await Group.findByIdAndDelete(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
