const User = require('../models/User');

// تسجيل الدخول
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // التحقق من وجود البيانات
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'يرجى إدخال اسم المستخدم وكلمة المرور' 
      });
    }
    
    // البحث عن المستخدم في قاعدة البيانات
    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة' 
      });
    }
    
    // التحقق من كلمة المرور (مقارنة مباشرة - يمكن تحسينها لاحقاً بـ hashing)
    if (user.password !== password) {
      return res.status(401).json({ 
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة' 
      });
    }
    
    // تسجيل الدخول ناجح - إرسال بيانات المستخدم (بدون كلمة المرور)
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      createdAt: user.createdAt
    };
    
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: userResponse
    });
    
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({ 
      error: 'خطأ في الخادم' 
    });
  }
};

// تسجيل الخروج
exports.logout = (req, res) => {
  res.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح'
  });
};

// التحقق من صحة الجلسة
exports.verifySession = async (req, res) => {
  try {
    // يمكن تطوير هذا لاحقاً للتحقق من JWT tokens
    res.json({
      success: true,
      message: 'الجلسة صحيحة'
    });
  } catch (error) {
    res.status(401).json({
      error: 'جلسة غير صحيحة'
    });
  }
};

// الحصول على المستخدم الحالي
exports.getCurrentUser = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    res.json({
      success: true,
      user: user
    });
    
  } catch (error) {
    console.error('خطأ في جلب المستخدم:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};
