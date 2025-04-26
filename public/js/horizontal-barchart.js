function renderHBarChart(chartId, chartTitle) {
  const el = document.getElementById(chartId);
  if (!el) return;

  const hasData = el.dataset.hasdata === "true";
  if (!hasData) {
    el.innerHTML = "<p class='text-center text-gray-500'>📭 Data tidak tersedia</p>";
    return;
  }  
    
  const labels = JSON.parse(el.dataset.labels);
  const data = JSON.parse(el.dataset.data);


    const options = {
      chart: {
        type: 'bar',
        height: '320px',
        fontFamily: "Inter, sans-serif",
        toolbar: {
          show: false,
        },
      },
      series: [{
        name: 'Jumlah Kegiatan',
        data: data
      }],
      xaxis: {
        categories: labels, 
        labels: {
          show: true,
          style: {
            fontFamily: "Inter, sans-serif",
            cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
          }
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      colors: ['#3b82f6'], // Tailwind blue-500
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      tooltip: {
        shared: true,
        intersect: false,
        style: {
          fontFamily: "Inter, sans-serif",
        },
      },
      grid: {
        show: false,
        strokeDashArray: 4,
        padding: {
          left: 2,
          right: 2,
          top: -14
        },
      },
      yaxis: {
        labels: {
          show: true,
          style: {
            fontFamily: "Inter, sans-serif",
            cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
          }
        }
      },
      fill: {
        opacity: 1,
      },
      stroke: {
        show: true,
        width: 0,
        colors: ["transparent"],
      },
      states: {
        hover: {
          filter: {
            type: "darken",
            value: 1,
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          columnWidth: "100%",
          borderRadiusApplication: "end",
          borderRadius: 6,
          dataLabels: {
            position: "top",
          },
        },
      },    
    };

    const chart = new ApexCharts(el, options);
    chart.render();
  };

  window.addEventListener('load', function () {
    renderHBarChart("hbar-satker", "Jumlah Kegiatan per Satker");
  });