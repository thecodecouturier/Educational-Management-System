// ===============================
// 🏢 Institution Controller - Multi-Tenant Management
// ===============================
const Institution = require('../models/Institution');
const AutoTimezoneDetector = require('../utils/autoTimezoneDetector');
const { getClientIP } = require('../middleware/multiTenant');

// 🏢 إنشاء مؤسسة جديدة
exports.createInstitution = async (req, res) => {
  try {
    const { name, slug, timezone, location, owner } = req.body;
    
    // التحقق من عدم وجود مؤسسة بنفس الـ slug
    const existingInstitution = await Institution.findOne({ slug });
    if (existingInstitution) {
      return res.status(400).json({
        success: false,
        error: 'Institution slug already exists',
        message: 'يوجد مؤسسة أخرى بنفس المعرف'
      });
    }
    
    // كشف تلقائي للمنطقة الزمنية إذا لم تُحدد
    let finalTimezone = timezone;
    let detectionData = null;
    
    if (!finalTimezone) {
      try {
        const clientIP = getClientIP(req);
        detectionData = await AutoTimezoneDetector.detectTimezoneFromIP(clientIP);
        finalTimezone = detectionData?.timezone || 'Africa/Cairo';
      } catch (detectError) {
        finalTimezone = 'Africa/Cairo';
      }
    }
    
    // إنشاء المؤسسة
    const institution = new Institution({
      name,
      slug: slug || new Institution({ name }).generateSlug(),
      timezone: finalTimezone,
      location,
      owner,
      autoDetection: {
        source: detectionData ? 'ip-detection' : (timezone ? 'manual' : 'default'),
        detectedFrom: getClientIP(req),
        detectedAt: new Date(),
        detectionMetadata: detectionData || {}
      }
    });
    
    await institution.save();
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء المؤسسة بنجاح',
      institution: {
        id: institution._id,
        name: institution.name,
        slug: institution.slug,
        timezone: institution.timezone,
        location: institution.location,
        status: institution.status
      }
    });
  } catch (error) {
    console.error('خطأ في إنشاء المؤسسة:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create institution',
      message: 'فشل في إنشاء المؤسسة'
    });
  }
};

// 📋 الحصول على جميع المؤسسات
exports.getAllInstitutions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, country } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (country) filter['location.country'] = country;
    
    const institutions = await Institution.find(filter)
      .select('name slug timezone location status owner createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Institution.countDocuments(filter);
    
    res.json({
      success: true,
      institutions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('خطأ في جلب المؤسسات:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch institutions'
    });
  }
};

// 🔍 الحصول على مؤسسة واحدة
exports.getInstitution = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const institution = await Institution.findOne({ 
      slug, 
      status: { $ne: 'suspended' } 
    });
    
    if (!institution) {
      return res.status(404).json({
        success: false,
        error: 'Institution not found',
        message: 'المؤسسة غير موجودة'
      });
    }
    
    res.json({
      success: true,
      institution
    });
  } catch (error) {
    console.error('خطأ في جلب المؤسسة:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch institution'
    });
  }
};

// ✏️ تحديث مؤسسة
exports.updateInstitution = async (req, res) => {
  try {
    const { slug } = req.params;
    const updates = req.body;
    
    // منع تغيير بعض الحقول الحساسة
    delete updates._id;
    delete updates.slug;
    delete updates.createdAt;
    
    const institution = await Institution.findOneAndUpdate(
      { slug },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!institution) {
      return res.status(404).json({
        success: false,
        error: 'Institution not found'
      });
    }
    
    res.json({
      success: true,
      message: 'تم تحديث المؤسسة بنجاح',
      institution
    });
  } catch (error) {
    console.error('خطأ في تحديث المؤسسة:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update institution'
    });
  }
};

// 🔍 كشف تلقائي للمنطقة الزمنية لمؤسسة
exports.autoDetectTimezone = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const institution = await Institution.findOne({ slug });
    if (!institution) {
      return res.status(404).json({
        success: false,
        error: 'Institution not found'
      });
    }
    
    const clientIP = getClientIP(req);
    const detectionData = await AutoTimezoneDetector.detectTimezoneFromIP(clientIP);
    
    if (!detectionData) {
      return res.status(400).json({
        success: false,
        error: 'Auto-detection failed',
        message: 'فشل الكشف التلقائي للمنطقة الزمنية'
      });
    }
    
    // تحديث المؤسسة
    institution.timezone = detectionData.timezone;
    institution.autoDetection = {
      source: 'ip-detection',
      detectedFrom: clientIP,
      detectedAt: new Date(),
      detectionMetadata: detectionData
    };
    institution.location = {
      ...institution.location,
      country: detectionData.country || institution.location?.country,
      city: detectionData.city || institution.location?.city
    };
    
    await institution.save();
    
    res.json({
      success: true,
      message: 'تم كشف المنطقة الزمنية تلقائياً',
      detected: {
        timezone: detectionData.timezone,
        country: detectionData.country,
        city: detectionData.city
      }
    });
  } catch (error) {
    console.error('خطأ في الكشف التلقائي:', error);
    res.status(500).json({
      success: false,
      error: 'Auto-detection failed'
    });
  }
};

// 📊 إحصائيات المؤسسات
exports.getInstitutionsStats = async (req, res) => {
  try {
    const stats = await Institution.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const countryStats = await Institution.aggregate([
      {
        $group: {
          _id: '$location.country',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const timezoneStats = await Institution.aggregate([
      {
        $group: {
          _id: '$timezone',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      stats: {
        byStatus: stats,
        byCountry: countryStats,
        byTimezone: timezoneStats,
        total: await Institution.countDocuments()
      }
    });
  } catch (error) {
    console.error('خطأ في إحصائيات المؤسسات:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
};
