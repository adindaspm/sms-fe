let selectedUrl = '';

  // Saat tombol "Edit" ditekan, ambil URL target-nya
  document.querySelectorAll('[data-modal-toggle="popup-modal"]').forEach(button => {
    button.addEventListener('click', () => {
      selectedUrl = button.getAttribute('data-url');
    });
  });

  // Submit form POST saat klik "Ya, Lanjut"
  document.getElementById('confirm-redirect').addEventListener('click', () => {
    if (selectedUrl) {
      const form = document.getElementById('confirm-form');
      form.setAttribute('action', selectedUrl);
      form.submit();
    }
  });

  // Fungsi untuk menutup modal sukses/error
  function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
  }
