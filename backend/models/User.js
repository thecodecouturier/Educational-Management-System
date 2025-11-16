const mongoose = require('mongoose');

// تعريف هيكل الصلاحيات المتداخلة
const permissionsSchema = new mongoose.Schema({
  // الإدارة العامة للموارد
  general_management: { type: Boolean, default: false },
  add_subject: { type: Boolean, default: false },
  add_teacher: { type: Boolean, default: false },
  add_group: { type: Boolean, default: false },
  
  // الاستقبال والتسجيل
  reception_registration: { type: Boolean, default: false },
  register_student: { type: Boolean, default: false },
  manage_subscriptions: { type: Boolean, default: false },
  manage_payments: { type: Boolean, default: false },
  
  // المتابعة والحضور
  follow_up_attendance: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'receptionist', 'follow_up_staff'] },
  permissions: { type: permissionsSchema, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// تحديث updatedAt تلقائياً عند التعديل
userSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// دالة لتعيين الصلاحيات الافتراضية حسب الدور
userSchema.methods.setDefaultPermissionsByRole = function() {
  const defaultPermissions = {
    admin: {
      general_management: true,
      add_subject: true,
      add_teacher: true,
      add_group: true,
      reception_registration: true,
      register_student: true,
      manage_subscriptions: true,
      manage_payments: true,
      follow_up_attendance: true
    },
    receptionist: {
      reception_registration: true,
      register_student: true,
      manage_subscriptions: true,
      manage_payments: true
    },
    follow_up_staff: {
      follow_up_attendance: true
    }
  };
  
  // إعادة تعيين جميع الصلاحيات إلى false أولاً
  Object.keys(this.permissions.toObject()).forEach(key => {
    this.permissions[key] = false;
  });
  
  // تعيين الصلاحيات الافتراضية حسب الدور
  const rolePermissions = defaultPermissions[this.role];
  if (rolePermissions) {
    Object.keys(rolePermissions).forEach(permission => {
      this.permissions[permission] = rolePermissions[permission];
    });
  }
  
  return this.permissions;
};

module.exports = mongoose.model('User', userSchema);
