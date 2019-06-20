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
      arrayOfLegacyCharts.push(new Chart(data[i], "Graph "+title));
      title++;
    }
  };

  importData();
})();

// NEW CHARTS initiate each chart; also appends each to arrayOfNewCharts
const arrayOfNewCharts = [];
const chartClasses = {
  1: LineChart,
  2: Line2YChart,
  3: StackedBarChart,
  4: SingleBarChart,
  5: AreaChart
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
  let themeButton;

  let buttonContainer = document.querySelector(".switch-button-container");
  // document.body.appendChild(buttonContainer);
  // buttonContainer.id = "switch-container";

  themeButton = document.createElement("span");
  buttonContainer.appendChild(themeButton);
  // themeButton.type = "a";
  themeButton.className = "switch-button";
  themeButton.innerHTML = "Switch to Day Mode";

  const boundSwitchTheme = switchTheme.bind(this, arrayOfLegacyCharts, arrayOfNewCharts, themeButton);
  themeButton.addEventListener("click", boundSwitchTheme);
  boundSwitchTheme();
}
