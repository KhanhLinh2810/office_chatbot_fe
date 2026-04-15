// Xử lý đăng nhập và đăng ký

// Kiểm tra nếu đã đăng nhập thì chuyển trang
(function checkAuth() {
  const token = getAuthToken();
  if (token && !window.location.pathname.includes('register')) {
    window.location.href = '/chat.html';
  }
})();

// Hiển thị lỗi
function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.style.display = 'block';
}

// Ẩn lỗi
function hideError() {
  document.getElementById('errorMsg').style.display = 'none';
}

// Xử lý form đăng nhập
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Đang đăng nhập...';

    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: document.getElementById('email').value,
          password: document.getElementById('password').value,
        }),
      });
      if (data) {
        // Hỗ trợ nhiều dạng response token từ backend
        const token = data.access_token || data.token || '';
        if (!token) {
          showError('Không nhận được token từ server');
          return;
        }
        setAuthToken(token);
        // Lưu thông tin user nếu có
        const userInfo = data.user || data.user_info || null;
        if (userInfo) {
          localStorage.setItem('user_info', JSON.stringify(userInfo));
        }
        window.location.href = '/chat.html';
      }
    } catch (error) {
      showError(error.message || 'Đăng nhập thất bại');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Đăng nhập';
    }
  });
}

// Xử lý form đăng ký
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;
    if (password !== confirm) {
      showError('Mật khẩu xác nhận không khớp');
      return;
    }

    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = 'Đang đăng ký...';

    try {
      await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: document.getElementById('fullName').value,
          email: document.getElementById('email').value,
          password: password,
        }),
      });
      // Đăng ký thành công, chuyển về trang đăng nhập
      window.location.href = '/index.html?registered=1';
    } catch (error) {
      showError(error.message || 'Đăng ký thất bại');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Đăng ký';
    }
  });
}
