/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './views/**/*.{js,ts,jsx,tsx,html,ejs}',
    './public/**/*.{html,js,ejs}',
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100:'#0099dd',
          90:'#11a0df',
          80:'#24a7e2',
          70:'#35aee4',
          60:'#47b5e7',
          50:'#59bde9',
          40:'#6bc4eb',
          30:'#7ccaee',
          20:'#8ed2f0',
          10:'#a0d9f3',
        }, // #002B6A
        secondary: '#75d1ff',
        icon: '#0093dd',
        icondark: '#001d47',
        font: '#003c90',
        fontdark: '#001d47',
        active: '00245a',
      },
    },
  },
  safelist: [
    // class-class penting yang mungkin dipakai oleh simple-datatables
    // 'dataTable-wrapper', 'dataTable-top', 'dataTable-bottom',
    // 'dataTable-container', 'dataTable-table', 'dataTable-sorter',
    // 'dataTable-pagination', 'dataTable-input', 'dataTable-search'
  ],
  plugins: [],
}

