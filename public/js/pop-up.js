let selectedUrl = '';

  // Saat tombol "Edit" ditekan, ambil URL target-nya
  document.querySelectorAll('[data-modal-toggle="popup-modal"]').forEach(button => {
    button.addEventListener('click', () => {
      selectedUrl = button.getAttribute('data-url');
    });
  });

  // Submit form POST saat klik "Ya, Lanjut"
  document.getElementById('confirm-redirect').addEventListener('click', async () => {
    if (!selectedUrl) return;

    try {
      const response = await fetch(selectedUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        await fetch('/set-success-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: 'Berhasil menandai selesai' })
        });
        location.reload(); // atau location.replace(location.href) biar ga nambah history
      } else {
        await fetch('/set-error-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: 'Gagal menandai selesai' })
        });
        location.reload(); // atau location.replace(location.href) biar ga nambah history
      }
    } catch (err) {
      console.error(err);
      await fetch('/set-error-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: 'Terjadi kesalahan jaringan' })
      });
      location.reload();
    }
  });

  // Fungsi untuk menutup modal sukses/error
  function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
  }
