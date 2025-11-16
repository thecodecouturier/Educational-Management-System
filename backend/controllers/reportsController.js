const Archive = require('../models/Archive');
const Budget = require('../models/Budget');
const timezoneManager = require('../utils/timezoneManager');

// ═══════════════════════════════════════════════════════
// 📊 نظام التقارير المالية المتقدم
// ═══════════════════════════════════════════════════════

/**
 * الحصول على ملخص شامل للتقارير المتاحة
 * يعرض: السنوات المتاحة، الأشهر لكل سنة، إحصائيات سريعة
 */
exports.getReportsSummary = async (req, res) => {
  try {
    const archive = await Archive.findOne();
    const budget = await Budget.findOne();
    
    if (!archive) {
      return res.json({
        ok: true,
        summary: {
          availableYears: [],
          currentMonth: null,
          totalReports: 0
        }
      });
    }

    // جمع السنوات المتاحة من Archive
    const availableYears = [];
    
    // من years summary
    if (archive.years && archive.years.length > 0) {
      archive.years.forEach(year => {
        if (!availableYears.find(y => y.year === year.yearName)) {
          availableYears.push({
            year: year.yearName,
            hasYearSummary: true,
            revenue: year.revenue || 0,
            expenses: year.expenses || 0,
            netProfit: year.netProfit || 0,
            monthsCount: 0
          });
        }
      });
    }

    // من monthsArchive
    if (archive.monthsArchive && archive.monthsArchive.length > 0) {
      archive.monthsArchive.forEach(yearEntry => {
        let yearData = availableYears.find(y => y.year === yearEntry.yearName);
        if (!yearData) {
          yearData = {
            year: yearEntry.yearName,
            hasYearSummary: false,
            revenue: 0,
            expenses: 0,
            netProfit: 0,
            monthsCount: 0
          };
          availableYears.push(yearData);
        }
        yearData.monthsCount = (yearEntry.months || []).length;
      });
    }

    // ترتيب السنوات تنازلياً
    availableYears.sort((a, b) => Number(b.year) - Number(a.year));

    // حساب إجمالي التقارير
    const totalReports = availableYears.reduce((sum, y) => sum + y.monthsCount, 0) + 
                         availableYears.filter(y => y.hasYearSummary).length;

    return res.json({
      ok: true,
      summary: {
        availableYears,
        currentMonth: archive.currentMonth,
        totalReports,
        budgetAvailable: !!budget
      }
    });

  } catch (error) {
    console.error('[Reports] getReportsSummary error:', error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};

/**
 * الحصول على تقرير شهري محدد
 * Parameters: year, month
 */
exports.getMonthReport = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ 
        ok: false, 
        message: 'يجب تحديد السنة والشهر' 
      });
    }

    const archive = await Archive.findOne();
    const budget = await Budget.findOne();

    if (!archive) {
      return res.status(404).json({ 
        ok: false, 
        message: 'لا توجد بيانات أرشيفية' 
      });
    }

    // البحث في monthsArchive
    let monthData = null;
    const yearEntry = archive.monthsArchive.find(y => y.yearName === year);
    
    if (yearEntry) {
      monthData = yearEntry.months.find(m => 
        m.monthName.toLowerCase() === month.toLowerCase() && 
        m.yearName === year
      );
    }

    // إذا لم نجد في الأرشيف، نتحقق من الشهر الحالي
    if (!monthData && archive.currentMonth) {
      if (archive.currentMonth.yearName === year && 
          archive.currentMonth.monthName.toLowerCase() === month.toLowerCase()) {
        monthData = archive.currentMonth;
      }
    }

    if (!monthData) {
      return res.status(404).json({ 
        ok: false, 
        message: 'لم يتم العثور على بيانات لهذا الشهر' 
      });
    }

    // جلب الفواتير من Budget.financialBook
    let invoices = [];
    let budgetCategories = {};
    
    if (budget && budget.financialBook) {
      const yearBook = budget.financialBook.find(y => String(y.year) === year);
      if (yearBook) {
        const monthBook = yearBook.months.find(m => 
          m.name === month && String(m.year) === year
        );
        
        if (monthBook && monthBook.invoices) {
          invoices = monthBook.invoices;
          
          // تجميع حسب الفئات
          monthBook.invoices.forEach(inv => {
            const category = inv.category || 'غير مصنف';
            if (!budgetCategories[category]) {
              budgetCategories[category] = {
                category,
                total: 0,
                count: 0,
                items: []
              };
            }
            const amount = (inv.price || 0) * (inv.quantity || 1);
            budgetCategories[category].total += amount;
            budgetCategories[category].count += 1;
            budgetCategories[category].items.push({
              name: inv.name,
              amount,
              quantity: inv.quantity,
              price: inv.price,
              billType: inv.billType,
              notes: inv.notes,
              createdAt: inv.createdAt
            });
          });
        }
      }
    }

    // تحليل المعلمين
    const teachersAnalysis = (monthData.teachers || []).map(teacher => ({
      teacherId: teacher.teacherId,
      teacherName: teacher.teacherName,
      revenue: teacher.revenue || 0,
      teacherShare: teacher.teacherShare || 0,
      centerShare: teacher.centerShare || 0,
      centerPercentage: teacher.revenue > 0 ? 
        ((teacher.centerShare / teacher.revenue) * 100).toFixed(2) : 0
    }));

    // ترتيب المعلمين حسب الإيرادات
    teachersAnalysis.sort((a, b) => b.revenue - a.revenue);

    return res.json({
      ok: true,
      report: {
        period: {
          month,
          year,
          type: 'monthly'
        },
        financial: {
          revenue: monthData.revenue || 0,
          expenses: monthData.expenses || 0,
          netProfit: monthData.netProfit || 0,
          profitMargin: monthData.revenue > 0 ? 
            ((monthData.netProfit / monthData.revenue) * 100).toFixed(2) : 0
        },
        teachers: teachersAnalysis,
        expenses: {
          total: monthData.expenses || 0,
          categories: Object.values(budgetCategories),
          invoices: invoices,
          invoicesCount: invoices.length
        },
        statistics: {
          totalTeachers: teachersAnalysis.length,
          activeTeachers: teachersAnalysis.filter(t => t.revenue > 0).length,
          averageRevenuePerTeacher: teachersAnalysis.length > 0 ?
            (monthData.revenue / teachersAnalysis.filter(t => t.revenue > 0).length).toFixed(2) : 0
        }
      }
    });

  } catch (error) {
    console.error('[Reports] getMonthReport error:', error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};

/**
 * الحصول على تقرير سنوي كامل
 * Parameters: year
 */
exports.getYearReport = async (req, res) => {
  try {
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({ 
        ok: false, 
        message: 'يجب تحديد السنة' 
      });
    }

    const archive = await Archive.findOne();
    const budget = await Budget.findOne();

    if (!archive) {
      return res.status(404).json({ 
        ok: false, 
        message: 'لا توجد بيانات أرشيفية' 
      });
    }

    // البحث في years summary
    const yearSummary = archive.years.find(y => y.yearName === year);
    
    // جلب جميع الأشهر من monthsArchive
    const yearEntry = archive.monthsArchive.find(y => y.yearName === year);
    const months = yearEntry ? yearEntry.months : [];

    // إذا لم نجد ملخص سنوي، نحسبه من الأشهر
    let revenue = 0;
    let expenses = 0;
    let netProfit = 0;
    let topTeachers = [];

    if (yearSummary) {
      revenue = yearSummary.revenue || 0;
      expenses = yearSummary.expenses || 0;
      netProfit = yearSummary.netProfit || 0;
      topTeachers = yearSummary.topTeachers || [];
    } else if (months.length > 0) {
      // حساب من الأشهر
      revenue = months.reduce((sum, m) => sum + (m.revenue || 0), 0);
      expenses = months.reduce((sum, m) => sum + (m.expenses || 0), 0);
      netProfit = months.reduce((sum, m) => sum + (m.netProfit || 0), 0);

      // حساب أفضل المعلمين
      const teachersMap = new Map();
      months.forEach(month => {
        (month.teachers || []).forEach(teacher => {
          const key = teacher.teacherId || teacher.teacherName;
          if (!teachersMap.has(key)) {
            teachersMap.set(key, {
              teacherId: teacher.teacherId,
              teacherName: teacher.teacherName,
              totalRevenue: 0,
              totalTeacherShare: 0,
              totalCenterShare: 0
            });
          }
          const data = teachersMap.get(key);
          data.totalRevenue += teacher.revenue || 0;
          data.totalTeacherShare += teacher.teacherShare || 0;
          data.totalCenterShare += teacher.centerShare || 0;
        });
      });

      topTeachers = Array.from(teachersMap.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);
    }

    // تحليل شهري (المقارنة بين الأشهر)
    const monthlyBreakdown = months.map(month => ({
      month: month.monthName,
      revenue: month.revenue || 0,
      expenses: month.expenses || 0,
      netProfit: month.netProfit || 0,
      teachersCount: (month.teachers || []).length
    }));

    // جلب إحصائيات الميزانية من financialBook
    let totalInvoices = 0;
    let expensesByCategory = {};
    
    if (budget && budget.financialBook) {
      const yearBook = budget.financialBook.find(y => String(y.year) === year);
      if (yearBook) {
        yearBook.months.forEach(monthBook => {
          totalInvoices += (monthBook.invoices || []).length;
          
          (monthBook.invoices || []).forEach(inv => {
            const category = inv.category || 'غير مصنف';
            if (!expensesByCategory[category]) {
              expensesByCategory[category] = {
                category,
                total: 0,
                count: 0
              };
            }
            const amount = (inv.price || 0) * (inv.quantity || 1);
            expensesByCategory[category].total += amount;
            expensesByCategory[category].count += 1;
          });
        });
      }
    }

    return res.json({
      ok: true,
      report: {
        period: {
          year,
          type: 'yearly'
        },
        financial: {
          revenue,
          expenses,
          netProfit,
          profitMargin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : 0,
          averageMonthlyRevenue: months.length > 0 ? (revenue / months.length).toFixed(2) : 0,
          averageMonthlyExpenses: months.length > 0 ? (expenses / months.length).toFixed(2) : 0
        },
        teachers: {
          top: topTeachers,
          totalRevenue: topTeachers.reduce((sum, t) => sum + t.totalRevenue, 0),
          averageRevenuePerTeacher: topTeachers.length > 0 ?
            (topTeachers.reduce((sum, t) => sum + t.totalRevenue, 0) / topTeachers.length).toFixed(2) : 0
        },
        expenses: {
          total: expenses,
          categories: Object.values(expensesByCategory),
          totalInvoices
        },
        monthly: {
          breakdown: monthlyBreakdown,
          monthsCount: months.length,
          bestMonth: monthlyBreakdown.length > 0 ?
            monthlyBreakdown.reduce((best, m) => m.revenue > best.revenue ? m : best) : null,
          worstMonth: monthlyBreakdown.length > 0 ?
            monthlyBreakdown.reduce((worst, m) => m.revenue < worst.revenue ? m : worst) : null
        }
      }
    });

  } catch (error) {
    console.error('[Reports] getYearReport error:', error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};

/**
 * الحصول على تقرير مقارن بين فترتين
 * Parameters: startYear, startMonth, endYear, endMonth
 */
exports.getComparisonReport = async (req, res) => {
  try {
    const { startYear, startMonth, endYear, endMonth } = req.query;
    
    if (!startYear || !endYear) {
      return res.status(400).json({ 
        ok: false, 
        message: 'يجب تحديد السنوات للمقارنة' 
      });
    }

    const archive = await Archive.findOne();
    
    if (!archive) {
      return res.status(404).json({ 
        ok: false, 
        message: 'لا توجد بيانات أرشيفية' 
      });
    }

    // جلب البيانات للفترتين
    const getMonthData = (year, month) => {
      const yearEntry = archive.monthsArchive.find(y => y.yearName === year);
      if (yearEntry && month) {
        return yearEntry.months.find(m => 
          m.monthName.toLowerCase() === month.toLowerCase()
        );
      }
      return null;
    };

    const getYearData = (year) => {
      return archive.years.find(y => y.yearName === year);
    };

    let period1Data, period2Data;
    
    if (startMonth && endMonth) {
      // مقارنة شهرية
      period1Data = getMonthData(startYear, startMonth);
      period2Data = getMonthData(endYear, endMonth);
    } else {
      // مقارنة سنوية
      period1Data = getYearData(startYear);
      period2Data = getYearData(endYear);
    }

    if (!period1Data || !period2Data) {
      return res.status(404).json({ 
        ok: false, 
        message: 'لم يتم العثور على بيانات لإحدى الفترتين' 
      });
    }

    // حساب التغيرات
    const calculateChange = (old, current) => {
      if (old === 0) return current > 0 ? 100 : 0;
      return (((current - old) / old) * 100).toFixed(2);
    };

    const comparison = {
      revenue: {
        period1: period1Data.revenue || 0,
        period2: period2Data.revenue || 0,
        change: calculateChange(period1Data.revenue || 0, period2Data.revenue || 0),
        trend: (period2Data.revenue || 0) > (period1Data.revenue || 0) ? 'up' : 'down'
      },
      expenses: {
        period1: period1Data.expenses || 0,
        period2: period2Data.expenses || 0,
        change: calculateChange(period1Data.expenses || 0, period2Data.expenses || 0),
        trend: (period2Data.expenses || 0) > (period1Data.expenses || 0) ? 'up' : 'down'
      },
      netProfit: {
        period1: period1Data.netProfit || 0,
        period2: period2Data.netProfit || 0,
        change: calculateChange(period1Data.netProfit || 0, period2Data.netProfit || 0),
        trend: (period2Data.netProfit || 0) > (period1Data.netProfit || 0) ? 'up' : 'down'
      }
    };

    return res.json({
      ok: true,
      comparison: {
        periods: {
          period1: { year: startYear, month: startMonth },
          period2: { year: endYear, month: endMonth }
        },
        data: comparison,
        summary: {
          revenueGrowth: comparison.revenue.change,
          profitGrowth: comparison.netProfit.change,
          recommendation: comparison.netProfit.trend === 'up' ? 
            'الأداء في تحسن مستمر' : 'يحتاج إلى مراجعة الاستراتيجية'
        }
      }
    });

  } catch (error) {
    console.error('[Reports] getComparisonReport error:', error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};

/**
 * الحصول على فاتورة محددة من financialBook
 * Parameters: year, month, invoiceIndex
 */
exports.getInvoice = async (req, res) => {
  try {
    const { year, month, invoiceIndex } = req.query;
    
    if (!year || !month || invoiceIndex === undefined) {
      return res.status(400).json({ 
        ok: false, 
        message: 'يجب تحديد السنة والشهر ورقم الفاتورة' 
      });
    }

    const budget = await Budget.findOne();
    
    if (!budget || !budget.financialBook) {
      return res.status(404).json({ 
        ok: false, 
        message: 'لا توجد بيانات ميزانية' 
      });
    }

    const yearBook = budget.financialBook.find(y => String(y.year) === year);
    if (!yearBook) {
      return res.status(404).json({ 
        ok: false, 
        message: 'لم يتم العثور على السنة المطلوبة' 
      });
    }

    const monthBook = yearBook.months.find(m => m.name === month && String(m.year) === year);
    if (!monthBook) {
      return res.status(404).json({ 
        ok: false, 
        message: 'لم يتم العثور على الشهر المطلوب' 
      });
    }

    const invoice = monthBook.invoices[parseInt(invoiceIndex)];
    if (!invoice) {
      return res.status(404).json({ 
        ok: false, 
        message: 'لم يتم العثور على الفاتورة' 
      });
    }

    return res.json({
      ok: true,
      invoice: {
        ...invoice,
        period: { year, month },
        totalAmount: (invoice.price || 0) * (invoice.quantity || 1)
      }
    });

  } catch (error) {
    console.error('[Reports] getInvoice error:', error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};

/**
 * طباعة تقرير (إرجاع HTML جاهز للطباعة)
 */
exports.printReport = async (req, res) => {
  try {
    const { type, year, month } = req.query;
    
    // هنا يمكنك إنشاء HTML مخصص للطباعة
    // سنرجع JSON الآن ويمكن تطويره لاحقاً
    
    return res.json({
      ok: true,
      message: 'Print functionality - to be implemented with HTML template'
    });

  } catch (error) {
    console.error('[Reports] printReport error:', error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};

/**
 * تصدير تقرير بصيغة JSON
 */
exports.exportReport = async (req, res) => {
  try {
    const { type, year, month } = req.query;
    
    let reportData;
    
    if (type === 'month' && year && month) {
      // استخدام دالة getMonthReport
      const mockReq = { query: { year, month } };
      const mockRes = {
        json: (data) => { reportData = data; },
        status: () => mockRes
      };
      await exports.getMonthReport(mockReq, mockRes);
    } else if (type === 'year' && year) {
      const mockReq = { query: { year } };
      const mockRes = {
        json: (data) => { reportData = data; },
        status: () => mockRes
      };
      await exports.getYearReport(mockReq, mockRes);
    }

    if (reportData && reportData.ok) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=report_${year}_${month || 'full'}.json`);
      return res.send(JSON.stringify(reportData, null, 2));
    }

    return res.status(404).json({ ok: false, message: 'لم يتم العثور على التقرير' });

  } catch (error) {
    console.error('[Reports] exportReport error:', error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};
