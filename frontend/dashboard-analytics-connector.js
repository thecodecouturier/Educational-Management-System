// 🔗 ملف الربط بين الفرونت إند والباك إند
// Dashboard Analytics Connector

// ========================================
// 🌐 إعدادات الاتصال
// ========================================
const API_BASE_URL = 'http://localhost:3001/api/financial-analytics';

// ========================================
// 📊 جلب بيانات لوحة المؤشرات
// ========================================
async function fetchDashboardData() {
    try {
        console.log('🔄 جاري جلب بيانات التحليلات المالية...');
        
        const response = await fetch(`${API_BASE_URL}/dashboard`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ تم جلب البيانات بنجاح:', data);
            return data.data;
        } else {
            throw new Error('فشل في جلب البيانات');
        }
        
    } catch (error) {
        console.error('❌ خطأ في جلب البيانات:', error);
        showErrorMessage('حدث خطأ في الاتصال بالخادم');
        return null;
    }
}

// ========================================
// 💰 تحديث مؤشر الإيراد التراكمي
// ========================================
function updateMonthlyRevenue(data) {
    const element = document.getElementById('monthly-revenue');
    if (element && data.current && data.current.day) {
        const cumulativeRevenue = data.current.day.cumulativeRevenue || 0;
        element.textContent = `${cumulativeRevenue.toLocaleString('ar-EG')} جنيه`;
        console.log('💰 تم تحديث الإيراد التراكمي:', cumulativeRevenue);
    }
}

// ========================================
// 📈 تحديث نسبة التحصيل
// ========================================
function updateCollectionRate(data) {
    const element = document.getElementById('collection-rate');
    if (element && data.current && data.current.day) {
        const collectionRate = data.current.day.collectionRate || 0;
        element.textContent = `${collectionRate.toFixed(2)}%`;
        console.log('📈 تم تحديث نسبة التحصيل:', collectionRate);
        
        // تحديث معلومات نسبة التحصيل
        updateCollectionInfo(data);
    }
}

// ========================================
// 📊 تحديث معلومات نسبة التحصيل
// ========================================
function updateCollectionInfo(data) {
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

// ========================================
// 📈 حساب معدل النمو السنوي
// ========================================
function calculateGrowthRate(years) {
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

// ========================================
// 📊 تحديث مؤشر معدل النمو
// ========================================
function updateGrowthRate(data) {
    const element = document.getElementById('growth-rate');
    const infoElement = document.getElementById('growth-rate-info');
    
    if (element && data.all && data.all.years) {
        const growthRate = calculateGrowthRate(data.all.years);
        
        // تحديث القيمة الرئيسية
        const isPositive = growthRate >= 0;
        element.textContent = `${isPositive ? '+' : ''}${growthRate.toFixed(2)}%`;
        element.style.color = isPositive ? '#38a169' : '#e53e3e';
        
        console.log('📊 تم تحديث معدل النمو:', growthRate);
        
        // تحديث معلومات المقارنة
        if (infoElement) {
            updateGrowthInfo(data.all.years);
        }
    }
}

// ========================================
// 📊 تحديث معلومات معدل النمو (4 سنوات)
// ========================================
function updateGrowthInfo(years) {
    const infoElement = document.getElementById('growth-rate-info');
    if (!infoElement || !years) return;
    
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
    const totalGrowth = yearsWithGrowth[0].growth;
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

// ========================================
// 📅 تحديث معلومات التاريخ
// ========================================
function updateDateInfo(data) {
    if (data.current && data.current.day) {
        const { dayNumber, monthName, yearName, dayName } = data.current.day;
        console.log(`📅 التاريخ: ${dayName}، ${dayNumber} ${monthName} ${yearName}`);
    }
}

// ========================================
// 🎨 رسم الرسم البياني للإيرادات (طريقة محسّنة)
// ========================================
function drawRevenueChart(data) {
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
    if (window.revenueTrendChart) {
        window.revenueTrendChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    window.revenueTrendChart = new Chart(ctx, {
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

// ========================================
// 📈 رسم الرسم البياني لنسبة التحصيل (محسّن)
// ========================================
function drawCollectionChart(data) {
    const canvas = document.getElementById('collection-chart');
    if (!canvas || !data.current) return;
    
    const expectedRevenue = data.current.month.expectedRevenue || 0;
    const collectedRevenue = data.current.day.cumulativeRevenue || 0;
    const remainingRevenue = expectedRevenue - collectedRevenue;
    
    const collectedPercent = expectedRevenue > 0 ? (collectedRevenue / expectedRevenue) * 100 : 0;
    const remainingPercent = expectedRevenue > 0 ? (remainingRevenue / expectedRevenue) * 100 : 0;
    
    // تدمير الرسم القديم إن وجد
    if (window.collectionChart) {
        window.collectionChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    window.collectionChart = new Chart(ctx, {
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

// ========================================
// 📊 رسم الرسم البياني لمعدل النمو (4 سنوات محسّن)
// ========================================
function drawGrowthChart(data) {
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
    const barColors = growthRates.map(rate => {
        if (rate > 0) return 'rgba(56, 161, 105, 0.6)'; // أخضر للنمو الإيجابي
        if (rate < 0) return 'rgba(229, 62, 62, 0.6)'; // أحمر للنمو السلبي
        return 'rgba(160, 174, 192, 0.6)'; // رمادي للثابت
    });
    
    const barBorders = growthRates.map(rate => {
        if (rate > 0) return '#38a169';
        if (rate < 0) return '#e53e3e';
        return '#a0aec0';
    });
    
    // تدمير الرسم القديم إن وجد
    if (window.growthChart) {
        window.growthChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    window.growthChart = new Chart(ctx, {
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
                    pointBackgroundColor: barColors,
                    pointBorderColor: barBorders,
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

// ========================================
// 🎯 تحديث جميع المؤشرات
// ========================================
async function updateAllMetrics() {
    console.log('🎯 بدء تحديث جميع المؤشرات...');
    
    const data = await fetchDashboardData();
    
    if (!data) {
        console.error('❌ فشل في جلب البيانات');
        return;
    }
    
    // تحديث المؤشرات الأساسية
    updateMonthlyRevenue(data);
    updateCollectionRate(data);
    updateGrowthRate(data);
    updateDateInfo(data);
    
    // رسم الرسوم البيانية
    drawRevenueChart(data);
    drawCollectionChart(data);
    drawGrowthChart(data);
    
    console.log('✅ تم تحديث جميع المؤشرات بنجاح');
}

// ========================================
// ⚠️ عرض رسالة خطأ
// ========================================
function showErrorMessage(message) {
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

// ========================================
// 🚀 التهيئة عند تحميل الصفحة
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 تهيئة نظام التحليلات المالية...');
    
    // تحديث البيانات عند التحميل
    updateAllMetrics();
    
    // تحديث تلقائي كل 5 دقائق
    setInterval(updateAllMetrics, 5 * 60 * 1000);
    
    console.log('✅ تم تهيئة النظام بنجاح');
    console.log('🔄 سيتم التحديث التلقائي كل 5 دقائق');
});
