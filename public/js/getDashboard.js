  async function loadKegiatanSummary() {
    const token = localStorage.getItem('token'); // atau ambil dari tempat lain
    const res = await fetch('/surveys/summary');
    const data = await res.json();

    // Tampilkan angka
    document.getElementById('berjalanKegiatan').textContent = data.status.berjalan;
    document.getElementById('selesaiKegiatan').textContent = data.status.selesai;
    document.getElementById('terlambatKegiatan').textContent = data.status.terlambat;
    document.getElementById('belumMulaiKegiatan').textContent = data.status.belumMulai;

    // Pie chart per program
    const programLabels = Object.keys(data.perProgram);
    const programCounts = Object.values(data.perProgram);
    new ApexCharts(document.querySelector("#chartProgram"), {
      chart: {
        height: 400,
        width: "100%",
        type: "donut", 
      },
      labels: programLabels,
      series: programCounts,
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
      },
    }).render();

    const direktoratLabels = Object.keys(data.perDirektorat);
    const direktoratCounts = Object.values(data.perDirektorat);
    new ApexCharts(document.querySelector("#chartDirektorat"), {
      chart: { type: 'donut', height: 400 },
      labels: direktoratLabels,
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
      },
    }).render();

    // Line chart per tahun
    const tahunLabels = Object.keys(data.perTahun);
    const tahunCounts = Object.values(data.perTahun);
    new ApexCharts(document.querySelector("#chartTahun"), {
      chart: { type: 'line', height: 400 },
      xaxis: { categories: tahunLabels },
      series: [{ name: 'Kegiatan', data: tahunCounts }],
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
            cssClass: 'text-xs font-normal fill-gray-800 dark:fill-gray-400'
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
  }

  window.addEventListener('DOMContentLoaded', loadKegiatanSummary);
