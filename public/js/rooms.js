// Quản lý phòng họp

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
  loadRooms();
})();

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Tải danh sách phòng họp
async function loadRooms() {
  const content = document.getElementById('roomsContent');
  try {
    const rooms = await apiCall('/rooms/');
    renderRooms(rooms || []);
  } catch (error) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <p>Không thể tải dữ liệu. ${error.message}</p>
        <button class="btn btn-primary" onclick="loadRooms()" style="margin-top:1rem;">Thử lại</button>
      </div>`;
  }
}

// Hiển thị bảng phòng họp
function renderRooms(rooms) {
  const content = document.getElementById('roomsContent');
  if (rooms.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="icon">🏠</div>
        <p>Chưa có phòng họp nào</p>
      </div>`;
    return;
  }

  const rows = rooms.map((r) => {
    const statusLabel = ROOM_STATUS_LABEL[r.status] || 'Không rõ';
    const statusBadge = r.status === ROOM_STATUS.AVAILABLE
      ? `<span class="badge badge-active">${statusLabel}</span>`
      : `<span class="badge badge-inactive">${statusLabel}</span>`;
    return `<tr>
      <td>${r.number_room || ''}</td>
      <td>${r.capacity || ''} người</td>
      <td>${r.address || ''}</td>
      <td>${statusBadge}</td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-sm btn-outline" onclick="editRoom('${r.id}')">Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="deleteRoom('${r.id}')">Xóa</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  content.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Số phòng</th>
            <th>Sức chứa</th>
            <th>Địa chỉ</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// Mở modal tạo mới
function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'Thêm phòng họp mới';
  document.getElementById('roomForm').reset();
  document.getElementById('roomId').value = '';
  document.getElementById('roomModal').classList.add('active');
}

// Đóng modal
function closeModal() {
  document.getElementById('roomModal').classList.remove('active');
}

// Sửa phòng họp
async function editRoom(id) {
  try {
    const room = await apiCall(`/rooms/${id}`);
    if (!room) return;
    document.getElementById('modalTitle').textContent = 'Sửa phòng họp';
    document.getElementById('roomId').value = id;
    document.getElementById('roomName').value = room.number_room || '';
    document.getElementById('roomCapacity').value = room.capacity || '';
    document.getElementById('roomLocation').value = room.address || '';
    document.getElementById('roomStatus').value = room.status !== undefined ? room.status : 1;
    document.getElementById('roomModal').classList.add('active');
  } catch (error) {
    showToast('Không thể tải thông tin phòng họp', 'error');
  }
}

// Lưu phòng họp
async function saveRoom() {
  const id = document.getElementById('roomId').value;
  const body = {
    number_room: document.getElementById('roomName').value,
    capacity: parseInt(document.getElementById('roomCapacity').value),
    address: document.getElementById('roomLocation').value,
    status: parseInt(document.getElementById('roomStatus').value),
  };

  try {
    if (id) {
      await apiCall(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Cập nhật phòng họp thành công');
    } else {
      await apiCall('/rooms/', { method: 'POST', body: JSON.stringify(body) });
      showToast('Thêm phòng họp thành công');
    }
    closeModal();
    loadRooms();
  } catch (error) {
    showToast(error.message || 'Lưu thất bại', 'error');
  }
}

// Xóa phòng họp
async function deleteRoom(id) {
  if (!confirm('Bạn có chắc muốn xóa phòng họp này?')) return;
  try {
    await apiCall(`/rooms/${id}`, { method: 'DELETE' });
    showToast('Đã xóa phòng họp');
    loadRooms();
  } catch (error) {
    showToast(error.message || 'Xóa thất bại', 'error');
  }
}
