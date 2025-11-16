// دوال توليد البيانات
function generateUsername() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  let username = '';
  if (firstName.length >= 3 && lastName.length >= 2) {
    username = firstName.substring(0, 3) + lastName.slice(-2);
  } else if (firstName && lastName) {
    username = firstName + lastName;
  }
  document.getElementById('username').value = username.toLowerCase();
}

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) password += chars[Math.floor(Math.random() * chars.length)];
  document.getElementById('password').value = password;
}

function checkGeneratePasswordAvailability() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const btn = document.getElementById('generatePassword');
  if (firstName && lastName) {
    btn.disabled = false;
  } else {
    btn.disabled = true;
  }
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

// دوال عرض وإدارة المستخدمين
let editingId = null;

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
  try {
    const res = await fetch('/api/users?filter=' + encodeURIComponent(filter));
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
            <td><input type="text" value="${user.password}" id="edit-password"><button type="button" id="edit-generatePassword" class="btn btn-secondary" onclick="generateEditPassword()" style="margin-right:10px; padding:5px 10px;">توليد كلمة مرور</button></td>
            <td>
              <select id="edit-role" onchange="updateEditPermissionsByRole()" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="admin"${user.role==='admin'?' selected':''}>مدير</option>
                <option value="receptionist"${user.role==='receptionist'?' selected':''}>موظف استقبال</option>
                <option value="follow_up_staff"${user.role==='follow_up_staff'?' selected':''}>موظف متابعة</option>
              </select>
            </td>
            <td>
              <div class="edit-permissions-container">
                <div class="custom-multiselect nested-permissions" id="editCustomPermissions">
                  <div class="select-box" onclick="toggleEditPermissions()" style="cursor: pointer; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: white;">تعديل الصلاحيات</div>
                  <div class="options-list" style="display: none; position: absolute; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 200px; overflow-y: auto; width: 250px; z-index: 1000;">
                    ${generatePermissionsHTML(user.permissions || {}, 'edit')}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <button onclick="saveUserEdit('${user._id}')" class="btn btn-success" style="margin-right: 5px;">حفظ</button>
              <button onclick="cancelUserEdit()" class="btn btn-secondary">إلغاء</button>
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
              <button onclick="editUser('${user._id}')" class="btn btn-warning" style="margin-right: 5px;">تعديل</button>
              <button onclick="deleteUser('${user._id}')" class="btn btn-danger">حذف</button>
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
            <button onclick="editUser('${user._id}')" class="btn btn-warning" style="margin-right: 5px;">تعديل</button>
            <button onclick="deleteUser('${user._id}')" class="btn btn-danger">حذف</button>
          </td>
        `;
      }
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('خطأ في تحميل المستخدمين:', error);
    alert('خطأ في تحميل بيانات المستخدمين');
  }
}

// دوال تعديل وحذف المستخدمين
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
  
  fetch('/api/users/' + id, {
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
    fetch('/api/users/' + id, { method: 'DELETE' })
      .then(() => loadUsers())
      .catch(error => {
        console.error('خطأ في حذف المستخدم:', error);
        alert('خطأ في حذف المستخدم');
      });
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

// 🔐 دوال للتعامل مع قائمة الصلاحيات
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
      
      const textSpan = mainPermission.querySelector('span');
      if (textSpan) {
        textSpan.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          toggleSubPermissions(group, subPermissions);
        });
      }
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

// دالة لإعداد الصلاحيات في وضع التعديل
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
}

// دالة لتحديث نص الصلاحيات في وضع التعديل
function updateEditPermissionsDisplay() {
  const editContainer = document.getElementById('editCustomPermissions');
  if (!editContainer) return;
  
  const selectBox = editContainer.querySelector('.select-box');
  const checkboxes = editContainer.querySelectorAll('input[type="checkbox"]:checked');
  
  if (checkboxes.length === 0) {
    selectBox.textContent = 'تعديل الصلاحيات';
  } else if (checkboxes.length === 1) {
    selectBox.textContent = checkboxes[0].parentElement.textContent.trim();
  } else {
    selectBox.textContent = `تم اختيار ${checkboxes.length} صلاحيات`;
  }
}

// دالة لفتح/إغلاق قائمة الصلاحيات في التعديل
function toggleEditPermissions() {
  const editContainer = document.getElementById('editCustomPermissions');
  if (!editContainer) return;
  
  const optionsList = editContainer.querySelector('.options-list');
  if (optionsList) {
    const isVisible = optionsList.style.display === 'block';
    optionsList.style.display = isVisible ? 'none' : 'block';
    editContainer.classList.toggle('open', !isVisible);
  }
}

// دالة لتحديث الصلاحيات في التعديل حسب الدور
function updateEditPermissionsByRole() {
  const role = document.getElementById('edit-role').value;
  const editContainer = document.getElementById('editCustomPermissions');
  if (!editContainer) return;
  
  const checkboxes = editContainer.querySelectorAll('input[type="checkbox"]');
  
  // إلغاء جميع التحديدات أولاً
  checkboxes.forEach(checkbox => checkbox.checked = false);
  
  // تحديد الصلاحيات حسب الدور
  switch(role) {
    case 'admin':
      checkboxes.forEach(checkbox => checkbox.checked = true);
      break;
    case 'receptionist':
      const receptionMain = editContainer.querySelector('input[value="reception_registration"]');
      const receptionSubs = editContainer.querySelectorAll('input[value="register_student"], input[value="manage_subscriptions"], input[value="manage_payments"]');
      if (receptionMain) receptionMain.checked = true;
      receptionSubs.forEach(sub => sub.checked = true);
      break;
    case 'follow_up_staff':
      const followUpCheckbox = editContainer.querySelector('input[value="follow_up_attendance"]');
      if (followUpCheckbox) followUpCheckbox.checked = true;
      break;
  }
  
  // تحديث العرض
  updateEditPermissionsDisplay();
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔧 تهيئة صفحة إدارة المستخدمين...');
  
  // ربط الأحداث
  ['firstName', 'lastName'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', () => {
        generateUsername();
        checkGeneratePasswordAvailability();
      });
    }
  });

  const generatePasswordBtn = document.getElementById('generatePassword');
  if (generatePasswordBtn) {
    generatePasswordBtn.addEventListener('click', generatePassword);
  }

  const roleSelect = document.getElementById('role');
  if (roleSelect) {
    roleSelect.addEventListener('change', function() {
      setDefaultPermissionsByRole(this.value);
    });
  }

  const searchInput = document.getElementById('search');
  const modalSearchInput = document.getElementById('modalSearch');
  
  if (searchInput) {
    searchInput.addEventListener('input', () => loadUsers(searchInput.value.trim()));
  }

  if (modalSearchInput) {
    modalSearchInput.addEventListener('input', () => loadUsers(modalSearchInput.value.trim()));
  }

  // إعداد النموذج
  const userForm = document.getElementById('userForm');
  if (userForm) {
    userForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // جمع الصلاحيات المختارة
      const selectedPermissions = getSelectedPermissions();
      const permissionsObject = {};
      
      // تحويل array الصلاحيات إلى object
      selectedPermissions.forEach(permission => {
        permissionsObject[permission.value] = true;
      });
      
      const user = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value.trim(),
        role: document.getElementById('role').value,
        permissions: permissionsObject
      };
      
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        
        const result = await response.json();
        
        if (response.ok) {
          console.log('✅ تم إضافة المستخدم بنجاح:', result);
          loadUsers();
          this.reset();
          document.getElementById('username').value = '';
          document.getElementById('password').value = '';
          
          // إعادة تعيين الصلاحيات
          const checkboxes = document.querySelectorAll('#customPermissions input[type="checkbox"]');
          checkboxes.forEach(checkbox => checkbox.checked = false);
          updatePermissionsDisplay();
          
          checkGeneratePasswordAvailability();
        } else {
          console.error('❌ خطأ في إضافة المستخدم:', result.error);
          alert('خطأ: ' + result.error);
        }
      } catch (error) {
        console.error('❌ خطأ في الشبكة:', error);
        alert('خطأ في الاتصال بالخادم');
      }
    });
  }

  // إعداد قائمة الصلاحيات
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
    
    // إعداد القوائم المتداخلة
    setupNestedPermissions();
    
    // ربط تحديث العرض عند تغيير الصلاحيات
    const permissionCheckboxes = document.querySelectorAll('#customPermissions input[type="checkbox"]');
    permissionCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updatePermissionsDisplay);
    });
  }

  // تحميل المستخدمين
  loadUsers();
  checkGeneratePasswordAvailability();
  
  console.log('✅ تم تهيئة صفحة إدارة المستخدمين بنجاح');
});

console.log('🔐 تم تحميل جميع دوال إدارة المستخدمين والصلاحيات');
