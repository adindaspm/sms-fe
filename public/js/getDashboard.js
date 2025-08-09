  async function loadKegiatanSummary() {
    const token = localStorage.getItem('token'); // atau ambil dari tempat lain
    document.getElementById('summaryLoader').classList.remove('hidden');
    document.getElementById('summaryContent').classList.add('hidden');
    document.getElementById('summaryError').classList.add('hidden');

    try {
      const tahun = document.getElementById('yearFilter').value;
      const direktoratId = document.getElementById('direktoratFilter').value;

      const res = await fetch(`/summaryKegiatan?tahun=${tahun}&direktoratId=${direktoratId}`);

      const data = await res.json();

      const totalCount = Object.values(data.status || {}).reduce((sum, val) => sum + val, 0);

      if (!data || totalCount === 0) {
        document.getElementById('summaryNothing').classList.remove('hidden');
      } else {
        document.getElementById('summaryNothing').classList.add('hidden');
      }

      // Tampilkan angka
      console.log(data.status.berjalan, data.status.selesai, data.status.terlambat, data.status.belumMulai);
      document.getElementById('berjalanKegiatan').textContent = data.status.berjalan;
      document.getElementById('selesaiKegiatan').textContent = data.status.selesai;
      document.getElementById('terlambatKegiatan').textContent = data.status.terlambat;
      document.getElementById('belumMulaiKegiatan').textContent = data.status.belumMulai;

      // Pie chart per output
      const outputLabels = Object.keys(data.perOutput);
      const outputCounts = Object.values(data.perOutput);
      new ApexCharts(document.querySelector("#chartOutput"), {
        chart: {
          height: 400,
          width: "100%",
          type: "donut", 
        },
        colors: ["#1C64F2", "#16BDCA", "#FDBA8C", "#E74694"],
        labels: outputLabels,
        dataLabels: {
          enabled: false,
        },
        series: outputCounts,
        tooltip: {
          shared: true,
          intersect: false,
          style: {
              fontFamily: "Inter, sans-serif",
          },
        },
        stroke: {
          colors: ["transparent"],
          lineCap: "",
        },
        legend: {
          position: "bottom",
          fontFamily: "Inter, sans-serif",
          fontSize: '15px',  
        },
        plotOptions: {
          pie: {
            donut: {
              labels: {
                show: true,
                name: {
                  show: true,
                  fontFamily: "Inter, sans-serif",
                  offsetY: 20,
                },
                total: {
                  showAlways: true,
                  show: true,
                  label: "Kegiatan",
                  fontFamily: "Inter, sans-serif",
                  formatter: function (w) {
                    const sum = w.globals.seriesTotals.reduce((a, b) => {
                      return a + b
                    }, 0)
                    return sum
                  },
                },
                value: {
                  show: true,
                  fontFamily: "Inter, sans-serif",
                  offsetY: -20,
                  formatter: function (value) {
                    return value
                  },
                },
              },
              size: "80%",
            },
          },
        },
      }).render();

      const direktoratLabels = Object.keys(data.perDirektorat);
      const direktoratCounts = Object.values(data.perDirektorat);
      new ApexCharts(document.querySelector("#chartDirektorat"), {
        chart: { type: 'donut', height: 400 },
        colors: ["#1C64F2", "#16BDCA", "#FDBA8C", "#E74694"],
        labels: direktoratLabels,
        dataLabels: {
          enabled: false,
        },
        series: direktoratCounts,
        tooltip: {
          shared: true,
          intersect: false,
          style: {
              fontFamily: "Inter, sans-serif",
          },
        },
        stroke: {
          colors: ["transparent"],
          lineCap: "",
        },
        legend: {
          position: "bottom",
          fontFamily: "Inter, sans-serif",
          fontSize: '15px',
        },
        plotOptions: {
          pie: {
            donut: {
              labels: {
                show: true,
                name: {
                  show: true,
                  fontFamily: "Inter, sans-serif",
                  offsetY: 20,
                },
                total: {
                  showAlways: true,
                  show: true,
                  label: "Kegiatan",
                  fontFamily: "Inter, sans-serif",
                  formatter: function (w) {
                    const sum = w.globals.seriesTotals.reduce((a, b) => {
                      return a + b
                    }, 0)
                    return sum
                  },
                },
                value: {
                  show: true,
                  fontFamily: "Inter, sans-serif",
                  offsetY: -20,
                  formatter: function (value) {
                    return value
                  },
                },
              },
              size: "80%",
            },
          },
        },
      }).render();

      // Line chart per tahun
      const tahunLabels = Object.keys(data.perTahun);
      const tahunCounts = Object.values(data.perTahun);
      new ApexCharts(document.querySelector("#chartTahun"), {
        chart: { type: 'line', height: 400 },
        xaxis: { categories: tahunLabels },
        series: [{ name: 'Kegiatan', data: tahunCounts }],
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "70%",
            borderRadiusApplication: "end",
            borderRadius: 8,
          },
        },
        tooltip: {
          shared: true,
          intersect: false,
          style: {
              fontFamily: "Inter, sans-serif",
          },
        },
      }).render();

      // Bar chart per fase
      const faseLabels = Object.keys(data.perFase);
      const faseCounts = Object.values(data.perFase);
      new ApexCharts(document.querySelector("#chartFase"), {
        chart: { type: 'bar', height: 400 },
        plotOptions: {
          bar: {
              horizontal: false,
              columnWidth: "70%",
              borderRadiusApplication: "end",
              borderRadius: 8,
          },
        },
        xaxis: {
          categories: faseLabels,
          floating: false,
          labels: {
              show: true,
              style: {
                fontFamily: "Inter, sans-serif",
                cssClass: 'text-sm font-normal fill-gray-800 dark:fill-gray-400',
              }
          },
          axisBorder: {
              show: false,
          },
          axisTicks: {
              show: false,
          },
        },
        stroke: {
          show: true,
          width: 0,
          colors: ["transparent"],
        },
        series: [{ name: 'Kegiatan', data: faseCounts }]
      }).render();
    } catch (error) {
      console.error('Gagal memuat ringkasan kegiatan:', error);
      document.getElementById('summaryError').classList.remove('hidden');
    } finally {
      document.getElementById('summaryLoader').classList.add('hidden');
      // Tampilkan konten hanya jika tidak error
      if (document.getElementById('summaryError').classList.contains('hidden') && document.getElementById('summaryNothing').classList.contains('hidden')) {
        document.getElementById('summaryContent').classList.remove('hidden');
      }
    }
  }

  window.addEventListener('DOMContentLoaded', loadKegiatanSummary);
  document.getElementById('applyFilter').addEventListener('click', loadKegiatanSummary);
  
  document.getElementById('resetFilter').addEventListener('click', () => {
    document.getElementById('yearFilter').value = '';
    document.getElementById('direktoratFilter').value = '';
    loadKegiatanSummary();
  });
