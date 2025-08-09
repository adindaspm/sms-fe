function attachUploadHandler(formId, fileInputId, tahap) {
    const form = document.getElementById(formId);
    if (!form) return;

    // Hapus listener lama kalau ada, biar gak double
    form.replaceWith(form.cloneNode(true));
    const newForm = document.getElementById(formId);

    newForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const fileInput = document.getElementById(fileInputId);

        if (!fileInput.files.length) {
            await sendError('Pilih file terlebih dahulu.');
            return location.reload();
        }

        const file = fileInput.files[0];
        if (file.type !== 'application/pdf') {
            await sendError('Hanya file PDF yang diperbolehkan.');
            return location.reload();
        }

        if (file.size > 5 * 1024 * 1024) {
            await sendError('Ukuran file lebih dari 5MB.');
            return location.reload();
        }

        const formData = new FormData(newForm);

        try {
            const res = await fetch(`/surveys/upload/tahap/${newForm.dataset.kegiatanId}/${tahap}`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                await sendSuccess('Berhasil upload file!');
            } else {
                const errText = await res.text();
                await sendError(errText || 'Gagal upload file.');
            }
        } catch (err) {
            console.error(err);
            await sendError('Terjadi kesalahan pada server. Coba lagi nanti!');
        }

        location.reload();
    });
}

async function sendError(message) {
    await fetch('/set-error-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    });
}

async function sendSuccess(message) {
    await fetch('/set-success-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    });
}

// Pasang handler untuk masing-masing form
attachUploadHandler('uploadFormDisseminate', 'fileDisseminate', 7);
attachUploadHandler('uploadFormEvaluate', 'fileEvaluate', 8);
