document.addEventListener("DOMContentLoaded", function () {
  const realisasiForm = document.getElementById("tanggalRealisasiForm");
  const formActionUrl = document.getElementById("formActionUrl");
  const editInput = document.getElementById("editSubTahap");

  // Saat ikon di klik, isi hidden input URL untuk submit
  document.querySelectorAll("[data-modal-target='edit-realisasi']").forEach(icon => {
    icon.addEventListener("click", function () {
      const url = this.getAttribute("data-url"); 
      formActionUrl.value = url; 
    });
  });

  // Saat submit form
  realisasiForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const tanggal = editInput.value;
    const url = formActionUrl.value;

    if (!tanggal) {
      alert("Tanggal realisasi tidak boleh kosong");
      return;
    }

    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggalRealisasi: tanggal })
      });

      await fetch('/set-success-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Tanggal realisasi berhasil diperbarui' })
      });

      location.reload();
    } catch (err) {
      console.error(err);
      await fetch('/set-error-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Tanggal realisasi gagal diperbarui' })
      });
      location.reload();
    }
  });
});
