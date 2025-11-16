// تفعيل القوائم المنسدلة متعددة الاختيار لقسم تسجيل مادة
function setTableHeader(editMode) {
  const headerRow = document.getElementById('usersTableHeader');
  if (editMode) {
    headerRow.innerHTML = `
      <th>ID</th>
      <th>الاسم الأول</th>
      <th>الاسم الأخير</th>
      <th>اسم المستخدم</th>
      <th>كلمة المرور</th>
      <th>الدور</th>
      <th>الصلاحيات</th>
      <th>الأكشن</th>
    `;
  } else {
    headerRow.innerHTML = `
      <th>ID</th>
      <th id="name-header">الاسم</th>
      <th>اسم المستخدم</th>
      <th>كلمة المرور</th>
      <th>الدور</th>
      <th>الصلاحيات</th>
      <th>الأكشن</th>
    `;
  }
}

// تعديل عرض جدول المستخدمين ليستخدم user._id
async function loadUsers(filter = '') {
  const res = await fetch('http://localhost:3001/users?filter=' + encodeURIComponent(filter));
  const users = await res.json();
  const tbody = document.querySelector('#usersTable tbody');
  tbody.innerHTML = '';
  setTableHeader(editingId !== null);
  users.forEach((user, idx) => {
    const tr = document.createElement('tr');
    
    // تنسيق الصلاحيات للعرض
    const formatPermissions = (permissions) => {
      if (!permissions) return 'لا توجد صلاحيات';
      const activePermissions = Object.keys(permissions).filter(key => permissions[key]);
      if (activePermissions.length === 0) return 'لا توجد صلاحيات';
      if (activePermissions.length <= 2) {
        return activePermissions.map(p => getPermissionName(p)).join('، ');
      }
      return `${activePermissions.length} صلاحيات`;
    };
    
    if (editingId !== null) {
      if (editingId === user._id) {
        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td><input type="text" value="${user.firstName}" id="edit-firstName" oninput="updateEditUsername()" placeholder="الاسم الأول"></td>
          <td><input type="text" value="${user.lastName}" id="edit-lastName" oninput="updateEditUsername()" placeholder="الاسم الأخير"></td>
          <td><span id="edit-username">${user.username}</span></td>
          <td><input type="text" value="${user.password}" id="edit-password"><button type="button" id="edit-generatePassword" class="eye-edit-btn" onclick="generateEditPassword()">توليد كلمة مرور</button></td>
          <td>
            <select id="edit-role" onchange="updateEditPermissionsByRole()">
              <option value="admin"${user.role==='admin'?' selected':''}>مدير</option>
              <option value="receptionist"${user.role==='receptionist'?' selected':''}>موظف استقبال</option>
              <option value="follow_up_staff"${user.role==='follow_up_staff'?' selected':''}>موظف متابعة</option>
            </select>
          </td>
          <td>
            <div class="edit-permissions-container">
              <div class="custom-multiselect nested-permissions" id="editCustomPermissions">
                <div class="select-box" onclick="toggleEditPermissions()">تعديل الصلاحيات</div>
                <div class="options-list" style="display: none;">
                  ${generatePermissionsHTML(user.permissions || {}, 'edit')}
                </div>
              </div>
            </div>
          </td>
          <td>
            <button onclick="saveUserEdit('${user._id}')">حفظ</button>
            <button onclick="cancelUserEdit()">إلغاء</button>
          </td>
        `;
        // إعداد الصلاحيات للتعديل بعد إنشاء HTML
        setTimeout(() => {
          setupEditPermissions(user.permissions || {});
        }, 10);
      } else {
        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td>${user.firstName}</td>
          <td>${user.lastName}</td>
          <td>${user.username}</td>
          <td><span class="password" data-pw="${user.password}">******</span> <span class="eye-icon" onclick="togglePassword(this)" style="cursor:pointer; margin-right:5px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
          </span></td>
          <td>${getRoleName(user.role)}</td>
          <td>
            <small title="${Object.keys(user.permissions || {}).filter(key => user.permissions[key]).map(p => getPermissionName(p)).join('، ')}">${formatPermissions(user.permissions)}</small>
          </td>
          <td>
            <button onclick="editUser('${user._id}')">تعديل</button>
            <button onclick="deleteUser('${user._id}')">حذف</button>
          </td>
        `;
      }
    } else {
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${user.firstName} ${user.lastName}</td>
        <td>${user.username}</td>
        <td><span class="password" data-pw="${user.password}">******</span> <span class="eye-icon" onclick="togglePassword(this)" style="cursor:pointer; margin-right:5px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
        </span></td>
        <td>${getRoleName(user.role)}</td>
        <td>
          <small title="${Object.keys(user.permissions || {}).filter(key => user.permissions[key]).map(p => getPermissionName(p)).join('، ')}">${formatPermissions(user.permissions)}</small>
        </td>
        <td>
          <button onclick="editUser('${user._id}')">تعديل</button>
          <button onclick="deleteUser('${user._id}')">حذف</button>
        </td>
      `;
    }
    tbody.appendChild(tr);
  });
}

// دوال مساعدة للأسماء
function getRoleName(role) {
  const roleNames = {
    'admin': 'مدير',
    'receptionist': 'موظف استقبال', 
    'follow_up_staff': 'موظف متابعة'
  };
  return roleNames[role] || role;
}

function getPermissionName(permission) {
  const permissionNames = {
    'general_management': 'الإدارة العامة',
    'add_subject': 'إضافة مادة',
    'add_teacher': 'إضافة أستاذ', 
    'add_group': 'إضافة مجموعة',
    'reception_registration': 'الاستقبال والتسجيل',
    'register_student': 'تسجيل طالب',
    'manage_subscriptions': 'إدارة الاشتراكات',
    'manage_payments': 'إدارة المدفوعات',
    'follow_up_attendance': 'المتابعة والحضور'
  };
  return permissionNames[permission] || permission;
}

// دالة لتوليد HTML الصلاحيات للتعديل
function generatePermissionsHTML(userPermissions, prefix = '') {
  const permissionGroups = [
    {
      main: 'general_management',
      name: 'الإدارة العامة للموارد',
      subs: ['add_subject', 'add_teacher', 'add_group'],
      subNames: ['إضافة مادة', 'إضافة أستاذ', 'إضافة مجموعة']
    },
    {
      main: 'reception_registration', 
      name: 'الاستقبال والتسجيل',
      subs: ['register_student', 'manage_subscriptions', 'manage_payments'],
      subNames: ['تسجيل طالب', 'إدارة الاشتراكات', 'إدارة المدفوعات']
    },
    {
      main: 'follow_up_attendance',
      name: 'المتابعة والحضور', 
      subs: [],
      subNames: []
    }
  ];

  let html = '';
  
  permissionGroups.forEach(group => {
    const mainChecked = userPermissions[group.main] ? 'checked' : '';
    const hasSubPermissions = group.subs.length > 0;
    
    html += `<div class="permission-group">
      <label class="main-permission ${!hasSubPermissions ? 'single-permission' : ''}">
        <input type="checkbox" value="${group.main}" class="main-checkbox" ${mainChecked}>
        <span>${group.name}</span>`;
    
    if (hasSubPermissions) {
      html += `<span class="expand-arrow">▼</span>`;
    }
    
    html += `</label>`;
    
    if (hasSubPermissions) {
      html += `<div class="sub-permissions" style="display: none;">`;
      group.subs.forEach((sub, idx) => {
        const subChecked = userPermissions[sub] ? 'checked' : '';
        html += `<label class="sub-permission">
          <input type="checkbox" value="${sub}" ${subChecked}> ${group.subNames[idx]}
        </label>`;
      });
      html += `</div>`;
    }
    
    html += `</div>`;
  });

  return html;
}

// دالة لإعداد الصلاحيات في وضع التعديل - نفس النمط الأصلي
function setupEditPermissions(userPermissions) {
  const editContainer = document.getElementById('editCustomPermissions');
  if (!editContainer) return;

  const permissionGroups = editContainer.querySelectorAll('.permission-group');
  
  permissionGroups.forEach((group, index) => {
    const mainPermission = group.querySelector('.main-permission');
    const subPermissions = group.querySelector('.sub-permissions');
    const expandArrow = group.querySelector('.expand-arrow');
    const mainCheckbox = group.querySelector('.main-checkbox');
    const subCheckboxes = group.querySelectorAll('.sub-permission input[type="checkbox"]');
    
    if (expandArrow && subPermissions) {
      expandArrow.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleSubPermissions(group, subPermissions);
      });
      
      const textSpan = mainPermission.querySelector('span');
      if (textSpan) {
        textSpan.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          toggleSubPermissions(group, subPermissions);
        });
      }
    }
    
    if (mainCheckbox && subCheckboxes.length > 0) {
      mainCheckbox.addEventListener('change', function() {
        subCheckboxes.forEach(subCheckbox => {
          subCheckbox.checked = this.checked;
        });
        updateEditPermissionsDisplay();
      });
      
      subCheckboxes.forEach(subCheckbox => {
        subCheckbox.addEventListener('change', function() {
          const checkedSubs = Array.from(subCheckboxes).filter(cb => cb.checked);
          mainCheckbox.checked = checkedSubs.length === subCheckboxes.length;
          mainCheckbox.indeterminate = checkedSubs.length > 0 && checkedSubs.length < subCheckboxes.length;
          updateEditPermissionsDisplay();
        });
      });
      
      const checkedSubs = Array.from(subCheckboxes).filter(cb => cb.checked);
      mainCheckbox.checked = checkedSubs.length === subCheckboxes.length;
      mainCheckbox.indeterminate = checkedSubs.length > 0 && checkedSubs.length < subCheckboxes.length;
    }
  });
  
  updateEditPermissionsDisplay();
}

// دالة لتحديث عرض الصلاحيات في وضع التعديل
function updateEditPermissionsDisplay() {
  const editContainer = document.getElementById('editCustomPermissions');
  if (!editContainer) return;
  
  const selectBox = editContainer.querySelector('.select-box');
  const checkedPermissions = editContainer.querySelectorAll('input[type="checkbox"]:checked');
  
  if (checkedPermissions.length === 0) {
    selectBox.textContent = 'تعديل الصلاحيات';
  } else if (checkedPermissions.length === 1) {
    const permissionName = getPermissionName(checkedPermissions[0].value);
    selectBox.textContent = permissionName;
  } else {
    selectBox.textContent = `${checkedPermissions.length} صلاحيات محددة`;
  }
}

// دالة لفتح/إغلاق قائمة التعديل
function toggleEditPermissions() {
  const optionsList = document.querySelector('#editCustomPermissions .options-list');
  const editContainer = document.getElementById('editCustomPermissions');
  
  if (optionsList.style.display === 'block') {
    optionsList.style.display = 'none';
    editContainer.classList.remove('open');
  } else {
    optionsList.style.display = 'block';
    editContainer.classList.add('open');
  }
}

// دالة لتحديث صلاحيات التعديل حسب الدور
function updateEditPermissionsByRole() {
  const role = document.getElementById('edit-role').value;
  const editContainer = document.getElementById('editCustomPermissions');
  if (!editContainer) return;

  // إعادة تعيين جميع الصلاحيات
  const checkboxes = editContainer.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => checkbox.checked = false);

  // تعيين الصلاحيات الافتراضية
  const defaultPermissions = {
    admin: ['general_management', 'add_subject', 'add_teacher', 'add_group', 'reception_registration', 'register_student', 'manage_subscriptions', 'manage_payments', 'follow_up_attendance'],
    receptionist: ['reception_registration', 'register_student', 'manage_subscriptions', 'manage_payments'],
    follow_up_staff: ['follow_up_attendance']
  };

  if (defaultPermissions[role]) {
    defaultPermissions[role].forEach(permission => {
      const checkbox = editContainer.querySelector(`input[value="${permission}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }
  
  // إبقاء جميع الصلاحيات الفرعية مغلقة - المستخدم يفتحها بالسهم إذا أراد
  const permissionGroups = editContainer.querySelectorAll('.permission-group');
  permissionGroups.forEach(group => {
    const subPermissions = group.querySelector('.sub-permissions');
    if (subPermissions) {
      subPermissions.style.display = 'none';
      group.classList.remove('expanded');
    }
  });
  
  // تحديث حالة الصلاحيات الرئيسية
  updateEditMainPermissionsState();
  
  // تحديث العرض
  updateEditPermissionsDisplay();
}

// تحديث حالة الصلاحيات الرئيسية في التعديل
function updateEditMainPermissionsState() {
  const editContainer = document.getElementById('editCustomPermissions');
  if (!editContainer) return;
  
  const permissionGroups = editContainer.querySelectorAll('.permission-group');
  
  permissionGroups.forEach(group => {
    const mainCheckbox = group.querySelector('.main-checkbox');
    const subCheckboxes = group.querySelectorAll('.sub-permission input[type="checkbox"]');
    
    if (mainCheckbox && subCheckboxes.length > 0) {
      const checkedSubs = Array.from(subCheckboxes).filter(cb => cb.checked);
      mainCheckbox.checked = checkedSubs.length === subCheckboxes.length;
      mainCheckbox.indeterminate = checkedSubs.length > 0 && checkedSubs.length < subCheckboxes.length;
    }
  });
}

// بحث المستخدمين
const searchInput = document.getElementById('search');
searchInput.addEventListener('input', () => loadUsers(searchInput.value.trim()));

// دوال تعديل وحذف المستخدمين
let editingId = null;
function editUser(id) {
  editingId = id;
  loadUsers();
}
function cancelUserEdit() {
  editingId = null;
  loadUsers();
}
function saveUserEdit(id) {
  // جمع الصلاحيات المختارة من وضع التعديل
  const editContainer = document.getElementById('editCustomPermissions');
  const editPermissions = {};
  
  if (editContainer) {
    const checkboxes = editContainer.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
      editPermissions[checkbox.value] = true;
    });
  }

  const user = {
    firstName: document.getElementById('edit-firstName').value.trim(),
    lastName: document.getElementById('edit-lastName').value.trim(),
    username: document.getElementById('edit-username').textContent.trim(),
    password: document.getElementById('edit-password').value.trim(),
    role: document.getElementById('edit-role').value,
    permissions: editPermissions
  };
  
  fetch('http://localhost:3001/users/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  }).then(response => {
    if (response.ok) {
      console.log('✅ تم تحديث المستخدم والصلاحيات بنجاح');
      editingId = null;
      loadUsers();
      
      // التحقق من أن المستخدم المُعدَّل هو نفس المستخدم الحالي
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser._id === id) {
        console.log('🔄 تم تعديل صلاحيات المستخدم الحالي - سيتم التحديث عند إعادة التحميل');
        
        // إظهار تنبيه للمستخدم
        setTimeout(() => {
          alert('✅ تم تحديث صلاحياتك! يرجى إعادة تحميل الصفحة لرؤية التغييرات.');
        }, 500);
      }
    } else {
      console.error('❌ خطأ في تحديث المستخدم');
      alert('حدث خطأ في حفظ التعديلات');
    }
  }).catch(error => {
    console.error('❌ خطأ في الشبكة:', error);
    alert('خطأ في الاتصال بالخادم');
  });
}
function deleteUser(id) {
  if (confirm('هل أنت متأكد من حذف المستخدم؟')) {
    fetch('http://localhost:3001/users/' + id, { method: 'DELETE' })
      .then(() => loadUsers());
  }
}
function togglePassword(icon) {
  const pwSpan = icon.previousElementSibling;
  if (pwSpan.textContent === '******') {
    pwSpan.textContent = pwSpan.dataset.pw;
    // عين وعليها خط
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18" stroke="red" stroke-width="2"/></svg>`;
  } else {
    pwSpan.textContent = '******';
    // عين فقط
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
}
function updateEditUsername() {
  const firstName = document.getElementById('edit-firstName').value.trim();
  const lastName = document.getElementById('edit-lastName').value.trim();
  let username = '';
  if (firstName.length >= 3 && lastName.length >= 2) {
    username = firstName.substring(0, 3) + lastName.slice(-2);
  } else if (firstName && lastName) {
    username = firstName + lastName;
  }
  document.getElementById('edit-username').textContent = username.toLowerCase();
}

function generateEditPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) password += chars[Math.floor(Math.random() * chars.length)];
  document.getElementById('edit-password').value = password;
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
  const res = await fetch('http://localhost:3001/subjects');
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
  const res = await fetch('http://localhost:3001/subjects');
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
  const res = await fetch('http://localhost:3001/teachers');
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
  const res = await fetch('http://localhost:3001/groups');
  const groups = await res.json();
  const select = document.getElementById('subscriptionGroup');
  select.innerHTML = '<option value="">اختر المجموعة</option>';
  groups.forEach(group => {
    const option = document.createElement('option');
    option.value = group.groupId || group._id || group.subject + '-' + group.teacher;
    option.textContent = group.subject + ' - ' + group.teacher;
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
  const res = await fetch('http://localhost:3001/students');
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
  const res = await fetch('http://localhost:3001/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, subjectId, teacherId, groupId })
  });
  
  try {
    const data = await res.json();
    console.log('استجابة الخادم:', data); // لتسجيل الاستجابة
    
    if (res.ok && (data.subscriptionId || (data.subscription && data.subscription.subscriptionId))) {
      alert(data.message || 'تم الاشتراك بنجاح');
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
  const res = await fetch('http://localhost:3001/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, middleName, lastName, level, grade, phones, guardianPhones })
  });
  const data = await res.json();
  if (res.ok && data.studentId) {
    alert('تم تسجيل الطالب وكوده هو: ' + data.studentId);
  } else {
    alert('حدث خطأ أثناء التسجيل');
  }
  document.getElementById('studentRegistrationForm').reset();
  document.getElementById('studentPhonesContainer').innerHTML = '';
  document.getElementById('guardianPhonesContainer').innerHTML = '';
}

document.getElementById('studentRegistrationForm').addEventListener('submit', addStudent);
// استبدال القوائم المتعددة بقوائم منسدلة لاختيار واحد فقط للمستوى والصف
const studentLevelDiv = document.getElementById('studentLevel');
studentLevelDiv.innerHTML = `<select id="studentLevelSelect" style="width:140px;">
  <option value="">اختر المستوى</option>
  <option value="ابتدائى">ابتدائى</option>
  <option value="اعدادى">اعدادى</option>
  <option value="ثانوى">ثانوى</option>
</select>`;

const studentClassDiv = document.getElementById('studentClass');
studentClassDiv.innerHTML = `<select id="studentClassSelect" style="width:140px;">
  <option value="">اختر الصف</option>
  <option value="الأول">الأول</option>
  <option value="الثانى">الثانوى</option>
  <option value="الثالث">الثالث</option>
  <option value="الرابع">الرابع</option>
  <option value="الخامس">الخامس</option>
  <option value="السادس">السادس</option>
</select>`;

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
  await fetch('http://localhost:3001/subjects', {
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
    await fetch('http://localhost:3001/subjects/' + id, { method: 'DELETE' });
    loadSubjects();
  }
}

// نظام التعديل داخل الجدول فقط
let editingSubjectId = null;

async function loadSubjects() {
  const res = await fetch('http://localhost:3001/subjects');
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
  await fetch('http://localhost:3001/subjects/' + id, {
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
  const res = await fetch('http://localhost:3001/subjects');
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
  await fetch('http://localhost:3001/teachers', {
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
  const res = await fetch('http://localhost:3001/teachers');
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
    await fetch('http://localhost:3001/teachers/' + id, { method: 'DELETE' });
    loadTeachers();
  }
}

// نظام التعديل داخل الجدول
let editingTeacherId = null;

async function loadTeachers() {
  const res = await fetch('http://localhost:3001/teachers');
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
  const notes = document.getElementById('edit-teacherNotes').value.trim();
  await fetch('http://localhost:3001/teachers/' + id, {
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
  const res = await fetch('http://localhost:3001/subjects');
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
  const res = await fetch('http://localhost:3001/groups');
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
    await fetch('http://localhost:3001/groups/' + id, { method: 'DELETE' });
    loadGroups();
  }
}

// تعديل مجموعة (inline edit)
let editingGroupId = null;
async function loadGroups() {
  const res = await fetch('http://localhost:3001/groups');
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
  await fetch('http://localhost:3001/groups/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, teacher, levels, classes, days, startTime, endTime })
  });
  editingGroupId = null;
  loadGroups();
}

// تحميل المواد والمدرسين لقائمة التعديل
async function loadSubjectsForEditGroup(selectedSubject) {
  const res = await fetch('http://localhost:3001/subjects');
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
  const res = await fetch('http://localhost:3001/teachers');
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
  loadUsers && loadUsers();
  loadSubjects && loadSubjects();
  loadSubjectsForTeacher();
  loadTeachers();
  loadGroups && loadGroups();
  loadSubjectsForGroup();
  loadTeachersForGroup();

  // تفعيل flatpickr على حقول الوقت
  initializeGroupTimeFields();
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
  
  console.log('Form data:', { subject, teacher, level, classValue, days, startTime, endTime }); // للتشخيص
  
  if (!subject || !teacher || !level || !classValue || days.length === 0 || !startTime || !endTime) {
    alert('يرجى إدخال جميع البيانات المطلوبة');
    return;
  }
  
  // تحويل القيم المفردة إلى مصفوفات ليطابق النموذج المتوقع
  const levels = [level];
  const classes = [classValue];
  
  await fetch('http://localhost:3001/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, teacher, levels, classes, days, startTime, endTime })
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
  const res = await fetch('http://localhost:3001/subjects');
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
  const res = await fetch('http://localhost:3001/teachers');
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
  const paymentsRes = await fetch('http://localhost:3001/payments');
  const payments = await paymentsRes.json();
  const subscriptionsRes = await fetch('http://localhost:3001/subscriptions');
  const subscriptions = await subscriptionsRes.json();
  const studentsRes = await fetch('http://localhost:3001/students');
  const students = await studentsRes.json();
  const subjectsRes = await fetch('http://localhost:3001/subjects');
  const subjects = await subjectsRes.json();
  const teachersRes = await fetch('http://localhost:3001/teachers');
  const teachers = await teachersRes.json();
  const groupsRes = await fetch('http://localhost:3001/groups');
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
      <td>${group ? group.subject + ' - ' + group.teacher : ''}</td>
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
  await fetch('http://localhost:3001/payments/updateMonths', { method: 'PUT' });
  const idInput = document.getElementById('searchPaymentId');
  const nameInput = document.getElementById('searchPaymentName');
  const id = idInput.value.trim();
  const name = nameInput.value.trim();
  const subscriptionsRes = await fetch('http://localhost:3001/subscriptions');
  const subscriptions = await subscriptionsRes.json();
  const studentsRes = await fetch('http://localhost:3001/students');
  const students = await studentsRes.json();
  const subjectsRes = await fetch('http://localhost:3001/subjects');
  const subjects = await subjectsRes.json();
  const teachersRes = await fetch('http://localhost:3001/teachers');
  const teachers = await teachersRes.json();
  const groupsRes = await fetch('http://localhost:3001/groups');
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
  const paymentsRes = await fetch('http://localhost:3001/payments');
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
      <td>${group ? group.subject + ' - ' + group.teacher : ''}</td>
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
  const paymentsRes = await fetch('http://localhost:3001/payments');
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
  const paymentsRes = await fetch('http://localhost:3001/payments');
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
    await fetch('http://localhost:3001/payments/status', {
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
  const res = await fetch('http://localhost:3001/subjects');
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
  const res = await fetch('http://localhost:3001/teachers');
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
  const res = await fetch('http://localhost:3001/groups');
  const groups = await res.json();
  const select = document.getElementById('attendanceGroup');
  select.innerHTML = '<option value="">اختر المجموعة</option>';
  groups.forEach(group => {
    const option = document.createElement('option');
    option.value = group.groupId || group._id || group.subject + '-' + group.teacher;
    option.textContent = group.subject + ' - ' + group.teacher;
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
        fetch('http://localhost:3001/subjects'),
        fetch('http://localhost:3001/teachers'),
        fetch('http://localhost:3001/groups')
      ]);
      
      allSubjects = await subjectsRes.json();
      allTeachers = await teachersRes.json();
      allGroups = await groupsRes.json();
      
      // ملء القوائم الأولية
      populateSelect(subjectSelect, allSubjects, 'subjectId', 'name', 'اختر المادة');
      populateSelect(teacherSelect, allTeachers, 'teacherId', 'firstName', 'اختر الأستاذ');
      populateSelect(groupSelect, allGroups, 'groupId', group => `${group.subject} - ${group.teacher}`, 'اختر المجموعة');
      
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
    
    populateSelect(groupSelect, filteredGroups, 'groupId', group => `${group.subject} - ${group.teacher}`, 'اختر المجموعة');
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
  const subscriptionsRes = await fetch('http://localhost:3001/subscriptions');
  const subscriptions = await subscriptionsRes.json();
  const studentsRes = await fetch('http://localhost:3001/students');
  const students = await studentsRes.json();
  const paymentsRes = await fetch('http://localhost:3001/payments');
  const payments = await paymentsRes.json();
  const attendanceRes = await fetch('http://localhost:3001/attendance');
  const attendanceList = await attendanceRes.json();
  const groupsRes = await fetch('http://localhost:3001/groups');
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
            await fetch('http://localhost:3001/attendance/status', {
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
      const studentsRes = await fetch('http://localhost:3001/students');
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
  // تحميل البيانات وإعادة تعيين النماذج
  loadEmergencyData();
  document.getElementById('emergencySection').style.display = 'block';
}

async function loadEmergencyData() {
  try {
    const response = await fetch('/groups');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    emergencyGroupsData = await response.json();
    
    console.log('تم تحميل بيانات المجموعات:', emergencyGroupsData);
    
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
    option.textContent = `${group.groupId} - أيام: ${group.days.join('، ')} - وقت: ${group.startTime} - ${group.endTime}`;
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
    
    // استخدام dayjs مع المنطقة الزمنية الصحيحة
    const now = new Date(); // للعرض فقط في المتصفح
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
  
  // تنسيق التواريخ للعرض
  const todayFormattedDisplay = today.toLocaleDateString('ar-EG', {
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  
  const tomorrowFormattedDisplay = tomorrow.toLocaleDateString('ar-EG', {
    weekday: 'long', 
    day: 'numeric',
    month: 'long' 
  });
  
  // إنشاء نافذة اختيار مخصصة
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    modal.innerHTML = `
      <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center;">
        <h3 style="margin-bottom: 20px; color: #856404;">🗓️ تحديد تاريخ بداية التغيير</h3>
        
        <div style="margin: 20px 0; font-size: 16px; line-height: 1.6;">
          <p><strong>📅 اليوم:</strong> ${todayFormattedDisplay}</p>
          <p><strong>📅 غداً:</strong> ${tomorrowFormattedDisplay}</p>
        </div>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; font-size: 14px;">
          <strong>💡 ملحوظة:</strong><br>
          الأيام قبل التاريخ المختار ستبقى كما هي<br>
          الأيام من التاريخ المختار فما بعد ستُحدث بالأيام الجديدة
        </div>
        
        <div style="margin-top: 25px; display: flex; justify-content: center; gap: 20px; align-items: center;">
          <button id="chooseToday" style="background-color: #007bff; color: white; padding: 12px 25px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; min-width: 200px;">
            ✅ من اليوم (${todayFormattedDisplay})
          </button>
          <button id="chooseTomorrow" style="background-color: #28a745; color: white; padding: 12px 25px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; min-width: 200px;">
            ⏭️ من غداً (${tomorrowFormattedDisplay})
          </button>
        </div>
        
        <div style="margin-top: 15px;">
          <button id="cancelChoice" style="background-color: #6c757d; color: white; padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer;">
            ❌ إلغاء
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('chooseToday').onclick = () => {
      document.body.removeChild(modal);
      resolve('today');
    };
    
    document.getElementById('chooseTomorrow').onclick = () => {
      document.body.removeChild(modal);
      resolve('tomorrow');
    };
    
    document.getElementById('cancelChoice').onclick = () => {
      document.body.removeChild(modal);
      resolve(null);
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
    const response = await fetch('/system-settings');
    console.log('📡 تم استلام الاستجابة:', response.status);
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

👤 معلومات المستخدم الحالي:
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
    const settings = {
      institutionName: document.getElementById('institutionName').value.trim(),
      institutionTimezone: document.getElementById('institutionTimezone').value
    };
    
    if (!settings.institutionTimezone) {
      alert('يرجى اختيار المنطقة الزمنية');
      return;
    }
    
    const response = await fetch('/system-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('تم حفظ الإعدادات بنجاح! قد تحتاج لإعادة تشغيل السيرفر لتطبيق بعض التغييرات.');
      hideSystemSettings();
    } else {
      alert('فشل حفظ الإعدادات: ' + (data.error || 'خطأ غير معروف'));
    }
  } catch (error) {
    console.error('خطأ في حفظ الإعدادات:', error);
    alert('خطأ في الاتصال بالخادم');
  }
}

async function autoDetectTimezone() {
  try {
    const loadingMsg = document.createElement('div');
    loadingMsg.textContent = '🔍 جاري الكشف التلقائي للمنطقة الزمنية...';
    loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:20px;border:2px solid #28a745;border-radius:8px;z-index:9999;';
    document.body.appendChild(loadingMsg);
    
    const response = await fetch('/system-settings/auto-detect-timezone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    document.body.removeChild(loadingMsg);
    
    if (data.success) {
      alert(`تم كشف المنطقة الزمنية تلقائياً: ${data.detected.timezone}\nالدولة: ${data.detected.country || 'غير محدد'}\nالمدينة: ${data.detected.city || 'غير محدد'}`);
      loadSystemSettings(); // إعادة تحميل لإظهار التحديث
    } else {
      alert('فشل الكشف التلقائي. يرجى اختيار المنطقة يدوياً من القائمة.');
    }
  } catch (error) {
    console.error('خطأ في الكشف التلقائي:', error);
    alert('خطأ في الكشف التلقائي');
  }
}

async function emergencyUpdate() {
  try {
    // 1. التحقق من البيانات الأساسية
    const groupId = getCurrentSelectedGroup();
    
    if (!groupId) {
      alert('❌ يرجى اختيار مجموعة للتحديث');
      return;
    }
    
    // 2. عرض معلومات المجموعة المختارة
    const groupName = getGroupDisplayName(groupId);
    
    const preConfirm = confirm(`
📋 تأكيد اختيار المجموعة:
- المجموعة المختارة: ${groupName}
- معرف المجموعة: ${groupId}

هل هذه هي المجموعة الصحيحة؟
    `);
    
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
    
    const confirmMessage = `
⚠️ تأكيد نهائي للتحديث الطارئ

📋 تفاصيل العملية:
- المجموعة: ${groupName}
- معرف المجموعة: ${groupId}
- تاريخ البداية: ${startDate.toLocaleDateString('ar-EG')}

🔄 ما سيحدث:
- الأيام قبل ${startDate.toLocaleDateString('ar-EG')} → تُحفظ كما هي
- الأيام من ${startDate.toLocaleDateString('ar-EG')} فما بعد → تُحدث بالأيام الجديدة

هل تريد المتابعة؟
    `;
    
    if (!confirm(confirmMessage)) return;
    
    // 5. إرسال الطلب
    const loadingMessage = document.createElement('div');
    loadingMessage.innerHTML = '⏳ جاري التحديث الطارئ...';
    loadingMessage.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:20px;border:2px solid #007bff;border-radius:8px;z-index:9999;';
    document.body.appendChild(loadingMessage);
    
    const response = await fetch('/attendance/emergency-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        groupId,
        startFrom: startChoice
      })
    });
    
    document.body.removeChild(loadingMessage);
    
    const result = await response.json();
    
    if (result.success) {
      alert(`
✅ تم التحديث الطارئ بنجاح!

📊 إحصائيات العملية:
- المجموعة: ${groupName}
- عدد الطلاب المحدثين: ${result.updatedRecords} طالب
- الأيام الماضية المحفوظة: ${result.preservedPastDays} يوم
- الأيام المستقبلية المُعاد بناؤها: ${result.rebuiltFutureDays} يوم
- الشهر المستهدف: ${result.targetMonth}
- تاريخ البداية: ${new Date(result.startDate).toLocaleDateString('ar-EG')}
- وقت العملية: ${new Date(result.timestamp).toLocaleString('ar-EG')}

🎯 النتيجة: لا يوجد فقدان للبيانات التاريخية!
      `);
      
      // إخفاء قسم الطوارئ
      hideEmergencySection();
      
      // إعادة تحميل البيانات إذا كان في قسم الحضور
      if (typeof loadAttendanceData === 'function') {
        loadAttendanceData();
      }
      
    } else {
      alert(`❌ خطأ في التحديث: ${result.error}`);
    }
    
  } catch (error) {
    console.error('خطأ في التحديث الطارئ:', error);
    alert(`❌ خطأ في الاتصال: ${error.message}`);
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

// 🔐 دوال للتعامل مع قائمة الصلاحيات (نفس نظام custom-multiselect)
function getSelectedPermissions() {
  const selectedPermissions = [];
  const checkboxes = document.querySelectorAll('#customPermissions input[type="checkbox"]:checked');
  
  checkboxes.forEach(checkbox => {
    selectedPermissions.push({
      value: checkbox.value,
      text: checkbox.parentElement.textContent.trim()
    });
  });
  
  return selectedPermissions;
}

// دالة لتحديد الصلاحيات الافتراضية حسب الدور
function setDefaultPermissionsByRole(role) {
  const checkboxes = document.querySelectorAll('#customPermissions input[type="checkbox"]');
  
  // إلغاء جميع التحديدات أولاً
  checkboxes.forEach(checkbox => checkbox.checked = false);
  
  // تحديد الصلاحيات حسب الدور
  switch(role) {
    case 'admin':
      // المدير له جميع الصلاحيات
      checkboxes.forEach(checkbox => checkbox.checked = true);
      break;
      
    case 'receptionist':
      // موظف الاستقبال - صلاحيات الاستقبال والتسجيل
      const receptionMain = document.querySelector('#customPermissions input[value="reception_registration"]');
      const receptionSubs = document.querySelectorAll('#customPermissions input[value="register_student"], #customPermissions input[value="manage_subscriptions"], #customPermissions input[value="manage_payments"]');
      
      if (receptionMain) receptionMain.checked = true;
      receptionSubs.forEach(sub => sub.checked = true);
      break;
      
    case 'follow_up_staff':
      // موظف المتابعة - صلاحية المتابعة والحضور فقط
      const followUpCheckbox = document.querySelector('#customPermissions input[value="follow_up_attendance"]');
      if (followUpCheckbox) followUpCheckbox.checked = true;
      break;
  }
  
  // تحديث حالة الصلاحيات الرئيسية حسب الفرعية
  updateMainPermissionsState();
  
  // تحديث النص المعروض في القائمة
  updatePermissionsDisplay();
}

// دالة لتحديث حالة الصلاحيات الرئيسية حسب الفرعية
function updateMainPermissionsState() {
  const permissionGroups = document.querySelectorAll('#customPermissions .permission-group');
  
  permissionGroups.forEach(group => {
    const mainCheckbox = group.querySelector('.main-checkbox');
    const subCheckboxes = group.querySelectorAll('.sub-permission input[type="checkbox"]');
    
    if (mainCheckbox && subCheckboxes.length > 0) {
      const checkedSubs = Array.from(subCheckboxes).filter(cb => cb.checked);
      mainCheckbox.checked = checkedSubs.length === subCheckboxes.length;
      mainCheckbox.indeterminate = checkedSubs.length > 0 && checkedSubs.length < subCheckboxes.length;
    }
  });
}

// دالة لتحديث النص المعروض في صندوق الاختيار
function updatePermissionsDisplay() {
  const selectBox = document.querySelector('#customPermissions .select-box');
  const selectedPermissions = getSelectedPermissions();
  
  if (selectedPermissions.length === 0) {
    selectBox.textContent = 'اختر الصلاحيات';
  } else if (selectedPermissions.length === 1) {
    selectBox.textContent = selectedPermissions[0].text;
  } else {
    selectBox.textContent = `تم اختيار ${selectedPermissions.length} صلاحيات`;
  }
}

// دالة للحصول على الصلاحيات المختارة (محدثة للقوائم المتداخلة)
function getSelectedPermissions() {
  const checkboxes = document.querySelectorAll('#customPermissions input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(checkbox => {
    const label = checkbox.closest('label');
    const text = label ? label.textContent.trim() : checkbox.value;
    return {
      value: checkbox.value,
      text: text
    };
  });
}

// ربط تغيير الدور بتحديث الصلاحيات
document.addEventListener('DOMContentLoaded', function() {
  const roleSelect = document.getElementById('role');
  if (roleSelect) {
    roleSelect.addEventListener('change', function() {
      setDefaultPermissionsByRole(this.value);
    });
  }
  
  // إضافة وظائف فتح/إغلاق للقائمة المنسدلة للصلاحيات
  const permissionsMultiselect = document.getElementById('customPermissions');
  if (permissionsMultiselect) {
    const selectBox = permissionsMultiselect.querySelector('.select-box');
    const optionsList = permissionsMultiselect.querySelector('.options-list');
    
    if (selectBox && optionsList) {
      selectBox.addEventListener('click', function(e) {
        optionsList.style.display = optionsList.style.display === 'block' ? 'none' : 'block';
        permissionsMultiselect.classList.toggle('open');
        e.stopPropagation();
      });
      
      document.addEventListener('click', function(e) {
        if (!permissionsMultiselect.contains(e.target)) {
          optionsList.style.display = 'none';
          permissionsMultiselect.classList.remove('open');
        }
      });
    }
    
    // إضافة وظائف للقوائم المتداخلة
    setupNestedPermissions();
  }
  
  // ربط تحديث العرض عند تغيير الصلاحيات
  const permissionCheckboxes = document.querySelectorAll('#customPermissions input[type="checkbox"]');
  permissionCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updatePermissionsDisplay);
  });
  
  // إضافة event listener عالمي لإغلاق قوائم التعديل
  document.addEventListener('click', function(e) {
    const editContainer = document.getElementById('editCustomPermissions');
    if (editContainer && !editContainer.contains(e.target)) {
      const optionsList = editContainer.querySelector('.options-list');
      if (optionsList) {
        optionsList.style.display = 'none';
        editContainer.classList.remove('open');
      }
    }
  });
});

// دالة لإعداد القوائم المتداخلة
function setupNestedPermissions() {
  const permissionGroups = document.querySelectorAll('#customPermissions .permission-group');
  
  permissionGroups.forEach(group => {
    const mainPermission = group.querySelector('.main-permission');
    const subPermissions = group.querySelector('.sub-permissions');
    const expandArrow = group.querySelector('.expand-arrow');
    const mainCheckbox = group.querySelector('.main-checkbox');
    const subCheckboxes = group.querySelectorAll('.sub-permission input[type="checkbox"]');
    
    // إذا كان هناك سهم توسيع (يعني أن هناك صلاحيات فرعية)
    if (expandArrow && subPermissions) {
      // النقر على السهم أو النص لفتح/إغلاق الصلاحيات الفرعية
      expandArrow.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleSubPermissions(group, subPermissions);
      });
      
      mainPermission.querySelector('span').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleSubPermissions(group, subPermissions);
      });
    }
    
    // عند تحديد الصلاحية الرئيسية، تحديد/إلغاء تحديد جميع الصلاحيات الفرعية
    if (mainCheckbox && subCheckboxes.length > 0) {
      mainCheckbox.addEventListener('change', function() {
        subCheckboxes.forEach(subCheckbox => {
          subCheckbox.checked = this.checked;
        });
        updatePermissionsDisplay();
      });
      
      // عند تحديد الصلاحيات الفرعية، تحديث حالة الصلاحية الرئيسية
      subCheckboxes.forEach(subCheckbox => {
        subCheckbox.addEventListener('change', function() {
          const checkedSubs = Array.from(subCheckboxes).filter(cb => cb.checked);
          mainCheckbox.checked = checkedSubs.length === subCheckboxes.length;
          mainCheckbox.indeterminate = checkedSubs.length > 0 && checkedSubs.length < subCheckboxes.length;
          updatePermissionsDisplay();
        });
      });
    }
  });
}

// دالة لفتح/إغلاق الصلاحيات الفرعية
function toggleSubPermissions(group, subPermissions) {
  const isExpanded = group.classList.contains('expanded');
  
  if (isExpanded) {
    subPermissions.style.display = 'none';
    group.classList.remove('expanded');
  } else {
    subPermissions.style.display = 'block';
    group.classList.add('expanded');
  }
}

console.log('🔐 تم تحميل نظام الصلاحيات البسيط');
