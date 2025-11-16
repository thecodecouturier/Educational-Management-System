const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const Group = require('./models/Group');

mongoose.connect('mongodb://localhost:27017/schoolDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function updateExistingPayment() {
  try {
    console.log('🔄 تحديث دفعة موجودة لاختبار النظام الجديد...\n');
    
    // البحث عن أول دفعة
    const payment = await Payment.findOne({ paymentId: 'PAY001' });
    if (!payment) {
      console.log('❌ لم يتم العثور على الدفعة PAY001');
      process.exit(1);
    }
    
    console.log('📋 الدفعة قبل التحديث:');
    console.log('   - الشهر الأول:', payment.months[0].month);
    console.log('   - الحالة:', payment.months[0].status);
    console.log('   - تاريخ الدفع:', payment.months[0].paidDate);
    console.log('   - اليوم:', payment.months[0].paidDay);
    
    // الحصول على سعر المجموعة
    const group = await Group.findOne();
    const groupPrice = group ? group.price : 200;
    
    console.log(`\n💰 سعر المجموعة: ${groupPrice} جنيه`);
    
    // تحديث الشهر الأول (تغيير حالته من مدفوع لغير مدفوع ثم إعادته لمدفوع)
    console.log('\n⚙️ تحديث 1: تغيير الحالة إلى "غير مدفوع"...');
    await payment.updateMonthPayment(0, 'غير مدفوع');
    await payment.save();
    
    console.log('   - الحالة الجديدة:', payment.months[0].status);
    console.log('   - تاريخ الدفع:', payment.months[0].paidDate);
    
    // الآن نعيد تحديثه إلى مدفوع
    console.log('\n⚙️ تحديث 2: تغيير الحالة إلى "مدفوع" مع تسجيل التاريخ...');
    await payment.updateMonthPayment(0, 'مدفوع', groupPrice);
    await payment.save();
    
    console.log('\n✅ تم التحديث بنجاح!');
    console.log('📊 البيانات الجديدة للشهر الأول:');
    console.log('   - الشهر:', payment.months[0].month);
    console.log('   - الحالة:', payment.months[0].status);
    console.log('   - تاريخ الدفع الكامل:', payment.months[0].paidDate);
    console.log('   - اليوم:', payment.months[0].paidDay);
    console.log('   - الشهر (رقم):', payment.months[0].paidMonth);
    console.log('   - السنة:', payment.months[0].paidYear);
    console.log('   - المبلغ:', payment.months[0].amount, 'جنيه');
    console.log('   - سعر المجموعة:', payment.months[0].groupPrice, 'جنيه');
    console.log('   - آخر تعديل:', payment.months[0].lastModified);
    
    console.log('\n🎉 اكتمل التحديث بنجاح!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ خطأ:', error);
    process.exit(1);
  }
}

updateExistingPayment();
