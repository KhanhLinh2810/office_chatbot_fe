// Cấu hình API cho ứng dụng Office Chatbot
const API_CONFIG = {
  // Dùng proxy local để tránh CORS
  baseUrl: 'http://localhost:3000/api/v1',
  // Thời gian chờ tối đa (ms)
  timeout: 10000,
};

// Lấy token từ localStorage
function getAuthToken() {
  return localStorage.getItem('access_token') || '';
}

// Lưu token vào localStorage
function setAuthToken(token) {
  localStorage.setItem('access_token', token);
}

// Xóa token khi đăng xuất
function clearAuthToken() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_info');
}

// Lấy thông tin user từ localStorage
function getUserInfo() {
  return JSON.parse(localStorage.getItem('user_info') || '{}');
}

// Kiểm tra user có phải admin không (role = 1)
function isAdmin() {
  const user = getUserInfo();
  return user.role === 1 || user.role === 'admin';
}

// Lấy tên hiển thị (firstname + lastname)
function getDisplayName() {
  const user = getUserInfo();
  const first = user.first_name || user.firstname || '';
  const last = user.last_name || user.lastname || '';
  if (first || last) return `${first} ${last}`.trim();
  return user.full_name || user.name || user.email || 'Người dùng';
}

// Lấy label vai trò
function getRoleLabel() {
  return isAdmin() ? 'Quản trị viên' : 'Người dùng';
}

// Hiển thị thông tin user trên sidebar
function renderUserInfo() {
  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRole');
  if (nameEl) nameEl.textContent = getDisplayName();
  if (roleEl) roleEl.textContent = getRoleLabel();
}

// Ẩn/hiện menu admin trên sidebar
function renderSidebarByRole() {
  const adminLinks = document.querySelectorAll('.admin-only');
  const show = isAdmin();
  adminLinks.forEach((el) => {
    el.style.display = show ? '' : 'none';
  });
}

// Khởi tạo sidebar (gọi trong mỗi trang)
function initSidebar() {
  renderUserInfo();
  renderSidebarByRole();
}

// Đăng xuất
function logout() {
  clearAuthToken();
  window.location.href = '/index.html';
}

// Toggle sidebar trên mobile
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// Hàm gọi API chung với xử lý lỗi
async function apiCall(endpoint, options = {}) {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  const token = getAuthToken();
  const defaultHeaders = { 'Content-Type': 'application/json' };
  if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;

  const config = {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    config.signal = controller.signal;

    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    if (response.status === 401) {
      clearAuthToken();
      window.location.href = '/index.html';
      return null;
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Lỗi ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Yêu cầu đã hết thời gian chờ');
    }
    throw error;
  }
}
