document.addEventListener('DOMContentLoaded', function () {
  const provinceSelect = document.getElementById('province');
  const satkerSelect = document.getElementById('satker');

  function filterSatkersByProvince(provinceCode) {
    const options = satkerSelect.querySelectorAll('option');

    options.forEach(option => {
      const optionProvince = option.getAttribute('data-province');

      if (!optionProvince || provinceCode === '') {
        option.style.display = '';
      } else if (optionProvince === provinceCode) {
        option.style.display = '';
      } else {
        option.style.display = 'none';
      }
    });

    satkerSelect.selectedIndex = 0;
  }

  provinceSelect.addEventListener('change', function () {
    try {
      const selectedProvince = JSON.parse(decodeURIComponent(this.value));
      filterSatkersByProvince(selectedProvince.code); // atau .id
    } catch (e) {
      filterSatkersByProvince('');
    }
  });

  // Trigger saat load jika ada nilai `old`
  const oldProvince = provinceSelect.value;
  if (oldProvince) {
    try {
      const parsed = JSON.parse(decodeURIComponent(oldProvince));
      filterSatkersByProvince(parsed.code);
    } catch (e) {
      // skip
    }
  }
});
