const User = require('../models/User');

// جلب جميع المستخدمين
exports.getUsers = async (req, res) => {
  try {
    const filter = req.query.filter ? req.query.filter.trim().toLowerCase() : '';
    let users = await User.find();
    if (filter) {
      users = users.filter(u =>
        (u.firstName + ' ' + u.lastName).toLowerCase().includes(filter) ||
        u.username.toLowerCase().includes(filter)
      );
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// إضافة مستخدم جديد
exports.addUser = async (req, res) => {
  try {
    const { firstName, lastName, username, password, role, permissions } = req.body;
    
    // إنشاء المستخدم الجديد
    const user = new User({ firstName, lastName, username, password, role });
    
    // إذا تم تمرير صلاحيات محددة، استخدمها، وإلا استخدم الصلاحيات الافتراضية للدور
    if (permissions && Object.keys(permissions).length > 0) {
      user.permissions = permissions;
    } else {
      user.setDefaultPermissionsByRole();
    }
    
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// تعديل مستخدم
exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { firstName, lastName, username, password, role, permissions } = req.body;
    
    // العثور على المستخدم
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    
    // تحديث البيانات الأساسية
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (username !== undefined) user.username = username;
    if (password !== undefined) user.password = password;
    
    // تحديث الدور والصلاحيات
    if (role !== undefined) {
      user.role = role;
      // إذا تغير الدور ولم يتم تمرير صلاحيات محددة، استخدم الافتراضية للدور الجديد
      if (!permissions) {
        user.setDefaultPermissionsByRole();
      }
    }
    
    // تحديث الصلاحيات إذا تم تمريرها
    if (permissions) {
      user.permissions = permissions;
    }
    
    await user.save();
    res.json(user);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// حذف مستخدم
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// الحصول على قائمة الصلاحيات المتاحة
exports.getAvailablePermissions = (req, res) => {
  const permissions = {
    // الإدارة العامة للموارد
    general_management: 'الإدارة العامة للموارد',
    add_subject: 'إضافة مادة',
    add_teacher: 'إضافة أستاذ',
    add_group: 'إضافة مجموعة',
    
    // الاستقبال والتسجيل
    reception_registration: 'الاستقبال والتسجيل',
    register_student: 'تسجيل طالب',
    manage_subscriptions: 'إدارة الاشتراكات',
    manage_payments: 'إدارة المدفوعات',
    
    // المتابعة والحضور
    follow_up_attendance: 'المتابعة والحضور'
  };
  
  const permissionGroups = {
    general_management: {
      name: 'الإدارة العامة للموارد',
      permissions: ['general_management', 'add_subject', 'add_teacher', 'add_group']
    },
    reception_registration: {
      name: 'الاستقبال والتسجيل',
      permissions: ['reception_registration', 'register_student', 'manage_subscriptions', 'manage_payments']
    },
    follow_up_attendance: {
      name: 'المتابعة والحضور',
      permissions: ['follow_up_attendance']
    }
  };
  
  res.json({
    permissions,
    permissionGroups
  });
};

// الحصول على الصلاحيات الافتراضية لدور معين
exports.getDefaultPermissionsByRole = (req, res) => {
  const { role } = req.params;
  
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
      general_management: false,
      add_subject: false,
      add_teacher: false,
      add_group: false,
      reception_registration: true,
      register_student: true,
      manage_subscriptions: true,
      manage_payments: true,
      follow_up_attendance: false
    },
    follow_up_staff: {
      general_management: false,
      add_subject: false,
      add_teacher: false,
      add_group: false,
      reception_registration: false,
      register_student: false,
      manage_subscriptions: false,
      manage_payments: false,
      follow_up_attendance: true
    }
  };
  
  res.json(defaultPermissions[role] || {});
};

// تحديث الملف الشخصي للمستخدم
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, username } = req.body;
    
    // التحقق من وجود المستخدم
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    // التحقق من أن اسم المستخدم غير مُستخدم من قبل مستخدم آخر
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username: username });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
      }
    }
    
    // تحديث البيانات
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (username) user.username = username.trim();
    
    await user.save();
    
    // إرجاع البيانات المحدثة بدون كلمة المرور
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    };
    
    res.json({ 
      success: true, 
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: userResponse
    });
    
  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    res.status(500).json({ error: 'حدث خطأ في تحديث الملف الشخصي' });
  }
};

// تغيير كلمة المرور
exports.changePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;
    
    // التحقق من وجود البيانات المطلوبة
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'كلمة المرور الحالية والجديدة مطلوبة' });
    }
    
    // التحقق من طول كلمة المرور الجديدة
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' });
    }
    
    // العثور على المستخدم
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    // التحقق من كلمة المرور الحالية
    if (user.password !== currentPassword) {
      return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }
    
    // تحديث كلمة المرور
    user.password = newPassword;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'تم تغيير كلمة المرور بنجاح'
    });
    
  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error);
    res.status(500).json({ error: 'حدث خطأ في تغيير كلمة المرور' });
  }
};
