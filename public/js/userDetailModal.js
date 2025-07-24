async function showUserDetailModal(userId) {
    try {
      // Ambil detail user
      const userRes = await fetch(`/users/detail/${userId}`);
      const user = await userRes.json();

      // Tampilkan ke modal
      document.getElementById('detailName').value = user.name || '-';
      document.getElementById('detailEmail').value = user.email || '-';
      document.getElementById('detailSatker').value = user.satker.name || '-';
      document.getElementById('detailRoles').value = user.roles?.map(r => r.name).join(', ') || '-';
      document.getElementById('detailStatus').value = user.isActive ? 'Aktif' : 'Tidak Aktif';
      document.getElementById('detailStatus').className = user.isActive ? 'block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 text-green-600 font-semibold' : 'block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 text-red-600 font-semibold';

      const btn = document.getElementById('gantiStatus');
      if (user.isActive === true){
        btn.innerText = 'Nonaktifkan pengguna';
        btn.onclick = async() => {
          try {
            const res = await fetch(`/users/${user.id}/deactivate`, {
              method: 'POST'
            });
            if (res.ok) {
              // console.log(res);
              await fetch('/set-success-message', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: 'Berhasil menonaktifkan pengguna' })
              });
              location.reload(); // refresh untuk ambil status baru
            } else {
              await fetch('/set-error-message', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: 'Gagal menonaktifkan pengguna' })
              });
            }
          } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan');
          }
        };
      } else {
        btn.innerText = 'Aktifkan pengguna';
        btn.onclick = async() =>  {
          try {
            const res = await fetch(`/users/${user.id}/activate`, {
              method: 'POST'
            });
            if (res.ok) {
              // console.log(res);
              await fetch('/set-success-message', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: 'Berhasil mengaktifkan pengguna' })
              });
              location.reload();
            } else {
              await fetch('/set-error-message', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: 'Gagal mengaktifkan pengguna' })
              });
            }
          } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan');
          }
      }};
      if (user.satker.code === '0000') {
        document.getElementById('direktoratField').classList.remove('hidden');
        document.getElementById('detailDirektorat').value = user.direktoratName || '-';
      } else {
        document.getElementById('direktoratField').classList.add('hidden');
      }

      // Show modal
      document.getElementById('userDetailModal').classList.remove('hidden');
    } catch (err) {
      alert('Gagal memuat detail pengguna.');
      console.error(err);
    }
  }

  function closeUserDetailModal() {
    document.getElementById('userDetailModal').classList.add('hidden');
  }