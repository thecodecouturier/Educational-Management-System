// ===============================
// 🏢 Multi-Tenant Middleware
// ===============================
const Institution = require('../models/Institution');

// 🔍 استخراج معرف المؤسسة من الطلب
function extractInstitutionIdentifier(req) {
  // 1. من الـ subdomain (eg: cairo-school.myapp.com)
  const host = req.get('host') || '';
  const subdomain = host.split('.')[0];
  
  // 2. من المسار (eg: /institution/cairo-school/...)
  const pathInstitution = req.path.split('/')[2];
  
  // 3. من الـ header المخصص
  const headerInstitution = req.get('x-institution-slug');
  
  // 4. من الـ query parameter
  const queryInstitution = req.query.institution;
  
  return headerInstitution || pathInstitution || queryInstitution || subdomain || 'default';
}

// 🏢 Middleware للحصول على المؤسسة
async function getInstitution(req, res, next) {
  try {
    const institutionSlug = extractInstitutionIdentifier(req);
    
    // البحث عن المؤسسة
    let institution = await Institution.findOne({ 
      slug: institutionSlug,
      status: 'active' 
    });
    
    // إذا لم توجد والمعرف هو "default"، أنشئ مؤسسة افتراضية
    if (!institution && institutionSlug === 'default') {
      institution = await createDefaultInstitution(req);
    }
    
    if (!institution) {
      return res.status(404).json({
        success: false,
        error: 'Institution not found',
        message: `المؤسسة "${institutionSlug}" غير موجودة أو غير نشطة`
      });
    }
    
    // إضافة بيانات المؤسسة للطلب
    req.institution = institution;
    req.institutionId = institution._id;
    req.institutionTimezone = institution.timezone;
    
    next();
  } catch (error) {
    console.error('خطأ في Multi-Tenant Middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'خطأ في النظام'
    });
  }
}

// 🆕 إنشاء مؤسسة افتراضية
async function createDefaultInstitution(req) {
  try {
    const AutoTimezoneDetector = require('../utils/autoTimezoneDetector');
    
    // محاولة كشف المنطقة الزمنية
    let detectedTimezone = 'Africa/Cairo';
    let detectionData = null;
    
    try {
      const clientIP = getClientIP(req);
      detectionData = await AutoTimezoneDetector.detectTimezoneFromIP(clientIP);
      detectedTimezone = detectionData.timezone || 'Africa/Cairo';
    } catch (detectError) {
      console.log('⚠️ لم يتمكن من كشف المنطقة الزمنية، استخدام الافتراضية');
    }
    
    const institution = new Institution({
      name: 'المؤسسة الافتراضية',
      slug: 'default',
      timezone: detectedTimezone,
      autoDetection: {
        source: detectionData ? 'ip-detection' : 'default',
        detectedFrom: getClientIP(req),
        detectedAt: new Date(),
        detectionMetadata: detectionData || {}
      },
      status: 'active'
    });
    
    await institution.save();
    console.log(`🏢 تم إنشاء مؤسسة افتراضية: ${institution.name} (${institution.timezone})`);
    
    return institution;
  } catch (error) {
    console.error('خطأ في إنشاء المؤسسة الافتراضية:', error);
    throw error;
  }
}

// 🔍 استخراج IP العميل
function getClientIP(req) {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         'unknown';
}

// 🔒 Middleware لضمان فصل البيانات بين المؤسسات
function ensureInstitutionAccess(req, res, next) {
  if (!req.institutionId) {
    return res.status(400).json({
      success: false,
      error: 'Institution not set',
      message: 'لم يتم تحديد المؤسسة'
    });
  }
  next();
}

// 📊 دالة مساعدة لإضافة filter المؤسسة للاستعلامات
function addInstitutionFilter(query, institutionId) {
  return { ...query, institutionId };
}

module.exports = {
  getInstitution,
  ensureInstitutionAccess,
  addInstitutionFilter,
  extractInstitutionIdentifier,
  getClientIP
};
