
const options = {
    colors: ["#1A56DB", "#FDBA8C"],
    series: [
      {
        name: "Dilaksanakan",
        color: "#1A56DB",
        data: [
          { x: "Jakarta Barat", y: 231 },
          { x: "Jakarta Timur", y: 122 },
          { x: "Jakarta Utara", y: 63 },
          { x: "Jakarta Pusat", y: 421 },
          { x: "Jakarta Selatan", y: 122 },
          { x: "Kepulauan Seribu", y: 323 },
          { x: "DKI Jakarta", y: 555 },
        ],
      },
      {
        name: "Selesai",
        color: "#FDBA8C",
        data: [
            { x: "Jakarta Barat", y: 20 },
            { x: "Jakarta Timur", y: 53 },
            { x: "Jakarta Utara", y: 78 },
            { x: "Jakarta Pusat", y: 1 },
            { x: "Jakarta Selatan", y: 58 },
            { x: "Kepulauan Seribu", y: 4 },
            { x: "DKI Jakarta", y: 77 },
        ],
      },
    ],
    chart: {
      type: "bar",
      height: "320px",
      fontFamily: "Inter, sans-serif",
      toolbar: {
        show: false,
      },
    },
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
    states: {
      hover: {
        filter: {
          type: "darken",
          value: 1,
        },
      },
    },
    stroke: {
      show: true,
      width: 0,
      colors: ["transparent"],
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
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    xaxis: {
      floating: false,
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
    yaxis: {
      show: false,
    },
    fill: {
      opacity: 1,
    },
  }
  
  if(document.getElementById("column-chart") && typeof ApexCharts !== 'undefined') {
    const chart = new ApexCharts(document.getElementById("column-chart"), options);
    chart.render();
  }
  