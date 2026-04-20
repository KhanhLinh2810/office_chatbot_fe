// Xử lý giao diện chatbot

// Kiểm tra đăng nhập
(function checkAuth() {
  if (!getAuthToken()) {
    window.location.href = '/index.html';
    return;
  }
  initSidebar();
})();

// Lấy thời gian hiện tại dạng HH:mm
function getCurrentTime() {
  return new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Thêm tin nhắn vào khung chat
function appendMessage(text, type) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `message ${type}`;
  div.innerHTML = `${text}<span class="time">${getCurrentTime()}</span>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// Hiển thị trạng thái đang gõ
function showTyping() {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'message bot';
  div.id = 'typingIndicator';
  div.innerHTML = '<div class="loading-spinner"></div> Đang suy nghĩ...';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// Xóa trạng thái đang gõ
function removeTyping() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

// Gửi tin nhắn
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  appendMessage(text, 'user');
  input.value = '';
  showTyping();

  try {
    // Gửi tin nhắn tới API chatbot
    const response = await processChat(text);
    removeTyping();
    appendMessage(response, 'bot');
  } catch (error) {
    removeTyping();
    appendMessage('Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.', 'bot');
  }
}

// Xử lý logic chatbot đơn giản
async function processChat(message) {
  const lower = message.toLowerCase();

  // Xử lý các lệnh liên quan đến lịch họp
  if (lower.includes('lịch họp') || lower.includes('cuộc họp')) {
    return await handleMeetingQuery(lower);
  }
  // Xử lý các lệnh liên quan đến phòng họp
  if (lower.includes('phòng họp') || lower.includes('phòng')) {
    return await handleRoomQuery();
  }
  // Câu chào
  if (lower.includes('xin chào') || lower.includes('hello') || lower.includes('hi')) {
    return 'Xin chào! Tôi có thể giúp bạn xem lịch họp, phòng họp, hoặc quản lý người dùng. Hãy hỏi tôi nhé!';
  }
  // Mặc định
  return 'Tôi có thể giúp bạn với:\n• Xem lịch họp hôm nay\n• Danh sách phòng họp\n• Quản lý người dùng\n\nHãy thử hỏi "lịch họp hôm nay" hoặc "danh sách phòng họp"!';
}

// Xử lý truy vấn lịch họp
async function handleMeetingQuery(text) {
  try {
    const meetings = await apiCall('/meetings/');
    if (!meetings || meetings.length === 0) {
      return 'Hiện tại không có cuộc họp nào được lên lịch.';
    }
    const list = meetings.slice(0, 5).map((m) => {
      const start = new Date(m.start_at).toLocaleString('vi-VN');
      return `• <b>${m.title}</b> - ${start}`;
    });
    return `Danh sách cuộc họp gần đây:\n${list.join('\n')}`;
  } catch (error) {
    return 'Không thể tải danh sách cuộc họp. Vui lòng thử lại sau.';
  }
}

// Xử lý truy vấn phòng họp
async function handleRoomQuery() {
  try {
    const rooms = await apiCall('/rooms/');
    if (!rooms || rooms.length === 0) {
      return 'Hiện tại chưa có phòng họp nào trong hệ thống.';
    }
    const list = rooms.map((r) => {
      return `• <b>${r.number_room}</b> - Sức chứa: ${r.capacity} người`;
    });
    return `Danh sách phòng họp:\n${list.join('\n')}`;
  } catch (error) {
    return 'Không thể tải danh sách phòng họp. Vui lòng thử lại sau.';
  }
}

// Hiển thị thông báo toast
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
