// Quản lý lịch họp

// Kiểm tra đăng nhập
(function checkAuth() {
  if (!getAuthToken()) {
    window.location.href = '/index.html';
    return;
  }
  initSidebar();
  loadMeetings();
})();

// Hiển thị thông báo toast
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Tải danh sách cuộc họp
async function loadMeetings() {
  const content = document.getElementById('meetingsContent');
  try {
    const meetings = await apiCall('/meetings/');
    renderMeetings(meetings || []);
  } catch (error) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <p>Không thể tải dữ liệu. ${error.message}</p>
        <button class="btn btn-primary" onclick="loadMeetings()" style="margin-top:1rem;">Thử lại</button>
      </div>`;
  }
}

// Hiển thị bảng cuộc họp
function renderMeetings(meetings) {
  const content = document.getElementById('meetingsContent');
  if (meetings.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="icon">📅</div>
        <p>Chưa có cuộc họp nào</p>
      </div>`;
    return;
  }

  const rows = meetings.map((m) => {
    const start = new Date(m.start_at).toLocaleString('vi-VN');
    const end = new Date(m.end_at).toLocaleString('vi-VN');
    const typeLabel = MEETING_TYPE_LABEL[m.type] || 'Không rõ';
    const statusLabel = MEETING_STATUS_LABEL[m.status] || 'Không rõ';
    const statusClass = m.status === MEETING_STATUS.SCHEDULED ? 'badge-active'
      : m.status === MEETING_STATUS.CANCELED ? 'badge-inactive' : 'badge-admin';
    return `<tr>
      <td>${m.title || ''}</td>
      <td>${m.description || ''}</td>
      <td>${typeLabel}</td>
      <td>${start}</td>
      <td>${end}</td>
      <td><span class="badge ${statusClass}">${statusLabel}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-sm btn-outline" onclick="editMeeting('${m.id}')">Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="deleteMeeting('${m.id}')">Xóa</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  content.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Tiêu đề</th>
            <th>Mô tả</th>
            <th>Loại</th>
            <th>Bắt đầu</th>
            <th>Kết thúc</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// Tải danh sách phòng cho dropdown
async function loadRoomsForSelect() {
  try {
    const rooms = await apiCall('/rooms/?status=1');
    const select = document.getElementById('meetingRoom');
    select.innerHTML = '<option value="">-- Chọn phòng --</option>';
    (rooms || []).forEach((r) => {
      const location = r.location || 'Chưa rõ';
      const name = r.name || '';
      const capacity = r.capacity || 0;
      select.innerHTML += `<option value="${r.id}">${location} - ${name} - ${capacity} người</option>`;
    });
  } catch (error) {
    // Bỏ qua lỗi tải phòng
  }
}

// Mở modal tạo mới
function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'Tạo cuộc họp mới';
  document.getElementById('meetingForm').reset();
  document.getElementById('meetingId').value = '';
  loadRoomsForSelect();
  document.getElementById('meetingModal').classList.add('active');
}

// Đóng modal
function closeModal() {
  document.getElementById('meetingModal').classList.remove('active');
}

// Sửa cuộc họp
async function editMeeting(id) {
  try {
    const meeting = await apiCall(`/meetings/${id}`);
    if (!meeting) return;
    document.getElementById('modalTitle').textContent = 'Sửa cuộc họp';
    document.getElementById('meetingId').value = id;
    document.getElementById('meetingTitle').value = meeting.title || '';
    document.getElementById('meetingDescription').value = meeting.description || '';
    // Định dạng datetime-local
    if (meeting.start_at) {
      document.getElementById('meetingStart').value = meeting.start_at.slice(0, 16);
    }
    if (meeting.end_at) {
      document.getElementById('meetingEnd').value = meeting.end_at.slice(0, 16);
    }
    await loadRoomsForSelect();
    if (meeting.room_id) {
      document.getElementById('meetingRoom').value = meeting.room_id;
    }
    if (meeting.type !== undefined) {
      document.getElementById('meetingType').value = meeting.type;
    }
    document.getElementById('meetingModal').classList.add('active');
  } catch (error) {
    showToast('Không thể tải thông tin cuộc họp', 'error');
  }
}

// Lưu cuộc họp (tạo mới hoặc cập nhật)
async function saveMeeting() {
  const id = document.getElementById('meetingId').value;
  const roomVal = document.getElementById('meetingRoom').value;
  const body = {
    title: document.getElementById('meetingTitle').value,
    description: document.getElementById('meetingDescription').value,
    type: parseInt(document.getElementById('meetingType').value),
    start_at: document.getElementById('meetingStart').value,
    end_at: document.getElementById('meetingEnd').value,
  };
  if (roomVal) body.room_id = parseInt(roomVal);

  try {
    if (id) {
      await apiCall(`/meetings/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Cập nhật cuộc họp thành công');
    } else {
      await apiCall('/meetings/', { method: 'POST', body: JSON.stringify(body) });
      showToast('Tạo cuộc họp thành công');
    }
    closeModal();
    loadMeetings();
  } catch (error) {
    showToast(error.message || 'Lưu thất bại', 'error');
  }
}

// Xóa cuộc họp
async function deleteMeeting(id) {
  if (!confirm('Bạn có chắc muốn xóa cuộc họp này?')) return;
  try {
    await apiCall(`/meetings/${id}`, { method: 'DELETE' });
    showToast('Đã xóa cuộc họp');
    loadMeetings();
  } catch (error) {
    showToast(error.message || 'Xóa thất bại', 'error');
  }
}
