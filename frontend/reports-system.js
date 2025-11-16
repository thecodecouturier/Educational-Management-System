// ═══════════════════════════════════════════════════════
// 📊 نظام التقارير المالية المتقدم
// ═══════════════════════════════════════════════════════

class ReportsSystem {
    constructor() {
        this.apiBaseUrl = '/api/reports';
        this.currentReport = null;
        this.summary = null;
        this.monthsData = {
            'January': 'يناير',
            'February': 'فبراير',
            'March': 'مارس',
            'April': 'أبريل',
            'May': 'مايو',
            'June': 'يونيو',
            'July': 'يوليو',
            'August': 'أغسطس',
            'September': 'سبتمبر',
            'October': 'أكتوبر',
            'November': 'نوفمبر',
            'December': 'ديسمبر'
        };
    }

    // تهيئة النظام
    async init() {
        console.log('📊 تهيئة نظام التقارير...');
        await this.refreshSummary();
    }

    // تحديث ملخص التقارير
    async refreshSummary() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/summary`);
            const data = await response.json();
            
            if (data.ok) {
                this.summary = data.summary;
                this.renderQuickStats();
                this.populateYearSelectors();
                console.log('✅ تم تحديث ملخص التقارير');
            }
        } catch (error) {
            console.error('❌ خطأ في تحديث ملخص التقارير:', error);
            this.showError('فشل تحميل ملخص التقارير');
        }
    }

    // عرض الإحصائيات السريعة
    renderQuickStats() {
        const container = document.getElementById('reports-quick-stats');
        if (!container || !this.summary) return;

        const stats = [
            {
                icon: 'fa-calendar-alt',
                label: 'السنوات المتاحة',
                value: this.summary.availableYears.length,
                color: '#667eea'
            },
            {
                icon: 'fa-file-alt',
                label: 'إجمالي التقارير',
                value: this.summary.totalReports,
                color: '#10b981'
            },
            {
                icon: 'fa-calendar-check',
                label: 'الشهر الحالي',
                value: this.summary.currentMonth ? 
                    this.monthsData[this.summary.currentMonth.monthName] || this.summary.currentMonth.monthName : 
                    'غير متاح',
                color: '#f59e0b'
            },
            {
                icon: 'fa-receipt',
                label: 'الميزانية',
                value: this.summary.budgetAvailable ? 'متاحة' : 'غير متاحة',
                color: this.summary.budgetAvailable ? '#10b981' : '#ef4444'
            }
        ];

        container.innerHTML = stats.map(stat => `
            <div style="background: linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%); 
                        border: 1px solid ${stat.color}30; border-radius: 12px; padding: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 48px; height: 48px; background: ${stat.color}; border-radius: 12px; 
                                display: flex; align-items: center; justify-content: center; color: white;">
                        <i class="fas ${stat.icon}" style="font-size: 1.25rem;"></i>
                    </div>
                    <div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #2d3748; margin-bottom: 0.25rem;">
                            ${stat.value}
                        </div>
                        <div style="font-size: 0.875rem; color: #718096;">
                            ${stat.label}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ملء قوائم اختيار السنوات
    populateYearSelectors() {
        if (!this.summary) return;

        const selectors = [
            'monthly-year-selector',
            'yearly-year-selector',
            'comp-year1-selector',
            'comp-year2-selector',
            'invoice-year-selector'
        ];

        selectors.forEach(selectorId => {
            const select = document.getElementById(selectorId);
            if (select) {
                const currentOptions = select.innerHTML;
                const defaultOption = select.querySelector('option[value=""]');
                
                select.innerHTML = defaultOption ? defaultOption.outerHTML : '<option value="">-- اختر السنة --</option>';
                
                this.summary.availableYears.forEach(yearData => {
                    const option = document.createElement('option');
                    option.value = yearData.year;
                    option.textContent = `${yearData.year} (${yearData.monthsCount} ${yearData.monthsCount === 1 ? 'شهر' : 'شهور'})`;
                    select.appendChild(option);
                });
            }
        });
    }

    // معالجة تغيير نوع التقرير
    handleTypeChange() {
        const reportType = document.getElementById('report-type-selector').value;
        
        // إخفاء جميع الخيارات
        document.querySelectorAll('.report-options').forEach(el => {
            el.style.display = 'none';
        });

        // عرض الخيارات المناسبة
        if (reportType === 'monthly') {
            document.getElementById('monthly-report-options').style.display = 'block';
        } else if (reportType === 'yearly') {
            document.getElementById('yearly-report-options').style.display = 'block';
        } else if (reportType === 'comparison') {
            document.getElementById('comparison-report-options').style.display = 'block';
            this.populateComparisonMonths();
        } else if (reportType === 'invoices') {
            document.getElementById('invoices-report-options').style.display = 'block';
            this.populateInvoiceMonths();
        }

        // مسح منطقة العرض
        this.clearReportDisplay();
    }

    // تحميل الأشهر المتاحة لسنة معينة
    async loadMonthsForYear() {
        const year = document.getElementById('monthly-year-selector').value;
        const monthsGrid = document.getElementById('months-grid');
        
        if (!year || !monthsGrid) return;

        const yearData = this.summary.availableYears.find(y => y.year === year);
        if (!yearData) return;

        // البحث عن الأشهر المتاحة
        const archive = await this.getArchiveData();
        const yearEntry = archive?.monthsArchive?.find(y => y.yearName === year);
        
        if (!yearEntry || !yearEntry.months) {
            monthsGrid.innerHTML = '<p style="text-align: center; color: #a0aec0; padding: 1rem;">لا توجد أشهر متاحة</p>';
            return;
        }

        const months = yearEntry.months;
        monthsGrid.innerHTML = months.map(month => {
            const monthNameAr = this.monthsData[month.monthName] || month.monthName;
            return `
                <button class="month-btn" onclick="reportsSystem.loadMonthReport('${year}', '${month.monthName}')" 
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                               color: white; border: none; border-radius: 8px; padding: 0.75rem; 
                               font-size: 0.875rem; font-weight: 600; cursor: pointer; 
                               transition: transform 0.2s, box-shadow 0.2s;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102,126,234,0.4)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <div>${monthNameAr}</div>
                    <div style="font-size: 0.75rem; opacity: 0.9; margin-top: 0.25rem;">
                        ${this.formatCurrency(month.revenue || 0)}
                    </div>
                </button>
            `;
        }).join('');
    }

    // تحميل تقرير شهري
    async loadMonthReport(year, month) {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiBaseUrl}/month?year=${year}&month=${month}`);
            const data = await response.json();
            
            if (data.ok) {
                this.currentReport = { type: 'monthly', data: data.report };
                this.renderMonthReport(data.report);
                this.showActionButtons();
            } else {
                this.showError(data.message || 'فشل تحميل التقرير');
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل التقرير الشهري:', error);
            this.showError('حدث خطأ أثناء تحميل التقرير');
        }
    }

    // عرض تقرير شهري
    renderMonthReport(report) {
        const monthNameAr = this.monthsData[report.period.month] || report.period.month;
        document.getElementById('report-title').textContent = `تقرير ${monthNameAr} ${report.period.year}`;
        
        const displayArea = document.getElementById('report-display-area');
        displayArea.innerHTML = `
            <!-- ملخص مالي -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; border-radius: 16px; padding: 2rem; margin-bottom: 2rem;">
                <h2 style="margin: 0 0 1.5rem; font-size: 1.75rem; font-weight: 700;">
                    <i class="fas fa-chart-line"></i> الملخص المالي
                </h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                    <div>
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">إجمالي الإيرادات</div>
                        <div style="font-size: 2rem; font-weight: 800;">${this.formatCurrency(report.financial.revenue)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">إجمالي المصروفات</div>
                        <div style="font-size: 2rem; font-weight: 800;">${this.formatCurrency(report.financial.expenses)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">صافي الربح</div>
                        <div style="font-size: 2rem; font-weight: 800;">${this.formatCurrency(report.financial.netProfit)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">هامش الربح</div>
                        <div style="font-size: 2rem; font-weight: 800;">${report.financial.profitMargin}%</div>
                    </div>
                </div>
            </div>

            <!-- تحليل المعلمين -->
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
                <h3 style="margin: 0 0 1.5rem; color: #2d3748; font-size: 1.25rem;">
                    <i class="fas fa-users"></i> تحليل أداء المعلمين
                </h3>
                <div style="margin-bottom: 1rem; padding: 1rem; background: #f7fafc; border-radius: 8px;">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; text-align: center;">
                        <div>
                            <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.25rem;">إجمالي المعلمين</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #2d3748;">${report.statistics.totalTeachers}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.25rem;">المعلمون النشطون</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">${report.statistics.activeTeachers}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.25rem;">متوسط الإيراد لكل معلم</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #667eea;">${this.formatCurrency(report.statistics.averageRevenuePerTeacher)}</div>
                        </div>
                    </div>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 0.75rem; text-align: right; font-weight: 600; color: #4a5568;">المعلم</th>
                                <th style="padding: 0.75rem; text-align: center; font-weight: 600; color: #4a5568;">الإيرادات</th>
                                <th style="padding: 0.75rem; text-align: center; font-weight: 600; color: #4a5568;">حصة المعلم</th>
                                <th style="padding: 0.75rem; text-align: center; font-weight: 600; color: #4a5568;">حصة المركز</th>
                                <th style="padding: 0.75rem; text-align: center; font-weight: 600; color: #4a5568;">نسبة المركز</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${report.teachers.map((teacher, index) => `
                                <tr style="border-bottom: 1px solid #e2e8f0; ${teacher.revenue > 0 ? 'background: white;' : 'background: #f7fafc; opacity: 0.6;'}">
                                    <td style="padding: 0.75rem;">
                                        <div style="font-weight: 600; color: #2d3748;">${teacher.teacherName}</div>
                                        <div style="font-size: 0.75rem; color: #a0aec0;">${teacher.teacherId}</div>
                                    </td>
                                    <td style="padding: 0.75rem; text-align: center; font-weight: 600; color: ${teacher.revenue > 0 ? '#10b981' : '#a0aec0'};">
                                        ${this.formatCurrency(teacher.revenue)}
                                    </td>
                                    <td style="padding: 0.75rem; text-align: center; color: #4a5568;">
                                        ${this.formatCurrency(teacher.teacherShare)}
                                    </td>
                                    <td style="padding: 0.75rem; text-align: center; color: #4a5568;">
                                        ${this.formatCurrency(teacher.centerShare)}
                                    </td>
                                    <td style="padding: 0.75rem; text-align: center;">
                                        <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                                     color: white; padding: 0.25rem 0.75rem; border-radius: 12px; 
                                                     font-size: 0.875rem; font-weight: 600;">
                                            ${teacher.centerPercentage}%
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- تحليل المصروفات -->
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;">
                <h3 style="margin: 0 0 1.5rem; color: #2d3748; font-size: 1.25rem;">
                    <i class="fas fa-wallet"></i> تحليل المصروفات (${report.expenses.invoicesCount} فاتورة)
                </h3>
                ${report.expenses.categories.length > 0 ? `
                    <div style="display: grid; gap: 1rem;">
                        ${report.expenses.categories.map(cat => `
                            <div style="background: #f7fafc; border-radius: 8px; padding: 1rem; border-right: 4px solid #667eea;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                                    <div>
                                        <div style="font-weight: 700; color: #2d3748; font-size: 1.125rem;">${cat.category}</div>
                                        <div style="font-size: 0.875rem; color: #718096; margin-top: 0.25rem;">${cat.count} ${cat.count === 1 ? 'فاتورة' : 'فواتير'}</div>
                                    </div>
                                    <div style="text-align: left;">
                                        <div style="font-size: 1.5rem; font-weight: 800; color: #ef4444;">${this.formatCurrency(cat.total)}</div>
                                        <div style="font-size: 0.75rem; color: #a0aec0; margin-top: 0.25rem;">
                                            ${((cat.total / report.financial.expenses) * 100).toFixed(1)}% من الإجمالي
                                        </div>
                                    </div>
                                </div>
                                <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                                    <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); 
                                               height: 100%; width: ${(cat.total / report.financial.expenses) * 100}%;
                                               transition: width 0.3s;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <p style="text-align: center; color: #a0aec0; padding: 2rem;">لا توجد مصروفات مسجلة</p>
                `}
            </div>
        `;
    }

    // تحميل تقرير سنوي
    async loadYearReport() {
        const year = document.getElementById('yearly-year-selector').value;
        
        if (!year) {
            this.showError('الرجاء اختيار السنة');
            return;
        }

        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiBaseUrl}/year?year=${year}`);
            const data = await response.json();
            
            if (data.ok) {
                this.currentReport = { type: 'yearly', data: data.report };
                this.renderYearReport(data.report);
                this.showActionButtons();
            } else {
                this.showError(data.message || 'فشل تحميل التقرير');
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل التقرير السنوي:', error);
            this.showError('حدث خطأ أثناء تحميل التقرير');
        }
    }

    // عرض تقرير سنوي
    renderYearReport(report) {
        document.getElementById('report-title').textContent = `تقرير السنة ${report.period.year}`;
        
        const displayArea = document.getElementById('report-display-area');
        displayArea.innerHTML = `
            <!-- ملخص السنة -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                        color: white; border-radius: 16px; padding: 2rem; margin-bottom: 2rem;">
                <h2 style="margin: 0 0 1.5rem; font-size: 1.75rem; font-weight: 700;">
                    <i class="fas fa-calendar-alt"></i> ملخص السنة ${report.period.year}
                </h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem;">
                    <div>
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">الإيرادات السنوية</div>
                        <div style="font-size: 2rem; font-weight: 800;">${this.formatCurrency(report.financial.revenue)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">المصروفات السنوية</div>
                        <div style="font-size: 2rem; font-weight: 800;">${this.formatCurrency(report.financial.expenses)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">صافي الربح</div>
                        <div style="font-size: 2rem; font-weight: 800;">${this.formatCurrency(report.financial.netProfit)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">هامش الربح</div>
                        <div style="font-size: 2rem; font-weight: 800;">${report.financial.profitMargin}%</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">متوسط الإيرادات الشهرية</div>
                        <div style="font-size: 1.5rem; font-weight: 700;">${this.formatCurrency(report.financial.averageMonthlyRevenue)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">متوسط المصروفات الشهرية</div>
                        <div style="font-size: 1.5rem; font-weight: 700;">${this.formatCurrency(report.financial.averageMonthlyExpenses)}</div>
                    </div>
                </div>
            </div>

            <!-- أفضل المعلمين -->
            ${report.teachers.top.length > 0 ? `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
                    <h3 style="margin: 0 0 1.5rem; color: #2d3748; font-size: 1.25rem;">
                        <i class="fas fa-trophy"></i> أفضل 5 معلمين في ${report.period.year}
                    </h3>
                    <div style="display: grid; gap: 1rem;">
                        ${report.teachers.top.map((teacher, index) => {
                            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                            return `
                                <div style="background: linear-gradient(135deg, ${index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : index === 2 ? '#f97316' : '#e5e7eb'}15 0%, ${index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : index === 2 ? '#f97316' : '#e5e7eb'}05 100%); 
                                            border: 1px solid ${index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : index === 2 ? '#f97316' : '#e5e7eb'}40; 
                                            border-radius: 12px; padding: 1.25rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div style="display: flex; align-items: center; gap: 1rem;">
                                            <div style="font-size: 2.5rem;">${medals[index]}</div>
                                            <div>
                                                <div style="font-weight: 700; font-size: 1.125rem; color: #2d3748;">${teacher.teacherName}</div>
                                                <div style="font-size: 0.875rem; color: #718096; margin-top: 0.25rem;">
                                                    حصة المعلم: ${this.formatCurrency(teacher.totalTeacherShare)} | 
                                                    حصة المركز: ${this.formatCurrency(teacher.totalCenterShare)}
                                                </div>
                                            </div>
                                        </div>
                                        <div style="text-align: left;">
                                            <div style="font-size: 1.75rem; font-weight: 800; color: #10b981;">
                                                ${this.formatCurrency(teacher.totalRevenue)}
                                            </div>
                                            <div style="font-size: 0.75rem; color: #a0aec0; margin-top: 0.25rem;">
                                                إجمالي الإيرادات
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- التوزيع الشهري -->
            ${report.monthly.breakdown.length > 0 ? `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
                    <h3 style="margin: 0 0 1.5rem; color: #2d3748; font-size: 1.25rem;">
                        <i class="fas fa-chart-bar"></i> التوزيع الشهري (${report.monthly.monthsCount} ${report.monthly.monthsCount === 1 ? 'شهر' : 'شهور'})
                    </h3>
                    
                    ${report.monthly.bestMonth && report.monthly.worstMonth ? `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                            <div style="background: linear-gradient(135deg, #10b98115 0%, #10b98105 100%); 
                                        border: 1px solid #10b98130; border-radius: 8px; padding: 1rem;">
                                <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.5rem;">أفضل شهر</div>
                                <div style="font-weight: 700; font-size: 1.125rem; color: #10b981;">
                                    ${this.monthsData[report.monthly.bestMonth.month] || report.monthly.bestMonth.month}
                                </div>
                                <div style="font-size: 0.875rem; color: #4a5568; margin-top: 0.25rem;">
                                    إيرادات: ${this.formatCurrency(report.monthly.bestMonth.revenue)}
                                </div>
                            </div>
                            <div style="background: linear-gradient(135deg, #ef444415 0%, #ef444405 100%); 
                                        border: 1px solid #ef444430; border-radius: 8px; padding: 1rem;">
                                <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.5rem;">أضعف شهر</div>
                                <div style="font-weight: 700; font-size: 1.125rem; color: #ef4444;">
                                    ${this.monthsData[report.monthly.worstMonth.month] || report.monthly.worstMonth.month}
                                </div>
                                <div style="font-size: 0.875rem; color: #4a5568; margin-top: 0.25rem;">
                                    إيرادات: ${this.formatCurrency(report.monthly.worstMonth.revenue)}
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
                                    <th style="padding: 0.75rem; text-align: right; font-weight: 600; color: #4a5568;">الشهر</th>
                                    <th style="padding: 0.75rem; text-align: center; font-weight: 600; color: #4a5568;">الإيرادات</th>
                                    <th style="padding: 0.75rem; text-align: center; font-weight: 600; color: #4a5568;">المصروفات</th>
                                    <th style="padding: 0.75rem; text-align: center; font-weight: 600; color: #4a5568;">الربح</th>
                                    <th style="padding: 0.75rem; text-align: center; font-weight: 600; color: #4a5568;">المعلمون</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${report.monthly.breakdown.map(month => `
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="padding: 0.75rem; font-weight: 600; color: #2d3748;">
                                            ${this.monthsData[month.month] || month.month}
                                        </td>
                                        <td style="padding: 0.75rem; text-align: center; color: #10b981; font-weight: 600;">
                                            ${this.formatCurrency(month.revenue)}
                                        </td>
                                        <td style="padding: 0.75rem; text-align: center; color: #ef4444; font-weight: 600;">
                                            ${this.formatCurrency(month.expenses)}
                                        </td>
                                        <td style="padding: 0.75rem; text-align: center; color: ${month.netProfit >= 0 ? '#10b981' : '#ef4444'}; font-weight: 600;">
                                            ${this.formatCurrency(month.netProfit)}
                                        </td>
                                        <td style="padding: 0.75rem; text-align: center; color: #4a5568;">
                                            ${month.teachersCount}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}

            <!-- تحليل المصروفات السنوية -->
            ${report.expenses.categories.length > 0 ? `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;">
                    <h3 style="margin: 0 0 1.5rem; color: #2d3748; font-size: 1.25rem;">
                        <i class="fas fa-wallet"></i> المصروفات حسب الفئات (${report.expenses.totalInvoices} فاتورة)
                    </h3>
                    <div style="display: grid; gap: 1rem;">
                        ${report.expenses.categories.map(cat => `
                            <div style="background: #f7fafc; border-radius: 8px; padding: 1rem; border-right: 4px solid #ef4444;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-weight: 700; color: #2d3748; font-size: 1.125rem;">${cat.category}</div>
                                        <div style="font-size: 0.875rem; color: #718096; margin-top: 0.25rem;">${cat.count} ${cat.count === 1 ? 'فاتورة' : 'فواتير'}</div>
                                    </div>
                                    <div style="text-align: left;">
                                        <div style="font-size: 1.5rem; font-weight: 800; color: #ef4444;">${this.formatCurrency(cat.total)}</div>
                                        <div style="font-size: 0.75rem; color: #a0aec0; margin-top: 0.25rem;">
                                            ${((cat.total / report.financial.expenses) * 100).toFixed(1)}% من الإجمالي
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    // ملء قوائم الأشهر للمقارنة
    populateComparisonMonths() {
        const monthOptions = Object.entries(this.monthsData).map(([en, ar]) => 
            `<option value="${en}">${ar}</option>`
        ).join('');

        ['comp-month1-selector', 'comp-month2-selector'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.innerHTML = '<option value="">الشهر (اختياري)</option>' + monthOptions;
            }
        });
    }

    // ملء قوائم الأشهر للفواتير
    populateInvoiceMonths() {
        const monthOptions = Object.entries(this.monthsData).map(([en, ar]) => 
            `<option value="${en}">${ar}</option>`
        ).join('');

        const select = document.getElementById('invoice-month-selector');
        if (select) {
            select.innerHTML = '<option value="">-- اختر الشهر --</option>' + monthOptions;
        }
    }

    // تحميل تقرير مقارن
    async loadComparisonReport() {
        const year1 = document.getElementById('comp-year1-selector').value;
        const month1 = document.getElementById('comp-month1-selector').value;
        const year2 = document.getElementById('comp-year2-selector').value;
        const month2 = document.getElementById('comp-month2-selector').value;

        if (!year1 || !year2) {
            this.showError('الرجاء اختيار السنتين للمقارنة');
            return;
        }

        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                startYear: year1,
                endYear: year2
            });
            
            if (month1) params.append('startMonth', month1);
            if (month2) params.append('endMonth', month2);

            const response = await fetch(`${this.apiBaseUrl}/comparison?${params}`);
            const data = await response.json();
            
            if (data.ok) {
                this.currentReport = { type: 'comparison', data: data.comparison };
                this.renderComparisonReport(data.comparison);
                this.showActionButtons();
            } else {
                this.showError(data.message || 'فشل تحميل المقارنة');
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل تقرير المقارنة:', error);
            this.showError('حدث خطأ أثناء تحميل المقارنة');
        }
    }

    // عرض تقرير المقارنة
    renderComparisonReport(comparison) {
        const p1 = comparison.periods.period1;
        const p2 = comparison.periods.period2;
        
        const period1Name = p1.month ? 
            `${this.monthsData[p1.month]} ${p1.year}` : 
            `السنة ${p1.year}`;
        const period2Name = p2.month ? 
            `${this.monthsData[p2.month]} ${p2.year}` : 
            `السنة ${p2.year}`;

        document.getElementById('report-title').textContent = `مقارنة: ${period1Name} vs ${period2Name}`;
        
        const getTrendIcon = (trend) => trend === 'up' ? '📈' : '📉';
        const getTrendColor = (trend, isGood = true) => {
            if (trend === 'up') return isGood ? '#10b981' : '#ef4444';
            return isGood ? '#ef4444' : '#10b981';
        };

        const displayArea = document.getElementById('report-display-area');
        displayArea.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; border-radius: 16px; padding: 2rem; margin-bottom: 2rem;">
                <h2 style="margin: 0 0 1rem; font-size: 1.75rem; font-weight: 700;">
                    <i class="fas fa-balance-scale"></i> تحليل المقارنة
                </h2>
                <div style="font-size: 1.125rem; opacity: 0.95;">
                    ${comparison.summary.recommendation}
                </div>
            </div>

            <div style="display: grid; gap: 1.5rem;">
                <!-- مقارنة الإيرادات -->
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;">
                    <h3 style="margin: 0 0 1.5rem; color: #2d3748; font-size: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
                        ${getTrendIcon(comparison.data.revenue.trend)} الإيرادات
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem;">
                        <div>
                            <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.5rem;">${period1Name}</div>
                            <div style="font-size: 1.75rem; font-weight: 700; color: #4a5568;">
                                ${this.formatCurrency(comparison.data.revenue.period1)}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.5rem;">${period2Name}</div>
                            <div style="font-size: 1.75rem; font-weight: 700; color: #4a5568;">
                                ${this.formatCurrency(comparison.data.revenue.period2)}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.5rem;">التغير</div>
                            <div style="font-size: 1.75rem; font-weight: 700; color: ${getTrendColor(comparison.data.revenue.trend, true)};">
                                ${comparison.data.revenue.change > 0 ? '+' : ''}${comparison.data.revenue.change}%
                            </div>
                        </div>
                    </div>
                </div>

                <!-- مقارنة المصروفات -->
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;">
                    <h3 style="margin: 0 0 1.5rem; color: #2d3748; font-size: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
                        ${getTrendIcon(comparison.data.expenses.trend)} المصروفات
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem;">
                        <div>
                            <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.5rem;">${period1Name}</div>
                            <div style="font-size: 1.75rem; font-weight: 700; color: #4a5568;">
                                ${this.formatCurrency(comparison.data.expenses.period1)}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.5rem;">${period2Name}</div>
                            <div style="font-size: 1.75rem; font-weight: 700; color: #4a5568;">
                                ${this.formatCurrency(comparison.data.expenses.period2)}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.5rem;">التغير</div>
                            <div style="font-size: 1.75rem; font-weight: 700; color: ${getTrendColor(comparison.data.expenses.trend, false)};">
                                ${comparison.data.expenses.change > 0 ? '+' : ''}${comparison.data.expenses.change}%
                            </div>
                        </div>
                    </div>
                </div>

                <!-- مقارنة الأرباح -->
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;">
                    <h3 style="margin: 0 0 1.5rem; color: #2d3748; font-size: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
                        ${getTrendIcon(comparison.data.netProfit.trend)} صافي الربح
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem;">
                        <div>
                            <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.5rem;">${period1Name}</div>
                            <div style="font-size: 1.75rem; font-weight: 700; color: ${comparison.data.netProfit.period1 >= 0 ? '#10b981' : '#ef4444'};">
                                ${this.formatCurrency(comparison.data.netProfit.period1)}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.5rem;">${period2Name}</div>
                            <div style="font-size: 1.75rem; font-weight: 700; color: ${comparison.data.netProfit.period2 >= 0 ? '#10b981' : '#ef4444'};">
                                ${this.formatCurrency(comparison.data.netProfit.period2)}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.5rem;">نمو الربح</div>
                            <div style="font-size: 1.75rem; font-weight: 700; color: ${getTrendColor(comparison.data.netProfit.trend, true)};">
                                ${comparison.data.netProfit.change > 0 ? '+' : ''}${comparison.data.netProfit.change}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // عرض جميع الفواتير
    async showAllInvoices() {
        const year = document.getElementById('invoice-year-selector').value;
        const month = document.getElementById('invoice-month-selector').value;

        if (!year || !month) {
            this.showError('الرجاء اختيار السنة والشهر');
            return;
        }

        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiBaseUrl}/month?year=${year}&month=${month}`);
            const data = await response.json();
            
            if (data.ok && data.report.expenses.invoices) {
                this.currentReport = { type: 'invoices', data: { year, month, invoices: data.report.expenses.invoices } };
                this.renderInvoicesList(year, month, data.report.expenses.invoices);
                this.showActionButtons();
            } else {
                this.showError('لا توجد فواتير لهذه الفترة');
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل الفواتير:', error);
            this.showError('حدث خطأ أثناء تحميل الفواتير');
        }
    }

    // عرض قائمة الفواتير
    renderInvoicesList(year, month, invoices) {
        const monthNameAr = this.monthsData[month] || month;
        document.getElementById('report-title').textContent = `فواتير ${monthNameAr} ${year}`;
        
        const displayArea = document.getElementById('report-display-area');
        
        if (invoices.length === 0) {
            displayArea.innerHTML = `
                <div style="text-align: center; padding: 4rem 2rem; color: #a0aec0;">
                    <i class="fas fa-receipt" style="font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.3;"></i>
                    <h3 style="margin: 0 0 0.5rem; color: #718096;">لا توجد فواتير</h3>
                    <p style="margin: 0; font-size: 0.95rem;">لم يتم تسجيل أي فواتير لهذه الفترة</p>
                </div>
            `;
            return;
        }

        const totalAmount = invoices.reduce((sum, inv) => sum + ((inv.price || 0) * (inv.quantity || 1)), 0);

        displayArea.innerHTML = `
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                        color: white; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700;">
                            <i class="fas fa-receipt"></i> ${invoices.length} ${invoices.length === 1 ? 'فاتورة' : 'فواتير'}
                        </h2>
                        <div style="margin-top: 0.5rem; font-size: 0.95rem; opacity: 0.95;">
                            ${monthNameAr} ${year}
                        </div>
                    </div>
                    <div style="text-align: left;">
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.25rem;">الإجمالي</div>
                        <div style="font-size: 2rem; font-weight: 800;">${this.formatCurrency(totalAmount)}</div>
                    </div>
                </div>
            </div>

            <div style="display: grid; gap: 1rem;">
                ${invoices.map((invoice, index) => {
                    const amount = (invoice.price || 0) * (invoice.quantity || 1);
                    return `
                        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem;
                                    transition: all 0.2s; cursor: pointer;"
                             onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.transform='translateY(-2px)';"
                             onmouseout="this.style.boxShadow='none'; this.style.transform='translateY(0)';">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                                        <div style="background: ${invoice.billType === 'recurring' ? '#667eea' : '#10b981'}; 
                                                    color: white; padding: 0.25rem 0.75rem; border-radius: 12px; 
                                                    font-size: 0.75rem; font-weight: 600;">
                                            ${invoice.billType === 'recurring' ? 'ثابتة' : 'متغيرة'}
                                        </div>
                                        <div style="background: #f7fafc; color: #4a5568; padding: 0.25rem 0.75rem; 
                                                    border-radius: 12px; font-size: 0.75rem;">
                                            ${invoice.category || 'غير مصنف'}
                                        </div>
                                    </div>
                                    <h4 style="margin: 0 0 0.5rem; color: #2d3748; font-size: 1.125rem; font-weight: 700;">
                                        ${invoice.name || 'بدون اسم'}
                                    </h4>
                                    ${invoice.notes ? `
                                        <div style="font-size: 0.875rem; color: #718096; margin-top: 0.5rem;">
                                            <i class="fas fa-note-sticky"></i> ${invoice.notes}
                                        </div>
                                    ` : ''}
                                    <div style="font-size: 0.75rem; color: #a0aec0; margin-top: 0.5rem;">
                                        <i class="fas fa-calendar"></i> ${new Date(invoice.createdAt).toLocaleDateString('ar-EG')}
                                    </div>
                                </div>
                                <div style="text-align: left;">
                                    <div style="font-size: 1.75rem; font-weight: 800; color: #ef4444;">
                                        ${this.formatCurrency(amount)}
                                    </div>
                                    <div style="font-size: 0.875rem; color: #718096; margin-top: 0.25rem;">
                                        ${invoice.quantity} × ${this.formatCurrency(invoice.price)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // جلب بيانات Archive
    async getArchiveData() {
        try {
            const response = await fetch('/api/archive');
            const data = await response.json();
            return data.ok ? data.archive : null;
        } catch (error) {
            console.error('❌ خطأ في جلب بيانات Archive:', error);
            return null;
        }
    }

    // عرض رسالة تحميل
    showLoading() {
        const displayArea = document.getElementById('report-display-area');
        displayArea.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem; color: #667eea;">
                <div style="width: 60px; height: 60px; border: 4px solid #e6f0ff; border-top: 4px solid #667eea; 
                            border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem;"></div>
                <h3 style="margin: 0 0 0.5rem; color: #4a5568;">جاري تحميل التقرير...</h3>
                <p style="margin: 0; font-size: 0.95rem; color: #a0aec0;">الرجاء الانتظار</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    // عرض رسالة خطأ
    showError(message) {
        const displayArea = document.getElementById('report-display-area');
        displayArea.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem; color: #ef4444;">
                <i class="fas fa-exclamation-circle" style="font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.5;"></i>
                <h3 style="margin: 0 0 0.5rem; color: #dc2626;">حدث خطأ</h3>
                <p style="margin: 0; font-size: 0.95rem; color: #f87171;">${message}</p>
            </div>
        `;
        this.hideActionButtons();
    }

    // مسح منطقة العرض
    clearReportDisplay() {
        const displayArea = document.getElementById('report-display-area');
        displayArea.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem; color: #a0aec0;">
                <i class="fas fa-chart-pie" style="font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.3;"></i>
                <h3 style="margin: 0 0 0.5rem; color: #718096;">اختر تقريراً للعرض</h3>
                <p style="margin: 0; font-size: 0.95rem;">استخدم القائمة الجانبية لاختيار نوع التقرير والفترة الزمنية</p>
            </div>
        `;
        this.hideActionButtons();
    }

    // إظهار أزرار الإجراءات
    showActionButtons() {
        document.getElementById('print-report-btn').style.display = 'inline-flex';
        document.getElementById('export-report-btn').style.display = 'inline-flex';
    }

    // إخفاء أزرار الإجراءات
    hideActionButtons() {
        document.getElementById('print-report-btn').style.display = 'none';
        document.getElementById('export-report-btn').style.display = 'none';
    }

    // طباعة التقرير الحالي
    printCurrentReport() {
        if (!this.currentReport) {
            alert('لا يوجد تقرير لطباعته');
            return;
        }

        window.print();
    }

    // تصدير التقرير الحالي
    async exportCurrentReport() {
        if (!this.currentReport) {
            alert('لا يوجد تقرير لتصديره');
            return;
        }

        try {
            let url = '';
            const type = this.currentReport.type;
            
            if (type === 'monthly') {
                const { period } = this.currentReport.data;
                url = `${this.apiBaseUrl}/export?type=month&year=${period.year}&month=${period.month}`;
            } else if (type === 'yearly') {
                const { period } = this.currentReport.data;
                url = `${this.apiBaseUrl}/export?type=year&year=${period.year}`;
            }

            if (url) {
                window.open(url, '_blank');
            } else {
                alert('لا يمكن تصدير هذا النوع من التقارير حالياً');
            }
        } catch (error) {
            console.error('❌ خطأ في تصدير التقرير:', error);
            alert('حدث خطأ أثناء تصدير التقرير');
        }
    }

    // عرض نافذة التصدير
    showExportDialog() {
        alert('ميزة التصدير قيد التطوير');
    }

    // تنسيق العملة
    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }
}

// تهيئة النظام عند تحميل الصفحة
const reportsSystem = new ReportsSystem();

// دالة يتم استدعاؤها عند التبديل لتبويب التقارير
function initializeReportsTab() {
    if (!reportsSystem.summary) {
        reportsSystem.init();
    }
}
