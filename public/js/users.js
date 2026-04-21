// Quản lý người dùng

// Kiểm tra đăng nhập + quyền admin
(function checkAuth() {
  if (!getAuthToken()) {
    window.location.href = '/index.html';
    return;
  }
  if (!isAdmin()) {
    window.location.href = '/chat.html';
    return;
  }
  initSidebar();
  loadUsers();
})();

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Tải danh sách người dùng
async function loadUsers() {
  const content = document.getElementById('usersContent');
  try {
    // API trả về danh sách qua calendar hoặc endpoint khác
    // Dùng endpoint get-calendar để lấy danh sách user
    const users = await apiCall('/users/');
    renderUsers(Array.isArray(users) ? users : []);
  } catch (error) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <p>Không thể tải dữ liệu. ${error.message}</p>
        <button class="btn btn-primary" onclick="loadUsers()" style="margin-top:1rem;">Thử lại</button>
      </div>`;
  }
}

// Hiển thị bảng người dùng
function renderUsers(users) {
  const content = document.getElementById('usersContent');
  if (users.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="icon">👥</div>
        <p>Chưa có người dùng nào</p>
      </div>`;
    return;
  }

  const rows = users.map((u) => {
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email;
    const roleVal = u.role === 1 || u.role === 'admin';
    const roleBadge = roleVal
      ? '<span class="badge badge-admin">Quản trị</span>'
      : '<span class="badge badge-active">Người dùng</span>';
    return `<tr>
      <td>${name}</td>
      <td>${u.email || ''}</td>
      <td>${roleBadge}</td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-sm btn-outline" onclick="editUser('${u.id}')">Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}')">Xóa</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  content.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Họ và tên</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// Mở modal tạo mới
function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'Thêm người dùng mới';
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  document.getElementById('passwordGroup').style.display = 'block';
  loadManagerSelect();
  document.getElementById('userModal').classList.add('active');
}

// Đóng modal
function closeModal() {
  document.getElementById('userModal').classList.remove('active');
}

// Tải danh sách user cho dropdown manager
async function loadManagerSelect(currentManagerId) {
  const select = document.getElementById('userManager');
  select.innerHTML = '<option value="">-- Không có --</option>';
  try {
    const users = await apiCall('/users/');
    const list = Array.isArray(users) ? users : [];
    list.forEach((u) => {
      const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email;
      select.innerHTML += `<option value="${u.id}">${name} (${u.email})</option>`;
    });
    if (currentManagerId) select.value = currentManagerId;
  } catch (error) {
    // Bỏ qua lỗi
  }
}

// Sửa người dùng
async function editUser(id) {
  try {
    const user = await apiCall(`/users/${id}`);
    if (!user) return;
    document.getElementById('modalTitle').textContent = 'Sửa người dùng';
    document.getElementById('userId').value = id;
    document.getElementById('userFirstName').value = user.first_name || '';
    document.getElementById('userLastName').value = user.last_name || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('passwordGroup').style.display = 'none';
    // Role: 0 = user, 1 = admin
    const roleVal = (user.role === 1 || user.role === 'admin') ? '1' : '0';
    document.getElementById('userRoleSelect').value = roleVal;
    await loadManagerSelect(user.manager_id || '');
    document.getElementById('userModal').classList.add('active');
  } catch (error) {
    showToast('Không thể tải thông tin người dùng', 'error');
  }
}

// Lưu người dùng
async function saveUser() {
  const id = document.getElementById('userId').value;
  const managerVal = document.getElementById('userManager').value;
  const body = {
    first_name: document.getElementById('userFirstName').value,
    last_name: document.getElementById('userLastName').value,
    email: document.getElementById('userEmail').value,
    role: parseInt(document.getElementById('userRoleSelect').value),
  };
  if (managerVal) body.manager_id = parseInt(managerVal);

  // Thêm mật khẩu nếu tạo mới
  if (!id) {
    body.password = document.getElementById('userPassword').value;
  }

  try {
    if (id) {
      await apiCall(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Cập nhật người dùng thành công');
    } else {
      await apiCall('/users/', { method: 'POST', body: JSON.stringify(body) });
      showToast('Thêm người dùng thành công');
    }
    closeModal();
    loadUsers();
  } catch (error) {
    showToast(error.message || 'Lưu thất bại', 'error');
  }
}

// Xóa người dùng
async function deleteUser(id) {
  if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return;
  try {
    await apiCall(`/users/${id}`, { method: 'DELETE' });
    showToast('Đã xóa người dùng');
    loadUsers();
  } catch (error) {
    showToast(error.message || 'Xóa thất bại', 'error');
  }
}
