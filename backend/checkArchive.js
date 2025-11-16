const mongoose = require('mongoose');
const Archive = require('./models/Archive');

mongoose.connect('mongodb://localhost:27017/school', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ اتصال بقاعدة البيانات');
  
  const archive = await Archive.findOne();
  console.log('\n📊 بيانات Archive.currentMonth:');
  console.log(JSON.stringify(archive?.currentMonth, null, 2));
  
  console.log('\n📊 Archive كامل:');
  console.log(JSON.stringify(archive, null, 2));
  
  process.exit(0);
}).catch(err => {
  console.error('❌ خطأ:', err);
  process.exit(1);
});
