function renderPieChart(chartId, chartTitle) {
  const el = document.getElementById(chartId);
  if (!el) return;

  const hasData = el.dataset.hasdata === "true";
  if (!hasData) {
    el.innerHTML = "<p class='text-center text-gray-500'>📭 Tidak ada data</p>";
    return;
  }

  const labels = JSON.parse(el.dataset.labels);
  const data = JSON.parse(el.dataset.data);

  const options = {
    series: data,
    colors: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#8b5cf6', '#f472b6'],
    chart: {
      height: 380,
      width: "100%",
      type: "pie",
    },
    stroke: {
      colors: ["white"],
      lineCap: "",
    },
    plotOptions: {
      pie: {
        labels: {
          show: true,
        },
        size: "100%",
      },
    },
    labels: labels,
    dataLabels: {
      enabled: true,
      style: {
        fontFamily: "Inter, sans-serif",
      },
    },
    legend: {
      position: "bottom",
      fontFamily: "Inter, sans-serif",
    },
    yaxis: {
      labels: {
        formatter: function (value) {
          return value
        },
      },
    },
    xaxis: {
      labels: {
        formatter: function (value) {
          return value  + "%"
        },
      },
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
    },
  };

  const chart = new ApexCharts(el, options);
  chart.render();
}

window.addEventListener('load', function () {
  renderPieChart("pie-satker", "Jumlah Kegiatan per Satker");
});
