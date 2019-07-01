import { DAY, NIGHT } from './utils.js';

export default function switchTheme(arrayOfCharts, themeButton){
  let color;
  if (getComputedStyle(document.body).backgroundColor == DAY.lead){
    color = NIGHT.lead;
  } else {
    color = DAY.lead;
  }

  document.body.style.backgroundColor = color;
  let chart;
  for (let i = 0; i < arrayOfCharts.length; i++){

    chart = arrayOfCharts[i];
    if (color == DAY.lead){
      chart.div.style.color = NIGHT.lead;

      // if (!chart.checkmark.checked){
      //     chart.checkmark.style.backgroundColor = document.body.style.backgroundColor;
    } else {
      chart.div.style.color = DAY.lead;
      // chart.displayTooltip(window.event); // redraw the tooltip
    }
  }
  if (color === DAY.lead){
    themeButton.innerHTML = "Switch to Night Mode";
  } else {
    themeButton.innerHTML = "Switch to Day Mode";
  }
}
