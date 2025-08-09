  const dummyNotifications = [
    {
      id: 1,
      message: "Data kegiatan berhasil diperbarui",
      link: "#",
      createdAt: "2025-07-10T10:00:00Z",
      isRead: false
    },
    {
      id: 2,
      message: "Pengguna baru ditambahkan",
      link: "#",
      createdAt: "2025-07-09T15:22:00Z",
      isRead: false
    },
    {
      id: 3,
      message: "Laporan bulanan tersedia",
      link: "#",
      createdAt: "2025-07-08T09:15:00Z",
      isRead: true
    }
  ];

  const notifList = document.getElementById('notifList');
  const notifBadge = document.getElementById('notifBadge');

  function renderNotifications(data) {
    notifList.innerHTML = '';
    const unreadCount = data.filter(n => !n.isRead).length;
    notifBadge.textContent = unreadCount;
    notifBadge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';

    if (data.length === 0) {
      notifList.innerHTML = `<li class="px-4 py-2 text-gray-500">Tidak ada notifikasi</li>`;
      return;
    }

    data.forEach(n => {
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="${n.link}" class="flex flex-col px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 ${n.isRead ? 'opacity-60' : ''}">
          <span class="font-medium">${n.message}</span>
          <span class="text-xs text-gray-400">${new Date(n.createdAt).toLocaleString()}</span>
        </a>
      `;
      notifList.appendChild(li);
    });
  }

  async function fetchNotifications() {
    const res = await fetch('/api/notifications', {
        headers: {
        Authorization: 'Bearer ' + localStorage.getItem('token') // atau dari session
        }
    });
    const data = await res.json();
    renderNotifications(data);
  }

  // On page load
  document.addEventListener('DOMContentLoaded', () => {
    renderNotifications(dummyNotifications);
  });
