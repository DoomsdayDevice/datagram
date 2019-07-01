import Chart from './Chart.js';

import LineChart from './LineChart.js';
import Line2YChart from './Line2YChart.js';
import StackedBarChart from './StackedBarChart.js';
import SingleBarChart from './SingleBarChart.js';
import AreaChart from './AreaChart.js';

import switchTheme from './switchTheme.js';

const arrayOfCharts = (function initCharts() {
  const arr = [];
  const chartClasses = [
    LineChart,
    Line2YChart,
    StackedBarChart,
    SingleBarChart,
    AreaChart
  ];

  // get the data
  chartClasses.forEach((cls, chartIndex) => {
    const xhr = new XMLHttpRequest();
    const url = `data/${chartIndex + 1}/overview.json`;
    xhr.responseType = 'json';
    xhr.open('GET', url, true);

    xhr.onload = () => {
      arr.push(new cls(xhr.response));
    };
    xhr.send(null);
  });

  return arr;
})();

{
  // On Window Resize
  let documentWidth;
  let documentHeight;
  function onLoad() {
    documentWidth = innerWidth;
    documentHeight = window.screen.height;
  }

  let throttled;
  function onResize() {
    if (
      !throttled &&
      (documentWidth != innerWidth || documentHeight != window.screen.height)
    ) {
      location.reload();
      throttled = true;

      setTimeout(function() {
        throttled = false;
      }, 250);

      documentWidth = innerWidth;
      documentHeight = window.screen.height;
    }
  }

  window.addEventListener('load', onLoad);
  window.addEventListener('resize', onResize);
}

{
  // Switch Theme Button
  const buttonContainer = document.querySelector('.switch-button-container');
  const themeButton = document.createElement('span');
  buttonContainer.appendChild(themeButton);
  themeButton.className = 'switch-button';
  themeButton.innerHTML = 'Switch to Day Mode';

  const boundSwitchTheme = switchTheme.bind(this, arrayOfCharts, themeButton);
  themeButton.addEventListener('click', boundSwitchTheme);
  boundSwitchTheme();
}
