document.addEventListener('DOMContentLoaded', () => {
    const mainTabsEl = document.querySelector('#default-tab');
    const subTabsEl = document.querySelector('#subtahap-tab');

    const savedMain = localStorage.getItem('activeMainTab');
    const savedSub = localStorage.getItem('activeTabId');

    // 1. Trigger tab utama dari localStorage
    setTimeout(() => {
      // 1. Aktifkan tab utama jika ada di localStorage
      if (savedMain) {
        const mainBtn = document.querySelector(`#default-tab [data-tabs-target="${savedMain}"]`);
        if (mainBtn) mainBtn.click();
      }

      // 2. Aktifkan sub-tab jika ada dan tab utama == #tahap
      if (savedSub && savedMain === '#tahap') {
        const subBtn = document.querySelector(`#subtahap-tab [data-tabs-target="${savedSub}"]`);
        if (subBtn) subBtn.click();
      }
    }, 100); // delay sedikit biar Flowbite siap

    // 3. Saat klik tab utama, simpan ID-nya
    document.querySelectorAll('#default-tab [data-tabs-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        localStorage.setItem('activeMainTab', btn.getAttribute('data-tabs-target'));
        localStorage.removeItem('activeTabId');
      });
    });

    // 4. Saat klik tab tahap (sub), simpan ID-nya
    document.querySelectorAll('#subtahap-tab [data-tabs-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        localStorage.setItem('activeTabId', btn.getAttribute('data-tabs-target'));
        localStorage.setItem('activeMainTab', '#tahap');
      });
    });
  });