// patternGenerator.js
// مولد خلفيات SVG ديناميكية تشبه خلفية واتساب بأيقونات تعليمية

const fs = require('fs');
const path = require('path');

class PatternGenerator {
  constructor() {
    this.iconsDir = path.join(__dirname, 'icons');
    this.icons = [];
    this.loadIcons();
  }

  // تحميل جميع الأيقونات من المجلد
  loadIcons() {
    try {
      const files = fs.readdirSync(this.iconsDir);
      this.icons = files
        .filter(file => file.endsWith('.svg'))
        .map(file => {
          const iconPath = path.join(this.iconsDir, file);
          const content = fs.readFileSync(iconPath, 'utf8');
          return {
            name: file.replace('.svg', ''),
            content: this.cleanSvgContent(content)
          };
        });
      
      console.log(`📦 تم تحميل ${this.icons.length} أيقونة تعليمية`);
    } catch (error) {
      console.error('❌ خطأ في تحميل الأيقونات:', error);
      this.icons = [];
    }
  }

  // تنظيف محتوى SVG لاستخراج المسارات فقط
  cleanSvgContent(svgContent) {
    try {
      // استخراج المسارات والأشكال من SVG
      const pathMatches = svgContent.match(/<path[^>]*d="[^"]*"[^>]*>/g) || [];
      const circleMatches = svgContent.match(/<circle[^>]*>/g) || [];
      const rectMatches = svgContent.match(/<rect[^>]*>/g) || [];
      const polygonMatches = svgContent.match(/<polygon[^>]*>/g) || [];
      
      // دمج جميع الأشكال
      const allShapes = [
        ...pathMatches,
        ...circleMatches,
        ...rectMatches,
        ...polygonMatches
      ];
      
      // تنظيف الأشكال لاستخدام currentColor
      return allShapes
        .map(shape => shape.replace(/fill="[^"]*"/g, 'fill="currentColor"'))
        .map(shape => shape.replace(/stroke="[^"]*"/g, 'stroke="currentColor"'))
        .join('\n');
    } catch (error) {
      console.error('❌ خطأ في تنظيف SVG:', error);
      return '';
    }
  }

  // رقم عشوائي بين min و max
  random(min, max) {
    return Math.random() * (max - min) + min;
  }

  // اختيار عنصر عشوائي من مصفوفة
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // توليد موضع عشوائي مع تجنب التداخل - محسن
  generatePosition(usedPositions, iconSize, canvasSize = 1200) {
    let attempts = 0;
    let position;
    const maxAttempts = 100; // زيادة المحاولات
    
    do {
      position = {
        x: this.random(iconSize/2, canvasSize - iconSize),
        y: this.random(iconSize/2, canvasSize - iconSize)
      };
      attempts++;
    } while (attempts < maxAttempts && this.isOverlapping(position, usedPositions, iconSize));
    
    return position;
  }

  // تحقق من التداخل - محسن
  isOverlapping(newPos, usedPositions, iconSize) {
    const minDistance = iconSize * 1.2; // مسافة أكبر لتجنب التداخل
    
    return usedPositions.some(pos => {
      const distance = Math.sqrt(
        Math.pow(newPos.x - pos.x, 2) + Math.pow(newPos.y - pos.y, 2)
      );
      return distance < minDistance;
    });
  }

  // توليد تحويلات عشوائية للأيقونة
  generateTransform(x, y) {
    const scale = this.random(0.3, 0.8);
    const rotation = this.random(0, 360);
    
    return `translate(${x}, ${y}) scale(${scale}) rotate(${rotation} 400 400)`;
  }

  // توليد نمط SVG كامل - خوارزمية هجينة متطورة
  generatePattern() {
    if (this.icons.length === 0) {
      console.warn('⚠️ لا توجد أيقونات لتوليد النمط');
      return this.getEmptyPattern();
    }

    const canvasSize = 2000;
    let svgElements = [];
    
    // نظام هجين: Grid + Poisson + Random
    const baseGridSize = 70; // شبكة أساسية أكبر للمرونة
    const gridCols = Math.floor(canvasSize / baseGridSize);
    const gridRows = Math.floor(canvasSize / baseGridSize);
    
    // تتبع المناطق المستخدمة (مصفوفة دقيقة أكثر)
    const occupiedAreas = [];
    
    // توزيع الأيقونات بالنظام الهجين
    this.icons.forEach(icon => {
      const iconsPerType = Math.floor(this.random(35, 50));
      
      for (let i = 0; i < iconsPerType; i++) {
        const position = this.findHybridPosition(
          baseGridSize, gridCols, gridRows, 
          occupiedAreas, canvasSize
        );
        
        if (position) {
          const iconSize = this.random(45, 75);
          
          // إضافة المنطقة للقائمة المستخدمة
          occupiedAreas.push({
            x: position.x,
            y: position.y,
            radius: iconSize * 0.7 // منطقة حماية
          });
          
          const transform = this.generateTransform(position.x, position.y);
          const opacity = this.random(0.35, 0.55);
          
          svgElements.push(`
            <g transform="${transform}" opacity="${opacity}">
              <g transform="scale(${iconSize/800})">
                ${icon.content}
              </g>
            </g>
          `);
        }
      }
    });

    // إضافة نقاط ملء للمساحات الفارغة بالنظام الهجين
    const fillElements = this.generateHybridFill(occupiedAreas, canvasSize);
    
    // خلط العناصر
    svgElements = this.shuffleArray([...svgElements, ...fillElements]);

    const svgPattern = `
      <svg width="100%" height="100%" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <style>
            .pattern-icon {
              fill: currentColor;
              stroke: currentColor;
              stroke-width: 0.5;
            }
          </style>
        </defs>
        <g class="pattern-background">
          ${svgElements.join('')}
        </g>
      </svg>
    `;

    console.log(`✨ تم توليد نمط ذكي بـ ${svgElements.length} عنصر`);
    return svgPattern;
  }

  // خلط مصفوفة عشوائياً
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // توليد grid pattern خفيف لملء المساحات
  generateGridPattern(canvasSize) {
    const gridElements = [];
    const gridSpacing = 150; // مسافة بين نقاط الـ grid
    
    for (let x = gridSpacing; x < canvasSize; x += gridSpacing) {
      for (let y = gridSpacing; y < canvasSize; y += gridSpacing) {
        // أضافة تشويش طفيف للموضع
        const offsetX = this.random(-20, 20);
        const offsetY = this.random(-20, 20);
        
        gridElements.push(`
          <circle 
            cx="${x + offsetX}" 
            cy="${y + offsetY}" 
            r="${this.random(1, 3)}" 
            fill="currentColor" 
            opacity="${this.random(0.05, 0.12)}"
          />
        `);
      }
    }
    
    return gridElements;
  }

  // إيجاد أفضل موضع في الـ grid
  findBestGridPosition(grid, gridSize, gridCols, gridRows) {
    const availablePositions = [];
    
    // البحث عن المواضع المتاحة
    for (let row = 0; row < gridRows - 1; row++) {
      for (let col = 0; col < gridCols - 1; col++) {
        if (!grid[row][col]) {
          // حساب "score" للموضع بناء على الجيران
          const score = this.calculatePositionScore(grid, row, col, gridRows, gridCols);
          availablePositions.push({
            gridX: col,
            gridY: row,
            x: col * gridSize + gridSize / 2,
            y: row * gridSize + gridSize / 2,
            score: score
          });
        }
      }
    }
    
    if (availablePositions.length === 0) return null;
    
    // اختيار موضع عشوائي من أفضل 30% من المواضع
    availablePositions.sort((a, b) => b.score - a.score);
    const topPositions = availablePositions.slice(0, Math.max(1, Math.floor(availablePositions.length * 0.3)));
    
    return this.randomChoice(topPositions);
  }

  // حساب score لموضع معين (كلما قل التزاحم كلما زاد الـ score)
  calculatePositionScore(grid, row, col, gridRows, gridCols) {
    let score = 100;
    
    // فحص الجيران المباشرين
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (newRow >= 0 && newRow < gridRows && newCol >= 0 && newCol < gridCols) {
          if (grid[newRow][newCol]) {
            score -= 25; // خصم للجيران المشغولين
          }
        }
      }
    }
    
    // تفضيل المناطق الوسطى قليلاً
    const centerRow = gridRows / 2;
    const centerCol = gridCols / 2;
    const distanceFromCenter = Math.sqrt(Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2));
    score += Math.max(0, 20 - distanceFromCenter);
    
    return score;
  }

  // تحديد الخلايا المستخدمة في الـ grid
  markGridCells(grid, gridX, gridY, radius = 1) {
    const gridRows = grid.length;
    const gridCols = grid[0].length;
    
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const newRow = gridY + dr;
        const newCol = gridX + dc;
        
        if (newRow >= 0 && newRow < gridRows && newCol >= 0 && newCol < gridCols) {
          grid[newRow][newCol] = true;
        }
      }
    }
  }

  // توليد عناصر ملء ذكية للمساحات الفارغة
  generateSmartFill(grid, gridSize, gridCols, gridRows) {
    const fillElements = [];
    
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        if (!grid[row][col] && Math.random() < 0.45) { // 45% فرصة أعلى للملء
          const x = col * gridSize + gridSize / 2 + this.random(-30, 30);
          const y = row * gridSize + gridSize / 2 + this.random(-30, 30);
          
          // إضافة رموز صغيرة متنوعة
          if (Math.random() < 0.7) {
            // دوائر صغيرة
            fillElements.push(`
              <circle 
                cx="${x}" 
                cy="${y}" 
                r="${this.random(2, 7)}" 
                fill="currentColor" 
                opacity="${this.random(0.20, 0.38)}"
              />
            `);
          } else {
            // مربعات صغيرة أو خطوط
            const size = this.random(3, 9);
            fillElements.push(`
              <rect 
                x="${x - size/2}" 
                y="${y - size/2}" 
                width="${size}" 
                height="${size}" 
                fill="currentColor" 
                opacity="${this.random(0.18, 0.35)}"
                transform="rotate(${this.random(0, 45)} ${x} ${y})"
              />
            `);
          }
        }
      }
    }
    
    return fillElements;
  }

  // نمط فارغ في حالة عدم وجود أيقونات
  getEmptyPattern() {
    return `
      <svg width="1200" height="1200" viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="transparent"/>
        <text x="600" y="600" text-anchor="middle" fill="currentColor" opacity="0.1" font-size="24">
          لا توجد أيقونات متاحة
        </text>
      </svg>
    `;
  }

  // إعادة تحميل الأيقونات (للتحديث المباشر)
  reloadIcons() {
    this.loadIcons();
    console.log('🔄 تم إعادة تحميل الأيقونات');
  }

  // خوارزمية هجينة: Grid + Poisson + Random
  findHybridPosition(baseGridSize, gridCols, gridRows, occupiedAreas, canvasSize) {
    const maxAttempts = 60; // محاولات أكثر للنجاح
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let x, y;
      
      // المرحلة 1: اختيار منطقة تقريبية من الشبكة (70% من الوقت)
      if (Math.random() < 0.7) {
        const gridCol = Math.floor(this.random(0, gridCols));
        const gridRow = Math.floor(this.random(0, gridRows));
        
        // إزاحة عشوائية كبيرة من النقطة الشبكية
        x = gridCol * baseGridSize + this.random(-baseGridSize * 0.8, baseGridSize * 0.8);
        y = gridRow * baseGridSize + this.random(-baseGridSize * 0.8, baseGridSize * 0.8);
      } else {
        // المرحلة 2: عشوائي كامل (30% من الوقت)
        x = this.random(50, canvasSize - 50);
        y = this.random(50, canvasSize - 50);
      }
      
      // التأكد من البقاء داخل الحدود
      x = Math.max(50, Math.min(canvasSize - 50, x));
      y = Math.max(50, Math.min(canvasSize - 50, y));
      
      // فحص التصادم مع المناطق الموجودة (Poisson-like)
      const minDistance = 35; // مسافة دنيا مرنة
      let validPosition = true;
      
      for (const area of occupiedAreas) {
        const distance = Math.sqrt(
          Math.pow(x - area.x, 2) + Math.pow(y - area.y, 2)
        );
        
        if (distance < minDistance + area.radius) {
          validPosition = false;
          break;
        }
      }
      
      if (validPosition) {
        return { x, y };
      }
    }
    
    return null; // فشل في إيجاد موضع
  }

  // ملء هجين للمساحات الفارغة
  generateHybridFill(occupiedAreas, canvasSize) {
    const fillElements = [];
    const fillAttempts = 400; // عدد محاولات الملء
    
    for (let i = 0; i < fillAttempts; i++) {
      const x = this.random(20, canvasSize - 20);
      const y = this.random(20, canvasSize - 20);
      
      // فحص المسافة من العناصر الموجودة
      let minDistance = Infinity;
      for (const area of occupiedAreas) {
        const distance = Math.sqrt(
          Math.pow(x - area.x, 2) + Math.pow(y - area.y, 2)
        );
        minDistance = Math.min(minDistance, distance);
      }
      
      // إضافة عنصر ملء إذا كان بعيد بما فيه الكفاية
      if (minDistance > 25 && Math.random() < 0.6) {
        if (Math.random() < 0.75) {
          // دوائر صغيرة
          fillElements.push(`
            <circle 
              cx="${x}" 
              cy="${y}" 
              r="${this.random(2, 8)}" 
              fill="currentColor" 
              opacity="${this.random(0.20, 0.38)}"
            />
          `);
        } else {
          // أشكال هندسية متنوعة
          const size = this.random(3, 10);
          fillElements.push(`
            <rect 
              x="${x - size/2}" 
              y="${y - size/2}" 
              width="${size}" 
              height="${size}" 
              fill="currentColor" 
              opacity="${this.random(0.18, 0.35)}"
              transform="rotate(${this.random(0, 45)} ${x} ${y})"
            />
          `);
        }
      }
    }
    
    return fillElements;
  }

  // إحصائيات المولد
  getStats() {
    return {
      iconsLoaded: this.icons.length,
      iconsDirectory: this.iconsDir,
      availableIcons: this.icons.map(icon => icon.name)
    };
  }
}

module.exports = PatternGenerator;
