const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const Group = require('./models/Group');

mongoose.connect('mongodb://localhost:27017/schoolDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testPaymentUpdate() {
  try {
    console.log('🧪 بدء اختبار تحديث المدفوعات...\n');
    
    // 1. البحث عن أول دفعة
    const payment = await Payment.findOne();
    if (!payment) {
      console.log('❌ لا توجد مدفوعات في قاعدة البيانات');
      process.exit(1);
    }
    
    console.log('📋 تم العثور على دفعة:', payment.paymentId);
    console.log('   - الطالب:', payment.studentId);
    console.log('   - الاشتراك:', payment.subscriptionId);
    console.log('   - عدد الأشهر:', payment.months.length);
    
    // 2. البحث عن أول شهر غير مدفوع
    const unpaidMonthIndex = payment.months.findIndex(m => m.status === 'غير مدفوع');
    
    if (unpaidMonthIndex === -1) {
      console.log('\n✅ جميع الأشهر مدفوعة بالفعل!');
      console.log('\n📊 حالة الأشهر:');
      payment.months.forEach((month, index) => {
        console.log(`   ${index + 1}. ${month.month}: ${month.status}`);
        if (month.status === 'مدفوع') {
          console.log(`      📅 تاريخ الدفع: ${month.paidDay}/${month.paidMonth}/${month.paidYear}`);
          console.log(`      💰 المبلغ: ${month.amount} جنيه`);
        }
      });
      process.exit(0);
    }
    
    console.log(`\n📝 سيتم تحديث الشهر رقم ${unpaidMonthIndex + 1}: ${payment.months[unpaidMonthIndex].month}`);
    console.log('   - الحالة الحالية:', payment.months[unpaidMonthIndex].status);
    console.log('   - المبلغ الحالي:', payment.months[unpaidMonthIndex].amount);
    
    // 3. البحث عن المجموعة لجلب السعر
    const Group = require('./models/Group');
    const group = await Group.findOne();
    const groupPrice = group ? group.price : 200;
    
    console.log(`\n💰 سعر المجموعة: ${groupPrice} جنيه`);
    
    // 4. تحديث حالة الدفع باستخدام الدالة الجديدة
    console.log('\n⚙️ جاري تحديث حالة الدفع...');
    await payment.updateMonthPayment(unpaidMonthIndex, 'مدفوع', groupPrice);
    await payment.save();
    
    // 5. عرض النتيجة
    const updatedMonth = payment.months[unpaidMonthIndex];
    console.log('\n✅ تم التحديث بنجاح!');
    console.log('📊 البيانات الجديدة:');
    console.log('   - الحالة:', updatedMonth.status);
    console.log('   - تاريخ الدفع الكامل:', updatedMonth.paidDate);
    console.log('   - اليوم:', updatedMonth.paidDay);
    console.log('   - الشهر:', updatedMonth.paidMonth);
    console.log('   - السنة:', updatedMonth.paidYear);
    console.log('   - المبلغ:', updatedMonth.amount, 'جنيه');
    console.log('   - سعر المجموعة:', updatedMonth.groupPrice, 'جنيه');
    console.log('   - آخر تعديل:', updatedMonth.lastModified);
    
    // 6. اختبار البحث بالتاريخ
    console.log('\n🔍 اختبار دوال البحث:');
    const paymentsInMonth = payment.getPaymentsByMonth(updatedMonth.paidMonth, updatedMonth.paidYear);
    console.log(`   - مدفوعات في الشهر ${updatedMonth.paidMonth}/${updatedMonth.paidYear}:`, paymentsInMonth.length);
    
    const paymentsInDay = payment.getPaymentsByDate(updatedMonth.paidDay, updatedMonth.paidMonth, updatedMonth.paidYear);
    console.log(`   - مدفوعات في اليوم ${updatedMonth.paidDay}/${updatedMonth.paidMonth}/${updatedMonth.paidYear}:`, paymentsInDay.length);
    
    console.log('\n🎉 اكتمل الاختبار بنجاح!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:', error);
    process.exit(1);
  }
}

testPaymentUpdate();
