const mongoose = require('mongoose');
const Group = require('./models/Group');

mongoose.connect('mongodb://localhost:27017/school_management_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function updateGroupNames() {
  try {
    console.log('🔄 جاري تحديث أسماء المجموعات...');
    
    const groups = await Group.find();
    console.log(`📋 وجدت ${groups.length} مجموعة`);
    
    for (const group of groups) {
      if (!group.name) {
        const newName = group.generateName();
        group.name = newName;
        await group.save();
        console.log(`✅ تم تحديث: ${group.groupId} -> "${newName}"`);
      } else {
        console.log(`⏭️ تخطي: ${group.groupId} (له اسم بالفعل: "${group.name}")`);
      }
    }
    
    console.log('\n✅ تم الانتهاء من تحديث جميع المجموعات');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

updateGroupNames();
