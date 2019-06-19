import Chart from './Chart.js';
import LineChart from './LineChart.js';

import { line2YChart, stackedBarChart, singleBarChart, areaChart } from './charts.js';
import { switchTheme, putThemeButton } from './theme.js';

// LEGACY CHARTS FROM STAGE 1
const arrayOfCharts = [];
// let titleCount = 1;
(function initiateLegacyCharts(){
  let importData = () => {
    let xmlhttp = new XMLHttpRequest();
    let url = "old/chart_data.json";
    xmlhttp.responseType = 'json';
    xmlhttp.open('GET', url, true);
    xmlhttp.onload  = function() {
      createCharts(xmlhttp.response);
    };
    xmlhttp.send(null);
  };
  let createCharts = (data) => {
    let title = 1;
    for (let i = 0; i < data.length; i++){
      arrayOfCharts.push(new Chart(data[i], "Graph "+title));
      title++;
    }
  };

  importData();
})();

// NEW CHARTS initiate each chart; also appends each to arrayOfNewCharts
const arrayOfNewCharts = [];
const chartClasses = {
  1: LineChart,
  2: line2YChart,
  3: stackedBarChart,
  4: singleBarChart,
  5: areaChart
};

function initiateNewCharts(chartNumber){
  let importMainData = () => { // 1
    let xmlhttp = new XMLHttpRequest();
    let url = `data/${chartNumber}/overview.json`;
    xmlhttp.responseType = 'json';
    xmlhttp.open('GET', url, true);
    xmlhttp.onload  = function() {
      createNewCharts(xmlhttp.response);
    };
    xmlhttp.send(null);
  };
  let createNewCharts = (data) => { // 2
    arrayOfNewCharts.push(new chartClasses[chartNumber](data));
  };

  importMainData();
}
for (let c = 1; c <= 5; c++) {
    initiateNewCharts(c);
}

putThemeButton();
switchTheme(arrayOfCharts, arrayOfNewCharts);
