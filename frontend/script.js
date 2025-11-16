// متغيرات عامة للنظام
let currentCurrency = { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري', country: 'مصر' };

// 🎨 إدارة الخلفية الديناميكية بنظام الشبكة العشوائية
class PatternBackground {
  constructor() {
    this.container = document.getElementById('patternBackground');
    this.minDistance = 60; // الحد الأدنى الأساسي للمسافة بين الرموز
    this.maxAttempts = 30; // عدد المحاولات لإيجاد موضع جديد
    this.icons = [
      // رموز تعليمية
      'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222', // graduation cap
      'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', // book
      'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', // document
      'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', // pencil
      'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', // clipboard
      'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', // book open
      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', // calendar
      'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', // light bulb
      'M13 10V3L4 14h7v7l9-11h-7z', // lightning
      'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', // clock
      'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', // edit
      'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', // check circle
      'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', // currency
      'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', // user
      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', // users
      'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', // briefcase
      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', // chart bar
      'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z', // chart pie
      'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' // user group
    ];
  }

  // خوارزمية Poisson Disk Sampling محسّنة مع حجم ديناميكي
  generatePoissonDiskPoints(width, height, minDistance, maxAttempts) {
    const cellSize = minDistance / Math.sqrt(2);
    const gridWidth = Math.ceil(width / cellSize);
    const gridHeight = Math.ceil(height / cellSize);
    
    // شبكة للتحقق السريع من المسافات
    const grid = new Array(gridWidth * gridHeight).fill(null);
    const points = [];
    const activeList = [];
    
    // دالة لتحويل الإحداثيات إلى فهرس الشبكة
    const getGridIndex = (x, y) => {
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);
      if (col < 0 || col >= gridWidth || row < 0 || row >= gridHeight) return -1;
      return row * gridWidth + col;
    };
    
    // دالة للتحقق من المسافة مع النقاط المجاورة (مع مراعاة الحجم)
    const isFarEnough = (x, y, proposedSize) => {
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);
      
      // فحص الخلايا المجاورة (5x5 لمزيد من الأمان)
      const checkRange = 3;
      for (let i = -checkRange; i <= checkRange; i++) {
        for (let j = -checkRange; j <= checkRange; j++) {
          const checkCol = col + i;
          const checkRow = row + j;
          
          if (checkCol < 0 || checkCol >= gridWidth || checkRow < 0 || checkRow >= gridHeight) continue;
          
          const index = checkRow * gridWidth + checkCol;
          const neighbor = grid[index];
          
          if (neighbor) {
            const dx = x - neighbor.x;
            const dy = y - neighbor.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // المسافة المطلوبة = نصف قطر الرمز الأول + نصف قطر الرمز الثاني + هامش أمان
            const safetyMargin = 15; // هامش أمان 15 بكسل
            const requiredDistance = (proposedSize / 2) + (neighbor.size / 2) + safetyMargin;
            
            if (dist < requiredDistance) {
              return false;
            }
          }
        }
      }
      return true;
    };
    
    // دالة لتوليد حجم عشوائي
    const generateSize = () => {
      const sizeRanges = [
        { min: 15, max: 25, weight: 0.25 },
        { min: 25, max: 40, weight: 0.30 },
        { min: 40, max: 55, weight: 0.25 },
        { min: 55, max: 75, weight: 0.15 },
        { min: 75, max: 90, weight: 0.05 }
      ];
      
      const random = Math.random();
      let cumulative = 0;
      
      for (const range of sizeRanges) {
        cumulative += range.weight;
        if (random <= cumulative) {
          return range.min + Math.random() * (range.max - range.min);
        }
      }
      return 40;
    };
    
    // نقطة البداية العشوائية
    const firstSize = generateSize();
    const firstPoint = {
      x: Math.random() * width,
      y: Math.random() * height,
      size: firstSize
    };
    points.push(firstPoint);
    activeList.push(firstPoint);
    grid[getGridIndex(firstPoint.x, firstPoint.y)] = firstPoint;
    
    // توليد النقاط
    while (activeList.length > 0 && points.length < 700) { // تقليل العدد قليلاً لمزيد من المساحة
      const randomIndex = Math.floor(Math.random() * activeList.length);
      const point = activeList[randomIndex];
      let found = false;
      
      // محاولة إيجاد نقطة جديدة حول النقطة الحالية
      for (let i = 0; i < maxAttempts; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = minDistance + Math.random() * minDistance;
        
        const newX = point.x + Math.cos(angle) * radius;
        const newY = point.y + Math.sin(angle) * radius;
        const newSize = generateSize();
        
        // التحقق من أن النقطة داخل الحدود (مع هامش للحجم)
        const margin = newSize / 2;
        if (newX >= margin && newX < width - margin && newY >= margin && newY < height - margin) {
          if (isFarEnough(newX, newY, newSize)) {
            const newPoint = { x: newX, y: newY, size: newSize };
            points.push(newPoint);
            activeList.push(newPoint);
            grid[getGridIndex(newX, newY)] = newPoint;
            found = true;
            break;
          }
        }
      }
      
      // إذا لم نجد نقطة جديدة، احذف النقطة الحالية من القائمة النشطة
      if (!found) {
        activeList.splice(randomIndex, 1);
      }
    }
    
    return points;
  }

  // دالة لإنشاء رمز SVG في موضع محدد
  createRandomIcon(point) {
    // اختيار رمز عشوائي
    const iconPath = this.icons[Math.floor(Math.random() * this.icons.length)];
    
    // استخدام الحجم المحدد مسبقاً
    const size = point.size;
    
    // زاوية دوران عشوائية (أي زاوية من 0 إلى 360)
    const rotation = Math.random() * 360;
    
    // شفافية متناسبة مع الحجم
    let opacity;
    if (size < 30) {
      opacity = 0.35 + Math.random() * 0.25; // 0.35-0.60 للصغيرة جداً
    } else if (size < 50) {
      opacity = 0.30 + Math.random() * 0.25; // 0.30-0.55 للصغيرة والمتوسطة
    } else {
      opacity = 0.25 + Math.random() * 0.25; // 0.25-0.50 للكبيرة (أخف)
    }
    
    return `
      <g transform="translate(${point.x}, ${point.y})">
        <g transform="rotate(${rotation}, 0, 0)">
          <svg x="${-size/2}" y="${-size/2}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}">
            <path d="${iconPath}"/>
          </svg>
        </g>
      </g>
    `;
  }

  // إنشاء الشبكة الكاملة بتوزيع Poisson
  generateGridPattern() {
    if (!this.container) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    console.log('🎲 بدء توليد نقاط Poisson Disk...');
    const startTime = Date.now();
    
    // توليد النقاط العشوائية
    const points = this.generatePoissonDiskPoints(width, height, this.minDistance, this.maxAttempts);
    
    const endTime = Date.now();
    console.log(`✨ تم توليد ${points.length} نقطة في ${endTime - startTime}ms`);
    
    // إنشاء رموز SVG لكل نقطة
    let icons = '';
    for (const point of points) {
      icons += this.createRandomIcon(point);
    }
    
    // إنشاء SVG الكامل
    const svgContent = `
      <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <style>
            .pattern-icon { color: #1a1a1a; }
          </style>
        </defs>
        <g class="pattern-icon">
          ${icons}
        </g>
      </svg>
    `;
    
    this.container.innerHTML = svgContent;
    console.log('🎨 تم إنشاء باترن Poisson بنجاح');
  }

  // تحميل خلفية جديدة
  loadNewPattern() {
    this.generateGridPattern();
  }

  // خلفية احتياطية
  showFallbackPattern() {
    this.generateGridPattern();
  }

  // تحديث الخلفية دورياً
  startAutoRefresh(intervalMinutes = 5) {
    setInterval(() => {
      this.loadNewPattern();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`🔄 تم تفعيل التحديث التلقائي كل ${intervalMinutes} دقائق`);
  }

  // تحديث فوري للخلفية
  refresh() {
    this.loadNewPattern();
  }
  
  // تحديث عند تغيير حجم النافذة
  handleResize() {
    this.generateGridPattern();
  }
}

// إنشاء مثيل للخلفية
const patternBg = new PatternBackground();

// 🧪 دالة اختبار للخلفية (مبكراً في الكود)
window.testPattern = async () => {
  console.log('🧪 اختبار الخلفية...');
  const container = document.getElementById('patternBackground');
  console.log('📦 العنصر:', container);
  
  if (!container) {
    console.error('❌ عنصر الخلفية غير موجود!');
    console.log('🔍 جميع العناصر مع id:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
    return;
  }
  
  try {
    console.log('🌐 جاري طلب /pattern...');
    const response = await fetch('/pattern?' + Date.now());
    console.log('📡 الاستجابة:', response.status, response.statusText);
    
    if (response.ok) {
      const svg = await response.text();
      console.log('📄 SVG طوله:', svg.length);
      console.log('📄 أول 200 حرف:', svg.substring(0, 200));
      container.innerHTML = svg;
      console.log('✅ تم تحديث الخلفية');
      
      // تحقق من النتيجة
      console.log('🔍 محتوى العنصر بعد التحديث:', container.innerHTML.length, 'حرف');
      
      // فحص الـ CSS
      const style = window.getComputedStyle(container);
      console.log('🎨 CSS للعنصر:');
      console.log('- الموضع:', style.position);
      console.log('- Z-index:', style.zIndex);
      console.log('- العتامة:', style.opacity);
      console.log('- العرض:', style.width);
      console.log('- الارتفاع:', style.height);
      console.log('- اللون:', style.color);
      
      // فحص SVG بداخله
      const svgElement = container.querySelector('svg');
      if (svgElement) {
        console.log('🖼️ عنصر SVG موجود:', svgElement);
        console.log('🖼️ أبعاد SVG:', svgElement.getAttribute('width'), 'x', svgElement.getAttribute('height'));
      } else {
        console.warn('⚠️ لا يوجد عنصر SVG داخل الحاوية!');
      }
    } else {
      console.error('❌ فشل الطلب:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
};

console.log('✅ دالة testPattern جاهزة');

// تحميل العملة الحالية من النظام
async function loadCurrentCurrency() {
  try {
    const response = await fetch('http://localhost:3001/api/system-settings/currency');
    const data = await response.json();
    
    if (data.success && data.currency) {
      currentCurrency = data.currency;
      console.log(`💱 تم تحميل العملة: ${currentCurrency.name} (${currentCurrency.symbol})`);
      
      // تحديث placeholders في النموذج
      updateCurrencyPlaceholders();
    }
  } catch (error) {
    console.error('خطأ في تحميل العملة:', error);
    // استخدام العملة الافتراضية
  }
}

// تحديث placeholders العملة في النماذج
function updateCurrencyPlaceholders() {
  const priceInputs = document.querySelectorAll('input[placeholder*="السعر"]');
  priceInputs.forEach(input => {
    input.placeholder = `السعر (${currentCurrency.symbol})`;
  });
}

// تنسيق السعر حسب العملة الحالية
function formatPrice(price) {
  if (!price || price === 0) {
    return 'غير محدد';
  }
  
  const formattedPrice = Number(price).toLocaleString('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  return `${formattedPrice} ${currentCurrency.symbol}`;
}

// تفعيل القوائم المنسدلة متعددة الاختيار لقسم تسجيل مادة
function setupCustomMultiselect(id, filterCallback) {
  const multiselect = document.getElementById(id);
  if (!multiselect) return;
  const selectBox = multiselect.querySelector('.select-box');
  const optionsList = multiselect.querySelector('.options-list');
  selectBox.addEventListener('click', function(e) {
    optionsList.style.display = optionsList.style.display === 'block' ? 'none' : 'block';
    multiselect.classList.toggle('open');
    e.stopPropagation();
  });
  document.addEventListener('click', function(e) {
    if (!multiselect.contains(e.target)) {
      optionsList.style.display = 'none';
      multiselect.classList.remove('open');
    }
  });
  // تحديث مربع العرض بالقيم المختارة
  optionsList.addEventListener('change', function() {
    const checked = Array.from(optionsList.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.parentNode.textContent.trim());
    selectBox.textContent = checked.length ? checked.join('، ') : selectBox.getAttribute('data-placeholder') || selectBox.textContent;
    if (filterCallback) filterCallback(checked);
  });
  // حفظ النص الافتراضي
  selectBox.setAttribute('data-placeholder', selectBox.textContent);
}

// فلترة الصفوف حسب المستوى المختار في نموذج المادة
function filterSubjectClassesByLevels(selectedLevels) {
  const classMultiselect = document.getElementById('customClasses');
  if (!classMultiselect) return;
  const optionsList = classMultiselect.querySelector('.options-list');
  // جميع الصفوف
  const allOptions = [
    { value: 'الأول', label: 'الأول' },
    { value: 'الثانى', label: 'الثانوى' },
    { value: 'الثالث', label: 'الثالث' },
    { value: 'الرابع', label: 'الرابع' },
    { value: 'الخامس', label: 'الخامس' },
    { value: 'السادس', label: 'السادس' }
  ];
  let allowed = [];
  if (selectedLevels.includes('ابتدائى')) {
    allowed = ['الأول', 'الثانى', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
  }
  if (selectedLevels.includes('اعدادى') || selectedLevels.includes('ثانوى')) {
    // لو فيه ابتدائى مع اعدادى أو ثانوى، نجمع كل الصفوف
    if (allowed.length === 0) {
      allowed = ['الأول', 'الثانى', 'الثالث'];
    } else {
      allowed = Array.from(new Set([...allowed, 'الأول', 'الثانى', 'الثالث']));
    }
  }
  // إعادة بناء خيارات الصفوف
  optionsList.innerHTML = '';
  allOptions.forEach(opt => {
    if (allowed.includes(opt.value)) {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" value="${opt.value}"> ${opt.label}`;
      optionsList.appendChild(label);
    }
  });
}

setupCustomMultiselect('customLevels', filterSubjectClassesByLevels);
setupCustomMultiselect('customClasses');
setupCustomMultiselect('groupLevel');
setupCustomMultiselect('groupClass');
// تفعيل القوائم المنسدلة متعددة الاختيار لقسم إضافة أستاذ
function setupTeacherMultiselect(id, filterCallback) {
  const multiselect = document.getElementById(id);
  if (!multiselect) return;
  const selectBox = multiselect.querySelector('.select-box');
  const optionsList = multiselect.querySelector('.options-list');
  selectBox.addEventListener('click', function(e) {
    optionsList.style.display = optionsList.style.display === 'block' ? 'none' : 'block';
    multiselect.classList.toggle('open');
    e.stopPropagation();
  });
  document.addEventListener('click', function(e) {
    if (!multiselect.contains(e.target)) {
      optionsList.style.display = 'none';
      multiselect.classList.remove('open');
    }
  });
  optionsList.addEventListener('change', function() {
    const checked = Array.from(optionsList.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.parentNode.textContent.trim());
    selectBox.textContent = checked.length ? checked.join('، ') : selectBox.getAttribute('data-placeholder') || selectBox.textContent;
    if (filterCallback) filterCallback(checked);
  });
  selectBox.setAttribute('data-placeholder', selectBox.textContent);
}

function filterTeacherClassesByLevels(selectedLevels) {
  const classMultiselect = document.getElementById('teacherClasses');
  if (!classMultiselect) return;
  const optionsList = classMultiselect.querySelector('.options-list');
  const allOptions = [
    { value: 'الأول', label: 'الأول' },
    { value: 'الثانى', label: 'الثانوى' },
    { value: 'الثالث', label: 'الثالث' },
    { value: 'الرابع', label: 'الرابع' },
    { value: 'الخامس', label: 'الخامس' },
    { value: 'السادس', label: 'السادس' }
  ];
  let allowed = [];
  if (selectedLevels.includes('ابتدائى')) {
    allowed = ['الأول', 'الثانى', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
  }
  if (selectedLevels.includes('اعدادى') || selectedLevels.includes('ثانوى')) {
    if (allowed.length === 0) {
      allowed = ['الأول', 'الثانى', 'الثالث'];
    } else {
      allowed = Array.from(new Set([...allowed, 'الأول', 'الثانى', 'الثالث']));
    }
  }
  optionsList.innerHTML = '';
  allOptions.forEach(opt => {
    if (allowed.includes(opt.value)) {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" value="${opt.value}"> ${opt.label}`;
      optionsList.appendChild(label);
    }
  });
  filterTeacherSubjects();
}

async function filterTeacherSubjects() {
  const selectedLevels = Array.from(document.querySelectorAll('#teacherLevels .options-list input[type="checkbox"]:checked')).map(cb => cb.value);
  const selectedClasses = Array.from(document.querySelectorAll('#teacherClasses .options-list input[type="checkbox"]:checked')).map(cb => cb.value);
  const select = document.getElementById('teacherSubject');
  if (!select) return;
  const res = await fetch('/api/subjects');
  const subjects = await res.json();
  select.innerHTML = '<option value="">اختر المادة</option>';
  subjects.forEach(sub => {
    const hasLevel = selectedLevels.length === 0 || sub.levels.some(lvl => selectedLevels.includes(lvl));
    const hasClass = selectedClasses.length === 0 || sub.classes.some(cls => selectedClasses.includes(cls));
    if (hasLevel && hasClass) {
      const option = document.createElement('option');
      option.value = sub.name;
      option.textContent = sub.name;
      select.appendChild(option);
    }
  });
}

setupTeacherMultiselect('teacherLevels', filterTeacherClassesByLevels);
setupTeacherMultiselect('teacherClasses', filterTeacherSubjects);

// استقبال وتسجيل الطلاب
// تحميل المواد لقائمة الاشتراكات
async function loadSubjectsForSubscription() {
  const res = await fetch('/api/subjects');
  const subjects = await res.json();
  const select = document.getElementById('subscriptionSubject');
  select.innerHTML = '<option value="">اختر المادة</option>';
  subjects.forEach(sub => {
    const option = document.createElement('option');
    option.value = sub.subjectId || sub._id || sub.name;
    option.textContent = sub.name;
    select.appendChild(option);
  });
}

// تحميل الأساتذة لقائمة الاشتراكات
async function loadTeachersForSubscription() {
  const res = await fetch('/api/teachers');
  const teachers = await res.json();
  const select = document.getElementById('subscriptionTeacher');
  select.innerHTML = '<option value="">اختر الأستاذ</option>';
  teachers.forEach(teacher => {
    const option = document.createElement('option');
    option.value = teacher.teacherId || teacher._id || (teacher.firstName + ' ' + teacher.lastName);
    option.textContent = teacher.firstName + ' ' + teacher.lastName;
    select.appendChild(option);
  });
}

// تحميل المجموعات لقائمة الاشتراكات
async function loadGroupsForSubscription() {
  const res = await fetch('/api/groups');
  const groups = await res.json();
  const select = document.getElementById('subscriptionGroup');
  select.innerHTML = '<option value="">اختر المجموعة</option>';
  groups.forEach(group => {
    const option = document.createElement('option');
    option.value = group.groupId || group._id || group.subject + '-' + group.teacher;
    // عرض اسم المجموعة الجديد (أيام - وقت)
    option.textContent = group.name || `${group.subject} - ${group.teacher}`;
    select.appendChild(option);
  });
}

// عند تحميل الصفحة، تحميل القوائم
window.addEventListener('DOMContentLoaded', () => {
  loadSubjectsForSubscription();
  loadTeachersForSubscription();
  loadGroupsForSubscription();
  // تفريغ جدول المدفوعات
  const paymentsTbody = document.querySelector('#paymentsTable tbody');
  if (paymentsTbody) paymentsTbody.innerHTML = '';
});
// دوال البحث عن الطالب في نموذج الاشتراكات
document.getElementById('searchStudentBtn').addEventListener('click', async function() {
  const id = document.getElementById('searchStudentId').value.trim();
  const name = document.getElementById('searchStudentName').value.trim();
  const res = await fetch('/api/students');
  const students = await res.json();
  let student = null;
  if (id) {
    student = students.find(s => s.studentId === id);
    if (student) {
      document.getElementById('searchStudentName').value = student.firstName + ' ' + (student.middleName ? student.middleName + ' ' : '') + student.lastName;
      return;
    } else {
      alert('لا يوجد طالب بهذا الكود');
      document.getElementById('searchStudentName').value = '';
      return;
    }
  }
  if (name) {
    student = students.find(s => (s.firstName + ' ' + (s.middleName ? s.middleName + ' ' : '') + s.lastName).trim() === name);
    if (student) {
      document.getElementById('searchStudentId').value = student.studentId;
      return;
    } else {
      alert('لا يوجد طالب بهذا الاسم');
      document.getElementById('searchStudentId').value = '';
      return;
    }
  }
  alert('يرجى إدخال رقم الكود أو الاسم للبحث');
});
// دالة إضافة اشتراك طالب
async function addSubscription(e) {
  e.preventDefault();
  const studentId = document.getElementById('searchStudentId').value.trim();
  const subjectId = document.getElementById('subscriptionSubject').value;
  const teacherId = document.getElementById('subscriptionTeacher').value;
  const groupId = document.getElementById('subscriptionGroup').value;
  if (!studentId || !subjectId || !teacherId || !groupId) {
    alert('يرجى اختيار جميع البيانات المطلوبة');
    return;
  }
  const res = await fetch('/api/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, subjectId, teacherId, groupId })
  });
  
  try {
    const data = await res.json();
    console.log('استجابة الخادم:', data); // لتسجيل الاستجابة
    
    if (res.ok && (data.subscriptionId || (data.subscription && data.subscription.subscriptionId))) {
      alert(data.message || 'تم الاشتراك بنجاح');
      loadSubscriptions();
    } else {
      console.error('خطأ في الاستجابة:', data);
      alert('حدث خطأ أثناء التسجيل: ' + (data.error || 'خطأ غير معروف'));
    }
  } catch (error) {
    console.error('خطأ في تحليل الاستجابة:', error);
    alert('حدث خطأ في الاتصال بالخادم');
  }
  document.getElementById('studentSubscriptionForm').reset();
}

document.getElementById('studentSubscriptionForm').addEventListener('submit', addSubscription);
// دالة إضافة طالب جديد
async function addStudent(e) {
  e.preventDefault();
  const firstName = document.getElementById('studentFirstName').value.trim();
  const middleName = document.getElementById('studentMiddleName').value.trim();
  const lastName = document.getElementById('studentLastName').value.trim();
  const level = document.getElementById('studentLevelSelect').value;
  const grade = document.getElementById('studentClassSelect').value;
  const phones = [document.getElementById('studentPhone').value.trim()]
    .concat(Array.from(document.querySelectorAll('.student-phone-extra')).map(i => i.value.trim()).filter(Boolean));
  const guardianPhones = [document.getElementById('guardianPhone').value.trim()]
    .concat(Array.from(document.querySelectorAll('.guardian-phone-extra')).map(i => i.value.trim()).filter(Boolean));
  if (!firstName || !lastName || !level || !grade || phones.length === 0 || guardianPhones.length === 0) {
    alert('يرجى إدخال جميع البيانات المطلوبة');
    return;
  }
  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, middleName, lastName, level, grade, phones, guardianPhones })
  });
  const data = await res.json();
  if (res.ok && data.studentId) {
    alert('تم تسجيل الطالب وكوده هو: ' + data.studentId);
    loadStudents();
  } else {
    alert('حدث خطأ أثناء التسجيل');
  }
  document.getElementById('studentRegistrationForm').reset();
  document.getElementById('studentPhonesContainer').innerHTML = '';
  document.getElementById('guardianPhonesContainer').innerHTML = '';
}

document.getElementById('studentRegistrationForm').addEventListener('submit', addStudent);

// متغيرات التعديل للطلاب والاشتراكات
let editingStudentId = null;
let editingSubscriptionId = null;

// دالة تحميل الطلاب
async function loadStudents() {
  const res = await fetch('/api/students');
  const students = await res.json();
  const tbody = document.querySelector('#studentsTable tbody');
  tbody.innerHTML = '';
  students.forEach(student => {
    const isEditing = editingStudentId === student._id;
    const tr = document.createElement('tr');
    if (isEditing) {
      tr.innerHTML = `
        <td>${student.studentId}</td>
        <td>
          <input type="text" value="${student.firstName}" id="edit-studentFirstName" style="width:90px;" placeholder="الأول">
          <input type="text" value="${student.middleName || ''}" id="edit-studentMiddleName" style="width:90px;" placeholder="الأوسط">
          <input type="text" value="${student.lastName}" id="edit-studentLastName" style="width:90px;" placeholder="الأخير">
        </td>
        <td>
          <select id="edit-studentLevel" style="width:100px;">
            <option value="ابتدائى" ${student.level === 'ابتدائى' ? 'selected' : ''}>ابتدائى</option>
            <option value="اعدادى" ${student.level === 'اعدادى' ? 'selected' : ''}>اعدادى</option>
            <option value="ثانوى" ${student.level === 'ثانوى' ? 'selected' : ''}>ثانوى</option>
          </select>
        </td>
        <td>
          <select id="edit-studentGrade" style="width:100px;"></select>
        </td>
        <td>
          <textarea id="edit-studentPhones" style="width:120px;height:40px;" placeholder="رقم واحد في كل سطر">${(student.phones || []).join('\n')}</textarea>
        </td>
        <td>
          <textarea id="edit-guardianPhones" style="width:120px;height:40px;" placeholder="رقم واحد في كل سطر">${(student.guardianPhones || []).join('\n')}</textarea>
        </td>
        <td>
          <button onclick="saveEditStudent('${student._id}')">حفظ</button>
          <button onclick="cancelEditStudent()">إلغاء</button>
        </td>
      `;
      setTimeout(() => {
        loadGradesForEditStudent(student.level, student.grade);
      }, 0);
    } else {
      tr.innerHTML = `
        <td>${student.studentId}</td>
        <td>${student.firstName} ${student.middleName || ''} ${student.lastName}</td>
        <td>${student.level}</td>
        <td>${student.grade}</td>
        <td>${(student.phones || []).join('، ')}</td>
        <td>${(student.guardianPhones || []).join('، ')}</td>
        <td>
          <button onclick="editStudent('${student._id}')">تعديل</button>
          <button onclick="deleteStudent('${student._id}')">حذف</button>
        </td>
      `;
    }
    tbody.appendChild(tr);
  });
}

function editStudent(id) {
  editingStudentId = id;
  loadStudents();
}

function cancelEditStudent() {
  editingStudentId = null;
  loadStudents();
}

async function saveEditStudent(id) {
  const firstName = document.getElementById('edit-studentFirstName').value.trim();
  const middleName = document.getElementById('edit-studentMiddleName').value.trim();
  const lastName = document.getElementById('edit-studentLastName').value.trim();
  const level = document.getElementById('edit-studentLevel').value;
  const grade = document.getElementById('edit-studentGrade').value;
  const phonesText = document.getElementById('edit-studentPhones').value.trim();
  const guardianPhonesText = document.getElementById('edit-guardianPhones').value.trim();
  
  const phones = phonesText.split('\n').map(p => p.trim()).filter(Boolean);
  const guardianPhones = guardianPhonesText.split('\n').map(p => p.trim()).filter(Boolean);
  
  if (!firstName || !lastName) {
    alert('الرجاء إدخال الاسم الأول والأخير');
    return;
  }
  if (!level || !grade) {
    alert('الرجاء اختيار المستوى والصف');
    return;
  }
  if (phones.length === 0) {
    alert('الرجاء إدخال رقم هاتف واحد على الأقل');
    return;
  }
  if (guardianPhones.length === 0) {
    alert('الرجاء إدخال رقم ولي أمر واحد على الأقل');
    return;
  }
  
  try {
    const response = await fetch('/api/students/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, middleName, lastName, level, grade, phones, guardianPhones })
    });
    
    if (!response.ok) {
      throw new Error('فشل تحديث بيانات الطالب');
    }
    
    const result = await response.json();
    alert('تم تحديث بيانات الطالب بنجاح');
    editingStudentId = null;
    await loadStudents();
  } catch (error) {
    console.error('Error updating student:', error);
    alert('حدث خطأ أثناء تحديث بيانات الطالب');
  }
}

async function deleteStudent(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
  await fetch('/api/students/' + id, { method: 'DELETE' });
  loadStudents();
}

function loadGradesForEditStudent(level, selectedGrade) {
  const select = document.getElementById('edit-studentGrade');
  if (!select) return;
  
  select.innerHTML = '<option value="">اختر الصف</option>';
  let grades = [];
  
  if (level === 'ابتدائى') {
    grades = ['الأول', 'الثانى', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
  } else if (level === 'اعدادى' || level === 'ثانوى') {
    grades = ['الأول', 'الثانى', 'الثالث'];
  }
  
  grades.forEach(g => {
    const option = document.createElement('option');
    option.value = g;
    option.textContent = g;
    if (g === selectedGrade) option.selected = true;
    select.appendChild(option);
  });
  
  // تحديث القائمة عند تغيير المستوى
  const levelSelect = document.getElementById('edit-studentLevel');
  if (levelSelect) {
    levelSelect.addEventListener('change', function() {
      loadGradesForEditStudent(this.value, '');
    });
  }
}

// نظام فلترة الصفوف للطلاب (مثل المجموعات)
const studentLevelSelect = document.getElementById('studentLevelSelect');
const studentClassSelect = document.getElementById('studentClassSelect');

function filterStudentClassesByLevel() {
  const level = studentLevelSelect.value;
  studentClassSelect.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'اختر الصف';
  studentClassSelect.appendChild(defaultOption);
  
  let allowed = [];
  if (level === 'ابتدائى') {
    allowed = ['الأول', 'الثانى', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
  } else if (level === 'اعدادى' || level === 'ثانوى') {
    allowed = ['الأول', 'الثانى', 'الثالث'];
  }
  
  allowed.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls;
    option.textContent = cls;
    studentClassSelect.appendChild(option);
  });
}

if (studentLevelSelect) {
  studentLevelSelect.addEventListener('change', filterStudentClassesByLevel);
}

// إضافة رقم هاتف إضافي للطالب
const addStudentPhoneBtn = document.getElementById('addStudentPhone');
const studentPhonesContainer = document.getElementById('studentPhonesContainer');
addStudentPhoneBtn.addEventListener('click', function() {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'رقم هاتف إضافي';
  input.style.width = '140px';
  input.className = 'student-phone-extra';
  studentPhonesContainer.appendChild(input);
});

// إضافة رقم هاتف إضافي لولي الأمر
const addGuardianPhoneBtn = document.getElementById('addGuardianPhone');
const guardianPhonesContainer = document.getElementById('guardianPhonesContainer');
addGuardianPhoneBtn.addEventListener('click', function() {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'رقم ولي أمر إضافي';
  input.style.width = '140px';
  input.className = 'guardian-phone-extra';
  guardianPhonesContainer.appendChild(input);
});

// دالة تحميل الاشتراكات
async function loadSubscriptions() {
  const res = await fetch('/api/subscriptions');
  const subscriptions = await res.json();
  const tbody = document.querySelector('#subscriptionsTable tbody');
  tbody.innerHTML = '';
  subscriptions.forEach(sub => {
    const isEditing = editingSubscriptionId === sub._id;
    const tr = document.createElement('tr');
    if (isEditing) {
      tr.innerHTML = `
        <td>${sub.studentId}</td>
        <td>
          <input type="text" id="edit-subscriptionStudentName" value="${sub.studentName || ''}" style="width:150px;" placeholder="اسم الطالب" readonly>
        </td>
        <td>
          <select id="edit-subscriptionSubject" style="width:120px;"></select>
        </td>
        <td>
          <select id="edit-subscriptionTeacher" style="width:120px;"></select>
        </td>
        <td>
          <select id="edit-subscriptionGroup" style="width:120px;"></select>
        </td>
        <td>
          <button onclick="saveEditSubscription('${sub._id}')">حفظ</button>
          <button onclick="cancelEditSubscription()">إلغاء</button>
        </td>
      `;
      setTimeout(() => {
        loadSubjectsForEditSubscription(sub.subjectId);
        loadTeachersForEditSubscription(sub.teacherId);
        loadGroupsForEditSubscription(sub.groupId);
      }, 0);
    } else {
      tr.innerHTML = `
        <td>${sub.studentId}</td>
        <td>${sub.studentName || 'غير معروف'}</td>
        <td>${sub.subjectName || 'غير محدد'}</td>
        <td>${sub.teacherName || 'غير محدد'}</td>
        <td>${sub.groupName || 'غير محدد'}</td>
        <td>
          <button onclick="editSubscription('${sub._id}')">تعديل</button>
          <button onclick="deleteSubscription('${sub._id}')">حذف</button>
        </td>
      `;
    }
    tbody.appendChild(tr);
  });
}

function editSubscription(id) {
  editingSubscriptionId = id;
  loadSubscriptions();
}

function cancelEditSubscription() {
  editingSubscriptionId = null;
  loadSubscriptions();
}

async function saveEditSubscription(id) {
  const subjectId = document.getElementById('edit-subscriptionSubject').value;
  const teacherId = document.getElementById('edit-subscriptionTeacher').value;
  const groupId = document.getElementById('edit-subscriptionGroup').value;
  
  if (!subjectId) {
    alert('الرجاء اختيار المادة');
    return;
  }
  if (!teacherId) {
    alert('الرجاء اختيار الأستاذ');
    return;
  }
  
  try {
    const response = await fetch('/api/subscriptions/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId, teacherId, groupId })
    });
    
    if (!response.ok) {
      throw new Error('فشل تحديث الاشتراك');
    }
    
    alert('تم تحديث الاشتراك بنجاح');
    editingSubscriptionId = null;
    await loadSubscriptions();
  } catch (error) {
    console.error('Error updating subscription:', error);
    alert('حدث خطأ أثناء تحديث الاشتراك');
  }
}

async function deleteSubscription(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) return;
  
  try {
    const response = await fetch('/api/subscriptions/' + id, { method: 'DELETE' });
    
    if (!response.ok) {
      throw new Error('فشل حذف الاشتراك');
    }
    
    alert('تم حذف الاشتراك بنجاح');
    await loadSubscriptions();
  } catch (error) {
    console.error('Error deleting subscription:', error);
    alert('حدث خطأ أثناء حذف الاشتراك');
  }
}

async function loadSubjectsForEditSubscription(selectedSubjectId) {
  const res = await fetch('/api/subjects');
  const subjects = await res.json();
  const select = document.getElementById('edit-subscriptionSubject');
  if (!select) return;
  
  select.innerHTML = '<option value="">اختر المادة</option>';
  subjects.forEach(sub => {
    const option = document.createElement('option');
    option.value = sub._id;
    option.textContent = sub.name;
    if (sub._id === selectedSubjectId) option.selected = true;
    select.appendChild(option);
  });
}

async function loadTeachersForEditSubscription(selectedTeacherId) {
  const res = await fetch('/api/teachers');
  const teachers = await res.json();
  const select = document.getElementById('edit-subscriptionTeacher');
  if (!select) return;
  
  select.innerHTML = '<option value="">اختر الأستاذ</option>';
  teachers.forEach(teacher => {
    const option = document.createElement('option');
    option.value = teacher._id;
    option.textContent = `${teacher.firstName} ${teacher.lastName}`;
    if (teacher._id === selectedTeacherId) option.selected = true;
    select.appendChild(option);
  });
}

async function loadGroupsForEditSubscription(selectedGroupId) {
  const res = await fetch('/api/groups');
  const groups = await res.json();
  const select = document.getElementById('edit-subscriptionGroup');
  if (!select) return;
  
  select.innerHTML = '<option value="">اختر المجموعة</option>';
  groups.forEach(group => {
    const option = document.createElement('option');
    option.value = group._id;
    // عرض اسم المجموعة الجديد (أيام - وقت)
    option.textContent = group.name || `${group.subject} - ${group.teacher}`;
    if (group._id === selectedGroupId) option.selected = true;
    select.appendChild(option);
  });
}

// إضافة مادة جديدة وربط القيم المختارة بالداتا بيز
async function addSubject(e) {
  e.preventDefault();
  const name = document.getElementById('subjectName').value.trim();
  const levels = Array.from(document.querySelectorAll('#customLevels .options-list input[type="checkbox"]:checked')).map(cb => cb.value);
  const classes = Array.from(document.querySelectorAll('#customClasses .options-list input[type="checkbox"]:checked')).map(cb => cb.value);
  if (!name || levels.length === 0 || classes.length === 0) {
    alert('يرجى إدخال اسم المادة واختيار مستوى وصف واحد على الأقل');
    return;
  }
  await fetch('/api/subjects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, levels, classes })
  });
  loadSubjects();
  document.getElementById('addSubjectForm').reset();
  document.querySelectorAll('#customLevels .options-list input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('#customClasses .options-list input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelector('#customLevels .select-box').textContent = 'اختر المستوى';
  document.querySelector('#customClasses .select-box').textContent = 'اختر الصف';
}

document.getElementById('addSubjectForm').addEventListener('submit', addSubject);

// حذف مادة
async function deleteSubject(id) {
  if (confirm('هل أنت متأكد من حذف المادة؟')) {
    await fetch('/api/subjects/' + id, { method: 'DELETE' });
    loadSubjects();
  }
}

// نظام التعديل داخل الجدول فقط
let editingSubjectId = null;

async function loadSubjects() {
  const res = await fetch('/api/subjects');
  const subjects = await res.json();
  const tbody = document.querySelector('#subjectsTable tbody');
  tbody.innerHTML = '';
  subjects.forEach(sub => {
    const isEditing = editingSubjectId === sub._id;
    const tr = document.createElement('tr');
    if (isEditing) {
      tr.innerHTML = `
        <td><input type="text" value="${sub.name}" id="edit-subjectName"></td>
        <td>
          <div class="custom-multiselect" id="edit-customLevels">
            <div class="select-box">${sub.levels.join('، ') || 'اختر المستوى'}</div>
            <div class="options-list">
              <label><input type="checkbox" value="ابتدائى"> ابتدائى</label>
              <label><input type="checkbox" value="اعدادى"> اعدادى</label>
              <label><input type="checkbox" value="ثانوى"> ثانوى</label>
            </div>
          </div>
        </td>
        <td>
          <div class="custom-multiselect" id="edit-customClasses">
            <div class="select-box">${sub.classes.join('، ') || 'اختر الصف'}</div>
            <div class="options-list">
              <label><input type="checkbox" value="الأول"> الأول</label>
              <label><input type="checkbox" value="الثانى"> الثانوى</label>
              <label><input type="checkbox" value="الثالث"> الثالث</label>
              <label><input type="checkbox" value="الرابع"> الرابع</label>
              <label><input type="checkbox" value="الخامس"> الخامس</label>
              <label><input type="checkbox" value="السادس"> السادس</label>
            </div>
          </div>
        </td>
        <td>
          <button onclick="saveEditSubject('${sub._id}')">حفظ</button>
          <button onclick="cancelEditSubject()">إلغاء</button>
        </td>
      `;
      setTimeout(() => {
        setupEditMultiselect('edit-customLevels', sub.levels);
        setupEditMultiselect('edit-customClasses', sub.classes);
      }, 0);
    } else {
      tr.innerHTML = `
        <td>${sub.name}</td>
        <td>${sub.levels.join('، ')}</td>
        <td>${sub.classes.join('، ')}</td>
        <td>
          <button onclick="editSubject('${sub._id}')">تعديل</button>
          <button onclick="deleteSubject('${sub._id}')">حذف</button>
        </td>
      `;
    }
    tbody.appendChild(tr);
  });
}

function editSubject(id) {
  editingSubjectId = id;
  loadSubjects();
}
function cancelEditSubject() {
  editingSubjectId = null;
  loadSubjects();
}
async function saveEditSubject(id) {
  const name = document.getElementById('edit-subjectName').value.trim();
  const levels = Array.from(document.querySelectorAll('#edit-customLevels .options-list input[type="checkbox"]:checked')).map(cb => cb.value);
  const classes = Array.from(document.querySelectorAll('#edit-customClasses .options-list input[type="checkbox"]:checked')).map(cb => cb.value);
  await fetch('/api/subjects/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, levels, classes })
  });
  editingSubjectId = null;
  loadSubjects();
}
// تفعيل القوائم المتعددة للصف التعديل
function setupEditMultiselect(id, selected) {
  const multiselect = document.getElementById(id);
  if (!multiselect) return;
  const selectBox = multiselect.querySelector('.select-box');
  const optionsList = multiselect.querySelector('.options-list');
  Array.from(optionsList.querySelectorAll('input[type="checkbox"]')).forEach(cb => {
    cb.checked = selected.includes(cb.value);
  });
  selectBox.addEventListener('click', function(e) {
    optionsList.style.display = optionsList.style.display === 'block' ? 'none' : 'block';
    multiselect.classList.toggle('open');
    e.stopPropagation();
  });
  document.addEventListener('click', function(e) {
    if (!multiselect.contains(e.target)) {
      optionsList.style.display = 'none';
      multiselect.classList.remove('open');
    }
  });
  optionsList.addEventListener('change', function() {
    const checked = Array.from(optionsList.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.parentNode.textContent.trim());
    selectBox.textContent = checked.length ? checked.join('، ') : selectBox.getAttribute('data-placeholder') || selectBox.textContent;
  });
  selectBox.setAttribute('data-placeholder', selectBox.textContent);
}

// تحميل المواد وعرضها في قائمة اختيار المادة بقسم إضافة أستاذ
async function loadSubjectsForTeacher() {
  const res = await fetch('/api/subjects');
  const subjects = await res.json();
  const select = document.getElementById('teacherSubject');
  select.innerHTML = '<option value="">اختر المادة</option>';
  subjects.forEach(sub => {
    const option = document.createElement('option');
    option.value = sub.name;
    option.textContent = sub.name;
    select.appendChild(option);
  });
}

// إضافة مدرس جديد وربط القيم المختارة بالداتا بيز
async function addTeacher(e) {
  e.preventDefault();
  const firstName = document.getElementById('teacherFirstName').value.trim();
  const lastName = document.getElementById('teacherLastName').value.trim();
  const subject = document.getElementById('teacherSubject').value;
  const levels = Array.from(document.querySelectorAll('#teacherLevels .options-list input[type="checkbox"]:checked')).map(cb => cb.value);
  const classes = Array.from(document.querySelectorAll('#teacherClasses .options-list input[type="checkbox"]:checked')).map(cb => cb.value);
  const notes = document.getElementById('teacherNotes').value.trim();
  if (!firstName || !lastName || !subject || levels.length === 0 || classes.length === 0) {
    alert('يرجى إدخال جميع البيانات المطلوبة');
    return;
  }
  await fetch('/api/teachers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, subject, levels, classes, notes })
  });
  loadTeachers();
  document.getElementById('addTeacherForm').reset();
  document.querySelectorAll('#teacherLevels .options-list input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('#teacherClasses .options-list input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelector('#teacherLevels .select-box').textContent = 'اختر المستوى';
  document.querySelector('#teacherClasses .select-box').textContent = 'اختر الصف';
}
document.getElementById('addTeacherForm').addEventListener('submit', addTeacher);

// عرض المدرسين في الجدول
async function loadTeachers() {
  const res = await fetch('/api/teachers');
  const teachers = await res.json();
  const tbody = document.querySelector('#teachersTable tbody');
  tbody.innerHTML = '';
  teachers.forEach(teacher => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${teacher.firstName} ${teacher.lastName}</td>
      <td>${teacher.subject}</td>
      <td>${teacher.levels.join('، ')}</td>
      <td>${teacher.classes.join('، ')}</td>
      <td>${teacher.notes || ''}</td>
      <td>
        <button class="edit-btn">تعديل</button>
        <button class="delete-btn">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// حذف مدرس
async function deleteTeacher(id) {
  if (confirm('هل أنت متأكد من حذف المدرس؟')) {
    await fetch('/api/teachers/' + id, { method: 'DELETE' });
    loadTeachers();
  }
}

// نظام التعديل داخل الجدول
let editingTeacherId = null;

async function loadTeachers() {
  const res = await fetch('/api/teachers');
  const teachers = await res.json();
  const tbody = document.querySelector('#teachersTable tbody');
  tbody.innerHTML = '';
  teachers.forEach((teacher, idx) => {
    const isEditing = editingTeacherId === teacher._id;
    const tr = document.createElement('tr');
    if (isEditing) {
      tr.innerHTML = `
        <td>
          <input type="text" value="${teacher.firstName}" id="edit-teacherFirstName" style="width:100px;" placeholder="الاسم الأول">
          <input type="text" value="${teacher.lastName}" id="edit-teacherLastName" style="width:100px;" placeholder="الاسم الأخير">
        </td>
        <td>
          <select id="edit-teacherSubject" style="width:120px;"></select>
        </td>
        <td>
          <div class="custom-multiselect" id="edit-teacherLevels">
            <div class="select-box">${teacher.levels.join('، ') || 'اختر المستوى'}</div>
            <div class="options-list">
              <label><input type="checkbox" value="ابتدائى"> ابتدائى</label>
              <label><input type="checkbox" value="اعدادى"> اعدادى</label>
              <label><input type="checkbox" value="ثانوى"> ثانوى</label>
            </div>
          </div>
        </td>
        <td>
          <div class="custom-multiselect" id="edit-teacherClasses">
            <div class="select-box">${teacher.classes.join('، ') || 'اختر الصف'}</div>
            <div class="options-list">
              <label><input type="checkbox" value="الأول"> الأول</label>
              <label><input type="checkbox" value="الثانى"> الثانوى</label>
              <label><input type="checkbox" value="الثالث"> الثالث</label>
              <label><input type="checkbox" value="الرابع"> الرابع</label>
              <label><input type="checkbox" value="الخامس"> الخامس</label>
              <label><input type="checkbox" value="السادس"> السادس</label>
            </div>
          </div>
        </td>
        <td>
          <textarea id="edit-teacherNotes" style="width:180px;height:40px;" placeholder="ملاحظات">${teacher.notes || ''}</textarea>
        </td>
        <td>
          <button onclick="saveEditTeacher('${teacher._id}')">حفظ</button>
          <button onclick="cancelEditTeacher()">إلغاء</button>
        </td>
      `;
      setTimeout(() => {
        setupEditMultiselect('edit-teacherLevels', teacher.levels);
        setupEditMultiselect('edit-teacherClasses', teacher.classes);
        loadSubjectsForEditTeacher(teacher.subject);
      }, 0);
    } else {
      tr.innerHTML = `
        <td>${teacher.firstName} ${teacher.lastName}</td>
        <td>${teacher.subject}</td>
        <td>${teacher.levels.join('، ')}</td>
        <td>${teacher.classes.join('، ')}</td>
        <td>${teacher.notes || ''}</td>
        <td>
          <button onclick="editTeacher('${teacher._id}')">تعديل</button>
          <button onclick="deleteTeacher('${teacher._id}')">حذف</button>
        </td>
      `;
    }
    tbody.appendChild(tr);
  });
}

function editTeacher(id) {
  editingTeacherId = id;
  loadTeachers();
}
function cancelEditTeacher() {
  editingTeacherId = null;
  loadTeachers();
}
async function saveEditTeacher(id) {
  const firstName = document.getElementById('edit-teacherFirstName').value.trim();
  const lastName = document.getElementById('edit-teacherLastName').value.trim();
  const subject = document.getElementById('edit-teacherSubject').value;
  const levels = Array.from(document.querySelectorAll('#edit-teacherLevels .options-list input[type="checkbox"]:checked')).map(cb => cb.value);
  const classes = Array.from(document.querySelectorAll('#edit-teacherClasses .options-list input[type="checkbox"]:checked')).map(cb => cb.value);
  const notesField = document.getElementById('edit-teacherNotes');
  const notes = notesField ? notesField.value.trim() : '';
  
  // التحقق من البيانات المطلوبة
  if (!firstName || !lastName) {
    alert('الرجاء إدخال الاسم الأول والأخير');
    return;
  }
  if (!subject) {
    alert('الرجاء اختيار المادة');
    return;
  }
  if (levels.length === 0) {
    alert('الرجاء اختيار المستوى');
    return;
  }
  if (classes.length === 0) {
    alert('الرجاء اختيار الصف');
    return;
  }
  
  await fetch('/api/teachers/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, subject, levels, classes, notes })
  });
  editingTeacherId = null;
  loadTeachers();
}
// تفعيل القوائم المتعددة للصف التعديل
function setupEditMultiselect(id, selected) {
  const multiselect = document.getElementById(id);
  if (!multiselect) return;
  const selectBox = multiselect.querySelector('.select-box');
  const optionsList = multiselect.querySelector('.options-list');
  Array.from(optionsList.querySelectorAll('input[type="checkbox"]')).forEach(cb => {
    cb.checked = selected.includes(cb.value);
  });
  selectBox.addEventListener('click', function(e) {
    optionsList.style.display = optionsList.style.display === 'block' ? 'none' : 'block';
    multiselect.classList.toggle('open');
    e.stopPropagation();
  });
  document.addEventListener('click', function(e) {
    if (!multiselect.contains(e.target)) {
      optionsList.style.display = 'none';
      multiselect.classList.remove('open');
    }
  });
  optionsList.addEventListener('change', function() {
    const checked = Array.from(optionsList.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.parentNode.textContent.trim());
    selectBox.textContent = checked.length ? checked.join('، ') : selectBox.getAttribute('data-placeholder') || selectBox.textContent;
  });
  selectBox.setAttribute('data-placeholder', selectBox.textContent);
}
// تحميل المواد وعرضها في قائمة اختيار المادة بقسم إضافة أستاذ
async function loadSubjectsForEditTeacher(selectedSubject) {
  const res = await fetch('/api/subjects');
  const subjects = await res.json();
  const select = document.getElementById('edit-teacherSubject');
  select.innerHTML = '<option value="">اختر المادة</option>';
  subjects.forEach(sub => {
    const option = document.createElement('option');
    option.value = sub.name;
    option.textContent = sub.name;
    if (sub.name === selectedSubject) option.selected = true;
    select.appendChild(option);
  });
}

// دالة تحميل المجموعات
async function loadGroups() {
  const res = await fetch('/api/groups');
  const groups = await res.json();
  const tbody = document.querySelector('#groupsTable tbody');
  tbody.innerHTML = '';
  groups.forEach(group => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${group.subject}</td>
      <td>${group.teacher}</td>
      <td>${group.levels.join('، ')}</td>
      <td>${group.classes.join('، ')}</td>
      <td>${group.days.join('، ')}</td>
      <td>${group.startTime} - ${group.endTime}</td>
      <td>
        <button class="edit-btn">تعديل</button>
        <button class="delete-btn">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// حذف مجموعة
async function deleteGroup(id) {
  if (confirm('هل أنت متأكد من حذف المجموعة؟')) {
    await fetch('/api/groups/' + id, { method: 'DELETE' });
    loadGroups();
  }
}

// تعديل مجموعة (inline edit)
let editingGroupId = null;
async function loadGroups() {
  const res = await fetch('/api/groups');
  const groups = await res.json();
  const tbody = document.querySelector('#groupsTable tbody');
  tbody.innerHTML = '';
  groups.forEach(group => {
    const isEditing = editingGroupId === group._id;
    const tr = document.createElement('tr');
    if (isEditing) {
      tr.innerHTML = `
        <td><select id="edit-groupSubject"></select></td>
        <td><select id="edit-groupTeacher"></select></td>
        <td>
          <div class="custom-multiselect" id="edit-groupLevel">
            <div class="select-box">${group.levels.join('، ') || 'اختر المستوى'}</div>
            <div class="options-list">
              <label><input type="checkbox" value="ابتدائى"> ابتدائى</label>
              <label><input type="checkbox" value="اعدادى"> اعدادى</label>
              <label><input type="checkbox" value="ثانوى"> ثانوى</label>
            </div>
          </div>
        </td>
        <td>
          <div class="custom-multiselect" id="edit-groupClass">
            <div class="select-box">${group.classes.join('، ') || 'اختر الصف'}</div>
            <div class="options-list">
              <label><input type="checkbox" value="الأول"> الأول</label>
              <label><input type="checkbox" value="الثانى"> الثانوى</label>
              <label><input type="checkbox" value="الثالث"> الثالث</label>
              <label><input type="checkbox" value="الرابع"> الرابع</label>
              <label><input type="checkbox" value="الخامس"> الخامس</label>
              <label><input type="checkbox" value="السادس"> السادس</label>
            </div>
          </div>
        </td>
        <td>
          <div id="edit-groupDays" style="display:flex;flex-direction:column;gap:7px;">
            <div style="display:flex;gap:24px;align-items:center;">
              <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" value="السبت"> <span>السبت</span></label>
              <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" value="الأحد"> <span>الأحد</span></label>
            </div>
            <div style="display:flex;gap:24px;align-items:center;">
              <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" value="الاثنين"> <span>الاثنين</span></label>
              <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" value="الثلاثاء"> <span>الثلاثاء</span></label>
            </div>
            <div style="display:flex;gap:24px;align-items:center;">
              <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" value="الأربعاء"> <span>الأربعاء</span></label>
              <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" value="الخميس"> <span>الخميس</span></label>
            </div>
            <div style="display:flex;gap:24px;align-items:center;">
              <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" value="الجمعة"> <span>الجمعة</span></label>
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <input type="text" id="edit-groupStartTime" style="width:110px;" placeholder="اختر وقت البداية" value="${group.startTime}">
            <input type="text" id="edit-groupEndTime" style="width:110px;" placeholder="اختر وقت النهاية" value="${group.endTime}">
          </div>
        </td>
        <td>
          <input type="number" id="edit-groupPrice" style="width:120px;" placeholder="السعر (ج.م)" min="0" step="0.01" value="${group.price || ''}">
        </td>
        <td>
          <button onclick="saveEditGroup('${group._id}')">حفظ</button>
          <button onclick="cancelEditGroup()">إلغاء</button>
        </td>
      `;
      setTimeout(() => {
        loadSubjectsForEditGroup(group.subject);
        loadTeachersForEditGroup(group.teacher);
        setupEditMultiselect('edit-groupLevel', group.levels);
        setupEditMultiselect('edit-groupClass', group.classes);
        // تفعيل الأيام المختارة
        const selectedDays = group.days || [];
        Array.from(document.querySelectorAll('#edit-groupDays input[type="checkbox"]')).forEach(cb => {
          cb.checked = selectedDays.includes(cb.value);
        });
        
        // تفعيل flatpickr على حقول التوقيت في وضع التعديل
        if (window.flatpickr) {
          flatpickr('#edit-groupStartTime', {
            enableTime: true,
            noCalendar: true,
            dateFormat: 'h:i K',
            time_24hr: false,
            minuteIncrement: 5,
            defaultHour: 4,
            defaultMinute: 0
          });
          flatpickr('#edit-groupEndTime', {
            enableTime: true,
            noCalendar: true,
            dateFormat: 'h:i K',
            time_24hr: false,
            minuteIncrement: 5,
            defaultHour: 5,
            defaultMinute: 0
          });
        }
      }, 0);
    } else {
      tr.innerHTML = `
        <td>${group.subject}</td>
        <td>${group.teacher}</td>
        <td>${group.levels.join('، ')}</td>
        <td>${group.classes.join('، ')}</td>
        <td>${group.days.join('، ')}</td>
        <td>${group.startTime} - ${group.endTime}</td>
        <td>${formatPrice(group.price)}</td>
        <td>
          <button onclick="editGroup('${group._id}')">تعديل</button>
          <button onclick="deleteGroup('${group._id}')">حذف</button>
        </td>
      `;
    }
    tbody.appendChild(tr);
  });
}

function editGroup(id) {
  editingGroupId = id;
  loadGroups();
}
function cancelEditGroup() {
  editingGroupId = null;
  loadGroups();
}
async function saveEditGroup(id) {
  const subject = document.getElementById('edit-groupSubject').value;
  const teacher = document.getElementById('edit-groupTeacher').value;
  const levels = Array.from(document.querySelectorAll('#edit-groupLevel .options-list input[type="checkbox"]:checked')).map(cb => cb.value);
  const classes = Array.from(document.querySelectorAll('#edit-groupClass .options-list input[type="checkbox"]:checked')).map(cb => cb.value);
  const days = Array.from(document.querySelectorAll('#edit-groupDays input[type="checkbox"]:checked')).map(cb => cb.value);
  const startTime = document.getElementById('edit-groupStartTime').value;
  const endTime = document.getElementById('edit-groupEndTime').value;
  const price = parseFloat(document.getElementById('edit-groupPrice').value) || 0;
  await fetch('/api/groups/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, teacher, levels, classes, days, startTime, endTime, price })
  });
  editingGroupId = null;
  loadGroups();
}

// تحميل المواد والمدرسين لقائمة التعديل
async function loadSubjectsForEditGroup(selectedSubject) {
  const res = await fetch('/api/subjects');
  const subjects = await res.json();
  const select = document.getElementById('edit-groupSubject');
  select.innerHTML = '<option value="">اختر المادة</option>';
  subjects.forEach(sub => {
    const option = document.createElement('option');
    option.value = sub.name;
    option.textContent = sub.name;
    if (sub.name === selectedSubject) option.selected = true;
    select.appendChild(option);
  });
}
async function loadTeachersForEditGroup(selectedTeacher) {
  const res = await fetch('/api/teachers');
  const teachers = await res.json();
  const select = document.getElementById('edit-groupTeacher');
  select.innerHTML = '<option value="">اختر الأستاذ</option>';
  teachers.forEach(teacher => {
    const name = teacher.firstName + ' ' + teacher.lastName;
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    if (name === selectedTeacher) option.selected = true;
    select.appendChild(option);
  });
}

// دالة لتفعيل flatpickr على حقول الوقت في نموذج المجموعة
function initializeGroupTimeFields() {
  setTimeout(() => {
    if (window.flatpickr) {
      // إزالة أي flatpickr سابق لتجنب التضارب
      const startTimeField = document.getElementById('groupStartTime');
      const endTimeField = document.getElementById('groupEndTime');
      
      if (startTimeField && startTimeField._flatpickr) {
        startTimeField._flatpickr.destroy();
      }
      if (endTimeField && endTimeField._flatpickr) {
        endTimeField._flatpickr.destroy();
      }
      
      // تفعيل flatpickr الجديد
      flatpickr('#groupStartTime', {
        enableTime: true,
        noCalendar: true,
        dateFormat: 'h:i K',
        time_24hr: false,
        minuteIncrement: 5,
        defaultHour: 4,
        defaultMinute: 0
      });
      flatpickr('#groupEndTime', {
        enableTime: true,
        noCalendar: true,
        dateFormat: 'h:i K',
        time_24hr: false,
        minuteIncrement: 5,
        defaultHour: 5,
        defaultMinute: 0
      });
      
      console.log('Group time fields initialized with flatpickr');
    } else {
      console.error('Flatpickr library not loaded');
    }
  }, 200);
}

// عند تحميل الصفحة
window.onload = function() {
  // loadUsers && loadUsers(); // تم إزالة هذا لأن loadUsers غير متوفر في الصفحة الرئيسية
  loadSubjects && loadSubjects();
  loadSubjectsForTeacher();
  loadTeachers();
  loadGroups && loadGroups();
  loadStudents && loadStudents();
  loadSubscriptions && loadSubscriptions();
  // loadSubjectsForGroup(); // تم إزالة هذا لأن الدالة غير موجودة
  loadTeachersForGroup();

  // تفعيل flatpickr على حقول الوقت
  initializeGroupTimeFields();
  
  // تحميل العملة الحالية
  loadCurrentCurrency();
};

// إضافة مجموعة جديدة وربطها بباك اند المجموعات عند الضغط على زر إضافة في النموذج.
document.getElementById('addGroupForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const subject = document.getElementById('groupSubject').value;
  const teacher = document.getElementById('groupTeacher').value;
  const level = document.getElementById('groupLevelSelect').value; // تصحيح الاسم
  const classValue = document.getElementById('groupClassSelect').value; // تصحيح الاسم
  const days = Array.from(document.querySelectorAll('#groupDays input[type="checkbox"]:checked')).map(cb => cb.value);
  const startTime = document.getElementById('groupStartTime').value;
  const endTime = document.getElementById('groupEndTime').value;
  const price = parseFloat(document.getElementById('groupPrice').value) || 0;
  
  console.log('Form data:', { subject, teacher, level, classValue, days, startTime, endTime, price }); // للتشخيص
  
  if (!subject || !teacher || !level || !classValue || days.length === 0 || !startTime || !endTime) {
    alert('يرجى إدخال جميع البيانات المطلوبة');
    return;
  }
  
  if (price < 0) {
    alert('السعر يجب أن يكون رقم موجب');
    return;
  }
  
  // تحويل القيم المفردة إلى مصفوفات ليطابق النموذج المتوقع
  const levels = [level];
  const classes = [classValue];
  
  await fetch('/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, teacher, levels, classes, days, startTime, endTime, price })
  });
  loadGroups();
  this.reset();
  document.querySelectorAll('#groupDays input[type="checkbox"]').forEach(cb => cb.checked = false);
  // إعادة تعيين القوائم المنسدلة
  document.getElementById('groupLevelSelect').value = '';
  document.getElementById('groupClassSelect').value = '';
  alert('تم إضافة المجموعة بنجاح');
});

// نظام فلترة منفصل لقسم إضافة مجموعة
const groupLevelSelect = document.getElementById('groupLevelSelect');
const groupClassSelect = document.getElementById('groupClassSelect');
const groupSubjectSelect = document.getElementById('groupSubject');
const groupTeacherSelect = document.getElementById('groupTeacher');

function filterGroupClassesByLevel() {
  const level = groupLevelSelect.value;
  groupClassSelect.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'اختر الصف';
  groupClassSelect.appendChild(defaultOption);
  let allowed = [];
  if (level === 'ابتدائى') {
    allowed = ['الأول', 'الثانى', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
  } else if (level === 'اعدادى' || level === 'ثانوى') {
    allowed = ['الأول', 'الثانى', 'الثالث'];
  }
  allowed.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls;
    option.textContent = cls;
    groupClassSelect.appendChild(option);
  });
  filterGroupSubjects();
  filterGroupTeachers();
}

async function filterGroupSubjects() {
  const level = groupLevelSelect.value;
  const cls = groupClassSelect.value;
  const res = await fetch('/api/subjects');
  const subjects = await res.json();
  groupSubjectSelect.innerHTML = '<option value="">اختر المادة</option>';
  subjects.forEach(sub => {
    // تحقق من توافق المادة مع المستوى والصف
    const hasLevel = sub.levels && sub.levels.includes(level);
    const hasClass = sub.classes && sub.classes.includes(cls);
    if (hasLevel && hasClass) {
      const option = document.createElement('option');
      option.value = sub.name;
      option.textContent = sub.name;
      groupSubjectSelect.appendChild(option);
    }
  });
  filterGroupTeachers();
}

async function filterGroupTeachers() {
  const level = groupLevelSelect.value;
  const cls = groupClassSelect.value;
  const subject = groupSubjectSelect.value;
  const res = await fetch('/api/teachers');
  const teachers = await res.json();
  groupTeacherSelect.innerHTML = '<option value="">اختر الأستاذ</option>';
  teachers.forEach(teacher => {
    // تحقق من توافق المدرس مع المستوى والصف والمادة
    const hasLevel = teacher.levels && teacher.levels.includes(level);
    const hasClass = teacher.classes && teacher.classes.includes(cls);
    const hasSubject = teacher.subject === subject;
    if (hasLevel && hasClass && hasSubject) {
      const option = document.createElement('option');
      option.value = teacher.firstName + ' ' + teacher.lastName;
      option.textContent = teacher.firstName + ' ' + teacher.lastName;
      groupTeacherSelect.appendChild(option);
    }
  });
}

groupLevelSelect.addEventListener('change', filterGroupClassesByLevel);
groupClassSelect.addEventListener('change', () => {
  filterGroupSubjects();
  filterGroupTeachers();
});
groupSubjectSelect.addEventListener('change', filterGroupTeachers);

// عند تحميل الصفحة، تفعيل الفلترة الأولية
window.addEventListener('DOMContentLoaded', () => {
  filterGroupClassesByLevel();
});

// دالة تحميل وعرض المدفوعات في جدول paymentsTable
async function loadPaymentsTable(filterId = '', filterName = '') {
  const paymentsRes = await fetch('/api/payments');
  const payments = await paymentsRes.json();
  const subscriptionsRes = await fetch('/api/subscriptions');
  const subscriptions = await subscriptionsRes.json();
  const studentsRes = await fetch('/api/students');
  const students = await studentsRes.json();
  const subjectsRes = await fetch('/api/subjects');
  const subjects = await subjectsRes.json();
  const teachersRes = await fetch('/api/teachers');
  const teachers = await teachersRes.json();
  const groupsRes = await fetch('/api/groups');
  const groups = await groupsRes.json();

  // فلترة المدفوعات حسب الطالب
  let filteredPayments = payments;
  if (filterId) {
    filteredPayments = payments.filter(p => p.studentId === filterId);
  } else if (filterName) {
    const student = students.find(s => (s.firstName + ' ' + (s.middleName ? student.middleName + ' ' : '') + s.lastName).trim() === filterName);
    if (student) filteredPayments = payments.filter(p => p.studentId === student.studentId);
    else filteredPayments = [];
  }

  const tbody = document.querySelector('#paymentsTable tbody');
  tbody.innerHTML = '';
  filteredPayments.forEach(payment => {
    const sub = subscriptions.find(s => s.subscriptionId === payment.subscriptionId);
    if (!sub) return;
    const subject = subjects.find(subj => subj.subjectId === sub.subjectId);
    const teacher = teachers.find(t => t.teacherId === sub.teacherId);
    const group = groups.find(g => g.groupId === sub.groupId);
    // عرض فقط أول 3 أشهر
    const months = payment.months.slice(0, 3);
    let monthsHtml = '';
    months.forEach((m, idx) => {
      monthsHtml += `<div style="margin-bottom:6px;">${m.month}: <span style="color:${m.status==='مدفوع'?'green':'red'};font-weight:bold;">${m.status}</span> ${m.amount ? '('+m.amount+'جنيه)' : ''}</div>`;
    });
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${subject ? subject.name : ''}</td>
      <td>${teacher ? teacher.firstName + ' ' + teacher.lastName : ''}</td>
      <td>${group ? (group.name || `${group.subject} - ${group.teacher}`) : ''}</td>
      <td>${monthsHtml}</td>
      <td><button onclick="editPayment('${payment.paymentId}')">تعديل</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// البحث في المدفوعات حسب الطالب

// البحث في الاشتراكات أولًا عند البحث في المدفوعات
document.getElementById('searchPaymentBtn').addEventListener('click', async function() {
  // تحديث جماعي للأشهر قبل البحث
  await fetch('/api/payments/updateMonths', { method: 'PUT' });
  const idInput = document.getElementById('searchPaymentId');
  const nameInput = document.getElementById('searchPaymentName');
  const id = idInput.value.trim();
  const name = nameInput.value.trim();
  const subscriptionsRes = await fetch('/api/subscriptions');
  const subscriptions = await subscriptionsRes.json();
  const studentsRes = await fetch('/api/students');
  const students = await studentsRes.json();
  const subjectsRes = await fetch('/api/subjects');
  const subjects = await subjectsRes.json();
  const teachersRes = await fetch('/api/teachers');
  const teachers = await teachersRes.json();
  const groupsRes = await fetch('/api/groups');
  const groups = await groupsRes.json();
  let filteredSubs = [];
  let student = null;
  if (id) {
    filteredSubs = subscriptions.filter(s => s.studentId === id);
    student = students.find(s => s.studentId === id);
    if (student) {
      nameInput.value = (student.firstName + ' ' + (student.middleName ? student.middleName + ' ' : '') + student.lastName).trim();
    } else {
      nameInput.value = '';
    }
  } else if (name) {
    student = students.find(s => (s.firstName + ' ' + (s.middleName ? student.middleName + ' ' : '') + s.lastName).trim() === name);
    if (student) {
      idInput.value = student.studentId;
      filteredSubs = subscriptions.filter(s => s.studentId === student.studentId);
    } else {
      idInput.value = '';
      filteredSubs = [];
    }
  }
  const tbody = document.querySelector('#paymentsTable tbody');
  tbody.innerHTML = '';
  if (filteredSubs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">لا يوجد اشتراكات لهذا الطالب</td></tr>';
    return;
  }
  // جلب المدفوعات الحالية
  const paymentsRes = await fetch('/api/payments');
  const payments = await paymentsRes.json();
  filteredSubs.forEach(sub => {
    const subject = subjects.find(subj => subj.subjectId === sub.subjectId);
    const teacher = teachers.find(t => t.teacherId === sub.teacherId);
    const group = groups.find(g => g.groupId === sub.groupId);
    const payment = payments.find(p => p.subscriptionId === sub.subscriptionId);
    let monthsHtml = '';
    if (payment && payment.months && payment.months.length > 0) {
      payment.months.slice(0, 3).forEach(m => {
        monthsHtml += `<div style=\"margin-bottom:6px;\">${m.month}: <span style=\"color:${m.status==='مدفوع'?'green':'red'};font-weight:bold;\">${m.status}</span> ${m.amount ? '('+m.amount+'جنيه)' : ''}</div>`;
      });
    } else {
      monthsHtml = '<span style="color:gray;">لا توجد مدفوعات بعد</span>';
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${subject ? subject.name : ''}</td>
      <td>${teacher ? teacher.firstName + ' ' + teacher.lastName : ''}</td>
      <td>${group ? (group.name || `${group.subject} - ${group.teacher}`) : ''}</td>
      <td id="months-cell-${sub.subscriptionId}">${monthsHtml}</td>
      <td id="action-cell-${sub.subscriptionId}">
        <button onclick=\"editPaymentForSubscription('${sub.subscriptionId}','${sub.studentId}')\">تعديل المدفوعات</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
});

// دالة عرض حقول تعديل المدفوعات
async function editPaymentForSubscription(subscriptionId, studentId) {
  const paymentsRes = await fetch('/api/payments');
  const payments = await paymentsRes.json();
  const payment = payments.find(p => p.subscriptionId === subscriptionId);
  const cell = document.getElementById('months-cell-' + subscriptionId);
  const actionCell = document.getElementById('action-cell-' + subscriptionId);
  if (!payment) {
    alert('يجب إضافة مدفوعات أولًا لهذا الاشتراك');
    return;
  }
  // بناء حقول تعديل لكل شهر
  let editHtml = '';
  payment.months.slice(0, 3).forEach((m, idx) => {
    editHtml += `<div style=\"margin-bottom:6px;\">${m.month}: <input type=\"checkbox\" id=\"edit-month-status-${subscriptionId}-${idx}\"${m.status==='مدفوع'?' checked':''}> <label for=\"edit-month-status-${subscriptionId}-${idx}\">مدفوع</label></div>`;
  });
  cell.innerHTML = editHtml;
  actionCell.innerHTML = `<button onclick=\"saveEditPayment('${payment.paymentId}','${subscriptionId}')\">حفظ</button> <button onclick=\"cancelEditPayment('${subscriptionId}')\">إلغاء</button>`;
}

// دالة حفظ تعديل المدفوعات
async function saveEditPayment(paymentId, subscriptionId) {
  const paymentsRes = await fetch('/api/payments');
  const payments = await paymentsRes.json();
  const payment = payments.find(p => p.paymentId === paymentId);
  if (!payment) return;
  // تحديث حالة كل شهر
  for (let i = 0; i < 3; i++) {
    const checked = document.getElementById(`edit-month-status-${subscriptionId}-${i}`).checked;
    payment.months[i].status = checked ? 'مدفوع' : 'غير مدفوع';
  }
  // إرسال التحديث للداتا بيز
  for (let i = 0; i < 3; i++) {
    await fetch('/api/payments/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, monthIndex: i, status: payment.months[i].status })
    });
  }
  document.getElementById('searchPaymentBtn').click();
  setTimeout(() => {
    alert('تم حفظ التعديلات بنجاح');
  }, 200);
}

// دالة إلغاء التعديل
function cancelEditPayment(subscriptionId) {
  document.getElementById('searchPaymentBtn').click();
}

// تحميل المواد لقائمة الحضور
async function loadSubjectsForAttendance() {
  const res = await fetch('/api/subjects');
  const subjects = await res.json();
  const select = document.getElementById('attendanceSubject');
  select.innerHTML = '<option value="">اختر المادة</option>';
  subjects.forEach(sub => {
    const option = document.createElement('option');
    option.value = sub.subjectId || sub._id || sub.name;
    option.textContent = sub.name;
    select.appendChild(option);
  });
}

// تحميل الأساتذة لقائمة الحضور
async function loadTeachersForAttendance() {
  const res = await fetch('/api/teachers');
  const teachers = await res.json();
  const select = document.getElementById('attendanceTeacher');
  select.innerHTML = '<option value="">اختر الأستاذ</option>';
  teachers.forEach(teacher => {
    const option = document.createElement('option');
    option.value = teacher.teacherId || teacher._id || (teacher.firstName + ' ' + teacher.lastName);
    option.textContent = teacher.firstName + ' ' + teacher.lastName;
    select.appendChild(option);
  });
}

// تحميل المجموعات لقائمة الحضور
async function loadGroupsForAttendance() {
  const res = await fetch('/api/groups');
  const groups = await res.json();
  const select = document.getElementById('attendanceGroup');
  select.innerHTML = '<option value="">اختر المجموعة</option>';
  groups.forEach(group => {
    const option = document.createElement('option');
    option.value = group.groupId || group._id || group.subject + '-' + group.teacher;
    // عرض اسم المجموعة الجديد (أيام - وقت)
    option.textContent = group.name || `${group.subject} - ${group.teacher}`;
    select.appendChild(option);
  });
}

// تفعيل نظام الفلترة الذكي للحضور (يحل محل الدوال القديمة)
window.addEventListener('DOMContentLoaded', () => {
  setupAttendanceFiltering();
  
  // تفعيل flatpickr كاحتياطي إضافي
  setTimeout(() => {
    initializeGroupTimeFields();
  }, 500);
});

// نظام الفلترة الذكي لقسم الحضور
function setupAttendanceFiltering() {
  const subjectSelect = document.getElementById('attendanceSubject');
  const teacherSelect = document.getElementById('attendanceTeacher');
  const groupSelect = document.getElementById('attendanceGroup');
  
  // تخزين البيانات الأصلية
  let allSubjects = [];
  let allTeachers = [];
  let allGroups = [];
  
  // تحميل البيانات الأساسية
  async function loadAllData() {
    try {
      const [subjectsRes, teachersRes, groupsRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/teachers'),
        fetch('/api/groups')
      ]);
      
      allSubjects = await subjectsRes.json();
      allTeachers = await teachersRes.json();
      allGroups = await groupsRes.json();
      
      // ملء القوائم الأولية
      populateSelect(subjectSelect, allSubjects, 'subjectId', 'name', 'اختر المادة');
      populateSelect(teacherSelect, allTeachers, 'teacherId', 'firstName', 'اختر الأستاذ');
      populateSelect(groupSelect, allGroups, 'groupId', group => group.name || `${group.subject} - ${group.teacher}`, 'اختر المجموعة');
      
    } catch (error) {
      console.error('خطأ في تحميل بيانات الفلترة:', error);
    }
  }
  
  // دالة مساعدة لملء القوائم
  function populateSelect(select, data, valueField, textField, placeholder) {
    select.innerHTML = `<option value="">${placeholder}</option>`;
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item[valueField] || item._id;
      option.textContent = typeof textField === 'function' ? textField(item) : item[textField];
      select.appendChild(option);
    });
  }
  
  // فلترة المدرسين حسب المادة المختارة
  function filterTeachersBySubject(selectedSubject) {
    if (!selectedSubject) {
      populateSelect(teacherSelect, allTeachers, 'teacherId', 'firstName', 'اختر الأستاذ');
      return;
    }
    
    // البحث عن اسم المادة من خلال ID
    const selectedSubjectData = allSubjects.find(subject => 
      (subject.subjectId || subject._id) === selectedSubject
    );
    
    if (!selectedSubjectData) {
      populateSelect(teacherSelect, [], 'teacherId', 'firstName', 'اختر الأستاذ');
      return;
    }
    
    const selectedSubjectName = selectedSubjectData.name;
    
    // العثور على المجموعات التي تدرس هذه المادة (باستخدام اسم المادة)
    const relatedGroups = allGroups.filter(group => group.subject === selectedSubjectName);
    const relatedTeacherNames = [...new Set(relatedGroups.map(group => group.teacher))];
    
    // فلترة المدرسين بناءً على الأسماء
    const filteredTeachers = allTeachers.filter(teacher => 
      relatedTeacherNames.includes(teacher.firstName) || 
      relatedTeacherNames.includes(teacher.firstName + ' ' + teacher.lastName)
    );
    
    populateSelect(teacherSelect, filteredTeachers, 'teacherId', 'firstName', 'اختر الأستاذ');
    teacherSelect.value = ''; // إعادة تعيين الاختيار
    filterGroups(); // تحديث المجموعات
  }
  
  // فلترة المجموعات حسب المادة والمدرس
  function filterGroups() {
    const selectedSubject = subjectSelect.value;
    const selectedTeacher = teacherSelect.value;
    
    let filteredGroups = allGroups;
    
    if (selectedSubject) {
      // البحث عن اسم المادة
      const selectedSubjectData = allSubjects.find(subject => 
        (subject.subjectId || subject._id) === selectedSubject
      );
      if (selectedSubjectData) {
        filteredGroups = filteredGroups.filter(group => group.subject === selectedSubjectData.name);
      }
    }
    
    if (selectedTeacher) {
      // البحث عن اسم المدرس
      const selectedTeacherData = allTeachers.find(teacher => 
        (teacher.teacherId || teacher._id) === selectedTeacher
      );
      if (selectedTeacherData) {
        const teacherName = selectedTeacherData.firstName;
        filteredGroups = filteredGroups.filter(group => 
          group.teacher === teacherName || 
          group.teacher === teacherName + ' ' + selectedTeacherData.lastName
        );
      }
    }
    
    populateSelect(groupSelect, filteredGroups, 'groupId', group => group.name || `${group.subject} - ${group.teacher}`, 'اختر المجموعة');
    groupSelect.value = ''; // إعادة تعيين الاختيار
  }
  
  // ربط الأحداث
  subjectSelect.addEventListener('change', () => {
    filterTeachersBySubject(subjectSelect.value);
  });
  
  teacherSelect.addEventListener('change', () => {
    filterGroups();
  });
  
  // تحميل البيانات عند بدء النظام
  loadAllData();
}

// تفعيل نظام الفلترة الذكي للحضور
window.addEventListener('DOMContentLoaded', () => {
  setupAttendanceFiltering();
});

// متغير عام لحالة التعديل لكل اشتراك حضور
let editModeMap = {};

// دالة تحميل وعرض الحضور بشكل أسابيع وأيام المجموعة مع checkboxes
async function loadAttendanceTable(filterSubject = '', filterTeacher = '', filterGroup = '', filterId = '', filterName = '') {
  const subscriptionsRes = await fetch('/api/subscriptions');
  const subscriptions = await subscriptionsRes.json();
  const studentsRes = await fetch('/api/students');
  const students = await studentsRes.json();
  const paymentsRes = await fetch('/api/payments');
  const payments = await paymentsRes.json();
  const attendanceRes = await fetch('/api/attendance');
  const attendanceList = await attendanceRes.json();
  const groupsRes = await fetch('/api/groups');
  const groups = await groupsRes.json();

  let filteredSubs = subscriptions;
  if (filterId) {
    filteredSubs = filteredSubs.filter(s => s.studentId === filterId);
  } else if (filterName) {
    const student = students.find(s => (s.firstName + ' ' + (s.middleName ? s.middleName + ' ' : '') + s.lastName).trim() === filterName);
    if (student) filteredSubs = filteredSubs.filter(s => s.studentId === student.studentId);
    else filteredSubs = [];
  }
  if (filterSubject) filteredSubs = filteredSubs.filter(s => s.subjectId === filterSubject);
  if (filterTeacher) filteredSubs = filteredSubs.filter(s => s.teacherId === filterTeacher);
  if (filterGroup) filteredSubs = filteredSubs.filter(s => s.groupId === filterGroup);

  const tbody = document.querySelector('#attendanceTable tbody');
  tbody.innerHTML = '';
  if (filteredSubs.length === 0) {
    tbody.innerHTML = '';
    return;
  }

  // ...existing code...

  filteredSubs.forEach(sub => {
    const student = students.find(s => s.studentId === sub.studentId);
    const payment = payments.find(p => p.subscriptionId === sub.subscriptionId);
    const attendance = attendanceList.find(a => a.subscriptionId === sub.subscriptionId);
    const group = groups.find(g => g.groupId === sub.groupId);
    const studentName = student ? student.firstName + ' ' + (student.middleName ? student.middleName + ' ' : '') + student.lastName : '';
    let paymentsHtml = '';
    if (payment && payment.months && payment.months.length > 0) {
      payment.months.slice(0, 3).forEach(m => {
        paymentsHtml += `<div>${m.month}: <span style=\"color:${m.status==='مدفوع'?'green':'red'};font-weight:bold;\">${m.status}</span></div>`;
      });
    } else {
      paymentsHtml = '<span style="color:gray;">لا توجد مدفوعات بعد</span>';
    }
    // الحضور: الشهر الحالي فقط في عمود واحد
    let attendanceHtml = '';
    let isEdit = !!editModeMap[sub.subscriptionId];
    if (attendance && attendance.months && attendance.months.length > 0) {
      const currentMonth = attendance.months[attendance.months.length - 1];
      attendanceHtml += `<td>`;
      // سطر أول: اسم الشهر والسنة (من آخر شهر في البيانات - يتحدث تلقائياً مع الباكند)
      attendanceHtml += `<div style=\"margin-bottom:10px; font-weight:bold; color:#2a4d8f;\">${currentMonth.month}</div>`;
      currentMonth.weeks.forEach((week, wIdx) => {
        attendanceHtml += `<div style=\"margin-bottom:8px;\"><b>الأسبوع ${week.weekNumber}:</b> `;
        week.days.forEach((dayObj, dIdx) => {
          const checked = dayObj.status === 'حاضر' ? 'checked' : '';
          if (isEdit) {
            attendanceHtml += `<label style=\"margin-right:12px;\">${dayObj.day} <input type=\"checkbox\" data-attendance-id=\"${attendance.attendanceId}\" data-month=\"${attendance.months.length-1}\" data-week=\"${wIdx}\" data-day=\"${dIdx}\" ${checked}></label>`;
          } else {
            attendanceHtml += `<span style=\"margin-right:12px;\">${dayObj.day}: <span style=\"color:${checked?'green':'red'};font-weight:bold;\">${checked ? 'حاضر' : 'غائب'}</span></span>`;
          }
          // فاصل بين الأيام
          if (dIdx < week.days.length - 1) attendanceHtml += ' | ';
        });
        attendanceHtml += `</div>`;
      });
      attendanceHtml += `</td>`;
    } else {
      attendanceHtml = '<td><span style="color:gray;">لا يوجد حضور بعد</span></td>';
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${studentName}</td>
      ${attendanceHtml}
      <td>${paymentsHtml}</td>
      <td>
        <button class="toggle-attendance-edit" data-sub-id="${sub.subscriptionId}">${isEdit ? 'حفظ' : 'تسجيل الحضور'}</button>
        ${isEdit ? `<button class="cancel-attendance-edit" data-sub-id="${sub.subscriptionId}">إلغاء</button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });

  // حفظ التغييرات فقط عند الضغط على زر "حفظ"
  tbody.querySelectorAll('.toggle-attendance-edit').forEach(btn => {
    btn.addEventListener('click', async function() {
      const subId = this.getAttribute('data-sub-id');
      if (editModeMap[subId]) {
        // وضع الحفظ: اجمع كل القيم من checkboxes لهذا الاشتراك
        const checkboxes = tbody.querySelectorAll(`input[type="checkbox"][data-attendance-id]`);
        for (const checkbox of checkboxes) {
          if (checkbox.closest('tr').querySelector('.toggle-attendance-edit').getAttribute('data-sub-id') === subId) {
            const attendanceId = checkbox.getAttribute('data-attendance-id');
            const monthIndex = parseInt(checkbox.getAttribute('data-month'));
            const weekIndex = parseInt(checkbox.getAttribute('data-week'));
            const dayIndex = parseInt(checkbox.getAttribute('data-day'));
            const status = checkbox.checked ? 'حاضر' : 'غائب';
            await fetch('/api/attendance/status', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ attendanceId, monthIndex, weekIndex, dayIndex, status })
            });
          }
        }
        editModeMap[subId] = false;
        loadAttendanceTable(filterSubject, filterTeacher, filterGroup, filterId, filterName);
      } else {
        // تفعيل وضع التعديل
        editModeMap[subId] = true;
        loadAttendanceTable(filterSubject, filterTeacher, filterGroup, filterId, filterName);
      }
    });
  });
  // زر إلغاء: فقط إغلاق وضع التعديل بدون حفظ أي تغييرات
  tbody.querySelectorAll('.cancel-attendance-edit').forEach(btn => {
    btn.addEventListener('click', function() {
      const subId = this.getAttribute('data-sub-id');
      editModeMap[subId] = false;
      loadAttendanceTable(filterSubject, filterTeacher, filterGroup, filterId, filterName);
    });
  });
}

// عند الضغط على زر البحث أو إنشاء جدول الحضور
const attendanceSearchBtn = document.getElementById('generateAttendanceTableBtn');
if (attendanceSearchBtn) {
  attendanceSearchBtn.addEventListener('click', () => {
    const subject = document.getElementById('attendanceSubject').value;
    const teacher = document.getElementById('attendanceTeacher').value;
    const group = document.getElementById('attendanceGroup').value;
    const id = document.getElementById('searchAttendanceId').value.trim();
    const name = document.getElementById('searchAttendanceName').value.trim();
    
    // التحقق من أن المستخدم اختار على الأقل واحد من المحددات الأساسية
    if (!subject && !teacher && !group) {
      alert('يرجى اختيار على الأقل واحد من المحددات (المادة، الأستاذ، أو المجموعة) قبل إنشاء جدول الحضور');
      return;
    }
    
    loadAttendanceTable(subject, teacher, group, id, name);
  });
}

// زرار البحث داخل الجدول المعروض
const searchInTableBtn = document.getElementById('searchInTableBtn');
if (searchInTableBtn) {
  searchInTableBtn.addEventListener('click', () => {
    const searchId = document.getElementById('searchAttendanceId').value.trim();
    const searchName = document.getElementById('searchAttendanceName').value.trim();
    
    // التحقق من وجود جدول معروض
    const tbody = document.querySelector('#attendanceTable tbody');
    if (!tbody || tbody.innerHTML.trim() === '') {
      alert('يجب إنشاء جدول الحضور أولاً باستخدام المحددات قبل البحث');
      return;
    }
    
    // التحقق من أن المستخدم أدخل معيار بحث واحد على الأقل
    if (!searchId && !searchName) {
      alert('يرجى إدخال رقم ID أو الاسم للبحث');
      return;
    }
    
    searchInAttendanceTable(searchId, searchName);
  });
}

// دالة البحث داخل الجدول المعروض
async function searchInAttendanceTable(searchId, searchName) {
  const tbody = document.querySelector('#attendanceTable tbody');
  const rows = tbody.querySelectorAll('tr');
  let foundResults = [];
  
  // إذا كان البحث بالـ ID، نحتاج للبحث في قاعدة البيانات أولاً
  let targetStudentIds = [];
  if (searchId) {
    try {
      // البحث في قاعدة البيانات عن الطلاب المطابقين للـ ID
      const studentsRes = await fetch('/api/students');
      const students = await studentsRes.json();
      
      // العثور على الطالب بالـ ID
      const matchingStudents = students.filter(student => 
        student.studentId && student.studentId.includes(searchId)
      );
      
      if (matchingStudents.length === 0) {
        alert('لا يوجد طلاب بهذا الرقم في قاعدة البيانات');
        return;
      }
      
      // الحصول على أسماء الطلاب المطابقين
      targetStudentIds = matchingStudents.map(student => ({
        studentId: student.studentId,
        fullName: student.firstName + ' ' + (student.middleName ? student.middleName + ' ' : '') + student.lastName
      }));
      
    } catch (error) {
      alert('حدث خطأ أثناء البحث في قاعدة البيانات');
      return;
    }
  }
  
  rows.forEach(row => {
    let match = false;
    const cells = row.querySelectorAll('td');
    
    if (cells.length > 0) {
      const nameText = cells[0].textContent.trim(); // اسم الطالب في الخلية الأولى
      
      // البحث بالاسم مباشرة
      if (searchName) {
        if (nameText.includes(searchName)) {
          match = true;
        }
      }
      
      // البحث برقم ID - مطابقة مع النتائج من قاعدة البيانات
      if (searchId && targetStudentIds.length > 0) {
        // التحقق إذا كان اسم الطالب في الجدول يطابق أحد الطلاب الموجودين في قاعدة البيانات
        const isMatchingStudent = targetStudentIds.some(student => 
          student.fullName.trim() === nameText.trim()
        );
        
        if (isMatchingStudent) {
          match = true;
        }
      }
    }
    
    // إخفاء/إظهار الصف حسب نتيجة البحث
    if (match) {
      row.style.display = '';
      foundResults.push(row);
    } else {
      row.style.display = 'none';
    }
  });
  
  // إظهار رسالة فقط في حالات الفشل أو عدم التطابق
  if (foundResults.length === 0) {
    if (searchId && targetStudentIds.length > 0) {
      alert(`الطالب برقم ${searchId} موجود في قاعدة البيانات ولكن غير معروض في الجدول الحالي (لا يطابق المحددات المختارة)`);
    } else {
      alert('لا توجد نتائج مطابقة للبحث في الجدول المعروض');
    }
    // إظهار كل الصفوف مرة أخرى
    rows.forEach(row => {
      row.style.display = '';
    });
  }
  // في حالة النجاح: لا نظهر رسالة، فقط نعرض النتائج
}

// عند تحميل الصفحة، لا تعرض أي بيانات حضور ويظل الجدول فارغ تمامًا
window.addEventListener('DOMContentLoaded', () => {
  const tbody = document.querySelector('#attendanceTable tbody');
  if (tbody) {
    tbody.innerHTML = '';
  }
});

// 🚨 دوال الطوارئ للتحديث
let emergencyGroupsData = []; // تخزين بيانات المجموعات

function showEmergencySection() {
  console.log('🚨 تم الضغط على زر التحديث الطارئ');
  // تحميل البيانات وإعادة تعيين النماذج
  loadEmergencyData();
  document.getElementById('emergencySection').style.display = 'block';
  console.log('✅ تم إظهار قسم التحديث الطارئ');
}

async function loadEmergencyData() {
  try {
    console.log('🔄 بدء تحميل بيانات المجموعات...');
    console.log('🌐 الطلب إلى: http://localhost:3001/api/groups');
    
    const response = await fetch('http://localhost:3001/api/groups');
    console.log('📡 تم استقبال الاستجابة:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    emergencyGroupsData = await response.json();
    
    console.log('✅ تم تحميل بيانات المجموعات بنجاح:', emergencyGroupsData);
    
    // إعادة تعيين جميع القوائم
    resetEmergencySelects();
    
    // تحميل المستويات المتاحة
    const levels = [...new Set(emergencyGroupsData.flatMap(group => group.levels))];
    const levelSelect = document.getElementById('emergencyLevel');
    levelSelect.innerHTML = '<option value="">اختر المستوى...</option>';
    
    levels.forEach(level => {
      const option = document.createElement('option');
      option.value = level;
      option.textContent = level;
      levelSelect.appendChild(option);
    });
    
    console.log('المستويات المتاحة:', levels);
    
  } catch (error) {
    console.error('خطأ في تحميل بيانات المجموعات:', error);
    alert(`خطأ في تحميل بيانات المجموعات: ${error.message}`);
  }
}

function resetEmergencySelects() {
  // إعادة تعيين جميع القوائم والحالات
  document.getElementById('emergencyLevel').value = '';
  document.getElementById('emergencyClass').innerHTML = '<option value="">اختر الصف...</option>';
  document.getElementById('emergencyClass').disabled = true;
  document.getElementById('emergencySubject').innerHTML = '<option value="">اختر المادة...</option>';
  document.getElementById('emergencySubject').disabled = true;
  document.getElementById('emergencyTeacher').innerHTML = '<option value="">اختر الأستاذ...</option>';
  document.getElementById('emergencyTeacher').disabled = true;
  document.getElementById('emergencyGroupSelect').innerHTML = '<option value="">ستظهر المجموعات هنا بعد اختيار الأستاذ...</option>';
  document.getElementById('emergencyGroupSelect').disabled = true;
  document.getElementById('selectedGroupInfo').style.display = 'none';
}

function loadEmergencyClasses() {
  const selectedLevel = document.getElementById('emergencyLevel').value;
  const classSelect = document.getElementById('emergencyClass');
  
  // إعادة تعيين القوائم التالية
  document.getElementById('emergencySubject').innerHTML = '<option value="">اختر المادة...</option>';
  document.getElementById('emergencySubject').disabled = true;
  document.getElementById('emergencyTeacher').innerHTML = '<option value="">اختر الأستاذ...</option>';
  document.getElementById('emergencyTeacher').disabled = true;
  document.getElementById('emergencyGroupSelect').innerHTML = '<option value="">ستظهر المجموعات هنا بعد اختيار الأستاذ...</option>';
  document.getElementById('emergencyGroupSelect').disabled = true;
  document.getElementById('selectedGroupInfo').style.display = 'none';
  
  if (!selectedLevel) {
    classSelect.innerHTML = '<option value="">اختر الصف...</option>';
    classSelect.disabled = true;
    return;
  }
  
  // فلترة المجموعات حسب المستوى المختار
  const filteredGroups = emergencyGroupsData.filter(group => 
    group.levels.includes(selectedLevel)
  );
  
  // جمع الصفوف المتاحة
  const classes = [...new Set(filteredGroups.flatMap(group => group.classes))];
  
  classSelect.innerHTML = '<option value="">اختر الصف...</option>';
  classes.forEach(className => {
    const option = document.createElement('option');
    option.value = className;
    option.textContent = className;
    classSelect.appendChild(option);
  });
  
  classSelect.disabled = false;
}

function loadEmergencySubjects() {
  const selectedLevel = document.getElementById('emergencyLevel').value;
  const selectedClass = document.getElementById('emergencyClass').value;
  const subjectSelect = document.getElementById('emergencySubject');
  
  // إعادة تعيين القوائم التالية
  document.getElementById('emergencyTeacher').innerHTML = '<option value="">اختر الأستاذ...</option>';
  document.getElementById('emergencyTeacher').disabled = true;
  document.getElementById('emergencyGroupSelect').innerHTML = '<option value="">ستظهر المجموعات هنا بعد اختيار الأستاذ...</option>';
  document.getElementById('emergencyGroupSelect').disabled = true;
  document.getElementById('selectedGroupInfo').style.display = 'none';
  
  if (!selectedLevel || !selectedClass) {
    subjectSelect.innerHTML = '<option value="">اختر المادة...</option>';
    subjectSelect.disabled = true;
    return;
  }
  
  // فلترة المجموعات حسب المستوى والصف
  const filteredGroups = emergencyGroupsData.filter(group => 
    group.levels.includes(selectedLevel) && group.classes.includes(selectedClass)
  );
  
  // جمع المواد المتاحة
  const subjects = [...new Set(filteredGroups.map(group => group.subject))];
  
  subjectSelect.innerHTML = '<option value="">اختر المادة...</option>';
  subjects.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject;
    option.textContent = subject;
    subjectSelect.appendChild(option);
  });
  
  subjectSelect.disabled = false;
}

function loadEmergencyTeachers() {
  const selectedLevel = document.getElementById('emergencyLevel').value;
  const selectedClass = document.getElementById('emergencyClass').value;
  const selectedSubject = document.getElementById('emergencySubject').value;
  const teacherSelect = document.getElementById('emergencyTeacher');
  
  // إعادة تعيين القوائم التالية
  document.getElementById('emergencyGroupSelect').innerHTML = '<option value="">ستظهر المجموعات هنا بعد اختيار الأستاذ...</option>';
  document.getElementById('emergencyGroupSelect').disabled = true;
  document.getElementById('selectedGroupInfo').style.display = 'none';
  
  if (!selectedLevel || !selectedClass || !selectedSubject) {
    teacherSelect.innerHTML = '<option value="">اختر الأستاذ...</option>';
    teacherSelect.disabled = true;
    return;
  }
  
  // فلترة المجموعات حسب جميع المعايير السابقة
  const filteredGroups = emergencyGroupsData.filter(group => 
    group.levels.includes(selectedLevel) && 
    group.classes.includes(selectedClass) &&
    group.subject === selectedSubject
  );
  
  // جمع الأساتذة المتاحين
  const teachers = [...new Set(filteredGroups.map(group => group.teacher))];
  
  teacherSelect.innerHTML = '<option value="">اختر الأستاذ...</option>';
  teachers.forEach(teacher => {
    const option = document.createElement('option');
    option.value = teacher;
    option.textContent = teacher;
    teacherSelect.appendChild(option);
  });
  
  teacherSelect.disabled = false;
}

function loadEmergencyGroups() {
  const selectedLevel = document.getElementById('emergencyLevel').value;
  const selectedClass = document.getElementById('emergencyClass').value;
  const selectedSubject = document.getElementById('emergencySubject').value;
  const selectedTeacher = document.getElementById('emergencyTeacher').value;
  const groupSelect = document.getElementById('emergencyGroupSelect');
  
  // إخفاء تفاصيل المجموعة
  document.getElementById('selectedGroupInfo').style.display = 'none';
  
  if (!selectedLevel || !selectedClass || !selectedSubject || !selectedTeacher) {
    groupSelect.innerHTML = '<option value="">ستظهر المجموعات هنا بعد اختيار الأستاذ...</option>';
    groupSelect.disabled = true;
    return;
  }
  
  // فلترة المجموعات النهائية
  const finalGroups = emergencyGroupsData.filter(group => 
    group.levels.includes(selectedLevel) && 
    group.classes.includes(selectedClass) &&
    group.subject === selectedSubject &&
    group.teacher === selectedTeacher
  );
  
  groupSelect.innerHTML = '<option value="">اختر المجموعة النهائية...</option>';
  finalGroups.forEach(group => {
    const option = document.createElement('option');
    option.value = group.groupId;
    // عرض اسم المجموعة أو التفاصيل كاملة
    option.textContent = group.name || `${group.groupId} - أيام: ${group.days.join('، ')} - وقت: ${group.startTime} - ${group.endTime}`;
    groupSelect.appendChild(option);
  });
  
  // إضافة حدث تغيير لعرض تفاصيل المجموعة
  groupSelect.onchange = function() {
    const selectedGroupId = this.value;
    if (selectedGroupId) {
      const selectedGroup = finalGroups.find(group => group.groupId === selectedGroupId);
      if (selectedGroup) {
        showSelectedGroupDetails(selectedGroup);
      }
    } else {
      document.getElementById('selectedGroupInfo').style.display = 'none';
    }
  };
  
  groupSelect.disabled = false;
}

function showSelectedGroupDetails(group) {
  const detailsDiv = document.getElementById('groupDetailsDisplay');
  detailsDiv.innerHTML = `
    <strong>معرف المجموعة:</strong> ${group.groupId}<br>
    <strong>المادة:</strong> ${group.subject}<br>
    <strong>الأستاذ:</strong> ${group.teacher}<br>
    <strong>المستوى:</strong> ${group.levels.join('، ')}<br>
    <strong>الصف:</strong> ${group.classes.join('، ')}<br>
    <strong>الأيام:</strong> ${group.days.join('، ')}<br>
    <strong>الوقت:</strong> ${group.startTime} - ${group.endTime}
  `;
  document.getElementById('selectedGroupInfo').style.display = 'block';
}

function hideEmergencySection() {
  document.getElementById('emergencySection').style.display = 'none';
  // إعادة تعيين القيم
  resetEmergencySelects();
}


async function showDateChoiceDialog() {
  // 🌍 استخدام النظام الذكي الجديد للمناطق الزمنية
  
  let today, tomorrow;
  
  try {
    // الحصول على إعدادات المنطقة الزمنية من النظام
    const settingsRes = await fetch('/system-settings');
    const settingsData = await settingsRes.json();
    
    let institutionTimezone = 'Africa/Cairo'; // افتراضي
    if (settingsData.success && settingsData.settings?.institutionTimezone) {
      institutionTimezone = settingsData.settings.institutionTimezone;
    }
    
    // استخدام Date object بسيط
    const now = new Date();
    today = now;
    tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log('🌍 Emergency Update - النظام الذكي:');
    console.log('🏫 المنطقة الزمنية للمؤسسة:', institutionTimezone);
    console.log('🌐 المنطقة الزمنية للمستخدم:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log('📅 التاريخ المحلي:', today.toISOString());
    
  } catch (error) {
    console.warn('تعذر الحصول على إعدادات المنطقة الزمنية، استخدام الوقت المحلي');
    today = new Date();
    tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
  }
  
  // تنسيق التواريخ للعرض بطريقة بسيطة ومضمونة
  const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  const todayFormattedDisplay = `${daysAr[today.getDay()]} ${today.getDate()} ${monthsAr[today.getMonth()]}`;
  const tomorrowFormattedDisplay = `${daysAr[tomorrow.getDay()]} ${tomorrow.getDate()} ${monthsAr[tomorrow.getMonth()]}`;
  
  // إنشاء نافذة اختيار مخصصة بتصميم موحد مع الصفحة
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.6);
      backdrop-filter: blur(3px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-in;
    `;
    
    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
        padding: 35px;
        border-radius: 12px;
        max-width: 550px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1);
        border: 1px solid rgba(255,255,255,0.8);
        animation: slideUp 0.3s ease-out;
      ">
        <h3 style="margin-bottom: 25px; color: #2c3e50; font-size: 22px; font-weight: 600;"> تحديد تاريخ بداية التغيير</h3>
        
        <div style="
          margin: 25px 0;
          padding: 20px;
          background: white;
          border-radius: 8px;
          font-size: 16px;
          line-height: 1.8;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        ">
          <p style="margin: 10px 0;"><strong style="color: #3498db;"> اليوم:</strong> <span style="color: #2c3e50;">${todayFormattedDisplay}</span></p>
          <p style="margin: 10px 0;"><strong style="color: #27ae60;"> غداً:</strong> <span style="color: #2c3e50;">${tomorrowFormattedDisplay}</span></p>
        </div>
        
        <div style="
          margin: 25px 0;
          padding: 18px;
          background: linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 100%);
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.6;
          border-left: 4px solid #3498db;
          text-align: right;
        ">
          <strong style="color: #2980b9; font-size: 15px;">💡 ملحوظة مهمة:</strong><br>
          <span style="color: #34495e;">
            • الأيام قبل التاريخ المختار ستبقى كما هي<br>
            • الأيام من التاريخ المختار فما بعد ستُحدث بالأيام الجديدة
          </span>
        </div>
        
        <div style="margin-top: 30px; display: flex; justify-content: center; gap: 15px; align-items: center; flex-wrap: wrap;">
          <button id="chooseToday" style="
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            padding: 14px 28px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            min-width: 200px;
            box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
            transition: all 0.3s ease;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(52, 152, 219, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(52, 152, 219, 0.3)'">
             من اليوم<br><small style="font-size: 13px; opacity: 0.9;">(${todayFormattedDisplay})</small>
          </button>
          <button id="chooseTomorrow" style="
            background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
            color: white;
            padding: 14px 28px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            min-width: 200px;
            box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
            transition: all 0.3s ease;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(39, 174, 96, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(39, 174, 96, 0.3)'">
             من غداً<br><small style="font-size: 13px; opacity: 0.9;">(${tomorrowFormattedDisplay})</small>
          </button>
        </div>
        
        <div style="margin-top: 20px;">
          <button id="cancelChoice" style="
            background: #95a5a6;
            color: white;
            padding: 10px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='#7f8c8d'" onmouseout="this.style.background='#95a5a6'">
             إلغاء
          </button>
        </div>
      </div>
    `;
    
    // إضافة animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(modal);
    
    document.getElementById('chooseToday').onclick = () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
      resolve('today');
    };
    
    document.getElementById('chooseTomorrow').onclick = () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
      resolve('tomorrow');
    };
    
    document.getElementById('cancelChoice').onclick = () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
      resolve(null);
    };
  });
}

// 🎨 دالة عرض رسالة تنبيه مخصصة
function showCustomAlert(message, type = 'info') {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.6);
      backdrop-filter: blur(3px);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-in;
    `;
    
    const colors = {
      success: { bg: 'linear-gradient(135deg, #d4edda 0%, #e8f5e9 100%)', border: '#27ae60', icon: '✅' },
      error: { bg: 'linear-gradient(135deg, #f8d7da 0%, #ffe6e6 100%)', border: '#e74c3c', icon: '❌' },
      warning: { bg: 'linear-gradient(135deg, #fff3cd 0%, #fff9e6 100%)', border: '#f39c12', icon: '⚠️' },
      info: { bg: 'linear-gradient(135deg, #d1ecf1 0%, #e8f4f8 100%)', border: '#3498db', icon: 'ℹ️' }
    };
    
    const style = colors[type] || colors.info;
    
    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
        padding: 35px;
        border-radius: 12px;
        max-width: 550px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1);
        border: 1px solid rgba(255,255,255,0.8);
        animation: slideUp 0.3s ease-out;
      ">
        <div style="font-size: 48px; margin-bottom: 20px;">${style.icon}</div>
        <div style="
          color: #2c3e50;
          font-size: 15px;
          line-height: 1.8;
          text-align: center;
          margin-bottom: 25px;
        ">
          ${message}
        </div>
        <button id="alertOk" style="
          background: ${style.border};
          color: white;
          padding: 12px 40px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'">
          حسناً
        </button>
      </div>
    `;
    
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styleTag);
    
    document.body.appendChild(modal);
    
    document.getElementById('alertOk').onclick = () => {
      document.body.removeChild(modal);
      document.head.removeChild(styleTag);
      resolve(true);
    };
  });
}

// 🎨 دالة عرض رسالة تأكيد مخصصة
function showCustomConfirm(message, question = 'هل أنت متأكد؟') {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.6);
      backdrop-filter: blur(3px);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-in;
    `;
    
    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
        padding: 35px;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1);
        border: 1px solid rgba(255,255,255,0.8);
        animation: slideUp 0.3s ease-out;
      ">
        <div style="font-size: 48px; margin-bottom: 20px;">❓</div>
        <div style="
          color: #2c3e50;
          font-size: 15px;
          line-height: 1.8;
          text-align: center;
          margin-bottom: 20px;
        ">
          ${message}
        </div>
        <div style="
          font-size: 17px;
          font-weight: 600;
          color: #34495e;
          margin-bottom: 25px;
        ">
          ${question}
        </div>
        <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
          <button id="confirmYes" style="
            background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
            color: white;
            padding: 12px 35px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
            transition: all 0.3s ease;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(39, 174, 96, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(39, 174, 96, 0.3)'">
             نعم، متابعة
          </button>
          <button id="confirmNo" style="
            background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
            color: white;
            padding: 12px 35px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(149, 165, 166, 0.3);
            transition: all 0.3s ease;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(149, 165, 166, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(149, 165, 166, 0.3)'">
             لا، إلغاء
          </button>
        </div>
      </div>
    `;
    
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styleTag);
    
    document.body.appendChild(modal);
    
    document.getElementById('confirmYes').onclick = () => {
      document.body.removeChild(modal);
      document.head.removeChild(styleTag);
      resolve(true);
    };
    
    document.getElementById('confirmNo').onclick = () => {
      document.body.removeChild(modal);
      document.head.removeChild(styleTag);
      resolve(false);
    };
  });
}

function getCurrentSelectedGroup() {
  // أولاً: من قسم الطوارئ
  const emergencySelect = document.getElementById('emergencyGroupSelect');
  if (emergencySelect && emergencySelect.value && emergencySelect.value !== '') {
    return emergencySelect.value;
  }
  
  // ثانياً: البحث عن المجموعة المختارة حالياً في النموذج
  const groupSelect = document.querySelector('#groupFilter');
  if (groupSelect && groupSelect.value && groupSelect.value !== 'all') {
    return groupSelect.value;
  }
  
  // ثالثاً: البحث في نموذج إضافة المجموعات
  const addGroupForm = document.querySelector('#groupForm');
  if (addGroupForm) {
    const groupIdField = addGroupForm.querySelector('[name="groupId"]');
    if (groupIdField && groupIdField.value) {
      return groupIdField.value;
    }
  }
  
  return null;
}

function getGroupDisplayName(groupId) {
  // أولاً: من قسم الطوارئ
  const emergencySelect = document.getElementById('emergencyGroupSelect');
  if (emergencySelect) {
    const option = emergencySelect.querySelector(`option[value="${groupId}"]`);
    if (option) {
      return option.textContent;
    }
  }
  
  // ثانياً: محاولة الحصول على اسم المجموعة من البيانات المحملة
  const groupSelect = document.querySelector('#groupFilter');
  if (groupSelect) {
    const option = groupSelect.querySelector(`option[value="${groupId}"]`);
    if (option) {
      return option.textContent;
    }
  }
  
  return groupId; // في حالة عدم الوجود، عرض الـ ID
}

// ⚙️ دوال إدارة إعدادات النظام
function showSystemSettings() {
  console.log('🔧 تم الضغط على زر إعدادات النظام');
  loadSystemSettings();
  
  // إظهار الطبقة الخلفية
  document.getElementById('systemSettingsOverlay').style.display = 'block';
  
  // انزلاق القائمة من اليمين
  const sidePanel = document.getElementById('systemSettingsSection');
  sidePanel.style.right = '0px';
  
  // إضافة تأثير للجسم الرئيسي
  document.body.style.overflow = 'hidden';
  
  console.log('✅ تم فتح قائمة إعدادات النظام الجانبية');
}

function hideSystemSettings() {
  // إخفاء القائمة
  const sidePanel = document.getElementById('systemSettingsSection');
  sidePanel.style.right = '-400px';
  
  // إخفاء الطبقة الخلفية
  setTimeout(() => {
    document.getElementById('systemSettingsOverlay').style.display = 'none';
  }, 300);
  
  // إرجاع التمرير للجسم الرئيسي
  document.body.style.overflow = 'auto';
  
  console.log('✅ تم إغلاق قائمة إعدادات النظام الجانبية');
}

// 👤 دوال إدارة الملف الشخصي
function showUserProfile() {
  // إظهار الطبقة الخلفية
  document.getElementById('userProfileOverlay').style.display = 'block';
  
  // انزلاق القائمة من اليسار
  const sidePanel = document.getElementById('userProfileSection');
  sidePanel.style.left = '0px';
  
  // إضافة تأثير للجسم الرئيسي
  document.body.style.overflow = 'hidden';
  
  console.log('✅ تم فتح قائمة الملف الشخصي الجانبية');
}

function hideUserProfile() {
  // إخفاء القائمة
  const sidePanel = document.getElementById('userProfileSection');
  sidePanel.style.left = '-400px';
  
  // إخفاء الطبقة الخلفية
  setTimeout(() => {
    document.getElementById('userProfileOverlay').style.display = 'none';
  }, 300);
  
  // إرجاع التمرير للجسم الرئيسي
  document.body.style.overflow = 'auto';
  
  console.log('✅ تم إغلاق قائمة الملف الشخصي الجانبية');
}

// دالة تسجيل الخروج المحسنة
function logout() {
  console.log('🔥 تم النقر على زر تسجيل الخروج!');
  
  if (confirm('هل تريد تسجيل الخروج؟')) {
    console.log('✅ المستخدم وافق على تسجيل الخروج');
    
    // مسح جميع البيانات
    localStorage.clear();
    console.log('🗑️ تم مسح localStorage');
    
    // إعادة التوجيه فوراً
    console.log('🚀 إعادة توجيه لصفحة login.html');
    window.location.replace('login.html');
    
  } else {
    console.log('❌ المستخدم ألغى عملية تسجيل الخروج');
  }
}

async function loadSystemSettings() {
  try {
    console.log('🔄 بدء تحميل إعدادات النظام...');
    console.log('🌐 الطلب إلى: http://localhost:3001/api/system-settings');
    
    const response = await fetch('http://localhost:3001/api/system-settings');
    console.log('📡 تم استلام الاستجابة:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📋 البيانات المستلمة:', data);
    
    if (data.success) {
      const settings = data.settings;
      const timezones = data.availableTimezones;
      
      // ملء بيانات المؤسسة
      document.getElementById('institutionName').value = settings.institutionName || '';      
      // ملء قائمة المناطق الزمنية
      const timezoneSelect = document.getElementById('institutionTimezone');
      timezoneSelect.innerHTML = '';
      
      // تجميع حسب المنطقة
      const regions = {};
      timezones.forEach(tz => {
        if (!regions[tz.region]) {
          regions[tz.region] = [];
        }
        regions[tz.region].push(tz);
      });
      
      // إضافة المناطق مع التجميع
      Object.keys(regions).forEach(region => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = region;
        
        regions[region].forEach(tz => {
          const option = document.createElement('option');
          option.value = tz.value;
          option.textContent = tz.label;
          if (tz.value === settings.institutionTimezone) {
            option.selected = true;
          }
          optgroup.appendChild(option);
        });
        
        timezoneSelect.appendChild(optgroup);
      });
      
      // عرض معلومات النظام
      displaySystemInfo(settings);
      
      // تحديث عرض العملة
      refreshCurrencyDisplay();
      
      console.log('✅ تم تحميل إعدادات النظام بنجاح');
      
    } else {
      console.log('❌ فشل في تحميل الإعدادات:', data);
      alert('فشل تحميل إعدادات النظام');
    }
  } catch (error) {
    console.error('❌ خطأ في تحميل الإعدادات:', error);
    alert('خطأ في الاتصال بالخادم');
  }
}

// دالة إعادة تحميل الإعدادات مع رسالة تأكيد
async function reloadSystemSettings() {
  try {
    await loadSystemSettings();
    alert('✅ تم إعادة تحميل الإعدادات بنجاح!');
  } catch (error) {
    console.error('خطأ في إعادة التحميل:', error);
    alert('❌ خطأ في إعادة تحميل الإعدادات');
  }
}

function displaySystemInfo(settings) {
  console.log('📊 بدء عرض معلومات النظام:', settings);
  const now = new Date();
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const info = `
🏫 المنطقة الزمنية للمؤسسة: ${settings.institutionTimezone}
📍 مصدر المنطقة الزمنية: ${getTimezoneSourceLabel(settings.timezoneSource)}
🕐 آخر تحديث: ${new Date(settings.detectedAt).toLocaleString('ar-EG')}
${settings.detectedCountry ? `🌍 الدولة المُكتشفة: ${settings.detectedCountry}` : ''}
${settings.detectedCity ? `🏙️ المدينة المُكتشفة: ${settings.detectedCity}` : ''}

� إعدادات العملة:
💰 العملة الحالية: ${currentCurrency.name}
🔤 الرمز: ${currentCurrency.symbol}
🌍 الدولة: ${currentCurrency.country}
📝 مثال: ${formatPrice(100)}

�👤 معلومات المستخدم الحالي:
📍 المنطقة الزمنية: ${userTimezone}
🕐 الوقت المحلي: ${now.toLocaleString('ar-EG')}

📊 معلومات النظام:
📅 تم الإنشاء: ${new Date(settings.createdAt).toLocaleString('ar-EG')}
🔄 آخر تحديث: ${new Date(settings.updatedAt).toLocaleString('ar-EG')}
  `;
  
  document.getElementById('systemInfo').textContent = info.trim();
  console.log('📋 تم تحديث معلومات النظام في الواجهة');
}

function getTimezoneSourceLabel(source) {
  const sources = {
    'manual': 'تم ضبطه يدوياً',
    'ip-detection': 'كشف تلقائي من IP',
    'worldtimeapi': 'كشف تلقائي من خدمة خارجية',
    'env-variable': 'من متغير البيئة',
    'default': 'افتراضي',
    'server-timezone': 'من المنطقة الزمنية للسيرفر',
    'fallback': 'احتياطي'
  };
  return sources[source] || source;
}

async function saveSystemSettings() {
  try {
    console.log('💾 بدء حفظ إعدادات النظام...');
    
    const settings = {
      institutionName: document.getElementById('institutionName').value.trim(),
      institutionTimezone: document.getElementById('institutionTimezone').value
    };
    
    console.log('📋 الإعدادات المراد حفظها:', settings);
    
    if (!settings.institutionTimezone) {
      alert('يرجى اختيار المنطقة الزمنية');
      return;
    }
    
    console.log('🌐 الطلب إلى: http://localhost:3001/api/system-settings');
    
    const response = await fetch('http://localhost:3001/api/system-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    
    console.log('📡 استجابة حفظ الإعدادات:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('📋 نتيجة حفظ الإعدادات:', data);
    
    if (data.success) {
      // تحديث العملة في المتغير العام
      if (data.currency) {
        currentCurrency = data.currency;
        console.log(`💱 تم تحديث العملة: ${currentCurrency.name} (${currentCurrency.symbol})`);
        
        // تحديث معلومات النظام
        if (data.settings) {
          displaySystemInfo(data.settings);
        }
        
        // تحديث placeholders الأسعار
        updateCurrencyPlaceholders();
        
        // إعادة تحميل المجموعات لإظهار العملة الجديدة
        if (typeof loadGroups === 'function') {
          loadGroups();
        }
      }
      
      alert('✅ تم حفظ الإعدادات بنجاح!\n💱 تم تحديث العملة تلقائياً');
      hideSystemSettings();
    } else {
      alert('فشل حفظ الإعدادات: ' + (data.error || 'خطأ غير معروف'));
    }
  } catch (error) {
    console.error('خطأ في حفظ الإعدادات:', error);
    alert('خطأ في الاتصال بالخادم: ' + error.message);
  }
}

async function autoDetectTimezone() {
  try {
    console.log('🔍 بدء الكشف التلقائي للمنطقة الزمنية والعملة...');
    
    const loadingMsg = document.createElement('div');
    loadingMsg.textContent = '🔍 جاري الكشف التلقائي للمنطقة الزمنية والعملة...';
    loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:20px;border:2px solid #28a745;border-radius:8px;z-index:9999;';
    document.body.appendChild(loadingMsg);
    
    console.log('🌐 الطلب إلى: http://localhost:3001/api/system-settings/auto-detect-timezone');
    
    const response = await fetch('http://localhost:3001/api/system-settings/auto-detect-timezone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('📡 استجابة الكشف التلقائي:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('📋 بيانات الكشف التلقائي:', data);
    
    document.body.removeChild(loadingMsg);
    
    if (data.success) {
      // تحديث العملة المحلية من response
      if (data.currency) {
        currentCurrency = data.currency;
        console.log(`💱 تم تحديث العملة: ${currentCurrency.name} (${currentCurrency.symbol})`);
        
        // تحديث العرض
        updateCurrencyPlaceholders();
        
        // إعادة تحميل المجموعات لإظهار العملة الجديدة
        if (typeof loadGroups === 'function') {
          loadGroups();
        }
        
        alert(`✅ تم الكشف التلقائي بنجاح!\n\n📍 المنطقة الزمنية: ${data.detected.timezone}\n🌍 الدولة: ${data.detected.country || 'غير محدد'}\n🏙️ المدينة: ${data.detected.city || 'غير محدد'}\n\n💱 العملة: ${data.currency.name}\n💰 الرمز: ${data.currency.symbol}`);
      } else {
        alert(`تم كشف المنطقة الزمنية: ${data.detected.timezone}\nالدولة: ${data.detected.country || 'غير محدد'}\nالمدينة: ${data.detected.city || 'غير محدد'}`);
      }
      
      loadSystemSettings(); // إعادة تحميل لإظهار التحديث
    } else {
      alert('فشل الكشف التلقائي. يرجى اختيار المنطقة يدوياً من القائمة.');
    }
  } catch (error) {
    // إزالة رسالة التحميل في حالة الخطأ
    const loadingMsg = document.querySelector('div[style*="position:fixed"][style*="top:50%"]');
    if (loadingMsg) {
      document.body.removeChild(loadingMsg);
    }
    
    console.error('خطأ في الكشف التلقائي:', error);
    alert('خطأ في الكشف التلقائي: ' + error.message);
  }
}

// 💱 تحديث العملة تلقائياً من المنطقة الزمنية
async function updateCurrencyFromTimezone() {
  try {
    console.log('💱 بدء تحديث العملة تلقائياً...');
    
    const loadingMsg = document.createElement('div');
    loadingMsg.textContent = '💱 جاري تحديث العملة تلقائياً...';
    loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:20px;border:2px solid #ffc107;border-radius:8px;z-index:9999;';
    document.body.appendChild(loadingMsg);
    
    const response = await fetch('http://localhost:3001/api/system-settings/currency/auto-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    console.log('💱 نتيجة تحديث العملة:', data);
    
    document.body.removeChild(loadingMsg);
    
    if (data.success) {
      // تحديث العملة المحلية
      currentCurrency = data.currency;
      
      // تحديث العرض
      refreshCurrencyDisplay();
      updateCurrencyPlaceholders();
      
      // إعادة تحميل المجموعات لإظهار العملة الجديدة
      if (typeof loadGroups === 'function') {
        loadGroups();
      }
      
      alert(`✅ تم تحديث العملة تلقائياً!\n\nالعملة الجديدة: ${data.currency.name}\nالرمز: ${data.currency.symbol}\nالدولة: ${data.currency.country}`);
    } else {
      alert('فشل تحديث العملة تلقائياً');
    }
  } catch (error) {
    // إزالة رسالة التحميل في حالة الخطأ
    const loadingMsg = document.querySelector('div[style*="position:fixed"][style*="top:50%"]');
    if (loadingMsg) {
      document.body.removeChild(loadingMsg);
    }
    
    console.error('خطأ في تحديث العملة:', error);
    alert('خطأ في تحديث العملة: ' + error.message);
  }
}

// 🔄 تحديث عرض العملة الحالية
async function refreshCurrencyDisplay() {
  try {
    const response = await fetch('http://localhost:3001/api/system-settings/currency');
    const data = await response.json();
    
    if (data.success && data.currency) {
      currentCurrency = data.currency;
      console.log('💱 تم تحديث العملة:', data.currency);
      
      // تحديث معلومات النظام بعد تحديث العملة
      const settingsResponse = await fetch('http://localhost:3001/api/system-settings');
      const settingsData = await settingsResponse.json();
      if (settingsData.success) {
        displaySystemInfo(settingsData.settings);
      }
    }
  } catch (error) {
    console.error('خطأ في تحديث عرض العملة:', error);
  }
}

async function emergencyUpdate() {
  try {
    // 1. التحقق من البيانات الأساسية
    const groupId = getCurrentSelectedGroup();
    
    if (!groupId) {
      await showCustomAlert(' يرجى اختيار مجموعة للتحديث', 'error');
      return;
    }
    
    // 2. عرض معلومات المجموعة المختارة
    const groupName = getGroupDisplayName(groupId);
    
    const preConfirm = await showCustomConfirm(`
      <strong style="font-size: 18px; color: #2c3e50;"> تأكيد اختيار المجموعة</strong><br><br>
      <div style="text-align: right; line-height: 1.8;">
        • <strong>المجموعة المختارة:</strong> ${groupName}<br>
        • <strong>معرف المجموعة:</strong> ${groupId}
      </div>
    `, 'هل هذه هي المجموعة الصحيحة؟');
    
    if (!preConfirm) return;
    
    // 3. عرض خيارات تاريخ البداية
    const startChoice = await showDateChoiceDialog();
    
    if (!startChoice) {
      return; // المستخدم ألغى العملية
    }
    
    // 4. تأكيد نهائي مع التفاصيل
    const today = new Date();
    const startDate = startChoice === 'today' ? today : 
      new Date(today.getTime() + 24*60*60*1000);
    
    // تنسيق التاريخ بطريقة بسيطة
    const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const startDateFormatted = `${daysAr[startDate.getDay()]} ${startDate.getDate()} ${monthsAr[startDate.getMonth()]}`;
    
    const finalConfirm = await showCustomConfirm(`
      <strong style="font-size: 20px; color: #e74c3c;"> تأكيد نهائي للتحديث الطارئ</strong><br><br>
      <div style="background: linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 100%); padding: 15px; border-radius: 8px; text-align: right; line-height: 1.8; margin: 15px 0;">
        <strong style="color: #2980b9; font-size: 16px;">📋 تفاصيل العملية:</strong><br>
        • <strong>المجموعة:</strong> ${groupName}<br>
        • <strong>معرف المجموعة:</strong> ${groupId}<br>
        • <strong>تاريخ البداية:</strong> ${startDateFormatted}
      </div>
      <div style="background: linear-gradient(135deg, #fff9e6 0%, #fffbf0 100%); padding: 15px; border-radius: 8px; text-align: right; line-height: 1.8; border-left: 4px solid #f39c12;">
        <strong style="color: #d68910; font-size: 16px;">🔄 ما سيحدث:</strong><br>
        • الأيام قبل <strong>${startDateFormatted}</strong> → تُحفظ كما هي <br>
        • الأيام من <strong>${startDateFormatted}</strong> فما بعد → تُحدث بالأيام الجديدة 
      </div>
    `, 'هل تريد المتابعة؟');
    
    if (!finalConfirm) return;
    
    // 5. إرسال الطلب
    const loadingMessage = document.createElement('div');
    loadingMessage.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 32px; margin-bottom: 10px;">⏳</div>
        <div style="font-size: 16px; font-weight: 600;">جاري التحديث الطارئ...</div>
        <div style="font-size: 13px; color: #7f8c8d; margin-top: 5px;">الرجاء الانتظار</div>
      </div>
    `;
    loadingMessage.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
      padding: 30px 40px;
      border: none;
      border-radius: 12px;
      z-index: 9999;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(loadingMessage);
    
    const response = await fetch('/api/attendance/emergency-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        groupId,
        startFrom: startChoice
      })
    });
    
    document.body.removeChild(loadingMessage);
    
    // تحقق من حالة الاستجابة
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'فشل الاتصال بالخادم';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorText;
      } catch (e) {
        errorMessage = errorText || 'خطأ غير معروف';
      }
      
      await showCustomAlert(`❌ خطأ في التحديث:<br><br>${errorMessage}`, 'error');
      return;
    }
    
    const result = await response.json();
    
    if (result.success) {
      // تنسيق التواريخ من السيرفر
      const resultStartDate = new Date(result.startDate);
      const resultTimestamp = new Date(result.timestamp);
      const resultStartFormatted = `${daysAr[resultStartDate.getDay()]} ${resultStartDate.getDate()} ${monthsAr[resultStartDate.getMonth()]}`;
      const resultTimeFormatted = `${resultTimestamp.getDate()}/${resultTimestamp.getMonth()+1}/${resultTimestamp.getFullYear()} ${resultTimestamp.getHours()}:${String(resultTimestamp.getMinutes()).padStart(2,'0')}`;
      
      await showCustomAlert(`
        <strong style="font-size: 20px; color: #27ae60;"> تم التحديث الطارئ بنجاح!</strong><br><br>
        <div style="background: linear-gradient(135deg, #e8f8f5 0%, #f0fff4 100%); padding: 18px; border-radius: 8px; text-align: right; line-height: 2; border-left: 4px solid #27ae60;">
          <strong style="color: #229954; font-size: 16px;">📊 إحصائيات العملية:</strong><br>
          • <strong>المجموعة:</strong> ${groupName}<br>
          • <strong>عدد الطلاب المحدثين:</strong> ${result.updatedRecords} طالب<br>
          • <strong>الأيام الماضية المحفوظة:</strong> ${result.preservedPastDays} يوم<br>
          • <strong>الأيام المستقبلية المُعاد بناؤها:</strong> ${result.rebuiltFutureDays} يوم<br>
          • <strong>الشهر المستهدف:</strong> ${result.targetMonth}<br>
          • <strong>تاريخ البداية:</strong> ${resultStartFormatted}<br>
          • <strong>وقت العملية:</strong> ${resultTimeFormatted}
        </div>
        <div style="margin-top: 15px; padding: 12px; background: linear-gradient(135deg, #fff3cd 0%, #fff9e6 100%); border-radius: 8px; text-align: center; font-size: 15px; font-weight: 600; color: #856404;">
          🎯 النتيجة: لا يوجد فقدان للبيانات التاريخية!
        </div>
      `, 'success');
      
      // إخفاء قسم الطوارئ
      hideEmergencySection();
      
      // إعادة تحميل البيانات إذا كان في قسم الحضور
      if (typeof loadAttendanceData === 'function') {
        loadAttendanceData();
      }
      
    } else {
      await showCustomAlert(` خطأ في التحديث:<br><br>${result.error}`, 'error');
    }
    
  } catch (error) {
    console.error('خطأ في التحديث الطارئ:', error);
    
    // حذف رسالة التحميل إذا كانت موجودة
    const loadingMessage = document.querySelector('[style*="z-index: 9999"]');
    if (loadingMessage && document.body.contains(loadingMessage)) {
      document.body.removeChild(loadingMessage);
    }
    
    // عرض رسالة خطأ واضحة
    const errorMessage = error.message || 'خطأ غير معروف في الاتصال';
    await showCustomAlert(`❌ خطأ في الاتصال:<br><br>${errorMessage}`, 'error');
  }
}

// ⚙️ إضافة مستمع الأحداث للتحكم في القوائم الجانبية بواسطة مفتاح Escape
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const systemSettingsPanel = document.getElementById('systemSettingsSection');
    const systemSettingsOverlay = document.getElementById('systemSettingsOverlay');
    const userProfilePanel = document.getElementById('userProfileSection');
    const userProfileOverlay = document.getElementById('userProfileOverlay');
    
    // إذا كانت قائمة الإعدادات مفتوحة، أغلقها
    if (systemSettingsPanel && systemSettingsOverlay && systemSettingsOverlay.style.display === 'block') {
      hideSystemSettings();
    }
    // إذا كانت قائمة الملف الشخصي مفتوحة، أغلقها
    else if (userProfilePanel && userProfileOverlay && userProfileOverlay.style.display === 'block') {
      hideUserProfile();
    }
  }
});

// 🚀 دوال التنقل في الـ Navbar
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    // حساب المسافة مع مراعاة ارتفاع الـ navbar (70px + 20px margin)
    const navbarHeight = 90;
    const elementPosition = section.offsetTop - navbarHeight;
    
    // انتقال ناعم إلى القسم
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
    
    // إضافة تأثير مؤقت للقسم المستهدف
    section.style.transition = 'all 0.3s ease';
    section.style.transform = 'scale(1.02)';
    section.style.boxShadow = '0 4px 20px rgba(0,123,255,0.2)';
    
    setTimeout(() => {
      section.style.transform = 'scale(1)';
      section.style.boxShadow = 'none';
    }, 600);
    
    console.log(`🎯 تم الانتقال إلى قسم: ${sectionId}`);
  } else {
    console.warn(`⚠️ لم يتم العثور على القسم: ${sectionId}`);
  }
}

// إضافة تأثير تمرير الـ navbar
window.addEventListener('scroll', function() {
  const navbar = document.getElementById('mainNavbar');
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  if (scrollTop > 50) {
    navbar.style.background = 'linear-gradient(135deg, rgba(0,123,255,0.95) 0%, rgba(0,86,179,0.95) 100%)';
    navbar.style.backdropFilter = 'blur(20px)';
    navbar.style.boxShadow = '0 4px 20px rgba(0,123,255,0.4)';
  } else {
    navbar.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
    navbar.style.backdropFilter = 'none';
    navbar.style.boxShadow = '0 2px 10px rgba(0,123,255,0.3)';
  }
});

console.log('✅ تم تحميل جميع دوال النظام بنجاح - مع الـ Navbar والقائمة الجانبية');

// 🔧 دوال إدارة الملف الشخصي
function generateNewPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) password += chars[Math.floor(Math.random() * chars.length)];
  
  const newPasswordField = document.getElementById('newPassword');
  const confirmPasswordField = document.getElementById('confirmPassword');
  
  if (newPasswordField && confirmPasswordField) {
    newPasswordField.value = password;
    confirmPasswordField.value = password;
    
    // إضافة تأثير بصري للإشارة إلى التغيير
    newPasswordField.style.background = '#d4edda';
    confirmPasswordField.style.background = '#d4edda';
    
    setTimeout(() => {
      newPasswordField.style.background = '';
      confirmPasswordField.style.background = '';
    }, 2000);
  }
}

function showEditProfileForm() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // التحقق من وجود النموذج وإزالته إذا كان موجود
  const existingForm = document.getElementById('editProfileFormSection');
  if (existingForm) {
    existingForm.remove();
    return;
  }
  
  // إنشاء النموذج المدمج في الشريط الجانبي
  const formHtml = `
    <div id="editProfileFormSection" style="
      margin-top: 15px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
      border: 2px solid #28a745;
    ">
      <h5 style="color: #28a745; margin-bottom: 15px; text-align: center;">📝 تعديل المعلومات الشخصية</h5>
      
      <form id="editProfileForm">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #495057; font-size: 12px; font-weight: bold;">الاسم الأول:</label>
          <input type="text" id="editFirstName" value="${user.firstName || ''}" style="
            width: 100%;
            padding: 8px;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            font-size: 13px;
            box-sizing: border-box;
          " required>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #495057; font-size: 12px; font-weight: bold;">الاسم الأخير:</label>
          <input type="text" id="editLastName" value="${user.lastName || ''}" style="
            width: 100%;
            padding: 8px;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            font-size: 13px;
            box-sizing: border-box;
          " required>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; color: #495057; font-size: 12px; font-weight: bold;">اسم المستخدم:</label>
          <input type="text" id="editUsername" value="${user.username || ''}" style="
            width: 100%;
            padding: 8px;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            font-size: 13px;
            box-sizing: border-box;
            background-color: #e9ecef;
            cursor: not-allowed;
          " required readonly>
        </div>
        
        <div style="display: flex; gap: 10px;">
          <button type="submit" style="
            flex: 1;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            border: none;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
          "> حفظ</button>
          
          <button type="button" onclick="hideEditProfileForm()" style="
            flex: 1;
            background: #6c757d;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
          "> إلغاء</button>
        </div>
      </form>
    </div>
  `;
  
  // إضافة النموذج بعد قسم إعدادات الحساب
  const accountSection = document.querySelector('#userProfileSection > div:nth-child(3)');
  if (accountSection) {
    accountSection.insertAdjacentHTML('afterend', formHtml);
    
    // إضافة دالة توليد اسم المستخدم التلقائي
    function generateEditUsername() {
      const firstName = document.getElementById('editFirstName').value.trim();
      const lastName = document.getElementById('editLastName').value.trim();
      let username = '';
      if (firstName.length >= 3 && lastName.length >= 2) {
        username = firstName.substring(0, 3) + lastName.slice(-2);
      } else if (firstName && lastName) {
        username = firstName + lastName;
      }
      document.getElementById('editUsername').value = username.toLowerCase();
    }
    
    // إضافة event listeners للاسم الأول والأخير
    document.getElementById('editFirstName').addEventListener('input', generateEditUsername);
    document.getElementById('editLastName').addEventListener('input', generateEditUsername);
    
    // إضافة حدث للنموذج
    document.getElementById('editProfileForm').addEventListener('submit', handleProfileUpdate);
  }
}

function hideEditProfileForm() {
  const form = document.getElementById('editProfileFormSection');
  if (form) form.remove();
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const firstName = document.getElementById('editFirstName').value.trim();
  const lastName = document.getElementById('editLastName').value.trim();
  const username = document.getElementById('editUsername').value.trim();
  
  if (!firstName || !lastName || !username) {
    alert('جميع الحقول مطلوبة');
    return;
  }
  
  try {
    const response = await fetch(`/api/users/update-profile/${user._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName,
        lastName,
        username
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      // تحديث البيانات المحلية
      const updatedUser = { ...user, ...result.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // تحديث الواجهة
      updateSidebarUserInfo(updatedUser);
      
      alert('تم تحديث المعلومات الشخصية بنجاح');
      hideEditProfileForm();
    } else {
      alert(result.error || 'حدث خطأ في تحديث المعلومات');
    }
  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    alert('حدث خطأ في الاتصال');
  }
}

function togglePasswordVisibility(fieldId) {
  const field = document.getElementById(fieldId);
  const container = field.parentElement;
  const toggleIcon = container.querySelector('.toggle-password-icon');
  
  if (field.type === 'password') {
    field.type = 'text';
    if (toggleIcon) {
      toggleIcon.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
      toggleIcon.title = 'إخفاء كلمة المرور';
    }
  } else {
    field.type = 'password';
    if (toggleIcon) {
      toggleIcon.innerHTML = '<i class="fa-solid fa-eye"></i>';
      toggleIcon.title = 'إظهار كلمة المرور';
    }
  }
}

function showChangePasswordForm() {
  // التحقق من وجود النموذج وإزالته إذا كان موجود
  const existingForm = document.getElementById('changePasswordFormSection');
  if (existingForm) {
    existingForm.remove();
    return;
  }
  
  // إنشاء النموذج المدمج في الشريط الجانبي
  const formHtml = `
    <div id="changePasswordFormSection" style="
      margin-top: 15px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
      border: 2px solid #007bff;
    ">
      <h5 style="color: #007bff; margin-bottom: 15px; text-align: center;">🔒 تغيير كلمة المرور</h5>
      
      <form id="changePasswordForm">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #495057; font-size: 12px; font-weight: bold;">كلمة المرور الحالية:</label>
          <div style="position: relative;">
            <input type="password" id="currentPassword" style="
              width: 100%;
              padding: 10px 40px 10px 10px;
              border: 1px solid #dee2e6;
              border-radius: 6px;
              font-size: 13px;
              box-sizing: border-box;
            " required>
            <span class="toggle-password-icon" onclick="togglePasswordVisibility('currentPassword')" style="
              position: absolute;
              left: 10px;
              top: 50%;
              transform: translateY(-50%);
              cursor: pointer;
              color: #6c757d;
              font-size: 16px;
              transition: color 0.2s;
            " title="إظهار كلمة المرور">
              <i class="fa-solid fa-eye"></i>
            </span>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #495057; font-size: 12px; font-weight: bold;">كلمة المرور الجديدة:</label>
          <div style="position: relative;">
            <input type="password" id="newPassword" style="
              width: 100%;
              padding: 10px 40px 10px 10px;
              border: 1px solid #dee2e6;
              border-radius: 6px;
              font-size: 13px;
              box-sizing: border-box;
            " required>
            <span class="toggle-password-icon" onclick="togglePasswordVisibility('newPassword')" style="
              position: absolute;
              left: 10px;
              top: 50%;
              transform: translateY(-50%);
              cursor: pointer;
              color: #6c757d;
              font-size: 16px;
              transition: color 0.2s;
            " title="إظهار كلمة المرور">
              <i class="fa-solid fa-eye"></i>
            </span>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; color: #495057; font-size: 12px; font-weight: bold;">تأكيد كلمة المرور:</label>
          <div style="position: relative;">
            <input type="password" id="confirmPassword" style="
              width: 100%;
              padding: 10px 40px 10px 10px;
              border: 1px solid #dee2e6;
              border-radius: 6px;
              font-size: 13px;
              box-sizing: border-box;
            " required>
            <span class="toggle-password-icon" onclick="togglePasswordVisibility('confirmPassword')" style="
              position: absolute;
              left: 10px;
              top: 50%;
              transform: translateY(-50%);
              cursor: pointer;
              color: #6c757d;
              font-size: 16px;
              transition: color 0.2s;
            " title="إظهار كلمة المرور">
              <i class="fa-solid fa-eye"></i>
            </span>
          </div>
        </div>
        
        <div style="display: flex; gap: 10px;">
          <button type="button" onclick="generateNewPassword()" style="
            flex: 1;
            background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%);
            color: white;
            border: none;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          " title="توليد كلمة مرور قوية تلقائياً">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <span>توليد</span>
          </button>
          
          <button type="submit" style="
            flex: 1;
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            border: none;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
          "> تغيير</button>
          
          <button type="button" onclick="hideChangePasswordForm()" style="
            flex: 1;
            background: #6c757d;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
          "> إلغاء</button>
        </div>
      </form>
    </div>
  `;
  
  // إضافة النموذج بعد قسم إعدادات الحساب
  const accountSection = document.querySelector('#userProfileSection > div:nth-child(3)');
  if (accountSection) {
    accountSection.insertAdjacentHTML('afterend', formHtml);
    
    // إضافة حدث للنموذج
    document.getElementById('changePasswordForm').addEventListener('submit', handlePasswordChange);
  }
}

function hideChangePasswordForm() {
  const form = document.getElementById('changePasswordFormSection');
  if (form) form.remove();
}

async function handlePasswordChange(event) {
  event.preventDefault();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    alert('جميع الحقول مطلوبة');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    alert('كلمة المرور الجديدة والتأكيد غير متطابقتين');
    return;
  }
  
  if (newPassword.length < 4) {
    alert('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
    return;
  }
  
  try {
    const response = await fetch(`/api/users/change-password/${user._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      alert('تم تغيير كلمة المرور بنجاح');
      hideChangePasswordForm();
    } else {
      alert(result.error || 'حدث خطأ في تغيير كلمة المرور');
    }
  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error);
    alert('حدث خطأ في الاتصال');
  }
}

// دوال تقارير الدفع
function showPaymentReports() {
  const overlay = document.getElementById('paymentReportsOverlay');
  const section = document.getElementById('paymentReportsSection');
  if (overlay && section) {
    overlay.style.display = 'flex';
    section.style.display = 'flex';
    // تحميل جميع البيانات عند فتح التقارير (بدون ترابط)
    loadAllReportData();
  }
}

function hidePaymentReports() {
  const overlay = document.getElementById('paymentReportsOverlay');
  const section = document.getElementById('paymentReportsSection');
  const tableContainer = document.getElementById('paymentReportTableContainer');
  
  if (overlay && section) {
    overlay.style.display = 'none';
    section.style.display = 'none';
    // مسح المرشحات
    clearReportFilters();
  }
  
  // إخفاء جدول النتائج
  if (tableContainer) {
    tableContainer.style.display = 'none';
  }
}

async function loadReportFilters() {
  try {
    // تحميل المواد
    const subjectsResponse = await fetch('/api/subjects');
    if (subjectsResponse.ok) {
      const subjects = await subjectsResponse.json();
      populateSelect('reportSubject', subjects);
    }
    
    // تحميل المعلمين
    const teachersResponse = await fetch('/api/teachers');
    if (teachersResponse.ok) {
      const teachers = await teachersResponse.json();
      populateSelect('reportTeacher', teachers);
    }
    
  } catch (error) {
    console.error('خطأ في تحميل مرشحات التقرير:', error);
  }
}

function populateSelect(selectId, options) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  // مسح الخيارات الموجودة (عدا الخيار الأول)
  while (select.children.length > 1) {
    select.removeChild(select.lastChild);
  }
  
  // إضافة الخيارات الجديدة
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option._id;
    optionElement.textContent = option.name;
    select.appendChild(optionElement);
  });
}

async function filterClasses() {
  const level = document.getElementById('levelFilter').value;
  if (!level) {
    clearSelect('classFilter');
    return;
  }
  
  try {
    // هنا يمكن تحميل الصفوف بناءً على المستوى
    // مؤقتاً سنستخدم صفوف افتراضية
    const classes = [];
    if (level === 'الابتدائي') {
      classes.push(...['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس']);
    } else if (level === 'المتوسط') {
      classes.push(...['الأول المتوسط', 'الثاني المتوسط', 'الثالث المتوسط']);
    } else if (level === 'الثانوي') {
      classes.push(...['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي']);
    }
    
    populateSelect('classFilter', classes.map(cls => ({ _id: cls, name: cls })));
  } catch (error) {
    console.error('خطأ في تحميل الصفوف:', error);
  }
}

// تحميل جميع القوائم عند فتح تقارير الدفع (بدون ترابط)
async function loadAllReportData() {
  try {
    // تحميل جميع المواد
    const subjectsRes = await fetch('/api/subjects');
    const subjects = await subjectsRes.json();
    const subjectSelect = document.getElementById('reportSubject');
    subjectSelect.innerHTML = '<option value="">اختر المادة</option>';
    subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject.name;
      option.textContent = subject.name;
      subjectSelect.appendChild(option);
    });

    // تحميل جميع الأساتذة
    const teachersRes = await fetch('/api/teachers');
    const teachers = await teachersRes.json();
    const teacherSelect = document.getElementById('reportTeacher');
    teacherSelect.innerHTML = '<option value="">اختر الأستاذ</option>';
    teachers.forEach(teacher => {
      const option = document.createElement('option');
      option.value = teacher.firstName + ' ' + teacher.lastName;
      option.textContent = teacher.firstName + ' ' + teacher.lastName;
      teacherSelect.appendChild(option);
    });

    // تحميل جميع المجموعات
    const groupsRes = await fetch('/api/groups');
    const groups = await groupsRes.json();
    const groupSelect = document.getElementById('reportGroup');
    groupSelect.innerHTML = '<option value="">اختر المجموعة</option>';
    groups.forEach(group => {
      const option = document.createElement('option');
      option.value = group.groupId;
      // عرض اسم المجموعة الجديد
      option.textContent = group.name || `${group.groupId} - ${group.subject} - ${group.teacher}`;
      groupSelect.appendChild(option);
    });

  } catch (error) {
    console.error('خطأ في تحميل بيانات التقارير:', error);
  }
}

function filterReportClasses() {
  const level = document.getElementById('reportLevel').value;
  const classSelect = document.getElementById('reportClass');
  
  // مسح الصفوف الموجودة
  classSelect.innerHTML = '<option value="">اختر الصف</option>';
  
  if (!level) {
    // إضافة جميع الصفوف إذا لم يتم اختيار مستوى
    const allClasses = ['الأول', 'الثانى', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
    allClasses.forEach(cls => {
      const option = document.createElement('option');
      option.value = cls;
      option.textContent = cls;
      classSelect.appendChild(option);
    });
    return;
  }
  
  let classes = [];
  if (level === 'ابتدائى') {
    classes = ['الأول', 'الثانى', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
  } else if (level === 'اعدادى') {
    classes = ['الأول', 'الثانى', 'الثالث'];
  } else if (level === 'ثانوى') {
    classes = ['الأول', 'الثانى', 'الثالث'];
  }
  
  classes.forEach(className => {
    const option = document.createElement('option');
    option.value = className;
    option.textContent = className;
    classSelect.appendChild(option);
  });
}

async function filterSubjects() {
  const level = document.getElementById('levelFilter').value;
  const className = document.getElementById('classFilter').value;
  
  if (!level || !className) {
    return;
  }
  
  try {
    // تصفية المواد بناءً على المستوى والصف
    const subjectsResponse = await fetch('/api/subjects');
    if (subjectsResponse.ok) {
      const allSubjects = await subjectsResponse.json();
      // هنا يمكن تطبيق منطق التصفية
      populateSelect('subjectFilter', allSubjects);
    }
  } catch (error) {
    console.error('خطأ في تصفية المواد:', error);
  }
}

async function filterTeachers() {
  const subject = document.getElementById('subjectFilter').value;
  
  if (!subject) {
    return;
  }
  
  try {
    // تصفية المعلمين بناءً على المادة
    const teachersResponse = await fetch(`/api/teachers?subject=${subject}`);
    if (teachersResponse.ok) {
      const teachers = await teachersResponse.json();
      populateSelect('teacherFilter', teachers);
    }
  } catch (error) {
    console.error('خطأ في تصفية المعلمين:', error);
  }
}

async function filterGroups() {
  const teacher = document.getElementById('teacherFilter').value;
  const subject = document.getElementById('subjectFilter').value;
  
  if (!teacher || !subject) {
    clearSelect('groupFilter');
    return;
  }
  
  try {
    // تحميل المجموعات بناءً على المعلم والمادة
    const groupsResponse = await fetch(`/api/groups?teacher=${teacher}&subject=${subject}`);
    if (groupsResponse.ok) {
      const groups = await groupsResponse.json();
      populateSelect('groupFilter', groups);
    }
  } catch (error) {
    console.error('خطأ في تحميل المجموعات:', error);
  }
}

function clearSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  // مسح جميع الخيارات عدا الأول
  while (select.children.length > 1) {
    select.removeChild(select.lastChild);
  }
  select.selectedIndex = 0;
}

function clearReportFilters() {
  const selects = ['reportLevel', 'reportClass', 'reportSubject', 'reportTeacher', 'reportGroup'];
  selects.forEach(selectId => {
    clearSelect(selectId);
  });
  
  // مسح جدول التقرير
  const tableBody = document.querySelector('#paymentReportTable tbody');
  if (tableBody) {
    tableBody.innerHTML = '';
  }
}

async function generatePaymentReport() {
  console.log('=== تم الضغط على زر إنشاء التقرير ===');
  
  const filters = {
    level: document.getElementById('reportLevel').value,
    class: document.getElementById('reportClass').value,
    subject: document.getElementById('reportSubject').value,
    teacher: document.getElementById('reportTeacher').value,
    group: document.getElementById('reportGroup').value
  };
  
  // التحقق من وجود مرشح واحد على الأقل - تم إزالة هذا الشرط ليعرض جميع الطلاب الذين لديهم أشهر غير مدفوعة
  console.log('المرشحات المختارة:', filters);
  
  try {
    // إرسال طلب للخادم للحصول على بيانات التقرير
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await fetch(`/api/payments/report?${queryParams}`);
    console.log('حالة الاستجابة:', response.status);
    
    if (!response.ok) {
      throw new Error(`فشل في تحميل تقرير الدفع - حالة: ${response.status}`);
    }
    
    const reportData = await response.json();
    console.log('بيانات التقرير المستلمة:', reportData);
    console.log('عدد النتائج:', reportData.length);
    
    displayPaymentReport(reportData);
    
  } catch (error) {
    console.error('خطأ في إنشاء تقرير الدفع:', error);
    alert('حدث خطأ في إنشاء التقرير');
  }
}

function displayPaymentReport(data) {
  console.log('=== بدء عرض تقرير الدفع ===');
  console.log('البيانات الواردة:', data);
  
  // حفظ بيانات التقرير للتصدير
  currentReportData = data;
  
  const tableBody = document.querySelector('#paymentReportTable tbody');
  console.log('جدول النتائج:', tableBody);
  
  const tableContainer = document.getElementById('paymentReportTableContainer');
  console.log('حاوية الجدول:', tableContainer);
  
  const scrollContainer = document.getElementById('paymentReportsScrollContainer');
  const exportBtn = document.getElementById('exportReportBtn');
  
  if (!tableBody) {
    console.error('لم يتم العثور على جدول النتائج');
    return;
  }
  
  if (!tableContainer) {
    console.error('لم يتم العثور على حاوية الجدول');
    return;
  }
  
  // إظهار حاوية الجدول
  tableContainer.style.display = 'block';
  console.log('تم إظهار حاوية الجدول');
  
  // حساب المساحة المتاحة ديناميكياً
  setTimeout(() => {
    calculateDynamicHeight(scrollContainer);
  }, 100);
  
  // مسح البيانات الموجودة
  tableBody.innerHTML = '';
  
  if (!data || data.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">لا توجد بيانات للطلاب الذين لديهم أشهر غير مدفوعة</td></tr>';
    
    // إخفاء زر التصدير
    if (exportBtn) {
      exportBtn.style.display = 'none';
    }
    
    return;
  }
  
  // إظهار زر التصدير
  if (exportBtn) {
    exportBtn.style.display = 'block';
  }
  
  // إضافة صفوف البيانات
  data.forEach(student => {
    const row = document.createElement('tr');
    
    // تحضير أرقام الهواتف لعرضها
    const studentPhones = student.studentPhones && student.studentPhones.length > 0 
      ? student.studentPhones.join(', ') 
      : 'غير محدد';
      
    const parentPhones = student.parentPhones && student.parentPhones.length > 0 
      ? student.parentPhones.join(', ') 
      : 'غير محدد';
    
    // تحضير معلومات الأشهر غير المدفوعة
    const unpaidMonths = student.monthsStatus.filter(month => month.status === 'غير مدفوع');
    const monthsDisplay = unpaidMonths.map(month => month.month).join(', ');
    
    // تحضير معلومات التفاصيل (المادة، المدرس، المجموعة)
    const detailsHtml = student.details ? `
      <div style="font-size: 12px; line-height: 1.4;">
        <div style="margin-bottom: 3px;"><strong>المادة:</strong> ${student.details.subject}</div>
        <div style="margin-bottom: 3px;"><strong>المدرس:</strong> ${student.details.teacher}</div>
        <div><strong>المجموعة:</strong> ${student.details.group}</div>
      </div>
    ` : 'غير محدد';
    
    row.innerHTML = `
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${student.studentCode || student.studentId || 'غير محدد'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${student.name || 'غير محدد'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        ${detailsHtml}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <div style="color: #dc3545; font-weight: bold; margin-bottom: 5px;">
          ${student.unpaidMonthsCount} شهر غير مدفوع
        </div>
        <div style="font-size: 12px; color: #666;">
          ${monthsDisplay}
        </div>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${studentPhones}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${parentPhones}</td>
    `;
    tableBody.appendChild(row);
  });
  
  // إضافة إحصائية في النهاية
  const summaryRow = document.createElement('tr');
  summaryRow.style.backgroundColor = '#f8f9fa';
  summaryRow.style.fontWeight = 'bold';
  summaryRow.innerHTML = `
    <td colspan="6" style="padding: 12px; text-align: center; border-top: 2px solid #17a2b8;">
      إجمالي الطلاب الذين لديهم أشهر غير مدفوعة: ${data.length} طالب
    </td>
  `;
  tableBody.appendChild(summaryRow);
}

// دالة حساب الارتفاع الديناميكي لجدول تقارير المدفوعات
function calculateDynamicHeight(scrollContainer) {
  if (!scrollContainer) return;
  
  try {
    // الحصول على ارتفاع الشاشة
    const viewportHeight = window.innerHeight;
    
    // الحصول على موقع الحاوية من أعلى الصفحة
    const containerRect = scrollContainer.getBoundingClientRect();
    
    // حساب المساحة المتبقية (ارتفاع الشاشة - موقع الحاوية - مساحة للتنفس)
    const availableHeight = viewportHeight - containerRect.top - 100; // 100px مساحة للتنفس
    
    // حد أدنى وأقصى للارتفاع
    const minHeight = 200;
    const maxHeight = Math.max(minHeight, availableHeight);
    
    // تطبيق الارتفاع الديناميكي
    scrollContainer.style.maxHeight = maxHeight + 'px';
    scrollContainer.style.overflowY = 'auto';
    
    console.log('تم حساب الارتفاع الديناميكي:', {
      viewportHeight,
      containerTop: containerRect.top,
      availableHeight,
      appliedHeight: maxHeight
    });
    
  } catch (error) {
    console.error('خطأ في حساب الارتفاع الديناميكي:', error);
    // في حالة الخطأ، استخدم ارتفاع افتراضي
    scrollContainer.style.maxHeight = '400px';
  }
}

// معالج إعادة حساب الارتفاع عند تغيير حجم النافذة
window.addEventListener('resize', function() {
  const scrollContainer = document.getElementById('paymentReportsScrollContainer');
  if (scrollContainer && scrollContainer.style.maxHeight) {
    // إعادة حساب الارتفاع بعد تأخير قصير
    setTimeout(() => {
      calculateDynamicHeight(scrollContainer);
    }, 100);
  }
  
  // تحديث الخلفية عند تغيير حجم النافذة
  if (typeof patternBg !== 'undefined' && patternBg.handleResize) {
    patternBg.handleResize();
  }
});

// 📊 === دوال تصدير تقارير المدفوعات ===

let currentReportData = null; // تخزين بيانات التقرير الحالي

// إظهار نافذة التصدير
function showExportModal() {
  const modal = document.getElementById('exportModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // منع التمرير في الخلفية
  }
}

// إخفاء نافذة التصدير
function hideExportModal() {
  const modal = document.getElementById('exportModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // إعادة التمرير
    
    // إعادة تعيين النموذج
    resetExportForm();
  }
}

// إعادة تعيين نموذج التصدير
function resetExportForm() {
  // إلغاء تحديد جميع أنواع الملفات
  const radioButtons = document.querySelectorAll('input[name="exportType"]');
  radioButtons.forEach(radio => {
    radio.checked = false;
    radio.closest('.export-option').classList.remove('selected');
  });
  
  // إعادة تعيين اسم الملف
  document.getElementById('exportFileName').value = 'تقرير_المدفوعات';
  
  // تعطيل زر التصدير
  document.getElementById('confirmExportBtn').disabled = true;
  document.getElementById('confirmExportBtn').style.opacity = '0.5';
}

// تحديد نوع التصدير
function selectExportType(radio) {
  // إزالة التحديد من جميع الخيارات
  document.querySelectorAll('.export-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  // تحديد الخيار المختار
  radio.closest('.export-option').classList.add('selected');
  
  // تفعيل زر التصدير
  const confirmBtn = document.getElementById('confirmExportBtn');
  confirmBtn.disabled = false;
  confirmBtn.style.opacity = '1';
  confirmBtn.style.cursor = 'pointer';
}

// تنفيذ التصدير
async function executeExport() {
  const selectedType = document.querySelector('input[name="exportType"]:checked');
  
  if (!selectedType) {
    alert('يرجى اختيار نوع الملف أولاً');
    return;
  }
  
  if (!currentReportData || currentReportData.length === 0) {
    alert('لا توجد بيانات للتصدير');
    return;
  }
  
  // الحصول على إعدادات التصدير
  const fileName = generateFileName();
  const exportType = selectedType.value;
  
  // إظهار رسالة التحميل
  showExportLoading();
  
  try {
    switch (exportType) {
      case 'pdf':
        await exportToPDF(currentReportData, fileName);
        break;
      case 'excel':
        await exportToExcel(currentReportData, fileName);
        break;
      default:
        throw new Error('نوع ملف غير مدعوم');
    }
    
    // إخفاء النافذة بعد التصدير الناجح
    hideExportModal();
    showExportSuccess(fileName, exportType);
    
  } catch (error) {
    console.error('خطأ في التصدير:', error);
    hideExportLoading();
    alert('حدث خطأ أثناء التصدير: ' + error.message);
  }
}

// توليد اسم الملف مع التاريخ والوقت
function generateFileName() {
  let fileName = document.getElementById('exportFileName').value || 'تقرير_المدفوعات';
  
  const includeDate = document.getElementById('includeDate').checked;
  const includeTime = document.getElementById('includeTime').checked;
  
  if (includeDate || includeTime) {
    const now = new Date();
    
    if (includeDate) {
      const dateStr = now.toLocaleDateString('ar-EG').replace(/\//g, '-');
      fileName += '_' + dateStr;
    }
    
    if (includeTime) {
      const timeStr = now.toLocaleTimeString('ar-EG', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/:/g, '-');
      fileName += '_' + timeStr;
    }
  }
  
  return fileName;
}

// إظهار رسالة التحميل
function showExportLoading() {
  const confirmBtn = document.getElementById('confirmExportBtn');
  confirmBtn.innerHTML = '⏳ جاري التصدير...';
  confirmBtn.disabled = true;
  confirmBtn.style.opacity = '0.7';
}

// إخفاء رسالة التحميل
function hideExportLoading() {
  const confirmBtn = document.getElementById('confirmExportBtn');
  confirmBtn.innerHTML = '🚀 بدء التصدير';
  confirmBtn.disabled = false;
  confirmBtn.style.opacity = '1';
}

// إظهار رسالة نجاح التصدير
function showExportSuccess(fileName, type) {
  const typeNames = {
    pdf: 'PDF',
    excel: 'Excel',
    word: 'Word'
  };
  
  alert(`✅ تم تصدير التقرير بنجاح!\n\nنوع الملف: ${typeNames[type]}\nاسم الملف: ${fileName}`);
}

// === دوال التصدير المحسنة والموثوقة ===

// تصدير إلى PDF باستخدام jsPDF
async function exportToPDF(data, fileName) {
  try {
    // التحقق من توفر jsPDF
    if (typeof window.jsPDF === 'undefined') {
      throw new Error('مكتبة PDF غير متوفرة');
    }

    const { jsPDF } = window.jsPDF;
    const doc = new jsPDF('landscape'); // أفقي للجداول العريضة
    
    // إعداد الخط والعنوان
    doc.setFont('helvetica');
    doc.setFontSize(18);
    doc.text('Payment Reports', 150, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 30, { align: 'center' });

    // إعداد بيانات الجدول
    const headers = [
      ['Student ID', 'Student Name', 'Subject', 'Teacher', 'Group', 'Unpaid Months', 'Student Phone', 'Parent Phone']
    ];
    
    const rows = data.map(student => {
      // حساب الأشهر غير المدفوعة من البيانات الفعلية
      const unpaidMonths = student.monthsStatus ? 
        student.monthsStatus.filter(month => month.status === 'غير مدفوع').map(month => month.month) : 
        [];
      
      return [
        student.studentCode || student.studentId || 'N/A',
        student.name || 'N/A',
        student.details?.subject || 'N/A',
        student.details?.teacher || 'N/A', 
        student.details?.group || 'N/A',
        unpaidMonths.join(', ') || 'N/A',
        (student.studentPhones || []).join(', ') || 'N/A',
        (student.parentPhones || []).join(', ') || 'N/A'
      ];
    });

    // إنشاء الجدول
    if (doc.autoTable) {
      doc.autoTable({
        head: headers,
        body: rows,
        startY: 35,
        margin: { top: 5, right: 5, bottom: 5, left: 5 },
        pageBreak: 'auto',
        showHead: 'everyPage',
        tableWidth: 'auto',
        headStyles: {
          fillColor: [116, 185, 255], // أزرق فاتح لطيف
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          valign: 'middle'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // رمادي فاتح جداً
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          halign: 'center',
          textColor: [52, 73, 94], // رمادي داكن للنص
          lineColor: [176, 190, 197], // رمادي فاتح للخطوط
          lineWidth: 0.5,
          valign: 'middle',
          overflow: 'linebreak'
        },
        bodyStyles: {
          lineColor: [176, 190, 197], // نفس لون خطوط الأعمدة
          lineWidth: 0.5
        },
        columnStyles: {
          0: { cellWidth: 18 }, // Student ID
          1: { cellWidth: 32 }, // Student Name
          2: { cellWidth: 22 }, // Subject
          3: { cellWidth: 22 }, // Teacher
          4: { cellWidth: 28 }, // Group
          5: { cellWidth: 38 }, // Unpaid Months
          6: { cellWidth: 28 }, // Student Phone
          7: { cellWidth: 28 }  // Parent Phone
        }
      });
    }
    
    // حفظ الملف
    doc.save(`${fileName}.pdf`);
    return true;

  } catch (error) {
    console.error('خطأ في تصدير PDF:', error);
    
    // طريقة بديلة: طباعة HTML
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${fileName}</title>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          
          body { 
            font-family: 'Cairo', Arial, sans-serif; 
            margin: 15px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 15px;
          }
          
          .container {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 15px 30px rgba(0,0,0,0.1);
            max-width: 1200px;
            margin: 0 auto;
          }
          
          h1 { 
            text-align: center; 
            background: linear-gradient(45deg, #3498db, #e74c3c);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .subtitle {
            text-align: center;
            color: #7f8c8d;
            font-size: 14px;
            margin-bottom: 15px;
            font-weight: 400;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          }
          
          th, td { 
            border: 1px solid #b0bec5;
            padding: 12px 8px; 
            text-align: center; 
            font-size: 11px;
          }
          
          th { 
            background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%) !important;
            color: white !important;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 10px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          tr:nth-child(even) { 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          }
          
          tr:nth-child(odd) { 
            background: white;
          }
          
          tr:hover {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            transform: scale(1.01);
            transition: all 0.3s ease;
          }
          
          td {
            color: #2c3e50;
            font-weight: 400;
          }
          
          .stats {
            display: flex;
            justify-content: space-around;
            margin: 15px 0;
            flex-wrap: wrap;
          }
          
          .stat-card {
            background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(116, 185, 255, 0.3);
            min-width: 120px;
            margin: 3px;
          }
          
          .stat-n200umber {
            font-size: 24px;
            font-weight: 700;
            display: block;
          }
          
          .stat-label {
            font-size: 12px;
            opacity: 0.9;
          }
          
          @media print { 
            body { 
              margin: 0; 
              background: white !important;
              padding: 5px;
            }
            .container {
              box-shadow: none;
              border-radius: 0;
              padding: 10px;
              page-break-inside: avoid;
            }
            h1 { 
              color: #2c3e50 !important;
              -webkit-text-fill-color: #2c3e50 !important;
              page-break-after: avoid;
              font-size: 20px;
              margin-bottom: 5px;
            }
            .subtitle {
              margin-bottom: 10px;
              font-size: 12px;
            }
            table {
              page-break-inside: avoid;
              margin: 10px 0;
            }
            tr {
              page-break-inside: avoid;
            }
            th {
              background: #74b9ff !important;
              color: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              page-break-after: avoid;
              padding: 8px;
            }
            td {
              padding: 6px;
            }
            tr:hover {
              transform: none;
            }
            .stats {
              display: none;
            }
            .footer {
              page-break-before: avoid;
              margin-top: 15px;
              padding: 10px;
            }
          }
          
          @page { 
            size: A4 landscape; 
            margin: 0.5cm; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📊 Payment Reports</h1>
          <p class="subtitle">Generated on ${new Date().toLocaleDateString()} | Total Records: ${data.length}</p>
          
          <div class="stats">
            <div class="stat-card">
              <span class="stat-number">${data.length}</span>
              <span class="stat-label">Total Students</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">${data.reduce((sum, student) => sum + (student.unpaidMonthsCount || 0), 0)}</span>
              <span class="stat-label">Total Unpaid Months</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">${new Set(data.map(s => s.details?.subject)).size}</span>
              <span class="stat-label">Subjects</span>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Student ID</th><th>Student Name</th><th>Subject</th><th>Teacher</th>
                <th>Group</th><th>Unpaid Months</th><th>Student Phone</th><th>Parent Phone</th>
              </tr>
            </thead>
            <tbody>
            ${data.map(student => {
              // حساب الأشهر غير المدفوعة من البيانات الفعلية
              const unpaidMonths = student.monthsStatus ? 
                student.monthsStatus.filter(month => month.status === 'غير مدفوع').map(month => month.month) : 
                [];
              
              return `
              <tr>
                <td>${student.studentCode || student.studentId || 'N/A'}</td>
                <td>${student.name || 'N/A'}</td>
                <td>${student.details?.subject || 'N/A'}</td>
                <td>${student.details?.teacher || 'N/A'}</td>
                <td>${student.details?.group || 'N/A'}</td>
                <td>${unpaidMonths.join(', ') || 'N/A'}</td>
                <td>${(student.studentPhones || []).join(', ') || 'N/A'}</td>
                <td>${(student.parentPhones || []).join(', ') || 'N/A'}</td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: center; padding: 20px; background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; border-radius: 10px; font-size: 12px;">
          <div style="font-size: 20px; margin-bottom: 10px;">🎯</div>
          <p style="margin: 5px 0; font-weight: 600;">Payment Management System</p>
          <p style="margin: 5px 0;">Professional Educational Analytics & Reporting</p>
          <p style="margin: 5px 0; opacity: 0.8;">© 2024 - Advanced School Management Solutions</p>
        </div>
        </div>
        
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 1000);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    return true;
  }
}


// تصدير إلى Excel
async function exportToExcel(data, fileName) {
    if (typeof XLSX === 'undefined') {
      throw new Error('مكتبة Excel غير متوفرة');
    }
  
  // تحضير البيانات
  const excelData = data.map(student => ({
    'ID الطالب': student.studentCode || student.studentId || 'غير محدد',
    'اسم الطالب': student.name || 'غير محدد',
    'المادة': student.details?.subject || 'غير محدد',
    'الأستاذ': student.details?.teacher || 'غير محدد',
    'المجموعة': student.details?.group || 'غير محدد',
    'عدد الأشهر غير المدفوعة': student.unpaidMonthsCount,
    'الأشهر غير المدفوعة': (student.unpaidMonths || []).join(', ') || 'غير محدد',
    'رقم الطالب': (student.studentPhones || []).join(', ') || 'غير محدد',
    'رقم ولي الأمر': (student.parentPhones || []).join(', ') || 'غير محدد',
    'تاريخ التقرير': new Date().toLocaleDateString('ar-EG')
  }));
  
  // إنشاء workbook و worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // تحسين عرض الأعمدة
  const colWidths = [
    { wch: 15 }, // ID الطالب
    { wch: 25 }, // اسم الطالب  
    { wch: 20 }, // المادة
    { wch: 20 }, // الأستاذ
    { wch: 25 }, // المجموعة
    { wch: 12 }, // عدد الأشهر
    { wch: 30 }, // الأشهر غير المدفوعة
    { wch: 20 }, // رقم الطالب
    { wch: 20 }, // رقم ولي الأمر
    { wch: 15 }  // تاريخ التقرير
  ];
  ws['!cols'] = colWidths;
  
  // إضافة worksheet إلى workbook
  XLSX.utils.book_append_sheet(wb, ws, 'تقرير المدفوعات');
  
  // تصدير الملف
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// تحميل مكتبة PDF
async function loadPDFLibrary() {
  return new Promise((resolve, reject) => {
    // التحقق من وجود المكتبة
    if (window.jsPDF || (window.jsPDF?.jsPDF)) {
      resolve();
      return;
    }
    
    // تحميل jsPDF
    const script1 = document.createElement('script');
    script1.src = 'https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js';
    script1.onload = () => {
      console.log('تم تحميل jsPDF');
      // تحميل autoTable plugin
      const script2 = document.createElement('script');
      script2.src = 'https://unpkg.com/jspdf-autotable@latest/dist/jspdf.plugin.autotable.min.js';
      script2.onload = () => {
        console.log('تم تحميل jsPDF autoTable');
        resolve();
      };
      script2.onerror = (error) => {
        console.error('خطأ في تحميل autoTable:', error);
        reject(error);
      };
      document.head.appendChild(script2);
    };
    script1.onerror = (error) => {
      console.error('خطأ في تحميل jsPDF:', error);
      reject(error);
    };
    document.head.appendChild(script1);
  });
}

// إغلاق النافذة عند الضغط خارجها
document.addEventListener('DOMContentLoaded', function() {
  const exportModal = document.getElementById('exportModal');
  if (exportModal) {
    exportModal.addEventListener('click', function(e) {
      if (e.target === exportModal) {
        hideExportModal();
      }
    });
  }
  
  // إغلاق النافذة بالضغط على Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('exportModal');
      if (modal && modal.style.display === 'flex') {
        hideExportModal();
      }
    }
  });
  
  // 🎨 تحميل الخلفية الديناميكية عند تحميل الصفحة
  setTimeout(() => {
    patternBg.loadNewPattern();
    // تفعيل التحديث التلقائي كل 3 دقائق
    patternBg.startAutoRefresh(3);
  }, 1000);
});

// 🎨 دوال عامة للتحكم في الخلفية
window.refreshPattern = () => patternBg.refresh();
window.patternBg = patternBg;

// ===== دوال عرض الجداول في Modals بعرض كامل =====

// متغيرات لحفظ الموقع الأصلي للجداول
let originalSubjectsParent = null;
let originalTeachersParent = null;
let originalGroupsParent = null;
let originalStudentsParent = null;
let originalSubscriptionsParent = null;

// دالة عرض modal المواد
function showSubjectsModal() {
  const modal = document.getElementById('subjectsModal');
  const container = document.getElementById('subjectsTableContainer');
  const originalTable = document.getElementById('subjectsTable');
  
  if (modal && container && originalTable) {
    // حفظ الموقع الأصلي للجدول
    originalSubjectsParent = originalTable.parentElement;
    
    // نقل الجدول إلى الـ modal (ليس نسخ)
    originalTable.style.display = 'table';
    container.innerHTML = '';
    container.appendChild(originalTable);
    
    // عرض الـ modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

// دالة عرض modal الأساتذة
function showTeachersModal() {
  const modal = document.getElementById('teachersModal');
  const container = document.getElementById('teachersTableContainer');
  const originalTable = document.getElementById('teachersTable');
  
  if (modal && container && originalTable) {
    // حفظ الموقع الأصلي للجدول
    originalTeachersParent = originalTable.parentElement;
    
    // نقل الجدول إلى الـ modal
    originalTable.style.display = 'table';
    container.innerHTML = '';
    container.appendChild(originalTable);
    
    // عرض الـ modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

// دالة عرض modal المجموعات
function showGroupsModal() {
  const modal = document.getElementById('groupsModal');
  const container = document.getElementById('groupsTableContainer');
  const originalTable = document.getElementById('groupsTable');
  
  if (modal && container && originalTable) {
    // حفظ الموقع الأصلي للجدول
    originalGroupsParent = originalTable.parentElement;
    
    // نقل الجدول إلى الـ modal
    originalTable.style.display = 'table';
    container.innerHTML = '';
    container.appendChild(originalTable);
    
    // عرض الـ modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

// دالة عرض modal الطلاب
function showStudentsModal() {
  const modal = document.getElementById('studentsModal');
  const container = document.getElementById('studentsTableContainer');
  const originalTable = document.getElementById('studentsTable');
  
  if (modal && container && originalTable) {
    // حفظ الموقع الأصلي للجدول
    originalStudentsParent = originalTable.parentElement;
    
    // نقل الجدول إلى الـ modal
    originalTable.style.display = 'table';
    container.innerHTML = '';
    container.appendChild(originalTable);
    
    // عرض الـ modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

// دالة عرض modal الاشتراكات
function showSubscriptionsModal() {
  const modal = document.getElementById('subscriptionsModal');
  const container = document.getElementById('subscriptionsTableContainer');
  const originalTable = document.getElementById('subscriptionsTable');
  
  if (modal && container && originalTable) {
    // حفظ الموقع الأصلي للجدول
    originalSubscriptionsParent = originalTable.parentElement;
    
    // نقل الجدول إلى الـ modal
    originalTable.style.display = 'table';
    container.innerHTML = '';
    container.appendChild(originalTable);
    
    // عرض الـ modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

// دالة إخفاء أي modal وإرجاع الجدول لمكانه الأصلي
function hideTableModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal && modal.style.display === 'flex') {
    // إرجاع الجدول لموقعه الأصلي
    if (modalId === 'subjectsModal' && originalSubjectsParent) {
      const table = document.getElementById('subjectsTable');
      if (table) {
        table.style.display = 'none';
        originalSubjectsParent.appendChild(table);
      }
    } else if (modalId === 'teachersModal' && originalTeachersParent) {
      const table = document.getElementById('teachersTable');
      if (table) {
        table.style.display = 'none';
        originalTeachersParent.appendChild(table);
      }
    } else if (modalId === 'groupsModal' && originalGroupsParent) {
      const table = document.getElementById('groupsTable');
      if (table) {
        table.style.display = 'none';
        originalGroupsParent.appendChild(table);
      }
    } else if (modalId === 'studentsModal' && originalStudentsParent) {
      const table = document.getElementById('studentsTable');
      if (table) {
        table.style.display = 'none';
        originalStudentsParent.appendChild(table);
      }
    } else if (modalId === 'subscriptionsModal' && originalSubscriptionsParent) {
      const table = document.getElementById('subscriptionsTable');
      if (table) {
        table.style.display = 'none';
        originalSubscriptionsParent.appendChild(table);
      }
    }
    
    // إخفاء الـ modal
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// جعل الدوال متاحة عالمياً
window.showSubjectsModal = showSubjectsModal;
window.showTeachersModal = showTeachersModal;
window.showGroupsModal = showGroupsModal;
window.showStudentsModal = showStudentsModal;
window.showSubscriptionsModal = showSubscriptionsModal;
window.hideTableModal = hideTableModal;

// دوال الطلاب والاشتراكات
window.editStudent = editStudent;
window.cancelEditStudent = cancelEditStudent;
window.saveEditStudent = saveEditStudent;
window.deleteStudent = deleteStudent;
window.editSubscription = editSubscription;
window.cancelEditSubscription = cancelEditSubscription;
window.saveEditSubscription = saveEditSubscription;
window.deleteSubscription = deleteSubscription;

// إغلاق الـ modals بالضغط على Escape
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    ['subjectsModal', 'teachersModal', 'groupsModal', 'studentsModal', 'subscriptionsModal'].forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal && modal.style.display === 'flex') {
        hideTableModal(modalId);
      }
    });
  }
});
