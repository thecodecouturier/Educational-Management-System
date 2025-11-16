const mongoose = require('mongoose');
const Payment = require('./models/Payment');

mongoose.connect('mongodb://localhost:27017/schoolDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function addPayments() {
  try {
    console.log('💰 إضافة المدفوعات...');
    
    // حذف المدفوعات القديمة
    await Payment.deleteMany({});
    console.log('🗑️ تم حذف المدفوعات القديمة');
    
    // إضافة دفعة 1 (بعض الأشهر مدفوعة)
    const payment1 = new Payment({
      paymentId: 'PAY001',
      subscriptionId: 'SUB001',
      studentId: 'ST001',
      groupId: 'grp002',
      months: [
        {
          month: 'أغسطس 2025',
          status: 'مدفوع',
          amount: 200
        },
        {
          month: 'سبتمبر 2025',
          status: 'مدفوع',
          amount: 200
        },
        {
          month: 'أكتوبر 2025',
          status: 'غير مدفوع',
          amount: 200
        }
      ]
    });
    
    // تحديث الأشهر المدفوعة بالتواريخ
    await payment1.updateMonthPayment(0, 'مدفوع', 200);
    await payment1.updateMonthPayment(1, 'مدفوع', 200);
    await payment1.save();
    console.log('✅ تم إضافة PAY001');
    
    // إضافة دفعة 2 (كلها غير مدفوعة)
    const payment2 = new Payment({
      paymentId: 'PAY002',
      subscriptionId: 'SUB002',
      studentId: 'ST002',
      groupId: 'grp002',
      months: [
        {
          month: 'أغسطس 2025',
          status: 'غير مدفوع',
          amount: 200
        },
        {
          month: 'سبتمبر 2025',
          status: 'غير مدفوع',
          amount: 200
        },
        {
          month: 'أكتوبر 2025',
          status: 'غير مدفوع',
          amount: 200
        }
      ]
    });
    await payment2.save();
    console.log('✅ تم إضافة PAY002');
    
    console.log('\n✅ تم إضافة جميع المدفوعات بنجاح!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

addPayments();
