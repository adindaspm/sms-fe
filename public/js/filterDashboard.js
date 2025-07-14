  const rawData = document.getElementById('surveiContainer').dataset.survei;
  const listSurvei = JSON.parse(rawData);
  const itemsPerPage = 5;
  let currentPage = 1;

  const surveiListContainer = document.getElementById('surveiList');
  const paginationContainer = document.getElementById('paginationContainer');
  const searchInput = document.getElementById('searchInput');
  const yearFilter = document.getElementById('yearFilter');

  function renderSurveiList(filteredData) {
    surveiListContainer.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagedData = filteredData.slice(start, end);

    if (pagedData.length === 0) {
      surveiListContainer.innerHTML = '<p class="text-sm text-gray-600">Tidak ada survei yang ditemukan.</p>';
      return;
    }

    pagedData.forEach(survei => {
      const html = `
        <div>
          <h3 class="text-base font-medium">${survei.name}</h3>
          <p class="text-sm text-gray-800">Status: ${survei.status} | Direktorat: ${survei.namaDirektoratPJ}</p>
          <div class="w-full bg-gray-200 rounded-full dark:bg-gray-700">
            <div class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style="width: ${survei.progress}%">${survei.progress}%</div>
          </div>
        </div>`;
      surveiListContainer.insertAdjacentHTML('beforeend', html);
    });
  }

  function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    paginationContainer.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = `mx-1 px-3 py-1 rounded ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`;
      btn.addEventListener('click', () => {
        currentPage = i;
        updateUI();
      });
      paginationContainer.appendChild(btn);
    }
  }

  function getFilteredData() {
    const keyword = searchInput.value.toLowerCase();
    const year = yearFilter.value;

    return listSurvei.filter(s => {
      const matchKeyword = s.name.toLowerCase().includes(keyword);
      const matchYear = !year || s.year === year;
      return matchKeyword && matchYear;
    });
  }

  function updateUI() {
    const filteredData = getFilteredData();
    renderSurveiList(filteredData);
    renderPagination(filteredData.length);
  }

  searchInput.addEventListener('input', () => {
    currentPage = 1;
    updateUI();
  });

  yearFilter.addEventListener('change', () => {
    currentPage = 1;
    updateUI();
  });

  // Inisialisasi awal
  updateUI();
