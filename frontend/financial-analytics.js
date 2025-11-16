// 💰 نظام التحليلات المالية المتقدم

class FinancialAnalyticsManager {
    constructor() {
        this.charts = {};
        this.currentTab = 'dashboard';
        this.apiBaseUrl = '/api/financial-analytics';
        this.currentData = {};
        this.dailyRevenueTracker = {
            monthlyData: [],
            targetDaily: 0,
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear()
        };
        // cache / preload for archive month to reduce perceived latency
        this.archivePreloadPromise = null;
        this.archiveMonthCache = null;
    this.archiveLastKey = null; // small fingerprint of last applied month
    this.archiveWatcherInterval = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 تهيئة نظام التحليلات المالية...');
        
        // عرض حالة النظام
        this.showSystemStatus();
        
        // إعداد التبويبات
        this.setupTabs();
        
        // تحديد التبويب النشط
        this.switchTab('dashboard');
        // بدء تحميل بيانات الأرشيف في الخلفية الآن (قبل جلب بيانات اللوحة) لتقليل زمن الانتظار
        this.archivePreloadPromise = this.fetchArchiveCurrentMonth()
            .then(m => { this.archiveMonthCache = m; return m; })
            .catch(err => { console.warn('⚠️ preload fetchArchiveCurrentMonth failed', err); return null; });

        // حاول عرض بطاقة حالة الميزانية مبكراً - ستستخدم الكاش أو ستنتظر الـ preload إن لم يكتمل بعد
        try { this.renderBudgetNetProfitCard(); } catch (e) { console.warn('⚠️ initial renderBudgetNetProfitCard failed', e); }

        // تحميل البيانات الأولية (يجري بالتوازي مع طلب الأرشيف الذي بدأ أعلاه)
        await this.loadDashboardData();

        // إعداد أحداث النماذج
        this.setupEventListeners();
        
        // تحديث دوري كل 30 دقيقة (وليس 5 دقائق لتجنب الحمولة الزائدة)
        setInterval(() => {
            if (this.currentTab === 'dashboard') {
                console.log('🔄 تحديث دوري للتحليلات المالية...');
                this.loadDashboardData();
            }
        }, 30 * 60 * 1000); // كل 30 دقيقة

        // ابدأ مراقب الأرشيف ليحدث البطاقة عند تغيير بيانات الأرشيف
        this.startArchiveWatcher();
        
        console.log('✅ تم تهيئة نظام التحليلات المالية بنجاح');
    }

    // 📋 إعداد التبويبات
    setupTabs() {
        console.log('📋 إعداد التبويبات...');
        
        // إضافة أحداث النقر على التبويبات
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab') || e.target.closest('.tab-btn').getAttribute('data-tab');
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });
    }

    // عرض حالة النظام
    async showSystemStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/real-data/quick-stats`);

            // Safely parse JSON: check content-type and guard parse errors
            let data = null;
            try {
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    // fallback: try to parse text as JSON, but don't throw if it's not JSON
                    const txt = await response.text();
                    try { data = JSON.parse(txt); } catch (e) {
                        console.warn('⚠️ showSystemStatus: response not JSON:', txt?.substring?.(0,200));
                        data = null;
                    }
                }
            } catch (err) {
                console.warn('⚠️ showSystemStatus: failed to parse response JSON', err);
                data = null;
            }

            const statusBadge = document.createElement('div');
            statusBadge.id = 'system-status-badge';
            statusBadge.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 1000;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                color: white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
            `;
            // If the parsed response indicates real data, show green badge; otherwise show experimental badge
            if (data && data.success && data.realData) {
                statusBadge.style.background = 'linear-gradient(135deg, #38a169, #22543d)';
                statusBadge.innerHTML = `
                    <i class="fas fa-database"></i> بيانات حقيقية نشطة
                    <div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">
                        ${data.data?.revenue?.expected || 0} جنيه متوقع | ${data.data?.breakdown?.length || 0} مجموعة
                    </div>
                `;
            } else {
                statusBadge.style.background = 'linear-gradient(135deg, #e53e3e, #742a2a)';
                statusBadge.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i> بيانات تجريبية
                    <div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">
                        النظام يعمل ببيانات وهمية للعرض
                    </div>
                `;
            }
            
            document.body.appendChild(statusBadge);
            
            // إزالة البادج بعد 10 ثوان
            setTimeout(() => {
                if (document.getElementById('system-status-badge')) {
                    statusBadge.style.opacity = '0.6';
                    statusBadge.style.transform = 'scale(0.8)';
                }
            }, 10000);
            
        } catch (error) {
            console.error('❌ خطأ في فحص حالة النظام:', error);
        }
    }

    setupEventListeners() {
        // budget plan forms removed — no event listeners attached

        // نموذج المعاملة المالية
        const transactionForm = document.getElementById('transaction-modal-form');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        }
        // نموذج اشتراك المدرس
        const teacherSubForm = document.getElementById('teacher-subscription-form');
        if (teacherSubForm) {
            // pass the event into the handler to avoid relying on a global `event` variable
            teacherSubForm.addEventListener('submit', (e) => { e.preventDefault(); saveTeacherSubscription(e); });
        }
    }

    // 🔄 تبديل التبويبات
    switchTab(tabName) {
        console.log(`🔄 تبديل إلى تبويب: ${tabName}`);
        
        // إيقاف التراكر المباشر إذا كان يعمل وننتقل من تبويب الميزانية
        if (this.currentTab === 'budget' && tabName !== 'budget') {
            stopLiveBudgetTracker();
        }
        
        // إزالة الفئة النشطة من جميع التبويبات
        document.querySelectorAll('.analytics-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // تفعيل التبويب المحدد
        const activeTab = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
        const activeContent = document.getElementById(`${tabName}-tab`);
        
        if (activeTab && activeContent) {
            activeTab.classList.add('active');
            activeContent.classList.add('active');
        }
        
        this.currentTab = tabName;
        
        // تحميل بيانات التبويب
        this.loadTabData(tabName);
    }

    async loadTabData(tabName) {
        try {
            switch (tabName) {
                case 'dashboard':
                    await this.loadDashboardData();
                    break;
                case 'reports':
                    await this.loadReportsData();
                    break;
                case 'budget':
                    await this.loadBudgetData();
                    break;
                case 'transactions':
                    await this.loadTeachersSubscriptionsData();
                    break;
            }
        } catch (error) {
            console.error(`خطأ في تحميل بيانات التبويب ${tabName}:`, error);
            this.showAlert('حدث خطأ في تحميل البيانات', 'danger');
        }
    }

    // 📊 تحميل بيانات لوحة المؤشرات (Dashboard Module - النسخة المحسّنة)
    async loadDashboardData() {
        try {
            console.log('� جاري جلب بيانات التحليلات المالية...');
            
            const response = await fetch(`${this.apiBaseUrl}/dashboard`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ تم جلب البيانات بنجاح:', data);
                this.currentData.dashboard = data.data;
                await this.updateAllMetrics(data.data);
                // تحديث بطاقة معدل النمو فوراً من الأرشيف قبل بدء المراقب
                await this.loadGrowthDataFromArchive();
                // ثم ابدأ مراقب الأرشيف لتحديث بطاقة معدل النمو تلقائياً عند تغيّر بيانات السنوات
                this.startArchiveGrowthWatcher();
            } else {
                throw new Error('فشل في جلب البيانات');
            }
            
        } catch (error) {
            console.error('❌ خطأ في جلب البيانات:', error);
            this.showErrorMessage('حدث خطأ في الاتصال بالخادم');
        }
    }

    // 🎯 تحديث جميع المؤشرات (Dashboard Module - النسخة المحسّنة من dashboard-analytics-connector.js)
    async updateAllMetrics(data) {
        console.log('🎯 بدء تحديث جميع المؤشرات...');
        
        if (!data) {
            console.error('❌ لا توجد بيانات');
            return;
        }
        
        // تحديث المؤشرات الأساسية
        this.updateMonthlyRevenue(data);
        this.updateCollectionRate(data);
        this.updateGrowthRate(data);
        this.updateDateInfo(data);
        
    // حالة الميزانية محذوفة — لم يعد يتم تحديثها هنا
        
        // تحديث جدول المجموعات الأكثر ربحية
        await this.updateTopGroupsFromAPI(data);
        
        // رسم الرسوم البيانية المحسّنة
        this.drawRevenueChart(data);
        this.drawCollectionChart(data);
        this.drawGrowthChart(data);
        
        console.log('✅ تم تحديث جميع المؤشرات بنجاح');
    }

    // 💰 تحديث مؤشر الإيراد التراكمي (Dashboard Module)
    updateMonthlyRevenue(data) {
        const element = document.getElementById('monthly-revenue');
        if (element && data.current && data.current.day) {
            const cumulativeRevenue = data.current.day.cumulativeRevenue || 0;
            element.textContent = `${cumulativeRevenue.toLocaleString('ar-EG')} جنيه`;
            console.log('💰 تم تحديث الإيراد التراكمي:', cumulativeRevenue);
        }
    }

    // 📈 تحديث نسبة التحصيل (Dashboard Module)
    updateCollectionRate(data) {
        const element = document.getElementById('collection-rate');
        if (element && data.current && data.current.day) {
            const collectionRate = data.current.day.collectionRate || 0;
            element.textContent = `${collectionRate.toFixed(2)}%`;
            console.log('📈 تم تحديث نسبة التحصيل:', collectionRate);
            
            // تحديث معلومات نسبة التحصيل
            this.updateCollectionInfo(data);
        }
    }

    // 📊 تحديث معلومات نسبة التحصيل (Dashboard Module)
    updateCollectionInfo(data) {
        const infoElement = document.getElementById('collection-rate-info');
        if (infoElement && data.current) {
            const expectedRevenue = data.current.month.expectedRevenue || 0;
            const collectedRevenue = data.current.day.cumulativeRevenue || 0;
            const remainingRevenue = expectedRevenue - collectedRevenue;
            
            infoElement.innerHTML = `
                <div class="collection-tracking-details">
                    <div class="collection-item">
                        <span class="collection-icon">💰</span>
                        <div class="collection-content">
                            <span class="collection-label">الإيراد المستحق الشهري</span>
                            <span class="collection-value total-due">${expectedRevenue.toLocaleString('ar-EG')} جنيه</span>
                        </div>
                    </div>
                    <div class="collection-item">
                        <span class="collection-icon">✅</span>
                        <div class="collection-content">
                            <span class="collection-label">الإيراد المحصل حتى اليوم</span>
                            <span class="collection-value collected">${collectedRevenue.toLocaleString('ar-EG')} جنيه</span>
                        </div>
                    </div>
                    <div class="collection-item">
                        <span class="collection-icon">⏳</span>
                        <div class="collection-content">
                            <span class="collection-label">الإيراد المتبقي</span>
                            <span class="collection-value remaining">${remainingRevenue.toLocaleString('ar-EG')} جنيه</span>
                        </div>
                    </div>
                </div>
            `;
            
            console.log('📊 تم تحديث معلومات نسبة التحصيل');
        }
    }

    // 📈 حساب معدل النمو السنوي (Dashboard Module)
    calculateGrowthRate(years) {
        if (!years || years.length < 2) {
            return 0;
        }
        
        // ترتيب السنوات تنازلياً (الأحدث أولاً)
        const sortedYears = [...years].sort((a, b) => parseInt(b.id) - parseInt(a.id));
        
        const currentYear = sortedYears[0];
        const previousYear = sortedYears[1];
        
        const currentRevenue = currentYear.annualRevenue || 0;
        const previousRevenue = previousYear.annualRevenue || 0;
        
        if (previousRevenue === 0) {
            return 0;
        }
        
        const growthRate = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
        
        console.log('📈 حساب معدل النمو:', {
            currentYear: currentYear.id,
            currentRevenue,
            previousYear: previousYear.id,
            previousRevenue,
            growthRate: growthRate.toFixed(2)
        });
        
        return growthRate;
    }

    // 📊 تحديث مؤشر معدل النمو (Dashboard Module)
    updateGrowthRate(data) {
        const element = document.getElementById('growth-rate');
        const infoElement = document.getElementById('growth-rate-info');
        // only proceed if years is a non-empty array
        if (!element) return;
        const yearsArr = data && data.all && Array.isArray(data.all.years) ? data.all.years : null;
        if (!yearsArr || yearsArr.length === 0) {
            // no years available -> show neutral placeholder
            element.textContent = '—';
            element.style.color = '#718096';
            if (infoElement) infoElement.innerHTML = '<div style="color:#718096;">لا توجد بيانات سنوية كافية</div>';
            console.log('ℹ️ معدل النمو: لا توجد بيانات سنوية في payload');
            return;
        }

        const growthRate = this.calculateGrowthRate(yearsArr);

        // تحديث القيمة الرئيسية
        const isPositive = growthRate >= 0;
        element.textContent = `${isPositive ? '+' : ''}${growthRate.toFixed(2)}%`;
        element.style.color = isPositive ? '#38a169' : '#e53e3e';

        console.log('📊 تم تحديث معدل النمو:', growthRate);

        // تحديث معلومات المقارنة
        if (infoElement) {
            this.updateGrowthInfo(yearsArr);
        }
    }

    // 📊 تحديث معلومات معدل النمو (4 سنوات) (Dashboard Module)
    updateGrowthInfo(years) {
        const infoElement = document.getElementById('growth-rate-info');
        if (!infoElement) return;
        if (!years || !Array.isArray(years) || years.length === 0) {
            infoElement.innerHTML = '<div style="color:#718096;">لا توجد بيانات سنوية للعرض</div>';
            return;
        }
        
        // ترتيب السنوات تنازلياً
        const sortedYears = [...years].sort((a, b) => parseInt(b.id) - parseInt(a.id));
        
        // حساب معدل النمو لكل سنة
        const yearsWithGrowth = sortedYears.map((year, index) => {
            if (index === sortedYears.length - 1) {
                // آخر سنة ليس لها سنة سابقة
                return {
                    ...year,
                    growth: 0,
                    isBaseline: true
                };
            }
            
            const previousYear = sortedYears[index + 1];
            const currentRevenue = year.annualRevenue || 0;
            const previousRevenue = previousYear.annualRevenue || 0;
            
            let growth = 0;
            if (previousRevenue !== 0) {
                growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
            }
            
            return {
                ...year,
                growth,
                isBaseline: false
            };
        });
        
        // بناء HTML
        let html = '<div class="growth-comparison-table">';
        html += '<h5 class="comparison-title">📊 مقارنة الإيرادات السنوية (4 سنوات)</h5>';
        html += '<div class="years-comparison">';
        
        yearsWithGrowth.forEach((year, index) => {
            const isCurrentYear = index === 0;
            const growthClass = year.growth > 0 ? 'positive' : year.growth < 0 ? 'negative' : 'neutral';
            
            html += `
                <div class="year-item ${isCurrentYear ? 'current-year' : ''}">
                    <div class="year-header">
                        <span class="year-label">${year.id} ${isCurrentYear ? '(السنة الحالية)' : ''}</span>
                        ${!year.isBaseline ? `<span class="growth-badge ${growthClass}">${year.growth >= 0 ? '+' : ''}${year.growth.toFixed(1)}%</span>` : '<span class="growth-badge neutral">سنة الأساس</span>'}
                    </div>
                    <div class="year-revenue">${(year.annualRevenue || 0).toLocaleString('ar-EG')} جنيه</div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // ملخص النمو
    const totalGrowth = (yearsWithGrowth[0] && typeof yearsWithGrowth[0].growth === 'number') ? yearsWithGrowth[0].growth : 0;
        const growthSummaryClass = totalGrowth > 0 ? 'positive' : totalGrowth < 0 ? 'negative' : 'neutral';
        
        html += `
            <div class="growth-summary">
                <span class="summary-label">معدل النمو الإجمالي:</span>
                <span class="summary-value ${growthSummaryClass}">${totalGrowth >= 0 ? '+' : ''}${totalGrowth.toFixed(2)}%</span>
            </div>
        `;
        
        html += '</div>';
        
        infoElement.innerHTML = html;
        console.log('📊 تم تحديث معلومات معدل النمو للسنوات الأربعة');
    }

    // ==================== مراقب أرشيف معدل النمو ====================
    // هذا المراقب يجلب /api/archive بشكل دوري ويحدّث بطاقة معدل النمو فقط عند تغيّر archive.years
    startArchiveGrowthWatcher(intervalMs = 15000) {
        if (this._growthWatcherInterval) return; // already running
        console.log(`⏱️ بدء مراقب معدل النمو (من الأرشيف) كل ${intervalMs}ms`);
        this._growthWatcherInterval = setInterval(async () => {
            try {
                const resp = await fetch('/api/archive', { cache: 'no-store' });
                if (!resp.ok) return;
                const obj = await resp.json();
                if (!obj || !obj.ok || !obj.archive) return;
                const archive = obj.archive;
                const fingerprint = this._computeGrowthArchiveFingerprint(archive);
                if (fingerprint !== this._lastGrowthArchiveFingerprint) {
                    this._lastGrowthArchiveFingerprint = fingerprint;
                    console.log('🔔 تغيّر في أرشيف السنوات - تحديث بطاقة معدل النمو');
                    this.updateGrowthFromArchive(archive);
                }
            } catch (err) {
                console.warn('⚠️ خطأ في مراقب أرشيف معدل النمو:', err);
            }
        }, intervalMs);
    }

    stopArchiveGrowthWatcher() {
        if (this._growthWatcherInterval) {
            clearInterval(this._growthWatcherInterval);
            this._growthWatcherInterval = null;
            console.log('⏹️ توقيف مراقب معدل النمو (الأرشيف)');
        }
    }

    _computeGrowthArchiveFingerprint(archive) {
        try {
            const years = archive.years || [];
            return years.map(y => `${y.yearName||''}:${y.revenue||0}`).join('|');
        } catch (e) {
            try { return JSON.stringify(archive.years || []); } catch (ee) { return String(Date.now()); }
        }
    }

    // تحويل archive.years إلى الشكل المتوقع من updateGrowthRate (data.all.years)
    updateGrowthFromArchive(archive) {
        try {
            const years = (archive.years || []).map(y => ({ id: String(y.yearName || ''), annualRevenue: Number(y.revenue || 0) }));
            // نمرّر الكائن بنفس الشكل المطلوب
            this.updateGrowthRate({ all: { years } });
            // كذلك نعيد رسم الرسم البياني للمعدل باستخدام بيانات السنوات من الأرشيف
            try {
                this.drawGrowthChart({ all: { years } });
            } catch (e) {
                console.warn('⚠️ تعذر رسم مخطط معدل النمو من الأرشيف:', e);
            }
        } catch (err) {
            console.warn('⚠️ تحديث معدل النمو من الأرشيف فشل:', err);
        }
    }

    // تحميل بيانات معدل النمو فوراً من الأرشيف (بدون انتظار)
    async loadGrowthDataFromArchive() {
        try {
            console.log('⚡ تحميل فوري لبيانات معدل النمو من الأرشيف...');
            
            // عرض مؤشر تحميل مؤقت
            const element = document.getElementById('growth-rate');
            if (element) {
                element.textContent = '...';
                element.style.color = '#667eea';
            }
            
            const resp = await fetch('/api/archive', { cache: 'no-store' });
            if (!resp.ok) {
                console.warn('⚠️ فشل جلب بيانات الأرشيف لمعدل النمو');
                if (element) {
                    element.textContent = '—';
                    element.style.color = '#718096';
                }
                return;
            }
            const obj = await resp.json();
            if (!obj || !obj.ok || !obj.archive) {
                console.warn('⚠️ استجابة غير صحيحة من /api/archive');
                if (element) {
                    element.textContent = '—';
                    element.style.color = '#718096';
                }
                return;
            }
            const archive = obj.archive;
            // حفظ البصمة للمراقب المستقبلي
            this._lastGrowthArchiveFingerprint = this._computeGrowthArchiveFingerprint(archive);
            // تحديث البطاقة فوراً
            this.updateGrowthFromArchive(archive);
            console.log('✅ تم تحميل بيانات معدل النمو فوراً');
        } catch (err) {
            console.warn('⚠️ خطأ في تحميل معدل النمو الفوري:', err);
            const element = document.getElementById('growth-rate');
            if (element) {
                element.textContent = '—';
                element.style.color = '#718096';
            }
        }
    }

    // 📅 تحديث معلومات التاريخ (Dashboard Module)
    updateDateInfo(data) {
        if (data.current && data.current.day) {
            const { dayNumber, monthName, yearName, dayName } = data.current.day;
            console.log(`📅 التاريخ: ${dayName}، ${dayNumber} ${monthName} ${yearName}`);
        }
    }

    // 🎨 رسم الرسم البياني للإيرادات (Dashboard Module - النسخة المحسّنة من dashboard-analytics-connector.js)
    drawRevenueChart(data) {
        const canvas = document.getElementById('revenue-trend-chart');
        if (!canvas || !data.all || !data.all.days) return;
        
        const days = data.all.days;
        const currentDay = data.current.day.dayNumber;
        
        // تحضير البيانات
        const labels = days.map(day => {
            const dayLabel = `${day.dayNumber} ${day.dayName}`;
            return day.dayNumber === currentDay ? `${dayLabel} (اليوم)` : dayLabel;
        });
        const dailyRevenue = days.map(d => d.dailyRevenue || 0);
        const cumulativeRevenue = days.map(d => d.cumulativeRevenue || 0);
        
        // ألوان مختلفة لليوم الحالي
        const barColors = days.map(day => 
            day.dayNumber === currentDay ? 'rgba(229, 62, 62, 0.8)' : 'rgba(102, 126, 234, 0.6)'
        );
        const barBorders = days.map(day => 
            day.dayNumber === currentDay ? '#e53e3e' : '#667eea'
        );
        
        // تدمير الرسم القديم إن وجد
        if (this.charts.revenueTrend) {
            this.charts.revenueTrend.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        this.charts.revenueTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'الإيراد المحصل (تراكمي)',
                        data: cumulativeRevenue,
                        borderColor: '#38a169',
                        backgroundColor: 'rgba(56, 161, 105, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 7,
                        yAxisID: 'y'
                    },
                    {
                        label: 'الإيراد اليومي',
                        data: dailyRevenue,
                        type: 'bar',
                        backgroundColor: barColors,
                        borderColor: barBorders,
                        borderWidth: 1,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    title: {
                        display: true,
                        text: `متتبع الإيرادات اليومية - ${data.current.day.monthName} ${data.current.day.yearName}`,
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label;
                                const value = context.parsed.y;
                                return `${label}: ${new Intl.NumberFormat('ar-EG', {
                                    style: 'currency',
                                    currency: 'EGP'
                                }).format(value)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'أيام الشهر',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'المبلغ (جنيه)',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => new Intl.NumberFormat('ar-EG', {
                                style: 'currency',
                                currency: 'EGP',
                                minimumFractionDigits: 0
                            }).format(value)
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                }
            }
        });
        
        console.log('📊 تم رسم الرسم البياني المحسّن للإيرادات (كامل الشهر)');
        console.log(`💰 الإيراد التراكمي: ${cumulativeRevenue[cumulativeRevenue.length - 1].toLocaleString('ar-EG')} جنيه`);
    }

    // 📈 رسم الرسم البياني لنسبة التحصيل (Dashboard Module - النسخة المحسّنة من dashboard-analytics-connector.js)
    drawCollectionChart(data) {
        const canvas = document.getElementById('collection-chart');
        if (!canvas || !data.current) return;
        
        const expectedRevenue = data.current.month.expectedRevenue || 0;
        const collectedRevenue = data.current.day.cumulativeRevenue || 0;
        const remainingRevenue = expectedRevenue - collectedRevenue;
        
        const collectedPercent = expectedRevenue > 0 ? (collectedRevenue / expectedRevenue) * 100 : 0;
        const remainingPercent = expectedRevenue > 0 ? (remainingRevenue / expectedRevenue) * 100 : 0;
        
        // تدمير الرسم القديم إن وجد
        if (this.charts.collection) {
            this.charts.collection.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        this.charts.collection = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [
                    `محصل (${collectedRevenue.toLocaleString('ar-EG')} جنيه)`, 
                    `متبقي (${remainingRevenue.toLocaleString('ar-EG')} جنيه)`
                ],
                datasets: [{
                    data: [collectedPercent, remainingPercent],
                    backgroundColor: ['#38a169', '#e2e8f0'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 11
                            },
                            usePointStyle: true
                        }
                    },
                    title: {
                        display: true,
                        text: 'نسبة تحصيل الإيرادات',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                return `${label}: ${value.toFixed(2)}%`;
                            }
                        }
                    }
                }
            }
        });
        
        console.log('📈 تم رسم الرسم البياني المحسّن لنسبة التحصيل');
        console.log(`✅ محصل: ${collectedPercent.toFixed(2)}% | ⏳ متبقي: ${remainingPercent.toFixed(2)}%`);
    }

    // 📊 رسم الرسم البياني لمعدل النمو (Dashboard Module - النسخة المحسّنة من dashboard-analytics-connector.js)
    drawGrowthChart(data) {
        const canvas = document.getElementById('growth-chart');
        if (!canvas || !data.all || !data.all.years) return;
        
        // ترتيب السنوات تصاعدياً للرسم
        const sortedYears = [...data.all.years].sort((a, b) => parseInt(a.id) - parseInt(b.id));
        
        const labels = sortedYears.map(y => y.id);
        const revenues = sortedYears.map(y => y.annualRevenue || 0);
        
        // حساب معدل النمو لكل سنة
        const growthRates = sortedYears.map((year, index) => {
            if (index === 0) return 0; // أول سنة ليس لها نمو
            const currentRevenue = year.annualRevenue || 0;
            const previousRevenue = sortedYears[index - 1].annualRevenue || 0;
            if (previousRevenue === 0) return 0;
            return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
        });
        
        // ألوان ديناميكية حسب النمو
        const pointColors = growthRates.map(rate => {
            if (rate > 0) return 'rgba(56, 161, 105, 0.6)'; // أخضر للنمو الإيجابي
            if (rate < 0) return 'rgba(229, 62, 62, 0.6)'; // أحمر للنمو السلبي
            return 'rgba(160, 174, 192, 0.6)'; // رمادي للثابت
        });
        
        const pointBorders = growthRates.map(rate => {
            if (rate > 0) return '#38a169';
            if (rate < 0) return '#e53e3e';
            return '#a0aec0';
        });
        
        // تدمير الرسم القديم إن وجد
        if (this.charts.growth) {
            this.charts.growth.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        this.charts.growth = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'الإيراد السنوي',
                        data: revenues,
                        backgroundColor: 'rgba(79, 172, 254, 0.6)',
                        borderColor: '#4facfe',
                        borderWidth: 2,
                        yAxisID: 'y'
                    },
                    {
                        label: 'معدل النمو %',
                        data: growthRates,
                        type: 'line',
                        borderColor: '#f093fb',
                        backgroundColor: 'rgba(240, 147, 251, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                        pointBackgroundColor: pointColors,
                        pointBorderColor: pointBorders,
                        pointBorderWidth: 2,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'الإيرادات السنوية ومعدل النمو (4 سنوات)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label;
                                const value = context.parsed.y;
                                if (label.includes('معدل')) {
                                    return `${label}: ${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
                                }
                                return `${label}: ${new Intl.NumberFormat('ar-EG', {
                                    style: 'currency',
                                    currency: 'EGP'
                                }).format(value)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'السنة',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'الإيراد (جنيه)',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => new Intl.NumberFormat('ar-EG', {
                                notation: 'compact',
                                compactDisplay: 'short'
                            }).format(value)
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'معدل النمو (%)',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            callback: (value) => `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
        
        console.log('📊 تم رسم الرسم البياني المحسّن لمعدل النمو (4 سنوات)');
        console.log('📈 البيانات:', sortedYears.map((y, i) => `${y.id}: ${revenues[i].toLocaleString('ar-EG')} جنيه (نمو: ${growthRates[i] >= 0 ? '+' : ''}${growthRates[i].toFixed(2)}%)`));
    }

    // ⚠️ عرض رسالة خطأ (Dashboard Module)
    showErrorMessage(message) {
        console.error('⚠️', message);
        
        // يمكن إضافة عرض رسالة للمستخدم هنا
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            ${message}
        `;
        
        const container = document.querySelector('.analytics-container');
        if (container) {
            container.insertBefore(errorDiv, container.firstChild);
            
            // إزالة الرسالة بعد 5 ثواني
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }
    }

    // 💼 حالة الميزانية: تمت إزالة الدالة والمسؤوليات المرتبطة بالبطاقة

    // 📊 تحديث جدول المجموعات الأكثر ربحية (Dashboard Module)
    async updateTopGroupsFromAPI(data) {
        try {
            console.log('📊 جلب بيانات المجموعات الأكثر ربحية من الخادم...');

            // حدد الشهر والسنة إن وُجدت، وإلا يستخدم الخادم القيم الافتراضية
            const now = new Date();
            const month = (now.getMonth() + 1);
            const year = now.getFullYear();

            const resp = await fetch(`/api/financial-analytics/dashboard/top-groups?month=${month}&year=${year}`);
            if (!resp.ok) {
                console.warn('⚠️ فشل جلب بيانات المجموعات من الخادم', resp.status);
                this.displayEmptyGroupsTable();
                return;
            }

            const body = await resp.json();
            if (!body || !body.success || !Array.isArray(body.groups)) {
                console.warn('⚠️ رد الخادم غير مطابق للتوقعات عند جلب مجموعات الربحية', body);
                this.displayEmptyGroupsTable();
                return;
            }

            // نعرض أفضل 5 مجموعات حسب الترتيب المرسل من الخادم
            const top5 = body.groups.slice(0, 5).map(g => ({
                groupName: g.subject || 'مجموعة غير محددة',
                teacherName: g.teacher || 'غير محدد',
                studentCount: g.studentCount || 0,
                expectedRevenue: g.expectedRevenue || 0,
                collectedRevenue: g.collectedRevenue || 0,
                collectionRate: g.collectionRate || 0
            }));

            this.displayGroupsTable(top5);
            console.log('✅ تم تحديث جدول المجموعات بنجاح (من الخادم)');

        } catch (error) {
            console.error('❌ خطأ في تحديث جدول المجموعات:', error);
            this.displayEmptyGroupsTable();
        }
    }

    // 📋 عرض جدول المجموعات (Dashboard Module)
    displayGroupsTable(groups) {
        const tableBody = document.getElementById('top-groups-table');
        if (!tableBody) return;
        
        tableBody.innerHTML = groups.map(group => {
            const statusClass = group.collectionRate >= 80 ? 'status-active' : 
                               group.collectionRate >= 60 ? 'status-draft' : 
                               'status-completed';
            
            return `
                <tr>
                    <td>${group.groupName}</td>
                    <td>${group.studentCount}</td>
                    <td>${group.expectedRevenue.toLocaleString('ar-EG')} جنيه</td>
                    <td>${group.collectedRevenue.toLocaleString('ar-EG')} جنيه</td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${group.collectionRate.toFixed(1)}%
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 📋 عرض جدول فارغ (Dashboard Module)
    displayEmptyGroupsTable() {
        const tableBody = document.getElementById('top-groups-table');
        if (!tableBody) return;
        
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #718096;">
                    لا توجد مجموعات نشطة حالياً
                </td>
            </tr>
        `;
    }

    // تحديث واجهة المستخدم بالبيانات الحقيقية
    updateDashboardUIWithRealData(realData) {
        console.log('🔄 تحديث الواجهة بالبيانات الحقيقية:', realData);
        
        // تحضير بيانات التتبع اليومي
        this.prepareDailyRevenueTracker(realData);
        
        // تحضير بيانات نسبة التحصيل
        this.prepareCollectionRateTracker(realData);
        
        // تحضير بيانات معدل النمو السنوي
        this.prepareAnnualGrowthTracker(realData);
        
        // تحديث الإيراد المحصل حتى اليوم
        const dailyProgress = this.calculateDailyProgress();
        const revenueToDate = dailyProgress.totalRevenueToDate || realData.revenue?.collected || 0;
        document.getElementById('monthly-revenue').textContent = this.formatCurrency(revenueToDate);
        
        // تحديث المعلومات الإضافية للتتبع اليومي
        this.updateDailyTrackingInfo(dailyProgress);
        
        // تحديث نسبة التحصيل
        const collectionRate = parseFloat(realData.revenue?.collectionRate) || 0;
        document.getElementById('collection-rate').textContent = `${collectionRate.toFixed(1)}%`;
        
        // تحديث معدل النمو (حسابه بناءً على البيانات المتاحة)
        const expectedRevenue = realData.revenue?.expected || 0;
        const growthRate = expectedRevenue > 0 ? ((monthlyRevenue / expectedRevenue) * 100) - 100 : 0;
        document.getElementById('growth-rate').textContent = `${growthRate.toFixed(1)}%`;
        
    // تم إزالة تحديث حالة الميزانية من الواجهة (البطاقة أزيلت)
        
        // تحديث مؤشرات التغيير
        this.updateChangeIndicators(realData);
        
        // تحديث جدول المجموعات بالبيانات الحقيقية
        if (realData.breakdown && realData.breakdown.length > 0) {
            this.updateTopGroupsTableWithRealData(realData.breakdown);
        } else {
            console.log('⚠️ لا توجد بيانات مجموعات، استخدام بيانات تجريبية');
            this.updateTopGroupsTable([]);
        }
        
        // تحديث الرسوم البيانية بالبيانات الحقيقية
        this.updateChartsWithRealData(realData);
    }

    updateChangeIndicators(realData) {
        const revenue = realData.revenue || {};
        
        // تحديث مؤشر تغيير الإيراد مع معلومات التتبع اليومي
        const revenueChange = document.getElementById('revenue-change');
        if (revenueChange) {
            const dailyProgress = this.calculateDailyProgress();
            const changePercent = revenue.collectionRate || 0;
            
            revenueChange.innerHTML = `
                <i class="fas fa-${changePercent >= 75 ? 'chart-line' : changePercent >= 50 ? 'chart-bar' : 'chart-area'}"></i>
                <span>${dailyProgress.daysCompleted}/${dailyProgress.totalDays}</span> يوم 
                <div style="font-size: 10px; opacity: 0.8; margin-top: 2px;">
                    📊 التقدم: ${dailyProgress.progressPercent}% | اليوم: ${this.formatCurrency(dailyProgress.todayRevenue)}
                </div>
            `;
            revenueChange.className = `metric-change ${changePercent >= 75 ? 'change-positive' : changePercent >= 50 ? 'change-neutral' : 'change-negative'}`;
        }
        
        // تحديث مؤشر تغيير التحصيل
        const collectionChange = document.getElementById('collection-change');
        if (collectionChange) {
            const pending = revenue.pending || 0;
            const expected = revenue.expected || 0;
            const pendingPercent = expected > 0 ? (pending / expected) * 100 : 0;
            
            collectionChange.innerHTML = `
                <i class="fas fa-${pendingPercent <= 25 ? 'check-circle' : pendingPercent <= 50 ? 'clock' : 'exclamation-triangle'}"></i>
                <span>${this.formatCurrency(pending)}</span> مبالغ معلقة
            `;
            collectionChange.className = `metric-change ${pendingPercent <= 25 ? 'change-positive' : pendingPercent <= 50 ? 'change-neutral' : 'change-negative'}`;
        }
    }


    // 🔄 تحضير بيانات التتبع اليومي
    async prepareDailyRevenueTracker(realData) {
        try {
            console.log('📅 تحضير بيانات التتبع اليومي...');
            
            // حساب الإيراد المتوقع من المجموعات
            const expectedRevenue = await this.calculateExpectedMonthlyRevenue();
            
            // جلب بيانات المدفوعات اليومية للشهر الحالي
            const dailyPayments = await this.getDailyPaymentsForCurrentMonth();
            
            // تحضير بيانات الشهر الحالي
            const daysInMonth = this.getDaysInCurrentMonth();
            this.dailyRevenueTracker.targetDaily = expectedRevenue / daysInMonth;
            this.dailyRevenueTracker.monthlyData = this.processDailyRevenueData(dailyPayments, daysInMonth);
            
            console.log('✅ تم تحضير بيانات التتبع اليومي:', this.dailyRevenueTracker);
            
        } catch (error) {
            console.error('❌ خطأ في تحضير التتبع اليومي:', error);
        }
    }

    // 💰 حساب الإيراد المتوقع الشهري من المجموعات
    async calculateExpectedMonthlyRevenue() {
        try {
            const groupsResponse = await fetch('/api/groups');
            const groupsData = await groupsResponse.json();
            
            if (!groupsData || !Array.isArray(groupsData)) {
                console.warn('⚠️ لا توجد بيانات مجموعات');
                return 0;
            }
            
            // حساب الإيراد المتوقع = مجموع (عدد الطلاب × السعر) لكل مجموعة
            let expectedRevenue = 0;
            
            for (const group of groupsData) {
                // جلب عدد الطلاب المشتركين في هذه المجموعة
                const subscriptionsResponse = await fetch(`/api/subscriptions?groupId=${group._id}`);
                const subscriptions = await subscriptionsResponse.json();
                
                const studentCount = Array.isArray(subscriptions) ? subscriptions.length : 0;
                const groupPrice = group.price || 0;
                const groupRevenue = studentCount * groupPrice;
                
                expectedRevenue += groupRevenue;
                
                console.log(`📊 مجموعة ${group.subject}: ${studentCount} طالب × ${groupPrice} = ${groupRevenue} جنيه`);
            }
            
            console.log(`💰 إجمالي الإيراد المتوقع للشهر: ${this.formatCurrency(expectedRevenue)}`);
            return expectedRevenue;
            
        } catch (error) {
            console.error('❌ خطأ في حساب الإيراد المتوقع:', error);
            return 0;
        }
    }

    // 📅 جلب المدفوعات اليومية للشهر الحالي
    async getDailyPaymentsForCurrentMonth() {
        try {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            const paymentsResponse = await fetch('/api/payments');
            const payments = await paymentsResponse.json();
            
            if (!Array.isArray(payments)) {
                console.warn('⚠️ لا توجد بيانات مدفوعات');
                return [];
            }
            
            // فلترة المدفوعات للشهر الحالي فقط
            const currentMonthPayments = payments.filter(payment => {
                if (!payment.months || !Array.isArray(payment.months)) return false;
                
                return payment.months.some(monthData => {
                    if (monthData.status !== 'مدفوع' || !monthData.paidDate) return false;
                    
                    const paidDate = new Date(monthData.paidDate);
                    return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
                });
            });
            
            console.log(`📋 تم جلب ${currentMonthPayments.length} دفعة للشهر الحالي`);
            return currentMonthPayments;
            
        } catch (error) {
            console.error('❌ خطأ في جلب المدفوعات اليومية:', error);
            return [];
        }
    }

    // 📆 الحصول على عدد أيام الشهر الحالي
    getDaysInCurrentMonth() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    }

    // 🔄 معالجة بيانات الإيراد اليومي
    processDailyRevenueData(payments, daysInMonth) {
        const dailyData = [];
        const now = new Date();
        
        // إنشاء مصفوفة لكل يوم في الشهر
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(now.getFullYear(), now.getMonth(), day);
            
            // حساب إجمالي المدفوعات لهذا اليوم
            const dayRevenue = payments.reduce((total, payment) => {
                if (!payment.months) return total;
                
                const dayPayments = payment.months.filter(monthData => {
                    if (monthData.status !== 'مدفوع' || !monthData.paidDate) return false;
                    
                    const paidDate = new Date(monthData.paidDate);
                    return paidDate.toDateString() === currentDate.toDateString();
                });
                
                return total + dayPayments.reduce((sum, monthData) => sum + (monthData.amount || 0), 0);
            }, 0);
            
            dailyData.push({
                day: day,
                date: currentDate,
                revenue: dayRevenue,
                dayName: currentDate.toLocaleDateString('ar-EG', { weekday: 'short' })
            });
        }
        
        return dailyData;
    }

    updateChartsWithRealData(realData) {
        // رسم بياني للتتبع اليومي (جديد!)
        this.createDailyRevenueTrackerChart();
        
        // رسم بياني لنسبة التحصيل
        this.createCollectionChartWithRealData(realData);
        
            // رسم بياني للنمو
            this.createGrowthChart();

            // بطاقة حالة الميزانية (صافي الربح) — تجلب بيانات الشهر الحالي من الأرشيف وتعرض دوناتس (صافي الربح / المصروفات)
            try {
                this.renderBudgetNetProfitCard();
            } catch (e) {
                console.warn('⚠️ renderBudgetNetProfitCard failed:', e);
            }
    }

    // 📊 رسم بياني للتتبع اليومي للإيرادات
    createDailyRevenueTrackerChart() {
        const ctx = document.getElementById('revenue-trend-chart');
        if (!ctx) return;
        
        if (this.charts.revenueTrend) {
            this.charts.revenueTrend.destroy();
        }
        
        const monthlyData = this.dailyRevenueTracker.monthlyData;
        if (!monthlyData || monthlyData.length === 0) {
            console.warn('⚠️ لا توجد بيانات للتتبع اليومي');
            return;
        }
        
        console.log('📊 إنشاء رسم بياني ديناميكي:', {
            عدد_الأيام: monthlyData.length,
            أقصى_إيراد_يومي: Math.max(...monthlyData.map(d => d.revenue)),
            أقل_إيراد_يومي: Math.min(...monthlyData.filter(d => d.revenue > 0).map(d => d.revenue)),
            إجمالي_الإيراد: monthlyData.reduce((sum, d) => sum + d.revenue, 0)
        });
        
        // تحضير البيانات للرسم البياني
        const currentDay = new Date().getDate();
        const labels = monthlyData.map(day => {
            const dayLabel = `${day.day} ${day.dayName}`;
            return day.day === currentDay ? `${dayLabel} (اليوم)` : dayLabel;
        });
        const actualRevenue = monthlyData.map(day => day.revenue);
        
        // ألوان مختلفة لليوم الحالي
        const barColors = monthlyData.map(day => 
            day.day === currentDay ? 'rgba(229, 62, 62, 0.8)' : 'rgba(102, 126, 234, 0.6)'
        );
        const barBorders = monthlyData.map(day => 
            day.day === currentDay ? '#e53e3e' : '#667eea'
        );
        
        // حساب الإيراد التراكمي
        const cumulativeRevenue = [];
        let runningTotal = 0;
        actualRevenue.forEach(dayRevenue => {
            runningTotal += dayRevenue;
            cumulativeRevenue.push(runningTotal);
        });
        
        this.charts.revenueTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'الإيراد المحصل (تراكمي)',
                        data: cumulativeRevenue,
                        borderColor: '#38a169',
                        backgroundColor: 'rgba(56, 161, 105, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 7,
                        yAxisID: 'y'
                    },
                    {
                        label: 'الإيراد اليومي',
                        data: actualRevenue,
                        type: 'bar',
                        backgroundColor: barColors,
                        borderColor: barBorders,
                        borderWidth: 1,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    title: {
                        display: true,
                        text: `متتبع الإيرادات اليومية - ${new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}`,
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label;
                                const value = context.parsed.y;
                                return `${label}: ${new Intl.NumberFormat('ar-EG', {
                                    style: 'currency',
                                    currency: 'EGP'
                                }).format(value)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'أيام الشهر',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'المبلغ (جنيه)',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                }
            }
        });
        
        // إضافة معلومات مفيدة في الكونسول
        const totalActual = cumulativeRevenue[cumulativeRevenue.length - 1] || 0;
        const maxDailyRevenue = Math.max(...actualRevenue);
        const maxCumulativeRevenue = Math.max(...cumulativeRevenue);
        
        console.log('✅ تم إنشاء رسم التتبع اليومي المبسط بنجاح!');
        console.log(`💰 الإيراد المحصل حتى اليوم: ${this.formatCurrency(totalActual)}`);
        
        // 🔥 شرح كيف الرسم البياني ديناميكي
        console.group('🚀 الرسم البياني الديناميكي المبسط:');
        console.log('📊 المحاور تتكيف تلقائياً حسب:');
        console.log(`   • المحور الأفقي (X): أيام الشهر من 1 لـ ${monthlyData.length}`);
        console.log(`   • المحور الرأسي (Y): من 0 لـ ${this.formatCurrency(Math.max(maxDailyRevenue, maxCumulativeRevenue))}`);
        console.log('📊 البيانات المعروضة:');
        console.log(`   • الأعمدة الزرقاء: الإيراد اليومي (أقصى: ${this.formatCurrency(maxDailyRevenue)})`);
        console.log(`   • الخط الأخضر: الإيراد التراكمي (أقصى: ${this.formatCurrency(maxCumulativeRevenue)})`);
        console.log('🎯 الألوان تتغير حسب:');
        console.log(`   • اليوم الحالي (${new Date().getDate()}): عمود أحمر مميز`);
        console.log('   • باقي الأيام: أعمدة زرقاء عادية');
        console.log('📈 التحديث الفوري مع تغيير البيانات!');
        console.groupEnd();
    }

    createRevenueTrendChartWithRealData(realData) {
        // استخدم الدالة الجديدة للتتبع اليومي
        this.createDailyRevenueTrackerChart();
    }

    createCollectionChartWithRealData(realData) {
        const ctx = document.getElementById('collection-chart');
        if (!ctx) return;
        
        if (this.charts.collection) {
            this.charts.collection.destroy();
        }
        
        const revenue = realData.revenue || {};
        const collected = revenue.collected || 0;
        const pending = revenue.pending || 0;
        const total = collected + pending;
        
        const collectedPercent = total > 0 ? (collected / total) * 100 : 0;
        const pendingPercent = total > 0 ? (pending / total) * 100 : 0;
        
        this.charts.collection = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [`محصل (${this.formatCurrency(collected)})`, `معلق (${this.formatCurrency(pending)})`],
                datasets: [{
                    data: [collectedPercent, pendingPercent],
                    backgroundColor: ['#38a169', '#e2e8f0'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // createBudgetProgressChartWithRealData removed — الميزانية ومخطط التقدم أزيلا من واجهة dashboard

    updateDashboardUI(dashboard) {
        // تحديث الإيراد الشهري
        const monthlyRevenue = dashboard.monthlyReport?.financialData?.collectedRevenue || 0;
        document.getElementById('monthly-revenue').textContent = this.formatCurrency(monthlyRevenue);
        
        // تحديث نسبة التحصيل
        const collectionRate = dashboard.monthlyReport?.financialData?.collectionRate || 0;
        document.getElementById('collection-rate').textContent = `${collectionRate.toFixed(1)}%`;
        
        // تحديث معدل النمو
        const growthRate = dashboard.monthlyReport?.growthMetrics?.revenueGrowth || 0;
        document.getElementById('growth-rate').textContent = `${growthRate.toFixed(1)}%`;
        
        // ملاحظة: من أجل إزالة بطاقة حالة الميزانية لم يعد يتم عرض أو تحديث بيانات خطة الميزانية هنا
        
        // تحديث جدول المجموعات
        this.updateTopGroupsTable(dashboard.monthlyReport?.financialData?.groupsBreakdown || []);
        
        // تحديث الرسوم البيانية
        this.updateDashboardCharts(dashboard);
    }


    updateDashboardCharts(dashboard) {
        // رسم بياني للتتبع اليومي (الجديد!)
        this.createDailyRevenueTrackerChart();
        
        // رسم بياني لنسبة التحصيل
        this.createCollectionChart();
        
        // رسم بياني للنمو
        this.createGrowthChart();
        
    // رسم تقدم الميزانية محذوف (البطاقة أزيلت)
    }

    createRevenueTrendChart() {
        const ctx = document.getElementById('revenue-trend-chart');
        if (!ctx) return;
        
        if (this.charts.revenueTrend) {
            this.charts.revenueTrend.destroy();
        }
        
        this.charts.revenueTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
                datasets: [{
                    label: 'الإيراد الشهري',
                    data: this.generateMockMonthlyData(),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        });
    }

    createCollectionChart() {
        const ctx = document.getElementById('collection-chart');
        if (!ctx) return;
        
        if (this.charts.collection) {
            this.charts.collection.destroy();
        }
        
        this.charts.collection = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['محصل', 'معلق'],
                datasets: [{
                    data: [75, 25],
                    backgroundColor: ['#38a169', '#e2e8f0'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createGrowthChart() {
        const ctx = document.getElementById('growth-chart');
        if (!ctx) return;
        
        if (this.charts.growth) {
            this.charts.growth.destroy();
        }
        
        this.charts.growth = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                datasets: [{
                    label: 'معدل النمو %',
                    data: [5, 8, 12, 15],
                    backgroundColor: ['#4facfe', '#00f2fe', '#4facfe', '#00f2fe']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    }
                }
            }
        });
    }

    // createBudgetProgressChart removed — الميزانية ومخطط التقدم أزيلت من واجهة dashboard

    // === وظائف البطاقة الجديدة: جلب الأرشيف وصنع دوناتس (صافي الربح / المصروفات) ===
    async fetchArchiveCurrentMonth() {
        try {
            const resp = await fetch('/api/archive');
            if (!resp.ok) {
                console.warn('⚠️ /api/archive responded with', resp.status);
                return null;
            }
            const obj = await resp.json();
            if (obj && obj.ok && obj.archive) {
                // Prefer currentMonth if it exists
                if (obj.archive.currentMonth && (obj.archive.currentMonth.revenue != null || obj.archive.currentMonth.expenses != null || obj.archive.currentMonth.netProfit != null)) {
                    console.log('ℹ️ archive.currentMonth found');
                    return obj.archive.currentMonth;
                }

                // Fallback: find the most recent month snapshot in monthsArchive
                const years = obj.archive.monthsArchive || [];
                for (let i = 0; i < years.length; i++) {
                    const year = years[i];
                    if (year && Array.isArray(year.months) && year.months.length > 0) {
                        // choose the last month entry as the latest snapshot
                        const lastMonth = year.months[year.months.length - 1];
                        if (lastMonth && (lastMonth.revenue != null || lastMonth.expenses != null || lastMonth.netProfit != null)) {
                            console.log('ℹ️ using fallback month from monthsArchive:', year.yearName, lastMonth.monthName);
                            return lastMonth;
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('⚠️ fetchArchiveCurrentMonth error', err);
        }
        return null;
    }

    // === Archive watcher: poll /api/archive and update card only on changes ===
    startArchiveWatcher(intervalMs = 15000) {
        // avoid multiple watchers
        if (this.archiveWatcherInterval) return;

        const poll = async () => {
            try {
                const resp = await fetch('/api/archive');
                if (!resp.ok) return;
                const obj = await resp.json();
                if (!obj || !obj.ok || !obj.archive) return;

                const archive = obj.archive;
                const current = archive.currentMonth || null;

                // build a small fingerprint key to detect changes (monthName, yearName, revenue, expenses, netProfit)
                const key = current ? `${current.yearName || ''}|${current.monthName || ''}|${Number(current.revenue||0)}|${Number(current.expenses||0)}|${Number(current.netProfit||0)}` : `null`;

                if (key !== this.archiveLastKey) {
                    console.log('🔔 archive changed (watcher) — updating budget card');
                    this.archiveLastKey = key;
                    // update cache and re-render card quickly
                    this.archiveMonthCache = current;
                    try {
                        this.renderBudgetNetProfitCard();
                    } catch (e) {
                        console.warn('⚠️ renderBudgetNetProfitCard failed in watcher', e);
                    }
                }
            } catch (err) {
                // silent — don't spam console
                // console.warn('⚠️ archive watcher poll failed', err);
            }
        };

        // initial immediate poll
        poll();
        this.archiveWatcherInterval = setInterval(poll, intervalMs);
        console.log('🛰️ archive watcher started (interval ' + intervalMs + 'ms)');
    }

    stopArchiveWatcher() {
        if (this.archiveWatcherInterval) {
            clearInterval(this.archiveWatcherInterval);
            this.archiveWatcherInterval = null;
            console.log('🛑 archive watcher stopped');
        }
    }

    async renderBudgetNetProfitCard() {
        const elValue = document.getElementById('budget-netprofit-value');
        const elExpenses = document.getElementById('budget-netprofit-expenses');
        const elRevenue = document.getElementById('budget-netprofit-revenue');
        const elNet = document.getElementById('budget-netprofit-net');
        const canvas = document.getElementById('budget-netprofit-chart');

        try {
            console.log('🔍 renderBudgetNetProfitCard: start');
            if (elValue) elValue.textContent = 'جاري التحميل...';
            if (elExpenses) elExpenses.textContent = '—';

            // Prefer cached month to reduce latency
            let month = null;
            if (this.archiveMonthCache) {
                month = this.archiveMonthCache;
                console.log('🔍 renderBudgetNetProfitCard: using cached archive month');
            } else if (this.archivePreloadPromise) {
                // If preload is in progress, render placeholders immediately and update when preload resolves
                console.log('🔍 renderBudgetNetProfitCard: preload in progress — rendering placeholders and will update on resolution');
                if (elValue) elValue.textContent = 'جاري التحميل...';
                if (elRevenue) elRevenue.textContent = '—';
                if (elExpenses) elExpenses.textContent = '—';
                if (elNet) elNet.textContent = '—';

                // create an empty/placeholder chart (so layout is stable)
                this.createNetProfitDonutChart({ netProfit: 0, expenses: 0, revenue: 0 });

                // when preload resolves, update the card
                this.archivePreloadPromise.then(resolvedMonth => {
                    if (resolvedMonth) {
                        this.archiveMonthCache = resolvedMonth;
                        try {
                            // update DOM and chart with real values
                            const rev = Number(resolvedMonth.revenue || 0);
                            const exp = Number(resolvedMonth.expenses || 0) || 0;
                            const netp = Number(resolvedMonth.netProfit != null ? resolvedMonth.netProfit : (rev - exp));
                            // displayedNet is the difference between archive.netProfit and expenses
                            const displayedNetPre = Number(netp || 0) - Number(exp || 0);
                            if (elValue) elValue.textContent = this.formatCurrency(displayedNetPre || 0);
                            // The small "الربح" field should reflect archive.netProfit
                            if (elRevenue) elRevenue.textContent = this.formatCurrency(netp || 0);
                            if (elExpenses) elExpenses.textContent = this.formatCurrency(exp || 0);
                            if (elNet) elNet.textContent = this.formatCurrency(displayedNetPre || 0);
                            // Pass the displayed net (netProfit - expenses) as the first donut slice
                            this.createNetProfitDonutChart({ netProfit: displayedNetPre, expenses: exp, revenue: rev });
                            console.log('🔍 renderBudgetNetProfitCard: updated after preload ->', resolvedMonth);
                        } catch (e) {
                            console.warn('⚠️ update after preload failed', e);
                        }
                    }
                }).catch(err => console.warn('⚠️ preload promise rejected', err));

                // return early; the .then handler will update when ready
                return;
            } else {
                month = await this.fetchArchiveCurrentMonth();
                console.log('🔍 renderBudgetNetProfitCard: fetched month ->', month);
                if (!this.archiveMonthCache && month) this.archiveMonthCache = month;
            }

            if (!month) {
                if (elValue) elValue.textContent = 'غير متوفر';
                if (elRevenue) elRevenue.textContent = '—';
                if (elExpenses) elExpenses.textContent = '—';
                if (elNet) elNet.textContent = '—';
                if (canvas && canvas.parentElement) {
                    canvas.parentElement.style.opacity = '0.6';
                    // show small message inside chart container
                    canvas.parentElement.querySelectorAll('.no-data-msg').forEach(n=>n.remove());
                    const msg = document.createElement('div');
                    msg.className = 'no-data-msg';
                    msg.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#718096;font-size:0.95rem;pointer-events:none;';
                    msg.textContent = 'لا توجد بيانات أرشيفية متاحة';
                    canvas.parentElement.style.position = 'relative';
                    canvas.parentElement.appendChild(msg);
                }
                return;
            }

            const revenue = Number(month.revenue || 0);
            const expenses = Number(month.expenses || 0) || 0;
            const netProfit = Number(month.netProfit != null ? month.netProfit : (revenue - expenses));

            // displayedNet is the difference between netProfit and expenses
            const displayedNet = Number(netProfit || 0) - Number(expenses || 0);

            console.log('🔍 renderBudgetNetProfitCard: values', { revenue, expenses, netProfit, displayedNet });

            // Title/main number should show displayedNet (netProfit - expenses)
            if (elValue) elValue.textContent = this.formatCurrency(displayedNet || 0);
            // small "الربح" shows authoritative netProfit
            if (elRevenue) elRevenue.textContent = this.formatCurrency(netProfit || 0);
            if (elExpenses) elExpenses.textContent = this.formatCurrency(expenses || 0);
            // small "صافى الربح" shows displayedNet as specified
            if (elNet) elNet.textContent = this.formatCurrency(displayedNet || 0);

            // remove any previous no-data message
            if (canvas && canvas.parentElement) {
                canvas.parentElement.querySelectorAll('.no-data-msg').forEach(n=>n.remove());
                canvas.parentElement.style.opacity = '1';
            }

            // create donut where first slice is displayedNet (netProfit - expenses) and second is expenses
            this.createNetProfitDonutChart({ netProfit: displayedNet, expenses, revenue });
        } catch (err) {
            console.error('❌ renderBudgetNetProfitCard error', err);
            if (elValue) elValue.textContent = 'خطأ عرض البيانات';
        }
    }

    createNetProfitDonutChart({ netProfit = 0, expenses = 0, revenue = 0 } = {}) {
        const canvasEl = document.getElementById('budget-netprofit-chart');
        if (!canvasEl) return;

        // destroy previous chart if exists
        if (this.charts.budgetNetProfit) {
            try { this.charts.budgetNetProfit.destroy(); } catch (e) { /* ignore */ }
        }

        const net = Math.max(0, Number(netProfit) || 0);
        const exp = Math.max(0, Number(expenses) || 0);
        const data = (net === 0 && exp === 0) ? [1] : [net, exp];
        const labels = (net === 0 && exp === 0) ? ['لا توجد بيانات'] : ['صافي الربح', 'المصروفات'];
        const background = (net === 0 && exp === 0) ? ['#e2e8f0'] : ['#43e97b', '#ff6b6b'];

        // ensure Chart is available
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js not loaded');
            // show fallback text
            const parent = canvasEl.parentElement;
            if (parent) {
                parent.querySelectorAll('.no-data-msg').forEach(n=>n.remove());
                const msg = document.createElement('div');
                msg.className = 'no-data-msg';
                msg.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#718096;font-size:0.95rem;pointer-events:none;';
                msg.textContent = 'المخطط غير متاح (Chart.js غير محمّل)';
                parent.style.position = 'relative';
                parent.appendChild(msg);
            }
            return;
        }

        try {
            const ctx = canvasEl.getContext ? canvasEl.getContext('2d') : canvasEl;
            // create a pie chart (full circle with a wedge) for a report-like look
            this.charts.budgetNetProfit = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels,
                    datasets: [{
                        data,
                        backgroundColor: background,
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { usePointStyle: true }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    return `${label}: ${new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(value)}`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (err) {
            console.error('❌ createNetProfitDonutChart error', err);
        }
    }

    // (test helper removed) 

    // 📋 تحميل بيانات التقارير
    async loadReportsData() {
        try {
            console.log('📋 تهيئة نظام التقارير المتقدم...');
            
            // استدعاء تهيئة نظام التقارير الجديد
            if (typeof initializeReportsTab === 'function') {
                initializeReportsTab();
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل التقارير:', error);
            this.showAlert('حدث خطأ في تحميل التقارير', 'danger');
        }
    }

    updateReportsList(reports) {
        const reportsList = document.getElementById('reports-list');
        if (!reportsList) return;
        
        if (reports.length === 0) {
            reportsList.innerHTML = '<p class="metric-label">لا توجد تقارير مالية حالياً</p>';
            return;
        }
        
        reportsList.innerHTML = reports.map(report => `
            <div class="report-item" style="padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 1rem; cursor: pointer;" onclick="viewReport('${report.reportId}')">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0; color: #2d3748;">${this.getReportTitle(report)}</h4>
                        <p style="margin: 0.25rem 0; color: #718096;">${this.formatDate(report.generatedAt)}</p>
                    </div>
                    <div style="text-align: left;">
                        <div style="font-size: 1.2rem; font-weight: 600; color: #2d3748;">
                            ${this.formatCurrency(report.financialData.collectedRevenue)}
                        </div>
                        <div style="font-size: 0.9rem; color: #718096;">
                            نسبة التحصيل: ${report.financialData.collectionRate.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getReportTitle(report) {
        if (report.reportType === 'monthly') {
            return `تقرير شهري - ${report.period.month}/${report.period.year}`;
        } else if (report.reportType === 'yearly') {
            return `تقرير سنوي - ${report.period.year}`;
        }
        return `تقرير ${report.reportType}`;
    }

    // 📈 تحميل بيانات المؤشرات
    async loadMetricsData() {
        try {
            console.log('📈 جاري تحميل المؤشرات...');
            
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`${this.apiBaseUrl}/metrics/daily/${today}`);
            const data = await response.json();
            
            if (data.success) {
                this.updateDailyMetrics(data.metrics);
            }
            
            // تحميل الاتجاهات الأسبوعية
            await this.loadWeeklyTrends();
        } catch (error) {
            console.error('❌ خطأ في تحميل المؤشرات:', error);
            this.showAlert('حدث خطأ في تحميل المؤشرات', 'danger');
        }
    }

    updateDailyMetrics(metrics) {
        const dailyMetricsContainer = document.getElementById('daily-metrics');
        if (!dailyMetricsContainer) return;
        
        if (metrics.length === 0) {
            dailyMetricsContainer.innerHTML = '<p class="metric-label">لا توجد مؤشرات يومية</p>';
            return;
        }
        
        dailyMetricsContainer.innerHTML = metrics.map(metric => `
            <div style="padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0; color: #2d3748;">${this.getMetricTitle(metric.metricType)}</h4>
                        <p style="margin: 0.25rem 0; color: #718096;">${this.formatDate(metric.date)}</p>
                    </div>
                    <div style="font-size: 1.5rem; font-weight: 600; color: #2d3748;">
                        ${this.formatMetricValue(metric)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getMetricTitle(metricType) {
        const titles = {
            'daily_revenue': 'الإيراد اليومي',
            'collection_rate': 'نسبة التحصيل',
            'student_performance': 'أداء الطلاب',
            'group_performance': 'أداء المجموعات',
            'payment_trends': 'اتجاهات الدفع'
        };
        return titles[metricType] || metricType;
    }

    formatMetricValue(metric) {
        if (metric.metricType.includes('rate') || metric.metricType.includes('percentage')) {
            return `${metric.values.primary.toFixed(1)}%`;
        } else if (metric.metricType.includes('revenue') || metric.metricType.includes('amount')) {
            return this.formatCurrency(metric.values.primary);
        }
        return metric.values.primary.toString();
    }

    async loadWeeklyTrends() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/metrics/weekly-trend/daily_revenue?weeks=4`);
            const data = await response.json();
            
            if (data.success) {
                this.createWeeklyTrendsChart(data.trend);
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل الاتجاهات الأسبوعية:', error);
        }
    }

    createWeeklyTrendsChart(trendData) {
        const ctx = document.getElementById('weekly-trends-chart');
        if (!ctx) return;
        
        if (this.charts.weeklyTrends) {
            this.charts.weeklyTrends.destroy();
        }
        
        const labels = trendData.map(item => this.formatDate(item.date));
        const values = trendData.map(item => item.values.primary);
        
        this.charts.weeklyTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'الإيراد اليومي',
                    data: values,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        });
    }

    // 🎯 تحميل بيانات الميزانية
    async loadBudgetData() {
        try {
            console.log('🎯 جاري تحميل خطط الميزانية...');

            const response = await fetch(`${this.apiBaseUrl}/budget/plans/active`);
            const data = await response.json();

            if (data.success) {
                this.updateActivePlans(data.plans);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل خطط الميزانية:', error);
            // لا نعرض alert مزعج هنا لأن واجهة الميزانية ستحاول التحميل من مصدر آخر
            // this.showAlert('حدث خطأ في تحميل خطط الميزانية', 'danger');
        } finally {
            // نضمن دائماً تحميل واجهة الميزانية (الفواتير الثابتة والمتغيرة) حتى لو فشل استدعاء خطط الميزانية
            try {
                updateMonthFilter();
                await loadFixedExpenses();
                // variable-expenses card removed — do not load variable expenses here
                await loadCurrentMonthlyBudget();
                await loadBudgetSummary();
            } catch (uiErr) {
                console.warn('⚠️ خطأ أثناء تحميل واجهة الميزانية في finally:', uiErr);
            }
        }
    }

    updateActivePlans(plans) {
        const activePlansContainer = document.getElementById('active-plans');
        if (!activePlansContainer) return;
        
        if (plans.length === 0) {
            activePlansContainer.innerHTML = '<p class="metric-label">لا توجد خطط ميزانية نشطة</p>';
            return;
        }
        
        activePlansContainer.innerHTML = plans.map(plan => `
            <div style="padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div>
                        <h4 style="margin: 0; color: #2d3748;">${plan.planName}</h4>
                        <p style="margin: 0.25rem 0; color: #718096;">${plan.planType} - ${this.formatDate(plan.period.startDate)} إلى ${this.formatDate(plan.period.endDate)}</p>
                    </div>
                    <span class="status-badge status-${plan.status}">${this.getPlanStatusText(plan.status)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>الهدف:</span>
                    <span style="font-weight: 600;">${this.formatCurrency(plan.targets.totalRevenue)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>المُحقق:</span>
                    <span style="font-weight: 600;">${this.formatCurrency(plan.tracking.currentProgress.actualRevenue)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>نسبة التحقق:</span>
                    <span style="font-weight: 600; color: ${plan.tracking.currentProgress.achievementRate >= 80 ? '#38a169' : '#e53e3e'};">${plan.tracking.currentProgress.achievementRate.toFixed(1)}%</span>
                </div>
            </div>
        `).join('');
    }

    getPlanStatusText(status) {
        const statusTexts = {
            'draft': 'مسودة',
            'approved': 'معتمدة',
            'active': 'نشطة',
            'completed': 'مكتملة',
            'cancelled': 'ملغية'
        };
        return statusTexts[status] || status;
    }

    // 💳 تحميل بيانات المعاملات
    async loadTransactionsData() {
        try {
            console.log('💳 جاري تحميل المعاملات المالية...');
            
            const response = await fetch(`${this.apiBaseUrl}/transactions?limit=20`);
            const data = await response.json();
            
            if (data.success) {
                this.updateTransactionsTable(data.transactions);
            } else {
                throw new Error(data.message);
            }
            
            // تحميل بيانات النماذج
            await this.loadFormData();
        } catch (error) {
            console.error('❌ خطأ في تحميل المعاملات:', error);
            this.showAlert('حدث خطأ في تحميل المعاملات', 'danger');
        }
    }

    updateTransactionsTable(transactions) {
        const tableBody = document.getElementById('transactions-table');
        if (!tableBody) return;
        
        if (transactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #718096;">لا توجد معاملات مالية</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = transactions.map(transaction => `
            <tr>
                <td>${transaction.transactionId}</td>
                <td>${this.formatDate(transaction.transactionDate)}</td>
                <td>${this.getTransactionTypeText(transaction.transactionType)}</td>
                <td>${transaction.parties.studentName}</td>
                <td>${this.formatCurrency(transaction.amounts.final)}</td>
                <td>
                    <span class="status-badge status-${transaction.status.current}">
                        ${this.getTransactionStatusText(transaction.status.current)}
                    </span>
                </td>
                <td>
                    <button class="action-btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="viewTransaction('${transaction.transactionId}')">
                        <i class="fas fa-eye"></i> عرض
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getTransactionTypeText(type) {
        const types = {
            'payment_received': 'دفعة مستلمة',
            'refund_issued': 'استرداد',
            'adjustment': 'تسوية',
            'discount_applied': 'خصم',
            'penalty_added': 'غرامة',
            'transfer': 'تحويل',
            'correction': 'تصحيح'
        };
        return types[type] || type;
    }

    getTransactionStatusText(status) {
        const statuses = {
            'pending': 'معلق',
            'verified': 'موثق',
            'completed': 'مكتمل',
            'cancelled': 'ملغي',
            'disputed': 'متنازع عليه'
        };
        return statuses[status] || status;
    }

    // 🧑‍🏫 تحميل بيانات اشتراكات المدرسين
    async loadTeachersSubscriptionsData() {
        try {
            console.log('🧑‍🏫 جاري تحميل اشتراكات المدرسين...');
            
            // تحميل بيانات المدرسين
            const teachersResponse = await fetch(`${this.apiBaseUrl}/teachers`);
            const teachersData = await teachersResponse.json();
            
            // تحميل بيانات المجموعات
            const groupsResponse = await fetch(`${this.apiBaseUrl}/groups`);
            const groupsData = await groupsResponse.json();
            
            if (teachersData.success && groupsData.success) {
                this.updateTeachersSubscriptionsTable(teachersData.teachers, groupsData.groups);
                await this.updateSubscriptionsSummary();
            } else {
                throw new Error('فشل في تحميل البيانات');
            }
            
        } catch (error) {
            console.error('❌ خطأ في تحميل اشتراكات المدرسين:', error);
        }
    }

    updateTeachersSubscriptionsTable(teachers, groups) {
        const tableBody = document.getElementById('subscriptions-table');
        if (!tableBody) return;
        
        if (teachers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #718096;">لا يوجد مدرسين مسجلين</td>
                </tr>
            `;
            return;
        }
        
        // حساب البيانات لكل مدرس
        const teachersWithCalculations = teachers.map(teacher => {
            // البحث عن المجموعات المرتبطة بالمدرس
            const teacherGroups = groups.filter(group => group.teacherId === teacher._id);
            
            // حساب إجمالي الإيراد المتوقع للمدرس
            const totalExpectedRevenue = teacherGroups.reduce((sum, group) => {
                return sum + (group.studentCount * group.monthlyFee || 0);
            }, 0);
            
            // حساب الإيراد المحصل فعلياً
            const totalCollectedRevenue = teacherGroups.reduce((sum, group) => {
                return sum + (group.collectedAmount || 0);
            }, 0);
            
            // حساب استحقاق المدرس (نسبة مئوية من الإيراد المحصل)
            const teacherPercentage = teacher.subscriptionSettings?.percentage || 70;
            const teacherDue = totalCollectedRevenue * (teacherPercentage / 100);
            
            // حساب نصيب المؤسسة
            const institutionDue = totalCollectedRevenue - teacherDue;
            
            return {
                ...teacher,
                groupsCount: teacherGroups.length,
                totalExpectedRevenue,
                totalCollectedRevenue,
                teacherPercentage,
                teacherDue,
                institutionDue,
                subscriptionType: teacher.subscriptionSettings?.type || 'percentage'
            };
        });
        
        tableBody.innerHTML = teachersWithCalculations.map(teacher => `
            <tr>
                <td>${teacher.fullName}</td>
                <td>${teacher.groupsCount}</td>
                <td>${teacher.subscriptionType === 'percentage' ? teacher.teacherPercentage + '%' : 'راتب ثابت'}</td>
                <td>${this.formatCurrency(teacher.totalExpectedRevenue)}</td>
                <td>${this.formatCurrency(teacher.totalCollectedRevenue)}</td>
                <td>${this.formatCurrency(teacher.teacherDue)}</td>
                <td>
                    <button class="action-btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="editTeacherSubscription('${teacher._id}')">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="action-btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; margin-right: 0.25rem;" onclick="viewTeacherDetails('${teacher._id}')">
                        <i class="fas fa-eye"></i> عرض
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async updateSubscriptionsSummary() {
        try {
            // تحميل إحصائيات الاشتراكات
            const response = await fetch(`${this.apiBaseUrl}/analytics/subscriptions-summary`);
            const data = await response.json();
            
            if (data.success) {
                const summary = data.summary;
                
                // تحديث ملخص الإيرادات
                document.getElementById('total-revenue-summary').textContent = this.formatCurrency(summary.totalRevenue || 0);
                document.getElementById('teachers-dues-summary').textContent = this.formatCurrency(summary.totalTeachersDues || 0);
                document.getElementById('institution-profit-summary').textContent = this.formatCurrency(summary.institutionProfit || 0);
                
                // تحديث نسبة الأرباح
                const profitPercentage = summary.totalRevenue > 0 ? 
                    ((summary.institutionProfit / summary.totalRevenue) * 100).toFixed(1) : 0;
                document.getElementById('profit-percentage').textContent = profitPercentage + '%';
            }
        } catch (error) {
            console.error('❌ خطأ في تحديث ملخص الاشتراكات:', error);
        }
    }

    // 📊 إنشاء التقارير
    // generateMonthlyReport & generateDailyMetrics removed (UI action buttons removed)

    // 🎯 إدارة خطط الميزانية
    // budget plan-related handlers removed (UI/actions removed)

    // 💳 إدارة المعاملات المالية
    async handleTransactionSubmit(event) {
        event.preventDefault();
        
        try {
            const transactionData = {
                transactionType: document.getElementById('modal-transaction-type').value,
                amount: parseFloat(document.getElementById('modal-amount').value),
                studentId: document.getElementById('modal-student').value,
                groupId: document.getElementById('modal-group').value,
                paymentMethod: document.getElementById('modal-payment-method').value,
                notes: document.getElementById('modal-notes').value
            };
            
            console.log('💳 تسجيل معاملة مالية جديدة:', transactionData);
            this.showAlert('جاري تسجيل المعاملة المالية...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transactionData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert(`تم تسجيل المعاملة بنجاح - رقم الإيصال: ${data.receiptNumber}`, 'success');
                if (this.currentTab === 'transactions') {
                    await this.loadTransactionsData();
                }
                this.closeTransactionModal();
            } else {
                throw new Error(data.message);
            }
            
        } catch (error) {
            console.error('❌ خطأ في تسجيل المعاملة المالية:', error);
            this.showAlert('حدث خطأ في تسجيل المعاملة المالية', 'danger');
        }
    }

    // � حساب التقدم اليومي
    calculateDailyProgress() {
        const now = new Date();
        const currentDay = now.getDate();
        const daysInMonth = this.getDaysInCurrentMonth();
        const monthlyData = this.dailyRevenueTracker.monthlyData;
        
        // حساب إيراد اليوم الحالي
        const todayData = monthlyData.find(day => day.day === currentDay);
        const todayRevenue = todayData ? todayData.revenue : 0;
        
        // حساب إجمالي الإيراد حتى اليوم
        const totalRevenueToDate = monthlyData
            .filter(day => day.day <= currentDay)
            .reduce((sum, day) => sum + day.revenue, 0);
        
        // حساب الهدف المطلوب حتى اليوم
        const targetToDate = this.dailyRevenueTracker.targetDaily * currentDay;
        
        // حساب نسبة التقدم
        const progressPercent = targetToDate > 0 ? ((totalRevenueToDate / targetToDate) * 100) : 0;
        
        return {
            daysCompleted: currentDay,
            totalDays: daysInMonth,
            progressPercent: progressPercent.toFixed(1),
            todayRevenue: todayRevenue,
            totalRevenueToDate: totalRevenueToDate,
            targetToDate: targetToDate
        };
    }

    // �🔧 Helper Methods

    calculateStartDate(planType) {
        const now = new Date();
        if (planType === 'monthly') {
            return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        } else if (planType === 'quarterly') {
            const quarter = Math.floor(now.getMonth() / 3);
            return new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
        } else if (planType === 'yearly') {
            return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        }
        return now.toISOString().split('T')[0];
    }

    calculateEndDate(planType) {
        const now = new Date();
        if (planType === 'monthly') {
            return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        } else if (planType === 'quarterly') {
            const quarter = Math.floor(now.getMonth() / 3);
            return new Date(now.getFullYear(), (quarter + 1) * 3, 0).toISOString().split('T')[0];
        } else if (planType === 'yearly') {
            return new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        }
        return now.toISOString().split('T')[0];
    }

    async loadFormData() {
        try {
            // تحميل قائمة الطلاب
            const studentsResponse = await fetch('/api/students');
            const studentsData = await studentsResponse.json();
            
            if (studentsData.success) {
                const studentSelect = document.getElementById('modal-student');
                if (studentSelect) {
                    studentSelect.innerHTML = studentsData.students.map(student => 
                        `<option value="${student._id}">${student.name}</option>`
                    ).join('');
                }
            }
            
            // تحميل قائمة المجموعات
            const groupsResponse = await fetch('/api/groups');
            const groupsData = await groupsResponse.json();
            
            if (groupsData.success) {
                const groupSelect = document.getElementById('modal-group');
                if (groupSelect) {
                    groupSelect.innerHTML = groupsData.groups.map(group => 
                        `<option value="${group._id}">${group.subject} - ${group.teacher}</option>`
                    ).join('');
                }
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل بيانات النماذج:', error);
        }
    }

    generateMockMonthlyData() {
        return Array.from({ length: 12 }, () => Math.floor(Math.random() * 50000) + 20000);
    }

    // 🔄 تحضير بيانات تجريبية للتتبع اليومي
    prepareMockDailyRevenueTracker() {
        console.log('🚀 بدء تحضير بيانات تجريبية للتتبع اليومي...');
        
        const daysInMonth = this.getDaysInCurrentMonth();
        const currentDay = new Date().getDate();
        
        // إنشاء بيانات تجريبية للأيام
        const mockDailyData = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(new Date().getFullYear(), new Date().getMonth(), day);
            
            // محاكاة إيراد يومي عشوائي (أكثر في الأيام المبكرة من الشهر)
            let dailyRevenue = 0;
            if (day <= currentDay) {
                // للأيام اللي عدت، نديها قيم حقيقية
                dailyRevenue = Math.floor(Math.random() * 5000) + 1000; // بين 1000-6000
                
                // زيادة الإيراد في بداية ونهاية الشهر (مواسم الدفع)
                if (day <= 5 || day >= 25) {
                    dailyRevenue *= 1.5;
                }
            }
            
            mockDailyData.push({
                day: day,
                date: currentDate,
                revenue: Math.floor(dailyRevenue),
                dayName: currentDate.toLocaleDateString('ar-EG', { weekday: 'short' })
            });
        }
        
        // تحديد هدف يومي تجريبي
        const mockMonthlyTarget = 150000; // 150 ألف جنيه شهرياً
        
        this.dailyRevenueTracker = {
            monthlyData: mockDailyData,
            targetDaily: mockMonthlyTarget / daysInMonth,
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear()
        };
        
        console.log('✅ تم تحضير بيانات تجريبية للتتبع اليومي:', {
            أيام_الشهر: daysInMonth,
            اليوم_الحالي: currentDay,
            الهدف_اليومي: this.formatCurrency(this.dailyRevenueTracker.targetDaily),
            البيانات_المولدة: mockDailyData.length,
            عينة_البيانات: mockDailyData.slice(0, 5).map(day => ({
                يوم: day.day,
                إيراد: day.revenue,
                اسم_اليوم: day.dayName
            }))
        });
        
        // تحديث المعلومات الإضافية للتتبع اليومي
        this.updateDailyTrackingInfo();
    }

    // 📊 تحديث معلومات التتبع اليومي في الواجهة
    updateDailyTrackingInfo() {
        if (!this.dailyRevenueTracker) return;
        
        const currentDay = new Date().getDate();
        const dailyData = this.dailyRevenueTracker.monthlyData;
        
        // حساب الإيراد حتى اليوم
        const revenueToDate = dailyData
            .filter(day => day.day <= currentDay)
            .reduce((sum, day) => sum + day.revenue, 0);
        
        // حساب المتوقع حتى اليوم
        const expectedToDate = this.dailyRevenueTracker.targetDaily * currentDay;
        
        // حساب معدل الإنجاز
        const achievementRate = (revenueToDate / expectedToDate * 100).toFixed(1);
        
        // حساب الإيراد اليومي لليوم الحالي
        const todayRevenue = dailyData.find(day => day.day === currentDay)?.revenue || 0;
        
        // تحديث العناصر في الواجهة إذا كانت موجودة
        const monthlyRevenueElement = document.getElementById('monthly-revenue');
        if (monthlyRevenueElement) {
            monthlyRevenueElement.textContent = this.formatCurrency(revenueToDate);
        }
        
        const dailyTrackingElement = document.getElementById('daily-tracking-info');
        if (dailyTrackingElement) {
            dailyTrackingElement.innerHTML = `
                <div class="daily-tracking-simple">
                    <div class="tracking-row">
                        <div class="tracking-item-simple">
                            <span class="tracking-icon">💰</span>
                            <div class="tracking-content">
                                <span class="tracking-label-simple">إيراد اليوم (${currentDay} أكتوبر)</span>
                                <span class="tracking-value-simple daily-amount">${this.formatCurrency(todayRevenue)}</span>
                            </div>
                        </div>
                        
                        <div class="tracking-item-simple">
                            <span class="tracking-icon">📈</span>
                            <div class="tracking-content">
                                <span class="tracking-label-simple">الإيراد التراكمي (من 1 لـ ${currentDay} أكتوبر)</span>
                                <span class="tracking-value-simple cumulative-actual">${this.formatCurrency(revenueToDate)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        console.log('📈 تم تحديث معلومات التتبع اليومي المبسط:', {
            اليوم_الحالي: currentDay,
            إيراد_اليوم_فقط: this.formatCurrency(todayRevenue),
            الإيراد_التراكمي_المحصل: this.formatCurrency(revenueToDate)
        });
    }

    // 📊 تحضير بيانات نسبة التحصيل الشهرية
    async prepareCollectionRateTracker(realData) {
        console.log('🚀 بدء تحضير متتبع نسبة التحصيل...');
        
        try {
            // الحصول على بيانات المجموعات والاشتراكات
            const groupsResponse = await fetch('/api/groups');
            const subscriptionsResponse = await fetch('/api/payments/subscriptions');
            
            const groups = groupsResponse.ok ? await groupsResponse.json() : [];
            const subscriptions = subscriptionsResponse.ok ? await subscriptionsResponse.json() : [];
            
            // حساب المبلغ المستحق للشهر الحالي
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            let totalDue = 0;
            let totalCollected = 0;
            
            // حساب المبلغ المستحق من المجموعات
            groups.forEach(group => {
                const monthlyFee = group.monthlyFee || 0;
                const studentsCount = group.students ? group.students.length : 0;
                const groupDue = monthlyFee * studentsCount;
                totalDue += groupDue;
            });
            
            // حساب المبلغ المحصل من الاشتراكات
            subscriptions.forEach(subscription => {
                const subscriptionDate = new Date(subscription.createdAt || subscription.date);
                if (subscriptionDate.getMonth() === currentMonth && 
                    subscriptionDate.getFullYear() === currentYear) {
                    totalCollected += subscription.amount || 0;
                }
            });
            
            // حساب نسبة التحصيل
            const collectionRate = totalDue > 0 ? (totalCollected / totalDue) * 100 : 0;
            
            this.collectionRateTracker = {
                currentMonth: currentMonth,
                currentYear: currentYear,
                totalDue: totalDue,
                totalCollected: totalCollected,
                collectionRate: collectionRate,
                lastUpdated: new Date()
            };
            
            console.log('✅ تم تحضير متتبع نسبة التحصيل:', {
                الشهر_الحالي: new Date().toLocaleDateString('ar-EG', { month: 'long' }),
                المبلغ_المستحق: this.formatCurrency(totalDue),
                المبلغ_المحصل: this.formatCurrency(totalCollected),
                نسبة_التحصيل: `${collectionRate.toFixed(1)}%`
            });
            
            // تحديث الواجهة
            this.updateCollectionRateDisplay();
            
        } catch (error) {
            console.error('❌ خطأ في تحضير متتبع نسبة التحصيل:', error);
            // استخدام بيانات تجريبية في حالة الخطأ
            this.prepareMockCollectionRateTracker();
        }
    }

    // 🔄 تحضير بيانات تجريبية لنسبة التحصيل
    prepareMockCollectionRateTracker() {
        console.log('🔄 تحضير بيانات تجريبية لنسبة التحصيل...');
        
        // بيانات تجريبية
        const currentDay = new Date().getDate();
        const mockTotalDue = 120000; // 120 ألف جنيه مستحق
        const mockTotalCollected = mockTotalDue * 0.785; // 78.5% محصل
        
        this.collectionRateTracker = {
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            totalDue: mockTotalDue,
            totalCollected: mockTotalCollected,
            collectionRate: 78.5,
            lastUpdated: new Date()
        };
        
        console.log('📊 تم تحضير بيانات تجريبية لنسبة التحصيل:', {
            المبلغ_المستحق: this.formatCurrency(mockTotalDue),
            المبلغ_المحصل: this.formatCurrency(mockTotalCollected),
            نسبة_التحصيل: '78.5%'
        });
        
        this.updateCollectionRateDisplay();
    }

    // 📈 تحديث عرض نسبة التحصيل في الواجهة
    updateCollectionRateDisplay() {
        if (!this.collectionRateTracker) return;
        
        const { totalDue, totalCollected, collectionRate } = this.collectionRateTracker;
        
        // تحديث النسبة الرئيسية
        const collectionRateElement = document.getElementById('collection-rate');
        if (collectionRateElement) {
            collectionRateElement.textContent = `${collectionRate.toFixed(1)}%`;
        }
        
        // إضافة معلومات تفصيلية
        const collectionInfoElement = document.getElementById('collection-rate-info');
        if (collectionInfoElement) {
            const remaining = totalDue - totalCollected;
            const remainingRate = ((remaining / totalDue) * 100).toFixed(1);
            
            collectionInfoElement.innerHTML = `
                <div class="collection-tracking-details">
                    <div class="collection-item">
                        <span class="collection-icon">💰</span>
                        <div class="collection-content">
                            <span class="collection-label">المبلغ المستحق (الشهر الحالي)</span>
                            <span class="collection-value total-due">${this.formatCurrency(totalDue)}</span>
                        </div>
                    </div>
                    
                    <div class="collection-item">
                        <span class="collection-icon">✅</span>
                        <div class="collection-content">
                            <span class="collection-label">تم تحصيله</span>
                            <span class="collection-value collected">${this.formatCurrency(totalCollected)}</span>
                        </div>
                    </div>
                    
                    <div class="collection-item">
                        <span class="collection-icon">⏳</span>
                        <div class="collection-content">
                            <span class="collection-label">متبقي للتحصيل</span>
                            <span class="collection-value remaining">${this.formatCurrency(remaining)} (${remainingRate}%)</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        console.log('📊 تم تحديث عرض نسبة التحصيل في الواجهة');
    }

    // 📈 تحضير بيانات معدل النمو السنوي
    async prepareAnnualGrowthTracker(realData) {
        console.log('🚀 بدء تحضير متتبع معدل النمو السنوي...');
        
        try {
            // محاولة جلب البيانات التاريخية من الخادم
            const financialHistoryResponse = await fetch('/api/financial-history');
            const historicalData = financialHistoryResponse.ok ? await financialHistoryResponse.json() : [];
            
            // تحليل البيانات السنوية
            const yearlyData = this.analyzeYearlyGrowth(historicalData);
            
            this.annualGrowthTracker = {
                yearlyComparison: yearlyData,
                lastFourYears: yearlyData.slice(-4),
                currentYear: new Date().getFullYear(),
                growthRate: this.calculateAverageGrowthRate(yearlyData),
                lastUpdated: new Date()
            };
            
            console.log('✅ تم تحضير متتبع معدل النمو السنوي:', {
                السنوات_المتاحة: yearlyData.length,
                آخر_4_سنوات: this.annualGrowthTracker.lastFourYears.map(y => y.year),
                معدل_النمو_المتوسط: `${this.annualGrowthTracker.growthRate.toFixed(1)}%`
            });
            
            this.updateAnnualGrowthDisplay();
            
        } catch (error) {
            console.error('❌ خطأ في تحضير متتبع معدل النمو السنوي:', error);
            // استخدام بيانات تجريبية في حالة الخطأ
            this.prepareMockAnnualGrowthTracker();
        }
    }

    // 🔍 تحليل البيانات السنوية للنمو
    analyzeYearlyGrowth(historicalData) {
        const yearlyRevenue = {};
        
        // تجميع الإيرادات حسب السنة
        historicalData.forEach(record => {
            const year = new Date(record.date).getFullYear();
            if (!yearlyRevenue[year]) {
                yearlyRevenue[year] = 0;
            }
            yearlyRevenue[year] += record.amount || 0;
        });
        
        // تحويل لمصفوفة وحساب معدل النمو
        const yearlyData = Object.keys(yearlyRevenue)
            .map(year => ({
                year: parseInt(year),
                revenue: yearlyRevenue[year],
                growthRate: 0
            }))
            .sort((a, b) => a.year - b.year);
        
        // حساب معدل النمو لكل سنة
        for (let i = 1; i < yearlyData.length; i++) {
            const currentRevenue = yearlyData[i].revenue;
            const previousRevenue = yearlyData[i - 1].revenue;
            
            if (previousRevenue > 0) {
                yearlyData[i].growthRate = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
            }
        }
        
        return yearlyData;
    }

    // 📊 حساب معدل النمو المتوسط
    calculateAverageGrowthRate(yearlyData) {
        const growthRates = yearlyData.slice(1).map(year => year.growthRate);
        return growthRates.length > 0 
            ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length 
            : 0;
    }

    // 🔄 تحضير بيانات تجريبية لمعدل النمو السنوي
    prepareMockAnnualGrowthTracker() {
        console.log('🔄 تحضير بيانات تجريبية لمعدل النمو السنوي...');
        
        const currentYear = new Date().getFullYear();
        const mockYearlyData = [
            { year: currentYear - 3, revenue: 850000, growthRate: 0 },
            { year: currentYear - 2, revenue: 920000, growthRate: 8.2 },
            { year: currentYear - 1, revenue: 1050000, growthRate: 14.1 },
            { year: currentYear, revenue: 1180000, growthRate: 12.4 }
        ];
        
        this.annualGrowthTracker = {
            yearlyComparison: mockYearlyData,
            lastFourYears: mockYearlyData,
            currentYear: currentYear,
            growthRate: 11.6, // متوسط النمو
            lastUpdated: new Date()
        };
        
        console.log('📊 تم تحضير بيانات تجريبية لمعدل النمو السنوي:', {
            آخر_4_سنوات: mockYearlyData.map(y => `${y.year}: ${this.formatCurrency(y.revenue)} (نمو: ${y.growthRate.toFixed(1)}%)`),
            معدل_النمو_المتوسط: '11.6%'
        });
        
        this.updateAnnualGrowthDisplay();
    }

    // 📈 تحديث عرض معدل النمو السنوي في الواجهة
    updateAnnualGrowthDisplay() {
        if (!this.annualGrowthTracker) return;
        
        const { growthRate, lastFourYears } = this.annualGrowthTracker;
        
        // تحديث النسبة الرئيسية
        const growthRateElement = document.getElementById('growth-rate');
        if (growthRateElement) {
            growthRateElement.textContent = `${growthRate.toFixed(1)}%`;
        }
        
        // إضافة جدول المقارنة للسنوات الأربع الماضية
        const growthInfoElement = document.getElementById('growth-rate-info');
        if (growthInfoElement) {
            growthInfoElement.innerHTML = `
                <div class="growth-comparison-table">
                    <h4 class="comparison-title">📊 مقارنة آخر 4 سنوات</h4>
                    <div class="years-comparison">
                        ${lastFourYears.map(yearData => `
                            <div class="year-item ${yearData.year === this.annualGrowthTracker.currentYear ? 'current-year' : ''}">
                                <div class="year-header">
                                    <span class="year-label">${yearData.year}</span>
                                    <span class="growth-badge ${yearData.growthRate > 0 ? 'positive' : yearData.growthRate < 0 ? 'negative' : 'neutral'}">
                                        ${yearData.growthRate > 0 ? '+' : ''}${yearData.growthRate.toFixed(1)}%
                                    </span>
                                </div>
                                <div class="year-revenue">${this.formatCurrency(yearData.revenue)}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="growth-summary">
                        <span class="summary-label">متوسط معدل النمو:</span>
                        <span class="summary-value ${growthRate > 0 ? 'positive' : 'negative'}">${growthRate.toFixed(1)}%</span>
                    </div>
                </div>
            `;
        }
        
        console.log('📊 تم تحديث عرض معدل النمو السنوي في الواجهة');
    }

    // 📋 تحميل بيانات التقارير المالية
    async loadReportsData() {
        console.log('📋 جاري تحميل التقارير المالية...');
        
        try {
            // جلب التقارير من الخادم
            const response = await fetch('/api/financial-analytics/reports?limit=20');
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ تم جلب التقارير بنجاح:', data.reports.length);
                this.updateReportsList(data.reports);
            } else {
                throw new Error(data.message || 'فشل في جلب التقارير');
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل التقارير:', error);
            // استخدام بيانات تجريبية
            this.loadMockReportsData();
        }
    }

    // 🔄 تحميل بيانات تجريبية للتقارير
    loadMockReportsData() {
        console.log('🔄 تحميل بيانات تجريبية للتقارير...');
        
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        const mockReports = [
            {
                reportId: `RPT_${currentYear}_${currentMonth.toString().padStart(2, '0')}_MONTHLY`,
                reportType: 'monthly',
                period: { year: currentYear, month: currentMonth },
                status: 'finalized',
                generatedAt: new Date(),
                financialData: {
                    totalRevenue: 145000,
                    collectedRevenue: 123500,
                    expectedRevenue: 150000,
                    collectionRate: 85.3,
                    expenses: 35000,
                    netProfit: 88500,
                    studentCount: 156,
                    groupCount: 12
                }
            },
            {
                reportId: `RPT_${currentYear}_${(currentMonth-1).toString().padStart(2, '0')}_MONTHLY`,
                reportType: 'monthly',
                period: { year: currentYear, month: currentMonth - 1 },
                status: 'finalized',
                generatedAt: new Date(currentYear, currentMonth - 2, 1),
                financialData: {
                    totalRevenue: 138000,
                    collectedRevenue: 115000,
                    expectedRevenue: 142000,
                    collectionRate: 81.0,
                    expenses: 32000,
                    netProfit: 83000,
                    studentCount: 148,
                    groupCount: 11
                }
            },
            {
                reportId: `RPT_${currentYear-1}_YEARLY`,
                reportType: 'yearly',
                period: { year: currentYear - 1 },
                status: 'finalized',
                generatedAt: new Date(currentYear, 0, 1),
                financialData: {
                    totalRevenue: 1650000,
                    collectedRevenue: 1420000,
                    expectedRevenue: 1680000,
                    collectionRate: 84.5,
                    expenses: 420000,
                    netProfit: 1000000,
                    studentCount: 165,
                    groupCount: 14
                }
            }
        ];
        
        console.log('📊 تم تحضير بيانات تجريبية للتقارير:', mockReports.length);
        this.updateReportsList(mockReports);
    }

    // 📋 تحديث قائمة التقارير في الواجهة
    updateReportsList(reports) {
        const reportsList = document.getElementById('reports-list');
        if (!reportsList) return;
        
        if (reports.length === 0) {
            reportsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt" style="font-size: 3rem; color: #cbd5e0; margin-bottom: 1rem;"></i>
                    <p class="metric-label">لا توجد تقارير مالية حالياً</p>
                </div>
            `;
            return;
        }
        
        reportsList.innerHTML = reports.map(report => `
            <div class="report-item" onclick="viewReport('${report.reportId}')">
                <div class="report-header">
                    <div class="report-info">
                        <h4 class="report-title">${this.getReportTitle(report)}</h4>
                        <p class="report-date">${this.formatDate(report.generatedAt)}</p>
                        <span class="report-status ${report.status}">${this.getStatusText(report.status)}</span>
                    </div>
                    <div class="report-summary">
                        <div class="summary-item">
                            <span class="summary-label">الإيراد المحصل</span>
                            <span class="summary-value revenue">${this.formatCurrency(report.financialData.collectedRevenue)}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">نسبة التحصيل</span>
                            <span class="summary-value rate ${report.financialData.collectionRate > 85 ? 'good' : report.financialData.collectionRate > 70 ? 'average' : 'poor'}">
                                ${report.financialData.collectionRate.toFixed(1)}%
                            </span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">صافي الربح</span>
                            <span class="summary-value profit">${this.formatCurrency(report.financialData.netProfit)}</span>
                        </div>
                    </div>
                </div>
                <div class="report-actions">
                    <button class="action-btn btn-sm" onclick="event.stopPropagation(); downloadReport('${report.reportId}')">
                        <i class="fas fa-download"></i> تحميل
                    </button>
                    <button class="action-btn btn-sm" onclick="event.stopPropagation(); printReport('${report.reportId}')">
                        <i class="fas fa-print"></i> طباعة
                    </button>
                </div>
            </div>
        `).join('');
        
        console.log('📋 تم تحديث قائمة التقارير في الواجهة');
    }

    // 🏷️ إنشاء عنوان التقرير
    getReportTitle(report) {
        const monthNames = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        
        switch (report.reportType) {
            case 'monthly':
                return `تقرير شهر ${monthNames[report.period.month - 1]} ${report.period.year}`;
            case 'yearly':
                return `التقرير السنوي ${report.period.year}`;
            case 'quarterly':
                return `تقرير الربع ${report.period.quarter} - ${report.period.year}`;
            default:
                return 'تقرير مالي';
        }
    }

    // 🏷️ نص حالة التقرير
    getStatusText(status) {
        const statusMap = {
            'draft': 'مسودة',
            'pending': 'قيد المراجعة',
            'finalized': 'مكتمل',
            'archived': 'مؤرشف'
        };
        return statusMap[status] || status;
    }

    // 📊 عرض تفاصيل التقرير
    async viewReport(reportId) {
        console.log('📊 عرض تقرير:', reportId);
        
        try {
            // جلب تفاصيل التقرير
            const response = await fetch(`/api/financial-analytics/reports/${reportId}`);
            const data = await response.json();
            
            if (data.success) {
                this.showReportModal(data.report);
            } else {
                // استخدام بيانات تجريبية
                this.showMockReportModal(reportId);
            }
        } catch (error) {
            console.error('❌ خطأ في جلب التقرير:', error);
            this.showMockReportModal(reportId);
        }
    }

    // 🔄 عرض مودال تقرير تجريبي
    showMockReportModal(reportId) {
        const mockReport = {
            reportId: reportId,
            reportType: 'monthly',
            period: { year: 2025, month: 10 },
            generatedAt: new Date(),
            financialData: {
                totalRevenue: 145000,
                collectedRevenue: 123500,
                expectedRevenue: 150000,
                collectionRate: 85.3,
                expenses: 35000,
                netProfit: 88500,
                studentCount: 156,
                groupCount: 12,
                topPerformingGroups: [
                    { name: 'الرياضيات - الصف الثالث', revenue: 25000, students: 25 },
                    { name: 'الفيزياء - الصف الثاني', revenue: 22000, students: 22 },
                    { name: 'الكيمياء - الصف الأول', revenue: 20000, students: 20 }
                ],
                monthlyComparison: {
                    revenueGrowth: 5.1,
                    collectionImprovement: 4.3,
                    studentGrowth: 5.4
                }
            }
        };
        
        this.showReportModal(mockReport);
    }

    // 📋 عرض مودال التقرير
    showReportModal(report) {
        const modalHTML = `
            <div id="reportModal" class="modal-overlay" onclick="closeReportModal()">
                <div class="modal-content report-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${this.getReportTitle(report)}</h3>
                        <button class="modal-close" onclick="closeReportModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="report-details">
                            <!-- ملخص مالي -->
                            <div class="detail-section">
                                <h4><i class="fas fa-chart-line"></i> الملخص المالي</h4>
                                <div class="financial-summary">
                                    <div class="summary-grid">
                                        <div class="summary-card">
                                            <span class="card-label">الإيراد الإجمالي</span>
                                            <span class="card-value">${this.formatCurrency(report.financialData.totalRevenue)}</span>
                                        </div>
                                        <div class="summary-card">
                                            <span class="card-label">المحصل فعلياً</span>
                                            <span class="card-value collected">${this.formatCurrency(report.financialData.collectedRevenue)}</span>
                                        </div>
                                        <div class="summary-card">
                                            <span class="card-label">نسبة التحصيل</span>
                                            <span class="card-value rate">${report.financialData.collectionRate.toFixed(1)}%</span>
                                        </div>
                                        <div class="summary-card">
                                            <span class="card-label">صافي الربح</span>
                                            <span class="card-value profit">${this.formatCurrency(report.financialData.netProfit)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- إحصائيات الطلاب -->
                            <div class="detail-section">
                                <h4><i class="fas fa-users"></i> إحصائيات الطلاب والمجموعات</h4>
                                <div class="stats-grid">
                                    <div class="stat-item">
                                        <span class="stat-number">${report.financialData.studentCount}</span>
                                        <span class="stat-label">إجمالي الطلاب</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-number">${report.financialData.groupCount}</span>
                                        <span class="stat-label">عدد المجموعات</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-number">${(report.financialData.collectedRevenue / report.financialData.studentCount).toFixed(0)}</span>
                                        <span class="stat-label">متوسط الإيراد/طالب</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- أفضل المجموعات -->
                            ${report.financialData.topPerformingGroups ? `
                                <div class="detail-section">
                                    <h4><i class="fas fa-trophy"></i> أفضل المجموعات أداءً</h4>
                                    <div class="top-groups">
                                        ${report.financialData.topPerformingGroups.map((group, index) => `
                                            <div class="group-item">
                                                <span class="group-rank">${index + 1}</span>
                                                <div class="group-info">
                                                    <span class="group-name">${group.name}</span>
                                                    <span class="group-stats">${group.students} طالب</span>
                                                </div>
                                                <span class="group-revenue">${this.formatCurrency(group.revenue)}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="action-btn btn-primary" onclick="downloadReport('${report.reportId}')">
                            <i class="fas fa-download"></i> تحميل PDF
                        </button>
                        <button class="action-btn btn-secondary" onclick="printReport('${report.reportId}')">
                            <i class="fas fa-print"></i> طباعة
                        </button>
                        <button class="action-btn btn-tertiary" onclick="closeReportModal()">
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
    }

    loadMockDashboardData() {
        console.log('🔄 تحميل بيانات تجريبية...');
        
        // حساب إجمالي الإيراد التجريبي حتى اليوم
        const currentDay = new Date().getDate();
        const mockTotalRevenue = currentDay * 2500; // متوسط 2500 جنيه يومياً
        
    document.getElementById('monthly-revenue').textContent = this.formatCurrency(mockTotalRevenue);
    document.getElementById('collection-rate').textContent = '78.5%';
    document.getElementById('growth-rate').textContent = '12.3%';
        
        // جدول المجموعات التجريبية
        const mockGroups = [
            { subjectName: 'الرياضيات - الصف الثالث', studentsCount: 25, expectedAmount: 25000, collectedAmount: 20000, collectionRate: 80 },
            { subjectName: 'الفيزياء - الصف الثاني', studentsCount: 20, expectedAmount: 20000, collectedAmount: 15000, collectionRate: 75 },
            { subjectName: 'الكيمياء - الصف الأول', studentsCount: 18, expectedAmount: 18000, collectedAmount: 16000, collectionRate: 89 }
        ];
        
        this.updateTopGroupsTable(mockGroups);
        
        // تحضير بيانات تجريبية للتتبع اليومي
        this.prepareMockDailyRevenueTracker();
        
        // تحضير بيانات تجريبية لنسبة التحصيل
        this.prepareMockCollectionRateTracker();
        
        // تحضير بيانات تجريبية لمعدل النمو السنوي
        this.prepareMockAnnualGrowthTracker();
        
    this.createDailyRevenueTrackerChart();
    this.createCollectionChart();
    this.createGrowthChart();
        // (removed mock data injection for budget netprofit card)
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    }

    showAlert(message, type = 'info') {
        // إزالة التنبيهات السابقة
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'}"></i>
            ${message}
        `;
        
        const container = document.querySelector('.analytics-container');
        container.insertBefore(alertDiv, container.firstChild);
        
        // إزالة التنبيه تلقائياً بعد 5 ثوان
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    // budget plan modal functionality removed (modal and actions deleted from HTML)

    showTransactionModal() {
        document.getElementById('transaction-modal').style.display = 'block';
        this.loadFormData();
    }

    closeTransactionModal() {
        document.getElementById('transaction-modal').style.display = 'none';
        document.getElementById('transaction-modal-form').reset();
    }

    // exportReports removed — action button removed from UI

    // فحص حالة البيانات الحقيقية
    // checkRealDataStatus removed — quick-check action removed from UI

    refreshReports() {
        if (this.currentTab === 'reports') {
            this.loadReportsData();
        }
    }

    viewReport(reportId) {
        this.showAlert(`عرض التقرير ${reportId} - قيد التطوير`, 'info');
    }

    viewTransaction(transactionId) {
        this.showAlert(`عرض المعاملة ${transactionId} - قيد التطوير`, 'info');
    }
    // 📋 تحديث معلومات التتبع اليومي في الواجهة
    updateDailyTrackingInfo(dailyProgress) {
        try {
            // تحديث الهدف اليومي
            const dailyTargetElement = document.getElementById('daily-target');
            if (dailyTargetElement) {
                dailyTargetElement.textContent = this.formatCurrency(this.dailyRevenueTracker.targetDaily);
            }
            
            // تحديث معدل التحقق
            const achievementRateElement = document.getElementById('achievement-rate');
            if (achievementRateElement) {
                const rate = parseFloat(dailyProgress.progressPercent);
                achievementRateElement.textContent = `${dailyProgress.progressPercent}%`;
                
                // تلوين النسبة حسب الأداء
                if (rate >= 100) {
                    achievementRateElement.style.color = '#38a169'; // أخضر - ممتاز
                } else if (rate >= 80) {
                    achievementRateElement.style.color = '#48bb78'; // أخضر فاتح - جيد
                } else if (rate >= 60) {
                    achievementRateElement.style.color = '#ed8936'; // برتقالي - متوسط
                } else {
                    achievementRateElement.style.color = '#e53e3e'; // أحمر - ضعيف
                }
            }
            
            console.log('📋 تم تحديث معلومات التتبع اليومي:', {
                dailyTarget: this.formatCurrency(this.dailyRevenueTracker.targetDaily),
                achievementRate: dailyProgress.progressPercent + '%',
                revenueToDate: this.formatCurrency(dailyProgress.totalRevenueToDate)
            });
            
        } catch (error) {
            console.error('❌ خطأ في تحديث معلومات التتبع:', error);
        }
    }
}

// إنشاء مثيل من مدير التحليلات المالية
let financialAnalyticsManager;

// تبديل التبويبات (وظيفة عامة)
function switchTab(tabName) {
    if (financialAnalyticsManager) {
        financialAnalyticsManager.switchTab(tabName);
    }
}

// legacy quick-actions removed: generateMonthlyReport / budget plan modal wrappers deleted

// إظهار مودال المعاملة المالية (وظيفة عامة)
function showTransactionModal() {
    if (financialAnalyticsManager) {
        financialAnalyticsManager.showTransactionModal();
    }
}

// إغلاق مودال المعاملة المالية (وظيفة عامة)
function closeTransactionModal() {
    if (financialAnalyticsManager) {
        financialAnalyticsManager.closeTransactionModal();
    }
}

// exportReports wrapper removed (action removed from UI)

// تحديث التقارير (وظيفة عامة)
function refreshReports() {
    if (financialAnalyticsManager) {
        financialAnalyticsManager.refreshReports();
    }
}

// عرض التقرير (وظيفة عامة)
function viewReport(reportId) {
    if (financialAnalyticsManager) {
        financialAnalyticsManager.viewReport(reportId);
    }
}

// عرض المعاملة (وظيفة عامة)
function viewTransaction(transactionId) {
    if (financialAnalyticsManager) {
        financialAnalyticsManager.viewTransaction(transactionId);
    }
}

// إظهار مودال اشتراك مدرس (وظيفة عامة)
function showTeacherSubscriptionModal() {
    const modal = document.getElementById('teacher-subscription-modal');
    if (modal) {
        modal.style.display = 'block';
        
        // تحميل قائمة المدرسين في النموذج
        loadTeachersForSubscription();
    }
}

// إغلاق مودال اشتراك مدرس (وظيفة عامة)
function closeTeacherSubscriptionModal() {
    const modal = document.getElementById('teacher-subscription-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('teacher-subscription-form').reset();
    }
}

// تحميل المدرسين في النموذج
async function loadTeachersForSubscription() {
    const teachers = await fetchTeachers();
    const teacherSelect = document.getElementById('teacher-select');
    if (teacherSelect) {
        teacherSelect.innerHTML = '<option value="">-- اختر المدرس --</option>';
        teachers.forEach(t => {
            // store both DB _id as value and the registered teacherId in a data attribute
            const regId = t.teacherId || t._id || '';
            teacherSelect.innerHTML += `<option value="${t._id}" data-registered-id="${regId}">${t.fullName}</option>`;
        });

        // when the selection changes, populate the hidden registered id field
        teacherSelect.addEventListener('change', (ev) => {
            const sel = ev.target;
            const hid = document.getElementById('teacher-registered-id');
            if (!hid) return;
            const opt = sel.options[sel.selectedIndex];
            const rid = opt ? opt.getAttribute('data-registered-id') || '' : '';
            hid.value = rid;
        });
    }
}

// Fetch teachers from API with fallback sample data
async function fetchTeachers() {
    try {
        const response = await fetch(`/api/teachers`);
        const data = await response.json();
        if (data && (data.success || data.ok) && Array.isArray(data.teachers)) {
            return data.teachers.map(t => normalizeTeacher(t));
        }
        // Some endpoints return the array directly
        if (Array.isArray(data)) return data.map(t => normalizeTeacher(t));
    } catch (err) {
        console.warn('⚠️ تعذر جلب المدرسين من API:', err.message || err);
    }

    // Fallback sample teachers
    return [
        normalizeTeacher({ _id: 'teacher1', firstName: 'أحمد', lastName: 'محمد علي', subscriptionSettings: { type: 'percentage', percentage: 70 }, groups: [] }),
        normalizeTeacher({ _id: 'teacher2', firstName: 'فاطمة', lastName: 'حسن أحمد', subscriptionSettings: { type: 'percentage', percentage: 60 }, groups: [] }),
        normalizeTeacher({ _id: 'teacher3', firstName: 'محمود', lastName: 'سعد إبراهيم', subscriptionSettings: { type: 'fixed', fixedSalary: 5000 }, groups: [] })
    ];
}

// Ensure teacher object has expected fields used by the frontend
function normalizeTeacher(t) {
    if (!t) return t;
    const firstName = t.firstName || t.first_name || '';
    const lastName = t.lastName || t.last_name || t.lastName || '';
    const fullName = t.fullName || `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim() || t.fullName || t.teacherId || '---';
    return Object.assign({}, t, { fullName, groups: t.groups || [], subscriptionSettings: t.subscriptionSettings || {} });
}

// حفظ إعدادات اشتراك المدرس
async function saveTeacherSubscription(e) {
    // if called as a form submit handler, prevent default
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    const form = document.getElementById('teacher-subscription-form');
    const formData = new FormData(form);
    
    // التحقق من البيانات المطلوبة
    // prefer registered teacher id (business id) when available
    const teacherId = formData.get('teacherRegisteredId') || formData.get('teacher');
    const subscriptionType = formData.get('subscriptionType');
    
    if (!teacherId) {
        financialAnalyticsManager.showAlert('يرجى اختيار مدرس', 'danger');
        return;
    }
    
    // derive teacherName from the select option text if not provided
    const teacherSelectEl = document.getElementById('teacher-select');
    const selectedTeacherName = (teacherSelectEl && teacherSelectEl.options && teacherSelectEl.options[teacherSelectEl.selectedIndex]
        ? teacherSelectEl.options[teacherSelectEl.selectedIndex].text.trim()
        : '');

    const subscriptionData = {
        teacherId: String(teacherId),
        teacherName: (formData.get('teacherName') || selectedTeacherName || '').trim(),
        subscriptionType: subscriptionType,
        // match backend expected fields
        teacherSharePercent: Number(formData.get('teacherPercentage') || 0),
        centerSharePercent: Number(formData.get('centerPercentage') || 0),
        fixedSalary: Number(formData.get('fixedSalary') || 0),
        notes: formData.get('notes') || ''
    };
    
    // التحقق من صحة النسب للنظام المئوي
    if (subscriptionType === 'percentage') {
        const t = Number(subscriptionData.teacherSharePercent || 0);
        const c = Number(subscriptionData.centerSharePercent || 0);
        const sum = t + c;
        // allow small floating point tolerance (0.01)
        if (Math.abs(sum - 100) > 0.01) {
            financialAnalyticsManager.showAlert(`يجب أن يكون مجموع النسب = 100% (الآن ${sum}%)`, 'danger');
            return;
        }
    }
    
    try {
        // Attempt to send to the financial-transactions endpoint (backend expects this route)
        const response = await fetch('/api/financial-transactions/teacher-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(subscriptionData)
        });
        
        const result = await response.json();
        
        if (result && result.success) {
            financialAnalyticsManager.showAlert('تم حفظ إعدادات الاشتراك بنجاح', 'success');
            closeTeacherSubscriptionModal();
            
            // إعادة تحميل البيانات
            await financialAnalyticsManager.loadTeachersSubscriptionsData();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ خطأ في حفظ الاشتراك:', error);
        
        // حفظ محلي في حالة عدم توفر الـ API
        localStorage.setItem('teacherSubscription_' + teacherId, JSON.stringify(subscriptionData));
        
        financialAnalyticsManager.showAlert('تم حفظ إعدادات الاشتراك محلياً', 'success');
        closeTeacherSubscriptionModal();
        
        // إعادة تحميل البيانات
        await financialAnalyticsManager.loadTeachersSubscriptionsData();
    }
}

// تعديل اشتراك مدرس
function editTeacherSubscription(teacherId) {
    // فتح النموذج مع بيانات المدرس المحددة
    showTeacherSubscriptionModal();
    
    // تحميل بيانات المدرس الحالية
    loadTeacherSubscriptionData(teacherId);
}

// تحميل بيانات اشتراك مدرس معين
async function loadTeacherSubscriptionData(teacherId) {
    try {
        const response = await fetch(`${financialAnalyticsManager.apiBaseUrl}/teachers/${teacherId}`);
        const data = await response.json();
        
        if (data.success) {
            const teacher = data.teacher;
            
            // ملء النموذج بالبيانات الحالية
            document.getElementById('teacher-select').value = teacherId;
            
            if (teacher.subscriptionSettings) {
                document.getElementById('subscription-type').value = teacher.subscriptionSettings.type;
                document.getElementById('teacher-percentage').value = teacher.subscriptionSettings.percentage || 70;
                document.getElementById('center-percentage').value = 100 - (teacher.subscriptionSettings.percentage || 70);
                document.getElementById('fixed-salary').value = teacher.subscriptionSettings.fixedSalary || 0;
                document.getElementById('subscription-notes').value = teacher.subscriptionSettings.notes || '';
            }
            
            // معاينة الحساب
            previewPercentageCalculation();
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل بيانات المدرس:', error);
    }
}

// عرض تفاصيل مدرس
function viewTeacherDetails(teacherId) {
    // يمكن إضافة نافذة منبثقة لعرض تفاصيل المدرس
    console.log('عرض تفاصيل المدرس:', teacherId);
}

// معالج تغيير نوع الاشتراك
function handleSubscriptionTypeChange() {
    const subscriptionType = document.getElementById('subscription-type').value;
    const percentageFields = document.getElementById('percentage-fields');
    const fixedSalaryField = document.getElementById('fixed-salary-field');
    
    if (subscriptionType === 'percentage') {
        percentageFields.style.display = 'block';
        fixedSalaryField.style.display = 'none';
    } else if (subscriptionType === 'fixed') {
        percentageFields.style.display = 'none';
        fixedSalaryField.style.display = 'block';
    } else {
        percentageFields.style.display = 'none';
        fixedSalaryField.style.display = 'none';
    }
    
    // معاينة الحساب عند التغيير
    previewPercentageCalculation();
}

// معالج تغيير النسب المئوية
function handlePercentageChange() {
    const teacherPercentage = parseFloat(document.getElementById('teacher-percentage').value) || 0;
    const centerPercentage = 100 - teacherPercentage;
    
    // تحديث نسبة المركز تلقائياً
    document.getElementById('center-percentage').value = centerPercentage;
    
    // التحقق من صحة النسب
    const teacherInput = document.getElementById('teacher-percentage');
    if (teacherPercentage < 0 || teacherPercentage > 100) {
        teacherInput.style.borderColor = '#e53e3e';
        teacherInput.style.backgroundColor = '#fed7d7';
    } else {
        teacherInput.style.borderColor = '#e2e8f0';
        teacherInput.style.backgroundColor = 'white';
    }
}

// معالج تغيير نسبة المركز
function handleCenterPercentageChange() {
    const centerPercentage = parseFloat(document.getElementById('center-percentage').value) || 0;
    const teacherPercentage = 100 - centerPercentage;
    
    // تحديث نسبة المدرس تلقائياً
    document.getElementById('teacher-percentage').value = teacherPercentage;
    
    // التحقق من صحة النسب
    const centerInput = document.getElementById('center-percentage');
    if (centerPercentage < 0 || centerPercentage > 100) {
        centerInput.style.borderColor = '#e53e3e';
        centerInput.style.backgroundColor = '#fed7d7';
    } else {
        centerInput.style.borderColor = '#e2e8f0';
        centerInput.style.backgroundColor = 'white';
    }
}

// إضافة معالجات الأحداث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // معالج تغيير نوع الاشتراك
    const subscriptionTypeInputs = document.querySelectorAll('input[name="subscriptionType"]');
    subscriptionTypeInputs.forEach(input => {
        input.addEventListener('change', handleSubscriptionTypeChange);
    });
    
    // معالج تغيير النسب المئوية
    const teacherPercentageInput = document.getElementById('teacher-percentage');
    if (teacherPercentageInput) {
        teacherPercentageInput.addEventListener('input', handlePercentageChange);
    }
    
    // معالج تغيير نسبة المركز
    const centerPercentageInput = document.getElementById('center-percentage');
    if (centerPercentageInput) {
        centerPercentageInput.addEventListener('input', handleCenterPercentageChange);
    }
});

// 💰 نظام حساب أرباح المدرسين

// فتح نافذة حساب الأرباح
function calculateAllTeachersRevenue() {
    // Manual trigger: call backend computeProfits endpoint for current month/year
    (async () => {
        const btn = document.getElementById('calculate-profit-btn');
        try {
            if (btn) { btn.disabled = true; btn.textContent = '...جاري الحساب'; }
            financialAnalyticsManager.showAlert('جاري حساب الأرباح (تشغيل يدوي)...', 'info');

            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();

            const resp = await fetch('/api/financial-transactions/compute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month, year, autoExtract: true })
            });

            const data = await resp.json();
            if (resp.ok && data.success) {
                financialAnalyticsManager.showAlert('تم حساب الأرباح بنجاح', 'success');
                // refresh subscriptions summary and distributions
                await loadFinancialTransactionsCache();
                await financialAnalyticsManager.loadTeachersSubscriptionsData();
                // optionally refresh archive/current month
                try { await fetch('/api/archive'); } catch (e) { /* ignore */ }

                // ✅ خطوة إضافية: استدعاء scheduledBuild لبناء التقرير المالي
                try {
                    financialAnalyticsManager.showAlert('جاري بناء التقرير المالي...', 'info');
                    const buildResp = await fetch('/api/budget/scheduled-build', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const buildData = await buildResp.json();
                    if (buildResp.ok && buildData.success) {
                        console.log('✅ تم بناء التقرير المالي بنجاح:', buildData);
                        financialAnalyticsManager.showAlert('تم بناء التقرير المالي بنجاح', 'success');
                    } else {
                        console.warn('⚠️ فشل بناء التقرير المالي:', buildData);
                    }
                } catch (buildErr) {
                    console.error('❌ خطأ في استدعاء scheduledBuild:', buildErr);
                }
            } else {
                const msg = (data && data.message) ? data.message : 'فشل في حساب الأرباح';
                financialAnalyticsManager.showAlert(msg, 'danger');
                console.error('compute returned error', data);
            }
        } catch (err) {
            console.error('خطأ في استدعاء computeProfits:', err);
            financialAnalyticsManager.showAlert('تعذر الاتصال لخدمة حساب الأرباح', 'danger');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-calculator"></i> حساب الأرباح'; }
        }
    })();
}

// فتح نموذج إنشاء فاتورة — يعيد استخدام نافذة حساب أرباح المدرسين
function openCreateInvoiceForm() {
    // فتح مودال إنشاء الفاتورة وتحميل بيانات المدرسين
    const modal = document.getElementById('revenue-calculation-modal');
    if (modal) {
        modal.style.display = 'block';
        loadTeachersForRevenue();
        // يمكن ضبط التركيز على عنصر داخل المودال بعد التحميل
        setTimeout(() => {
            const select = document.getElementById('revenue-teacher-select');
            if (select) select.focus();
        }, 200);
    }
}

// إغلاق نافذة حساب الأرباح
function closeRevenueCalculationModal() {
    const modal = document.getElementById('revenue-calculation-modal');
    if (modal) {
        modal.style.display = 'none';
        // إعادة تعيين النموذج
        document.getElementById('revenue-teacher-select').value = '';
        document.getElementById('revenue-calculation-results').style.display = 'none';
        document.getElementById('calculation-actions').style.display = 'none';
    }
}

// تحميل المدرسين للاختيار من بينهم
async function loadTeachersForRevenue() {
    const teachers = await fetchTeachers();
    // cache for lookup by id
    window.revenueTeachersCache = teachers;
    populateTeachersSelect(teachers);
    // also load precomputed distributions from server
    await loadFinancialTransactionsCache();
}

// Load precomputed financial transactions (singleton) and cache distributions
async function loadFinancialTransactionsCache() {
    try {
        const resp = await fetch('/api/financial-transactions');
        const data = await resp.json();
        if (data && data.success && data.data) {
            window.financialTransactionsCache = data.data;
        } else if (Array.isArray(data)) {
            // some APIs might return array — keep defensive
            window.financialTransactionsCache = { distributions: data };
        } else {
            window.financialTransactionsCache = { distributions: [] };
        }
    } catch (err) {
        console.warn('⚠️ تعذر جلب financialTransactions:', err);
        window.financialTransactionsCache = { distributions: [] };
    }
}

// ملء قائمة المدرسين المنسدلة
function populateTeachersSelect(teachers) {
    const select = document.getElementById('revenue-teacher-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- اختر المدرس --</option>';

    teachers.forEach((teacher) => {
        const safeData = JSON.stringify(teacher).replace(/'/g, "\'");
        select.innerHTML += `<option value="${teacher._id}" data-teacher='${safeData}'>${teacher.fullName}</option>`;
    });
}

// حساب أرباح المدرس المحدد
function calculateTeacherRevenue() {
    const select = document.getElementById('revenue-teacher-select');
    const selectedOption = select.options[select.selectedIndex];
    
    if (!selectedOption.value) {
        document.getElementById('revenue-calculation-results').style.display = 'none';
        document.getElementById('calculation-actions').style.display = 'none';
        return;
    }
    const teacherId = selectedOption.value;
    // try cache first
    let teacher = null;
    if (window.revenueTeachersCache && Array.isArray(window.revenueTeachersCache)) {
        teacher = window.revenueTeachersCache.find(t => String(t._id) === String(teacherId));
    }
    // fallback to data attribute
    if (!teacher) {
        try { teacher = JSON.parse(selectedOption.getAttribute('data-teacher')); } catch (e) { teacher = null; }
    }

    // Rely ONLY on server-side precomputed distributions. Do not perform client-side calculations.
    const ftCache = window.financialTransactionsCache;
    if (!(ftCache && Array.isArray(ftCache.distributions) && teacher)) {
        // no server data available — instruct user to run compute
        document.getElementById('revenue-calculation-results').style.display = 'none';
        document.getElementById('calculation-actions').style.display = 'none';
        financialAnalyticsManager.showAlert('لا توجد بيانات جاهزة لحساب أرباح هذا المدرس. يرجى تشغيل "حساب الأرباح" من الخادم أولاً.', 'warning');
        return;
    }

    // find latest distribution for this teacher (match by registered teacherId or mongo id)
    const dist = ftCache.distributions.slice().reverse().find(d => String(d.teacherId) === String(teacher.teacherId || teacher._id || teacher.id));
    if (!dist) {
        document.getElementById('revenue-calculation-results').style.display = 'none';
        document.getElementById('calculation-actions').style.display = 'none';
        financialAnalyticsManager.showAlert('لا توجد توزيعة محاسبية مسجلة لهذا المدرس في الخادم.', 'warning');
        return;
    }

    // render using server distribution
    displayTeacherCalculationFromDistribution(teacher, dist);
}

// Render teacher calculation using a distribution object from server
function displayTeacherCalculationFromDistribution(teacher, distribution) {
    // distribution fields: totalRevenue, teacherShare, centerShare, groups: [{ groupId, subject, studentCount, groupPrice, totalRevenue, totalCollected }]
    const totalExpected = distribution.groups.reduce((s, g) => s + (g.totalRevenue || 0), 0);
    const totalCollected = distribution.groups.reduce((s, g) => s + (g.totalCollected || 0), 0);
    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    // try to determine subscription type from teacher object (if available)
    const subscriptionType = teacher?.subscriptionSettings?.type || 'percentage';
    let teacherPercentage = teacher?.subscriptionSettings?.percentage || null;

    // if server provided teacherShare and totalRevenue, compute percentage if not present
    if ((teacherPercentage === null || teacherPercentage === undefined) && distribution.totalRevenue) {
        teacherPercentage = distribution.totalRevenue > 0 ? Math.round((distribution.teacherShare / distribution.totalRevenue) * 100) : 0;
    }

    const teacherRevenue = distribution.teacherShare || 0;
    const centerRevenue = distribution.centerShare || 0;

    // update DOM similar to displayTeacherCalculation
    document.getElementById('selected-teacher-name').textContent = teacher.fullName || distribution.teacherName || '';
    document.getElementById('selected-teacher-groups').textContent = `عدد المجموعات: ${distribution.groups.length}`;
    document.getElementById('selected-teacher-type').textContent = subscriptionType === 'percentage' ? 'نسبة مئوية' : 'راتب ثابت';

    document.getElementById('total-expected-revenue').textContent = financialAnalyticsManager.formatCurrency(totalExpected);
    document.getElementById('total-collected-revenue').textContent = financialAnalyticsManager.formatCurrency(totalCollected);
    document.getElementById('collection-percentage').textContent = `${collectionRate.toFixed(1)}%`;

    document.getElementById('teacher-percentage-display').textContent = `${(teacherPercentage || 0).toFixed(1)}%`;
    document.getElementById('center-percentage-display').textContent = `${(100 - (teacherPercentage || 0)).toFixed(1)}%`;
    document.getElementById('teacher-revenue-amount').textContent = financialAnalyticsManager.formatCurrency(teacherRevenue);
    document.getElementById('center-revenue-amount').textContent = financialAnalyticsManager.formatCurrency(centerRevenue);

    // render groups from distribution (map to expected group fields)
    const groups = distribution.groups.map(g => ({
        name: g.subject || g.groupId,
        students: g.studentCount || 0,
        monthlyFee: g.groupPrice || 0,
        collectedAmount: g.totalCollected || 0
    }));
    displayGroupsDetails(groups);

    document.getElementById('revenue-calculation-results').style.display = 'block';
    document.getElementById('calculation-actions').style.display = 'flex';
}

// [REMOVED] client-side teacher calculation: now replaced by server-driven rendering

// عرض تفاصيل المجموعات
function displayGroupsDetails(groups) {
    const container = document.getElementById('teacher-groups-details');
    if (!container) return;
    
    container.innerHTML = groups.map(group => {
        const expectedRevenue = group.students * group.monthlyFee;
        const collectionRate = expectedRevenue > 0 ? (group.collectedAmount / expectedRevenue) * 100 : 0;
        
        return `
            <div class="group-detail-item">
                <div class="group-detail-header">
                    <span class="group-name">${group.name}</span>
                    <span class="group-revenue">${financialAnalyticsManager.formatCurrency(group.collectedAmount)}</span>
                </div>
                <div class="group-stats">
                    <span>الطلاب: ${group.students}</span>
                    <span>الرسوم الشهرية: ${financialAnalyticsManager.formatCurrency(group.monthlyFee)}</span>
                    <span>المتوقع: ${financialAnalyticsManager.formatCurrency(expectedRevenue)}</span>
                    <span>نسبة التحصيل: ${collectionRate.toFixed(1)}%</span>
                </div>
            </div>
        `;
    }).join('');
}

// طباعة الفاتورة
function printInvoice() {
    window.print();
}

// تصدير PDF
function downloadPDF() {
    financialAnalyticsManager.showAlert('سيتم إضافة ميزة تصدير PDF قريباً', 'info');
}

// تسجيل كمدفوع
function markAsPaid() {
    financialAnalyticsManager.showAlert('تم تسجيل المدفوعات بنجاح', 'success');
}

// 💰 نظام إدارة الميزانية الجديد

// تحميل بيانات الميزانية الجديد
async function loadBudgetData() {
    try {
        console.log('💰 جاري تحميل نظام إدارة الميزانية...');
        
        // تحديث فلتر الشهور
        updateMonthFilter();
        
        // تحميل الفواتير الثابتة (للعرض والتعديل فقط)
        await loadFixedExpenses();
        
        // تحميل/إنشاء الفاتورة الشهرية الديناميكية
        await loadCurrentMonthlyBudget();

        // variable-expenses card removed — skip loading variable expenses here
        
        // تشغيل التراكر المباشر مع تأخير للتأكد من تحميل DOM
        setTimeout(() => {
            initializeLiveBudgetTracker();
        }, 500);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل نظام الميزانية:', error);
        
        // محاولة تشغيل التراكر بالبيانات الافتراضية في حالة الخطأ
        setTimeout(() => {
            console.log('🔄 محاولة تشغيل التراكر بالبيانات الافتراضية...');
            const container = document.getElementById('live-budget-tracker');
            if (container) {
                displayLiveBudgetTracker(getDefaultTrackerData());
            } else {
                console.error('❌ حاوي التراكر غير موجود حتى بعد التأخير!');
            }
        }, 1000);
        
        if (financialAnalyticsManager) {
            financialAnalyticsManager.showAlert('حدث خطأ في تحميل نظام الميزانية', 'danger');
        }
    }
}

// تحميل قائمة الأشهر
function loadBudgetMonths() {
    const currentDate = new Date();
    const months = [];
    
    // إنشاء قائمة بـ 12 شهر (6 أشهر ماضية + الحالي + 5 مستقبلية)
    for (let i = -6; i <= 5; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
        const monthValue = date.toISOString().substring(0, 7); // YYYY-MM
        const monthText = date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
        months.push({ value: monthValue, text: monthText });
    }
    
    // ملء قوائم الأشهر المنسدلة
    const selectors = ['budget-month-select', 'variable-month-filter'];
    selectors.forEach(selectorId => {
        const select = document.getElementById(selectorId);
        if (select) {
            select.innerHTML = months.map(month => 
                `<option value="${month.value}" ${month.value === currentDate.toISOString().substring(0, 7) ? 'selected' : ''}>
                    ${month.text}
                </option>`
            ).join('');
        }
    });
    
    // تحديد الشهر الحالي
    const expenseMonthInput = document.getElementById('expense-month');
    if (expenseMonthInput) {
        expenseMonthInput.value = currentDate.toISOString().substring(0, 7);
    }
}

// معالج تغيير نوع الفاتورة
function handleExpenseTypeChange() {
    const expenseType = document.getElementById('expense-type').value;
    const fixedSettings = document.getElementById('fixed-expense-settings');
    const variableSettings = document.getElementById('variable-expense-settings');
    
    if (expenseType === 'fixed') {
        fixedSettings.style.display = 'block';
        variableSettings.style.display = 'none';
    } else if (expenseType === 'variable') {
        fixedSettings.style.display = 'none';
        variableSettings.style.display = 'block';
    } else {
        fixedSettings.style.display = 'none';
        variableSettings.style.display = 'none';
    }
}

// حفظ فاتورة جديدة
async function saveNewExpense(event) {
    event.preventDefault();
    
    const form = document.getElementById('new-expense-form');
    const formData = new FormData(form);
    
    const expenseData = {
        type: document.getElementById('expense-type').value,
        category: document.getElementById('expense-category').value,
        name: document.getElementById('expense-name').value,
        amount: parseFloat(document.getElementById('expense-amount').value),
        notes: document.getElementById('expense-notes').value,
        month: document.getElementById('expense-month').value,
        recurrence: {
            frequency: document.getElementById('recurrence-frequency')?.value || 'monthly',
            paymentDay: parseInt(document.getElementById('payment-day')?.value || 1)
        },
        createdAt: new Date().toISOString()
    };
    
    try {
        // محاولة الحفظ عبر API
        const response = await fetch(`${financialAnalyticsManager.apiBaseUrl}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
        });
        
        if (!response.ok) throw new Error('فشل الحفظ');
        
        financialAnalyticsManager.showAlert('تم حفظ الفاتورة بنجاح', 'success');
        
    } catch (error) {
        // الحفظ محلياً في حالة عدم توفر API
        const storageKey = expenseData.type === 'fixed' ? 'fixedExpenses' : 'variableExpenses';
        const existingExpenses = JSON.parse(localStorage.getItem(storageKey) || '[]');
        existingExpenses.push({ ...expenseData, id: Date.now().toString() });
        localStorage.setItem(storageKey, JSON.stringify(existingExpenses));
        
        financialAnalyticsManager.showAlert('تم حفظ الفاتورة محلياً', 'success');
    }
    
    // إعادة تعيين النموذج وإعادة تحميل البيانات
    form.reset();
    handleExpenseTypeChange();
    
    if (expenseData.type === 'fixed') {
        await loadFixedExpenses();
    } else {
        // variable-expenses card removed — refresh duplicate view which reads from localStorage
        try { renderVariableIntoDuplicate(); } catch(e) { console.warn('⚠️ renderVariableIntoDuplicate failed:', e); }
    }
    
    await loadBudgetSummary();
}

// تحميل الفواتير الثابتة
async function loadFixedExpenses() {
    try {
        let expenses = [];
        
        try {
            // محاولة تحميل من API
            const response = await fetch(`${financialAnalyticsManager.apiBaseUrl}/expenses/fixed`);
            if (response.ok) {
                const data = await response.json();
                expenses = data.expenses || [];
            } else {
                throw new Error('API غير متوفر');
            }
        } catch (error) {
            // تحميل بيانات تجريبية
            expenses = JSON.parse(localStorage.getItem('fixedExpenses') || JSON.stringify([
                {
                    id: '1',
                    name: 'راتب مدرس أحمد محمد',
                    category: 'salaries',
                    amount: 3000,
                    recurrence: { frequency: 'monthly', paymentDay: 1 },
                    type: 'fixed'
                },
                {
                    id: '2', 
                    name: 'إيجار المركز التعليمي',
                    category: 'rent',
                    amount: 5000,
                    recurrence: { frequency: 'monthly', paymentDay: 1 },
                    type: 'fixed'
                },
                {
                    id: '3',
                    name: 'راتب موظف الاستقبال',
                    category: 'salaries', 
                    amount: 2500,
                    recurrence: { frequency: 'monthly', paymentDay: 1 },
                    type: 'fixed'
                }
            ]));
        }
        
    // render the primary fixed-expenses card and render variable expenses into the duplicate
    displayFixedExpenses(expenses);
    renderVariableIntoDuplicate();
        
    } catch (error) {
        console.error('❌ خطأ في تحميل الفواتير الثابتة:', error);
    }
}

// عرض الفواتير الثابتة
function displayFixedExpenses(expenses, containerId = 'fixed-expenses-list') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (expenses.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-inbox" style="font-size: 48px; color: #cbd5e0; margin-bottom: 16px;"></i>
                <p style="color: #718096; margin-bottom: 16px;">لا توجد فواتير ثابتة مسجلة</p>
                <p style="color: #a0aec0; font-size: 14px;">استخدم نموذج "إضافة فاتورة جديدة" لإضافة فواتير ثابتة</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        ${expenses.map(expense => `
            <div class="expense-item">
                <div class="expense-header">
                    <span class="expense-name">${expense.name}</span>
                    <span class="expense-amount">${financialAnalyticsManager.formatCurrency(expense.amount)}</span>
                </div>
                <div class="expense-category">${getCategoryText(expense.category)}</div>
                <div class="expense-details">
                    <div>
                        <span class="expense-type-badge expense-type-fixed">ثابتة</span>
                        <span style="margin-right: 8px;">كل ${getFrequencyText(expense.recurrence.frequency)}</span>
                    </div>
                    <div class="expense-actions">
                        <button class="btn-edit" onclick="editExpense('${expense.id}', 'fixed')">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="btn-delete" onclick="deleteExpense('${expense.id}', 'fixed')">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

// تحميل/إنشاء الفاتورة الشهرية الديناميكية
async function loadCurrentMonthlyBudget() {
    const currentMonth = new Date().toISOString().substring(0, 7);
    let selectedMonth = document.getElementById('variable-month-filter')?.value || currentMonth;
    // إذا القيمة موجودة ولكنها ليست بصيغة YYYY-MM (مثال: 'all') فاستخدم currentMonth
    if (typeof selectedMonth === 'string' && !/^\d{4}-\d{2}$/.test(selectedMonth)) selectedMonth = currentMonth;
    
    try {
        // التحقق من وجود فاتورة شهرية لهذا الشهر
        let monthlyBudget = getMonthlyBudget(selectedMonth);
        
        if (!monthlyBudget) {
            // إنشاء فاتورة شهرية جديدة
            monthlyBudget = await createNewMonthlyBudget(selectedMonth);
        }
        
        displayCurrentMonthlyBudget(monthlyBudget, selectedMonth);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل الفاتورة الشهرية:', error);
    }
}

// الحصول على الفاتورة الشهرية
function getMonthlyBudget(month) {
    const monthlyBudgets = JSON.parse(localStorage.getItem('monthlyBudgets') || '{}');
    return monthlyBudgets[month] || null;
}

// إنشاء فاتورة شهرية جديدة
async function createNewMonthlyBudget(month) {
    try {
        // سحب الفواتير الثابتة
        const fixedExpenses = JSON.parse(localStorage.getItem('fixedExpenses') || '[]');
        
        // إنشاء الفاتورة الشهرية
        const monthlyBudget = {
            month: month,
            fixedExpenses: fixedExpenses.map(expense => ({
                ...expense,
                id: `monthly_${month}_${expense.id}`,
                addedFromFixed: true,
                addedAt: new Date().toISOString()
            })),
            variableExpenses: [],
            createdAt: new Date().toISOString(),
            status: 'active' // active, completed, archived
        };
        
        // حفظ الفاتورة الشهرية
        const monthlyBudgets = JSON.parse(localStorage.getItem('monthlyBudgets') || '{}');
        monthlyBudgets[month] = monthlyBudget;
        localStorage.setItem('monthlyBudgets', JSON.stringify(monthlyBudgets));
        
        console.log(`✅ تم إنشاء فاتورة شهرية جديدة لشهر ${month}`);
        return monthlyBudget;
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء الفاتورة الشهرية:', error);
        return null;
    }
}

// عرض الفاتورة الشهرية الديناميكية
function displayCurrentMonthlyBudget(monthlyBudget, month) {
    const container = document.getElementById('variable-expenses-list');
    if (!container) return;
    
    if (!monthlyBudget) {
        // لا نغلق العرض العام هنا - فقط نظهر رسالة خفيفة داخل قسم الفواتير الثابتة
        let fixedSection = container.querySelector('.monthly-fixed-section');
        if (!fixedSection) {
            fixedSection = document.createElement('div');
            fixedSection.className = 'monthly-fixed-section';
            container.insertBefore(fixedSection, container.firstChild);
        }
        fixedSection.innerHTML = '<p style="text-align: center; color: #718096;">خطأ في تحميل الفاتورة الشهرية</p>';
        return;
    }
    
    const monthName = new Date(month + '-01').toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
    const totalFixed = monthlyBudget.fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalVariable = monthlyBudget.variableExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalMonthly = totalFixed + totalVariable;
    
    // بدلاً من مسح الحاوي كلياً، حدث/أنشئ جزءاً خاصاً بالفواتير الثابتة داخل الحاوي
    let fixedSection = container.querySelector('.monthly-fixed-section');
    if (!fixedSection) {
        fixedSection = document.createElement('div');
        fixedSection.className = 'monthly-fixed-section';
        container.insertBefore(fixedSection, container.firstChild);
    }

    if (monthlyBudget.fixedExpenses && monthlyBudget.fixedExpenses.length > 0) {
        fixedSection.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h5 style="color: #22543d; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-check-circle"></i> الفواتير الثابتة (مضافة تلقائياً)
                </h5>
                ${monthlyBudget.fixedExpenses.map(expense => `
                    <div class="expense-item" style="border-left: 4px solid #38a169;">
                        <div class="expense-header">
                            <span class="expense-name">${expense.name}</span>
                            <span class="expense-amount">${financialAnalyticsManager.formatCurrency(expense.amount)}</span>
                        </div>
                        <div class="expense-category">${getCategoryText(expense.category)}</div>
                        <div class="expense-details">
                            <div>
                                <span class="expense-type-badge expense-type-fixed">تلقائية</span>
                                <span style="margin-right: 8px; font-size: 11px; color: #718096;">مضافة من الفواتير الثابتة</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        fixedSection.innerHTML = '';
    }

    // فقط نعرض متغيرات الفاتورة الشهرية إذا كانت موجودة فعلاً
    // لكي لا نمسح العرض العام للفواتير المتغيرة الذي قد يحتوي على بيانات مخزنة
    try {
        if (Array.isArray(monthlyBudget.variableExpenses) && monthlyBudget.variableExpenses.length > 0) {
            displayVariableExpenses(monthlyBudget.variableExpenses, 'variable-expenses-list');
        } else {
            // لا نفعل شيئاً - اترك القائمة الحالية كما هي (مثيل الفواتير المتغيرة العامة)
            console.log('ℹ️ لا توجد فواتير متغيرة في الفاتورة الشهرية؛ إبقاء عرض الفواتير العام كما هو');
        }
    } catch (err) {
        console.warn('⚠️ خطأ في عرض الفواتير المتغيرة داخل الفاتورة الشهرية:', err);
    }
}

// تحميل الفواتير المتغيرة
async function loadVariableExpenses() {
    // هذه الدالة تعرض دائماً كل الفواتير المتغيرة المخزنة (من الـ API أو localStorage)
    // بغض النظر عن فلتر الشهور — الهدف: جعل البطاقة تعرض البيانات مباشرة عند تحميل الصفحة

    try {
        try {
            // نجرب نجيب البيانات من API زي الفواتير الثابتة
            const resp = await fetch(`${financialAnalyticsManager.apiBaseUrl}/budget`);
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.success && data.budget) {
                    // جمع كل مصادر الفواتير المتغيرة المتاحة في الـ response
                    let variableExpenses = [];

                    // Only use the canonical variableBills when loading from the DB.
                    // The user requested that the variable-expenses card reflect only `budget.variableBills`.
                    if (Array.isArray(data.budget.variableBills) && data.budget.variableBills.length > 0) {
                        variableExpenses = variableExpenses.concat(data.budget.variableBills);
                    }

                    // تحويل للصيغة المعروضة وتوحيد الحقول
                    const mapped = (variableExpenses || []).map(b => ({
                        id: b._id || b.id || ('var_' + Date.now()),
                        name: b.name || b.title || 'غير معروف',
                        amount: Number(b.amount) || 0,
                        category: b.category || 'other',
                        month: b.month || null,
                        createdAt: b.createdAt || b.addedAt || new Date().toISOString(),
                        // preserve original flags so displayVariableExpenses can filter generated items
                        generatedFromFixed: !!(b.generatedFromFixed || b.addedFromFixed || false),
                        addedFromFixed: !!b.addedFromFixed,
                        originalType: b.type || b.billType || null,
                        type: 'variable'
                    }));

                    // حفظ نسخة محلية من القائمة العامة للفواتير المتغيرة (إن وُجدت بيانات)
                    try {
                        if (mapped.length > 0) localStorage.setItem('variableExpenses', JSON.stringify(mapped));
                    } catch (e) {
                        console.warn('⚠️ تعذّر حفظ variableExpenses محلياً:', e);
                    }

                    console.log('✅ تم تحميل الفواتير المتغيرة من API (عرض كل البنود):', mapped.length);
                    displayVariableExpenses(mapped, 'variable-expenses-list');
                    // also populate the duplicate fixed-expenses card with the variable list
                    displayVariableExpenses(mapped, 'fixed-expenses-list-2');
                    return;
                }
            }
            throw new Error('no-data');
        } catch (apiErr) {
            console.warn('⚠️ فشل تحميل الفواتير المتغيرة من API، استخدام localStorage:', apiErr);
            const variableExpenses = JSON.parse(localStorage.getItem('variableExpenses') || '[]');
            console.log('✅ تم تحميل الفواتير المتغيرة محلياً (fallback):', variableExpenses.length);
            displayVariableExpenses(variableExpenses, 'variable-expenses-list');
        }

        // helper to normalize various month representations into 'YYYY-MM'
        const normalizeMonth = (val) => {
            if (!val && val !== 0) return null;
            try {
                // if already in YYYY-MM form
                if (typeof val === 'string' && /^\d{4}-\d{2}$/.test(val)) return val;
                // if string ISO datetime like '2025-10-12' or full ISO
                if (typeof val === 'string' && /^(\d{4})-(\d{2})/.test(val)) return val.substring(0, 7);
                // if Date object
                if (val instanceof Date) return val.toISOString().substring(0, 7);
                // numeric timestamp
                if (typeof val === 'number') return new Date(val).toISOString().substring(0, 7);
            } catch (e) {
                return null;
            }
            return null;
        };

        try {
            // حاول جلب المستند الكامل للميزانية من الـ API ثم تصفية الفواتير المتغيرة للشهر المحدد
            const resp = await fetch(`${financialAnalyticsManager.apiBaseUrl}/budget`);
            console.log('⤴️ طلب GET /budget -> status', resp.status);
            const data = await resp.json().catch(err => {
                console.warn('⚠️ لم أتمكن من قراءة JSON من استجابة الميزانية:', err);
                return null;
            });

            console.log('⤴️ محتوى استجابة الميزانية (raw):', data);

                if (data && data.success && data.budget) {
                // When data is fetched from the DB, use only `budget.variableBills`.
                // This ensures the variable-expenses card does not include fixed-generated or monthlyBudget entries.
                const allVariable = Array.isArray(data.budget.variableBills) ? data.budget.variableBills.slice() : [];

                const mapped = allVariable.map(b => {
                    const rawMonth = b.month || b.createdAt || b.date || null;
                    const normMonth = normalizeMonth(rawMonth);
                    return {
                        id: b._id || b.id || ('var_' + Date.now()),
                        name: b.name || b.title || 'بدون اسم',
                        category: b.category || 'other',
                        amount: Number(b.amount || 0),
                        month: normMonth,
                        rawMonth: rawMonth,
                        _orig: b,
                        // preserve flags to allow filtering later
                        generatedFromFixed: !!(b.generatedFromFixed || b.addedFromFixed || false),
                        addedFromFixed: !!b.addedFromFixed,
                        originalType: b.type || b.billType || null,
                        type: 'variable'
                    };
                });

                // عرض كل البنود مباشرة (لا فلترة)
                expenses = mapped.slice();
                console.log(`✅ تم تحميل الفواتير المتغيرة من API (كل البنود): total=${mapped.length}, shown=${expenses.length}`);

                console.log(`✅ تم تحميل الفواتير المتغيرة من API: total=${mapped.length}, shown=${expenses.length}, month=${selectedMonth}`);

                // If we found mapped items but none were shown due to mismatch, print them for debugging
                if (mapped.length > 0 && expenses.length === 0) {
                    console.warn('⚠️ توجد فواتير في الـ API لكن لم تطابق الشهر المحدد. الفواتير المحملة (sample 5):', mapped.slice(0,5));
                }
                // render a small debug panel to help inspect what's in the API response
                try {
                    const containerEl = document.getElementById('variable-expenses-list');
                    if (containerEl) {
                        let debug = document.getElementById('variable-debug-panel');
                        const debugContent = {
                            selectedMonth,
                            totalFromApi: mapped.length,
                            shownCount: expenses.length,
                            sampleMapped: mapped.slice(0,10)
                        };

                        const debugHtml = `
                            <div id="variable-debug-panel" style="font-size:12px;color:#4a5568;background:#fff8; padding:8px;border-radius:6px;margin-bottom:8px;border:1px dashed #e2e8f0;">
                                <button id="variable-debug-toggle" style="float:left;padding:6px 8px;border-radius:6px;border:none;background:#667eea;color:white;cursor:pointer;font-size:12px;margin-left:8px;">عرض تفاصيل التحميل</button>
                                <strong>Variable bills debug:</strong> total=${mapped.length}, shown=${expenses.length}, month=${selectedMonth}
                                <pre id="variable-debug-pre" style="display:none;white-space:pre-wrap;max-height:300px;overflow:auto;margin-top:8px;background:#f7fafc;padding:8px;border-radius:6px;border:1px solid #e6eef8;">${JSON.stringify(debugContent, null, 2)}</pre>
                            </div>
                        `;

                        // replace existing debug panel if present
                        if (debug) debug.remove();
                        containerEl.insertAdjacentHTML('afterbegin', debugHtml);

                        // attach toggle behavior
                        document.getElementById('variable-debug-toggle').addEventListener('click', (e) => {
                            const pre = document.getElementById('variable-debug-pre');
                            if (pre.style.display === 'none') pre.style.display = 'block'; else pre.style.display = 'none';
                        });
                        // if we used fallback, show a small banner above the debug panel
                        if (usedFallback) {
                            const fallbackBannerId = 'variable-fallback-banner';
                            if (!document.getElementById(fallbackBannerId)) {
                                containerEl.insertAdjacentHTML('afterbegin', `
                                    <div id="${fallbackBannerId}" style="background:#fff7ed;padding:8px;border-radius:6px;border:1px solid #ffe1b3;color:#744210;margin-bottom:8px;">
                                        يتم عرض الفواتير من السجل لأن لا فواتير تطابق الشهر المحدد (${selectedMonth}).
                                    </div>
                                `);
                            }
                        } else {
                            const existing = document.getElementById('variable-fallback-banner');
                            if (existing) existing.remove();
                        }
                    }
                } catch (e) {
                    console.warn('⚠️ فشل في إنشاء لوح التصحيح للفواتير المتغيرة:', e);
                }
            } else if (data && !data.success) {
                console.warn('⚠️ استجابة الـ API لم تؤشر على نجاح:', data);
            }
        } catch (error) {
            console.warn('⚠️ فشل تحميل الفواتير المتغيرة من API، استخدام localStorage:', error);
            const allVariableExpenses = JSON.parse(localStorage.getItem('variableExpenses') || '[]');
            // normalize localStorage entries as well
            expenses = allVariableExpenses.map(e => ({
                ...e,
                id: e.id || ('var_' + Date.now()),
                amount: Number(e.amount || 0),
                month: normalizeMonth(e.month) || e.month
            }));
            if (selectedMonth !== 'all') {
                expenses = expenses.filter(expense => expense.month === selectedMonth);
            }
        }

        // always explicitly render into the variable-expenses-list container
        console.log('🔔 rendering variable expenses count=', expenses.length);
        displayVariableExpenses(expenses, 'variable-expenses-list');

    } catch (error) {
        console.error('❌ خطأ في تحميل الفواتير المتغيرة:', error);
    }
}

// عرض الفواتير المتغيرة
function displayVariableExpenses(expenses, containerId = 'variable-expenses-list') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Filter out any items that were generated from fixed expenses
    // (created by generateMonthlyExpenses or addedFromFixed) so the
    // variable-expenses card shows only genuine variable bills.
    const filteredExpenses = (Array.isArray(expenses) ? expenses : []).filter(e => {
        // If type is present and not 'variable', exclude
        if (e.type && String(e.type).toLowerCase() !== 'variable') return false;
        // Exclude items explicitly marked as generated/added from fixed
        if (e.generatedFromFixed || e.addedFromFixed) return false;
        return true;
    });

    if (!Array.isArray(filteredExpenses) || filteredExpenses.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-inbox" style="font-size: 48px; color: #cbd5e0; margin-bottom: 16px;"></i>
                <p style="color: #718096; margin-bottom: 16px;">لا توجد فواتير متغيرة لهذا الشهر</p>
                <p style="color: #a0aec0; font-size: 14px;">استخدم نموذج "إضافة فاتورة جديدة" لإضافة فواتير متغيرة</p>
            </div>
        `;
        return;
    }
    // Use the exact same banner and item structure as displayFixedExpenses (visual parity)
    container.innerHTML = `
        
        ${filteredExpenses.map(expense => `
            <div class="expense-item">
                <div class="expense-header">
                    <span class="expense-name">${expense.name}</span>
                    <span class="expense-amount">${financialAnalyticsManager.formatCurrency(expense.amount)}</span>
                </div>
                <div class="expense-category">${getCategoryText(expense.category)}</div>
                <div class="expense-details">
                    <div>
                        <span class="expense-type-badge expense-type-variable">متغيرة</span>
                        <span style="margin-right: 8px;">${formatDateOnly(expense.month) || ''}</span>
                    </div>
                    <div class="expense-actions">
                        <button class="btn-edit" onclick="editExpense('${expense.id}', 'variable')">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="btn-delete" onclick="deleteExpense('${expense.id}', 'variable')">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

// Render variable expenses into the duplicate fixed-expenses container
// Render variable expenses into the duplicate fixed-expenses container.
// Attempt to load canonical variable bills from the server so edits/deletes
// use server IDs; fall back to localStorage if the API isn't reachable.
async function renderVariableIntoDuplicate() {
    const dupId = 'fixed-expenses-list-2';
    try {
        // Try to fetch from API first
        if (financialAnalyticsManager && financialAnalyticsManager.apiBaseUrl) {
            try {
                const resp = await fetch(`${financialAnalyticsManager.apiBaseUrl}/budget`);
                if (resp.ok) {
                    const data = await resp.json().catch(() => null);
                    if (data && data.success && data.budget && Array.isArray(data.budget.variableBills)) {
                        const mapped = data.budget.variableBills.map(b => ({
                            id: b._id || b.id || ('var_' + Date.now()),
                            name: b.name || b.title || 'بدون اسم',
                            amount: Number(b.amount || 0),
                            category: b.category || 'other',
                            month: b.month || b.createdAt || null,
                            createdAt: b.createdAt || new Date().toISOString(),
                            generatedFromFixed: !!(b.generatedFromFixed || b.addedFromFixed),
                            addedFromFixed: !!b.addedFromFixed,
                            originalType: b.type || b.billType || null,
                            _orig: b,
                            type: 'variable'
                        }));
                        displayVariableExpenses(mapped, dupId);
                        return;
                    }
                }
            } catch (e) {
                // log and fall back
                console.warn('⚠️ renderVariableIntoDuplicate: API fetch failed, using localStorage fallback', e);
            }
        }

        // Fallback: read from localStorage (older behavior)
        const variableExpenses = JSON.parse(localStorage.getItem('variableExpenses') || '[]');
        const mapped = (variableExpenses || []).map(e => ({
            id: e.id || e._id || ('var_' + Date.now()),
            name: e.name || e.title || 'بدون اسم',
            amount: Number(e.amount || 0),
            category: e.category || 'other',
            month: e.month || e.rawMonth || null,
            createdAt: e.createdAt || new Date().toISOString(),
            generatedFromFixed: !!e.generatedFromFixed,
            addedFromFixed: !!e.addedFromFixed,
            originalType: e.originalType || e.type || null,
            type: 'variable'
        }));
        displayVariableExpenses(mapped, dupId);
    } catch (err) {
        console.warn('⚠️ renderVariableIntoDuplicate: unexpected error', err);
        const c = document.getElementById('fixed-expenses-list-2'); if (c) c.innerHTML = '';
    }
}

// الدوال المساعدة
function getCategoryText(category) {
    const categories = {
        'salaries': 'رواتب ومكافآت',
        'utilities': 'خدمات (كهرباء، مياه، إنترنت)',
        'rent': 'إيجارات',
        'maintenance': 'صيانة وإصلاحات',
        'supplies': 'مستلزمات وأدوات',
        'marketing': 'دعاية وتسويق',
        'other': 'أخرى'
    };
    return categories[category] || category;
}

function getFrequencyText(frequency) {
    const frequencies = {
        'monthly': 'شهر',
        'quarterly': '3 أشهر', 
        'yearly': 'سنة'
    };
    return frequencies[frequency] || frequency;
}

// Helper: format an ISO datetime/string/timestamp to a date-only string YYYY-MM-DD
function formatDateOnly(val) {
    if (!val) return '';
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val).split('T')[0] || '';
        // use local date in ISO-like YYYY-MM-DD for clarity
        return d.toISOString().split('T')[0];
    } catch (e) {
        return String(val).split('T')[0] || '';
    }
}

// تحميل ملخص الميزانية
async function loadBudgetSummary() {
    try {
    let selectedMonth = document.getElementById('variable-month-filter')?.value || new Date().toISOString().substring(0, 7);
    if (typeof selectedMonth === 'string' && !/^\d{4}-\d{2}$/.test(selectedMonth)) selectedMonth = new Date().toISOString().substring(0, 7);

        const fixedExpenses = JSON.parse(localStorage.getItem('fixedExpenses') || '[]');
        const variableExpenses = JSON.parse(localStorage.getItem('variableExpenses') || '[]');
        const monthlyBudgets = JSON.parse(localStorage.getItem('monthlyBudgets') || '{}');

        // إذا وُجدت فاتورة شهرية مفصلة استخدم متغيراتها بدل القائمة العامة
        const monthly = monthlyBudgets[selectedMonth] || null;
        const varsForMonth = monthly ? (monthly.variableExpenses || []) : variableExpenses.filter(v => v.month === selectedMonth);

        const totalFixed = fixedExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
        const totalVariable = varsForMonth.reduce((s, e) => s + Number(e.amount || 0), 0);
        const totalExpenses = totalFixed + totalVariable;

        const summary = {
            month: selectedMonth,
            fixed: totalFixed,
            variable: totalVariable,
            expenses: totalExpenses,
            profit: 0,
            lossPercentage: 0
        };

        // حاول تحديث عنصر واجهة إذا وجد
        const container = document.getElementById('budget-summary');
        if (container) {
            container.innerHTML = `
                <div class="budget-summary-grid">
                    <div class="budget-summary-item expenses">
                        <div class="budget-summary-label">إجمالي المصروفات</div>
                        <div class="budget-summary-value">${financialAnalyticsManager.formatCurrency(summary.expenses)}</div>
                    </div>
                    <div class="budget-summary-item profit">
                        <div class="budget-summary-label">صافي الربح</div>
                        <div class="budget-summary-value">${financialAnalyticsManager.formatCurrency(summary.profit)}</div>
                    </div>
                    <div class="budget-summary-item loss-percentage">
                        <div class="budget-summary-label">نسبة الفاقد</div>
                        <div class="budget-summary-value">${summary.lossPercentage.toFixed(1)}%</div>
                    </div>
                </div>
            `;
        } else {
            console.log('📊 ملخص الميزانية:', summary);
        }

    } catch (error) {
        console.error('❌ خطأ في تحميل ملخص الميزانية:', error);
    }
}

// إنشاء مصروفات الشهر الجديد (إضافة الفواتير الثابتة تلقائياً)
async function generateMonthlyExpenses() {
    const currentMonth = new Date().toISOString().substring(0, 7);
    
    try {
        const fixedExpenses = JSON.parse(localStorage.getItem('fixedExpenses') || '[]');
        const variableExpenses = JSON.parse(localStorage.getItem('variableExpenses') || '[]');
        
        // التحقق من وجود فواتير للشهر الحالي
        const existingMonthlyExpenses = variableExpenses.filter(expense => expense.month === currentMonth);
        
        if (existingMonthlyExpenses.length > 0) {
            financialAnalyticsManager.showAlert('تم إنشاء مصروفات هذا الشهر مسبقاً', 'info');
            return;
        }
        
        // إضافة الفواتير الثابتة كفواتير متغيرة للشهر الجديد
        const newMonthlyExpenses = fixedExpenses.map(expense => ({
            ...expense,
            id: `monthly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'variable',
            month: currentMonth,
            name: `${expense.name} - ${new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}`,
            generatedFromFixed: true
        }));
        
        variableExpenses.push(...newMonthlyExpenses);
        localStorage.setItem('variableExpenses', JSON.stringify(variableExpenses));
        
        financialAnalyticsManager.showAlert(`تم إنشاء ${newMonthlyExpenses.length} فاتورة للشهر الجديد`, 'success');
        
    // إعادة تحميل البيانات - update duplicate view instead of removed variable card
    try { renderVariableIntoDuplicate(); } catch(e) { console.warn('⚠️ renderVariableIntoDuplicate failed:', e); }
    await loadBudgetSummary();
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء مصروفات الشهر:', error);
        financialAnalyticsManager.showAlert('حدث خطأ في إنشاء مصروفات الشهر', 'danger');
    }
}

// حذف فاتورة
function deleteExpense(expenseId, type) {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;

    // حاول حذفها عبر الـ API أولاً
    (async () => {
        try {
            const resp = await fetch(`${financialAnalyticsManager.apiBaseUrl}/budget/bill/${encodeURIComponent(expenseId)}`, {
                method: 'DELETE'
            });
            const text = await resp.text().catch(() => null);
            let data = null;
            try { data = text ? JSON.parse(text) : null; } catch(e) { data = null; }
            if (resp.ok && data && data.success) {
                financialAnalyticsManager.showAlert('تم حذف الفاتورة بنجاح', 'success');
                if (type === 'fixed') await loadFixedExpenses(); else { try { renderVariableIntoDuplicate(); } catch(e){ console.warn('⚠️ renderVariableIntoDuplicate failed:', e); } }
                await loadBudgetSummary();
                return;
            }

            console.warn('DELETE /budget/bill failed', { status: resp.status, body: data || text });
            const serverMsg = data?.error || data?.message || text || `الحالة ${resp.status}`;
            throw new Error(serverMsg || 'API failed');
        } catch (err) {
            console.warn('⚠️ فشل حذف الفاتورة عبر API، استخدام localStorage كبديل:', err);
            financialAnalyticsManager.showAlert(`فشل الحذف من الخادم: ${err.message}`, 'warning');

            const storageKey = type === 'fixed' ? 'fixedExpenses' : 'variableExpenses';
            const expenses = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const filteredExpenses = expenses.filter(expense => expense.id !== expenseId);
            localStorage.setItem(storageKey, JSON.stringify(filteredExpenses));

            financialAnalyticsManager.showAlert('تم حذف الفاتورة محلياً', 'success');
            if (type === 'fixed') loadFixedExpenses(); else { try { renderVariableIntoDuplicate(); } catch(e){ console.warn('⚠️ renderVariableIntoDuplicate failed:', e); } }
            loadBudgetSummary();
        }
    })();
}

// تعديل فاتورة
function editExpense(expenseId, type) {
    // بسيط: اطلب من المستخدم اسم ومبلغ جديدين ثم استدعي API للتحديث
    const newName = prompt('أدخل الاسم الجديد للفاتورة:');
    if (newName === null) return; // user cancelled
    const newAmountRaw = prompt('أدخل المبلغ الجديد:');
    if (newAmountRaw === null) return;
    const newAmount = parseFloat(newAmountRaw);
    if (isNaN(newAmount)) { alert('قيمة المبلغ غير صحيحة'); return; }

    (async () => {
        try {
            const payload = { name: newName, amount: newAmount };
            const resp = await fetch(`${financialAnalyticsManager.apiBaseUrl}/budget/bill/${encodeURIComponent(expenseId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const text = await resp.text().catch(() => null);
            let data = null;
            try { data = text ? JSON.parse(text) : null; } catch(e) { data = null; }
            if (resp.ok && data && data.success) {
                financialAnalyticsManager.showAlert('تم تحديث الفاتورة بنجاح', 'success');
                if (type === 'fixed') await loadFixedExpenses(); else { try { renderVariableIntoDuplicate(); } catch(e){ console.warn('⚠️ renderVariableIntoDuplicate failed:', e); } }
                await loadBudgetSummary();
                return;
            }

            console.warn('PUT /budget/bill failed', { status: resp.status, body: data || text });
            const serverMsg = data?.error || data?.message || text || `الحالة ${resp.status}`;
            throw new Error(serverMsg || 'API failed');
        } catch (err) {
            console.warn('⚠️ فشل تحديث الفاتورة عبر API، استخدام localStorage كبديل:', err);
            financialAnalyticsManager.showAlert(`فشل التحديث على الخادم: ${err.message}`, 'warning');

            const storageKey = type === 'fixed' ? 'fixedExpenses' : 'variableExpenses';
            const expenses = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const idx = expenses.findIndex(e => e.id === expenseId);
            if (idx !== -1) {
                expenses[idx].name = newName;
                expenses[idx].amount = newAmount;
                localStorage.setItem(storageKey, JSON.stringify(expenses));
                financialAnalyticsManager.showAlert('تم تحديث الفاتورة محلياً', 'success');
                if (type === 'fixed') loadFixedExpenses(); else { try { renderVariableIntoDuplicate(); } catch(e){ console.warn('⚠️ renderVariableIntoDuplicate failed:', e); } }
                loadBudgetSummary();
                return;
            }

            alert('تعذّر تحديث الفاتورة');
        }
    })();
}

// تحديث فلتر الشهور
function updateMonthFilter() {
    const monthFilter = document.getElementById('variable-month-filter');
    if (!monthFilter) return;
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // إنشاء قائمة بالأشهر (6 أشهر سابقة + الشهر الحالي + 6 أشهر قادمة)
    const months = [];
    for (let i = -6; i <= 6; i++) {
        const date = new Date(currentYear, currentMonth + i, 1);
        const monthValue = date.toISOString().substring(0, 7);
        const monthName = date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
        months.push({ value: monthValue, name: monthName });
    }
    
    // أضف خيار افتراضي لعرض كل الشهور ثم ملء القائمة المنسدلة
    const currentMonthValue = currentDate.toISOString().substring(0, 7);
    monthFilter.innerHTML = `
        <option value="all" ${'all' === 'all' ? 'selected' : ''}>كل الشهور</option>
        ${months.map(month => `
            <option value="${month.value}" ${month.value === currentMonthValue ? 'selected' : ''}>
                ${month.name}
            </option>
        `).join('')}
    `;
}

// تحميل الفواتير الثابتة
async function loadFixedExpenses() {
    try {
        // حاول جلب الفواتير الثابتة من الـ API
        try {
            const resp = await fetch(`${financialAnalyticsManager.apiBaseUrl}/budget`);
            if (resp.ok) {
                const data = await resp.json();
                if (data.success && data.budget) {
                    const fixedExpenses = data.budget.recurringBills || [];
                    console.log('✅ تم تحميل الفواتير الثابتة من API:', fixedExpenses.length);
                    // تحويل الشكل المتوقع للعرض
                    const mapped = fixedExpenses.map(b => ({
                        id: b.id || b._id || ('fixed_' + Date.now()),
                        name: b.name,
                        amount: b.amount,
                        category: b.category,
                        recurrence: { frequency: b.recurrence?.frequency || 'monthly' },
                        createdAt: b.createdAt,
                        type: 'fixed'
                    }));
                    // persist server-provided mapping to localStorage to avoid stale local ids
                    try { localStorage.setItem('fixedExpenses', JSON.stringify(mapped)); } catch (e) { console.warn('Could not persist fixedExpenses locally', e); }
                    // populate primary fixed-expenses card and render variable list in the duplicate
                    displayFixedExpenses(mapped);
                    // if the API provided variableBills earlier in loadBudgetData they were saved to localStorage;
                    // use that to populate the duplicate card as a variable-expenses view
                    renderVariableIntoDuplicate();
                    return;
                }
            }
            throw new Error('no-data');
        } catch (apiErr) {
            console.warn('⚠️ فشل تحميل الفواتير الثابتة من API، استخدام localStorage:', apiErr);
            const fixedExpenses = JSON.parse(localStorage.getItem('fixedExpenses') || '[]');
            console.log('✅ تم تحميل الفواتير الثابتة محلياً:', fixedExpenses.length);
            // populate primary fixed-expenses card and render variable list in the duplicate
            displayFixedExpenses(fixedExpenses);
            renderVariableIntoDuplicate();
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل الفواتير الثابتة:', error);
    }
}

// ═══════════════════════════════════════════════════════
// 🔴 التراكر المباشر للميزانية - النظام الديناميكي
// ═══════════════════════════════════════════════════════

let liveBudgetInterval = null;

// تشغيل التراكر المباشر
function initializeLiveBudgetTracker() {
    console.log('🔴 تشغيل التراكر المباشر للميزانية...');
    
    // التحقق من وجود الحاوي
    const container = document.getElementById('live-budget-tracker');
    if (!container) {
        console.error('❌ لم يتم العثور على حاوي التراكر المباشر!');
        return;
    }
    
    // عرض رسالة تحميل
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #667eea;">
            <div style="width: 40px; height: 40px; border: 4px solid #e6f0ff; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">جاري تحميل التراكر المباشر...</div>
            <div style="font-size: 12px; opacity: 0.8;">تحضير بيانات الميزانية</div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    // التحديث الأول مباشرة
    setTimeout(async () => {
        await updateLiveBudgetTracker();
    }, 1000);
    
    // تحديث تلقائي كل 10 ثوانٍ
    if (liveBudgetInterval) {
        clearInterval(liveBudgetInterval);
    }
    
    liveBudgetInterval = setInterval(async () => {
        await updateLiveBudgetTracker();
    }, 10000); // 10 ثوانٍ
}

// إيقاف التراكر المباشر
function stopLiveBudgetTracker() {
    if (liveBudgetInterval) {
        clearInterval(liveBudgetInterval);
        liveBudgetInterval = null;
        console.log('⏹️ تم إيقاف التراكر المباشر');
    }
}

// تحديث التراكر المباشر - محدث ليكون async
async function updateLiveBudgetTracker() {
    try {
        const currentMonth = new Date().toISOString().substring(0, 7);
        
        // حساب البيانات المحلية (للاحتياط)
        const trackerData = calculateLiveBudgetData(currentMonth);
        
        // عرض التراكر (async الآن لأنه يجلب من Archive)
        await displayLiveBudgetTracker(trackerData);
        
        console.log('🔄 تم تحديث التراكر المباشر:', new Date().toLocaleTimeString('ar-EG'));
        
    } catch (error) {
        console.error('❌ خطأ في تحديث التراكر المباشر:', error);
    }
}

// حساب بيانات التراكر المباشر
function calculateLiveBudgetData(month) {
    try {
        console.log('🔢 حساب بيانات التراكر للشهر:', month);
        
        // الحصول على البيانات
        const fixedExpenses = JSON.parse(localStorage.getItem('fixedExpenses') || '[]');
        const monthlyBudgets = JSON.parse(localStorage.getItem('monthlyBudgets') || '{}');
        const monthlyBudget = monthlyBudgets[month];
        
        console.log('📋 الفواتير الثابتة:', fixedExpenses.length);
        console.log('📅 الفاتورة الشهرية:', monthlyBudget ? 'موجودة' : 'غير موجودة');
        
        // حساب المصروفات
        const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalVariableExpenses = monthlyBudget ? 
            monthlyBudget.variableExpenses.reduce((sum, expense) => sum + expense.amount, 0) : 0;
        const totalExpenses = totalFixedExpenses + totalVariableExpenses;
        
        // حساب الإيرادات (محاكاة من بيانات الاشتراكات)
        const currentRevenue = calculateCurrentMonthRevenue();
        
        // حساب المؤشرات
        const netProfit = currentRevenue - totalExpenses;
        const profitMargin = currentRevenue > 0 ? ((netProfit / currentRevenue) * 100) : 0;
        const expenseRatio = currentRevenue > 0 ? ((totalExpenses / currentRevenue) * 100) : 0;
        
        const result = {
            revenue: currentRevenue,
            expenses: totalExpenses,
            profit: netProfit,
            efficiency: 100 - expenseRatio,
            profitMargin: profitMargin,
            expenseRatio: expenseRatio,
            lastUpdated: new Date()
        };
        
        console.log('💰 نتائج الحسابات:', {
            إيرادات: currentRevenue,
            مصروفات: totalExpenses,
            ربح: netProfit,
            كفاءة: result.efficiency.toFixed(1) + '%'
        });
        
        return result;
        
    } catch (error) {
        console.error('❌ خطأ في حساب بيانات التراكر:', error);
        return getDefaultTrackerData();
    }
}

// حساب إيرادات الشهر الحالي
function calculateCurrentMonthRevenue() {
    try {
        // محاكاة حساب الإيرادات من الاشتراكات
        const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyRevenue = subscriptions
            .filter(sub => {
                const subDate = new Date(sub.createdAt || sub.date);
                return subDate.getMonth() === currentMonth && subDate.getFullYear() === currentYear;
            })
            .reduce((sum, sub) => sum + (sub.amount || 0), 0);
        
        // إذا لم توجد بيانات، استخدم بيانات تجريبية
        return monthlyRevenue > 0 ? monthlyRevenue : 45000; // 45,000 جنيه كمثال
        
    } catch (error) {
        console.error('❌ خطأ في حساب الإيرادات:', error);
        return 45000; // قيمة افتراضية
    }
}

// بيانات افتراضية للتراكر
function getDefaultTrackerData() {
    console.log('📊 استخدام بيانات افتراضية للتراكر');
    return {
        revenue: 45000,
        expenses: 28500,
        profit: 16500,
        efficiency: 63.3,
        profitMargin: 36.7,
        expenseRatio: 63.3,
        lastUpdated: new Date()
    };
}

// عرض التراكر المباشر - محدث ليستخدم Archive.currentMonth
async function displayLiveBudgetTracker(data) {
    const container = document.getElementById('live-budget-tracker');
    if (!container) {
        console.error('❌ لم يتم العثور على حاوي التراكر المباشر');
        return;
    }
    
    console.log('📊 عرض بيانات التراكر المباشر من Archive:', data);
    
    // جلب بيانات Archive.currentMonth من السيرفر
    let archiveData = null;
    try {
        const response = await fetch('/api/archive');
        if (response.ok) {
            const result = await response.json();
            if (result.ok && result.archive && result.archive.currentMonth) {
                archiveData = result.archive.currentMonth;
                console.log('✅ تم جلب بيانات Archive.currentMonth:', archiveData);
            } else {
                console.warn('⚠️ Archive لا يحتوي على currentMonth:', result);
            }
        } else {
            console.warn('⚠️ استجابة غير صحيحة من Archive API:', response.status);
        }
    } catch (error) {
        console.warn('⚠️ فشل جلب Archive، استخدام البيانات المحلية:', error);
    }
    
    // إذا توفرت بيانات Archive، استخدمها
    let revenue = data.revenue || 0;
    let expenses = data.expenses || 0;
    let netProfit = data.profit || 0;
    
    if (archiveData) {
        revenue = Number(archiveData.revenue || 0);
        expenses = Number(archiveData.expenses || 0);
        netProfit = Number(archiveData.netProfit || 0);
    }
    
    // حساب البطاقة الرابعة: الفرق بين صافي الربح والمصروفات
    const difference = netProfit - expenses;
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0
        }).format(amount);
    };
    
    const getChangeIndicator = (value, isGood = true) => {
        const color = isGood ? '#10b981' : '#ef4444';
        const icon = isGood ? '↗' : '↘';
        return `<span style="color: ${color}; font-size: 14px;">${icon}</span>`;
    };
    
    container.innerHTML = `
        <div class="live-tracker-grid">
            <!-- بطاقة 1: الإيرادات من Archive -->
            <div class="tracker-card revenue" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
                <div class="tracker-change" style="color: rgba(255,255,255,0.9);">${getChangeIndicator(true)}</div>
                <div class="tracker-value" style="font-size: 2rem; font-weight: 800;">${formatCurrency(revenue)}</div>
                <div class="tracker-label" style="color: rgba(255,255,255,0.9); font-size: 0.95rem;">الإيرادات</div>
                <div class="tracker-trend" style="color: rgba(255,255,255,0.8); font-size: 0.85rem;">من الشهر الحالي</div>
            </div>
            
            <!-- بطاقة 2: المصروفات من Archive -->
            <div class="tracker-card expenses" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none;">
                <div class="tracker-change" style="color: rgba(255,255,255,0.9);">${expenses > 0 ? formatCurrency(expenses) : '-'}</div>
                <div class="tracker-value" style="font-size: 2rem; font-weight: 800;">${formatCurrency(expenses)}</div>
                <div class="tracker-label" style="color: rgba(255,255,255,0.9); font-size: 0.95rem;">إجمالي المصروفات</div>
                <div class="tracker-trend" style="color: rgba(255,255,255,0.8); font-size: 0.85rem;">من الشهر الحالي</div>
            </div>
            
            <!-- بطاقة 3: الربح (تم تغيير الاسم من "ربح صافي" إلى "الربح") -->
            <div class="tracker-card profit" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none;">
                <div class="tracker-change" style="color: rgba(255,255,255,0.9);">${netProfit >= 0 ? '+' : ''}${formatCurrency(netProfit)}</div>
                <div class="tracker-value" style="font-size: 2rem; font-weight: 800;">${formatCurrency(netProfit)}</div>
                <div class="tracker-label" style="color: rgba(255,255,255,0.9); font-size: 0.95rem;">الربح</div>
                <div class="tracker-trend" style="color: rgba(255,255,255,0.8); font-size: 0.85rem;">${netProfit >= 0 ? 'ربح موجب' : 'خسارة'}</div>
            </div>
            
            <!-- بطاقة 4: صافي الربح = الفرق بين netProfit و expenses -->
            <div class="tracker-card net-profit" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; border: none;">
                <div class="tracker-change" style="color: rgba(255,255,255,0.9);">${getChangeIndicator(difference > 0)}</div>
                <div class="tracker-value" style="font-size: 2rem; font-weight: 800;">${formatCurrency(difference)}</div>
                <div class="tracker-label" style="color: rgba(255,255,255,0.9); font-size: 0.95rem;">صافي الربح</div>
                <div class="tracker-trend" style="color: rgba(255,255,255,0.8); font-size: 0.85rem;">${difference > 0 ? 'أداء جيد' : difference === 0 ? 'متوازن' : 'يحتاج مراجعة'}</div>
            </div>
        </div>
        
        <!-- معلومات إضافية -->
        <div style="margin-top: 20px; padding: 16px; background: linear-gradient(135deg, #f8f9ff 0%, #e6f0ff 100%); border-radius: 12px; border: 1px solid #c7d2fe; box-shadow: 0 2px 8px rgba(102,126,234,0.1);">
            <div style="display: flex; align-items: center; justify-content: space-between; color: #667eea; font-size: 13px; font-weight: 600;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 10px; height: 10px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite;"></div>
                    <span>🔄 متصل بـ Archive.currentMonth</span>
                </div>
                <div style="opacity: 0.8;">
                    ${new Date().toLocaleString('ar-EG')}
                </div>
            </div>
        </div>
    `;
    
    console.log('✅ تم عرض التراكر المباشر من Archive بنجاح');
}

// حساب الوقت منذ آخر تحديث
function getTimeSinceUpdate(lastUpdate) {
    const now = new Date();
    const seconds = Math.floor((now - lastUpdate) / 1000);
    
    if (seconds < 60) return `${seconds} ثانية`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} دقيقة`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours} ساعة`;
}

// ═══════════════════════════════════════════════════════
// 🧪 دوال التجريب والتشخيص
// ═══════════════════════════════════════════════════════

// دالة تجريبية لتشغيل التراكر يدوياً من الكونسول
window.testBudgetTracker = function() {
    console.log('🧪 تجربة التراكر المباشر...');
    
    const container = document.getElementById('live-budget-tracker');
    if (!container) {
        console.error('❌ عنصر live-budget-tracker غير موجود!');
        console.log('🔍 البحث عن عناصر مشابهة...');
        
        // البحث عن العناصر المتاحة
        const possibleContainers = document.querySelectorAll('[id*="budget"], [id*="tracker"]');
        console.log('📋 العناصر المتاحة:', possibleContainers);
        
        return false;
    }
    
    console.log('✅ تم العثور على حاوي التراكر');
    
    // تجربة عرض البيانات الافتراضية
    const testData = getDefaultTrackerData();
    displayLiveBudgetTracker(testData);
    
    console.log('✅ تم عرض التراكر بالبيانات التجريبية');
    return true;
};

// دالة للتحقق من حالة النظام
window.checkBudgetSystem = function() {
    console.log('🔍 فحص حالة نظام الميزانية...');
    
    // فحص وجود العناصر المطلوبة
    const elements = {
        'live-budget-tracker': document.getElementById('live-budget-tracker'),
        'budget-tab': document.getElementById('budget-tab'),
        'new-expense-form': document.getElementById('new-expense-form')
    };
    
    console.log('📋 حالة العناصر:');
    Object.entries(elements).forEach(([name, element]) => {
        console.log(`${element ? '✅' : '❌'} ${name}: ${element ? 'موجود' : 'غير موجود'}`);
    });
    
    // فحص البيانات المحفوظة
    const data = {
        'fixedExpenses': JSON.parse(localStorage.getItem('fixedExpenses') || '[]'),
        'monthlyBudgets': JSON.parse(localStorage.getItem('monthlyBudgets') || '{}')
    };
    
    console.log('💾 البيانات المحفوظة:');
    console.log('- الفواتير الثابتة:', data.fixedExpenses.length);
    console.log('- الفواتير الشهرية:', Object.keys(data.monthlyBudgets).length);
    
    // فحص التراكر
    if (liveBudgetInterval) {
        console.log('✅ التراكر المباشر يعمل');
    } else {
        console.log('❌ التراكر المباشر متوقف');
    }
    
    return elements;
};

// إنشاء تقرير المصروفات
async function generateExpenseReport() {
    const selectedMonth = document.getElementById('budget-month-select')?.value || new Date().toISOString().substring(0, 7);

    // helper: normalize various month representations into 'YYYY-MM'
    const normalizeMonth = (val) => {
        if (!val && val !== 0) return null;
        try {
            if (typeof val === 'string' && /^\d{4}-\d{2}$/.test(val)) return val;
            if (typeof val === 'string' && /^(\d{4})-(\d{2})/.test(val)) return val.substring(0, 7);
            if (val instanceof Date) return val.toISOString().substring(0, 7);
            if (typeof val === 'number') return new Date(val).toISOString().substring(0, 7);
        } catch (e) {
            return null;
        }
        return null;
    };

    try {
        // Try to fetch full budget document from server first (preferred)
        let fixedExpenses = [];
        let variableExpensesGlobal = [];
        let monthlyBudgets = {};

        try {
            const resp = await fetch(`${financialAnalyticsManager.apiBaseUrl}/budget`);
            if (resp.ok) {
                const data = await resp.json().catch(() => null);
                if (data && data.success && data.budget) {
                    const b = data.budget;

                    // map fixed/recurring bills
                    fixedExpenses = (b.recurringBills || b.fixedExpenses || []).map(item => ({
                        id: item._id || item.id || ('fixed_' + Date.now()),
                        name: item.name || item.title || 'بدون اسم',
                        amount: Number(item.amount || 0),
                        category: item.category || 'other',
                        recurrence: item.recurrence || { frequency: 'monthly' },
                        createdAt: item.createdAt || item.startDate || new Date().toISOString(),
                        type: 'fixed'
                    }));

                    // collect only canonical variable bills from the budget document
                    // User requested the variable-expenses card to reflect only `budget.variableBills` when loading from DB.
                    const variableCandidates = Array.isArray(b.variableBills) ? b.variableBills.slice() : [];

                    variableExpensesGlobal = variableCandidates.map(item => ({
                        id: item._id || item.id || ('var_' + Date.now()),
                        name: item.name || item.title || 'بدون اسم',
                        amount: Number(item.amount || 0),
                        category: item.category || 'other',
                        month: normalizeMonth(item.month || item.createdAt || item.date) || null,
                        createdAt: item.createdAt || item.addedAt || new Date().toISOString(),
                        // preserve flags so later rendering/filtering can exclude generated items
                        generatedFromFixed: !!(item.generatedFromFixed || item.addedFromFixed || false),
                        addedFromFixed: !!item.addedFromFixed,
                        originalType: item.type || item.billType || null,
                        type: 'variable',
                        _orig: item
                    }));

                    // keep monthlyBudgets mapping for fallback/explicit monthly variable lists
                    if (b.monthlyBudgets && typeof b.monthlyBudgets === 'object') {
                        Object.keys(b.monthlyBudgets).forEach(k => {
                            const mb = b.monthlyBudgets[k];
                            monthlyBudgets[k] = mb;
                        });
                    }

                    // persist to localStorage so other UI code which reads localStorage keeps working
                    try {
                        localStorage.setItem('fixedExpenses', JSON.stringify(fixedExpenses));
                        localStorage.setItem('variableExpenses', JSON.stringify(variableExpensesGlobal));
                        localStorage.setItem('monthlyBudgets', JSON.stringify(monthlyBudgets));
                    } catch (e) {
                        console.warn('⚠️ failed to persist budget data locally:', e);
                    }
                } else {
                    throw new Error('no-budget-data');
                }
            } else {
                throw new Error('budget API returned ' + resp.status);
            }
        } catch (apiErr) {
            // fallback to localStorage
            console.warn('⚠️ could not load budget from API, falling back to localStorage:', apiErr);
            fixedExpenses = JSON.parse(localStorage.getItem('fixedExpenses') || '[]');
            variableExpensesGlobal = JSON.parse(localStorage.getItem('variableExpenses') || '[]');
            monthlyBudgets = JSON.parse(localStorage.getItem('monthlyBudgets') || '{}');
        }

        // filter variable expenses that match the selected month (either from global list or monthlyBudgets)
        // Only use the global variable list (derived from budget.variableBills) for the variable card/summary.
        const fromGlobal = (variableExpensesGlobal || []).filter(exp => normalizeMonth(exp.month) === selectedMonth);
        const monthlyVariableExpenses = fromGlobal; // do NOT merge monthlyBudgets entries here per user's request

        // aggregate by category
        const categorySummary = {};
        [...fixedExpenses, ...monthlyVariableExpenses].forEach(expense => {
            const cat = expense.category || 'other';
            const amt = Number(expense.amount || 0);
            if (!categorySummary[cat]) categorySummary[cat] = 0;
            categorySummary[cat] += amt;
        });

        // compute totalExpenses to send to backend archive
        const totalExpenses = Object.values(categorySummary).reduce((sum, amount) => sum + amount, 0);

        // send to backend to update archive.currentMonth.expenses and sync Budget.financialBook
        (async () => {
            try {
                const resp = await fetch('/api/archive/update-from-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ month: selectedMonth, totalExpenses, date: selectedMonth + '-01' })
                });
                const data = await resp.json().catch(() => null);
                if (resp.ok && data && data.ok) {
                    console.log('✅ archive updated with report totals:', data.totalExpenses);
                } else {
                    console.warn('⚠️ failed to update archive from report:', data || resp.status);
                }
            } catch (e) {
                console.warn('⚠️ error sending report to archive endpoint:', e);
            }
        })();

        displayExpenseReport(categorySummary, selectedMonth);

    } catch (error) {
        console.error('❌ خطأ في إنشاء التقرير:', error);
        financialAnalyticsManager.showAlert('حدث خطأ في إنشاء التقرير', 'danger');
    }
}

// عرض تقرير المصروفات
function displayExpenseReport(categorySummary, month) {
    const container = document.getElementById('expense-report-display');
    if (!container) return;
    
    const totalExpenses = Object.values(categorySummary).reduce((sum, amount) => sum + amount, 0);
    const monthLabel = new Date(month + '-01').toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

    // compute fixed / variable totals from localStorage to match the monthly invoice card
    const fixedExpenses = JSON.parse(localStorage.getItem('fixedExpenses') || '[]');
    const variableExpensesAll = JSON.parse(localStorage.getItem('variableExpenses') || '[]');
    const monthlyVariableExpenses = variableExpensesAll.filter(exp => exp.month === month);
    const totalFixed = fixedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalVariable = monthlyVariableExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalCount = (fixedExpenses.length || 0) + (monthlyVariableExpenses.length || 0);

    // Render a polished monthly expense card similar to the variable-bills design
    container.innerHTML = `
        <div style="padding: 0;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0 0 8px 0; font-size: 18px;">تقرير مصروفات ${monthLabel}</h4>
                        <p style="margin: 0; opacity: 0.9; font-size: 14px;">تفصيل المصروفات لهذا الشهر</p>
                    </div>
                    <div style="text-align: left;">
                        <div style="font-size: 24px; font-weight: 700;">${financialAnalyticsManager.formatCurrency(totalExpenses)}</div>
                        <div style="font-size: 12px; opacity: 0.8;">الإجمالي</div>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; margin-top:16px;">
                <div style="background: #c6f6d5; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="color: #22543d; font-weight: 600; font-size: 16px;">${financialAnalyticsManager.formatCurrency(totalFixed)}</div>
                    <div style="color: #2f855a; font-size: 12px;">الفواتير الثابتة</div>
                </div>

                <div style="background: ${totalVariable > 0 ? '#fed7d7' : '#edf2f7'}; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="color: ${totalVariable > 0 ? '#742a2a' : '#4a5568'}; font-weight: 600; font-size: 16px;">${financialAnalyticsManager.formatCurrency(totalVariable)}</div>
                    <div style="color: ${totalVariable > 0 ? '#c53030' : '#718096'}; font-size: 12px;">الفواتير المتغيرة</div>
                </div>

                <div style="background: #bee3f8; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="color: #2a4365; font-weight: 600; font-size: 16px;">${totalCount}</div>
                    <div style="color: #3182ce; font-size: 12px;">إجمالي الفواتير</div>
                </div>
            </div>

            <div style="margin-top:16px; display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
                ${Object.entries(categorySummary).map(([category, amount]) => {
                    const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                    return `
                        <div class="category-item" style="background:#fff; border:1px solid #e2e8f0; padding:12px; border-radius:8px; text-align:center;">
                            <div class="category-name" style="font-size:13px; color:#718096;">${getCategoryText(category)}</div>
                            <div class="category-amount" style="font-size:16px; font-weight:700; color:#2d3748; margin-top:6px;">${financialAnalyticsManager.formatCurrency(amount)}</div>
                            <div style="font-size:11px; color:#718096; margin-top:6px;">${pct.toFixed(1)}% من الإجمالي</div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div style="margin-top:16px; display:flex; gap:8px; justify-content:flex-end;">
                <button class="action-btn btn-secondary" onclick="downloadExpenseReportAsPDF('${month}')">
                    <i class="fas fa-file-pdf"></i> تصدير PDF
                </button>
                <button class="action-btn btn-primary" onclick="printExpenseReport('${month}')">
                    <i class="fas fa-print"></i> طباعة
                </button>
            </div>
        </div>
    `;
}

// تحميل بيانات الشهر المحدد
function loadBudgetMonth() {
    loadBudgetSummary();
}

// إضافة معالج الأحداث للنموذج
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🌟 بدء تحميل صفحة إدارة الميزانية...');

    try {
        // تحميل كل بيانات الميزانية (بما فيها الفواتير الثابتة والمتغيرة)
        await loadBudgetData();
    } catch (err) {
        console.error('❌ خطأ في تحميل بيانات الميزانية:', err);
    }

    // تسجيل مستمع النموذج
    const expenseForm = document.getElementById('new-expense-form');
    if (expenseForm) {
        expenseForm.addEventListener('submit', saveNewExpense);
    }
});

// ربط حدث تغيير فلتر الشهور
function attachMonthFilterHandler() {
    const monthFilter = document.getElementById('variable-month-filter');
    if (!monthFilter) return;

    monthFilter.addEventListener('change', async function () {
        try {
            // عند تغيير الشهر، أعد تحميل الفاتورة الشهرية ومن ثم حدِّث العرض المكرر من localStorage
            await loadCurrentMonthlyBudget();
            try { renderVariableIntoDuplicate(); } catch(e){ console.warn('⚠️ renderVariableIntoDuplicate failed:', e); }
            await loadBudgetSummary();
        } catch (err) {
            console.warn('⚠️ خطأ أثناء تغيير شهر الفواتير:', err);
        }
    });
}

// تأكد من ربط الحدث بعد تحميل الواجهة
try {
    attachMonthFilterHandler();
} catch (e) {
    console.warn('⚠️ تعذّر ربط حدث فلتر الشهور:', e);
}

// quick-data-check removed — no global wrapper

    // 🚀 تحديث التتبع اليومي عند إضافة دفعة جديدة (وظيفة عامة)
function updateDailyTracker() {
    if (financialAnalyticsManager && financialAnalyticsManager.currentTab === 'dashboard') {
        console.log('🔄 تحديث التتبع اليومي...');
        financialAnalyticsManager.loadDashboardData();
    }
}

// 📊 إعادة رسم الرسم البياني اليومي (وظيفة عامة)
function refreshDailyChart() {
    if (financialAnalyticsManager) {
        financialAnalyticsManager.createDailyRevenueTrackerChart();
    }
}

// 📋 عرض التقرير (وظيفة عامة)
function viewReport(reportId) {
    if (financialAnalyticsManager) {
        financialAnalyticsManager.viewReport(reportId);
    }
}

// 📥 تحميل التقرير (وظيفة عامة)
function downloadReport(reportId) {
    console.log(`📥 تحميل التقرير: ${reportId}`);
    alert('ميزة تحميل التقارير قيد التطوير');
}

// 🖨️ طباعة التقرير (وظيفة عامة)
function printReport(reportId) {
    console.log(`🖨️ طباعة التقرير: ${reportId}`);
    window.print();
}

// 🔄 تحديث التقارير (وظيفة عامة)
function refreshReports() {
    if (financialAnalyticsManager) {
        financialAnalyticsManager.loadReportsData();
    }
}

// ❌ إغلاق مودال التقرير (وظيفة عامة)
function closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// ═══════════════════════════════════════════════════════
// 💰 دوال إدارة الفواتير الثابتة والمتغيرة - النظام الجديد
// ═══════════════════════════════════════════════════════

// إضافة فاتورة ثابتة جديدة
async function addFixedExpense(expenseData) {
    try {
        // حاول إرسال الفاتورة للباك اند
        const payload = {
            billType: 'recurring',
            category: expenseData.category,
            name: expenseData.name,
            amount: Number(expenseData.amount),
            notes: expenseData.notes || '',
            recurrence: {
                frequency: expenseData.frequency || 'monthly',
                startDate: expenseData.startDate || new Date().toISOString().split('T')[0],
                endDate: expenseData.endDate || null
            }
        };

        try {
            const resp = await fetch(`${financialAnalyticsManager.apiBaseUrl}/budget/receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) throw new Error('API error');
            const data = await resp.json();
            if (data.success) {
                console.log('✅ تم إضافة فاتورة ثابتة عبر API:', data.bill);
                // إعادة تحميل الواجهات المرتبطة
                await loadFixedExpenses();
                await loadCurrentMonthlyBudget();
                updateLiveBudgetTracker();
                showNotification(`تم إضافة فاتورة "${expenseData.name}" بنجاح`, 'success');
                return data.bill;
            } else {
                throw new Error(data.error || 'API failed');
            }
        } catch (apiError) {
            console.warn('⚠️ فشل الاتصال بالـ API، استخدام localStorage كبديل:', apiError);
            // رجوع لـ localStorage كخطة بديلة
            const fixedExpense = {
                id: 'fixed_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: expenseData.name,
                amount: parseFloat(expenseData.amount),
                category: expenseData.category,
                notes: expenseData.notes || '',
                recurrence: {
                    frequency: expenseData.frequency || 'monthly',
                    startDate: expenseData.startDate || new Date().toISOString().split('T')[0],
                    endDate: expenseData.endDate || null
                },
                createdAt: new Date().toISOString(),
                type: 'fixed'
            };

            const expenses = JSON.parse(localStorage.getItem('fixedExpenses') || '[]');
            expenses.push(fixedExpense);
            localStorage.setItem('fixedExpenses', JSON.stringify(expenses));

            // إعادة تحميل البيانات محلياً
            loadBudgetData();
            updateLiveBudgetTracker();
            showNotification(`تم إضافة فاتورة "${expenseData.name}" محلياً`, 'success');
            return fixedExpense;
        }

    } catch (error) {
        console.error('❌ خطأ في عملية إضافة الفاتورة الثابتة:', error);
        showNotification('حدث خطأ في إضافة الفاتورة', 'error');
        return null;
    }
}

// إضافة فاتورة متغيرة للشهر الحالي
async function addVariableExpenseToMonth(expenseData) {
    // Prefer explicit month passed from the form (expenseData.month). Fall back to page filter or current month.
    let selectedMonth = (expenseData && expenseData.month) || document.getElementById('variable-month-filter')?.value || new Date().toISOString().substring(0, 7);
    if (typeof selectedMonth === 'string' && !/^\d{4}-\d{2}$/.test(selectedMonth)) selectedMonth = new Date().toISOString().substring(0, 7);
    
    try {
        // إنشاء الفاتورة المتغيرة
        const variableExpense = {
            id: 'var_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: expenseData.name,
            amount: parseFloat(expenseData.amount),
            category: expenseData.category,
            notes: expenseData.notes || '',
            addedAt: new Date().toISOString(),
            type: 'variable',
            month: selectedMonth
        };
        
        // حاول إرسال الفاتورة للباك اند
        const payload = {
            billType: 'variable',
            category: expenseData.category,
            name: expenseData.name,
            amount: Number(expenseData.amount),
            notes: expenseData.notes || '',
            month: selectedMonth
        };

        try {
            const resp = await fetch(`${financialAnalyticsManager.apiBaseUrl}/budget/receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) throw new Error('API error');
            const data = await resp.json();
            if (data.success) {
                console.log('✅ تم إضافة فاتورة متغيرة عبر API:', data.bill);
                await loadCurrentMonthlyBudget();
                updateLiveBudgetTracker();
                showNotification(`تم إضافة فاتورة "${expenseData.name}" بنجاح`, 'success');
                return data.bill;
            } else {
                throw new Error(data.error || 'API failed');
            }
        } catch (apiError) {
            console.warn('⚠️ فشل الاتصال بالـ API، استخدام localStorage كبديل:', apiError);
            // الحصول على الفاتورة الشهرية أو إنشاؤها
            let monthlyBudget = getMonthlyBudget(selectedMonth);
            if (!monthlyBudget) {
                monthlyBudget = await createNewMonthlyBudget(selectedMonth);
            }

            // إضافة الفاتورة المتغيرة
            monthlyBudget.variableExpenses.push(variableExpense);

            // حفظ التحديث
            const monthlyBudgets = JSON.parse(localStorage.getItem('monthlyBudgets') || '{}');
            monthlyBudgets[selectedMonth] = monthlyBudget;
            localStorage.setItem('monthlyBudgets', JSON.stringify(monthlyBudgets));

            console.log(`✅ تم إضافة فاتورة متغيرة محلياً لشهر ${selectedMonth}:`, variableExpense);

            // إعادة تحميل العرض
            await loadCurrentMonthlyBudget();

            // تحديث التراكر المباشر
            updateLiveBudgetTracker();

            // إظهار رسالة نجاح
            showNotification(`تم إضافة فاتورة "${expenseData.name}" محلياً`, 'success');

            return variableExpense;
        }
        
    } catch (error) {
        console.error('❌ خطأ في إضافة الفاتورة المتغيرة:', error);
        showNotification('حدث خطأ في إضافة الفاتورة', 'error');
        return null;
    }
}

// حذف فاتورة متغيرة من الشهر
function removeVariableExpenseFromMonth(expenseId, month) {
    if (!confirm('هل تريد حذف هذه الفاتورة المتغيرة؟')) return;
    
    try {
        const monthlyBudgets = JSON.parse(localStorage.getItem('monthlyBudgets') || '{}');
        
        if (monthlyBudgets[month]) {
            monthlyBudgets[month].variableExpenses = monthlyBudgets[month].variableExpenses.filter(
                expense => expense.id !== expenseId
            );
            
            localStorage.setItem('monthlyBudgets', JSON.stringify(monthlyBudgets));
            
            console.log(`✅ تم حذف فاتورة متغيرة من شهر ${month}`);
            
            // إعادة تحميل العرض
            loadCurrentMonthlyBudget();
            
            // تحديث التراكر المباشر
            updateLiveBudgetTracker();
            
            showNotification('تم حذف الفاتورة بنجاح', 'success');
        }
        
    } catch (error) {
        console.error('❌ خطأ في حذف الفاتورة المتغيرة:', error);
        showNotification('حدث خطأ في حذف الفاتورة', 'error');
    }
}

// (deleteExpense and editExpense are implemented earlier with API integration)

// تحديث نموذج إضافة الفواتير للتعامل مع النظام الجديد
function handleExpenseFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const expenseData = {
        name: formData.get('expense-name'),
        amount: formData.get('expense-amount'),
        category: formData.get('expense-category'),
        notes: formData.get('expense-notes'),
        // include the explicit month selected in the form so variable expenses are saved to the intended month
        month: formData.get('expense-month'),
        frequency: formData.get('expense-frequency') || 'monthly'
    };
    
    const expenseType = formData.get('expense-type');
    const activeTab = document.querySelector('.tab-content.active').id;
    
    // التحقق من صحة البيانات
    if (!expenseData.name || !expenseData.amount || !expenseData.category) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (parseFloat(expenseData.amount) <= 0) {
        showNotification('يجب أن يكون المبلغ أكبر من صفر', 'error');
        return;
    }
    
    // إضافة الفاتورة حسب النوع والتبويب النشط
    if (expenseType === 'fixed' || activeTab === 'fixed-tab') {
        addFixedExpense(expenseData);
    } else if (expenseType === 'variable' || activeTab === 'variable-tab') {
        addVariableExpenseToMonth(expenseData);
    }
    
    // إعادة تعيين النموذج
    event.target.reset();
}

// دالة مساعدة لعرض الإشعارات
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    
    // تحديد لون الإشعار حسب النوع
    const colors = {
        success: 'linear-gradient(135deg, #10b981, #059669)',
        error: 'linear-gradient(135deg, #ef4444, #dc2626)',
        warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
        info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    
    // إضافة الإشعار للصفحة
    document.body.appendChild(notification);
    
    // تحريك الإشعار للظهور
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // إخفاء الإشعار بعد 3 ثوانٍ
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// التعامل مع تغيير نوع الفاتورة في النموذج
function handleExpenseTypeChange() {
    const expenseType = document.getElementById('expense-type').value;
    const fixedSettings = document.getElementById('fixed-expense-settings');
    const variableSettings = document.getElementById('variable-expense-settings');
    const helpText = document.getElementById('expense-type-help');
    const expenseMonth = document.getElementById('expense-month');
    const startDate = document.getElementById('start-date');
    
    // إخفاء كل الإعدادات أولاً
    fixedSettings.style.display = 'none';
    variableSettings.style.display = 'none';
    
    if (expenseType === 'fixed') {
        fixedSettings.style.display = 'block';
        helpText.textContent = 'ستُضاف هذه الفاتورة تلقائياً كل شهر';
        helpText.style.color = '#1890ff';
        
        // تعيين تاريخ البدء للشهر الحالي
        if (startDate) {
            startDate.value = new Date().toISOString().split('T')[0];
        }
        
    } else if (expenseType === 'variable') {
        variableSettings.style.display = 'block';
        helpText.textContent = 'ستُضاف هذه الفاتورة للشهر المحدد فقط';
        helpText.style.color = '#fa8c16';
        
        // تعيين الشهر الحالي كافتراضي
        if (expenseMonth) {
            expenseMonth.value = new Date().toISOString().substring(0, 7);
        }
        
    } else {
        helpText.textContent = '';
    }
}

// دوال مساعدة لتحويل النصوص
function getCategoryText(category) {
    const categories = {
        'salaries': 'رواتب ومكافآت',
        'utilities': 'خدمات (كهرباء، مياه، إنترنت)',
        'rent': 'إيجارات',
        'maintenance': 'صيانة وإصلاحات',
        'supplies': 'مستلزمات وأدوات',
        'marketing': 'دعاية وتسويق',
        'transportation': 'مواصلات ونقل',
        'food': 'طعام ومشروبات',
        'equipment': 'معدات وأجهزة',
        'other': 'أخرى'
    };
    return categories[category] || category;
}

function getFrequencyText(frequency) {
    const frequencies = {
        'monthly': 'شهر',
        'quarterly': '3 أشهر',
        'yearly': 'سنة'
    };
    return frequencies[frequency] || frequency;
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    financialAnalyticsManager = new FinancialAnalyticsManager();
    
    // تجربة تشغيل التراكر إذا كان تبويب الميزانية مفتوح
    setTimeout(() => {
        const budgetTab = document.getElementById('budget-tab');
        if (budgetTab && budgetTab.classList.contains('active')) {
            console.log('🔄 تبويب الميزانية مفتوح، تشغيل التراكر...');
            initializeLiveBudgetTracker();
        }
    }, 2000);
    
    // تعيين الشهر الحالي في فلتر الفواتير المتغيرة
    const monthFilter = document.getElementById('variable-month-filter');
    if (monthFilter) {
        const currentMonth = new Date().toISOString().substring(0, 7);
        monthFilter.value = currentMonth;
    }

    // (debug helper removed)

    // --- Ensure budget lists are populated on page load so the variable bills card shows DB data
    // This is guarded: only runs if budget containers are present in the DOM.
    setTimeout(async () => {
        try {
            const fixedContainer = document.getElementById('fixed-expenses-list');
            const variableContainer = document.getElementById('variable-expenses-list');
            // If either container exists, load budget-related data so cards render
                if (fixedContainer || variableContainer) {
                console.log('🔄 Initializing budget lists on page load...');
                await loadFixedExpenses();
                await loadCurrentMonthlyBudget();
                // variable-expenses card removed — populate duplicate from localStorage instead
                try { renderVariableIntoDuplicate(); } catch(e){ console.warn('⚠️ renderVariableIntoDuplicate failed:', e); }
                await loadBudgetSummary();
                console.log('✅ Budget lists loaded');
            }
        } catch (e) {
            console.warn('⚠️ فشل في تحميل القوائم المبدئية للميزانية:', e);
        }
    }, 300);
    
    // تحديث تلقائي كل 5 دقائق للتتبع اليومي (وليس كل دقيقة)
    setInterval(() => {
        if (financialAnalyticsManager && financialAnalyticsManager.currentTab === 'dashboard') {
            console.log('🔄 تحديث التتبع اليومي...');
            updateDailyTracker();
        }
    }, 5 * 60 * 1000); // كل 5 دقائق
    
    // إضافة دوال التجريب للكونسول العالمي
    console.log('🧪 دوال التجريب المتاحة:');
    console.log('- testBudgetTracker() : لتجربة التراكر يدوياً');
    console.log('- checkBudgetSystem() : لفحص حالة النظام');
});
    
    // تهيئة مدير التقارير المالية مع تأخير للتأكد من تحميل DOM
    setTimeout(() => {
        if (document.getElementById('financialReportsChart')) {
            window.financialReportsManager = new FinancialReportsManager();
            console.log('✅ تم تهيئة مدير التقارير المالية');
        } else {
            console.log('⏳ عنصر الرسم البياني غير جاهز، إعادة المحاولة...');
            setTimeout(() => {
                if (document.getElementById('financialReportsChart')) {
                    window.financialReportsManager = new FinancialReportsManager();
                    console.log('✅ تم تهيئة مدير التقارير المالية (المحاولة الثانية)');
                }
            }, 2000);
        }
    }, 1000);


// ═══════════════════════════════════════════════════════
// 📈 مدير التقارير المالية الشهرية والسنوية
// ═══════════════════════════════════════════════════════

class FinancialReportsManager {
    constructor() {
        this.chart = null;
        this.currentChartType = 'monthly';
        this.financialData = null;
        this.initializeReports();
    }

    async initializeReports() {
        try {
            console.log('📊 تهيئة التقارير المالية...');
            await this.loadFinancialData();
            
            if (!this.financialData) {
                console.error('❌ فشل في تحميل البيانات المالية');
                this.showErrorInChart();
                return;
            }
            
            console.log('✅ تم تحميل البيانات المالية بنجاح:', this.financialData);
            this.setupChartControls();
            this.renderChart('monthly');
            // ابدأ مراقبة الأرشيف لتحديث التقارير تلقائياً عند حدوث تغييرات
            this.startArchiveWatcher();
        } catch (error) {
            console.error('❌ خطأ في تهيئة التقارير المالية:', error);
            this.showErrorInChart();
        }
    }

    // التحليلات والتوصيات أُزيلت — لا توجد دوال عرض للرؤى هنا بعد الآن.

    async loadFinancialData() {
        try {
            console.log('📊 جاري تحميل البيانات المالية للتقارير...');
            
            // استخدام البيانات التجريبية مباشرة
            // حاول جلب بيانات الأرشيف الحقيقية أولاً
            try {
                const resp = await fetch('/api/archive');
                if (resp.ok) {
                    const obj = await resp.json();
                    if (obj && obj.ok && obj.archive) {
                        const archive = obj.archive;

                        // بناء بيانات شهرية من monthsArchive (آخر 12 شهر)
                        const monthsArr = [];
                        const years = archive.monthsArchive || [];
                        // سنوات مخزنة بترتيب الأحدث أولاً. نجمع الشهور من الأحدث للأقدم ثم نأخذ آخر 12 بعكس الترتيب المطلوب للعرض
                        for (let y = 0; y < years.length; y++) {
                            const yearEntry = years[y];
                            if (yearEntry && Array.isArray(yearEntry.months)) {
                                for (let m = 0; m < yearEntry.months.length; m++) {
                                    monthsArr.push(yearEntry.months[m]);
                                }
                            }
                        }

                        // الآن monthsArr يحتوي شهور مجمعة (قد تكون بترتيب الأقدم أول) - normalize: map to objects with labels and values
                        const monthly = [];
                        // take latest 12 months based on monthsArr order (keep the last up to 12)
                        const lastMonths = monthsArr.slice(-12);
                        lastMonths.forEach(m => {
                            const revenue = Number(m.revenue || 0);
                            const expenses = Number(m.expenses || 0) || 0;
                            const netProfit = Number(m.netProfit != null ? m.netProfit : (revenue - expenses));
                            const label = `${(m.monthName || '').toString()} ${m.yearName || ''}`.trim();
                            monthly.push({
                                month: label || 'غير معروف',
                                // chart mapping: first dataset is blue -> netProfit, second dataset is pink -> revenue
                                expected: netProfit, // dataset[0] (blue)
                                actual: revenue,     // dataset[1] (pink)
                                revenue: revenue,
                                expenses: expenses,
                                netProfit: netProfit
                            });
                        });

                        // بناء بيانات سنوية من archive.years (اخر 3 سنوات)
                        const yearsArr = (archive.years && Array.isArray(archive.years)) ? archive.years.slice(-3) : [];
                        const yearly = yearsArr.map(y => ({ year: y.yearName + '', revenue: Number(y.revenue || 0), expenses: Number(y.expenses || 0), profit: Number(y.netProfit || 0) }));

                        // do not include comparison object — reports are driven directly from monthly/yearly archive data
                        this.financialData = { monthly, yearly };
                        console.log('✅ تم تحميل بيانات الأرشيف للتقارير المالية:', { monthlyCount: monthly.length, yearlyCount: yearly.length });
                        return;
                    }
                }
            } catch (err) {
                console.warn('⚠️ تحميل بيانات الأرشيف فشل:', err);
            }

            // إذا لم نستطع الحصول على بيانات الأرشيف، أنشئ مجموعات فارغة تمثل الواقع (قِيَم صفر)
            // نعرض آخر 12 شهر كـ تسميات مع قيم صفرية، ونُنشئ 3 سنوات أخيرة بالقيم صفر
            const buildEmptyMonthly = () => {
                const months = [];
                const now = new Date();
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const label = d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
                    months.push({ month: label, expected: 0, actual: 0, revenue: 0, expenses: 0, netProfit: 0 });
                }
                return months;
            };

            const buildEmptyYearly = () => {
                const years = [];
                const now = new Date();
                for (let i = 2; i >= 0; i--) {
                    const y = now.getFullYear() - i;
                    years.push({ year: String(y), revenue: 0, expenses: 0, profit: 0 });
                }
                return years;
            };

            this.financialData = {
                monthly: buildEmptyMonthly(),
                yearly: buildEmptyYearly()
            };

            console.log('ℹ️ Loaded empty financialData (archive unavailable) — charts will reflect zeros');
            
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات المالية:', error);
            // on unexpected error, fall back to empty zeroed data (do not use mock random data)
            const now = new Date();
            const buildEmptyMonthly = () => {
                const months = [];
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const label = d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
                    months.push({ month: label, expected: 0, actual: 0, revenue: 0, expenses: 0, netProfit: 0 });
                }
                return months;
            };
            const buildEmptyYearly = () => {
                const years = [];
                for (let i = 2; i >= 0; i--) {
                    const y = now.getFullYear() - i;
                    years.push({ year: String(y), revenue: 0, expenses: 0, profit: 0 });
                }
                return years;
            };

            this.financialData = { monthly: buildEmptyMonthly(), yearly: buildEmptyYearly() };
        }
    }

    // Removed generateMockData to ensure reports use only real DB/archive data or show zeros when absent.

    setupChartControls() {
        console.log('⚙️ تهيئة أزرار التحكم في التقارير');
        
        document.querySelectorAll('.report-chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const button = e.target.closest('button');
                const onclickValue = button.getAttribute('onclick');
                
                if (onclickValue) {
                    // البحث عن النوع في onclick="switchFinancialChart('monthly')"
                    const chartType = onclickValue.match(/'(\w+)'/)[1];
                    console.log(`🎯 تم النقر على زر: ${chartType}`);
                    this.switchChart(chartType);
                } else {
                    console.error('❌ لم يتم العثور على نوع التقرير في onclick');
                }
            });
        });
        
        console.log('✅ تم ربط جميع أزرار التحكم في التقارير');
    }

    switchChart(type) {
        console.log(`🔄 تبديل التقرير إلى نوع: ${type}`);
        
        // تحديث حالة الأزرار
        document.querySelectorAll('.report-chart-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[onclick*="'${type}'"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            console.log(`✅ تم تفعيل زر ${type}`);
        } else {
            console.error(`❌ لم يتم العثور على زر ${type}`);
        }
        
        this.currentChartType = type;
        this.renderChart(type);
    // updateReportInsights removed (insights UI was removed). No-op here.
    }

    renderChart(type) {
        console.log(`🔄 عرض رسم بياني من نوع: ${type}`);
        
        if (!this.financialData) {
            console.error('❌ لا توجد بيانات مالية للعرض');
            this.showErrorInChart();
            return;
        }

        const ctx = document.getElementById('financialReportsChart');
        if (!ctx) {
            console.error('❌ لم يتم العثور على canvas التقارير المالية');
            return;
        }

        // إزالة الرسم السابق
        if (this.chart) {
            this.chart.destroy();
            console.log('🗑️ تم حذف الرسم السابق');
        }

        // إخفاء loading
        const loadingElement = document.getElementById('reportChartLoading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
            console.log('⏳ تم إخفاء شاشة التحميل');
        }

        let chartConfig = {};

        switch (type) {
            case 'monthly':
                chartConfig = this.getMonthlyChartConfig();
                break;
            case 'yearly':
                chartConfig = this.getYearlyChartConfig();
                break;
            default:
                console.error(`❌ نوع رسم غير مدعوم: ${type}`);
                return;
        }

        try {
            this.chart = new Chart(ctx.getContext('2d'), chartConfig);
            console.log(`✅ تم عرض تقرير ${type} بنجاح`);
        } catch (error) {
            console.error('❌ خطأ في عرض الرسم البياني:', error);
            this.showErrorInChart();
        }
    }

    getMonthlyChartConfig() {
        const monthlyData = this.financialData.monthly;
        
        return {
            type: 'line',
            data: {
                labels: monthlyData.map(item => item.month),
                datasets: [
                    {
                        label: 'الأرباح',
                        data: monthlyData.map(item => item.expected),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'الإيرادت',
                        data: monthlyData.map(item => item.actual),
                        borderColor: '#f093fb',
                        backgroundColor: 'rgba(240, 147, 251, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { usePointStyle: true }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('ar-EG').format(value) + ' ج.م';
                            }
                        }
                    }
                }
            }
        };
    }

    getYearlyChartConfig() {
        const yearlyData = this.financialData.yearly;
        
        return {
            type: 'bar',
            data: {
                labels: yearlyData.map(item => item.year),
                datasets: [
                    {
                        label: 'الإيرادات',
                        data: yearlyData.map(item => item.revenue),
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: '#667eea',
                        borderWidth: 2
                    },
                    {
                        label: 'المصروفات',
                        data: yearlyData.map(item => item.expenses),
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: '#ef4444',
                        borderWidth: 2
                    },
                    {
                        label: 'الأرباح',
                        data: yearlyData.map(item => item.profit),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: '#10b981',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { usePointStyle: true }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('ar-EG').format(value) + ' ج.م';
                            }
                        }
                    }
                }
            }
        };
    }



    // التحليلات والتوصيات محذوفة — لا تبقى دوال لتحديث الرؤى هنا

    // بدء مؤقت لمراقبة الأرشيف وتحديث التقارير فقط عند تغيّر بصمة الأرشيف
    startArchiveWatcher(intervalMs = 15000) {
        if (this._archiveWatcherInterval) return; // already running
        console.log(`⏱️ بدء مراقب الأرشيف (كل ${intervalMs}ms)`);
        this._archiveWatcherInterval = setInterval(async () => {
            try {
                const resp = await fetch('/api/archive', { cache: 'no-store' });
                if (!resp.ok) return;
                const obj = await resp.json();
                if (!obj || !obj.ok || !obj.archive) return;
                const archive = obj.archive;
                const fingerprint = this._computeArchiveFingerprint(archive);
                if (fingerprint !== this._lastArchiveFingerprint) {
                    this._lastArchiveFingerprint = fingerprint;
                    console.log('🔔 تغيّر في الأرشيف - تحديث بيانات التقارير');
                    await this.loadFinancialData();
                    this.renderChart(this.currentChartType);
                }
            } catch (err) {
                console.warn('⚠️ خطأ في مراقب الأرشيف:', err);
            }
        }, intervalMs);
    }

    // إيقاف مراقب الأرشيف إذا كان يعمل
    stopArchiveWatcher() {
        if (this._archiveWatcherInterval) {
            clearInterval(this._archiveWatcherInterval);
            this._archiveWatcherInterval = null;
            console.log('⏹️ توقيف مراقب الأرشيف');
        }
    }

    // حساب "بصمة" مبسطة للأرشيف لتحديد ما إذا تغيّرت البيانات
    _computeArchiveFingerprint(archive) {
        try {
            const parts = [];
            if (archive.currentMonth) {
                const m = archive.currentMonth;
                parts.push(`${m.yearName||''}-${m.monthName||''}-${m.revenue||0}-${m.expenses||0}-${m.netProfit||0}`);
            }
            const months = [];
            const years = archive.monthsArchive || [];
            for (let y = 0; y < years.length; y++) {
                const ye = years[y];
                if (ye && Array.isArray(ye.months)) {
                    for (let m = 0; m < ye.months.length; m++) {
                        const mm = ye.months[m];
                        months.push(`${mm.yearName||''}-${mm.monthName||''}-${mm.revenue||0}-${mm.expenses||0}-${mm.netProfit||0}`);
                    }
                }
            }
            // keep only last 12 months
            parts.push(months.slice(-12).join('|'));
            const yearsSig = (archive.years || []).map(y => `${y.yearName||''}-${y.revenue||0}-${y.expenses||0}-${y.netProfit||0}`).join('|');
            parts.push(yearsSig);
            return parts.join('||');
        } catch (e) {
            try { return JSON.stringify(archive); } catch (ee) { return String(Date.now()); }
        }
    }

    showErrorInChart() {
        console.log('⚠️ عرض رسالة خطأ في الرسم البياني');
        const ctx = document.getElementById('financialReportsChart');
        const parent = ctx?.parentElement;
        if (parent) {
            parent.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 280px; color: #718096; text-align: center;">
                    <div>
                        <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 8px;"></i>
                        <div>خطأ في تحميل البيانات</div>
                        <div style="font-size: 12px; margin-top: 4px;">
                            <button onclick="window.financialReportsManager.initializeReports()" 
                                    style="background: #667eea; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                                إعادة المحاولة
                            </button>
                        </div>
                    </div>
                </div>
            `;
            console.log('✅ تم عرض رسالة الخطأ');
        } else {
            console.error('❌ لم يتم العثور على canvas أو parent للتقارير المالية');
        }
    }
}

// دالة عامة لتبديل التقارير المالية
window.switchFinancialChart = function(type) {
    if (window.financialReportsManager) {
        window.financialReportsManager.switchChart(type);
    } else {
        console.error('❌ مدير التقارير المالية غير متاح');
    }
};

// طباعة تقرير المصروفات
function printExpenseReport(month) {
    const container = document.getElementById('expense-report-display');
    if (!container) return;
    const original = document.body.innerHTML;
    const reportHtml = container.innerHTML;
    document.body.innerHTML = reportHtml;
    window.print();
    document.body.innerHTML = original;
    window.location.reload();
}

// تنزيل تقرير المصروفات كـ PDF (بسيط، يعتمد على طباعة المتصفح)
function downloadExpenseReportAsPDF(month) {
    // نستخدم نافذة الطباعة للمستخدم ليختار حفظ كـ PDF
    printExpenseReport(month);
}

// إغلاق المودالات عند النقر خارجها
window.addEventListener('click', (event) => {
    const budgetModal = document.getElementById('budget-plan-modal');
    const transactionModal = document.getElementById('transaction-modal');
    
    if (event.target === budgetModal) {
        closeBudgetPlanModal();
    }
    
    if (event.target === transactionModal) {
        closeTransactionModal();
    }
});

// دالة مساعدة للتبديل بين أنواع التقارير المالية
function switchFinancialChart(type) {
    console.log(`📊 تبديل التقرير المالي إلى: ${type}`);
    if (window.financialReportsManager) {
        window.financialReportsManager.switchChart(type);
    } else {
        console.error('❌ مدير التقارير المالية غير متاح');
    }
}