'use strict';
import Chart from './Chart.js';

import LineChart from './LineChart.js';
import Line2YChart from './Line2YChart.js';
import StackedBarChart from './StackedBarChart.js';
import SingleBarChart from './SingleBarChart.js';
import AreaChart  from './AreaChart.js';

import switchTheme from './switchTheme.js';


// LEGACY CHARTS FROM STAGE 1
const arrayOfLegacyCharts = [];
(function initiateLegacyCharts(){
  (function importData() {
    let xhr = new XMLHttpRequest();
    let url = "old/chart_data.json";
    xhr.responseType = 'json';
    xhr.open('GET', url, true);
    xhr.onload  = function() {
      createCharts(xhr.response);
    };
    xhr.send(null);
  })();

  function createCharts(data) {
    let title = 1;
    for (let i = 0; i < data.length; i++){
      arrayOfLegacyCharts.push(new Chart(data[i], "Graph "+title));
      title++;
    }
  };
})();

// NEW CHARTS: initiates each chart, appends each to arrayOfNewCharts
const arrayOfNewCharts = [];
{
  const chartClasses = {
    1: LineChart,
    2: Line2YChart,
    3: StackedBarChart,
    4: SingleBarChart,
    5: AreaChart
  };

  function initiateChart(chartNumber){
    (function importData() { // 1
      let xhr = new XMLHttpRequest();
      let url = `data/${chartNumber}/overview.json`;
      xhr.responseType = 'json';
      xhr.open('GET', url, true);

      xhr.onload = function() {
        createChart(xhr.response);
      };
      xhr.send(null);
    })();

    function createChart(data) { // 2
      arrayOfNewCharts.push(new chartClasses[chartNumber](data));
    };
  }
  for (let c = 1; c <= 5; c++) {
    initiateChart(c);
  }
}

{ // Window Resize
  let documentWidth;
  let documentHeight;
  function onLoad(){
    documentWidth = innerWidth;
    documentHeight = window.screen.height;
  }

  let throttled;
  function onResize(){
    if (!throttled && (documentWidth != innerWidth || documentHeight != window.screen.height)) {
      location.reload();
      throttled = true;

      setTimeout(function() {
        throttled = false;
      }, 250);

      documentWidth = innerWidth;
      documentHeight = window.screen.height;
    }

  }

  window.addEventListener("load", onLoad);
  window.addEventListener("resize", onResize);
}


{ // Switch Them Button
  const buttonContainer = document.querySelector(".switch-button-container");
  const themeButton = document.createElement("span");
  buttonContainer.appendChild(themeButton);
  themeButton.className = "switch-button";
  themeButton.innerHTML = "Switch to Day Mode";

  const boundSwitchTheme = switchTheme.bind(this, arrayOfLegacyCharts, arrayOfNewCharts, themeButton);
  themeButton.addEventListener("click", boundSwitchTheme);
  boundSwitchTheme();
}
