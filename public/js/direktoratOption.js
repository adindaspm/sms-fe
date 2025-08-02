document.addEventListener('DOMContentLoaded', function () {
  const satkerSelect = document.getElementById('satker');
  const deputiSelect = document.getElementById('deputi');
  const direktoratSelect = document.getElementById('direktorat');

  function showDirectorat(satkerCode) {
    if (satkerCode === '0000') {
        document.getElementById('direktoratField').classList.remove('hidden');
        document.getElementById('deputiField').classList.remove('hidden');
    } else {
        document.getElementById('direktoratField').classList.add('hidden');
        document.getElementById('deputiField').classList.add('hidden');
    }
  }

  function filterDirektoratsByDeputi(deputiCode) {
    const options = direktoratSelect.querySelectorAll('option');

    options.forEach(option => {
      const optionDeputi = option.getAttribute('data-deputi');

      if (!optionDeputi || deputiCode === '') {
        option.style.display = '';
      } else if (optionDeputi === deputiCode) {
        option.style.display = '';
      } else {
        option.style.display = 'none';
      }
    });
  }

  deputiSelect.addEventListener('change', function () {
    try {
      const selectedDeputi = JSON.parse(decodeURIComponent(this.value));
      filterDirektoratsByDeputi(selectedDeputi.code); // atau .id
    } catch (e) {
      filterDirektoratsByDeputi('');
    }
  });

  satkerSelect.addEventListener('change', function () {
    const satker = JSON.parse(decodeURIComponent(this.value));
    showDirectorat(satker.code);
  });

  const oldSatker = satkerSelect.value;
  if (oldSatker) {
    try {
      const parsed = JSON.parse(decodeURIComponent(oldSatker));
      showDirectorat(parsed.code);
    } catch (e) {
      // skip
    }
  }
  // Trigger saat load jika ada nilai `old`
  const oldDeputi = deputiSelect.value;
  const oldDirektorat = direktoratSelect.value;
  if (oldDeputi) {
    try {
      const parsedDeputi = JSON.parse(decodeURIComponent(oldDeputi));
      filterDirektoratsByDeputi(parsedDeputi.code);

      // Setelah filtering, set kembali selected direktorat jika ada
      if (oldDirektorat) {
        const parsedDirektorat = JSON.parse(decodeURIComponent(oldDirektorat));
        const options = direktoratSelect.querySelectorAll('option');
        options.forEach(option => {
          try {
            const optValue = JSON.parse(decodeURIComponent(option.value));
            if (optValue.id === parsedDirektorat.id) {
              option.selected = true;
            }
          } catch (e) {
            // skip
          }
        });
      }

    } catch (e) {
      filterDirektoratsByDeputi('');
    }
  }
  
});
