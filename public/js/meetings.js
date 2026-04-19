// Quản lý lịch họp - Calendar View

// Ngày hiện tại đang xem (đầu tuần)
let currentWeekStart = getMonday(new Date());

// Tên thứ viết tắt tiếng Việt
const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// Kiểm tra đăng nhập
(function checkAuth() {
  if (!getAuthToken()) {
    window.location.href = '/index.html';
    return;
  }
  initSidebar();
  loadFilterRooms();
  renderCalendar();
  loadCalendarMeetings();
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

// Lấy thứ Hai của tuần chứa ngày date
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Lấy mảng 7 ngày trong tuần
function getWeekDays(mondayDate) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

// Cập nhật label ngày hiện tại
function updateDateLabel() {
  const days = getWeekDays(currentWeekStart);
  const first = days[0];
  const last = days[6];
  const opts = { month: 'long', year: 'numeric' };
  const label = document.getElementById('currentDateLabel');
  if (first.getMonth() === last.getMonth()) {
    label.textContent = `${first.getDate()} - ${last.getDate()} Tháng ${first.getMonth() + 1}, ${first.getFullYear()}`;
  } else {
    label.textContent = `${first.getDate()}/${first.getMonth() + 1} - ${last.getDate()}/${last.getMonth() + 1}, ${last.getFullYear()}`;
  }
}

// Render khung calendar (header + grid giờ)
function renderCalendar() {
  updateDateLabel();
  const days = getWeekDays(currentWeekStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Header row
  let headerHtml = '<div class="calendar-header-cell"></div>';
  days.forEach((d, i) => {
    const isToday = d.getTime() === today.getTime();
    headerHtml += `<div class="calendar-header-cell ${isToday ? 'today' : ''}">
      ${DAY_NAMES[i]}
      <span class="day-number">${d.getDate()}</span>
    </div>`;
  });

  // Time column + day columns (6h - 22h)
  let timeColHtml = '';
  for (let h = 6; h <= 22; h++) {
    timeColHtml += `<div class="calendar-time-slot">${String(h).padStart(2, '0')}:00</div>`;
  }

  let dayColsHtml = '';
  for (let i = 0; i < 7; i++) {
    let hourLines = '';
    for (let h = 6; h <= 22; h++) {
      hourLines += '<div class="calendar-hour-line"></div>';
    }
    dayColsHtml += `<div class="calendar-day-col" id="dayCol${i}">${hourLines}</div>`;
  }

  const container = document.getElementById('calendarContainer');
  container.innerHTML = `
    <div class="calendar-header-row">${headerHtml}</div>
    <div class="calendar-body">
      <div class="calendar-time-col">${timeColHtml}</div>
      ${dayColsHtml}
    </div>`;
}

// Điều hướng tuần
function navigateWeek(direction) {
  currentWeekStart.setDate(currentWeekStart.getDate() + direction * 7);
  renderCalendar();
  loadCalendarMeetings();
}

// Về hôm nay
function goToToday() {
  currentWeekStart = getMonday(new Date());
  renderCalendar();
  loadCalendarMeetings();
}

// Tải danh sách phòng cho bộ lọc
async function loadFilterRooms() {
  try {
    const rooms = await apiCall(`/rooms/?status=${ROOM_STATUS.AVAILABLE}`);
    const select = document.getElementById('filterRoom');
    (rooms || []).forEach((r) => {
      select.innerHTML += `<option value="${r.id}">${r.name}</option>`;
    });
  } catch (error) {
    // Bỏ qua
  }
}

// Hiển thị loading overlay trên calendar
function showCalendarLoading() {
  removeCalendarOverlay();
  const body = document.querySelector('.calendar-body');
  if (!body) return;
  const overlay = document.createElement('div');
  overlay.className = 'calendar-loading-overlay';
  overlay.innerHTML = '<div class="loading-spinner"></div><span>Đang tải dữ liệu...</span>';
  body.appendChild(overlay);
}

// Hiển thị trạng thái trống trên calendar
function showCalendarEmpty() {
  removeCalendarOverlay();
  const body = document.querySelector('.calendar-body');
  if (!body) return;
  const overlay = document.createElement('div');
  overlay.className = 'calendar-empty-overlay';
  overlay.innerHTML = '<div class="icon">📭</div><span>Không có cuộc họp nào trong tuần này</span>';
  body.appendChild(overlay);
}

// Xóa overlay (loading/empty) khỏi calendar
function removeCalendarOverlay() {
  document.querySelectorAll('.calendar-loading-overlay, .calendar-empty-overlay').forEach((el) => el.remove());
}

// Tải cuộc họp cho tuần hiện tại
async function loadCalendarMeetings() {
  showCalendarLoading();
  const days = getWeekDays(currentWeekStart);
  const weekStart = days[0];
  const weekEnd = new Date(days[6]);
  weekEnd.setHours(23, 59, 59);

  let query = `?start_at=${encodeURIComponent(weekStart.toISOString())}&end_at=${encodeURIComponent(weekEnd.toISOString())}`;
  const roomId = document.getElementById('filterRoom').value;
  if (roomId) query += `&room_id=${roomId}`;

  try {
    const data = await apiCall(`/meetings/${query}`);
    let meetings = Array.isArray(data) ? data : (data && data.items ? data.items : []);

    // Lọc client-side phòng backup nếu API không hỗ trợ filter
    if (roomId) {
      meetings = meetings.filter((m) => String(m.room_id) === String(roomId));
    }
    // Lọc client-side theo tuần đang xem
    meetings = meetings.filter((m) => {
      const s = new Date(m.start_at);
      return s >= weekStart && s <= weekEnd;
    });

    removeCalendarOverlay();
    renderCalendarEvents(meetings);

    // Hiển thị trạng thái trống nếu không có cuộc họp
    if (meetings.length === 0) {
      showCalendarEmpty();
    }
  } catch (error) {
    removeCalendarOverlay();
    showToast('Không thể tải lịch họp', 'error');
  }
}

// Render sự kiện lên calendar
function renderCalendarEvents(meetings) {
  // Xóa event cũ
  document.querySelectorAll('.calendar-event').forEach((el) => el.remove());

  const days = getWeekDays(currentWeekStart);
  const START_HOUR = 6;

  meetings.forEach((m) => {
    const start = new Date(m.start_at);
    const end = new Date(m.end_at);

    // Tìm cột ngày tương ứng
    const dayIndex = days.findIndex((d) => {
      return d.getDate() === start.getDate()
        && d.getMonth() === start.getMonth()
        && d.getFullYear() === start.getFullYear();
    });
    if (dayIndex === -1) return;

    const col = document.getElementById(`dayCol${dayIndex}`);
    if (!col) return;

    // Tính vị trí top và height (48px = 1 giờ)
    const startMinutes = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
    const endMinutes = (end.getHours() - START_HOUR) * 60 + end.getMinutes();
    const top = (startMinutes / 60) * 48;
    const height = Math.max(((endMinutes - startMinutes) / 60) * 48, 20);

    // Class theo loại
    let typeClass = '';
    if (m.type === MEETING_TYPE.ONLINE) typeClass = 'type-online';
    else if (m.type === MEETING_TYPE.HYBRID) typeClass = 'type-hybrid';

    const timeStr = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')} - ${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;

    const event = document.createElement('div');
    event.className = `calendar-event ${typeClass}`;
    event.style.top = `${top}px`;
    event.style.height = `${height}px`;
    event.innerHTML = `<div class="event-title">${m.title || ''}</div><div class="event-time">${timeStr}</div>`;
    event.onclick = () => editMeeting(m.id);
    col.appendChild(event);
  });
}

// Tải danh sách phòng cho dropdown trong modal
async function loadRoomsForSelect() {
  const startAt = document.getElementById('meetingStart').value;
  const endAt = document.getElementById('meetingEnd').value;
  let query = `?status=${ROOM_STATUS.AVAILABLE}`;
  if (startAt) query += `&start_at=${encodeURIComponent(startAt)}`;
  if (endAt) query += `&end_at=${encodeURIComponent(endAt)}`;

  try {
    const rooms = await apiCall(`/rooms/${query}`);
    const select = document.getElementById('meetingRoom');
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Chọn phòng --</option>';
    (rooms || []).forEach((r) => {
      const location = r.location || 'Chưa rõ';
      const name = r.name || '';
      const capacity = r.capacity || 0;
      select.innerHTML += `<option value="${r.id}">${location} - ${name} - ${capacity} người</option>`;
    });
    if (currentVal) select.value = currentVal;
  } catch (error) {
    // Bỏ qua lỗi tải phòng
  }
}

// Khi thay đổi thời gian, tải lại danh sách phòng trống
function onTimeChange() {
  loadRoomsForSelect();
}

// Mở modal tạo mới
function openCreateModal() {
  document.getElementById('modalTitle').textContent = 'Tạo cuộc họp mới';
  document.getElementById('meetingForm').reset();
  document.getElementById('meetingId').value = '';
  loadRoomsForSelect();
  onMeetingTypeChange();
  document.getElementById('meetingModal').classList.add('active');
}

// Xử lý thay đổi loại cuộc họp
function onMeetingTypeChange() {
  const type = parseInt(document.getElementById('meetingType').value);
  const roomGroup = document.getElementById('roomGroup');
  const linkGroup = document.getElementById('linkGroup');
  const roomSelect = document.getElementById('meetingRoom');
  const linkInput = document.getElementById('meetingLink');

  const showRoom = type === MEETING_TYPE.IN_PERSON || type === MEETING_TYPE.HYBRID;
  const showLink = type === MEETING_TYPE.ONLINE || type === MEETING_TYPE.HYBRID;

  roomGroup.style.display = showRoom ? '' : 'none';
  linkGroup.style.display = showLink ? '' : 'none';
  roomSelect.required = showRoom;
  linkInput.required = showLink;

  if (!showRoom) roomSelect.value = '';
  if (!showLink) linkInput.value = '';
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
    onMeetingTypeChange();
    if (meeting.link) {
      document.getElementById('meetingLink').value = meeting.link;
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
  const linkVal = document.getElementById('meetingLink').value;
  const body = {
    title: document.getElementById('meetingTitle').value,
    description: document.getElementById('meetingDescription').value,
    type: parseInt(document.getElementById('meetingType').value),
    start_at: document.getElementById('meetingStart').value,
    end_at: document.getElementById('meetingEnd').value,
  };
  if (roomVal) body.room_id = parseInt(roomVal);
  if (linkVal) body.link = linkVal;

  try {
    if (id) {
      await apiCall(`/meetings/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Cập nhật cuộc họp thành công');
    } else {
      await apiCall('/meetings/', { method: 'POST', body: JSON.stringify(body) });
      showToast('Tạo cuộc họp thành công');
    }
    closeModal();
    loadCalendarMeetings();
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
    loadCalendarMeetings();
  } catch (error) {
    showToast(error.message || 'Xóa thất bại', 'error');
  }
}
